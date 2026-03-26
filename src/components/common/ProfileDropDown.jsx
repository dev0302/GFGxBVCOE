import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  AUTH_DEPARTMENTS,
  getAccountTypeLabel,
  isSocietyRole,
  userCanManageEvents,
} from "../../services/api";
import {
  Calendar,
  ChevronDown,
  Grid,
  Layout,
  LogOut,
  User,
  Users,
} from "react-feather";

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
  const ref = useRef(null);
  const [avatarLoadedButton, setAvatarLoadedButton] = useState(!user?.image);
  const [avatarLoadedMenu, setAvatarLoadedMenu] = useState(!user?.image);

  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

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
              <div className="absolute inset-0 rounded-full bg-gray-500/50 animate-pulse" />
            )}
            <img
              src={user.image}
              alt=""
              onLoad={() => setAvatarLoadedButton(true)}
              onError={() => setAvatarLoadedButton(true)}
              className={`${avatarSize} rounded-full object-cover border border-gray-600/50 transition-opacity duration-300 ${
                avatarLoadedButton ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        ) : (
          <div
            className={`flex ${avatarSize} items-center justify-center rounded-full bg-green-700/80 text-xs font-semibold text-white`}
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
                  <div className="absolute inset-0 rounded-full bg-gray-500/50 animate-pulse" />
                )}
                <img
                  src={user.image}
                  alt=""
                  onLoad={() => setAvatarLoadedMenu(true)}
                  onError={() => setAvatarLoadedMenu(true)}
                  className={`h-8 w-8 rounded-full object-cover border border-gray-500/50 transition-opacity duration-300 ${
                    avatarLoadedMenu ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600/80 text-xs font-semibold text-white">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">
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
              navigate("/jam-the-web");
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-gray-200 transition-colors duration-300 ease-out hover:bg-gray-500/20 hover:text-cyan-300"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-500/20 text-gray-400">
              <Layout className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-xs font-medium">
                Jam The Web Result
              </span>
              <span className="block text-[10px] text-gray-500">
                View & edit scores
              </span>
            </span>
          </button>
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
                onMouseEnter={() => setDeptFlyoutOpen(true)}
                onMouseLeave={() => setDeptFlyoutOpen(false)}
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
                  className={`absolute -top-44 right-full mr-[-200px] sm:mr-2 w-72 max-w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-gray-500/40 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] shadow-xl backdrop-blur-sm overflow-hidden z-[70] transition-all duration-200 ease-out ${
                    deptFlyoutOpen
                      ? "pointer-events-auto opacity-100 translate-x-0 scale-100"
                      : "pointer-events-none opacity-0 translate-x-1 scale-95"
                  }`}
                  role="menu"
                >
                  <div className="px-4 py-3 border-b border-gray-500/30">
                    <div className="text-xs font-semibold text-white">Department dashboards</div>
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

        <div className="border-t border-gray-500/30 bg-gray-900/50 px-3 py-2.5">
          <button
            onClick={async () => {
              setOpen(false);
              await onLogout?.();
              navigate("/");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500/90 to-red-500/90 px-3 py-2 text-xs font-semibold text-white shadow transition-colors duration-300 ease-out hover:from-rose-500 hover:to-red-500"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileDropDown;

