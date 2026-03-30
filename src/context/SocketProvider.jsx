import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { getAuthToken } from "../services/api";
import {
  connectSocket,
  disconnectSocket,
  joinDashboard,
  subscribeOnlineUsers,
  updateSocketToken,
  getSocket,
} from "../services/socket";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    if (!user?._id) {
      disconnectSocket();
      setOnlineUsers([]);
      setSocketInstance(null);
      return;
    }
    const token = getAuthToken();
    if (token) {
      const sock = connectSocket(token);
      setSocketInstance(sock || getSocket());
    } else {
      setSocketInstance(getSocket());
    }
    joinDashboard({ page: "global" });
    const unsub = subscribeOnlineUsers((users = []) => {
      if (Array.isArray(users)) setOnlineUsers(users);
    });
    return () => unsub?.();
  }, [user?._id]);

  useEffect(() => {
    if (user?.token) {
      updateSocketToken(user.token);
      setSocketInstance(getSocket());
    }
  }, [user?.token]);

  const value = useMemo(
    () => ({
      socket: socketInstance,
      onlineUsers,
      joinDashboard,
      getSocket,
    }),
    [socketInstance, onlineUsers]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketContext must be used within SocketProvider");
  return ctx;
}

