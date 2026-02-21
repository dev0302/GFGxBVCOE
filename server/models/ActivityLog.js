const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    category: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    targetId: { type: String, default: "" },
    targetType: { type: String, default: "" },
  },
  { timestamps: true }
);

activityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
