import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { userCanManageEvents } from "../../services/api";
import EventSidebar from "./EventSidebar";
import { motion } from "framer-motion";

export default function EventDashboardLayout() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] w-full items-center justify-center bg-[#1e1e2f]">
        <div className="h-10 w-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] w-full items-center justify-center bg-[#1e1e2f]">
        <p className="text-gray-400">Redirecting to login…</p>
        <Navigate to="/login" replace />
      </div>
    );
  }

  // VectorVision uses its own email allowlist, which is verified by the API.
  // Do not make access depend on an Event Management role as well.
  const isVectorVisionAdmin = location.pathname === "/vectorvision-admin";

  if (!isVectorVisionAdmin && !userCanManageEvents(user)) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] w-full items-center justify-center bg-[#1e1e2f]">
        <p className="text-gray-400">Redirecting…</p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#1e1e2f]">
      <EventSidebar />
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden pt-16 sm:pt-20">
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
  );
}
