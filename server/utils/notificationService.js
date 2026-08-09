const Notification = require("../models/Notification");
const User = require("../models/User");
const { getTeamMemberModel } = require("../models/TeamMember");
const {
  SOCIETY_ROLES,
  getDepartmentRankFromPosition,
} = require("./leadershipPositions");

const BROADCAST_TEAM_DEPARTMENTS = [
  "Social Media and Promotion",
  "Technical",
  "Event Management",
  "Design and Creative",
  "Content and Documentation",
  "Capture The Event",
  "Sponsorship and Marketing",
];

let emitToUserFn = null;

function setNotificationEmitter(fn) {
  emitToUserFn = fn;
}

function emitNotification(userId, notification) {
  if (!emitToUserFn || !userId) return;
  emitToUserFn(String(userId), "notification", notification);
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
  }

  return created;
}

/**
 * Broadcast a notification to ALL registered users (User collection).
 * Recipients receive a pink-coloured notification.
 */
async function sendBroadcastToAllUsers({ senderRole, title, body, metadata = {} }) {
  const users = await User.find({}).select("_id").lean();
  if (!users.length) return { sent: 0, total: 0 };

  const baseMetadata = {
    ...metadata,
    senderRole: String(senderRole || ""),
    color: "pink",
    broadcastType: "users",
  };

  let sent = 0;
  for (const user of users) {
    try {
      const notification = await Notification.create({
        recipientId: user._id,
        type: "broadcast_users",
        title: String(title || "").trim(),
        body: String(body || "").trim(),
        metadata: baseMetadata,
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
      emitNotification(String(user._id), payload);
      sent++;
    } catch (_) {}
  }
  return { sent, total: users.length };
}

/**
 * Broadcast a notification to ALL department members who have a website account.
 * Recipients receive a pink-coloured notification.
 */
async function sendBroadcastToAllMembers({ senderRole, title, body, metadata = {} }) {
  // Collect unique emails across all team-member collections
  const emailSet = new Set();
  for (const dept of BROADCAST_TEAM_DEPARTMENTS) {
    const members = await getTeamMemberModel(dept)
      .find({
        email: { $exists: true, $ne: "" },
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      })
      .select("email")
      .lean();
    for (const m of members) {
      const email = String(m.email || "").trim().toLowerCase();
      if (email) emailSet.add(email);
    }
  }

  // Find User accounts whose email matches
  const emails = Array.from(emailSet);
  const matchedUsers = emails.length
    ? await User.find({ email: { $in: emails } }).select("_id").lean()
    : [];

  if (!matchedUsers.length) return { sent: 0, total: 0 };

  const baseMetadata = {
    ...metadata,
    senderRole: String(senderRole || ""),
    color: "pink",
    broadcastType: "members",
  };

  let sent = 0;
  for (const user of matchedUsers) {
    try {
      const notification = await Notification.create({
        recipientId: user._id,
        type: "broadcast_members",
        title: String(title || "").trim(),
        body: String(body || "").trim(),
        metadata: baseMetadata,
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
      emitNotification(String(user._id), payload);
      sent++;
    } catch (_) {}
  }
  return { sent, total: matchedUsers.length };
}

/**
 * Broadcast a notification to members of ONE specific department who have a website account.
 * @param {object} opts
 * @param {string} opts.department  - e.g. "Technical"
 * @param {string} opts.senderRole
 * @param {string} opts.title
 * @param {string} opts.body
 * @param {object} [opts.metadata]
 */
async function sendBroadcastToDepartmentMembers({ department, senderRole, title, body, metadata = {} }) {
  const dept = String(department || "").trim();
  if (!dept) return { sent: 0, total: 0 };

  const members = await getTeamMemberModel(dept)
    .find({
      email: { $exists: true, $ne: "" },
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    })
    .select("email")
    .lean();

  const emails = [
    ...new Set(members.map((m) => String(m.email || "").trim().toLowerCase()).filter(Boolean)),
  ];

  const matchedUsers = emails.length
    ? await User.find({ email: { $in: emails } }).select("_id").lean()
    : [];

  if (!matchedUsers.length) return { sent: 0, total: 0 };

  const baseMetadata = {
    ...metadata,
    senderRole: String(senderRole || ""),
    color: "pink",
    broadcastType: "department",
    department: dept,
  };

  let sent = 0;
  for (const user of matchedUsers) {
    try {
      const notification = await Notification.create({
        recipientId: user._id,
        type: "broadcast_department",
        title: String(title || "").trim(),
        body: String(body || "").trim(),
        metadata: baseMetadata,
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
      emitNotification(String(user._id), payload);
      sent++;
    } catch (_) {}
  }
  return { sent, total: matchedUsers.length };
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
