import { Link, NavLink } from "react-router-dom";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import logo from "../images/gfgLogo.png";

function Navbar() {
    const navbarRef = useRef(null);
    const logoRef = useRef(null);
    const titleRef = useRef(null);
    const navRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        // Initial animation timeline
        const tl = gsap.timeline({ ease: "power3.out" });
        
        // Navbar entrance animation
        tl.fromTo(navbarRef.current, 
            { y: -100, opacity: 0, backdropFilter: "blur(0px)" },
            { y: 0, opacity: 1, backdropFilter: "blur(20px)", duration: 1 }
        );
        
        // Logo animation
        tl.fromTo(logoRef.current,
            { scale: 0, rotation: -180 },
            { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)" },
            "-=0.5"
        );
        
        // Title animation
        tl.fromTo(titleRef.current,
            { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.8, ease: "power2.out" },
            "-=0.6"
        );
        
        // Navigation items animation
        tl.fromTo(navRef.current.children,
            { y: -30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
            "-=0.4"
        );
        
        // Button animation
        tl.fromTo(buttonRef.current,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" },
            "-=0.3"
        );

        // Hover animations for nav items
        const navItems = navRef.current?.children;
        if (navItems) {
            Array.from(navItems).forEach(item => {
                const link = item.querySelector('a');
                if (link) {
                    link.addEventListener('mouseenter', () => {
                        gsap.to(link, { 
                            y: -2, 
                            scale: 1.05, 
                            duration: 0.3, 
                            ease: "power2.out" 
                        });
                    });
                    
                    link.addEventListener('mouseleave', () => {
                        gsap.to(link, { 
                            y: 0, 
                            scale: 1, 
                            duration: 0.3, 
                            ease: "power2.out" 
                        });
                    });
                }
            });
        }

        // Logo hover animation
        if (logoRef.current) {
            logoRef.current.addEventListener('mouseenter', () => {
                gsap.to(logoRef.current, { 
                    rotation: 360, 
                    scale: 1.1, 
                    duration: 0.6, 
                    ease: "power2.out" 
                });
            });
            
            logoRef.current.addEventListener('mouseleave', () => {
                gsap.to(logoRef.current, { 
                    rotation: 0, 
                    scale: 1, 
                    duration: 0.6, 
                    ease: "power2.out" 
                });
            });
        }

        // Button hover animation
        if (buttonRef.current) {
            buttonRef.current.addEventListener('mouseenter', () => {
                gsap.to(buttonRef.current, { 
                    scale: 1.05, 
                    duration: 0.3, 
                    ease: "power2.out" 
                });
            });
            
            buttonRef.current.addEventListener('mouseleave', () => {
                gsap.to(buttonRef.current, { 
                    scale: 1, 
                    duration: 0.3, 
                    ease: "power2.out" 
                });
            });
        }

    }, []);

    return (
        <div 
            ref={navbarRef}
            className="NAVBAR_CONTAINER fixed top-0 left-0 right-0 z-50 w-full flex items-center justify-between px-6 py-3 bg-gradient-to-r from-green-900/95 via-green-800/95 to-emerald-800/95 backdrop-blur-xl border-b border-green-400/30 shadow-2xl"
        >
            <div className="flex items-center gap-3">
                <NavLink to="/" className="block">
                    <img 
                        ref={logoRef}
                        src={logo} 
                        alt="GFG Logo" 
                        className="w-10 h-10 rounded-full border-2 border-green-400 shadow-lg cursor-pointer" 
                    />
                </NavLink>
                <p 
                    ref={titleRef}
                    className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-emerald-300 to-green-400 font-montserrat tracking-wide"
                >
                    GFGxBVCOE
                </p>
            </div>

            <nav ref={navRef}>
                <ul className="hidden gap-8 text-sm sm:flex">
                    <li>
                        <NavLink 
                            to="/" 
                            className={({ isActive }) => 
                                `px-4 py-2 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
                                    isActive 
                                        ? "text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30" 
                                        : "text-green-100 hover:text-white hover:bg-green-700/50 backdrop-blur-sm"
                                }`
                            }
                        >
                            Home
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/about" 
                            className={({ isActive }) => 
                                `px-4 py-2 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
                                    isActive 
                                        ? "text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30" 
                                        : "text-green-100 hover:text-white hover:bg-green-700/50 backdrop-blur-sm"
                                }`
                            }
                        >
                            About
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/contact" 
                            className={({ isActive }) => 
                                `px-4 py-2 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
                                    isActive 
                                        ? "text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30" 
                                        : "text-green-100 hover:text-white hover:bg-green-700/50 backdrop-blur-sm"
                                }`
                            }
                        >
                            Contact
                        </NavLink>
                    </li>
                </ul>
            </nav>

            <button 
                ref={buttonRef}
                className="py-2 px-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full hover:from-green-400 hover:to-emerald-400 transition-all duration-300 shadow-xl hover:shadow-green-500/40 border border-green-300/30 text-sm"
            >
                Join Us
            </button>
        </div>
    );
}

export default Navbar;