import {
  connectSocket,
  disconnectSocket,
  subscribeOnlineUsers as subscribeUsers,
  updateSocketToken,
} from "./socket";

export function connectPresenceSocket(tokenOverride) {
  return connectSocket(tokenOverride);
}

export function updatePresenceSocketToken(token) {
  updateSocketToken(token);
}

export function disconnectPresenceSocket() {
  disconnectSocket();
}

export function subscribeOnlineUsers(callback) {
  return subscribeUsers(callback);
}

