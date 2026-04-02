import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  AUTH_DEPARTMENTS,
  fetchLastSeenFeed,
  getAccountTypeLabel,
  isSocietyRole,
  userCanManageEvents,
} from "../../services/api";
import { subscribeOnlineUsers } from "../../services/presenceSocket";
import { cloudinaryLargeAvatarUrl, cloudinaryTinyAvatarUrl } from "../../utils/cloudinary";
import {
  Calendar,
  ChevronDown,
  Clock,
  Grid,
  Layout,
  LogOut,
  User,
  Users,
} from "react-feather";

function formatLastSeenLabel(iso) {
  if (!iso) return "No visit logged yet";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return "Just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86_400) return `${Math.floor(sec / 3600)} hr ago`;
  if (sec < 604_800) return `${Math.floor(sec / 86_400)} days ago`;
  return d.toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const lastSeenListContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.035, delayChildren: 0.08 },
  },
};

const lastSeenListItem = {
  hidden: { opacity: 0, x: -10 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
};

function ProfileDropDown({
  onLogout,
  isDarkNavbar,
  avatarOnly = false,
  alignLeft = false,
  showChevron = false,
  onBeforeToggle,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [deptFlyoutOpen, setDeptFlyoutOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [lastSeenOpen, setLastSeenOpen] = useState(false);
  const [lastSeenRows, setLastSeenRows] = useState([]);
  const [lastSeenLoading, setLastSeenLoading] = useState(false);
  const [lastSeenError, setLastSeenError] = useState(null);
  const [lastSeenPlacement, setLastSeenPlacement] = useState(null);
  const ref = useRef(null);
  const dropdownPanelRef = useRef(null);
  const [avatarLoadedButton, setAvatarLoadedButton] = useState(!user?.image);
  const [avatarLoadedMenu, setAvatarLoadedMenu] = useState(!user?.image);

  const onlineIdSet = useMemo(
    () => new Set((onlineUsers || []).map((p) => String(p.id))),
    [onlineUsers]
  );

  useEffect(() => {
    const onClick = (e) => {
      if (e.target?.closest?.("[data-last-seen-modal]")) return;
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!lastSeenOpen) return;
    let cancelled = false;
    setLastSeenLoading(true);
    setLastSeenError(null);
    fetchLastSeenFeed()
      .then((rows) => {
        if (!cancelled) setLastSeenRows(rows);
      })
      .catch((err) => {
        if (!cancelled) setLastSeenError(err?.message || "Could not load");
      })
      .finally(() => {
        if (!cancelled) setLastSeenLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lastSeenOpen]);

  useEffect(() => {
    setAvatarLoadedButton(!user?.image);
    setAvatarLoadedMenu(!user?.image);
  }, [user?.image]);

  useEffect(() => {
    if (!open) return;
    const unsubscribe = subscribeOnlineUsers((users = []) => {
      if (Array.isArray(users)) setOnlineUsers(users);
    });
    return () => unsubscribe();
  }, [open]);

  useEffect(() => {
    if (!open) setLastSeenOpen(false);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setLastSeenPlacement(null);
      return;
    }
    if (!lastSeenOpen) return;
    const update = () => {
      const el = dropdownPanelRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const inset = 6;
      const w = Math.max(200, r.width - inset * 2);
      let left = r.left + (r.width - w) / 2;
      const gap = 8;
      const maxH = 420;
      let top = r.bottom + gap;
      if (top + maxH > window.innerHeight - 8) {
        top = Math.max(8, r.top - maxH - gap);
      }
      left = Math.min(Math.max(8, left), window.innerWidth - w - 8);
      setLastSeenPlacement({ top, left, width: w });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [lastSeenOpen, open]);

  if (!user) return null;

  const avatarImgSrc = user.image ? cloudinaryLargeAvatarUrl(user.image) : "";

  const borderCls = isDarkNavbar
    ? "border-gray-500/50 hover:border-cyan-500/60"
    : "border-green-400/50 hover:border-green-400";
  const menuBg =
    "bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] border border-gray-500/40";
  const textCls = isDarkNavbar ? "text-gray-200" : "text-green-100";
  const avatarSize = avatarOnly ? "h-9 w-9" : "h-8 w-8";
  const dropdownPosition = alignLeft
    ? "left-0 mt-2 w-64 origin-top-left"
    : "right-[-45px] sm:right-0 mt-2 w-64 origin-top-right";
  const dropdownWidth = avatarOnly
    ? "max-w-[min(16rem,calc(100vw-1.5rem))] w-64"
    : "w-64";

  const handleToggle = () => {
    if (typeof onBeforeToggle === "function") {
      onBeforeToggle();
    }
    setOpen((v) => !v);
  };

  const handleFlyoutWheel = (e) => {
    const el = e.currentTarget;
    const delta = e.deltaY;
    const atTop = el.scrollTop <= 0;
    const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;

    // Prevent wheel chaining to page/background when flyout reaches limits.
    if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
      e.preventDefault();
    }
    e.stopPropagation();
  };

  const dashboardAccessKeys = Array.isArray(user.dashboardAccess) ? user.dashboardAccess : [];
  const fallbackDashboardKeys = [];
  if (userCanManageEvents(user)) fallbackDashboardKeys.push("Event Management");
  if (!dashboardAccessKeys.length && user?.accountType && !isSocietyRole(user.accountType)) {
    fallbackDashboardKeys.push(user.accountType);
  }
  const accessibleDashboardKeys = dashboardAccessKeys.length ? dashboardAccessKeys : fallbackDashboardKeys;

  const uniqueDashboardKeys = Array.from(new Set(accessibleDashboardKeys.filter(Boolean)));
  uniqueDashboardKeys.sort((a, b) => {
    if (a === "Event Management") return -1;
    if (b === "Event Management") return 1;
    const aLabel = a === "Event Management" ? "EM Dashboard" : `${getAccountTypeLabel(a) || a} Dashboard`;
    const bLabel = b === "Event Management" ? "EM Dashboard" : `${getAccountTypeLabel(b) || b} Dashboard`;
    return aLabel.localeCompare(bLabel);
  });

  const isSociety = isSocietyRole(user.accountType);
  const emKey = "Event Management";

  // Society roles should always be able to browse *all* department dashboards
  // (even if the backend-derived dashboardAccess isn't populated yet).
  const deptDashboardKeys = isSociety
    ? AUTH_DEPARTMENTS.filter((d) => d && !isSocietyRole(d))
    : uniqueDashboardKeys.filter((k) => k && k !== emKey);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className={`flex items-center rounded-full border shadow-sm transition-all duration-150 ${
          avatarOnly && !showChevron ? "p-0.5" : "gap-1.5 p-0.5"
        } ${borderCls} ${textCls}`}
        aria-label="Open profile menu"
      >
        {user.image ? (
          <div className={`relative ${avatarSize}`}>
            {!avatarLoadedButton && (
              <div className="absolute inset-0 z-0 rounded-full bg-gray-500/50 pointer-events-none" />
            )}
            <img
              key={avatarImgSrc}
              src={avatarImgSrc || user.image}
              alt=""
              onLoad={() => setAvatarLoadedButton(true)}
              onError={() => setAvatarLoadedButton(true)}
              className={`${avatarSize} relative z-10 rounded-full object-cover border border-gray-600/50 opacity-100`}
            />
          </div>
        ) : (
          <div
            className={`flex ${avatarSize} items-center justify-center rounded-full bg-green-700/80 text-xs font-semibold text-richblack-25`}
          >
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </div>
        )}
        {(!avatarOnly || showChevron) && (
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-150 shrink-0 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      <div
        ref={dropdownPanelRef}
        className={`absolute ${dropdownPosition} ${dropdownWidth} rounded-2xl ${menuBg} shadow-xl backdrop-blur-sm transition-all duration-150 ease-out z-[60] ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        <div className="border-b border-gray-500/30 px-4 py-3.5">
          <div className="flex items-center gap-3">
            {user.image ? (
              <div className="relative h-8 w-8">
                {!avatarLoadedMenu && (
                  <div className="absolute inset-0 z-0 rounded-full bg-gray-500/50 pointer-events-none" />
                )}
                <img
                  key={`menu-${avatarImgSrc}`}
                  src={avatarImgSrc || user.image}
                  alt=""
                  onLoad={() => setAvatarLoadedMenu(true)}
                  onError={() => setAvatarLoadedMenu(true)}
                  className="h-8 w-8 relative z-10 rounded-full object-cover border border-gray-500/50 opacity-100"
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600/80 text-xs font-semibold text-richblack-25">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-richblack-25">
                {user.firstName} {user.lastName}
              </div>
              <div className="truncate text-xs text-gray-400">
                {user.email}
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="inline-flex rounded-full bg-cyan-500/20 px-2 py-0.5 font-medium text-cyan-300">
              {user.additionalDetails?.position ||
                getAccountTypeLabel(user.accountType) ||
                user.accountType}
            </span>
            <span className="text-gray-500">
              Joined{" "}
              <span className="font-medium text-gray-300">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </span>
          </div>
        </div>

        <div className="border-b border-gray-500/30 px-4 py-2">
          <div className="mb-2 flex min-h-7 items-center justify-between gap-2 pr-0.5">
            <span className="flex h-7 items-center text-[8px] font-medium uppercase leading-none tracking-[0.12em] text-gray-400">
              Online now
            </span>
            <button
              type="button"
              title="Recent activity — who was on the site"
              aria-label="Open last activity list"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setLastSeenOpen(true);
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-500/35 bg-cyan-500/10 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.12)] transition hover:border-cyan-400/50 hover:bg-cyan-500/18 hover:text-cyan-200 absolute right-4 mt-2"
            >
              <Clock className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onlineUsers.length ? (
              onlineUsers.map((person) => {
                const avatarSrc = person?.image
                  ? cloudinaryTinyAvatarUrl(person.image)
                  : "";
                const initials = String(person?.name || "U")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((s) => s[0]?.toUpperCase())
                  .join("");
                return (
                  <button
                    key={person.id}
                    type="button"
                    className="group relative inline-flex"
                    title={person.name}
                  >
                    <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/20 bg-slate-800">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={person.name}
                          className="h-7 w-7 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-[10px] font-semibold text-richblack-25">
                          {initials || "U"}
                        </span>
                      )}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-[#1e1e2f] bg-emerald-400" />
                    </span>
                    <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-500/30 bg-[#151525] px-2 py-0.5 text-[10px] text-gray-200 shadow-lg group-hover:block group-focus-visible:block">
                      {person.name}
                    </span>
                  </button>
                );
              })
            ) : (
              <span className="text-[11px] text-gray-500">No users online</span>
            )}
          </div>
        </div>

        <div className="px-1 py-1.5">
          {isSocietyRole(user.accountType) && (
            <button
              onClick={() => {
                setOpen(false);
                navigate("/dashboard");
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-gray-200 transition-colors duration-300 ease-out hover:bg-gray-500/20 hover:text-cyan-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-500/20 text-gray-400">
                <Layout className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-xs font-medium">Dashboard</span>
                <span className="block text-[10px] text-gray-500">
                  Manage signup access
                </span>
              </span>
            </button>
          )}
          <button
            onClick={() => {
              setOpen(false);
              navigate("/profile");
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-gray-200 transition-colors duration-300 ease-out hover:bg-gray-500/20 hover:text-cyan-300"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-500/20 text-gray-400">
              <User className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-xs font-medium">My profile</span>
              <span className="block text-[10px] text-gray-500">
                Edit details & display picture
              </span>
            </span>
          </button>
          <button
            onClick={() => {
              setOpen(false);
              navigate(
                isSocietyRole(user.accountType)
                  ? "/manage-society"
                  : "/manage-team",
              );
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-gray-200 transition-colors duration-300 ease-out hover:bg-gray-500/20 hover:text-cyan-300"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-500/20 text-gray-400">
              <Users className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-xs font-medium">
                {isSocietyRole(user.accountType)
                  ? "Manage society"
                  : "Manage your team"}
              </span>
              <span className="block text-[10px] text-gray-500">
                {isSocietyRole(user.accountType)
                  ? "All departments & members"
                  : "Add members & upload Excel"}
              </span>
            </span>
          </button>
          {/* Dashboards */}
          {isSociety ? (
            <>
              {/* Hover / click flyout: all department dashboards */}
              <div
                className="relative"
                // onMouseEnter={() => setDeptFlyoutOpen(true)}
                // onMouseLeave={() => setDeptFlyoutOpen(false)}
                onMouseEnter={() =>  setDeptFlyoutOpen(true)}
                onMouseLeave={() =>  setDeptFlyoutOpen(false)}
                onClick={() => isMobile && setDeptFlyoutOpen(prev => !prev)}
                tabIndex={0}
              >
                <button
                  type="button"
                  onClick={() => setDeptFlyoutOpen((v) => !v)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-gray-200 transition-colors duration-300 ease-out hover:bg-gray-500/20 hover:text-cyan-300"
                  aria-haspopup="menu"
                  aria-expanded={deptFlyoutOpen}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-500/20 text-gray-400">
                    <Layout className="h-4 w-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-medium truncate">All department dashboards</span>
                    <span className="block text-[10px] text-gray-500 truncate">
                      Browse {deptDashboardKeys.length} dashboards
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${deptFlyoutOpen ? "rotate-90" : "rotate-90 opacity-70"}`}
                  />
                </button>

                <div
                  className={`absolute -top-60 right-full mr-[-200px] sm:mr-1 w-72 max-w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-gray-500/40 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] shadow-xl backdrop-blur-sm overflow-hidden z-[70] transition-all duration-200 ease-out ${
                    deptFlyoutOpen
                      ? "pointer-events-auto opacity-100 translate-x-0 scale-100"
                      : "pointer-events-none opacity-0 translate-x-1 scale-95"
                  }`}
                  role="menu"
                >
                  <div className="px-4 py-3 border-b border-gray-500/30">
                    <div className="text-xs font-semibold text-richblack-25">Department dashboards</div>
                    <div className="text-[10px] text-gray-400">Jump to a department dashboard</div>
                  </div>
                  <div
                    className="max-h-[320px] overflow-y-auto px-1 py-1.5 overscroll-contain scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/30 hover:scrollbar-thumb-cyan-500/50"
                    onWheel={handleFlyoutWheel}
                  >
                    {deptDashboardKeys.length ? (
                      deptDashboardKeys.map((key) => {
                        const title = `${getAccountTypeLabel(key) || key} Dashboard`;
                        const to = key === emKey ? "/em-dashboard" : `/dashboard/${encodeURIComponent(key)}`;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setOpen(false);
                              setDeptFlyoutOpen(false);
                              navigate(to);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-gray-200 transition-colors duration-300 ease-out hover:bg-gray-500/20 hover:text-cyan-300"
                            role="menuitem"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-500/20 text-gray-400">
                              <Layout className="h-4 w-4" />
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-xs font-medium truncate">{title}</span>
                              <span className="block text-[10px] text-gray-500 truncate">
                                Departments allowed, Generate QR
                              </span>
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-3 text-xs text-gray-400">
                        No department dashboards available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            uniqueDashboardKeys.map((key) => {
              const to = key === "Event Management" ? "/em-dashboard" : `/dashboard/${encodeURIComponent(key)}`;
              const isEm = key === "Event Management";
              const Icon = isEm ? Calendar : Layout;
              const title = isEm ? "EM Dashboard" : `${getAccountTypeLabel(key) || key} Dashboard`;
              const subtitle = isEm ? "Upload & manage events" : "Configure access & permissions";

              return (
                <button
                  key={key}
                  onClick={() => {
                    setOpen(false);
                    navigate(to);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-gray-200 transition-colors duration-300 ease-out hover:bg-gray-500/20 hover:text-cyan-300"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-500/20 text-gray-400">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-xs font-medium">{title}</span>
                    <span className="block text-[10px] text-gray-500">{subtitle}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="rounded-b-2xl border-t border-gray-500/30 bg-gray-900/50 px-3 py-2.5">
          <button
            onClick={async () => {
              setOpen(false);
              await onLogout?.();
              navigate("/");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500/90 to-red-500/90 px-3 py-2 text-xs font-semibold text-richblack-25 shadow transition-colors duration-300 ease-out hover:from-rose-500 hover:to-red-500"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {lastSeenOpen && lastSeenPlacement && (
              <>
                <motion.button
                  key="last-seen-backdrop"
                  type="button"
                  aria-label="Close last activity"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="pointer-events-auto fixed inset-0 z-[300] bg-black/35 backdrop-blur-[0px]"
                  data-last-seen-modal
                  onClick={() => setLastSeenOpen(false)}
                />
                <motion.div
                  key="last-seen-panel"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="last-seen-title"
                  style={{
                    top: lastSeenPlacement.top,
                    left: lastSeenPlacement.left,
                    width: lastSeenPlacement.width,
                  }}
                  initial={{ opacity: 0, scale: 0.94, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-auto fixed z-[301] flex max-h-[min(420px,58vh)] flex-col overflow-hidden rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-[#1a1528] via-[#1e1e2f] to-[#162a32] shadow-xl shadow-black/40 mt-16"
                  data-last-seen-modal
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <motion.div
                    className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-fuchsia-500/20 blur-3xl"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
                  />
                  <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-cyan-500/15 blur-2xl" />
                  <motion.div
                    className="relative z-[1] shrink-0 border-b border-white/10 px-3 py-2.5"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 pr-1">
                        <h2 id="last-seen-title" className="font-montserrat text-xs font-bold text-richblack-25">
                          Last activity
                        </h2>
                        <p className="mt-0.5 text-[9px] leading-snug text-gray-400">
                          Newest first · when someone opens the site
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLastSeenOpen(false)}
                        className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-medium text-gray-300 transition hover:bg-white/10"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                  <div
                    data-lenis-prevent="true"
                    className="relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-1.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/30"
                    style={{ WebkitOverflowScrolling: "touch" }}
                    onWheel={(e) => e.stopPropagation()}
                  >
                    {lastSeenLoading && (
                      <motion.p
                        className="py-8 text-center text-xs text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        Loading…
                      </motion.p>
                    )}
                    {!lastSeenLoading && lastSeenError && (
                      <motion.p
                        className="py-6 text-center text-xs text-rose-300/90"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {lastSeenError}
                      </motion.p>
                    )}
                    {!lastSeenLoading && !lastSeenError && lastSeenRows.length === 0 && (
                      <motion.p
                        className="py-6 text-center text-xs text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        No members yet.
                      </motion.p>
                    )}
                    {!lastSeenLoading && !lastSeenError && lastSeenRows.length > 0 && (
                      <motion.div
                        className="space-y-0"
                        variants={lastSeenListContainer}
                        initial="hidden"
                        animate="show"
                      >
                        {lastSeenRows.map((row) => {
                          const isOnline = onlineIdSet.has(String(row.id));
                          const av = row.image ? cloudinaryTinyAvatarUrl(row.image) : "";
                          const initials = String(row.name || "U")
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((s) => s[0]?.toUpperCase())
                            .join("");
                          return (
                            <motion.div
                              key={row.id}
                              variants={lastSeenListItem}
                              className="mb-1.5 flex items-center gap-2.5 rounded-2xl border border-white/5 bg-white/[0.03] px-2.5 py-2"
                            >
                              <div className="relative shrink-0">
                                {av ? (
                                  <img
                                    src={av}
                                    alt=""
                                    className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-[11px] font-semibold text-richblack-25">
                                    {initials || "?"}
                                  </div>
                                )}
                                {isOnline && (
                                  <span
                                    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#1e1e2f] bg-emerald-400"
                                    title="Online"
                                  />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-semibold text-gray-100">{row.name}</div>
                                <div className="mt-0.5 truncate text-[10px] text-gray-500">
                                  {isOnline ? (
                                    <span className="text-emerald-400/95">Online now</span>
                                  ) : (
                                    formatLastSeenLabel(row.lastSeen)
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

export default ProfileDropDown;

