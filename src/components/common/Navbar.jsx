import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../../images/gfgLogo.png";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { SaxHome2Linear } from "@meysam213/iconsax-react";
import { SaxInfoCircleLinear } from "@meysam213/iconsax-react";
import { SaxProfile2UserLinear } from "@meysam213/iconsax-react";
import { SaxCalendarTickTwotone } from "@meysam213/iconsax-react";
import { SaxUserTwotone } from "@meysam213/iconsax-react";
import { SaxGalleryLinear } from "@meysam213/iconsax-react";
import { Settings } from "react-feather";
import ProfileDropDown from "./ProfileDropDown";
import Search from "../Search";
import { isSocietyRole } from "../../services/api";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  const location = useLocation();
  const darkRoutes = [
    "/events",
    "/contact",
    "/gallery",
    "/notfound",
    "/team",
    "/about",
    "/team2",
    "/results",
    "/admin",
    "/dashboard",
    "/profile",
    "/manage-team",
    "/manage-society",
    "/em-dashboard",
    "/leadership-transition",
    "/settings",
    "/jam-the-web",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];
  const isDarkNavbar =
    darkRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/em-dashboard/") ||
    location.pathname.startsWith("/leadership-transition/") ||
    location.pathname.startsWith("/dashboard/") ||
    location.pathname.startsWith("/reset-password/") ||
    location.pathname.startsWith("/join-team/");

  const navLinkClass = ({ isActive }) =>
    `flex items-center justify-center px-4 py-2 rounded-full font-medium transition-all duration-300 relative overflow-hidden border ${
      isActive
        ? "border-green-300/35 bg-green-500/20 text-green-100 shadow-[0_0_24px_rgba(34,197,94,0.28)]"
        : "border-transparent text-slate-300 hover:border-green-300/25 hover:bg-green-300/10 hover:text-green-100 hover:shadow-[0_0_18px_rgba(34,197,94,0.16)] backdrop-blur-sm"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `text-2xl font-semibold transition-all duration-300 ${
      isActive ? "text-green-400" : "text-gray-300 hover:text-green-300"
    }`;

  return (
    <>
      <div
        className="NAVBAR_CONTAINER fixed top-0 left-0 right-0 z-50 w-full px-6 py-3 backdrop-blur-md"
      >
         {/* Dark Navbar Background */}
  <div
    className={`absolute inset-0 transition-opacity duration-700 ease-in-out pointer-events-none
    bg-[#020808]/88 border-b border-green-300/10 shadow-[0_8px_26px_rgba(0,0,0,0.34)]
    ${isDarkNavbar ? "opacity-100" : "opacity-0"}`}
  />

  {/* Light Navbar Background */}
  <div
    className={`absolute inset-0 transition-opacity duration-700 ease-in-out pointer-events-none
    bg-[#020808]/82 border-b border-green-300/10 shadow-[0_8px_24px_rgba(0,0,0,0.28)]
    ${isDarkNavbar ? "opacity-0" : "opacity-100"}`}
  />
         {/* Navbar Content */}
  <div className="relative z-10 w-full flex items-center justify-between">

    <div className="flex items-center gap-3 min-w-0">
      <NavLink to="/" className="block">
        <img
          src={logo}
          alt="GFG Logo"
          className="w-9 h-9 rounded-full border border-green-300/45 bg-green-400/10 shadow-[0_0_22px_rgba(34,197,94,0.26)] cursor-pointer hover:scale-110 hover:border-green-300 transition-all duration-300 opacity-95"
        />
      </NavLink>

      <p className="font-bold text-xl bg-clip-text text-transparent 
bg-gradient-to-r from-white via-green-100 to-green-400 
font-montserrat opacity-95">
  GFGxBVCOE
</p>
    </div>

        <nav className="hidden sm:flex items-center gap-4">
          {user && (
            <Search
              variant="navbar"
              placeholder="Search members…"
              className="shrink-0l"
            />
          )}
          <ul className="flex gap-6 text-sm">
            <li>
              <NavLink to="/" className={navLinkClass}>
                <SaxHome2Linear className="mr-2" />
                <span>Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={navLinkClass}>
                <SaxInfoCircleLinear className="mr-2" />
                <span>About</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/team" className={navLinkClass}>
                <SaxProfile2UserLinear className="mr-2" />
                Team
              </NavLink>
            </li>
            <li>
              <NavLink to="/events" className={navLinkClass}>
                <SaxCalendarTickTwotone className="mr-2" />
                Events
              </NavLink>
            </li>
            <li>
              <NavLink to="/gallery" className={navLinkClass}>
                <SaxGalleryLinear className="mr-2" />
                Gallery
              </NavLink>
            </li>
            <li>
              <NavLink to="/contact" className={navLinkClass}>
                <SaxUserTwotone className="mr-2" />
                Contact
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="hidden sm:flex items-center gap-2">
          {authLoading ? (
            <div className="flex h-9 w-9 items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-600/80 to-gray-500/60 border border-white/20 flex items-center justify-center animate-pulse">
                <SaxUserTwotone className="h-4 w-4 text-gray-200/80" />
              </div>
            </div>
          ) : user ? (
            <div
              className={`flex items-center gap-2 rounded-full border px-2 py-1 shadow-sm transition-all duration-150 ${
                isDarkNavbar
                  ? "border-green-300/20 bg-green-300/5 text-green-100"
                  : "border-green-300/20 bg-green-300/5 text-green-100"
              }`}
            >
              <NavLink
                to="/settings"
                aria-label="Open settings"
                title="Settings"
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150 ${
                  isDarkNavbar
                    ? "hover:bg-green-300/12 hover:text-green-300"
                    : "hover:bg-green-300/12 hover:text-green-300"
                }`}
              >
                <Settings className="h-[18px] w-[18px]" />
              </NavLink>
              <ProfileDropDown onLogout={logout} isDarkNavbar={isDarkNavbar} embedded />
            </div>
          ) : (
            <>
              <NavLink to="/login">
                <button className="py-2 px-4 rounded-full border border-green-300/30 bg-white/[0.03] text-green-100 hover:bg-green-300/10 hover:border-green-300/55 font-medium transition text-sm">
                  Login
                </button>
              </NavLink>
              <NavLink to="/signup">
                <button className="py-2 px-5 bg-green-500 text-white font-semibold rounded-full hover:bg-green-400 transition-all duration-300 shadow-[0_0_24px_rgba(34,197,94,0.32)] hover:shadow-[0_0_32px_rgba(34,197,94,0.44)] text-sm">
                  Sign up
                </button>
              </NavLink>
            </>
          )}
        </div>

        <div className="sm:hidden z-50 flex items-center gap-2">
          {authLoading ? (
            <div className="flex h-9 w-9 items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-600/80 to-gray-500/60 border border-white/20 flex items-center justify-center animate-pulse">
                <SaxUserTwotone className="h-4 w-4 text-gray-200/80" />
              </div>
            </div>
          ) : user ? (
            <div
              className={`flex items-center gap-2 rounded-full border px-2 py-1 shadow-sm transition-all duration-150 ${
                isDarkNavbar
                  ? "border-green-300/20 bg-green-300/5 text-green-100"
                  : "border-green-300/20 bg-green-300/5 text-green-100"
              }`}
            >
              <NavLink
                to="/settings"
                aria-label="Open settings"
                title="Settings"
                onClick={() => {
                  if (isMenuOpen) setIsMenuOpen(false);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150 ${
                  isDarkNavbar
                    ? "hover:bg-green-300/12 hover:text-green-300"
                    : "hover:bg-green-300/12 hover:text-green-300"
                }`}
              >
                <Settings className="h-[18px] w-[18px]" />
              </NavLink>
              <ProfileDropDown
                onLogout={logout}
                isDarkNavbar={isDarkNavbar}
                avatarOnly
                showChevron
                embedded
                onBeforeToggle={() => {
                  if (isMenuOpen) setIsMenuOpen(false);
                }}
              />
            </div>
          ) : null}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-full border border-green-300/20 bg-green-300/5 p-2 text-green-100 transition hover:border-green-300/45 hover:bg-green-300/10 focus:outline-none"
          >
            {isMenuOpen ? (
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
        </div>
      </div>

      {/* CLICK OUTSIDE BACKDROP */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 sm:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-0 z-40 transform
    ${isMenuOpen ? "translate-x-40" : "translate-x-full"}
    transition-transform duration-300 ease-in-out sm:hidden
    bg-[#020808]/96
    backdrop-blur-sm
    border-l border-green-300/10 shadow-[0_0_26px_rgba(0,0,0,0.38)]
  `}
      >
        <ul className="flex flex-col ml-8 mt-8 justify-center h-full gap-8">
          <li>
            <NavLink
              to="/"
              className={mobileNavLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/about"
              className={mobileNavLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/team"
              className={mobileNavLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
              Team
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/events"
              className={mobileNavLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
              Events
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/gallery"
              className={mobileNavLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
              Gallery
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contact"
              className={mobileNavLinkClass}
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </NavLink>
          </li>
          <li className="mt-2 flex flex-col  gap-3">
            {user ? (
              <>
                {isSocietyRole(user.accountType) && (
                  <NavLink
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <button className="py-3 px-8 rounded-full border border-amber-400/50 text-amber-300 font-medium">
                      Signup Dashboard
                    </button>
                  </NavLink>
                )}
                <NavLink
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <button className="py-3 px-8 rounded-full border border-green-300/35 bg-green-300/5 text-green-200 font-medium">
                    Profile
                  </button>
                </NavLink>
                <button
                  onClick={async () => {
                    await logout();
                    setIsMenuOpen(false);
                    navigate("/");
                  }}
                  className="w-fit inline-flex py-3 px-8 rounded-full border border-green-300/35 bg-green-300/5 text-green-200 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full max-w-[120px] text-center"
                >
                  <button className="py-3 px-8 w-full rounded-full border border-green-300/35 bg-green-300/5 text-green-200 font-medium">
                    Login
                  </button>
                </NavLink>
                <NavLink
                  to="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-full inline-block"
                >
                  <button className="py-3 px-8 bg-green-500 text-white font-semibold rounded-full text-lg shadow-[0_0_24px_rgba(34,197,94,0.32)]">
                    Sign up
                  </button>
                </NavLink>
              </>
            )}
          </li>
        </ul>
      </div>
    </>
  );
}

export default Navbar;
