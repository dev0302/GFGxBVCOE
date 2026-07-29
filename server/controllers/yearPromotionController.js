const User = require("../models/User");
const Profile = require("../models/Profile");
const PredefinedProfile = require("../models/PredefinedProfile");
const YearPromotionSession = require("../models/YearPromotionSession");
const { getTeamMemberModel } = require("../models/TeamMember");
const { logActivity } = require("../utils/activityLog");
const { promoteYear, getProfileYear, normalizeYear } = require("../utils/yearPromotion");

const SOCIETY_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson"];

const TEAM_DEPARTMENTS = [
  "Social Media and Promotion",
  "Technical",
  "Event Management",
  "Public Relation and Outreach",
  "Design and Creative",
  "Content and Documentation",
  "Capture The Event",
  "Sponsorship and Marketing",
  "Treasurer",
];

function requireSocietyRole(req, res) {
  if (!SOCIETY_ROLES.includes(req.user?.accountType)) {
    res.status(403).json({
      success: false,
      message: "Only society roles can manage year promotions.",
    });
    return false;
  }
  return true;
}

async function getActor(req) {
  const user = await User.findById(req.user.id)
    .select("firstName lastName email")
    .lean();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "Unknown";
  return {
    userId: String(req.user.id),
    name,
    email: user?.email || "",
  };
}

function buildSummaryKey(oldYear, newYear) {
  const from = normalizeYear(oldYear) || oldYear || "unknown";
  const to = normalizeYear(newYear) || newYear || "unknown";
  return `${from}->${to}`;
}

async function collectAndApplyPromotions() {
  const changes = [];
  const summary = {};

  const users = await User.find({ additionalDetails: { $ne: null } })
    .select("email firstName lastName additionalDetails")
    .populate("additionalDetails")
    .lean();

  for (const user of users) {
    const profile = user.additionalDetails;
    if (!profile?._id) continue;
    const current = getProfileYear(profile);
    const next = promoteYear(current);
    if (!next || next === normalizeYear(current)) continue;

    await Profile.findByIdAndUpdate(profile._id, {
      year: next,
      yearOfStudy: next,
    });

    const key = buildSummaryKey(current, next);
    summary[key] = (summary[key] || 0) + 1;

    changes.push({
      source: "profile",
      entityId: String(profile._id),
      email: user.email || "",
      name: [user.firstName, user.lastName].filter(Boolean).join(" ").trim(),
      oldYear: profile.year || "",
      newYear: next,
      oldYearOfStudy: profile.yearOfStudy || "",
      newYearOfStudy: next,
    });
  }

  const predefinedProfiles = await PredefinedProfile.find({}).lean();
  for (const pre of predefinedProfiles) {
    const current = pre.year || "";
    const next = promoteYear(current);
    if (!next || next === normalizeYear(current)) continue;

    await PredefinedProfile.findByIdAndUpdate(pre._id, { year: next });

    const key = buildSummaryKey(current, next);
    summary[key] = (summary[key] || 0) + 1;

    changes.push({
      source: "predefined",
      entityId: String(pre._id),
      email: pre.email || "",
      name: pre.name || "",
      oldYear: pre.year || "",
      newYear: next,
    });
  }

  for (const dept of TEAM_DEPARTMENTS) {
    const Model = getTeamMemberModel(dept);
    const members = await Model.find({}).lean();
    for (const member of members) {
      const current = member.year || "";
      const next = promoteYear(current);
      if (!next || next === normalizeYear(current)) continue;

      await Model.findByIdAndUpdate(member._id, { year: next });

      const key = buildSummaryKey(current, next);
      summary[key] = (summary[key] || 0) + 1;

      changes.push({
        source: "teamMember",
        entityId: String(member._id),
        department: dept,
        email: member.email || "",
        name: member.name || "",
        oldYear: member.year || "",
        newYear: next,
      });
    }
  }

  return { changes, summary };
}

async function revertChanges(changes) {
  for (const change of changes) {
    if (change.source === "profile") {
      await Profile.findByIdAndUpdate(change.entityId, {
        year: change.oldYear || null,
        yearOfStudy: change.oldYearOfStudy || null,
      });
      continue;
    }
    if (change.source === "predefined") {
      await PredefinedProfile.findByIdAndUpdate(change.entityId, {
        year: change.oldYear || "",
      });
      continue;
    }
    if (change.source === "teamMember" && change.department) {
      const Model = getTeamMemberModel(change.department);
      await Model.findByIdAndUpdate(change.entityId, {
        year: change.oldYear || "",
      });
    }
  }
}

exports.applyNextSession = async (req, res) => {
  try {
    if (!requireSocietyRole(req, res)) return;

    const { changes, summary } = await collectAndApplyPromotions();
    if (changes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No members with a promotable year were found.",
      });
    }

    const appliedBy = await getActor(req);
    const session = await YearPromotionSession.create({
      appliedBy,
      totalUpdated: changes.length,
      summary,
      changes,
    });

    await logActivity(
      req.user.id,
      "year_promotion_apply",
      "society",
      {
        sessionId: String(session._id),
        totalUpdated: changes.length,
      },
      String(session._id),
      "YearPromotionSession"
    );

    return res.status(200).json({
      success: true,
      message: `Updated year for ${changes.length} member${changes.length === 1 ? "" : "s"}.`,
      data: session,
    });
  } catch (error) {
    console.error("applyNextSession error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to apply next session changes.",
    });
  }
};

exports.getYearPromotionHistory = async (req, res) => {
  try {
    if (!requireSocietyRole(req, res)) return;

    const sessions = await YearPromotionSession.find({})
      .sort({ appliedAt: -1 })
      .lean();

    const latestActive = sessions.find((s) => s.status === "active") || null;

    return res.status(200).json({
      success: true,
      data: sessions,
      latestActiveId: latestActive ? String(latestActive._id) : null,
    });
  } catch (error) {
    console.error("getYearPromotionHistory error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch promotion history.",
    });
  }
};

exports.revertYearPromotion = async (req, res) => {
  try {
    if (!requireSocietyRole(req, res)) return;

    const { id } = req.params;
    const session = await YearPromotionSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Promotion session not found.",
      });
    }
    if (session.status === "reverted") {
      return res.status(400).json({
        success: false,
        message: "This promotion has already been reverted.",
      });
    }

    const latestActive = await YearPromotionSession.findOne({ status: "active" })
      .sort({ appliedAt: -1 })
      .select("_id")
      .lean();
    if (!latestActive || String(latestActive._id) !== String(session._id)) {
      return res.status(400).json({
        success: false,
        message: "Only the most recent active promotion can be reverted.",
      });
    }

    await revertChanges(session.changes);

    const revertedBy = await getActor(req);
    session.status = "reverted";
    session.revertedBy = revertedBy;
    session.revertedAt = new Date();
    await session.save();

    await logActivity(
      req.user.id,
      "year_promotion_revert",
      "society",
      {
        sessionId: String(session._id),
        totalUpdated: session.totalUpdated,
      },
      String(session._id),
      "YearPromotionSession"
    );

    return res.status(200).json({
      success: true,
      message: `Reverted year changes for ${session.totalUpdated} member${session.totalUpdated === 1 ? "" : "s"}.`,
      data: session,
    });
  } catch (error) {
    console.error("revertYearPromotion error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to revert promotion.",
    });
  }
};
