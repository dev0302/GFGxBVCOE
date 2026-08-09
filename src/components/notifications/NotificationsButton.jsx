import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, UserPlus, Radio } from "react-feather";
import { useNotifications } from "../../context/NotificationsContext";

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Resolve per-notification colour theme: pink for broadcasts, green for others */
function notifColor(n) {
  return n?.metadata?.color === "pink" ? "pink" : "green";
}

function isBroadcast(n) {
  return (
    n?.type === "broadcast_users" ||
    n?.type === "broadcast_members" ||
    n?.type === "broadcast_department"
  );
}

/** Badge colour is pink if the latest unread notification is a broadcast, otherwise green */
function badgeColor(notifications) {
  const latestUnread = notifications.find((n) => !n.readAt);
  if (!latestUnread) return "green";
  return notifColor(latestUnread);
}

export default function NotificationsButton({
  className = "",
  iconClassName = "h-[18px] w-[18px]",
  onBeforeToggle,
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState(null);
  const [bubblePlacement, setBubblePlacement] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const buttonRef = useRef(null);
  const { notifications, unreadCount, loading, refresh, markRead, markAllRead, bubble, dismissBubble } =
    useNotifications();

  // Gate all portals until after first mount (avoids SSR / hydration mismatch)
  useEffect(() => { setIsMounted(true); }, []);

  const bColor = badgeColor(notifications);

  const handleToggle = () => {
    onBeforeToggle?.();
    dismissBubble();
    const next = !open;
    setOpen(next);
    if (next) refresh();
  };

  // Panel placement
  useEffect(() => {
    if (!open) {
      setPlacement(null);
      return;
    }

    const update = () => {
      const el = buttonRef.current;
      if (!el) return;

      const r = el.getBoundingClientRect();
      const width = 320;
      let left = r.left + r.width / 2 - width / 2;
      const gap = 8;
      const maxH = 380;
      let top = r.bottom + gap;

      if (top + maxH > window.innerHeight - 8) {
        top = Math.max(8, r.top - maxH - gap);
      }

      left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
      setPlacement({ top, left, width });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  // Bubble placement — position it below/near the bell
  useEffect(() => {
    if (!bubble?.show) {
      setBubblePlacement(null);
      return;
    }
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const bubbleW = 220;
    let left = r.right - bubbleW;
    left = Math.min(Math.max(8, left), window.innerWidth - bubbleW - 8);
    setBubblePlacement({ top: r.bottom + 10, left });
  }, [bubble?.show]);

  const pinkBadge =
    "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(236,72,153,0.55)]";
  const greenBadge =
    "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-500 px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(34,197,94,0.5)]";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-label={`Open notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        title="Notifications"
        className={`relative ${className}`}
      >
        <Bell className={iconClassName} />
        {unreadCount > 0 && (
          <span className={bColor === "pink" ? pinkBadge : greenBadge}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Animated notification bubble — appears near bell on login / real-time arrival */}
      {isMounted &&
        createPortal(
          <AnimatePresence>
            {bubble?.show && bubblePlacement && (
              <motion.div
                key="notif-bubble"
                role="status"
                aria-live="polite"
                style={{ top: bubblePlacement.top, left: bubblePlacement.left, width: 220 }}
                initial={{ opacity: 0, y: -8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className={`pointer-events-none fixed z-[400] flex items-center gap-2 rounded-2xl border px-3 py-2.5 shadow-xl backdrop-blur-sm ${
                  bubble.color === "pink"
                    ? "border-pink-400/30 bg-gradient-to-br from-[#2a0f1a]/95 via-[#1e1e2f]/95 to-[#1a0f22]/95"
                    : "border-green-400/30 bg-gradient-to-br from-[#0a1414]/95 via-[#1e1e2f]/95 to-[#0f1a18]/95"
                }`}
              >
                {/* Animated glow dot */}
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                      bubble.color === "pink" ? "bg-pink-400" : "bg-green-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                      bubble.color === "pink" ? "bg-pink-500" : "bg-green-500"
                    }`}
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-richblack-25 leading-tight">
                    🔔 New notification
                  </p>
                  {bubble.senderRole ? (
                    <p className={`text-[9px] leading-snug font-medium ${bubble.color === "pink" ? "text-pink-300" : "text-green-300"}`}>
                      from {bubble.senderRole}
                    </p>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Notification panel */}
      {isMounted &&
        createPortal(
          <AnimatePresence>
            {open && placement && (
              <>
                <motion.button
                  key="notifications-backdrop"
                  type="button"
                  aria-label="Close notifications"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="pointer-events-auto fixed inset-0 z-[300] bg-black/35"
                  data-notifications-panel
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  key="notifications-panel"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="notifications-title"
                  style={{
                    top: placement.top,
                    left: placement.left,
                    width: placement.width,
                  }}
                  initial={{ opacity: 0, scale: 0.94, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-auto fixed z-[301] flex max-h-[min(380px,58vh)] flex-col overflow-hidden rounded-2xl border border-green-300/20 bg-gradient-to-br from-[#0a1414] via-[#1e1e2f] to-[#0f1a18] shadow-xl shadow-black/40"
                  data-notifications-panel
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-pink-500/10 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl" />

                  <div className="relative z-[1] shrink-0 border-b border-white/10 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 pr-1">
                        <h2
                          id="notifications-title"
                          className="font-montserrat text-xs font-bold text-richblack-25"
                        >
                          Notifications
                        </h2>
                        <p className=" i-fonts mt-0.5 text-[9px] leading-snug text-gray-400">
                          {unreadCount > 0
                            ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                            : "Updates and activity alerts"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllRead}
                            className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[9px] font-medium text-gray-300 transition hover:bg-white/10"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setOpen(false)}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-medium text-gray-300 transition hover:bg-white/10"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    data-lenis-prevent="true"
                    className="i-fonts relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-1.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20"
                    style={{ WebkitOverflowScrolling: "touch" }}
                    onWheel={(e) => e.stopPropagation()}
                  >
                    {loading && notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-gray-500">Loading…</p>
                    ) : notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-gray-500">
                        No notifications yet.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {notifications.map((n) => {
                          const isUnread = !n.readAt;
                          const color = notifColor(n);
                          const broadcast = isBroadcast(n);

                          // Per-notification colour tokens
                          const borderCls = isUnread
                            ? color === "pink"
                              ? "border-pink-300/25 bg-pink-500/8 hover:bg-pink-500/12"
                              : "border-green-300/25 bg-green-500/8 hover:bg-green-500/12"
                            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]";

                          const iconBgCls = isUnread
                            ? color === "pink"
                              ? "bg-pink-500/20 text-pink-300"
                              : "bg-green-500/20 text-green-300"
                            : "bg-white/5 text-gray-400";

                          const dotCls = isUnread
                            ? color === "pink"
                              ? "bg-pink-400"
                              : "bg-green-400"
                            : "";

                          return (
                            <li key={n._id}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isUnread) markRead(n._id);
                                }}
                                className={`w-full rounded-xl border px-2.5 py-2 text-left transition ${borderCls}`}
                              >
                                <div className="flex items-start gap-2">
                                  <span
                                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconBgCls}`}
                                  >
                                    {broadcast ? (
                                      <Radio className="h-3 w-3" />
                                    ) : (
                                      <UserPlus className="h-3 w-3" />
                                    )}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    {n.title && (
                                      <p className={`text-[10px] font-bold leading-snug mb-0.5 ${isUnread ? (color === "pink" ? "text-pink-200" : "text-green-200") : "text-gray-400"}`}>
                                        {n.title}
                                      </p>
                                    )}
                                    <p
                                      className={`text-[11px] leading-snug ${
                                        isUnread ? "font-semibold text-gray-100" : "text-gray-300"
                                      }`}
                                    >
                                      {n.body}
                                    </p>
                                    {n.metadata?.senderRole && (
                                      <p className={`mt-0.5 text-[9px] font-medium ${color === "pink" ? "text-pink-400" : "text-green-400"}`}>
                                        from {n.metadata.senderRole}
                                      </p>
                                    )}
                                    <p className="mt-0.5 text-[9px] text-gray-500">
                                      {formatRelativeTime(n.createdAt)}
                                    </p>
                                  </div>
                                  {isUnread && (
                                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotCls}`} />
                                  )}
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
