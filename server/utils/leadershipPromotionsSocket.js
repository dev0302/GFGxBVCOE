const User = require("../models/User");
const {
  emitCollaboratorJoined,
  emitCollaboratorLeft,
  emitDraftUpdated,
} = require("./leadershipDraftBus");
const {
  getActiveDraftSession,
  upsertCollaborator,
  forceDiscardDraft,
  serializeSessionForClient,
} = require("../services/leadershipDraftService");
const { getUserApprovalInfo, resolveUserRoleLabel } = require("./leadershipApproval");

const DRAFT_ROOM = "leadership-promotions";
const promotionsPresence = new Map();

function getPresenceList() {
  return Array.from(promotionsPresence.values());
}

function emitPresenceToRoom(io) {
  const collaborators = getPresenceList();
  io.to(DRAFT_ROOM).emit("leadership-presence", { collaborators, at: Date.now() });
}

async function buildPresenceUser(socketUser) {
  const user = await User.findById(socketUser.id).populate("additionalDetails").lean();
  if (!user) {
    return {
      userId: socketUser.id,
      name: socketUser.name,
      image: socketUser.image || "",
      role: "",
      department: "",
    };
  }

  const approvalInfo = getUserApprovalInfo(user);
  return {
    userId: String(user._id),
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
    image: user.image || "",
    role: approvalInfo.role || resolveUserRoleLabel(user),
    department: approvalInfo.department || "",
  };
}

async function handleJoinLeadershipPromotions(socket, io) {
  socket.join(DRAFT_ROOM);
  const presenceUser = await buildPresenceUser(socket.user);
  promotionsPresence.set(socket.id, presenceUser);

  const session = await getActiveDraftSession();
  if (session && session.status === "DRAFT") {
    upsertCollaborator(session, presenceUser);
    await session.save();
    emitDraftUpdated(session);
  }

  emitPresenceToRoom(io);
  emitCollaboratorJoined(getPresenceList());

  socket.emit("leadership-draft-state", {
    session: session ? serializeSessionForClient(session) : null,
    collaborators: getPresenceList(),
  });
}

async function handleLeaveLeadershipPromotions(socket, io) {
  if (!promotionsPresence.has(socket.id)) return;

  promotionsPresence.delete(socket.id);
  socket.leave(DRAFT_ROOM);

  emitPresenceToRoom(io);
  emitCollaboratorLeft(getPresenceList());

  if (promotionsPresence.size === 0) {
    const session = await getActiveDraftSession();
    if (session && session.status === "DRAFT") {
      await forceDiscardDraft(session.sessionId, "Draft abandoned — no collaborators remain.");
    }
  }
}

module.exports = {
  DRAFT_ROOM,
  getPresenceList,
  handleJoinLeadershipPromotions,
  handleLeaveLeadershipPromotions,
};
