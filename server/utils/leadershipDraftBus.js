let ioInstance = null;

function setDraftIo(io) {
  ioInstance = io;
}

const DRAFT_ROOM = "leadership-promotions";

function emitToDraftRoom(event, payload = {}) {
  if (!ioInstance) return;
  ioInstance.to(DRAFT_ROOM).emit(event, { ...payload, at: Date.now() });
}

function emitDraftCreated(session) {
  emitToDraftRoom("draft-created", { session: serializeSessionForClient(session) });
  emitToDraftRoom("leadership-transition-update", { type: "draft-created" });
}

function emitDraftUpdated(session, extra = {}) {
  emitToDraftRoom("draft-updated", {
    session: serializeSessionForClient(session),
    ...extra,
  });
  emitToDraftRoom("leadership-transition-update", { type: "draft-updated" });
}

function emitCollaboratorJoined(collaborators) {
  emitToDraftRoom("collaborator-joined", { collaborators });
}

function emitCollaboratorLeft(collaborators) {
  emitToDraftRoom("collaborator-left", { collaborators });
}

function emitLeadershipPresence(collaborators) {
  emitToDraftRoom("leadership-presence", { collaborators });
}

function emitApprovalAdded(session) {
  emitToDraftRoom("approval-added", { session: serializeSessionForClient(session) });
  emitToDraftRoom("draft-updated", { session: serializeSessionForClient(session) });
}

function emitApprovalRemoved(session) {
  emitToDraftRoom("approval-removed", { session: serializeSessionForClient(session) });
  emitToDraftRoom("draft-updated", { session: serializeSessionForClient(session) });
}

function emitDraftDiscarded(sessionId, reason = "") {
  emitToDraftRoom("draft-discarded", { sessionId, reason });
  emitToDraftRoom("leadership-transition-update", { type: "draft-discarded" });
}

function emitChangesApplied(session) {
  emitToDraftRoom("changes-applied", { session: serializeSessionForClient(session) });
  emitToDraftRoom("leadership-transition-update", { type: "changes-applied" });
}

function serializeSessionForClient(session) {
  if (!session) return null;
  const doc = session.toObject ? session.toObject() : session;
  return {
    _id: String(doc._id),
    sessionId: doc.sessionId,
    status: doc.status,
    createdBy: doc.createdBy ? String(doc.createdBy) : null,
    createdByName: doc.createdByName || "",
    collaborators: doc.collaborators || [],
    pendingChanges: (doc.pendingChanges || []).map((c) => ({
      id: String(c._id),
      changeType: c.changeType,
      personType: c.personType,
      personId: c.personId,
      sourceDepartment: c.sourceDepartment || "",
      targetPositionId: c.targetPositionId || "",
      personName: c.personName || "",
      personEmail: c.personEmail || "",
      personImage: c.personImage || "",
      previousRole: c.previousRole || "",
      newRole: c.newRole || "",
      newDepartment: c.newDepartment || "",
      previousDepartment: c.previousDepartment || "",
      addedByName: c.addedByName || "",
      addedAt: c.addedAt,
    })),
    approvals: doc.approvals || [],
    finalizedBy: doc.finalizedBy ? String(doc.finalizedBy) : null,
    finalizedByName: doc.finalizedByName || "",
    appliedBy: doc.appliedBy ? String(doc.appliedBy) : null,
    appliedByName: doc.appliedByName || "",
    appliedAt: doc.appliedAt,
    reportPdfPath: doc.reportPdfPath || "",
    documentHash: doc.documentHash || "",
    version: doc.version || "1.0.0",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

module.exports = {
  DRAFT_ROOM,
  setDraftIo,
  emitDraftCreated,
  emitDraftUpdated,
  emitCollaboratorJoined,
  emitCollaboratorLeft,
  emitLeadershipPresence,
  emitApprovalAdded,
  emitApprovalRemoved,
  emitDraftDiscarded,
  emitChangesApplied,
  serializeSessionForClient,
};
