const User = require("../models/User");
const Profile = require("../models/Profile");
const PredefinedProfile = require("../models/PredefinedProfile");
const Alumni = require("../models/Alumni");
const SignupConfig = require("../models/SignupConfig");
const DashboardAccessConfig = require("../models/DashboardAccessConfig");
const EventUploadConfig = require("../models/EventUploadConfig");
const LeadershipDraftSession = require("../models/LeadershipDraftSession");
const { getTeamMemberModel } = require("../models/TeamMember");

const LEGACY_TREASURER_DEPARTMENT = "Treasurer";

const RENAMES = {
  Design: "Design and Creative",
  "Creative and Design": "Design and Creative",
  "Creative & Design": "Design and Creative",
  "Design & Creative": "Design and Creative",
  "Photography and Videography": "Capture The Event",
};

function renameText(value) {
  let next = String(value || "");
  // Normalize records affected by the former non-idempotent rename, then only
  // rename standalone legacy department names. This can run safely on every
  // server start without appending "and Creative" again.
  next = next.replace(/\bDesign\s+and\s+Creative\s+and\s+Creatives?\b/gi, "Design and Creative");
  next = next.replace(/\bDesign(?: and Creative)+\b/gi, "Design and Creative");
  next = next.replace(/\bCreative\s*(?:and|&)\s*Design\b/gi, "Design and Creative");
  next = next.replace(/\bDesign\s*&\s*Creative\b/gi, "Design and Creative");
  next = next.replace(/\bDesign\b(?! and Creative)/gi, "Design and Creative");
  next = next.replace(/\bPhotography and Videography\b/gi, "Capture The Event");
  next = next.replace(/\bPhotography Head\b/gi, "Capture The Event Head");
  return next;
}

async function migrateTextFields(Model, fields) {
  const docs = await Model.find({
    $or: fields.map((field) => ({ [field]: { $regex: "Design|Photography and Videography|Photography Head", $options: "i" } })),
  });
  for (const doc of docs) {
    let changed = false;
    fields.forEach((field) => {
      const current = doc.get(field);
      if (typeof current !== "string") return;
      const renamed = renameText(current);
      if (renamed !== current) {
        doc.set(field, renamed);
        changed = true;
      }
    });
    if (changed) await doc.save();
  }
}

async function migrateTimelineFields(Model) {
  const docs = await Model.find({
    "timeline.role": { $regex: "Design|Photography and Videography|Photography Head", $options: "i" },
  });
  for (const doc of docs) {
    let changed = false;
    (doc.timeline || []).forEach((item, index) => {
      if (typeof item.role === "string") {
        const renamed = renameText(item.role);
        if (renamed !== item.role) {
          doc.timeline[index].role = renamed;
          changed = true;
        }
      }
      if (typeof item.description === "string") {
        const renamed = renameText(item.description);
        if (renamed !== item.description) {
          doc.timeline[index].description = renamed;
          changed = true;
        }
      }
    });
    if (changed) await doc.save();
  }
}

async function migrateSignupConfigs() {
  for (const [oldName, newName] of Object.entries(RENAMES)) {
    const oldConfig = await SignupConfig.findOne({ department: oldName });
    if (!oldConfig) continue;
    const newConfig = await SignupConfig.findOne({ department: newName });
    if (newConfig) {
      newConfig.allowedEmails = [...new Set([...(newConfig.allowedEmails || []), ...(oldConfig.allowedEmails || [])])];
      await newConfig.save();
      await oldConfig.deleteOne();
    } else {
      oldConfig.department = newName;
      await oldConfig.save();
    }
  }
}

async function migrateTeamCollections() {
  for (const [oldName, newName] of Object.entries(RENAMES)) {
    const oldModel = getTeamMemberModel(oldName);
    const newModel = getTeamMemberModel(newName);
    const members = await oldModel.find({}).lean();
    if (!members.length) continue;
    await newModel.bulkWrite(members.map((member) => ({
      replaceOne: { filter: { _id: member._id }, replacement: member, upsert: true },
    })));
    await oldModel.deleteMany({});
  }
}

async function migrateDashboardConfigs() {
  const configs = await DashboardAccessConfig.find({});
  for (const config of configs) {
    const renamedKey = RENAMES[config.dashboardKey] || config.dashboardKey;
    const renamedExtras = [...new Set((config.extraAllowedDepartments || []).map((dept) => RENAMES[dept] || dept))];
    if (renamedKey !== config.dashboardKey) {
      const existing = await DashboardAccessConfig.findOne({ dashboardKey: renamedKey });
      if (existing) {
        existing.extraAllowedDepartments = [...new Set([...(existing.extraAllowedDepartments || []), ...renamedExtras])];
        await existing.save();
        await config.deleteOne();
      } else {
        config.dashboardKey = renamedKey;
        config.extraAllowedDepartments = renamedExtras;
        await config.save();
      }
    } else if (JSON.stringify(renamedExtras) !== JSON.stringify(config.extraAllowedDepartments || [])) {
      config.extraAllowedDepartments = renamedExtras;
      await config.save();
    }
  }
}

async function migrateLeadershipDrafts() {
  const drafts = await LeadershipDraftSession.find({
    $or: [
      { "pendingChanges.sourceDepartment": { $in: Object.keys(RENAMES) } },
      { "pendingChanges.newDepartment": { $in: Object.keys(RENAMES) } },
      { "pendingChanges.previousDepartment": { $in: Object.keys(RENAMES) } },
      { "collaborators.department": { $in: Object.keys(RENAMES) } },
      { "approvals.department": { $in: Object.keys(RENAMES) } },
    ],
  });
  for (const draft of drafts) {
    (draft.pendingChanges || []).forEach((change) => {
      ["sourceDepartment", "newDepartment", "previousDepartment", "previousRole", "newRole"].forEach((field) => {
        if (change[field]) change[field] = renameText(change[field]);
      });
    });
    (draft.collaborators || []).forEach((item) => { item.department = renameText(item.department); item.role = renameText(item.role); });
    (draft.approvals || []).forEach((item) => { item.department = renameText(item.department); item.role = renameText(item.role); });
    await draft.save();
  }
}

function normalizeTreasurerRole(value) {
  const text = String(value || "").trim();
  return /^Treasurer(?:\s+(?:Member|Lead|Head))?$/i.test(text)
    ? LEGACY_TREASURER_DEPARTMENT
    : text;
}

async function migrateTreasurerToCoreRole() {
  // Treasurer keeps the same accountType value, but is now authorized as a
  // society role. Remove only the department-specific data that is no longer
  // meaningful; signup configuration remains so a Treasurer can still enroll.
  await Promise.all([
    DashboardAccessConfig.deleteOne({ dashboardKey: LEGACY_TREASURER_DEPARTMENT }),
    DashboardAccessConfig.updateMany(
      { extraAllowedDepartments: LEGACY_TREASURER_DEPARTMENT },
      { $pull: { extraAllowedDepartments: LEGACY_TREASURER_DEPARTMENT } }
    ),
    EventUploadConfig.updateMany(
      { extraAllowedDepartments: LEGACY_TREASURER_DEPARTMENT },
      { $pull: { extraAllowedDepartments: LEGACY_TREASURER_DEPARTMENT } }
    ),
  ]);

  const profileModels = [Profile, PredefinedProfile, Alumni];
  for (const Model of profileModels) {
    const docs = await Model.find({
      $or: ["position", "p0", "p1", "p2", "role"].map((field) => ({
        [field]: { $regex: "^Treasurer(?:\\s+(?:Member|Lead|Head))?$", $options: "i" },
      })),
    });
    for (const doc of docs) {
      let changed = false;
      ["position", "p0", "p1", "p2", "role"].forEach((field) => {
        const current = doc.get(field);
        if (typeof current !== "string") return;
        const normalized = normalizeTreasurerRole(current);
        if (normalized !== current) {
          doc.set(field, normalized);
          changed = true;
        }
      });
      if (changed) await doc.save();
    }
  }

  // Team-member documents belong to the retired department. Treasurer users
  // remain in the User collection and now receive society/core permissions.
  try {
    await getTeamMemberModel(LEGACY_TREASURER_DEPARTMENT).collection.drop();
  } catch (error) {
    if (error.codeName !== "NamespaceNotFound") throw error;
  }
}

async function migrateDepartmentNames() {
  await User.updateMany({ accountType: { $in: Object.keys(RENAMES) } }, [
    { $set: { accountType: { $switch: { branches: Object.entries(RENAMES).map(([oldName, newName]) => ({ case: { $eq: ["$accountType", oldName] }, then: newName })), default: "$accountType" } } } },
  ]);
  await migrateSignupConfigs();
  await migrateTeamCollections();
  await migrateDashboardConfigs();
  await migrateTreasurerToCoreRole();
  await Promise.all([
    migrateTextFields(Profile, ["position", "p0", "p1", "p2"]),
    migrateTextFields(PredefinedProfile, ["position", "p0", "p1", "p2"]),
    migrateTextFields(Alumni, ["accountType", "department", "role", "position", "p0", "p1", "p2"]),
    migrateTimelineFields(Profile),
    migrateTimelineFields(PredefinedProfile),
    migrateLeadershipDrafts(),
  ]);
}

module.exports = { migrateDepartmentNames };
