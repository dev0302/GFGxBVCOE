const crypto = require("crypto");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { getTeamMemberModel } = require("../models/TeamMember");
const mailSender = require("./mailSender");
const {
  blogSubmissionReviewTemplate,
  blogStatusUpdateTemplate,
} = require("../mail/templates");
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

async function getAllLeadershipRecipients() {
  const recipientIds = new Set();

  const societyUsers = await User.find({ accountType: { $in: SOCIETY_ROLES } })
    .select("_id")
    .lean();
  for (const u of societyUsers) {
    recipientIds.add(String(u._id));
  }

  for (const dept of BROADCAST_TEAM_DEPARTMENTS) {
    const deptUsers = await User.find({ accountType: dept })
      .populate("additionalDetails", "position p0")
      .select("_id additionalDetails")
      .lean();

    for (const u of deptUsers) {
      const position =
        u.additionalDetails?.position || u.additionalDetails?.p0 || "";
      const rank = getDepartmentRankFromPosition(position);
      if (rank === "Lead" || rank === "Head") {
        recipientIds.add(String(u._id));
      }
    }
  }

  return Array.from(recipientIds);
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
    const position =
      u.additionalDetails?.position || u.additionalDetails?.p0 || "";
    const rank = getDepartmentRankFromPosition(position);
    if (rank === "Lead" || rank === "Head") {
      recipientIds.add(String(u._id));
    }
  }

  return Array.from(recipientIds);
}

async function countAllMembers() {
  let total = 0;
  for (const dept of BROADCAST_TEAM_DEPARTMENTS) {
    try {
      total += await getTeamMemberModel(dept).countDocuments({ deletedAt: null });
    } catch (_) {}
  }
  return total;
}

async function countDepartmentMembers(department) {
  const dept = String(department || "").trim();
  if (!dept) return 0;
  try {
    return await getTeamMemberModel(dept).countDocuments({ deletedAt: null });
  } catch (_) {
    return 0;
  }
}

async function getBroadcastAudienceCounts(department) {
  const dept = String(department || "").trim();
  if (dept) {
    const members = await countDepartmentMembers(dept);
    const leadershipIds = await getInviteSubmissionRecipients(dept);
    return {
      members,
      users: leadershipIds.length,
      total: members + leadershipIds.length,
    };
  }

  const members = await countAllMembers();
  const leadershipIds = await getAllLeadershipRecipients();
  return { members, users: leadershipIds.length, total: members + leadershipIds.length };
}

async function createAndEmitBroadcastNotification({
  recipientId,
  type,
  titleStr,
  bodyStr,
  metadata,
  senderId,
  senderName,
  senderRole,
}) {
  const notification = await Notification.create({
    recipientId,
    type,
    title: titleStr,
    body: bodyStr,
    metadata,
    senderId,
    senderName,
    senderRole,
  });
  emitNotification(String(recipientId), {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    metadata: notification.metadata,
    senderId: notification.senderId,
    senderName: notification.senderName,
    senderRole: notification.senderRole,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    replies: [],
  });
  return notification;
}

async function sendLeadershipCopyOfMemberBroadcast({
  recipientIds,
  type,
  titleStr,
  bodyStr,
  baseMetadata,
  senderId,
  senderName,
  senderRole,
}) {
  const leadershipMetadata = {
    ...baseMetadata,
    sentToMembersOnly: true,
    audienceTag: "Sent to members only",
  };

  let sent = 0;
  for (const recipientId of recipientIds) {
    try {
      await createAndEmitBroadcastNotification({
        recipientId,
        type,
        titleStr,
        bodyStr,
        metadata: leadershipMetadata,
        senderId,
        senderName,
        senderRole,
      });
      sent++;
    } catch (_) {}
  }
  return sent;
}

async function notifyTeamInviteSubmission({
  department,
  memberName,
  memberId,
  senderId = "",
  senderName = "",
  senderRole = "System",
}) {
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
        senderId,
        senderName,
        senderRole,
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
        senderId: notification.senderId,
        senderName: notification.senderName,
        senderRole: notification.senderRole,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
        replies: [],
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
async function sendBroadcastToAllUsers({
  senderId = "",
  senderName = "",
  senderRole,
  title,
  body,
  metadata = {},
  broadcastGroupId: sharedGroupId,
  broadcastType = "users",
  recipientIds,
}) {
  const titleStr = String(title || "").trim();
  const bodyStr = String(body || "").trim();
  const broadcastGroupId = sharedGroupId || crypto.randomUUID();
  const baseMetadata = {
    ...metadata,
    senderRole: String(senderRole || ""),
    color: "pink",
    broadcastType,
    broadcastGroupId,
  };

  let userIds = Array.isArray(recipientIds)
    ? recipientIds.map(String).filter(Boolean)
    : null;

  if (!userIds) {
    userIds = await getAllLeadershipRecipients();
  }

  if (!userIds.length) return { sent: 0, total: 0 };

  let sent = 0;
  for (const userId of userIds) {
    try {
      await createAndEmitBroadcastNotification({
        recipientId: userId,
        type: "broadcast_users",
        titleStr,
        bodyStr,
        metadata: baseMetadata,
        senderId,
        senderName,
        senderRole,
      });
      sent++;
    } catch (_) {}
  }

  return { sent, total: userIds.length };
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
async function sendBroadcastToAllMembers({
  senderId = "",
  senderName = "",
  senderRole,
  title,
  body,
  metadata = {},
  broadcastGroupId: sharedGroupId,
  broadcastType = "members",
  skipLeadershipCopy = false,
}) {
  const titleStr = String(title || "").trim();
  const bodyStr = String(body || "").trim();
  const broadcastGroupId = sharedGroupId || crypto.randomUUID();
  const baseMetadata = {
    ...metadata,
    senderRole: String(senderRole || ""),
    color: "pink",
    broadcastType,
    broadcastGroupId,
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
      console.error(
        `sendBroadcastToAllMembers: failed to read ${dept}:`,
        err.message,
      );
    }
  }

  if (!memberIds.length && skipLeadershipCopy) {
    return { sent: 0, total: 0, leadershipSent: 0 };
  }

  let sent = 0;
  for (const memberId of memberIds) {
    try {
      await createAndEmitBroadcastNotification({
        recipientId: memberId,
        type: "broadcast_members",
        titleStr,
        bodyStr,
        metadata: baseMetadata,
        senderId,
        senderName,
        senderRole,
      });
      sent++;
    } catch (_) {}
  }

  let leadershipSent = 0;
  if (!skipLeadershipCopy && memberIds.length) {
    const leadershipIds = await getAllLeadershipRecipients();
    leadershipSent = await sendLeadershipCopyOfMemberBroadcast({
      recipientIds: leadershipIds,
      type: "broadcast_members",
      titleStr,
      bodyStr,
      baseMetadata,
      senderId,
      senderName,
      senderRole,
    });
  }

  return {
    sent,
    total: memberIds.length,
    leadershipSent,
  };
}

/**
 * Broadcast to members of ONE specific department.
 *
 * KEY FIX: Same as sendBroadcastToAllMembers — uses dept member _ids directly,
 * not email-to-User matching.
 */
async function sendBroadcastToDepartmentMembers({
  department,
  senderId = "",
  senderName = "",
  senderRole,
  title,
  body,
  metadata = {},
  broadcastGroupId: sharedGroupId,
  broadcastType = "department",
  skipLeadershipCopy = false,
}) {
  const dept = String(department || "").trim();
  if (!dept) return { sent: 0, total: 0, leadershipSent: 0 };

  const titleStr = String(title || "").trim();
  const bodyStr = String(body || "").trim();

  let members = [];
  try {
    members = await getTeamMemberModel(dept)
      .find({ deletedAt: null })
      .select("_id")
      .lean();
  } catch (err) {
    console.error(
      `sendBroadcastToDepartmentMembers: failed to read ${dept}:`,
      err.message,
    );
    return { sent: 0, total: 0, leadershipSent: 0 };
  }

  const broadcastGroupId = sharedGroupId || crypto.randomUUID();
  const baseMetadata = {
    ...metadata,
    senderRole: String(senderRole || ""),
    color: "pink",
    broadcastType,
    department: dept,
    broadcastGroupId,
  };

  let sent = 0;
  for (const member of members) {
    try {
      const memberId = String(member._id);
      await createAndEmitBroadcastNotification({
        recipientId: memberId,
        type: "broadcast_department",
        titleStr,
        bodyStr,
        metadata: baseMetadata,
        senderId,
        senderName,
        senderRole,
      });
      sent++;
    } catch (_) {}
  }

  let leadershipSent = 0;
  if (!skipLeadershipCopy && members.length) {
    const leadershipIds = await getInviteSubmissionRecipients(dept);
    leadershipSent = await sendLeadershipCopyOfMemberBroadcast({
      recipientIds: leadershipIds,
      type: "broadcast_department",
      titleStr,
      bodyStr,
      baseMetadata,
      senderId,
      senderName,
      senderRole,
    });
  }

  return { sent, total: members.length, leadershipSent };
}

/**
 * Broadcast to members AND heads/leads/core together (no "members only" tag).
 */
async function sendBroadcastToAll({
  department,
  senderId = "",
  senderName = "",
  senderRole,
  title,
  body,
  metadata = {},
}) {
  const dept = String(department || "").trim();
  const broadcastGroupId = crypto.randomUUID();
  const audience = await getBroadcastAudienceCounts(dept || null);

  if (!audience.total) {
    return { sent: 0, total: 0, members: { sent: 0, total: 0 }, users: { sent: 0, total: 0 } };
  }

  let memberResult = { sent: 0, total: 0 };
  let userResult = { sent: 0, total: 0 };

  if (dept) {
    memberResult = await sendBroadcastToDepartmentMembers({
      department: dept,
      senderId,
      senderName,
      senderRole,
      title,
      body,
      metadata,
      broadcastGroupId,
      broadcastType: "all",
      skipLeadershipCopy: true,
    });
    const leadershipIds = await getInviteSubmissionRecipients(dept);
    userResult = await sendBroadcastToAllUsers({
      senderId,
      senderName,
      senderRole,
      title,
      body,
      metadata: { ...metadata, department: dept },
      broadcastGroupId,
      broadcastType: "all",
      recipientIds: leadershipIds,
    });
  } else {
    memberResult = await sendBroadcastToAllMembers({
      senderId,
      senderName,
      senderRole,
      title,
      body,
      metadata,
      broadcastGroupId,
      broadcastType: "all",
      skipLeadershipCopy: true,
    });
    const leadershipIds = await getAllLeadershipRecipients();
    userResult = await sendBroadcastToAllUsers({
      senderId,
      senderName,
      senderRole,
      title,
      body,
      metadata,
      broadcastGroupId,
      broadcastType: "all",
      recipientIds: leadershipIds,
    });
  }

  return {
    sent: memberResult.sent + userResult.sent,
    total: audience.total,
    members: memberResult,
    users: userResult,
  };
}

async function notifyBlogSubmission({ post, author }) {
  try {
    // Use the fullName the author typed in the blog form as the display name.
    // Fall back to the account's first+last name if fullName is blank.
    const accountName = `${author.firstName} ${author.lastName}`.trim();
    const displayName = (post.fullName && post.fullName.trim()) ? post.fullName.trim() : accountName;

    const notificationTitle = "New Blog Submitted for Review";
    const notificationBody = `${displayName} submitted a blog for review: "${post.title}"`;

    // Build the approval redirect URL from the environment base URL
    const appBaseUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
    const approvalUrl = `${appBaseUrl}/blog/approval`;

    // --- In-app notifications: emit to ALL users in the User collection ---
    const BATCH = 100;
    const total = await User.countDocuments({});
    let skip = 0;

    while (skip < total) {
      const users = await User.find({}).select("_id email firstName lastName").skip(skip).limit(BATCH).lean();
      skip += BATCH;

      for (const user of users) {
        try {
          // Create in-app notification
          const notification = await Notification.create({
            recipientId: user._id,
            type: "blog_pending_approval",
            title: notificationTitle,
            body: notificationBody,
            senderId: author._id.toString(),
            senderName: displayName,
            senderRole: "author",
            metadata: {
              postId: post._id.toString(),
              title: post.title,
            },
          });

          emitNotification(String(user._id), {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            metadata: notification.metadata,
            senderId: notification.senderId,
            senderName: notification.senderName,
            senderRole: notification.senderRole,
            readAt: notification.readAt,
            createdAt: notification.createdAt,
            replies: [],
          });

          // Send Brevo email to this user
          const emailHtml = blogSubmissionReviewTemplate({
            authorName: displayName,
            postTitle: post.title,
            category: post.category || "",
            approvalUrl,
          });

          // Fire-and-forget per user — don't let one failure block the rest
          mailSender(user.email, notificationTitle, emailHtml).catch((err) =>
            console.error(`notifyBlogSubmission: email failed for ${user.email}:`, err.message),
          );
        } catch (userErr) {
          console.error("notifyBlogSubmission: user loop error:", userErr.message);
        }
      }
    }
  } catch (error) {
    console.error("notifyBlogSubmission error:", error);
  }
}

async function notifyBlogStatusChange({
  post,
  author,
  reviewer,
  action,
  feedback,
}) {
  try {
    const isApproved = action === "approve";
    const statusText = isApproved ? "approved" : "rejected";
    const title = `Blog Post ${isApproved ? "Approved" : "Rejected"}`;
    const body = `Your blog post "${post.title}" has been ${statusText} by ${reviewer.firstName} ${reviewer.lastName}.${feedback ? ` Feedback: "${feedback}"` : ""}`;

    // In-app notification for the author
    const notification = await Notification.create({
      recipientId: author._id,
      type: `blog_${statusText}`,
      title,
      body,
      senderId: reviewer._id.toString(),
      senderName: `${reviewer.firstName} ${reviewer.lastName}`,
      senderRole: reviewer.accountType || "reviewer",
      metadata: {
        postId: post._id.toString(),
        title: post.title,
        status: statusText,
        feedback: feedback || "",
      },
    });

    emitNotification(author._id, {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      metadata: notification.metadata,
      senderId: notification.senderId,
      senderName: notification.senderName,
      senderRole: notification.senderRole,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      replies: [],
    });

    // Send Brevo email — to the notifyEmail the author entered in the form
    const recipientEmail = post.notifyEmail || author.email;
    const reviewerName = `${reviewer.firstName} ${reviewer.lastName}`.trim();
    const authorName = `${author.firstName} ${author.lastName}`.trim();

    const emailHtml = blogStatusUpdateTemplate({
      authorName,
      postTitle: post.title,
      status: statusText,
      feedback: feedback || "",
      reviewerName,
    });

    await mailSender(recipientEmail, title, emailHtml);
  } catch (error) {
    console.error("notifyBlogStatusChange error:", error);
  }
}

module.exports = {
  setNotificationEmitter,
  emitNotification,
  getInviteSubmissionRecipients,
  getAllLeadershipRecipients,
  notifyTeamInviteSubmission,
  sendBroadcastToAllUsers,
  sendBroadcastToAllMembers,
  sendBroadcastToDepartmentMembers,
  sendBroadcastToAll,
  getBroadcastAudienceCounts,
  notifyBlogSubmission,
  notifyBlogStatusChange,
};
