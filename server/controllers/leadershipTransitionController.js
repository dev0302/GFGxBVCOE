const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");
const Profile = require("../models/Profile");
const PredefinedProfile = require("../models/PredefinedProfile");
const SignupConfig = require("../models/SignupConfig");
const LeadershipTransitionConfig = require("../models/LeadershipTransitionConfig");
const { getTeamMemberModel } = require("../models/TeamMember");
const { logActivity } = require("../utils/activityLog");
const { emitLeadershipUpdate } = require("../utils/socketBus");
const mailSender = require("../utils/mailSender");
const {
  promotionExistingUserTemplate,
  promotionNewUserTemplate,
} = require("../mail/templates");
const {
  TEAM_DEPARTMENTS,
  getAllLeadershipPositions,
  findPositionById,
  SOCIETY_ROLES,
} = require("../utils/leadershipPositions");

const ALL_SIGNUP_DEPARTMENTS = [
  "ADMIN",
  "Chairperson",
  "Vice-Chairperson",
  ...TEAM_DEPARTMENTS,
];

async function buildConfigResponse(config) {
  const [users, builtinAllowedUsers] = await Promise.all([
    User.find({ _id: { $in: config.allowedUserIds } })
      .select("-password")
      .populate("additionalDetails")
      .lean(),
    User.find({ accountType: { $in: SOCIETY_ROLES } }).select("-password").lean(),
  ]);

  builtinAllowedUsers.sort((a, b) => {
    const roleDiff =
      SOCIETY_ROLES.indexOf(a.accountType) - SOCIETY_ROLES.indexOf(b.accountType);
    if (roleDiff !== 0) return roleDiff;
    const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase();
    const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const builtinIds = new Set(builtinAllowedUsers.map((u) => String(u._id)));
  const allowedUsers = users.filter((u) => !builtinIds.has(String(u._id)));

  return {
    allowedUserIds: config.allowedUserIds.map(String),
    allowedUsers,
    builtinAllowedUsers,
  };
}

async function getOrCreateConfig() {
  let config = await LeadershipTransitionConfig.findOne();
  if (!config) {
    config = await LeadershipTransitionConfig.create({
      allowedUserIds: [],
      pendingPromotionEmails: [],
    });
  }
  return config;
}

function getFrontendBaseUrl(req) {
  return (
    process.env.FRONTEND_URL ||
    req?.get?.("origin") ||
    req?.get?.("referer")?.replace(/\/[^/]*$/, "") ||
    "https://gfg-bvcoe.vercel.app"
  ).replace(/\/$/, "");
}

function formatPreviousRoleLabel(details, oldAccountType, oldSignupDepts) {
  const position = details?.position?.trim();
  if (position && position !== "Member") return position;
  if (oldAccountType) return oldAccountType;
  if (oldSignupDepts?.length) return oldSignupDepts.join(", ");
  return "Member";
}

async function queuePendingPromotionEmail(config, entry) {
  const emailNorm = (entry.email || "").trim().toLowerCase();
  if (!emailNorm) return config;

  const existingIdx = config.pendingPromotionEmails.findIndex(
    (item) => (item.email || "").toLowerCase() === emailNorm
  );

  const payload = {
    name: entry.name || "",
    email: emailNorm,
    previousRole: entry.previousRole || "Member",
    newRole: entry.newRole,
    newDepartment: entry.newDepartment || "",
    registered: Boolean(entry.registered),
    personType: entry.personType || "",
    personId: entry.personId || "",
    promotedAt: new Date(),
  };

  if (existingIdx >= 0) {
    config.pendingPromotionEmails.splice(existingIdx, 1, payload);
  } else {
    config.pendingPromotionEmails.push(payload);
  }

  await config.save();
  return config;
}

function serializePendingEmails(config) {
  return (config.pendingPromotionEmails || []).map((item) => ({
    id: String(item._id),
    name: item.name || "",
    email: item.email || "",
    previousRole: item.previousRole || "",
    newRole: item.newRole || "",
    newDepartment: item.newDepartment || "",
    registered: Boolean(item.registered),
    personType: item.personType || "",
    personId: item.personId || "",
    promotedAt: item.promotedAt,
  }));
}

async function findPredefinedByEmail(email) {
  const trimmed = (email || "").trim();
  if (!trimmed) return null;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return PredefinedProfile.findOne({
    email: { $regex: new RegExp(`^${escaped}$`, "i") },
  });
}

async function findSignupDepartmentsForEmail(emailNorm) {
  const configs = await SignupConfig.find({ allowedEmails: emailNorm }).lean();
  return configs.map((c) => c.department);
}

async function removeEmailFromSignupConfig(department, emailNorm) {
  const config = await SignupConfig.findOne({ department });
  if (!config) return;
  config.allowedEmails = config.allowedEmails.filter((e) => e !== emailNorm);
  await config.save();
}

async function removeEmailFromAllSignupConfigs(emailNorm, exceptDepartment = null) {
  const configs = await SignupConfig.find({ allowedEmails: emailNorm });
  for (const config of configs) {
    if (exceptDepartment && config.department === exceptDepartment) continue;
    config.allowedEmails = config.allowedEmails.filter((e) => e !== emailNorm);
    await config.save();
  }
}

async function addEmailToSignupConfig(department, emailNorm) {
  if (!ALL_SIGNUP_DEPARTMENTS.includes(department)) {
    throw new Error("Invalid department for signup config.");
  }
  let config = await SignupConfig.findOne({ department });
  if (!config) {
    config = await SignupConfig.create({ department, allowedEmails: [] });
  }
  if (!config.allowedEmails.includes(emailNorm)) {
    config.allowedEmails.push(emailNorm);
    await config.save();
  }
}

async function removeTeamMemberByEmail(emailNorm, departmentHint = null) {
  const departments = departmentHint ? [departmentHint] : TEAM_DEPARTMENTS;
  for (const dept of departments) {
    const Model = getTeamMemberModel(dept);
    const member = await Model.findOne({ email: emailNorm });
    if (member) {
      await Model.findByIdAndDelete(member._id);
      return { removed: true, department: dept, memberId: member._id };
    }
  }
  return { removed: false };
}

function extractPersonDetails(personType, data, sourceDepartment) {
  if (personType === "user") {
    const profile = data.additionalDetails || {};
    return {
      email: (data.email || "").trim().toLowerCase(),
      name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      image: data.image || "",
      branch: profile.branch || "",
      year: profile.year || profile.yearOfStudy || "",
      position: profile.position || "",
      p0: profile.p0 || "",
      p1: profile.p1 || "",
      p2: profile.p2 || "",
      instaLink: profile.socials?.instagram || "",
      linkedinLink: profile.socials?.linkedin || "",
      timeline: profile.timeline || [],
      currentAccountType: data.accountType || "",
      userId: data._id,
    };
  }

  if (personType === "predefinedOnly") {
    return {
      email: (data.email || "").trim().toLowerCase(),
      name: data.name || "",
      firstName: (data.name || "").trim().split(/\s+/)[0] || "",
      lastName: (data.name || "").trim().split(/\s+/).slice(1).join(" ") || "",
      image: data.image || "",
      branch: data.branch || "",
      year: data.year || "",
      position: data.position || "",
      p0: data.p0 || "",
      p1: data.p1 || "",
      p2: data.p2 || "",
      instaLink: data.instaLink || "",
      linkedinLink: data.linkedinLink || "",
      timeline: data.timeline || [],
      currentAccountType: "",
      predefinedId: data._id,
    };
  }

  if (personType === "teamMember") {
    return {
      email: (data.email || "").trim().toLowerCase(),
      name: data.name || "",
      firstName: (data.name || "").trim().split(/\s+/)[0] || "",
      lastName: (data.name || "").trim().split(/\s+/).slice(1).join(" ") || "",
      image: data.photo || "",
      branch: data.branch || "",
      year: data.year || "",
      position: "",
      p0: "",
      p1: "",
      p2: "",
      instaLink: "",
      linkedinLink: "",
      timeline: [],
      currentAccountType: sourceDepartment || "",
      teamMemberId: data._id,
      sourceDepartment,
    };
  }

  return null;
}

async function upsertPredefinedProfile(details, positionTitle) {
  const emailNorm = details.email;
  if (!emailNorm) throw new Error("Email is required for predefined profile.");

  const update = {
    name: details.name || `${details.firstName} ${details.lastName}`.trim(),
    branch: details.branch || "",
    year: details.year || "",
    position: positionTitle,
    p0: positionTitle,
    p1: details.p1 || "",
    p2: details.p2 || "",
    image: details.image || "",
    instaLink: details.instaLink || "",
    linkedinLink: details.linkedinLink || "",
    timeline: Array.isArray(details.timeline) ? details.timeline : [],
  };

  let doc = await findPredefinedByEmail(emailNorm);
  if (doc) {
    Object.assign(doc, update);
    await doc.save();
    return doc;
  }

  return PredefinedProfile.create({ email: emailNorm, ...update });
}

async function buildPeopleList() {
  const users = await User.find({})
    .select("-password")
    .populate("additionalDetails")
    .sort({ createdAt: -1 })
    .lean();

  const teamMembers = [];
  for (const dept of TEAM_DEPARTMENTS) {
    const Model = getTeamMemberModel(dept);
    const members = await Model.find({}).sort({ createdAt: -1 }).lean();
    for (const m of members) {
      teamMembers.push({ type: "teamMember", data: m, department: dept });
    }
  }

  const signupConfigs = await SignupConfig.find({}).lean();
  const emailToDepts = new Map();
  for (const cfg of signupConfigs) {
    for (const email of cfg.allowedEmails || []) {
      const norm = (email || "").toLowerCase();
      if (!norm) continue;
      if (!emailToDepts.has(norm)) emailToDepts.set(norm, []);
      emailToDepts.get(norm).push(cfg.department);
    }
  }

  const list = [
    ...users.map((u) => {
      const email = (u.email || "").toLowerCase();
      return {
        type: "user",
        id: String(u._id),
        email,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
        image: u.image || "",
        accountType: u.accountType || "",
        position:
          u.additionalDetails?.position ||
          u.additionalDetails?.p0 ||
          u.accountType ||
          "",
        signupDepartments: emailToDepts.get(email) || [],
        registered: true,
        data: u,
      };
    }),
    ...teamMembers.map(({ data: m, department }) => {
      const email = (m.email || "").toLowerCase();
      return {
        type: "teamMember",
        id: String(m._id),
        email,
        name: m.name || "",
        image: m.photo || "",
        accountType: department,
        position: "Member",
        signupDepartments: emailToDepts.get(email) || [],
        registered: false,
        sourceDepartment: department,
        data: m,
      };
    }),
  ];

  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

exports.getPositions = async (_req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: getAllLeadershipPositions(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPeople = async (_req, res) => {
  try {
    const data = await buildPeopleList();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("getPeople error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getConfig = async (_req, res) => {
  try {
    const config = await getOrCreateConfig();
    const data = await buildConfigResponse(config);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getConfig error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addAllowedUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required." });
    }

    const targetUser = await User.findById(userId).select("-password").lean();
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (SOCIETY_ROLES.includes(targetUser.accountType)) {
      return res.status(400).json({
        success: false,
        message: "This user already has access through their role.",
      });
    }

    const config = await getOrCreateConfig();
    const idStr = String(userId);
    if (config.allowedUserIds.some((id) => String(id) === idStr)) {
      return res.status(400).json({ success: false, message: "User already allowed." });
    }

    config.allowedUserIds.push(userId);
    await config.save();

    if (req.user?.id) {
      await logActivity(
        req.user.id,
        "leadership_allowed_add",
        "leadership_transition",
        {
          userId: idStr,
          email: targetUser.email,
          name: `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim(),
        },
        idStr,
        "LeadershipTransitionConfig"
      );
    }

    emitLeadershipUpdate({ type: "config-updated" });

    const data = await buildConfigResponse(config);

    return res.status(200).json({
      success: true,
      message: "User added.",
      data,
    });
  } catch (error) {
    console.error("addAllowedUser error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeAllowedUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required." });
    }

    const targetUser = await User.findById(userId).select("email firstName lastName").lean();

    const config = await getOrCreateConfig();
    const idStr = String(userId);
    config.allowedUserIds = config.allowedUserIds.filter((id) => String(id) !== idStr);
    await config.save();

    if (req.user?.id) {
      await logActivity(
        req.user.id,
        "leadership_allowed_remove",
        "leadership_transition",
        {
          userId: idStr,
          email: targetUser?.email || "",
          name: targetUser
            ? `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim()
            : "",
        },
        idStr,
        "LeadershipTransitionConfig"
      );
    }

    emitLeadershipUpdate({ type: "config-updated" });

    const data = await buildConfigResponse(config);

    return res.status(200).json({
      success: true,
      message: "User removed.",
      data,
    });
  } catch (error) {
    console.error("removeAllowedUser error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.promotePerson = async (req, res) => {
  try {
    const { personType, personId, sourceDepartment, targetPositionId } = req.body;

    if (!personType || !personId || !targetPositionId) {
      return res.status(400).json({
        success: false,
        message: "personType, personId, and targetPositionId are required.",
      });
    }

    const position = findPositionById(targetPositionId);
    if (!position) {
      return res.status(400).json({ success: false, message: "Invalid target position." });
    }

    let rawData = null;
    if (personType === "user") {
      rawData = await User.findById(personId).populate("additionalDetails").lean();
    } else if (personType === "predefinedOnly") {
      rawData = await PredefinedProfile.findById(personId).lean();
    } else if (personType === "teamMember") {
      const dept = sourceDepartment;
      if (!dept || !TEAM_DEPARTMENTS.includes(dept)) {
        return res.status(400).json({
          success: false,
          message: "sourceDepartment is required for team members.",
        });
      }
      const Model = getTeamMemberModel(dept);
      rawData = await Model.findById(personId).lean();
    } else {
      return res.status(400).json({ success: false, message: "Invalid personType." });
    }

    if (!rawData) {
      return res.status(404).json({ success: false, message: "Person not found." });
    }

    const details = extractPersonDetails(personType, rawData, sourceDepartment);
    if (!details?.email) {
      return res.status(400).json({
        success: false,
        message: "Person must have an email for leadership transition.",
      });
    }

    const emailNorm = details.email;
    const newDept = position.accountType;
    const positionTitle = position.positionTitle;
    const oldSignupDepts = await findSignupDepartmentsForEmail(emailNorm);
    const oldAccountType = details.currentAccountType || "";
    const isCoreRoleChange =
      ["Chairperson", "Vice-Chairperson"].includes(newDept) ||
      ["Chairperson", "Vice-Chairperson"].includes(oldAccountType);
    const sameDepartment =
      !isCoreRoleChange &&
      personType !== "teamMember" &&
      ((personType === "user" && oldAccountType === newDept) ||
        (personType === "predefinedOnly" && oldSignupDepts.includes(newDept)));

    if (sameDepartment) {
      if (personType === "user") {
        const userDoc = await User.findById(personId).populate("additionalDetails");
        if (userDoc?.additionalDetails) {
          userDoc.additionalDetails.position = positionTitle;
          userDoc.additionalDetails.p0 = positionTitle;
          await userDoc.additionalDetails.save();
        }
      } else {
        // Not registered yet — store details in PredefinedProfile for signup autofill.
        await upsertPredefinedProfile(details, positionTitle);
      }
    } else {
      await removeEmailFromAllSignupConfigs(emailNorm, newDept);
      await addEmailToSignupConfig(newDept, emailNorm);

      if (personType === "user") {
        const userDoc = await User.findById(personId).populate("additionalDetails");
        if (userDoc) {
          userDoc.accountType = newDept;
          await userDoc.save();
          if (userDoc.additionalDetails) {
            userDoc.additionalDetails.position = positionTitle;
            userDoc.additionalDetails.p0 = positionTitle;
            await userDoc.additionalDetails.save();
          } else {
            const profile = await Profile.create({
              position: positionTitle,
              p0: positionTitle,
            });
            userDoc.additionalDetails = profile._id;
            await userDoc.save();
          }
        }
      } else {
        // Not registered yet — store details in PredefinedProfile for signup autofill.
        await upsertPredefinedProfile(
          { ...details, position: positionTitle, p0: positionTitle },
          positionTitle
        );
      }

      if (personType === "teamMember") {
        await removeTeamMemberByEmail(emailNorm, sourceDepartment);
      } else {
        await removeTeamMemberByEmail(emailNorm);
      }
    }

    if (req.user?.id) {
      await logActivity(
        req.user.id,
        "leadership_promote",
        "leadership_transition",
        {
          email: emailNorm,
          name: details.name,
          from: oldAccountType || oldSignupDepts.join(", "),
          to: positionTitle,
          personType,
        },
        personId,
        "LeadershipTransition"
      );
    }

    const config = await getOrCreateConfig();
    const previousRoleLabel = formatPreviousRoleLabel(
      details,
      oldAccountType,
      oldSignupDepts
    );
    await queuePendingPromotionEmail(config, {
      name: details.name || emailNorm,
      email: emailNorm,
      previousRole: previousRoleLabel,
      newRole: positionTitle,
      newDepartment: newDept,
      registered: personType === "user",
      personType,
      personId: String(personId),
    });

    const data = await buildPeopleList();
    const pendingEmails = serializePendingEmails(config);
    emitLeadershipUpdate({
      type: "promotion",
      email: emailNorm,
      position: positionTitle,
      pendingEmailCount: pendingEmails.length,
    });

    return res.status(200).json({
      success: true,
      message: `${details.name || emailNorm} promoted to ${positionTitle}.`,
      data,
      pendingEmailCount: pendingEmails.length,
    });
  } catch (error) {
    console.error("promotePerson error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ category: "leadership_transition" })
      .sort({ createdAt: -1 })
      .limit(300)
      .populate("userId", "firstName lastName email image accountType")
      .lean();

    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("getHistory error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingPromotionEmails = async (_req, res) => {
  try {
    const config = await getOrCreateConfig();
    const data = serializePendingEmails(config);
    return res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("getPendingPromotionEmails error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendPendingPromotionEmails = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    const pending = config.pendingPromotionEmails || [];

    if (!pending.length) {
      return res.status(400).json({
        success: false,
        message: "No promotion emails are queued.",
      });
    }

    const baseUrl = getFrontendBaseUrl(req);
    const websiteUrl = baseUrl;
    const signupLink = `${baseUrl}/signup`;

    const results = [];
    let sent = 0;
    let failed = 0;

    for (const item of pending) {
      const email = (item.email || "").trim().toLowerCase();
      if (!email) {
        failed += 1;
        results.push({ email: "", success: false, message: "Missing email" });
        continue;
      }

      const payload = {
        name: item.name || email,
        email,
        previousRole: item.previousRole || "Member",
        newRole: item.newRole || "",
        newDepartment: item.newDepartment || "",
        websiteUrl,
        signupLink,
      };

      const subject = item.registered
        ? `Congratulations on your promotion – ${item.newRole}`
        : `Welcome to GFG leadership – sign up as ${item.newRole}`;

      const html = item.registered
        ? promotionExistingUserTemplate(payload)
        : promotionNewUserTemplate(payload);

      const mailResult = await mailSender(email, subject, html);
      if (mailResult) {
        sent += 1;
        results.push({ email, success: true });
      } else {
        failed += 1;
        results.push({
          email,
          success: false,
          message: "Email delivery failed or mail is not configured.",
        });
      }
    }

    config.pendingPromotionEmails = [];
    await config.save();

    if (req.user?.id) {
      await logActivity(
        req.user.id,
        "leadership_promotion_emails_sent",
        "leadership_transition",
        { sent, failed, total: pending.length },
        null,
        "LeadershipTransition"
      );
    }

    emitLeadershipUpdate({ type: "pending-emails-sent", pendingEmailCount: 0 });

    return res.status(200).json({
      success: true,
      message:
        failed > 0
          ? `Sent ${sent} email(s). ${failed} failed.`
          : `Successfully sent ${sent} promotion email(s).`,
      data: { sent, failed, results },
    });
  } catch (error) {
    console.error("sendPendingPromotionEmails error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
