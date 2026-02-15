import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Routes that require a logged-in user. All other routes (login, signup, join-team, etc.) are public.
 */
function isProtectedRoute(pathname) {
  const path = pathname || "";
  // Public: invite and auth flows
  if (path.startsWith("/join-team")) return false;
  if (path.startsWith("/login") || path.startsWith("/signup")) return false;
  if (path.startsWith("/forgot-password") || path.startsWith("/reset-password/")) return false;
  if (path.startsWith("/uploadevent/link/")) return false;
  // Protected
  if (path.startsWith("/profile") || path.startsWith("/manage-team") || path.startsWith("/manage-society")) return true;
  if (path.startsWith("/dashboard") || path === "/admin") return true;
  if (path.startsWith("/uploadevent")) return true; // upload, manage, etc. (except link/ above)
  return false;
}

/**
 * Renders the matched route (Outlet). Only redirects to /login when the current path is protected and user is not logged in.
 * This ensures public routes like /join-team/:token always render without redirecting guests.
 */
export default function AuthAwareLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!user && isProtectedRoute(location.pathname)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
