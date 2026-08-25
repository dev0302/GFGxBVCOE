import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { getDashboardAllowed, getMe, updateDashboardMemberAccess } from "../../services/api";
import { canManageDepartmentDashboard } from "../../utils/dashboardAccess";

/** Settings shown on a department section, not in the shared allowed-departments page. */
export default function MemberSectionAccessToggle({ section, title }) {
  const { departmentKey } = useParams();
  const { user, setUser } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [updating, setUpdating] = useState(false);
  const canManage = canManageDepartmentDashboard(user, departmentKey);

  const loadSetting = useCallback(async () => {
    try {
      const res = await getDashboardAllowed(departmentKey);
      setEnabled(res?.data?.memberSections?.[section] === true);
    } catch (_) {
      // The page remains usable if this non-essential setting cannot load.
    }
  }, [departmentKey, section]);

  useEffect(() => {
    if (canManage) loadSetting();
  }, [canManage, loadSetting]);

  if (!canManage) return null;

  const toggle = async () => {
    const nextEnabled = !enabled;
    setUpdating(true);
    try {
      await updateDashboardMemberAccess(departmentKey, nextEnabled, section);
      setEnabled(nextEnabled);
      const me = await getMe();
      if (me.user) setUser(me.user);
      toast.success(nextEnabled ? `Department members can now access ${title}.` : `Department member access to ${title} disabled.`);
    } catch (err) {
      toast.error(err.message || "Failed to update member access");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-gray-500/20 bg-[#252536] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-richblack-25">Allow department members</p>
        <p className="mt-0.5 text-xs text-gray-400">Give members access to {title}.</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${enabled ? "Disable" : "Enable"} member access to ${title}`}
        onClick={toggle}
        disabled={updating}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-wait disabled:opacity-60 ${enabled ? "bg-cyan-500" : "bg-gray-600"}`}
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}
