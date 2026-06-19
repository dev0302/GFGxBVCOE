const mongoose = require("mongoose");

const pendingPromotionEmailSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, required: true },
    previousRole: { type: String, default: "" },
    newRole: { type: String, required: true },
    newDepartment: { type: String, default: "" },
    registered: { type: Boolean, default: false },
    personType: { type: String, default: "" },
    personId: { type: String, default: "" },
    promotedAt: { type: Date, default: Date.now },
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
