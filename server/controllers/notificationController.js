const Notification = require("../models/Notification");
const NotificationReply = require("../models/NotificationReply");
const User = require("../models/User");
const { getTeamMemberModel } = require("../models/TeamMember");
const { sendBroadcastToAllUsers, sendBroadcastToAllMembers, sendBroadcastToDepartmentMembers, emitNotification } = require("../utils/notificationService");

exports.getNotifications = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const notifications = await Notification.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: "replies", options: { sort: { createdAt: 1 } } })
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user.id,
      readAt: null,
    });

    return res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("getNotifications error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch notifications.",
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipientId: req.user.id,
      readAt: null,
    });
    return res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    console.error("getUnreadCount error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch unread count.",
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: req.user.id },
      { readAt: new Date() },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error("markAsRead error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark notification as read.",
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user.id, readAt: null },
      { readAt: new Date() }
    );
    return res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    console.error("markAllAsRead error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark all notifications as read.",
    });
  }
};

/**
 * POST /api/v1/notifications/:id/reply
 * Recipient replies to a notification. A new notification is sent back to the original sender.
 */
exports.replyToNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const body = String(req.body?.body || "").trim();

    if (!body) {
      return res.status(400).json({ success: false, message: "Reply body is required." });
    }
    if (body.length > 500) {
      return res.status(400).json({ success: false, message: "Reply is too long (max 500 characters)." });
    }

    // Find the notification — must belong to the current user (they are the recipient)
    const notification = await Notification.findOne({
      _id: id,
      recipientId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    // Fetch the replier's real name from DB (JWT only contains id/email/accountType — no name)
    const replierId = String(req.user.id);
    let replierName = "";
    let replierRole = String(req.user?.accountType || "").trim();

    if (req.user?.isDepartmentMember) {
      const dept = String(req.user?.memberDepartment || req.user?.accountType || "").trim();
      replierRole = dept;
      try {
        const member = await getTeamMemberModel(dept)
          .findById(replierId)
          .select("name")
          .lean();
        replierName = String(member?.name || "").trim();
      } catch (_) {}
    } else {
      try {
        const dbUser = await User.findById(replierId)
          .select("firstName lastName")
          .lean();
        replierName = `${dbUser?.firstName || ""} ${dbUser?.lastName || ""}`.trim();
      } catch (_) {}
    }

    if (!replierName) replierName = req.user?.email || "Member";

    // Save the reply document
    const reply = await NotificationReply.create({
      notificationId: notification._id,
      senderId: replierId,
      senderName: replierName,
      senderRole: replierRole,
      body,
    });

    // Push reply ref onto the original notification
    notification.replies.push(reply._id);
    await notification.save();

    // If the original notification has a known sender, notify them in real-time
    const originalSenderId = notification.senderId;
    if (originalSenderId && originalSenderId !== replierId) {
      // Create a new notification for the original sender
      const replyNotif = await Notification.create({
        recipientId: originalSenderId,
        type: "notification_reply",
        title: `↩ Reply from ${replierName}`,
        body,
        senderId: replierId,
        senderName: replierName,
        senderRole: replierRole,
        metadata: {
          senderRole: replierRole,
          color: "green",
          originalNotificationId: String(notification._id),
          originalTitle: notification.title,
        },
      });

      emitNotification(originalSenderId, {
        _id: replyNotif._id,
        type: replyNotif.type,
        title: replyNotif.title,
        body: replyNotif.body,
        metadata: replyNotif.metadata,
        senderId: replyNotif.senderId,
        senderName: replyNotif.senderName,
        senderRole: replyNotif.senderRole,
        readAt: replyNotif.readAt,
        createdAt: replyNotif.createdAt,
        replies: [],
      });
    }

    // Also emit a socket event to the replier so their own panel updates with the reply
    emitNotification(replierId, {
      type: "notification_reply_ack",
      notificationId: String(notification._id),
      reply: {
        _id: reply._id,
        senderId: reply.senderId,
        senderName: reply.senderName,
        senderRole: reply.senderRole,
        body: reply.body,
        createdAt: reply.createdAt,
      },
    });

    return res.status(201).json({
      success: true,
      reply: {
        _id: reply._id,
        notificationId: reply.notificationId,
        senderId: reply.senderId,
        senderName: reply.senderName,
        senderRole: reply.senderRole,
        body: reply.body,
        createdAt: reply.createdAt,
      },
    });
  } catch (error) {
    console.error("replyToNotification error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send reply.",
    });
  }
};

exports.broadcastToUsers = async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const body = String(req.body?.body || "").trim();
    if (!title || !body) {
      return res.status(400).json({ success: false, message: "Title and body are required." });
    }
    if (title.length > 120 || body.length > 500) {
      return res.status(400).json({ success: false, message: "Title (max 120) or body (max 500) is too long." });
    }
    const senderRole = String(req.user?.accountType || "Society").trim();
    const senderId   = String(req.user?.id || req.user?._id || "").trim();
    const senderName = String(req.user?.name || `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() || "Society").trim();
    const result = await sendBroadcastToAllUsers({ senderId, senderName, senderRole, title, body });
    return res.status(200).json({
      success: true,
      message: `Notification sent to ${result.sent} of ${result.total} users.`,
      ...result,
    });
  } catch (error) {
    console.error("broadcastToUsers error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to broadcast notification to users.",
    });
  }
};

exports.broadcastToMembers = async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const body = String(req.body?.body || "").trim();
    if (!title || !body) {
      return res.status(400).json({ success: false, message: "Title and body are required." });
    }
    if (title.length > 120 || body.length > 500) {
      return res.status(400).json({ success: false, message: "Title (max 120) or body (max 500) is too long." });
    }
    const senderRole = String(req.user?.accountType || "Society").trim();
    const senderId   = String(req.user?.id || req.user?._id || "").trim();
    const senderName = String(req.user?.name || `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() || "Society").trim();
    const result = await sendBroadcastToAllMembers({ senderId, senderName, senderRole, title, body });
    return res.status(200).json({
      success: true,
      message: `Notification sent to ${result.sent} of ${result.total} members.`,
      ...result,
    });
  } catch (error) {
    console.error("broadcastToMembers error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to broadcast notification to members.",
    });
  }
};

exports.broadcastToDepartment = async (req, res) => {
  try {
    const title      = String(req.body?.title || "").trim();
    const body       = String(req.body?.body || "").trim();
    const department = String(req.body?.department || "").trim();
    if (!title || !body) {
      return res.status(400).json({ success: false, message: "Title and body are required." });
    }
    if (!department) {
      return res.status(400).json({ success: false, message: "Department is required." });
    }
    if (title.length > 120 || body.length > 500) {
      return res.status(400).json({ success: false, message: "Title (max 120) or body (max 500) is too long." });
    }
    const senderRole = String(req.user?.accountType || "Society").trim();
    const senderId   = String(req.user?.id || req.user?._id || "").trim();
    const senderName = String(req.user?.name || `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() || "Society").trim();
    const result = await sendBroadcastToDepartmentMembers({ department, senderId, senderName, senderRole, title, body });
    return res.status(200).json({
      success: true,
      message: `Notification sent to ${result.sent} of ${result.total} ${department} members.`,
      ...result,
    });
  } catch (error) {
    console.error("broadcastToDepartment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to broadcast notification to department members.",
    });
  }
};
