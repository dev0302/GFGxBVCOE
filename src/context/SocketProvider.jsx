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

const ACTIVE_DRAFT_STATUSES = new Set(["DRAFT", "APPROVAL_PENDING", "READY_TO_APPLY"]);

function isActiveLeadershipSession(draft) {
  return Boolean(draft?.status && ACTIVE_DRAFT_STATUSES.has(draft.status));
}

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socketInstance, setSocketInstance] = useState(null);
  const [hasActiveLeadershipSession, setHasActiveLeadershipSession] = useState(false);

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
      setHasActiveLeadershipSession(false);
      return;
    }

    getLeadershipDraft()
      .then((res) => {
        setHasActiveLeadershipSession(isActiveLeadershipSession(res.success ? res.data : null));
      })
      .catch((err) => {
        console.error("Error fetching initial leadership session:", err);
      });

    const unsub = subscribeLeadershipUpdates((payload) => {
      if (!payload) return;
      if (payload.type === "draft-updated" || payload.type === "draft-created") {
        getLeadershipDraft()
          .then((res) => {
            setHasActiveLeadershipSession(isActiveLeadershipSession(res.success ? res.data : null));
          })
          .catch((err) => {
            console.error("Error refetching leadership session on update:", err);
          });
      } else if (payload.type === "draft-discarded" || payload.type === "changes-applied") {
        setHasActiveLeadershipSession(false);
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
      hasActiveLeadershipSession,
    }),
    [socketInstance, onlineUsers, hasActiveLeadershipSession]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketContext must be used within SocketProvider");
  return ctx;
}

