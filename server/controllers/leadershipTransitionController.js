const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");
const Profile = require("../models/Profile");
const PredefinedProfile = require("../models/PredefinedProfile");
const SignupConfig = require("../models/SignupConfig");
const LeadershipTransitionConfig = require("../models/LeadershipTransitionConfig");
const Alumni = require("../models/Alumni");
const { getTeamMemberModel } = require("../models/TeamMember");
const { logActivity } = require("../utils/activityLog");
const { emitLeadershipUpdate, emitTenureEnded } = require("../utils/socketBus");
const mailSender = require("../utils/mailSender");
const { getSessionExpiresAt } = require("../utils/tenureSession");
const {
  promotionExistingUserTemplate,
  promotionNewUserTemplate,
  tenureEndTemplate,
} = require("../mail/templates");
const {
  TEAM_DEPARTMENTS,
  getAllLeadershipPositions,
  findPositionById,
  SOCIETY_ROLES,
  formatPreviousRoleLabel,
} = require("../utils/leadershipPositions");
const { userHasDefaultLeadershipTransitionAccess } = require("../utils/leadershipAccess");

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
    User.find({ accountType: { $in: [...SOCIETY_ROLES, ...TEAM_DEPARTMENTS] } })
      .select("-password")
      .populate("additionalDetails")
      .lean(),
  ]);

  const defaultAllowedUsers = builtinAllowedUsers.filter(
    userHasDefaultLeadershipTransitionAccess
  );

  defaultAllowedUsers.sort((a, b) => {
    const roleDiff =
      (SOCIETY_ROLES.indexOf(a.accountType) + 1 || 99) -
      (SOCIETY_ROLES.indexOf(b.accountType) + 1 || 99);
    if (roleDiff !== 0) return roleDiff;
    const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase();
    const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const builtinIds = new Set(defaultAllowedUsers.map((u) => String(u._id)));
  const allowedUsers = users.filter((u) => !builtinIds.has(String(u._id)));

  return {
    allowedUserIds: config.allowedUserIds.map(String),
    allowedUsers,
    builtinAllowedUsers: defaultAllowedUsers,
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

async function queuePendingPromotionEmail(config, entry) {
  const emailNorm = (entry.email || "").trim().toLowerCase();
  if (!emailNorm) return config;

  const existingIdx = config.pendingPromotionEmails.findIndex(
    (item) => (item.email || "").toLowerCase() === emailNorm
  );

  const payload = {
    emailType: entry.emailType || "promotion",
    name: entry.name || "",
    email: emailNorm,
    previousRole: entry.previousRole || "Member",
    newRole: entry.newRole || "",
    newDepartment: entry.newDepartment || "",
    registered: Boolean(entry.registered),
    personType: entry.personType || "",
    personId: entry.personId || "",
    promotedAt: new Date(),
    tenureDepartment: entry.tenureDepartment || "",
    timeline: entry.timeline || [],
    activityLogCount: entry.activityLogCount || 0,
    activityHighlights: entry.activityHighlights || [],
    tenureStartedAt: entry.tenureStartedAt || null,
    farewellSnapshot: entry.farewellSnapshot || null,
    emailSentAt: entry.emailSentAt || null,
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
    emailType: item.emailType || "promotion",
    name: item.name || "",
    email: item.email || "",
    previousRole: item.previousRole || "",
    newRole: item.newRole || "",
    newDepartment: item.newDepartment || "",
    registered: Boolean(item.registered),
    personType: item.personType || "",
    personId: item.personId || "",
    promotedAt: item.promotedAt,
    tenureDepartment: item.tenureDepartment || "",
    timeline: item.timeline || [],
    activityLogCount: item.activityLogCount || 0,
    activityHighlights: item.activityHighlights || [],
    tenureStartedAt: item.tenureStartedAt,
    emailSentAt: item.emailSentAt || null,
    branch: item.farewellSnapshot?.branch || "",
    year: item.farewellSnapshot?.year || "",
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
  const users = await User.find({ tenureEndedAt: null })
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

    const targetUser = await User.findById(userId)
      .select("-password")
      .populate("additionalDetails")
      .lean();
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (userHasDefaultLeadershipTransitionAccess(targetUser)) {
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

const {
  addPromotionToDraft,
  addEndSessionToDraft,
  serializeSessionForClient,
} = require("../services/leadershipDraftService");

exports.promotePerson = async (req, res) => {
  try {
    const { personType, personId, sourceDepartment, targetPositionId } = req.body;

    if (!personType || !personId || !targetPositionId) {
      return res.status(400).json({
        success: false,
        message: "personType, personId, and targetPositionId are required.",
      });
    }

    const session = await addPromotionToDraft(req.user, {
      personType,
      personId,
      sourceDepartment,
      targetPositionId,
    });

    const data = await buildPeopleList();
    emitLeadershipUpdate({ type: "draft-updated" });

    const lastChange = session.pendingChanges[session.pendingChanges.length - 1];
    return res.status(200).json({
      success: true,
      message: `${lastChange?.personName || "Person"} queued for promotion to ${lastChange?.newRole || "new role"}.`,
      data,
      draft: serializeSessionForClient(session),
    });
  } catch (error) {
    console.error("promotePerson error:", error);
    return res.status(400).json({ success: false, message: error.message });
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

async function collectActivityLogsForPerson(personType, details) {
  if (personType !== "user" || !details.userId) return [];
  const logs = await ActivityLog.find({ userId: details.userId })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return logs.map((log) => ({
    action: log.action,
    category: log.category,
    details: log.details,
    targetId: log.targetId || "",
    targetType: log.targetType || "",
    createdAt: log.createdAt,
  }));
}

function buildActivityHighlights(activityLogs) {
  return (activityLogs || []).slice(0, 12).map((log) => ({
    action: log.action,
    category: log.category,
    when: log.createdAt,
    details: log.details || null,
  }));
}

function buildFarewellEmailPayload(details, roleLabel, oldSignupDepts, activityLogs, registered) {
  const profile = details.profileData || {};
  const department =
    details.currentAccountType ||
    (oldSignupDepts?.length ? oldSignupDepts.join(", ") : "");

  return {
    name: details.name || "",
    email: details.email || "",
    role: roleLabel || "Member",
    department,
    branch: details.branch || profile.branch || "",
    year: details.year || profile.year || profile.yearOfStudy || "",
    section: details.section || profile.section || "",
    nonTechSociety: details.non_tech_society || profile.non_tech_society || "",
    about: profile.about || "",
    contact: details.contact || profile.phoneNumber || "",
    position: details.position || profile.position || "",
    p0: details.p0 || profile.p0 || "",
    p1: details.p1 || profile.p1 || "",
    p2: details.p2 || profile.p2 || "",
    image: details.image || "",
    socials: {
      instagram: details.instaLink || profile.socials?.instagram || "",
      linkedin: details.linkedinLink || profile.socials?.linkedin || "",
      github: profile.socials?.github || "",
    },
    signupDepartments: oldSignupDepts || [],
    timeline: Array.isArray(details.timeline) ? details.timeline : [],
    activityLogCount: (activityLogs || []).length,
    activityHighlights: buildActivityHighlights(activityLogs),
    tenureStartedAt: details.userCreatedAt || details.tenureStartedAt || null,
    tenureEndedAt: new Date(),
    registered: Boolean(registered),
  };
}

function resolveFarewellPayloadFromQueueItem(item, websiteUrl) {
  if (item.farewellSnapshot && typeof item.farewellSnapshot === "object") {
    return { ...item.farewellSnapshot, websiteUrl };
  }

  return {
    name: item.name || item.email,
    email: item.email,
    role: item.previousRole || "Member",
    department: item.tenureDepartment || "",
    timeline: item.timeline || [],
    activityLogCount: item.activityLogCount || 0,
    activityHighlights: item.activityHighlights || [],
    tenureStartedAt: item.tenureStartedAt,
    tenureEndedAt: new Date(),
    websiteUrl,
    registered: Boolean(item.registered),
  };
}

async function sendFarewellEmail(item, websiteUrl) {
  const email = (item.email || "").trim().toLowerCase();
  if (!email) return false;

  const payload = resolveFarewellPayloadFromQueueItem(item, websiteUrl);
  const subject = `A heartfelt farewell – Thank you, ${payload.name || "GFGian"}`;
  const html = tenureEndTemplate(payload);
  return mailSender(email, subject, html);
}

async function archiveToAlumni({
  details,
  personType,
  personId,
  oldSignupDepts,
  activityLogs,
  endedBy,
}) {
  const profile = details.profileData || {};
  const roleLabel = formatPreviousRoleLabel(
    details,
    details.currentAccountType,
    oldSignupDepts
  );

  return Alumni.create({
    email: details.email,
    name: details.name,
    firstName: details.firstName,
    lastName: details.lastName,
    image: details.image,
    contact: details.contact || "",
    accountType: details.currentAccountType || "",
    department: details.currentAccountType || oldSignupDepts?.[0] || "",
    role: roleLabel,
    branch: details.branch || profile.branch || "",
    year: details.year || profile.year || "",
    section: profile.section || "",
    non_tech_society: profile.non_tech_society || "",
    about: profile.about || "",
    position: details.position || profile.position || "",
    p0: details.p0 || profile.p0 || "",
    p1: details.p1 || profile.p1 || "",
    p2: details.p2 || profile.p2 || "",
    timeline: Array.isArray(details.timeline) ? details.timeline : [],
    socials: {
      instagram: details.instaLink || profile.socials?.instagram || "",
      linkedin: details.linkedinLink || profile.socials?.linkedin || "",
      github: profile.socials?.github || "",
    },
    personType,
    originalUserId: details.userId || null,
    originalPersonId: String(personId),
    registered: personType === "user",
    activityLogs,
    activityLogCount: activityLogs.length,
    signupDepartments: oldSignupDepts || [],
    tenureStartedAt: details.userCreatedAt || null,
    tenureEndedAt: new Date(),
    endedBy: endedBy || null,
  });
}

async function purgePersonFromSociety(emailNorm, userId = null) {
  await removeEmailFromAllSignupConfigs(emailNorm);
  await removeTeamMemberByEmail(emailNorm);

  const predefined = await findPredefinedByEmail(emailNorm);
  if (predefined) {
    await PredefinedProfile.findByIdAndDelete(predefined._id);
  }

  if (userId) {
    const config = await getOrCreateConfig();
    const idStr = String(userId);
    if (config.allowedUserIds.some((id) => String(id) === idStr)) {
      config.allowedUserIds = config.allowedUserIds.filter((id) => String(id) !== idStr);
      await config.save();
    }
  }
}

exports.endSession = async (req, res) => {
  try {
    const { personType, personId, sourceDepartment } = req.body;

    if (!personType || !personId) {
      return res.status(400).json({
        success: false,
        message: "personType and personId are required.",
      });
    }

    const session = await addEndSessionToDraft(req.user, {
      personType,
      personId,
      sourceDepartment,
    });

    const data = await buildPeopleList();
    emitLeadershipUpdate({ type: "draft-updated" });

    const lastChange = session.pendingChanges[session.pendingChanges.length - 1];
    return res.status(200).json({
      success: true,
      message: `${lastChange?.personName || "Person"} queued for session end.`,
      data,
      draft: serializeSessionForClient(session),
    });
  } catch (error) {
    console.error("endSession error:", error);
    return res.status(400).json({ success: false, message: error.message });
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
        message: "No emails are queued.",
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

      const emailType = item.emailType || "promotion";

      if (emailType === "end_session") {
        if (item.emailSentAt) {
          sent += 1;
          results.push({
            email,
            success: true,
            emailType: "end_session",
            message: "Farewell email already sent",
          });
          continue;
        }

        const mailResult = await sendFarewellEmail(item, websiteUrl);
        if (mailResult) {
          sent += 1;
          results.push({ email, success: true, emailType: "end_session" });
        } else {
          failed += 1;
          results.push({
            email,
            success: false,
            emailType: "end_session",
            message: "Email delivery failed or mail is not configured.",
          });
        }
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
        results.push({ email, success: true, emailType: "promotion" });
      } else {
        failed += 1;
        results.push({
          email,
          success: false,
          emailType: "promotion",
          message: "Email delivery failed or mail is not configured.",
        });
      }
    }

    config.pendingPromotionEmails = [];
    await config.save();

    if (req.user?.id) {
      await logActivity(
        req.user.id,
        "leadership_emails_sent",
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
          : `Successfully sent ${sent} email(s).`,
      data: { sent, failed, results },
    });
  } catch (error) {
    console.error("sendPendingPromotionEmails error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.buildPeopleList = buildPeopleList;
