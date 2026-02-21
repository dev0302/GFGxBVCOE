import { useState, useEffect, useCallback } from "react";
import { getForceDeleteAllowed, addForceDeleteDepartment, removeForceDeleteDepartment, AUTH_DEPARTMENTS, getAccountTypeLabel } from "../../services/api";
import { toast } from "sonner";
import { SectionTitle } from "../../components/EventDashboard/SectionTitle";
import { Spinner } from "@/components/ui/spinner";

export default function ForceDeletePermissions() {
  const [config, setConfig] = useState(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingDept, setAddingDept] = useState(false);
  const [removingDept, setRemovingDept] = useState(null);
  const [addDeptValue, setAddDeptValue] = useState("");

  const loadConfig = useCallback(() => {
    setLoading(true);
    getForceDeleteAllowed()
      .then((res) => {
        if (res.success && res.data) {
          setConfig(res.data);
          setCanManage(res.canManage === true);
        } else {
          setConfig(null);
          setCanManage(false);
        }
      })
      .catch(() => { setConfig(null); setCanManage(false); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleAddDept = () => {
    const dept = addDeptValue.trim();
    if (!dept) return;
    setAddingDept(true);
    addForceDeleteDepartment(dept)
      .then((res) => {
        if (res.data) setConfig(res.data);
        setAddDeptValue("");
        toast.success("Department can now use Force delete on events.");
      })
      .catch((err) => toast.error(err.message || "Failed to add"))
      .finally(() => setAddingDept(false));
  };

  const handleRemoveDept = (department) => {
    setRemovingDept(department);
    removeForceDeleteDepartment(department)
      .then((res) => {
        if (res.data) setConfig(res.data);
        toast.success("Department removed from force-delete.");
      })
      .catch((err) => toast.error(err.message || "Failed to remove"))
      .finally(() => setRemovingDept(null));
  };

  return (
    <div className="flex min-h-full w-full justify-center bg-[#1e1e2f] pb-20 px-4 sm:px-6 lg:px-10">
      <div className="w-full max-w-3xl py-10 flex flex-col gap-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Force delete permissions</h1>
          <p className="mt-2 text-gray-400 text-sm">Faculty Incharge, Chairperson and Vice-Chairperson can add or remove departments that are allowed to use &quot;Force delete&quot; on events (immediate permanent delete, no 10-day delay). Faculty Incharge, Chairperson and Vice-Chairperson are always allowed.</p>
        </div>

        <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
          <SectionTitle icon="🛡️">Departments allowed to force-delete</SectionTitle>
          {loading ? (
            <p className="text-gray-500 py-4"><Spinner className="size-4 text-gray-400" /></p>
          ) : config ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Always allowed (Faculty Incharge, Chairperson, Vice-Chairperson)</p>
                <div className="flex flex-wrap gap-2">
                  {config.core?.map((d) => (
                    <span key={d} className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-sm font-medium">
                      {getAccountTypeLabel(d) || d}
                    </span>
                  ))}
                </div>
              </div>
              {config.extra?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2">Additionally allowed</p>
                  <ul className="space-y-2">
                    {config.extra.map((d) => (
                      <li key={d} className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-[#252536] border border-gray-500/20">
                        <span className="text-white font-medium">{getAccountTypeLabel(d) || d}</span>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDept(d)}
                            disabled={removingDept === d}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium disabled:opacity-50"
                          >
                            {removingDept === d ? "Removing…" : "Remove"}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {canManage && (
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2">Add department</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <select
                      value={addDeptValue}
                      onChange={(e) => setAddDeptValue(e.target.value)}
                      className="px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-white focus:border-cyan-500 outline-none min-w-[200px]"
                    >
                      <option value="">Select department</option>
                      {AUTH_DEPARTMENTS.filter((d) => !config.all?.includes(d)).map((d) => (
                        <option key={d} value={d}>{getAccountTypeLabel(d) || d}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddDept}
                      disabled={!addDeptValue.trim() || addingDept}
                      className="px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingDept ? "Adding…" : "Add"}
                    </button>
                  </div>
                  {AUTH_DEPARTMENTS.filter((d) => !config.all?.includes(d)).length === 0 && (
                    <p className="text-xs text-gray-500 mt-2">All departments are already allowed to force-delete.</p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
