import { io } from "socket.io-client";
import { getAuthToken } from "./api";

const BASE = import.meta.env.VITE_API_BASE_URL;

let socket = null;
let onlineUsersCache = [];
const subscribers = new Set();

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try {
      cb(onlineUsersCache);
    } catch (_) {}
  });
}

export function connectPresenceSocket() {
  const token = getAuthToken();
  if (!token || !BASE) return null;

  if (socket) return socket;

  socket = io(BASE, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    auth: { token },
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  socket.on("online-users", (users = []) => {
    if (!Array.isArray(users)) return;
    onlineUsersCache = users;
    notifySubscribers();
  });

  socket.on("disconnect", () => {
    onlineUsersCache = [];
    notifySubscribers();
  });

  return socket;
}

export function disconnectPresenceSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  onlineUsersCache = [];
  notifySubscribers();
}

export function subscribeOnlineUsers(callback) {
  if (typeof callback !== "function") return () => {};
  subscribers.add(callback);
  callback(onlineUsersCache);
  return () => subscribers.delete(callback);
}

