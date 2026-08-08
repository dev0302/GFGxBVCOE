import { Navigate, useParams } from "react-router-dom";
import { Layout } from "react-feather";
import { useAuth } from "../context/AuthContext";
import { getAccountTypeLabel } from "../services/api";

export default function MemberDashboard() {
  const { user, loading } = useAuth();
  const { department } = useParams();
  const departmentName = decodeURIComponent(department || "");

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isDepartmentMember || departmentName !== user.accountType) {
    return <Navigate to="/" replace />;
  }

  const label = getAccountTypeLabel(departmentName) || departmentName;
  return (
    <main className="min-h-screen darkthemebg flex items-center justify-center px-4 pt-24 pb-16">
      <section className="w-full max-w-xl rounded-2xl border border-cyan-400/20 bg-[#1e1e2f]/90 p-8 text-center shadow-xl">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
          <Layout className="h-7 w-7" />
        </span>
        <p className="text-sm font-medium text-cyan-300">{label} member dashboard</p>
        <h1 className="mt-2 text-2xl font-bold text-richblack-25">This feature is coming soon.</h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          Your department dashboard is being prepared. You can still view your team and update your profile.
        </p>
      </section>
    </main>
  );
}
