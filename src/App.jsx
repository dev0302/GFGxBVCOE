import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketProvider";
import { GlobalModalProvider } from "./context/GlobalModalProvider";
import { UploadTransferProvider } from "./context/UploadTransferContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Events from "./pages/Events";
import UploadEventByLink from "./pages/UploadEventByLink";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminSignupConfig from "./pages/AdminSignupConfig";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import Gallery from "./pages/Gallery";
import Team2 from "./pages/Team2";
import ResultPage from "./pages/ResultPage";
import Quiz from "./pages/Quiz";
import Leaderboard from "./pages/Leaderboard";
import QuizResult from "./pages/QuizResult";
import JamTheWeb from "./pages/JamTheWeb";
import ManageTeam from "./pages/ManageTeam";
import ManageSociety from "./pages/ManageSociety";
import Settings from "./pages/Settings";
import JoinTeamByLink from "./pages/JoinTeamByLink";
import MemberEnrollment from "./pages/MemberEnrollment";
import VectorVisionAdmin from "./pages/VectorVisionAdmin";
import UploadNewEvent from "./pages/eventDashboard/UploadNewEvent";
import GenerateLink from "./pages/eventDashboard/GenerateLink";
import EMDepartmentsAllowed from "./pages/eventDashboard/DepartmentsAllowed";
import ForceDeletePermissions from "./pages/eventDashboard/ForceDeletePermissions";
import ManageEvents from "./pages/eventDashboard/ManageEvents";
import UpcomingEventPage from "./pages/eventDashboard/UpcomingEventPage";
import GenerateQR from "./pages/eventDashboard/GenerateQR";
import VectorVision from "./pages/eventDashboard/VectorVision";
import DepartmentDepartmentsAllowed from "./pages/dashboard/DepartmentsAllowed";
import Promotions from "./pages/leadershipTransition/Promotions";
import LeadershipPersonsAllowed from "./pages/leadershipTransition/PersonsAllowed";
import LeadershipHistory from "./pages/leadershipTransition/History";
import EventDashboardLayout from "./components/EventDashboard/EventDashboardLayout";
import DepartmentDashboardLayout from "./components/DepartmentDashboard/DepartmentDashboardLayout";
import LeadershipTransitionLayout from "./components/LeadershipTransition/LeadershipTransitionLayout";
import Navbar from "./components/common/Navbar";
import NotFound from "./components/NotFound";
import GFGBentoGrid from "./components/GFGBentoGrid";
import IncomingUploadModal from "./components/IncomingUploadModal";
import AirdropAnimationLayer from "./components/AirdropAnimationLayer";

function App() {
  const location = useLocation();
  const dropdownBasePaths = ["/dashboard", "/profile", "/manage-team", "/manage-society", "/settings", "/jam-the-web"];
  const isDashboardLike =
    location.pathname.startsWith("/em-dashboard") ||
    location.pathname.startsWith("/vectorvision-admin") ||
    location.pathname.startsWith("/dashboard/") ||
    location.pathname.startsWith("/leadership-transition");

  const dashboardLikeMotionKey = (() => {
    if (location.pathname.startsWith("/em-dashboard")) return "/em-dashboard";
    if (location.pathname.startsWith("/vectorvision-admin")) return "/vectorvision-admin";
    if (location.pathname.startsWith("/leadership-transition")) return "/leadership-transition";
    if (location.pathname.startsWith("/dashboard/")) return `/dashboard/${location.pathname.split("/")[2] || "unknown"}`;
    return location.pathname;
  })();
  const shouldAnimatePage = !isDashboardLike && dropdownBasePaths.some((base) => location.pathname === base || location.pathname.startsWith(`${base}/`));

  return (
    <AuthProvider>
      <SocketProvider>
        <GlobalModalProvider>
          <UploadTransferProvider>
            <div className="min-h-screen flex flex-col overflow-x-hidden">
              <Toaster position="top-right" theme="dark" toastOptions={{ style: { background: "linear-gradient(to bottom right, #1e1e2f, #2c2c3e)", border: "1px solid rgba(255,255,255,0.1)", color: "#e5e5e5" }, className: "sonner-toast-darkthemebg" }} closeButton />
              <Navbar />
              <AirdropAnimationLayer />
              <IncomingUploadModal />
              <AnimatePresence mode="wait">
                <motion.main key={dashboardLikeMotionKey} initial={shouldAnimatePage ? { opacity: 0, scale: 0.98 } : false} animate={{ opacity: 1, scale: 1 }} exit={shouldAnimatePage ? { opacity: 0, scale: 0.98 } : false} transition={shouldAnimatePage ? { duration: 0.22, ease: "easeOut" } : { duration: 0 }} className="flex-1 flex flex-col">
                  <Routes location={location}>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/team" element={<Team2 />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/member-enrollment" element={<MemberEnrollment />} />
                    <Route path="/vectorvision-admin" element={<EventDashboardLayout />}><Route index element={<VectorVisionAdmin />} /></Route>
                    <Route path="/uploadevent/link/:token" element={<UploadEventByLink />} />
                    <Route path="/uploadevent" element={<Navigate to="/em-dashboard" replace />} />
                    <Route path="/em-dashboard">
                      <Route path="link/:token" element={<UploadEventByLink />} />
                      <Route element={<EventDashboardLayout />}>
                        <Route index element={<Navigate to="/em-dashboard/upload" replace />} />
                        <Route path="upload" element={<UploadNewEvent />} />
                        <Route path="generate-link" element={<GenerateLink />} />
                        <Route path="departments" element={<EMDepartmentsAllowed />} />
                        <Route path="generate-qr" element={<GenerateQR />} />
                        <Route path="vector-vision" element={<VectorVision />} />
                        <Route path="force-delete" element={<ForceDeletePermissions />} />
                        <Route path="manage" element={<ManageEvents />} />
                        <Route path="upcoming" element={<UpcomingEventPage />} />
                      </Route>
                    </Route>
                    <Route path="/dashboard/:departmentKey" element={<DepartmentDashboardLayout />}><Route index element={<Navigate to="departments" replace />} /><Route path="departments" element={<DepartmentDepartmentsAllowed />} /><Route path="generate-qr" element={<GenerateQR />} /></Route>
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/dashboard" element={<AdminSignupConfig />} />
                    <Route path="/leadership-transition" element={<LeadershipTransitionLayout />}><Route index element={<Navigate to="/leadership-transition/promotions" replace />} /><Route path="promotions" element={<Promotions />} /><Route path="history" element={<LeadershipHistory />} /><Route path="persons-allowed" element={<LeadershipPersonsAllowed />} /></Route>
                    <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/manage-team" element={<ManageTeam />} />
                    <Route path="/manage-society" element={<ManageSociety />} />
                    <Route path="/join-team/:token" element={<JoinTeamByLink />} />
                    <Route path="/notfound" element={<NotFound />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/bentogrid" element={<GFGBentoGrid />} />
                    <Route path="/results" element={<ResultPage />} />
                    <Route path="/quiz" element={<Quiz />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/quiz/result" element={<QuizResult />} />
                    <Route path="/jam-the-web" element={<JamTheWeb />} />
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
