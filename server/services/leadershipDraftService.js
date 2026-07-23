const LeadershipDraftSession = require("../models/LeadershipDraftSession");
const User = require("../models/User");
const { logActivity } = require("../utils/activityLog");
const {
  buildPromotionPreview,
  buildEndSessionPreview,
  applyPromotionChange,
  applyEndSessionChange,
} = require("../services/leadershipApplyService");
const { generateLeadershipReportPdf } = require("../utils/leadershipReportPdf");
const mailSender = require("../utils/mailSender");
const {
  promotionExistingUserTemplate,
  promotionNewUserTemplate,
  tenureEndTemplate,
} = require("../mail/templates");
const {
  emitDraftCreated,
  emitDraftUpdated,
  emitDraftDiscarded,
  emitChangesApplied,
  emitApprovalAdded,
  emitApprovalRemoved,
  serializeSessionForClient,
} = require("../utils/leadershipDraftBus");

const {
  getUserApprovalInfo,
  checkApprovalsComplete,
  serializeApprovalStatus,
} = require("../utils/leadershipApproval");
const { userCanAccessLeadershipTransition } = require("../utils/leadershipAccess");

const ACTIVE_STATUSES = ["DRAFT", "APPROVAL_PENDING", "READY_TO_APPLY"];

async function resolveActor(user) {
  const id = user?.id || user?._id;
  if (!id) return { id: null, name: "Unknown" };
  const doc = await User.findById(id).select("firstName lastName email").lean();
  if (!doc) return { id: String(id), name: "Unknown" };
  const name = `${doc.firstName || ""} ${doc.lastName || ""}`.trim() || doc.email || "Unknown";
  return { id: String(id), name };
}

async function generateSessionId() {
  const year = new Date().getFullYear();
  const count = await LeadershipDraftSession.countDocuments({
    createdAt: { $gte: new Date(`${year}-01-01T00:00:00.000Z`) },
  });
  return `LT-${year}-${String(count + 1).padStart(3, "0")}`;
}

async function getActiveDraftSession() {
  return LeadershipDraftSession.findOne({ status: { $in: ACTIVE_STATUSES } }).sort({
    updatedAt: -1,
  });
}

async function getOrCreateActiveDraft(user) {
  let session = await getActiveDraftSession();
  const actor = await resolveActor(user);

  if (session) return session;

  const sessionId = await generateSessionId();
  session = await LeadershipDraftSession.create({
    sessionId,
    status: "DRAFT",
    createdBy: actor.id,
    createdByName: actor.name,
    collaborators: [],
    pendingChanges: [],
    approvals: [],
  });

  emitDraftCreated(session);
  return session;
}

function upsertCollaborator(session, collaborator) {
  const userId = String(collaborator.userId);
  const existing = session.collaborators.find((c) => c.userId === userId);
  if (existing) {
    existing.name = collaborator.name || existing.name;
    existing.image = collaborator.image || existing.image;
    existing.role = collaborator.role || existing.role;
    existing.department = collaborator.department || existing.department;
  } else {
    session.collaborators.push({
      userId,
      name: collaborator.name || "",
      image: collaborator.image || "",
      role: collaborator.role || "",
      department: collaborator.department || "",
      joinedAt: new Date(),
    });
  }
}

async function addPromotionToDraft(user, payload) {
  const preview = await buildPromotionPreview(payload);
  const actor = await resolveActor(user);
  const session = await getOrCreateActiveDraft(user);

  if (session.status !== "DRAFT") {
    throw new Error("Cannot add changes while session is awaiting approval.");
  }

  const duplicate = session.pendingChanges.find(
    (c) =>
      c.personType === preview.personType &&
      c.personId === preview.personId &&
      c.changeType !== "end_session"
  );
  if (duplicate) {
    duplicate.changeType = preview.changeType;
    duplicate.targetPositionId = preview.targetPositionId;
    duplicate.previousRole = preview.previousRole;
    duplicate.newRole = preview.newRole;
    duplicate.newDepartment = preview.newDepartment;
    duplicate.previousDepartment = preview.previousDepartment;
    duplicate.personImage = preview.personImage || duplicate.personImage;
    duplicate.addedBy = actor.id;
    duplicate.addedByName = actor.name;
    duplicate.addedAt = new Date();
  } else {
    session.pendingChanges.push({
      ...preview,
      addedBy: actor.id,
      addedByName: actor.name,
    });
  }

  await session.save();
  emitDraftUpdated(session);
  return session;
}

async function addEndSessionToDraft(user, payload) {
  const preview = await buildEndSessionPreview(payload);
  const actor = await resolveActor(user);
  const session = await getOrCreateActiveDraft(user);

  if (session.status !== "DRAFT") {
    throw new Error("Cannot add changes while session is awaiting approval.");
  }

  const exists = session.pendingChanges.some(
    (c) => c.personType === preview.personType && c.personId === preview.personId
  );
  if (exists) {
    throw new Error("This person already has a pending change in the draft session.");
  }

  session.pendingChanges.push({
    ...preview,
    addedBy: actor.id,
    addedByName: actor.name,
  });

  await session.save();
  emitDraftUpdated(session);
  return session;
}

async function removeChangeFromDraft(user, changeId) {
  const session = await getActiveDraftSession();
  if (!session) throw new Error("No active draft session.");
  if (session.status !== "DRAFT") {
    throw new Error("Cannot modify changes while session is awaiting approval.");
  }

  session.pendingChanges = session.pendingChanges.filter(
    (c) => String(c._id) !== String(changeId)
  );

  if (session.pendingChanges.length === 0) {
    return discardDraft(user, "All pending changes removed.");
  }

  await session.save();
  emitDraftUpdated(session);
  return session;
}

async function finalizeDraft(user) {
  const session = await getActiveDraftSession();
  const actor = await resolveActor(user);
  if (!session) throw new Error("No active draft session.");
  if (!session.pendingChanges.length) {
    throw new Error("Add at least one change before finalizing.");
  }
  if (session.status !== "DRAFT") {
    throw new Error("Session is already in approval.");
  }

  session.status = "APPROVAL_PENDING";
  session.finalizedBy = actor.id;
  session.finalizedByName = actor.name;
  session.approvals = [];
  await session.save();
  emitDraftUpdated(session, { finalized: true });
  return session;
}

async function addApproval(user) {
  const session = await getActiveDraftSession();
  if (!session) throw new Error("No active draft session.");
  if (!["APPROVAL_PENDING", "READY_TO_APPLY"].includes(session.status)) {
    throw new Error("Session is not awaiting approvals.");
  }

  const fullUser = await User.findById(user.id).populate("additionalDetails").lean();
  const approvalInfo = getUserApprovalInfo(fullUser || user);
  const hasLeadershipAccess = await userCanAccessLeadershipTransition(
    user.id,
    fullUser?.accountType || user.accountType,
    fullUser?.additionalDetails
  );
  if (!hasLeadershipAccess) {
    throw new Error("Leadership Transition access is not granted for your account.");
  }

  // A delegated user has the same transition authority as a default role. They
  // count as the department-side approval when they do not hold a core role.
  // This deliberately depends only on feature access, never on whether the
  // approver is also included in the draft's promotion list.
  const approvalCategory = approvalInfo.category || "department";

  session.approvals = session.approvals.filter((a) => a.userId !== String(user.id));

  const existingCategory = session.approvals.find((a) => a.category === approvalCategory);
  if (existingCategory) {
    throw new Error(
      `A ${approvalCategory === "core" ? "core" : "department"} approval has already been recorded.`
    );
  }

  session.approvals.push({
    userId: String(user.id),
    name: `${fullUser.firstName || ""} ${fullUser.lastName || ""}`.trim() || fullUser.email,
    image: fullUser.image || "",
    role: approvalInfo.role,
    department: approvalInfo.department,
    category: approvalCategory,
    approvedAt: new Date(),
  });

  const approvalStatus = checkApprovalsComplete(session.approvals);
  session.status = approvalStatus.complete ? "READY_TO_APPLY" : "APPROVAL_PENDING";
  await session.save();
  emitApprovalAdded(session);
  return { session, approvalStatus: serializeApprovalStatus(session.approvals) };
}

async function removeApproval(user) {
  const session = await getActiveDraftSession();
  if (!session) throw new Error("No active draft session.");
  if (!["APPROVAL_PENDING", "READY_TO_APPLY"].includes(session.status)) {
    throw new Error("Session is not in approval phase.");
  }

  session.approvals = session.approvals.filter((a) => a.userId !== String(user.id));
  session.status = "APPROVAL_PENDING";
  await session.save();
  emitApprovalRemoved(session);
  return session;
}

async function discardDraft(user, reason = "Draft discarded.") {
  const session = await getActiveDraftSession();
  if (!session) return null;

  const actor = await resolveActor(user);
  const isCreator =
    session.createdBy && String(session.createdBy) === String(actor.id);

  if (session.status === "APPROVAL_PENDING" || session.status === "READY_TO_APPLY") {
    if (!isCreator) {
      throw new Error(
        "Only the session creator can discard a session that has entered the approval process."
      );
    }
  }

  session.status = "DISCARDED";
  session.discardReason = reason;
  await session.save();

  if (user?.id) {
    await logActivity(user.id, "leadership_draft_discarded", "leadership_transition", {
      sessionId: session.sessionId,
      reason,
    }, session._id, "LeadershipDraftSession");
  }

  emitDraftDiscarded(session.sessionId, reason);
  return session;
}

async function forceDiscardDraft(sessionId, reason = "Draft abandoned.") {
  const session = await LeadershipDraftSession.findOne({
    sessionId,
    status: { $in: ACTIVE_STATUSES },
  });
  if (!session) return null;

  if (session.status === "APPROVAL_PENDING" || session.status === "READY_TO_APPLY") {
    return session;
  }

  session.status = "DISCARDED";
  session.discardReason = reason;
  await session.save();

  await logActivity(null, "leadership_draft_abandoned", "leadership_transition", {
    sessionId: session.sessionId,
    reason,
  }, session._id, "LeadershipDraftSession");

  emitDraftDiscarded(session.sessionId, reason);
  return session;
}

function getFrontendBaseUrl(req) {
  return (
    process.env.FRONTEND_URL ||
    req?.get?.("origin") ||
    req?.get?.("referer")?.replace(/\/[^/]*$/, "") ||
    "https://gfg-bvcoe.vercel.app"
  ).replace(/\/$/, "");
}

async function sendQueuedEmails(emailEntries, baseUrl) {
  const websiteUrl = baseUrl;
  const signupLink = `${baseUrl}/signup`;
  const results = [];

  for (const item of emailEntries) {
    const email = (item.email || "").trim().toLowerCase();
    if (!email) continue;

    if (item.emailType === "end_session") {
      const payload = item.farewellSnapshot
        ? { ...item.farewellSnapshot, websiteUrl }
        : {
            name: item.name || email,
            email,
            role: item.previousRole || "Member",
            department: item.tenureDepartment || "",
            websiteUrl,
            registered: Boolean(item.registered),
          };
      const subject = `A heartfelt farewell – Thank you, ${payload.name || "GFGian"}`;
      const html = tenureEndTemplate(payload);
      const sent = await mailSender(email, subject, html);
      results.push({ email, success: sent, emailType: "end_session" });
      continue;
    }

    const payload = {
      name: item.name || email,
      email,
      previousRole: item.previousRole || "Member",
      newRole: item.newRole || "",
      newDepartment: item.newDepartment || "",
      websiteUrl,
      signupLink,
    };

    const subject = item.registered
      ? `Congratulations on your promotion – ${item.newRole}`
      : `Welcome to GFG leadership – sign up as ${item.newRole}`;

    const html = item.registered
      ? promotionExistingUserTemplate(payload)
      : promotionNewUserTemplate(payload);

    const sent = await mailSender(email, subject, html);
    results.push({ email, success: sent, emailType: "promotion" });
  }

  return results;
}

async function applyDraftChanges(user, req) {
  const session = await getActiveDraftSession();
  const actor = await resolveActor(user);
  if (!session) throw new Error("No active draft session.");
  if (session.status !== "READY_TO_APPLY") {
    const status = serializeApprovalStatus(session.approvals);
    if (!status.complete) {
      throw new Error("Required approvals are not complete.");
    }
    session.status = "READY_TO_APPLY";
  }

  if (!session.pendingChanges.length) {
    throw new Error("No pending changes to apply.");
  }

  const emailEntries = [];
  const actorId = actor.id;

  for (const change of session.pendingChanges) {
    const changeObj = change.toObject ? change.toObject() : change;
    changeObj.draftSessionId = session.sessionId;

    if (changeObj.changeType === "end_session") {
      const emailEntry = await applyEndSessionChange(changeObj, actorId);
      emailEntries.push(emailEntry);
    } else {
      const emailEntry = await applyPromotionChange(changeObj, actorId);
      emailEntries.push(emailEntry);
    }
  }

  const baseUrl = getFrontendBaseUrl(req);
  const emailResults = await sendQueuedEmails(emailEntries, baseUrl);

  const appliedAt = new Date();
  session.effectiveDate = appliedAt;
  session.appliedAt = appliedAt;
  session.appliedBy = actor.id;
  session.appliedByName = actor.name;
  session.status = "APPLIED";

  const { filename, documentHash, reportPdfUrl } = await generateLeadershipReportPdf(session);
  session.reportPdfPath = filename;
  session.reportPdfUrl = reportPdfUrl || "";
  session.documentHash = documentHash;
  await session.save();

  await logActivity(
    actor.id,
    "leadership_session_applied",
    "leadership_transition",
    {
      sessionId: session.sessionId,
      changeCount: session.pendingChanges.length,
      approvals: session.approvals,
      collaborators: session.collaborators.map((c) => c.name),
      emailsSent: emailResults.filter((r) => r.success).length,
      emailsFailed: emailResults.filter((r) => !r.success).length,
      reportPdfPath: session.reportPdfPath,
      documentHash: session.documentHash,
    },
    session._id,
    "LeadershipDraftSession"
  );

  emitChangesApplied(session);

  return {
    session,
    emailResults,
    serialized: serializeSessionForClient(session),
  };
}

module.exports = {
  ACTIVE_STATUSES,
  generateSessionId,
  getActiveDraftSession,
  getOrCreateActiveDraft,
  upsertCollaborator,
  addPromotionToDraft,
  addEndSessionToDraft,
  removeChangeFromDraft,
  finalizeDraft,
  addApproval,
  removeApproval,
  discardDraft,
  forceDiscardDraft,
  applyDraftChanges,
  serializeSessionForClient,
  serializeApprovalStatus,
};
