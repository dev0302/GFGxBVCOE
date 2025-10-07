import { NavLink, useLocation } from "react-router-dom";
import logo from "../images/gfgLogo.png";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";
import { SaxHome2Linear } from '@meysam213/iconsax-react'
import { SaxInfoCircleLinear } from '@meysam213/iconsax-react'
import { SaxProfile2UserLinear } from '@meysam213/iconsax-react'
import { SaxCalendarTickTwotone } from '@meysam213/iconsax-react'
import { SaxUserTwotone } from '@meysam213/iconsax-react'
import { SaxGalleryLinear } from '@meysam213/iconsax-react'
import Timer from "../pages/Timer";



function Navbar() {
  const navMain = useRef();
  const navList = useRef();
  const joinBtn = useRef();
  const logoRef = useRef();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          opacity: 0,
          scale: 0.8,
          duration: 0.5,
        },
        "-=0.2"
      );
  }, []);
  
  const location = useLocation();
  const darkRoutes = ["/events", "/contact","/gallery","/notfound","/team","/about","/team2","/results","/quiz","/leaderboard"];
  const isDarkNavbar = darkRoutes.includes(location.pathname);

  const navLinkClass = ({ isActive }) =>
    `flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
      isActive
        ? "text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30"
        : "text-green-100 hover:text-white hover:bg-green-700/50 backdrop-blur-sm"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `text-2xl font-semibold transition-all duration-300 ${
      isActive ? "text-green-400" : "text-gray-300 hover:text-green-300"
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

        <nav className="hidden sm:flex items-center">
          <ul ref={navList} className="flex gap-6 text-sm">
            <li><NavLink to="/" className={navLinkClass}><SaxHome2Linear className="mr-2" /><span>Home</span></NavLink></li>
            <li><NavLink to="/about" className={navLinkClass}><SaxInfoCircleLinear className="mr-2"/><span>About</span></NavLink></li>
            <li><NavLink to="/team" className={navLinkClass}><SaxProfile2UserLinear className="mr-2" />Team</NavLink></li>
            <li><NavLink to="/events" className={navLinkClass}><SaxCalendarTickTwotone className="mr-2"/>Events</NavLink></li>
            <li><NavLink to="/gallery" className={navLinkClass}><SaxGalleryLinear className="mr-2"/>Gallery</NavLink></li>
            <li><NavLink to="/contact" className={navLinkClass}><SaxUserTwotone className="mr-2" />Contact</NavLink></li>
            <li><NavLink to="/quiz" className={navLinkClass}>Quiz</NavLink></li>
          </ul>
        </nav>
        <div ref={joinBtn} className="hidden sm:block">
          
            <NavLink to="/notfound">
              <button
              className="py-2 px-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full hover:from-green-400 hover:to-emerald-400 transition-all duration-300 shadow-xl hover:shadow-green-500/40 text-sm"
            >
              Join Us
            </button>
            </NavLink>
        </div>

        <div className="sm:hidden z-50">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-green-100 focus:outline-none">
            {isMenuOpen ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      <div className={`fixed inset-0 z-40 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out sm:hidden bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e]`}>
        <ul className="flex flex-col items-center justify-center h-full gap-8">
            <li><NavLink to="/" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>Home</NavLink></li>
            <li><NavLink to="/about" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>About</NavLink></li>
            <li><NavLink to="/team" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>Team</NavLink></li>
            <li><NavLink to="/events" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>Events</NavLink></li>
            <li><NavLink to="/gallery" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>Gallery</NavLink></li>
            <li><NavLink to="/contact" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>Contact</NavLink></li>
            <li><NavLink to="/quiz" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>Quiz</NavLink></li>
            <li className="mt-8">
              <div className="glowing-btn-wrapper blue rounded-full">
                <NavLink 
                  to="/notfound" 
                  onClick={() => setIsMenuOpen(false)} 
                  className="inline-block"
                >
                  <button
                    className="py-3 px-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full text-lg"
                  >
                    Join Us
                  </button>
                </NavLink>
              </div>

            </li>
        </ul>
      </div>
    </>
  );
}

export default Navbar;
