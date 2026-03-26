import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function normalizeKey(value) {
  return String(value || "").trim();
}

/**
 * Guards `/dashboard/:departmentKey` routes using `user.dashboardAccess`.
 * The backend is responsible for populating `user.dashboardAccess`.
 */
export default function RequireDashboardAccess({ dashboardKey, children }) {
  const { user, loading: authLoading } = useAuth();
  const key = normalizeKey(dashboardKey);

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-[#1e1e2f]">
        <div className="h-10 w-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const access = Array.isArray(user.dashboardAccess) ? user.dashboardAccess : [];
  if (!key || !access.includes(key)) return <Navigate to="/notfound" replace />;

  return children ?? null;
}

