import { useState, useEffect, useCallback } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getDashboardAllowed,
  addDashboardAllowedDepartment,
  removeDashboardAllowedDepartment,
  updateDashboardMemberAccess,
  AUTH_DEPARTMENTS,
  getAccountTypeLabel,
  getMe,
} from "../../services/api";
import { toast } from "sonner";
import { SectionTitle } from "../../components/EventDashboard/SectionTitle";
import { Spinner } from "@/components/ui/spinner";
import { AddDepartmentUnlockAnimation } from "../../components/EventDashboard/AddDepartmentUnlockAnimation";
import { canManageDepartmentDashboard } from "../../utils/dashboardAccess";

function MemberAccessToggle({ enabled, disabled, onToggle, dashboardLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled === true}
      aria-label={`${enabled ? "Disable" : "Enable"} dashboard access for all ${dashboardLabel} members`}
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-7 w-11 shrink-0 items-center rounded-full p-0.5 transition-all duration-300 ease-out overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-wait disabled:opacity-60 ${
        enabled
          ? "bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-400 shadow-[0_0_14px_rgba(34,197,94,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]"
          : "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_0_8px_rgba(245,158,11,0.25)]"
      }`}
    >
      {enabled && (
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute -inset-y-3 -left-1/2 h-[180%] w-1/2 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-shine" />
        </span>
      )}
      <span
        aria-hidden
        className={`relative z-10 block h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-out ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function DepartmentsAllowed() {
  const { departmentKey } = useParams();
  const { user, setUser } = useAuth();

  const [allowedConfig, setAllowedConfig] = useState(null);
  const [loadingAllowed, setLoadingAllowed] = useState(false);
  const [addingDept, setAddingDept] = useState(false);
  const [removingDept, setRemovingDept] = useState(null);
  const [addDeptValue, setAddDeptValue] = useState("");
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const [updatingMemberAccess, setUpdatingMemberAccess] = useState(false);

  const dashboardLabel = getAccountTypeLabel(departmentKey) || departmentKey;
  const canManage = canManageDepartmentDashboard(user, departmentKey);

  const loadAllowedConfig = useCallback(() => {
    setLoadingAllowed(true);
    return getDashboardAllowed(departmentKey)
      .then((res) => {
        if (res.success && res.data) setAllowedConfig(res.data);
      })
      .catch(() => setAllowedConfig(null))
      .finally(() => setLoadingAllowed(false));
  }, [departmentKey]);

  useEffect(() => {
    if (canManage) loadAllowedConfig();
  }, [canManage, loadAllowedConfig]);

  if (!canManage) {
    return <Navigate to={`/dashboard/${encodeURIComponent(departmentKey || "")}/generate-qr`} replace />;
  }

  const handleAddAllowedDept = () => {
    const dept = addDeptValue.trim();
    if (!dept) return;
    setAddingDept(true);
    setShowUnlockAnimation(true);

    addDashboardAllowedDepartment(departmentKey, dept)
      .then((res) => {
        if (res.data) setAllowedConfig(res.data);
        setAddDeptValue("");
        toast.success(
          `Department added. They will see ${dashboardLabel} Dashboard in their menu.`,
        );
        return getMe().then((r) => r.user && setUser(r.user));
      })
      .catch((err) => {
        setShowUnlockAnimation(false);
        toast.error(err.message || "Failed to add");
      })
      .finally(() => setAddingDept(false));
  };

  const handleRemoveAllowedDept = (department) => {
    setRemovingDept(department);
    removeDashboardAllowedDepartment(departmentKey, department)
      .then((res) => {
        if (res.data) setAllowedConfig(res.data);
        toast.success("Department removed.");
        return getMe().then((r) => r.user && setUser(r.user));
      })
      .catch((err) => toast.error(err.message || "Failed to remove"))
      .finally(() => setRemovingDept(null));
  };

  const handleMemberAccessToggle = () => {
    const enabled = !allowedConfig?.departmentMembersEnabled;
    setUpdatingMemberAccess(true);
    updateDashboardMemberAccess(departmentKey, enabled)
      .then((res) => {
        if (res.data) setAllowedConfig(res.data);
        toast.success(
          enabled
            ? "All department members can now access this dashboard."
            : "Department member access disabled.",
        );
        return getMe().then((r) => r.user && setUser(r.user));
      })
      .catch((err) =>
        toast.error(err.message || "Failed to update member access"),
      )
      .finally(() => setUpdatingMemberAccess(false));
  };

  if (loadingAllowed && !allowedConfig) {
    return (
      <div className="flex min-h-full w-full justify-center items-center bg-[#1e1e2f] pb-20 px-4 sm:px-6 lg:px-10">
        <Spinner className="size-5 text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full justify-center bg-[#1e1e2f] pb-20 px-4 sm:px-6 lg:px-10">
      <div className="w-full max-w-3xl py-10 flex flex-col gap-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-richblack-25">
            Departments allowed to access {dashboardLabel} Dashboard
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            Society roles and the core {dashboardLabel} department are always
            allowed. Add or remove other departments below.
          </p>
        </div>

        {allowedConfig && (
          <section className="bg-gradient-to-br from-[#1e1e2f]/90 to-[#2c2c3e]/90 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>
                    🔓
                  </span>
                  <h2 className="text-base font-semibold text-richblack-25 sm:text-lg">
                    Allow all {dashboardLabel} members
                  </h2>
                </div>
                <p className="mt-1.5 text-xs text-gray-400 sm:text-sm">
                  Give every member of this department access to this dashboard.
                  When off, members still see the dashboard option but get a
                  coming-soon message until you turn this on.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 self-start sm:self-center">
                <span
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    allowedConfig.departmentMembersEnabled
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  {allowedConfig.departmentMembersEnabled ? "On" : "Off"}
                </span>
                <MemberAccessToggle
                  enabled={allowedConfig.departmentMembersEnabled === true}
                  disabled={updatingMemberAccess}
                  onToggle={handleMemberAccessToggle}
                  dashboardLabel={dashboardLabel}
                />
              </div>
            </div>
          </section>
        )}

        <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
          <SectionTitle icon="👥">Allowed departments</SectionTitle>
          {loadingAllowed ? (
            <p className="text-gray-500 py-4">
              <Spinner className="size-4 text-gray-400" />
            </p>
          ) : allowedConfig ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">
                  Always allowed (cannot be removed)
                </p>
                <div className="flex flex-wrap gap-2">
                  {allowedConfig.core?.map((d) => (
                    <span
                      key={d}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-sm font-medium"
                    >
                      {getAccountTypeLabel(d) || d}
                    </span>
                  ))}
                </div>
              </div>

              {allowedConfig.extra?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2">
                    Additionally allowed
                  </p>
                  <ul className="space-y-2">
                    {allowedConfig.extra.map((d) => (
                      <li
                        key={d}
                        className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-[#252536] border border-gray-500/20"
                      >
                        <span className="text-richblack-25 font-medium">
                          {getAccountTypeLabel(d) || d}
                        </span>
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
                <p className="text-xs font-medium text-gray-400 mb-2">
                  Add department
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={addDeptValue}
                    onChange={(e) => setAddDeptValue(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-richblack-25 focus:border-cyan-500 outline-none min-w-[200px]"
                  >
                    <option value="">Select department</option>
                    {AUTH_DEPARTMENTS.filter(
                      (d) => !allowedConfig.all?.includes(d),
                    ).map((d) => (
                      <option key={d} value={d}>
                        {getAccountTypeLabel(d) || d}
                      </option>
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
                {AUTH_DEPARTMENTS.filter((d) => !allowedConfig.all?.includes(d))
                  .length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    All departments are already in the allowed list.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <AddDepartmentUnlockAnimation
        isActive={showUnlockAnimation}
        onComplete={() => setShowUnlockAnimation(false)}
      />
    </div>
  );
}
