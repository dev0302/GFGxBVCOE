import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireDepartmentSectionAccess({ section, children }) {
  const { user, loading } = useAuth();
  const { departmentKey } = useParams();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  // Non-member dashboard users retain their existing full dashboard access.
  if (!user.isDepartmentMember) return children;

  const sections = user.departmentDashboardSections?.[departmentKey] || [];
  if (!sections.includes(section)) {
    const fallback = sections.includes("generate-qr")
      ? "generate-qr"
      : sections.includes("documents")
        ? "documents"
        : null;
    return fallback
      ? <Navigate to={`/dashboard/${encodeURIComponent(departmentKey || "")}/${fallback}`} replace />
      : <Navigate to="/notfound" replace />;
  }
  return children;
}
