const mongoose = require("mongoose");

const notificationReplySchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: { type: String, default: "" },
    senderRole: { type: String, default: "" },
    body: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

notificationReplySchema.index({ notificationId: 1, createdAt: 1 });

module.exports = mongoose.model("NotificationReply", notificationReplySchema);
