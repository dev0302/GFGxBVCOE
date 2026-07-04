const mongoose = require("mongoose");

const timelineItemSchema = new mongoose.Schema(
  { year: String, role: String, project: String, description: String },
  { _id: false }
);

const activityLogSnapshotSchema = new mongoose.Schema(
  {
    action: String,
    category: String,
    details: mongoose.Schema.Types.Mixed,
    targetId: String,
    targetType: String,
    createdAt: Date,
  },
  { _id: false }
);

const alumniSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    name: { type: String, default: "" },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    image: { type: String, default: "" },
    contact: { type: String, default: "" },
    accountType: { type: String, default: "" },
    department: { type: String, default: "" },
    role: { type: String, default: "" },
    branch: { type: String, default: "" },
    year: { type: String, default: "" },
    section: { type: String, default: "" },
    non_tech_society: { type: String, default: "" },
    about: { type: String, default: "" },
    position: { type: String, default: "" },
    p0: { type: String, default: "" },
    p1: { type: String, default: "" },
    p2: { type: String, default: "" },
    timeline: [timelineItemSchema],
    socials: {
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
    },
    personType: { type: String, default: "user" },
    originalUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    originalPersonId: { type: String, default: "" },
    registered: { type: Boolean, default: false },
    activityLogs: [activityLogSnapshotSchema],
    activityLogCount: { type: Number, default: 0 },
    signupDepartments: [{ type: String }],
    tenureStartedAt: { type: Date, default: null },
    tenureEndedAt: { type: Date, default: Date.now },
    endedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

alumniSchema.index({ tenureEndedAt: -1 });

module.exports = mongoose.model("Alumni", alumniSchema);
