import { Outlet, useLocation, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import DepartmentSidebar from "./DepartmentSidebar";
import RequireDashboardAccess from "../guards/RequireDashboardAccess";

export default function DepartmentDashboardLayout() {
  const location = useLocation();
  const { departmentKey } = useParams();

  // Keep EM dashboard as its own route family.
  if (departmentKey === "Event Management") {
    return <Navigate to="/em-dashboard" replace />;
  }

  return (
    <RequireDashboardAccess dashboardKey={departmentKey}>
      <div className="relative flex min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#1e1e2f] mt-16">
        <DepartmentSidebar />
        <main className="flex-1 h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden">
          <div className="h-full w-full overflow-x-hidden">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="h-full w-full dashboard-content"
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </RequireDashboardAccess>
  );
}

