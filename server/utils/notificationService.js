const Notification = require("../models/Notification");
const User = require("../models/User");
const {
  SOCIETY_ROLES,
  getDepartmentRankFromPosition,
} = require("./leadershipPositions");

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

module.exports = {
  setNotificationEmitter,
  emitNotification,
  getInviteSubmissionRecipients,
  notifyTeamInviteSubmission,
};
