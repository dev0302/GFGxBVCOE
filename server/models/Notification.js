const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null },
    // Original sender info — used to route replies back and display thread context
    senderId: { type: String, default: "" },
    senderName: { type: String, default: "" },
    senderRole: { type: String, default: "" },
    // Thread of replies on this notification
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "NotificationReply" }],
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
