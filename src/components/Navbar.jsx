import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../images/gfgLogo.png";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { SaxHome2Linear } from '@meysam213/iconsax-react'
import { SaxInfoCircleLinear } from '@meysam213/iconsax-react'
import { SaxProfile2UserLinear } from '@meysam213/iconsax-react'
import { SaxCalendarTickTwotone } from '@meysam213/iconsax-react'
import { SaxUserTwotone } from '@meysam213/iconsax-react'
import { SaxGalleryLinear } from '@meysam213/iconsax-react'
import ProfileDropDown from "./ProfileDropDown";
import Search from "./Search";
import { isSocietyRole } from "../services/api";

function Navbar() {
  const navMain = useRef();
  const navList = useRef();
  const joinBtn = useRef();
  const logoRef = useRef();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    tl.from(navMain.current, {
      opacity: 0,
      y: -40,
      duration: 0.6,
    })
      .from(
        logoRef.current,
        {
          opacity: 0,
          x: -20,
          duration: 0.5,
        },
        "-=0.3"
      )
      .from(
        navList.current?.children || [],
        {
          opacity: 0,
          y: 20,
          duration: 0.4,
          stagger: 0.1,
        },
        "-=0.2"
      )
      .from(
        joinBtn.current,
        {
          opacity: 0,
          scale: 0.8,
          duration: 0.5,
        },
        "-=0.2"
      );
  }, []);

  const location = useLocation();
  const darkRoutes = ["/events", "/contact", "/gallery", "/notfound", "/team", "/about", "/team2", "/results", "/quiz", "/leaderboard", "/admin", "/dashboard", "/profile", "/manage-team", "/manage-society", "/uploadevent", "/login", "/signup", "/forgot-password", "/reset-password"];
  const isDarkNavbar = darkRoutes.includes(location.pathname) || location.pathname.startsWith("/uploadevent/") || location.pathname.startsWith("/reset-password/") || location.pathname.startsWith("/join-team/");

  const navLinkClass = ({ isActive }) =>
    `flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${isActive
      ? "text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30"
      : "text-green-100 hover:text-white hover:bg-green-700/50 backdrop-blur-sm"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `text-2xl font-semibold transition-all duration-300 ${isActive ? "text-green-400" : "text-gray-300 hover:text-green-300"
    }`;

  return (
    <>
      <div
        ref={navMain}
        className={`NAVBAR_CONTAINER fixed top-0 left-0 right-0 z-50 w-full flex items-center justify-between px-6 py-3 
      ${isDarkNavbar
            ? "bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border-b border-gray-500/40"
            : "bg-gradient-to-r from-green-900/95 via-green-800/95 to-emerald-800/95 border-b border-green-400/30"} 
      backdrop-blur-xl shadow-2xl`}
      >
        <div ref={logoRef} className="flex items-center gap-3 min-w-0">
          <NavLink to="/" className="block">
            <img
              src={logo}
              alt="GFG Logo"
              className="w-10 h-10 rounded-full border-2 border-green-400 shadow-lg cursor-pointer hover:scale-110 transition-transform duration-300"
            />
          </NavLink>
          <p className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-emerald-300 to-green-400 font-montserrat tracking-wide">
            GFGxBVCOE
          </p>
        </div>

        <nav className="hidden sm:flex items-center gap-4">
          {user && (
            <Search variant="navbar" placeholder="Search members…" className="shrink-0" />
          )}
          <ul ref={navList} className="flex gap-6 text-sm">
            <li><NavLink to="/" className={navLinkClass}><SaxHome2Linear className="mr-2" /><span>Home</span></NavLink></li>
            <li><NavLink to="/about" className={navLinkClass}><SaxInfoCircleLinear className="mr-2" /><span>About</span></NavLink></li>
            <li><NavLink to="/team" className={navLinkClass}><SaxProfile2UserLinear className="mr-2" />Team</NavLink></li>
            <li><NavLink to="/events" className={navLinkClass}><SaxCalendarTickTwotone className="mr-2" />Events</NavLink></li>
            <li><NavLink to="/gallery" className={navLinkClass}><SaxGalleryLinear className="mr-2" />Gallery</NavLink></li>
            <li><NavLink to="/contact" className={navLinkClass}><SaxUserTwotone className="mr-2" />Contact</NavLink></li>
          </ul>
        </nav>
        <div ref={joinBtn} className="hidden sm:flex items-center gap-2">
          {user ? (
            <ProfileDropDown onLogout={logout} isDarkNavbar={isDarkNavbar} />
          ) : (
            <>
              <NavLink to="/login">
                <button className="py-2 px-4 rounded-full border border-green-400/50 text-green-200 hover:bg-green-700/50 font-medium transition text-sm">
                  Login
                </button>
              </NavLink>
              <NavLink to="/signup">
                <button className="py-2 px-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full hover:from-green-400 hover:to-emerald-400 transition-all duration-300 shadow-xl hover:shadow-green-500/40 text-sm">
                  Sign up
                </button>
              </NavLink>
            </>
          )}
        </div>

        <div className="sm:hidden z-50 flex items-center gap-2">
          {user && (
            <ProfileDropDown onLogout={logout} isDarkNavbar={isDarkNavbar} avatarOnly showChevron />
          )}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-green-100 focus:outline-none">
            {isMenuOpen ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* CLICK OUTSIDE BACKDROP */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 sm:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div className={`fixed inset-0 z-40 transform
    ${isMenuOpen ? 'translate-x-40' : 'translate-x-full'}
    transition-transform duration-300 ease-in-out sm:hidden
    bg-gradient-to-br from-[#1e1e2f]/60 to-[#2c2c3e]/60
    backdrop-blur-xl
    border border-white/10
  `}>
        <ul className="flex flex-col ml-8 mt-8 justify-center h-full gap-8">
          <li><NavLink to="/" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>Home</NavLink></li>
          <li><NavLink to="/about" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>About</NavLink></li>
          <li><NavLink to="/team" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>Team</NavLink></li>
          <li><NavLink to="/events" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>Events</NavLink></li>
          <li><NavLink to="/gallery" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>Gallery</NavLink></li>
          <li><NavLink to="/contact" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>Contact</NavLink></li>
          <li><NavLink to="/quiz" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>Quiz</NavLink></li>
          <li className="mt-2 flex flex-col  gap-3">
            {user ? (
              <>
                {isSocietyRole(user.accountType) && (
                  <NavLink to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <button className="py-3 px-8 rounded-full border border-amber-400/50 text-amber-300 font-medium">
                      Dashboard
                    </button>
                  </NavLink>
                )}
                <NavLink to="/profile" onClick={() => setIsMenuOpen(false)}>
                  <button className="py-3 px-8 rounded-full border border-cyan-400/50 text-cyan-300 font-medium">
                    Profile
                  </button>
                </NavLink>
                <button
                  onClick={async () => {
                    await logout();
                    setIsMenuOpen(false);
                    navigate("/");
                  }}
                  className="w-fit inline-flex py-3 px-8 rounded-full border border-cyan-400/50 text-green-300 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setIsMenuOpen(false)} className="w-full max-w-[120px] text-center">
                  <button className="py-3 px-8 w-full rounded-full border border-green-400/50 text-green-300 font-medium">
                    Login
                  </button>
                </NavLink>
                <NavLink to="/signup" onClick={() => setIsMenuOpen(false)} className="glowing-btn-wrapper blue rounded-full inline-block">
                  <button className="py-3 px-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full text-lg">
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