const Notification = require("../models/Notification");
const { sendBroadcastToAllUsers, sendBroadcastToAllMembers, sendBroadcastToDepartmentMembers } = require("../utils/notificationService");

exports.getNotifications = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const notifications = await Notification.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
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
    // senderRole = the logged-in user's accountType (e.g. "Chairperson")
    const senderRole = String(req.user?.accountType || "Society").trim();
    const result = await sendBroadcastToAllUsers({ senderRole, title, body });
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
    const result = await sendBroadcastToAllMembers({ senderRole, title, body });
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
    const title = String(req.body?.title || "").trim();
    const body = String(req.body?.body || "").trim();
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
    const result = await sendBroadcastToDepartmentMembers({ department, senderRole, title, body });
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
