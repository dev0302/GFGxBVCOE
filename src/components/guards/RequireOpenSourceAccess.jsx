import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { canAccessOpenSource } from "../../utils/openSourceAccess";

export default function RequireOpenSourceAccess({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccessOpenSource(user)) return <Navigate to="/" replace />;

  return children;
}
