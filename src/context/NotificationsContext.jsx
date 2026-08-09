import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/api";
import { subscribeNotifications } from "../services/socket";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /**
   * bubble: { show: boolean, senderRole: string, color: "pink" | "green" } | null
   * Shown for 2.5 s when a new notification arrives or on first load after login.
   */
  const [bubble, setBubble] = useState(null);
  const bubbleTimerRef = useRef(null);
  // Tracks whether we already showed the login bubble in this session
  const loginBubbleShownRef = useRef(false);

  const showBubble = useCallback((notif) => {
    if (!notif) return;
    const senderRole = notif.metadata?.senderRole || "";
    const color = notif.metadata?.color === "pink" ? "pink" : "green";
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    setBubble({ show: true, senderRole, color });
    bubbleTimerRef.current = setTimeout(() => {
      setBubble(null);
      bubbleTimerRef.current = null;
    }, 2500);
  }, []);

  const dismissBubble = useCallback(() => {
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    setBubble(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!user?._id) {
      setNotifications([]);
      setUnreadCount(0);
      loginBubbleShownRef.current = false;
      return;
    }
    setLoading(true);
    try {
      const res = await getNotifications();
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : [];
        setNotifications(list);
        const count = typeof res.unreadCount === "number" ? res.unreadCount : 0;
        setUnreadCount(count);

        // Show login bubble once per session if there are unread notifications
        if (count > 0 && !loginBubbleShownRef.current) {
          loginBubbleShownRef.current = true;
          const latestUnread = list.find((n) => !n.readAt);
          if (latestUnread) showBubble(latestUnread);
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user?._id, showBubble]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user?._id) return undefined;

    return subscribeNotifications((payload) => {
      if (!payload?._id) return;
      setNotifications((prev) => {
        if (prev.some((n) => n._id === payload._id)) return prev;
        return [payload, ...prev];
      });
      if (!payload.readAt) {
        setUnreadCount((c) => c + 1);
        // Show bubble for every real-time notification
        showBubble(payload);
      }
    });
  }, [user?._id, showBubble]);

  // Reset login-bubble flag when user changes
  useEffect(() => {
    loginBubbleShownRef.current = false;
  }, [user?._id]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || now })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refresh,
      markRead,
      markAllRead,
      bubble,
      dismissBubble,
    }),
    [notifications, unreadCount, loading, refresh, markRead, markAllRead, bubble, dismissBubble]
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
