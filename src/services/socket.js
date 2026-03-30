import { io } from "socket.io-client";
import { getAuthToken } from "./api";

const BASE = import.meta.env.VITE_API_BASE_URL;

let socket = null;
const onlineUsersSubscribers = new Set();
let onlineUsersCache = [];

function notifyOnlineUsers() {
  onlineUsersSubscribers.forEach((cb) => {
    try {
      cb(onlineUsersCache);
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

export function joinDashboard(payload = {}) {
  if (!socket) return;
  socket.emit("join-dashboard", payload);
}

