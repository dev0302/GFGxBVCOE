import { lazy, Suspense } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Navbar from "./components/common/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketProvider";
import { GlobalModalProvider } from "./context/GlobalModalProvider";
import { UploadTransferProvider } from "./context/UploadTransferContext";
import { AnimatePresence, motion } from "framer-motion";
import IncomingUploadModal from "./components/IncomingUploadModal";
import AirdropAnimationLayer from "./components/AirdropAnimationLayer";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Events = lazy(() => import("./pages/Events"));
const UploadEventByLink = lazy(() => import("./pages/UploadEventByLink"));
const EventDashboardLayout = lazy(() =>
  import("./components/EventDashboard/EventDashboardLayout")
);
const UploadNewEvent = lazy(() => import("./pages/eventDashboard/UploadNewEvent"));
const GenerateLink = lazy(() => import("./pages/eventDashboard/GenerateLink"));
const EMDepartmentsAllowed = lazy(() =>
  import("./pages/eventDashboard/DepartmentsAllowed")
);
const ManageEvents = lazy(() => import("./pages/eventDashboard/ManageEvents"));
const UpcomingEventPage = lazy(() =>
  import("./pages/eventDashboard/UpcomingEventPage")
);
const GenerateQR = lazy(() => import("./pages/eventDashboard/GenerateQR"));
const DepartmentDashboardLayout = lazy(() =>
  import("./components/DepartmentDashboard/DepartmentDashboardLayout")
);
const DepartmentDepartmentsAllowed = lazy(() =>
  import("./pages/dashboard/DepartmentsAllowed")
);
const NotFound = lazy(() => import("./components/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminSignupConfig = lazy(() => import("./pages/AdminSignupConfig"));
const Profile = lazy(() => import("./pages/Profile"));
const Contact = lazy(() => import("./pages/Contact"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Team2 = lazy(() => import("./pages/Team2"));
const GFGBentoGrid = lazy(() => import("./components/GFGBentoGrid"));
const ResultPage = lazy(() => import("./pages/ResultPage"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const QuizResult = lazy(() => import("./pages/QuizResult"));
const JamTheWeb = lazy(() => import("./pages/JamTheWeb"));
const ManageTeam = lazy(() => import("./pages/ManageTeam"));
const ManageSociety = lazy(() => import("./pages/ManageSociety"));
const Settings = lazy(() => import("./pages/Settings"));
const JoinTeamByLink = lazy(() => import("./pages/JoinTeamByLink"));
const LeadershipTransitionLayout = lazy(() =>
  import("./components/LeadershipTransition/LeadershipTransitionLayout")
);
const Promotions = lazy(() => import("./pages/leadershipTransition/Promotions"));
const LeadershipPersonsAllowed = lazy(() =>
  import("./pages/leadershipTransition/PersonsAllowed")
);
const LeadershipHistory = lazy(() =>
  import("./pages/leadershipTransition/History")
);

const routeFallback = (
  <div className="flex min-h-[50vh] items-center justify-center bg-[#020808] text-sm text-green-100/70">
    Loading...
  </div>
);

function App() {
  const location = useLocation();
  const dropdownBasePaths = [
    "/dashboard",
    "/profile",
    "/manage-team",
    "/manage-society",
    "/settings",
    "/jam-the-web",
  ];

  const isDashboardLike =
    location.pathname.startsWith("/em-dashboard") ||
    location.pathname.startsWith("/dashboard/") ||
    location.pathname.startsWith("/leadership-transition");

  // Keep this stable for tab switches so layouts (sidebars) don't remount.
  const dashboardLikeMotionKey = (() => {
    if (location.pathname.startsWith("/em-dashboard")) return "/em-dashboard";
    if (location.pathname.startsWith("/leadership-transition"))
      return "/leadership-transition";
    if (location.pathname.startsWith("/dashboard/")) {
      const parts = location.pathname.split("/");
      const departmentKey = parts[2] || "unknown";
      return `/dashboard/${departmentKey}`;
    }
    return location.pathname;
  })();

  const shouldAnimatePage =
    !isDashboardLike &&
    dropdownBasePaths.some(
      (base) =>
        location.pathname === base || location.pathname.startsWith(base + "/"),
    );

  return (
    <AuthProvider>
      <SocketProvider>
        <GlobalModalProvider>
          <UploadTransferProvider>
            <div className="min-h-screen flex flex-col overflow-x-hidden">
              <Toaster
                position="top-right"
                theme="dark"
                toastOptions={{
                  style: {
                    background:
                      "linear-gradient(to bottom right, #1e1e2f, #2c2c3e)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#e5e5e5",
                  },
                  className: "sonner-toast-darkthemebg",
                }}
                closeButton
              />
              <Navbar />
              <AirdropAnimationLayer />
              <IncomingUploadModal />
              <AnimatePresence mode="wait">
                <motion.main
                  key={dashboardLikeMotionKey}
                  initial={
                    shouldAnimatePage
                      ? { opacity: 0, scale: 0.98 }
                      : { opacity: 1, scale: 1 }
                  }
                  animate={
                    shouldAnimatePage
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 1, scale: 1 }
                  }
                  exit={
                    shouldAnimatePage
                      ? { opacity: 0, scale: 0.98 }
                      : { opacity: 1, scale: 1 }
                  }
                  transition={
                    shouldAnimatePage
                      ? { duration: 0.22, ease: "easeOut" }
                      : { duration: 0 }
                  }
                  className="flex-1 flex flex-col"
                >
                  <Routes location={location}>
                    <Route path="/" element={<Home />} />
                    {/* <Route element={<AuthAwareLayout />}> */}
                    <Route path="/about" element={<About />} />
                    <Route path="/team" element={<Team2 />} />
                    <Route path="/events" element={<Events />} />
                    {/* Backward-compatible redirects (older URL: /uploadevent) */}
                    <Route
                      path="/uploadevent/link/:token"
                      element={<UploadEventByLink />}
                    />
                    <Route
                      path="/uploadevent"
                      element={<Navigate to="/em-dashboard" replace />}
                    />
                    <Route path="/em-dashboard">
                      <Route
                        path="link/:token"
                        element={<UploadEventByLink />}
                      />
                      <Route element={<EventDashboardLayout />}>
                        <Route
                          index
                          element={
                            <Navigate to="/em-dashboard/upload" replace />
                          }
                        />
                        <Route path="upload" element={<UploadNewEvent />} />
                        <Route
                          path="generate-link"
                          element={<GenerateLink />}
                        />
                        <Route
                          path="departments"
                          element={<EMDepartmentsAllowed />}
                        />
                        <Route path="generate-qr" element={<GenerateQR />} />
                        <Route path="manage" element={<ManageEvents />} />
                        <Route
                          path="upcoming"
                          element={<UpcomingEventPage />}
                        />
                      </Route>
                    </Route>
                    <Route path="/dashboard/:departmentKey">
                      <Route element={<DepartmentDashboardLayout />}>
                        {/* Clicking `/dashboard/:departmentKey` should land on the first sidebar tab. */}
                        <Route
                          index
                          element={<Navigate to="departments" replace />}
                        />
                        <Route
                          path="departments"
                          element={<DepartmentDepartmentsAllowed />}
                        />
                        <Route path="generate-qr" element={<GenerateQR />} />
                      </Route>
                    </Route>
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route
                      path="/reset-password/:token"
                      element={<ResetPassword />}
                    />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/dashboard" element={<AdminSignupConfig />} />
                    <Route path="/leadership-transition">
                      <Route element={<LeadershipTransitionLayout />}>
                        <Route
                          index
                          element={
                            <Navigate
                              to="/leadership-transition/promotions"
                              replace
                            />
                          }
                        />
                        <Route path="promotions" element={<Promotions />} />
                        <Route path="history" element={<LeadershipHistory />} />
                        <Route
                          path="persons-allowed"
                          element={<LeadershipPersonsAllowed />}
                        />
                      </Route>
                    </Route>
                    <Route
                      path="/admin"
                      element={<Navigate to="/dashboard" replace />}
                    />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/manage-team" element={<ManageTeam />} />
                    <Route path="/manage-society" element={<ManageSociety />} />
                    <Route
                      path="/join-team/:token"
                      element={<JoinTeamByLink />}
                    />
                    <Route path="/notfound" element={<NotFound></NotFound>} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/bentogrid" element={<GFGBentoGrid />} />
                    <Route path="/results" element={<ResultPage />} />
                    <Route path="/quiz" element={<Quiz />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/quiz/result" element={<QuizResult />} />
                    <Route path="/jam-the-web" element={<JamTheWeb />} />
                    {/* </Route> */}
                  </Routes>
                </motion.main>
              </AnimatePresence>
            </div>
          </UploadTransferProvider>
        </GlobalModalProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
export default App;
