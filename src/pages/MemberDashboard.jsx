import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MemberDashboard() {
  const { user, loading } = useAuth();
  const { department } = useParams();
  const departmentName = decodeURIComponent(department || "");

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isDepartmentMember || departmentName !== user.accountType) {
    return <Navigate to="/" replace />;
  }
  if (!user.dashboardAccess?.includes(departmentName)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Navigate to={`/dashboard/${encodeURIComponent(departmentName)}`} replace />
  );
}
