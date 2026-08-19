const Notification = require("../models/Notification");
const NotificationReply = require("../models/NotificationReply");
const User = require("../models/User");
const { getTeamMemberModel } = require("../models/TeamMember");
const { sendBroadcastToAllUsers, sendBroadcastToAllMembers, sendBroadcastToDepartmentMembers, emitNotification } = require("../utils/notificationService");

const BROADCAST_TYPES = ["broadcast_users", "broadcast_members", "broadcast_department"];

exports.getNotifications = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

    // Fetch notifications WITHOUT populating replies — we'll attach them manually below
    const notifications = await Notification.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // ── Attach replies intelligently ──────────────────────────────────────────
    //
    // Strategy A — Broadcast notifications with a broadcastGroupId:
    //   Look up ALL NotificationReply docs tagged with that broadcastGroupId.
    //   This is the canonical cross-user reply lookup and is immune to the
    //   per-notification replies[] array being stale or missing entries.
    //
    // Strategy B — Broadcast notifications WITHOUT broadcastGroupId (legacy data):
    //   Find all sibling notification _ids (same type+title+body+senderId),
    //   then look up NotificationReply by those notificationIds.
    //
    // Strategy C — Non-broadcast notifications:
    //   Look up NotificationReply by this notification's own _id (normal behaviour).

    // Collect distinct broadcastGroupIds (Strategy A)
    const groupIds = [
      ...new Set(
        notifications
          .filter((n) => BROADCAST_TYPES.includes(n.type) && n.metadata?.broadcastGroupId)
          .map((n) => n.metadata.broadcastGroupId)
      ),
    ];

    // Fetch all Strategy-A replies in one shot
    const groupRepliesMap = {}; // broadcastGroupId → reply[]
    if (groupIds.length > 0) {
      const groupReplies = await NotificationReply.find({
        broadcastGroupId: { $in: groupIds },
      })
        .sort({ createdAt: 1 })
        .lean();
      for (const r of groupReplies) {
        const gid = r.broadcastGroupId;
        if (!groupRepliesMap[gid]) groupRepliesMap[gid] = [];
        groupRepliesMap[gid].push(r);
      }
    }

    // Identify legacy broadcast notifications (Strategy B)
    const legacyBroadcasts = notifications.filter(
      (n) => BROADCAST_TYPES.includes(n.type) && !n.metadata?.broadcastGroupId
    );

    // For each legacy broadcast, find sibling notification _ids then fetch their replies
    const legacyRepliesMap = {}; // notification._id (string) → reply[]
    if (legacyBroadcasts.length > 0) {
      // One query per unique (type+title+body+senderId) combination
      const seen = new Set();
      for (const n of legacyBroadcasts) {
        const key = `${n.type}||${n.title}||${n.body}||${n.senderId}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const siblingQuery = {
          type: n.type,
          title: n.title,
          body: n.body,
        };
        if (n.senderId) siblingQuery.senderId = n.senderId;

        const siblingIds = await Notification.find(siblingQuery)
          .select("_id")
          .lean()
          .then((docs) => docs.map((d) => d._id));

        if (siblingIds.length === 0) continue;

        const replies = await NotificationReply.find({
          notificationId: { $in: siblingIds },
        })
          .sort({ createdAt: 1 })
          .lean();

        // Map onto every sibling notification that belongs to this user
        for (const notif of legacyBroadcasts) {
          if (
            notif.type === n.type &&
            notif.title === n.title &&
            notif.body === n.body &&
            (notif.senderId || "") === (n.senderId || "")
          ) {
            legacyRepliesMap[String(notif._id)] = replies;
          }
        }
      }
    }

    // Identify non-broadcast notification ids (Strategy C)
    const nonBroadcastIds = notifications
      .filter((n) => !BROADCAST_TYPES.includes(n.type))
      .map((n) => n._id);

    const nonBroadcastRepliesMap = {}; // notificationId (string) → reply[]
    if (nonBroadcastIds.length > 0) {
      const replies = await NotificationReply.find({
        notificationId: { $in: nonBroadcastIds },
      })
        .sort({ createdAt: 1 })
        .lean();
      for (const r of replies) {
        const nid = String(r.notificationId);
        if (!nonBroadcastRepliesMap[nid]) nonBroadcastRepliesMap[nid] = [];
        nonBroadcastRepliesMap[nid].push(r);
      }
    }

    // Attach replies to each notification
    const enrichedNotifications = notifications.map((n) => {
      if (BROADCAST_TYPES.includes(n.type)) {
        if (n.metadata?.broadcastGroupId) {
          // Strategy A
          return { ...n, replies: groupRepliesMap[n.metadata.broadcastGroupId] || [] };
        }
        // Strategy B
        return { ...n, replies: legacyRepliesMap[String(n._id)] || [] };
      }
      // Strategy C
      return { ...n, replies: nonBroadcastRepliesMap[String(n._id)] || [] };
    });

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user.id,
      readAt: null,
    });

    return res.status(200).json({
      success: true,
      data: enrichedNotifications,
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

    // Resolve the broadcastGroupId from the notification's metadata
    const broadcastGroupId = String(notification.metadata?.broadcastGroupId || "").trim();

    // Save the reply document — store broadcastGroupId so getNotifications can
    // look up ALL replies for the group without relying on the per-notification
    // replies[] array being perfectly in sync across all recipient documents.
    const reply = await NotificationReply.create({
      notificationId: notification._id,
      broadcastGroupId,
      senderId: replierId,
      senderName: replierName,
      senderRole: replierRole,
      body,
    });

    // Also push reply ref onto the replier's own notification doc (keeps the
    // replies[] array consistent for the replier and legacy code paths).
    notification.replies.push(reply._id);
    await notification.save();

    // Build the reply payload shared across all acks
    const replyPayload = {
      _id: reply._id,
      senderId: reply.senderId,
      senderName: reply.senderName,
      senderRole: reply.senderRole,
      body: reply.body,
      createdAt: reply.createdAt,
    };

    const isBroadcastNotif = BROADCAST_TYPES.includes(notification.type);

    if (isBroadcastNotif) {
      // ── Broadcast reply: fan out to ALL sibling notifications ──────────────
      // Build sibling query: prefer broadcastGroupId (exact, new data),
      // fall back to content-match for legacy notifications without it.
      let siblingQuery;
      if (broadcastGroupId) {
        siblingQuery = { "metadata.broadcastGroupId": broadcastGroupId };
      } else {
        siblingQuery = {
          type: notification.type,
          title: notification.title,
          body: notification.body,
        };
        if (notification.senderId) siblingQuery.senderId = notification.senderId;
      }

      const siblings = await Notification.find(siblingQuery)
        .select("_id recipientId")
        .lean();

      // Push reply _id onto every sibling notification doc (for consistency)
      const siblingIds = siblings.map((s) => s._id);
      if (siblingIds.length > 1) {
        await Notification.updateMany(
          { _id: { $in: siblingIds }, replies: { $ne: reply._id } },
          { $push: { replies: reply._id } }
        );
      }

      // Emit real-time ack to every online recipient (skip replier — they
      // already got the reply via the REST optimistic update in the context).
      const seen = new Set([replierId]);
      for (const sibling of siblings) {
        const recipientId = String(sibling.recipientId);
        if (seen.has(recipientId)) continue;
        seen.add(recipientId);
        emitNotification(recipientId, {
          type: "notification_reply_ack",
          notificationId: String(sibling._id),
          reply: replyPayload,
        });
      }

      const originalSenderId = String(notification.senderId || "").trim();
      if (originalSenderId && !seen.has(originalSenderId)) {
        seen.add(originalSenderId);
        emitNotification(originalSenderId, {
          type: "notification_reply_ack",
          notificationId: String(notification._id),
          reply: replyPayload,
        });
      }
    } else {
      // ── Non-broadcast: only ack the replier ───────────────────────────────
      emitNotification(replierId, {
        type: "notification_reply_ack",
        notificationId: String(notification._id),
        reply: replyPayload,
      });
    }


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

/**
 * DELETE /api/v1/notifications/replies/:replyId
 * Only the original sender of the reply can delete it.
 * On success, removes the reply from DB and emits notification_reply_delete_ack
 * to all broadcast group recipients so their UI updates in real-time.
 */
exports.deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const deleterId = String(req.user.id);

    // Find reply — verify ownership
    const reply = await NotificationReply.findById(replyId).lean();
    if (!reply) {
      return res.status(404).json({ success: false, message: "Reply not found." });
    }
    if (String(reply.senderId) !== deleterId) {
      return res.status(403).json({ success: false, message: "You can only delete your own replies." });
    }

    // Delete the reply document
    await NotificationReply.deleteOne({ _id: replyId });

    // Pull reply _id from ALL notification documents that reference it
    await Notification.updateMany(
      { replies: reply._id },
      { $pull: { replies: reply._id } }
    );

    // ── Broadcast delete ack to all affected recipients ──────────────────────
    // Strategy: find sibling notifications by broadcastGroupId (new) or content (legacy)
    const broadcastGroupId = reply.broadcastGroupId;
    const broadcastType = reply.broadcastGroupId ? "group" : "content";

    // First, look up the original notification to get type/title/body for legacy fallback
    const originalNotif = await Notification.findById(reply.notificationId)
      .select("type title body senderId metadata")
      .lean();

    let siblings = [];
    if (broadcastGroupId) {
      siblings = await Notification.find({ "metadata.broadcastGroupId": broadcastGroupId })
        .select("_id recipientId")
        .lean();
    } else if (originalNotif && BROADCAST_TYPES.includes(originalNotif.type)) {
      const siblingQuery = {
        type: originalNotif.type,
        title: originalNotif.title,
        body: originalNotif.body,
      };
      if (originalNotif.senderId) siblingQuery.senderId = originalNotif.senderId;
      siblings = await Notification.find(siblingQuery)
        .select("_id recipientId")
        .lean();
    } else if (originalNotif) {
      // Non-broadcast: only notify the owner of the original notification
      siblings = [{ _id: originalNotif._id, recipientId: originalNotif.recipientId || reply.notificationId }];
    }

    // Emit delete ack to every unique recipient
    const seen = new Set();
    for (const sibling of siblings) {
      const recipientId = String(sibling.recipientId);
      if (seen.has(recipientId)) continue;
      seen.add(recipientId);
      emitNotification(recipientId, {
        type: "notification_reply_delete_ack",
        notificationId: String(sibling._id),
        replyId: String(reply._id),
      });
    }

    return res.status(200).json({ success: true, message: "Reply deleted." });
  } catch (error) {
    console.error("deleteReply error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete reply.",
    });
  }
};
