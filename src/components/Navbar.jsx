import { NavLink, useLocation } from "react-router-dom";
import logo from "../images/gfgLogo.png";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { SaxHome2Linear } from '@meysam213/iconsax-react'
import { SaxInfoCircleLinear } from '@meysam213/iconsax-react'
import { SaxProfile2UserLinear } from '@meysam213/iconsax-react'
import { SaxCalendarTickTwotone } from '@meysam213/iconsax-react'
import { SaxUserTwotone } from '@meysam213/iconsax-react'


function Navbar() {
  const navMain = useRef();
  const navList = useRef();
  const joinBtn = useRef();
  const logoRef = useRef();

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
        "-=0.3" // overlaps with previous
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
        //   opacity: 0,
          scale: 0.8,
          duration: 10,
        },
        "-=0.2"
      );
  }, []);

  const isTeamPage = location.pathname === "/team";

  return (
    <div
      ref={navMain}
      className="NAVBAR_CONTAINER fixed top-0 left-0 right-0 z-50 w-full flex items-center justify-between px-6 py-3 bg-gradient-to-r from-green-900/95 via-green-800/95 to-emerald-800/95 backdrop-blur-xl border-b border-green-400/30 shadow-2xl"
    >
      <div ref={logoRef} className="flex items-center gap-3">
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

      <nav>
        <ul ref={navList} className="hidden gap-8 text-sm sm:flex">
          <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? "text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30"
                  : "text-green-100 hover:text-white hover:bg-green-700/50 backdrop-blur-sm"
              }`
            }
          >
            <SaxHome2Linear className="mr-2" />
            <span>Home</span>
          </NavLink>
        </li>


          <li>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? "text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30"
                    : "text-green-100 hover:text-white hover:bg-green-700/50 backdrop-blur-sm"
                }`
              }
            > <SaxInfoCircleLinear className="mr-2"/>
              <span>About</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/team"
              className={({ isActive }) =>
                `flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? "text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30"
                    : "text-green-100 hover:text-white hover:bg-green-700/50 backdrop-blur-sm"
                }`
              }
            >
              <SaxProfile2UserLinear className="mr-2" />
              Team
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/events"
              className={({ isActive }) =>
                `flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? "text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30"
                    : "text-green-100 hover:text-white hover:bg-green-700/50 backdrop-blur-sm"
                }`
              }
            >
              <SaxCalendarTickTwotone className="mr-2"/>
              Events
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? "text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30"
                    : "text-green-100 hover:text-white hover:bg-green-700/50 backdrop-blur-sm"
                }`
              }
            >
              <SaxUserTwotone className="mr-2" />
              Contact
            </NavLink>
          </li>
        </ul>
      </nav>

      <NavLink to="/notfound">
        <button
        ref={joinBtn}
        className="py-2 px-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full hover:from-green-400 hover:to-emerald-400 transition-all duration-300 shadow-xl hover:shadow-green-500/40 border border-green-300/30 text-sm hover:scale-105"
      >
        Join Us
      </button>
      </NavLink>
    </div>
  );
}

export default Navbar;
