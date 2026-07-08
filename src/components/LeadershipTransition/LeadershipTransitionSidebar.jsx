import { NavLink, useLocation } from "react-router-dom";
import { Clock, Users, TrendingUp } from "react-feather";
import { useAuth } from "../../context/AuthContext";
import { isSocietyRole } from "../../services/api";
import { useSocketContext } from "../../context/SocketProvider";

const sidebarLinks = [
  { name: "Promotions", path: "/leadership-transition/promotions", icon: TrendingUp },
  { name: "History", path: "/leadership-transition/history", icon: Clock },
  {
    name: "Persons allowed",
    path: "/leadership-transition/persons-allowed",
    icon: Users,
    societyOnly: true,
  },
];

export default function LeadershipTransitionSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { hasActiveLeadershipSession } = useSocketContext();

  const matchRoute = (path) => {
    if (path === "/leadership-transition/promotions") {
      return (
        location.pathname === path ||
        location.pathname === "/leadership-transition"
      );
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] min-w-[60px] md:min-w-[220px] flex-col border-r border-gray-500/30 bg-[#1e1e2f]/95 py-6 transition-all duration-300">
      <div className="hidden md:block px-4 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">
          Leadership
        </p>
        <p className="text-[11px] text-gray-500">Transition hub</p>
      </div>
      <div className="flex flex-col gap-0.5 px-2 md:px-4">
        {sidebarLinks.map((link) => {
          if (link.societyOnly && !isSocietyRole(user?.accountType)) return null;
          const Icon = link.icon;
          const isActive = matchRoute(link.path);
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={`relative flex items-center gap-3 px-3 py-2.5 md:px-4 rounded-lg text-sm font-medium transition-all duration-300
                ${isActive ? "bg-cyan-500/20 text-cyan-300" : "text-gray-400 hover:bg-gray-500/20 hover:text-gray-200"}
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-0 h-full w-[3px] bg-cyan-400 rounded-r" />
              )}
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden md:inline truncate">{link.name}</span>
              {link.name === "Promotions" && hasActiveLeadershipSession && (
                <span className="absolute right-2 top-2 flex h-2.5 w-2.5 z-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500 border border-[#1e1e2f]"></span>
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
