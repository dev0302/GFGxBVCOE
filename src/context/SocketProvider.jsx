import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { getAuthToken, getLeadershipDraft, userCanAccessLeadershipTransition } from "../services/api";
import {
  connectSocket,
  disconnectSocket,
  joinDashboard,
  subscribeOnlineUsers,
  subscribeLeadershipUpdates,
  updateSocketToken,
  getSocket,
} from "../services/socket";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socketInstance, setSocketInstance] = useState(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

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

  useEffect(() => {
    if (!user?._id || !userCanAccessLeadershipTransition(user)) {
      setHasPendingChanges(false);
      return;
    }

    // Load initial status
    getLeadershipDraft()
      .then((res) => {
        if (res.success && res.data) {
          const count = res.data.pendingChanges?.length ?? 0;
          setHasPendingChanges(count > 0);
        } else {
          setHasPendingChanges(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching initial draft changes count:", err);
      });

    // Realtime changes listener
    const unsub = subscribeLeadershipUpdates((payload) => {
      if (!payload) return;
      if (payload.type === "draft-updated" || payload.type === "draft-created") {
        getLeadershipDraft()
          .then((res) => {
            if (res.success && res.data) {
              const count = res.data.pendingChanges?.length ?? 0;
              setHasPendingChanges(count > 0);
            } else {
              setHasPendingChanges(false);
            }
          })
          .catch((err) => {
            console.error("Error refetching draft changes on update:", err);
          });
      } else if (payload.type === "draft-discarded" || payload.type === "changes-applied") {
        setHasPendingChanges(false);
      }
    });

    return () => unsub?.();
  }, [user?._id]);

  const value = useMemo(
    () => ({
      socket: socketInstance,
      onlineUsers,
      joinDashboard,
      getSocket,
      hasPendingChanges,
    }),
    [socketInstance, onlineUsers, hasPendingChanges]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketContext must be used within SocketProvider");
  return ctx;
}

