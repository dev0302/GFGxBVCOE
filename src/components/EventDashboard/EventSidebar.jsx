import { NavLink, useLocation } from "react-router-dom";
import { Upload, Link2, Users, List, Calendar, Shield } from "react-feather";
import { useAuth } from "../../context/AuthContext";
import { canManageEventUploadConfig, canManageForceDeleteConfig } from "../../services/api";

const sidebarLinks = [
  { name: "Upload new event", path: "/uploadevent/upload", icon: Upload },
  { name: "Upcoming event", path: "/uploadevent/upcoming", icon: Calendar },
  { name: "Generate upload link", path: "/uploadevent/generate-link", icon: Link2 },
  { name: "Departments allowed", path: "/uploadevent/departments", icon: Users, requireConfig: true },
  { name: "Force delete permissions", path: "/uploadevent/force-delete", icon: Shield, requireFacultyIncharge: true },
  { name: "Manage uploaded events", path: "/uploadevent/manage", icon: List },
];

export default function EventSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const matchRoute = (path) => {
    if (path === "/uploadevent/upload") return location.pathname === path || location.pathname === "/uploadevent";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] min-w-[60px] md:min-w-[220px] flex-col border-r border-gray-500/30 bg-[#1e1e2f]/95 py-6 transition-all duration-300">
      <div className="flex flex-col gap-0.5 px-2 md:px-4">
        {sidebarLinks.map((link) => {
          if (link.requireConfig && !canManageEventUploadConfig(user?.accountType)) return null;
          if (link.requireFacultyIncharge && !canManageForceDeleteConfig(user?.accountType)) return null;
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
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
