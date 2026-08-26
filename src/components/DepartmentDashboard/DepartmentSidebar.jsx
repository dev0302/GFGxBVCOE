import { NavLink, useLocation, useParams } from "react-router-dom";
import { Grid, Users, Folder } from "react-feather";
import { useAuth } from "../../context/AuthContext";
import { canManageDepartmentDashboard } from "../../utils/dashboardAccess";

export default function DepartmentSidebar() {
  const location = useLocation();
  const { departmentKey } = useParams();
  const { user } = useAuth();

  const encodedKey = encodeURIComponent(departmentKey || "");
  const links = [
    {
      name: "Departments allowed",
      path: `/dashboard/${encodedKey}/departments`,
      icon: Users,
    },
    {
      name: "Generate QR",
      path: `/dashboard/${encodedKey}/generate-qr`,
      icon: Grid,
      section: "generate-qr",
    },
    {
      name: "Document Vault",
      path: `/dashboard/${encodedKey}/documents`,
      icon: Folder,
      section: "documents",
    },
  ];
  const visibleLinks = canManageDepartmentDashboard(user, departmentKey)
    ? links
    : links.filter((link) => link.name !== "Departments allowed");
  const memberSections = user?.departmentDashboardSections?.[departmentKey] || [];
  const sectionLinks = user?.isDepartmentMember
    ? visibleLinks.filter((link) => link.section && memberSections.includes(link.section))
    : visibleLinks;

  const matchRoute = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <div className="flex h-screen min-w-[60px] md:min-w-[220px] flex-col border-r border-gray-500/30 bg-[#1e1e2f]/95 pb-6 pt-20 sm:pt-24 transition-all duration-300">
      <div className="flex flex-col gap-0.5 px-2 md:px-4">
        {sectionLinks.map((link) => {
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
