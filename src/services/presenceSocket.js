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
  if (!BASE) return null;

  if (socket) {
    const currentAuthToken = socket.auth?.token;
    if (token && currentAuthToken !== token) {
      socket.auth = { ...(socket.auth || {}), token };
      if (socket.connected) {
        socket.disconnect();
      }
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
    notifySubscribers();
  });

  socket.on("disconnect", () => {
    onlineUsersCache = [];
    notifySubscribers();
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

