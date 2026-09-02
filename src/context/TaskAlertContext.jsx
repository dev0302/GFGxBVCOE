/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getTasks } from "../services/api";
import { useAuth } from "./AuthContext";

const TaskAlertContext = createContext({ hasAssignedTasks: false, refreshTaskAlert: async () => {} });

export function TaskAlertProvider({ children }) {
  const { user } = useAuth();
  const [hasAssignedTasks, setHasAssignedTasks] = useState(false);

  const refreshTaskAlert = useCallback(async () => {
    if (!user?._id) {
      setHasAssignedTasks(false);
      return;
    }
    try {
      const { tasks } = await getTasks("ONGOING");
      setHasAssignedTasks(tasks.some((task) =>
        task.status === "ONGOING" && String(task.assignedTo?.id || "") === String(user._id),
      ));
    } catch {
      // Task indicators are non-blocking; keep the app usable if this request fails.
    }
  }, [user?._id]);

  useEffect(() => {
    refreshTaskAlert();
    if (!user?._id) return undefined;
    const interval = window.setInterval(refreshTaskAlert, 60_000);
    return () => window.clearInterval(interval);
  }, [refreshTaskAlert, user?._id]);

  return <TaskAlertContext.Provider value={{ hasAssignedTasks, refreshTaskAlert }}>{children}</TaskAlertContext.Provider>;
}

export const useTaskAlert = () => useContext(TaskAlertContext);
