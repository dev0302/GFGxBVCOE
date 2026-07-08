const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");
const Profile = require("../models/Profile");
const PredefinedProfile = require("../models/PredefinedProfile");
const SignupConfig = require("../models/SignupConfig");
const LeadershipTransitionConfig = require("../models/LeadershipTransitionConfig");
const Alumni = require("../models/Alumni");
const { getTeamMemberModel } = require("../models/TeamMember");
const { logActivity } = require("../utils/activityLog");
const { emitTenureEnded } = require("../utils/socketBus");
const { getSessionExpiresAt } = require("../utils/tenureSession");
const {
  TEAM_DEPARTMENTS,
  findPositionById,
  formatPreviousRoleLabel,
} = require("../utils/leadershipPositions");

const ALL_SIGNUP_DEPARTMENTS = [
  "ADMIN",
  "Chairperson",
  "Vice-Chairperson",
  ...TEAM_DEPARTMENTS,
];

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

async function archiveToAlumni({ details, personType, personId, oldSignupDepts, activityLogs, endedBy }) {
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

async function loadPersonRaw(personType, personId, sourceDepartment) {
  if (personType === "user") {
    return User.findById(personId).populate("additionalDetails").lean();
  }
  if (personType === "predefinedOnly") {
    return PredefinedProfile.findById(personId).lean();
  }
  if (personType === "teamMember") {
    const dept = sourceDepartment;
    if (!dept || !TEAM_DEPARTMENTS.includes(dept)) {
      throw new Error("sourceDepartment is required for team members.");
    }
    const Model = getTeamMemberModel(dept);
    return Model.findById(personId).lean();
  }
  throw new Error("Invalid personType.");
}

async function buildPromotionPreview({ personType, personId, sourceDepartment, targetPositionId }) {
  const position = findPositionById(targetPositionId);
  if (!position) throw new Error("Invalid target position.");

  const rawData = await loadPersonRaw(personType, personId, sourceDepartment);
  if (!rawData) throw new Error("Person not found.");

  const details = extractPersonDetails(personType, rawData, sourceDepartment);
  if (!details?.email) throw new Error("Person must have an email.");

  const oldSignupDepts = await findSignupDepartmentsForEmail(details.email);
  const oldAccountType = details.currentAccountType || "";
  const previousRoleLabel = formatPreviousRoleLabel(details, oldAccountType, oldSignupDepts);

  const isDeptTransfer =
    personType !== "teamMember" &&
    oldAccountType &&
    oldAccountType !== position.accountType &&
    TEAM_DEPARTMENTS.includes(oldAccountType) &&
    TEAM_DEPARTMENTS.includes(position.accountType);

  const isCoreChange =
    ["Chairperson", "Vice-Chairperson"].includes(position.accountType) ||
    ["Chairperson", "Vice-Chairperson"].includes(oldAccountType);

  let changeType = "promotion";
  if (isDeptTransfer) changeType = "department_transfer";
  else if (isCoreChange) changeType = "role_change";

  return {
    changeType,
    personType,
    personId: String(personId),
    sourceDepartment: sourceDepartment || "",
    targetPositionId,
    personName: details.name || details.email,
    personEmail: details.email,
    personImage: details.image || "",
    previousRole: previousRoleLabel,
    newRole: position.positionTitle,
    newDepartment: position.accountType,
    previousDepartment: oldAccountType || oldSignupDepts[0] || "",
    position,
    details,
  };
}

async function buildEndSessionPreview({ personType, personId, sourceDepartment }) {
  const rawData = await loadPersonRaw(personType, personId, sourceDepartment);
  if (!rawData) throw new Error("Person not found.");

  if (personType === "user" && rawData.tenureEndedAt) {
    throw new Error("This person's tenure has already ended.");
  }

  const details = extractPersonDetails(personType, rawData, sourceDepartment);
  if (!details?.email) throw new Error("Person must have an email.");

  const oldSignupDepts = await findSignupDepartmentsForEmail(details.email);
  const roleLabel = formatPreviousRoleLabel(
    details,
    details.currentAccountType,
    oldSignupDepts
  );

  return {
    changeType: "end_session",
    personType,
    personId: String(personId),
    sourceDepartment: sourceDepartment || "",
    personName: details.name || details.email,
    personEmail: details.email,
    personImage: details.image || "",
    previousRole: roleLabel,
    previousDepartment: details.currentAccountType || oldSignupDepts.join(", "),
  };
}

async function applyPromotionChange(change, actorUserId) {
  const position = findPositionById(change.targetPositionId);
  if (!position) throw new Error("Invalid target position.");

  const rawData = await loadPersonRaw(
    change.personType,
    change.personId,
    change.sourceDepartment
  );
  if (!rawData) throw new Error("Person not found.");

  const details = extractPersonDetails(change.personType, rawData, change.sourceDepartment);
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
    change.personType !== "teamMember" &&
    ((change.personType === "user" && oldAccountType === newDept) ||
      (change.personType === "predefinedOnly" && oldSignupDepts.includes(newDept)));

  if (sameDepartment) {
    if (change.personType === "user") {
      const userDoc = await User.findById(change.personId).populate("additionalDetails");
      if (userDoc?.additionalDetails) {
        userDoc.additionalDetails.position = positionTitle;
        userDoc.additionalDetails.p0 = positionTitle;
        await userDoc.additionalDetails.save();
      }
    } else {
      await upsertPredefinedProfile(details, positionTitle);
    }
  } else {
    await removeEmailFromAllSignupConfigs(emailNorm, newDept);
    await addEmailToSignupConfig(newDept, emailNorm);

    if (change.personType === "user") {
      const userDoc = await User.findById(change.personId).populate("additionalDetails");
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
      await upsertPredefinedProfile(
        { ...details, position: positionTitle, p0: positionTitle },
        positionTitle
      );
    }

    if (change.personType === "teamMember") {
      await removeTeamMemberByEmail(emailNorm, change.sourceDepartment);
    } else {
      await removeTeamMemberByEmail(emailNorm);
    }
  }

  const previousRoleLabel = formatPreviousRoleLabel(details, oldAccountType, oldSignupDepts);

  if (actorUserId) {
    await logActivity(
      actorUserId,
      "leadership_promote",
      "leadership_transition",
      {
        email: emailNorm,
        name: details.name,
        from: previousRoleLabel,
        to: positionTitle,
        personType: change.personType,
        draftSessionId: change.draftSessionId || "",
      },
      change.personId,
      "LeadershipTransition"
    );
  }

  return {
    emailType: "promotion",
    name: details.name || emailNorm,
    email: emailNorm,
    previousRole: previousRoleLabel,
    newRole: positionTitle,
    newDepartment: newDept,
    registered: change.personType === "user",
    personType: change.personType,
    personId: String(change.personId),
  };
}

async function applyEndSessionChange(change, actorUserId) {
  const rawData = await loadPersonRaw(
    change.personType,
    change.personId,
    change.sourceDepartment
  );
  if (!rawData) throw new Error("Person not found.");

  const details = extractPersonDetails(change.personType, rawData, change.sourceDepartment);

  if (change.personType === "user" && rawData.additionalDetails) {
    details.profileData = rawData.additionalDetails;
    details.contact = rawData.contact || rawData.additionalDetails.phoneNumber || "";
    details.userCreatedAt = rawData.createdAt || null;
  } else if (change.personType === "predefinedOnly") {
    details.userCreatedAt = rawData.createdAt || null;
  } else if (change.personType === "teamMember") {
    details.contact = rawData.contact || "";
    details.section = rawData.section || "";
    details.non_tech_society = rawData.non_tech_society || "";
    details.userCreatedAt = rawData.createdAt || null;
  }

  const emailNorm = details.email;
  const oldSignupDepts = await findSignupDepartmentsForEmail(emailNorm);
  const activityLogs = await collectActivityLogsForPerson(change.personType, details);
  const roleLabel = formatPreviousRoleLabel(
    details,
    details.currentAccountType,
    oldSignupDepts
  );

  await archiveToAlumni({
    details,
    personType: change.personType,
    personId: change.personId,
    oldSignupDepts,
    activityLogs,
    endedBy: actorUserId,
  });

  await purgePersonFromSociety(emailNorm, details.userId || null);

  if (change.personType === "user") {
    const userDoc = await User.findById(change.personId);
    if (userDoc) {
      const expiresAt = getSessionExpiresAt();
      userDoc.tenureEndedAt = new Date();
      userDoc.sessionExpiresAt = expiresAt;
      await userDoc.save();
      emitTenureEnded(String(change.personId), {
        sessionExpiresAt: expiresAt,
        tenureEndedAt: userDoc.tenureEndedAt,
      });
    }
  }

  if (actorUserId) {
    await logActivity(
      actorUserId,
      "leadership_end_session",
      "leadership_transition",
      {
        email: emailNorm,
        name: details.name,
        role: roleLabel,
        personType: change.personType,
        activityLogCount: activityLogs.length,
        draftSessionId: change.draftSessionId || "",
      },
      change.personId,
      "LeadershipTransition"
    );
  }

  const farewellSnapshot = buildFarewellEmailPayload(
    details,
    roleLabel,
    oldSignupDepts,
    activityLogs,
    change.personType === "user"
  );

  return {
    emailType: "end_session",
    name: details.name || emailNorm,
    email: emailNorm,
    previousRole: roleLabel,
    newRole: "",
    newDepartment: "",
    registered: change.personType === "user",
    personType: change.personType,
    personId: String(change.personId),
    tenureDepartment: details.currentAccountType || oldSignupDepts.join(", "),
    timeline: farewellSnapshot.timeline,
    activityLogCount: farewellSnapshot.activityLogCount,
    activityHighlights: farewellSnapshot.activityHighlights,
    tenureStartedAt: farewellSnapshot.tenureStartedAt,
    farewellSnapshot,
  };
}

async function resolveChangePersonImage(change) {
  if (change?.personImage) return change.personImage;
  const rawData = await loadPersonRaw(change.personType, change.personId, change.sourceDepartment);
  if (!rawData) return "";
  const details = extractPersonDetails(change.personType, rawData, change.sourceDepartment);
  return details?.image || "";
}

module.exports = {
  buildPromotionPreview,
  buildEndSessionPreview,
  applyPromotionChange,
  applyEndSessionChange,
  resolveChangePersonImage,
};
