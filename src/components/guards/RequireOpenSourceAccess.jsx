import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { canUploadProjects } from "../../utils/openSourceAccess";

export default function RequireOpenSourceAccess({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!canUploadProjects(user)) return <Navigate to="/open-source" replace />;

  return children;
}
