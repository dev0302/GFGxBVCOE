const mongoose = require("mongoose");

const pendingPromotionEmailSchema = new mongoose.Schema(
  {
    emailType: {
      type: String,
      enum: ["promotion", "end_session"],
      default: "promotion",
    },
    name: { type: String, default: "" },
    email: { type: String, required: true },
    previousRole: { type: String, default: "" },
    newRole: { type: String, default: "" },
    newDepartment: { type: String, default: "" },
    registered: { type: Boolean, default: false },
    personType: { type: String, default: "" },
    personId: { type: String, default: "" },
    promotedAt: { type: Date, default: Date.now },
    /** End-session email payload */
    tenureDepartment: { type: String, default: "" },
    timeline: { type: mongoose.Schema.Types.Mixed, default: [] },
    activityLogCount: { type: Number, default: 0 },
    activityHighlights: { type: mongoose.Schema.Types.Mixed, default: [] },
    tenureStartedAt: { type: Date, default: null },
  },
  { _id: true }
);

const leadershipTransitionConfigSchema = new mongoose.Schema(
  {
    /** User IDs (beyond society roles) who can access Leadership Transition */
    allowedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    /** Queued promotion emails awaiting batch send from the Promotions page */
    pendingPromotionEmails: [pendingPromotionEmailSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeadershipTransitionConfig", leadershipTransitionConfigSchema);
