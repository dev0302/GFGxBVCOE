import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getEventUploadAllowed, addEventUploadDepartment, removeEventUploadDepartment, AUTH_DEPARTMENTS, getAccountTypeLabel, getMe } from "../../services/api";
import { toast } from "sonner";
import { SectionTitle } from "../../components/EventDashboard/SectionTitle";
import { Spinner } from "@/components/ui/spinner";

export default function DepartmentsAllowed() {
  const { user, setUser } = useAuth();
  const [allowedConfig, setAllowedConfig] = useState(null);
  const [loadingAllowed, setLoadingAllowed] = useState(false);
  const [addingDept, setAddingDept] = useState(false);
  const [removingDept, setRemovingDept] = useState(null);
  const [addDeptValue, setAddDeptValue] = useState("");

  const loadAllowedConfig = useCallback(() => {
    setLoadingAllowed(true);
    getEventUploadAllowed()
      .then((res) => {
        if (res.success && res.data) setAllowedConfig(res.data);
      })
      .catch(() => setAllowedConfig(null))
      .finally(() => setLoadingAllowed(false));
  }, []);

  useEffect(() => {
    loadAllowedConfig();
  }, [loadAllowedConfig]);

  const handleAddAllowedDept = () => {
    const dept = addDeptValue.trim();
    if (!dept) return;
    setAddingDept(true);
    addEventUploadDepartment(dept)
      .then((res) => {
        if (res.data) setAllowedConfig(res.data);
        setAddDeptValue("");
        toast.success("Department added. They will see Manage Events in their menu.");
        return getMe().then((r) => r.user && setUser(r.user));
      })
      .catch((err) => toast.error(err.message || "Failed to add"))
      .finally(() => setAddingDept(false));
  };

  const handleRemoveAllowedDept = (department) => {
    setRemovingDept(department);
    removeEventUploadDepartment(department)
      .then((res) => {
        if (res.data) setAllowedConfig(res.data);
        toast.success("Department removed.");
        return getMe().then((r) => r.user && setUser(r.user));
      })
      .catch((err) => toast.error(err.message || "Failed to remove"))
      .finally(() => setRemovingDept(null));
  };

  return (
    <div className="flex min-h-full w-full justify-center bg-[#1e1e2f] pb-20 px-4 sm:px-6 lg:px-10">
      <div className="w-full max-w-3xl py-10 flex flex-col gap-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Departments allowed to visit Upload Event page</h1>
          <p className="mt-2 text-gray-400 text-sm">Faculty Incharge, Chairperson, Vice-Chairperson and Event Management are always allowed. Add or remove other departments below.</p>
        </div>

        <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
          <SectionTitle icon="👥">Allowed departments</SectionTitle>
          {loadingAllowed ? (
            <p className="text-gray-500 py-4"><Spinner className="size-4 text-gray-400" /></p>
          ) : allowedConfig ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Always allowed (cannot be removed)</p>
                <div className="flex flex-wrap gap-2">
                  {allowedConfig.core?.map((d) => (
                    <span key={d} className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-sm font-medium">
                      {getAccountTypeLabel(d) || d}
                    </span>
                  ))}
                </div>
              </div>
              {allowedConfig.extra?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2">Additionally allowed</p>
                  <ul className="space-y-2">
                    {allowedConfig.extra.map((d) => (
                      <li key={d} className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-[#252536] border border-gray-500/20">
                        <span className="text-white font-medium">{getAccountTypeLabel(d) || d}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAllowedDept(d)}
                          disabled={removingDept === d}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium disabled:opacity-50"
                        >
                          {removingDept === d ? "Removing…" : "Remove"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Add department</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={addDeptValue}
                    onChange={(e) => setAddDeptValue(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-white focus:border-cyan-500 outline-none min-w-[200px]"
                  >
                    <option value="">Select department</option>
                    {AUTH_DEPARTMENTS.filter((d) => !allowedConfig.all?.includes(d)).map((d) => (
                      <option key={d} value={d}>{getAccountTypeLabel(d) || d}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddAllowedDept}
                    disabled={!addDeptValue.trim() || addingDept}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingDept ? "Adding…" : "Add"}
                  </button>
                </div>
                {AUTH_DEPARTMENTS.filter((d) => !allowedConfig.all?.includes(d)).length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">All departments are already in the allowed list.</p>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
