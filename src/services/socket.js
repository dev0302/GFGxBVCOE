import { io } from "socket.io-client";
import { getAuthToken } from "./api";

const BASE = import.meta.env.VITE_API_BASE_URL;

let socket = null;
const onlineUsersSubscribers = new Set();
const leadershipUpdateSubscribers = new Set();
const tenureEndedSubscribers = new Set();
let onlineUsersCache = [];
let leadershipUpdateCache = null;

function notifyOnlineUsers() {
  onlineUsersSubscribers.forEach((cb) => {
    try {
      cb(onlineUsersCache);
    } catch (_) {}
  });
}

function notifyLeadershipUpdates() {
  leadershipUpdateSubscribers.forEach((cb) => {
    try {
      cb(leadershipUpdateCache);
    } catch (_) {}
  });
}

export function connectSocket(tokenOverride) {
  const token = tokenOverride || getAuthToken();
  if (!BASE) return null;

  if (socket) {
    if (token && socket.auth?.token !== token) {
      socket.auth = { ...(socket.auth || {}), token };
      if (socket.connected) socket.disconnect();
      socket.connect();
    } else if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  socket = io(BASE, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    ...(token ? { auth: { token } } : {}),
  });

  socket.on("online-users", (users = []) => {
    if (!Array.isArray(users)) return;
    onlineUsersCache = users;
    notifyOnlineUsers();
  });

  socket.on("leadership-transition-update", (payload = {}) => {
    leadershipUpdateCache = payload;
    notifyLeadershipUpdates();
    notifyDraftEvent("leadership-transition-update", payload);
  });

  socket.on("tenure-ended", (payload = {}) => {
    tenureEndedSubscribers.forEach((cb) => {
      try {
        cb(payload);
      } catch (_) {}
    });
  });

  socket.on("disconnect", () => {
    onlineUsersCache = [];
    notifyOnlineUsers();
  });

  socket.on("connect_error", () => {
    const latestToken = getAuthToken();
    if (latestToken && socket && socket.auth?.token !== latestToken) {
      socket.auth = { ...(socket.auth || {}), token: latestToken };
      socket.connect();
    }
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function updateSocketToken(token) {
  if (!token) return;
  if (!socket) {
    connectSocket(token);
    return;
  }
  if (socket.auth?.token === token && socket.connected) return;
  socket.auth = { ...(socket.auth || {}), token };
  if (socket.connected) socket.disconnect();
  socket.connect();
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  onlineUsersCache = [];
  notifyOnlineUsers();
}

export function subscribeOnlineUsers(callback) {
  if (typeof callback !== "function") return () => {};
  onlineUsersSubscribers.add(callback);
  callback(onlineUsersCache);
  return () => onlineUsersSubscribers.delete(callback);
}

export function subscribeLeadershipUpdates(callback) {
  if (typeof callback !== "function") return () => {};
  leadershipUpdateSubscribers.add(callback);
  if (leadershipUpdateCache) callback(leadershipUpdateCache);
  return () => leadershipUpdateSubscribers.delete(callback);
}

export function subscribeTenureEnded(callback) {
  if (typeof callback !== "function") return () => {};
  tenureEndedSubscribers.add(callback);
  return () => tenureEndedSubscribers.delete(callback);
}

export function joinDashboard(payload = {}) {
  if (!socket) return;
  socket.emit("join-dashboard", payload);
}

const draftEventSubscribers = new Map();
let draftStateCache = null;
let presenceCache = [];

function notifyDraftEvent(event, payload) {
  const subs = draftEventSubscribers.get(event);
  if (subs) {
    subs.forEach((cb) => {
      try {
        cb(payload);
      } catch (_) {}
    });
  }
  const allSubs = draftEventSubscribers.get("*");
  if (allSubs) {
    allSubs.forEach((cb) => {
      try {
        cb({ event, ...payload });
      } catch (_) {}
    });
  }
}

function wireDraftSocketEvents(sock) {
  const draftEvents = [
    "draft-created",
    "draft-updated",
    "collaborator-joined",
    "collaborator-left",
    "approval-added",
    "approval-removed",
    "draft-discarded",
    "changes-applied",
    "leadership-presence",
    "leadership-draft-state",
  ];

  draftEvents.forEach((event) => {
    sock.off(event);
    sock.on(event, (payload = {}) => {
      if (event === "leadership-draft-state") {
        draftStateCache = payload.session || null;
        presenceCache = payload.collaborators || [];
      }
      if (event === "leadership-presence") {
        presenceCache = payload.collaborators || [];
      }
      if (payload.session !== undefined) {
        draftStateCache = payload.session;
      }
      notifyDraftEvent(event, payload);
    });
  });
}

export function joinLeadershipPromotions() {
  const sock = connectSocket();
  if (!sock) return;
  wireDraftSocketEvents(sock);
  sock.emit("join-leadership-promotions");
}

export function leaveLeadershipPromotions() {
  if (!socket) return;
  socket.emit("leave-leadership-promotions");
}

export function subscribeLeadershipDraftEvents(callback, event = "*") {
  if (typeof callback !== "function") return () => {};
  if (!draftEventSubscribers.has(event)) {
    draftEventSubscribers.set(event, new Set());
  }
  draftEventSubscribers.get(event).add(callback);

  if (event === "*" || event === "leadership-draft-state") {
    if (draftStateCache !== null || presenceCache.length) {
      callback({ event: "leadership-draft-state", session: draftStateCache, collaborators: presenceCache });
    }
  }
  if (event === "leadership-presence" && presenceCache.length) {
    callback({ collaborators: presenceCache });
  }

  return () => draftEventSubscribers.get(event)?.delete(callback);
}

export function getLeadershipDraftCache() {
  return draftStateCache;
}

export function getLeadershipPresenceCache() {
  return presenceCache;
}

