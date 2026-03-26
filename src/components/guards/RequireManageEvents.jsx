import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { userCanManageEvents } from "../../services/api";

/**
 * Guards routes that should be accessible only to users who can manage events
 * (used for pages like Generate QR).
 */
export default function RequireManageEvents({ children }) {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-[#1e1e2f]">
        <div className="h-10 w-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!userCanManageEvents(user)) return <Navigate to="/" replace />;

  return children;
}

