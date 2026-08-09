const Notification = require("../models/Notification");
const User = require("../models/User");
const { getTeamMemberModel } = require("../models/TeamMember");
const {
  SOCIETY_ROLES,
  getDepartmentRankFromPosition,
  TEAM_DEPARTMENTS,
} = require("./leadershipPositions");

// Use the single authoritative department list from leadershipPositions
const BROADCAST_TEAM_DEPARTMENTS = TEAM_DEPARTMENTS;

let emitToUserFn = null;

function setNotificationEmitter(fn) {
  emitToUserFn = fn;
}

function emitNotification(userId, notification) {
  if (!emitToUserFn || !userId) return;
  try {
    emitToUserFn(String(userId), "notification", notification);
  } catch (_) {}
}

async function getInviteSubmissionRecipients(department) {
  const recipientIds = new Set();

  const societyUsers = await User.find({ accountType: { $in: SOCIETY_ROLES } })
    .select("_id")
    .lean();
  for (const u of societyUsers) {
    recipientIds.add(String(u._id));
  }

  const deptUsers = await User.find({ accountType: department })
    .populate("additionalDetails", "position p0")
    .select("_id additionalDetails")
    .lean();

  for (const u of deptUsers) {
    const position = u.additionalDetails?.position || u.additionalDetails?.p0 || "";
    const rank = getDepartmentRankFromPosition(position);
    if (rank === "Lead" || rank === "Head") {
      recipientIds.add(String(u._id));
    }
  }

  return Array.from(recipientIds);
}

async function notifyTeamInviteSubmission({ department, memberName, memberId }) {
  const name = String(memberName || "Someone").trim();
  const dept = String(department || "").trim();
  const title = "New team member";
  const body = `${name} joined ${dept} as member`;

  const recipientIds = await getInviteSubmissionRecipients(dept);
  if (!recipientIds.length) return [];

  const created = [];
  for (const recipientId of recipientIds) {
    try {
      const notification = await Notification.create({
        recipientId,
        type: "team_invite_submission",
        title,
        body,
        metadata: {
          department: dept,
          memberName: name,
          memberId: memberId ? String(memberId) : "",
        },
      });

      const payload = {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        metadata: notification.metadata,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      };

      emitNotification(recipientId, payload);
      created.push(payload);
    } catch (_) {}
  }

  return created;
}

/**
 * Broadcast to ALL registered users (User collection).
 * Batched 100 at a time to keep memory low on production.
 */
async function sendBroadcastToAllUsers({ senderRole, title, body, metadata = {} }) {
  const titleStr = String(title || "").trim();
  const bodyStr = String(body || "").trim();
  const baseMetadata = {
    ...metadata,
    senderRole: String(senderRole || ""),
    color: "pink",
    broadcastType: "users",
  };

  const total = await User.countDocuments({});
  if (!total) return { sent: 0, total: 0 };

  const BATCH = 100;
  let skip = 0;
  let sent = 0;

  while (skip < total) {
    const users = await User.find({}).select("_id").skip(skip).limit(BATCH).lean();
    skip += BATCH;
    for (const user of users) {
      try {
        const notification = await Notification.create({
          recipientId: user._id,
          type: "broadcast_users",
          title: titleStr,
          body: bodyStr,
          metadata: baseMetadata,
        });
        emitNotification(String(user._id), {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          metadata: notification.metadata,
          readAt: notification.readAt,
          createdAt: notification.createdAt,
        });
        sent++;
      } catch (_) {}
    }
  }

  return { sent, total };
}

/**
 * Broadcast to ALL members in ALL department collections.
 *
 * KEY FIX: Uses the member's own _id (from the dept collection) as recipientId
 * instead of looking up matching User accounts by email.
 * Department members are NOT in the users collection — they're in {dept}members.
 * The Notification recipientId stores their dept _id so getNotifications()
 * (which queries { recipientId: req.user.id }) still works for dept member logins.
 */
async function sendBroadcastToAllMembers({ senderRole, title, body, metadata = {} }) {
  const titleStr = String(title || "").trim();
  const bodyStr = String(body || "").trim();
  const baseMetadata = {
    ...metadata,
    senderRole: String(senderRole || ""),
    color: "pink",
    broadcastType: "members",
  };

  // Collect all member _ids from every dept collection
  const memberIds = [];
  for (const dept of BROADCAST_TEAM_DEPARTMENTS) {
    try {
      const members = await getTeamMemberModel(dept)
        .find({ deletedAt: null })
        .select("_id")
        .lean();
      for (const m of members) {
        memberIds.push(String(m._id));
      }
    } catch (err) {
      console.error(`sendBroadcastToAllMembers: failed to read ${dept}:`, err.message);
    }
  }

  if (!memberIds.length) return { sent: 0, total: 0 };

  let sent = 0;
  for (const memberId of memberIds) {
    try {
      const notification = await Notification.create({
        recipientId: memberId,
        type: "broadcast_members",
        title: titleStr,
        body: bodyStr,
        metadata: baseMetadata,
      });
      emitNotification(memberId, {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        metadata: notification.metadata,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      });
      sent++;
    } catch (_) {}
  }

  return { sent, total: memberIds.length };
}

/**
 * Broadcast to members of ONE specific department.
 *
 * KEY FIX: Same as sendBroadcastToAllMembers — uses dept member _ids directly,
 * not email-to-User matching.
 */
async function sendBroadcastToDepartmentMembers({ department, senderRole, title, body, metadata = {} }) {
  const dept = String(department || "").trim();
  if (!dept) return { sent: 0, total: 0 };

  const titleStr = String(title || "").trim();
  const bodyStr = String(body || "").trim();

  let members = [];
  try {
    members = await getTeamMemberModel(dept)
      .find({ deletedAt: null })
      .select("_id")
      .lean();
  } catch (err) {
    console.error(`sendBroadcastToDepartmentMembers: failed to read ${dept}:`, err.message);
    return { sent: 0, total: 0 };
  }

  if (!members.length) return { sent: 0, total: 0 };

  const baseMetadata = {
    ...metadata,
    senderRole: String(senderRole || ""),
    color: "pink",
    broadcastType: "department",
    department: dept,
  };

  let sent = 0;
  for (const member of members) {
    try {
      const memberId = String(member._id);
      const notification = await Notification.create({
        recipientId: memberId,
        type: "broadcast_department",
        title: titleStr,
        body: bodyStr,
        metadata: baseMetadata,
      });
      emitNotification(memberId, {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        metadata: notification.metadata,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      });
      sent++;
    } catch (_) {}
  }

  return { sent, total: members.length };
}

module.exports = {
  setNotificationEmitter,
  emitNotification,
  getInviteSubmissionRecipients,
  notifyTeamInviteSubmission,
  sendBroadcastToAllUsers,
  sendBroadcastToAllMembers,
  sendBroadcastToDepartmentMembers,
};
