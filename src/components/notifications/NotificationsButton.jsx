import { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, UserPlus } from "react-feather";
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

export default function NotificationsButton({
  className = "",
  iconClassName = "h-[18px] w-[18px]",
  onBeforeToggle,
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState(null);
  const buttonRef = useRef(null);
  const { notifications, unreadCount, loading, refresh, markRead, markAllRead } =
    useNotifications();

  const handleToggle = () => {
    onBeforeToggle?.();
    const next = !open;
    setOpen(next);
    if (next) refresh();
  };

  useLayoutEffect(() => {
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
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-500 px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(34,197,94,0.5)]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {typeof document !== "undefined" &&
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
                  <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-green-500/15 blur-3xl" />
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
                        <p className="mt-0.5 text-[9px] leading-snug text-gray-400">
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
                            className="rounded-full border border-green-300/25 bg-green-500/10 px-2 py-0.5 text-[9px] font-medium text-green-300 transition hover:bg-green-500/20"
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
                    className="relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-1.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-green-500/30"
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
                          return (
                            <li key={n._id}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isUnread) markRead(n._id);
                                }}
                                className={`w-full rounded-xl border px-2.5 py-2 text-left transition ${
                                  isUnread
                                    ? "border-green-300/25 bg-green-500/8 hover:bg-green-500/12"
                                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <span
                                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                      isUnread
                                        ? "bg-green-500/20 text-green-300"
                                        : "bg-white/5 text-gray-400"
                                    }`}
                                  >
                                    <UserPlus className="h-3 w-3" />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className={`text-[11px] leading-snug ${
                                        isUnread ? "font-semibold text-gray-100" : "text-gray-300"
                                      }`}
                                    >
                                      {n.body}
                                    </p>
                                    <p className="mt-0.5 text-[9px] text-gray-500">
                                      {formatRelativeTime(n.createdAt)}
                                    </p>
                                  </div>
                                  {isUnread && (
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
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
