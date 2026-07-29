const User = require("../models/User");
const Profile = require("../models/Profile");
const PredefinedProfile = require("../models/PredefinedProfile");
const Alumni = require("../models/Alumni");
const SignupConfig = require("../models/SignupConfig");
const DashboardAccessConfig = require("../models/DashboardAccessConfig");
const LeadershipDraftSession = require("../models/LeadershipDraftSession");
const { getTeamMemberModel } = require("../models/TeamMember");

const RENAMES = {
  Design: "Design and Creative",
  "Photography and Videography": "Capture The Event",
};

function renameText(value) {
  let next = String(value || "");
  for (const [oldName, newName] of Object.entries(RENAMES)) {
    next = next.replaceAll(oldName, newName);
  }
  return next;
}

async function migrateTextFields(Model, fields) {
  const docs = await Model.find({
    $or: fields.map((field) => ({ [field]: { $regex: "Design|Photography and Videography", $options: "i" } })),
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

async function migrateDepartmentNames() {
  await User.updateMany({ accountType: { $in: Object.keys(RENAMES) } }, [
    { $set: { accountType: { $switch: { branches: Object.entries(RENAMES).map(([oldName, newName]) => ({ case: { $eq: ["$accountType", oldName] }, then: newName })), default: "$accountType" } } } },
  ]);
  await migrateSignupConfigs();
  await migrateTeamCollections();
  await migrateDashboardConfigs();
  await Promise.all([
    migrateTextFields(Profile, ["position", "p0", "p1", "p2"]),
    migrateTextFields(PredefinedProfile, ["position", "p0", "p1", "p2"]),
    migrateTextFields(Alumni, ["accountType", "department", "role", "position", "p0", "p1", "p2"]),
    migrateLeadershipDrafts(),
  ]);
}

module.exports = { migrateDepartmentNames };
