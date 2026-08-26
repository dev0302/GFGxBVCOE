import { useNavigate } from "react-router-dom";
import { Lock } from "react-feather";
import { getAccountTypeLabel } from "../../services/api";

export default function DashboardLocked({ departmentKey }) {
  const navigate = useNavigate();
  const label = getAccountTypeLabel(departmentKey) || departmentKey;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e1e2f] px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-gray-500/30 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] p-8 text-center shadow-xl">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
          <Lock className="h-6 w-6" />
        </span>
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-500">
          Coming soon
        </p>
        <h1 className="mt-2 text-xl font-semibold text-richblack-25">
          {label} Dashboard
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          This dashboard is not available for members yet. Ask your department
          Head or Lead to enable member access from their dashboard settings.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/view-team")}
            className="flex-1 rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
          >
            View your team
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex-1 rounded-xl border border-gray-500/30 bg-gray-500/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-500/20"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
