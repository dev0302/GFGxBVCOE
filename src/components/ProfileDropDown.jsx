import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAccountTypeLabel, isSocietyRole, userCanManageEvents } from "../services/api";
import { Calendar, ChevronDown, Layout, LogOut, User, Users } from "react-feather";

function ProfileDropDown({ onLogout, isDarkNavbar, avatarOnly = false, alignLeft = false, showChevron = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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
  const menuBg = "bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] border border-gray-500/40";
  const textCls = isDarkNavbar ? "text-gray-200" : "text-green-100";
  const avatarSize = avatarOnly ? "h-9 w-9" : "h-8 w-8";
  const dropdownPosition = alignLeft
    ? "left-0 mt-2 w-64 origin-top-left"
    : "right-0 mt-2 w-64 origin-top-right";
  const dropdownWidth = avatarOnly ? "max-w-[min(16rem,calc(100vw-1.5rem))] w-64" : "w-64";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center rounded-full border shadow-sm transition-all duration-150 ${avatarOnly && !showChevron ? "p-0.5" : "gap-1.5 p-0.5"} ${borderCls} ${textCls}`}
        aria-label="Open profile menu"
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className={`${avatarSize} rounded-full object-cover border border-gray-600/50`}
          />
        ) : (
          <div className={`flex ${avatarSize} items-center justify-center rounded-full bg-green-700/80 text-xs font-semibold text-white`}>
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </div>
        )}
        {(!avatarOnly || showChevron) && (
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-150 shrink-0 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      <div
        className={`absolute ${dropdownPosition} ${dropdownWidth} overflow-hidden rounded-2xl ${menuBg} shadow-xl backdrop-blur-sm transition-all duration-150 ease-out z-[60] ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        <div className="border-b border-gray-500/30 px-4 py-3.5">
          <div className="flex items-center gap-3">
            {user.image ? (
              <img
                src={user.image}
                alt=""
                className="h-9 w-9 rounded-full object-cover border border-gray-500/50"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-600/80 text-sm font-semibold text-white">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">
                {user.firstName} {user.lastName}
              </div>
              <div className="truncate text-xs text-gray-400">{user.email}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="inline-flex rounded-full bg-cyan-500/20 px-2 py-0.5 font-medium text-cyan-300">
              {user.additionalDetails?.position || getAccountTypeLabel(user.accountType) || user.accountType}
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
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-gray-200 transition hover:bg-gray-500/20 hover:text-cyan-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-500/20 text-gray-400">
                <Layout className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-xs font-medium">Dashboard</span>
                <span className="block text-[10px] text-gray-500">Manage signup access</span>
              </span>
            </button>
          )}
          {isSocietyRole(user.accountType) && (
            <button
              onClick={() => {
                setOpen(false);
                navigate("/jam-the-web");
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-gray-200 transition hover:bg-gray-500/20 hover:text-cyan-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-500/20 text-gray-400">
                <Layout className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-xs font-medium">Jam The Web Result</span>
                <span className="block text-[10px] text-gray-500">View & edit scores</span>
              </span>
            </button>
          )}
          <button
            onClick={() => {
              setOpen(false);
              navigate("/profile");
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-gray-200 transition hover:bg-gray-500/20 hover:text-cyan-300"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-500/20 text-gray-400">
              <User className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-xs font-medium">My profile</span>
              <span className="block text-[10px] text-gray-500">Edit details & display picture</span>
            </span>
          </button>
          <button
            onClick={() => {
              setOpen(false);
              navigate(isSocietyRole(user.accountType) ? "/manage-society" : "/manage-team");
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-gray-200 transition hover:bg-gray-500/20 hover:text-cyan-300"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-500/20 text-gray-400">
              <Users className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-xs font-medium">
                {isSocietyRole(user.accountType) ? "Manage society" : "Manage your team"}
              </span>
              <span className="block text-[10px] text-gray-500">
                {isSocietyRole(user.accountType) ? "All departments & members" : "Add members & upload Excel"}
              </span>
            </span>
          </button>
          {userCanManageEvents(user) && (
            <button
              onClick={() => {
                setOpen(false);
                navigate("/uploadevent");
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-gray-200 transition hover:bg-gray-500/20 hover:text-cyan-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-500/20 text-gray-400">
                <Calendar className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-xs font-medium">Manage Events</span>
                <span className="block text-[10px] text-gray-500">Upload & manage events</span>
              </span>
            </button>
          )}
        </div>

        <div className="border-t border-gray-500/30 bg-gray-900/50 px-3 py-2.5">
          <button
            onClick={async () => {
              setOpen(false);
              await onLogout?.();
              navigate("/");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500/90 to-red-500/90 px-3 py-2 text-xs font-semibold text-white shadow transition hover:from-rose-500 hover:to-red-500"
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
