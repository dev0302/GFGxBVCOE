const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    year: { type: String, default: "" },
    branch: { type: String, default: "" },
    section: { type: String, default: "" },
    email: { type: String, default: "", trim: true, lowercase: true },
    contact: { type: String, default: "" },
    photo: { type: String, default: "" },
    non_tech_society: { type: String, default: "" },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

function getCollectionName(department) {
  if (!department || typeof department !== "string") return "teammembers";
  const base = department
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
  return base ? base + "members" : "teammembers";
}

function getTeamMemberModel(department) {
  const collName = getCollectionName(department);
  const modelName = "TeamMember_" + collName;
  try {
    return mongoose.model(modelName);
  } catch {
    return mongoose.model(modelName, teamMemberSchema, collName);
  }
}

module.exports = { getTeamMemberModel, getCollectionName };
