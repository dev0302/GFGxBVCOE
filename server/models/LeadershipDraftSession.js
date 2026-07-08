const mongoose = require("mongoose");

const pendingChangeSchema = new mongoose.Schema(
  {
    changeType: {
      type: String,
      enum: ["promotion", "end_session", "department_transfer", "role_change"],
      required: true,
    },
    personType: { type: String, required: true },
    personId: { type: String, required: true },
    sourceDepartment: { type: String, default: "" },
    targetPositionId: { type: String, default: "" },
    personName: { type: String, default: "" },
    personEmail: { type: String, default: "" },
    personImage: { type: String, default: "" },
    previousRole: { type: String, default: "" },
    newRole: { type: String, default: "" },
    newDepartment: { type: String, default: "" },
    previousDepartment: { type: String, default: "" },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    addedByName: { type: String, default: "" },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const collaboratorSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    role: { type: String, default: "" },
    department: { type: String, default: "" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const approvalSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    role: { type: String, default: "" },
    department: { type: String, default: "" },
    category: { type: String, enum: ["core", "department"], required: true },
    approvedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const leadershipDraftSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["DRAFT", "APPROVAL_PENDING", "READY_TO_APPLY", "APPLIED", "DISCARDED"],
      default: "DRAFT",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByName: { type: String, default: "" },
    collaborators: [collaboratorSchema],
    pendingChanges: [pendingChangeSchema],
    approvals: [approvalSchema],
    finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    finalizedByName: { type: String, default: "" },
    appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    appliedByName: { type: String, default: "" },
    appliedAt: { type: Date, default: null },
    effectiveDate: { type: Date, default: null },
    reportPdfPath: { type: String, default: "" },
    documentHash: { type: String, default: "" },
    version: { type: String, default: "1.0.0" },
    discardReason: { type: String, default: "" },
  },
  { timestamps: true }
);

leadershipDraftSessionSchema.index({ status: 1, updatedAt: -1 });

module.exports = mongoose.model("LeadershipDraftSession", leadershipDraftSessionSchema);
