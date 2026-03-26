import { useParams } from "react-router-dom";
import { getAccountTypeLabel } from "../../services/api";

export default function DepartmentMain() {
  const { departmentKey } = useParams();

  const label = getAccountTypeLabel(departmentKey) || departmentKey;

  return (
    <div className="min-h-full flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="rounded-2xl border border-gray-500/20 bg-gradient-to-br from-[#1e1e2f]/85 to-[#2c2c3e]/85 p-6 shadow-xl md:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">{label} Dashboard</h1>
          <p className="mt-2 text-sm text-gray-400">
            This department dashboard doesn&apos;t have extra features yet. Use the sidebar&apos;s <span className="text-cyan-300 font-semibold">Departments allowed</span> to configure who can access it.
          </p>
        </div>
      </div>
    </div>
  );
}

