import React from "react";
import gfgLogo from "../images/gfgLogo.png";
import footerBg from "../images/footerbg.jpg";
import { Instagram } from 'react-feather';
import { Linkedin } from 'react-feather';
import { Monitor } from 'react-feather';
import { useEffect } from "react";
import dev from "../images/dev.png"
import himank from "../images/himank.png"


const Footer = () => {
    
  return (
    <section 
      className="relative text-[#cbd5e1] font-inter px-4 pt-12 pb-10 md:mt-10 font-sans overflow-hidden"
      style={{
        backgroundImage: `url(${footerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}
    >
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-[#013220]/70 backdrop-blur-sm overflow-hidden"></div>

      <footer className="max-w-[1200px] mx-auto relative z-10">
        <div className="flex flex-wrap justify-between gap-12 md:gap-16">
          {/* Brand Section */}
          <div className="flex flex-col gap-4 flex-1 min-w-[250px] items-start md:items-start md:ml-20">
            <img
              id="horizon_logo2"
              src={gfgLogo}
              alt="GFG Logo"
              className="w-[55px] h-[55px] rounded-full border-green-400 border-4 object-cover"
            />
            <h2 className="text-[1.75rem] md:text-2xl font-bold text-[#f8fafc] m-0">
              GFG Society
            </h2>
            <p className="text-[0.95rem] opacity-80 leading-6 text-[#cbd5e1]">
              Igniting Innovation. Inspiring Change.
            </p>
          </div>

          {/* Contact Section */}
          <div className="flex-1 min-w-[250px]">
            <h3 className="text-[#f8fafc] text-2xl md:text-2xl font-bold relative inline-block pb-1 mb-4">
              Contact Us
              <span
                className="absolute bottom-0 left-0 w-[50px] h-[3px] rounded-[3px] opacity-80"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #4ade80, #22c55e, #4ade80, transparent)",
                  backgroundSize: "200% 100%",
                  animation: "flowingLine 3s linear infinite",
                }}
              ></span>
            </h3>
            <div className="flex flex-col gap-3 text-[#cbd5e1] text-base">
              <p className="flex items-center gap-3">
                <Monitor className="text-green-500 hover:text-blue-400 transition-colors" size={22} />
                 <a
                  href="https://discord.gg/6X7Gc7Np"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-[#0ea5e9] transition-colors duration-300"
                >
                  join us on discord
                </a>
              </p>
              {/* INSTAGRAM */}
              <p className="flex items-center gap-3">
                <Instagram className="text-green-500 hover:text-blue-400 transition-colors" size={22} />
                <a
                  href="https://www.instagram.com/gfg_bvcoe?utm_source=qr&igsh=MWZzdTB2dWl5dmt6dQ=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-[#0ea5e9] transition-colors duration-300"
                >
                  @gfg_bvcoe
                </a>
              </p>
              
              {/* LINKEDIN */}
              <p className="flex items-center gap-3">
                <Linkedin className="text-green-500 hover:text-blue-400 transition-colors" size={22} />
                <a
                  href="https://www.linkedin.com/company/geeksforgeeks-campus-body-bvcoe/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-[#7dd3fc] transition-colors duration-300"
                >
                  linkedin.com/company/gfg-bvcoe
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-12 border-t border-[#80a8813b] pt-6 text-center text-[#cbd5e1] text-sm opacity-70">
          <p>&copy; 2025 GeeksforGeeks Campus Body - BVCOE. All rights reserved.</p>
          <p className="mt-2 text-white flex justify-center items-center gap-4">
            Developed by -{" "}
            <a 
              href="https://www.linkedin.com/in/dev-malik-976230311/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#38bdf8] hover:text-[#7dd3fc] transition-colors duration-300 inline-block relative hover:-translate-y-0.5"
            > <div className="flex gap-1 justify-center items-center">
              <img src={dev} alt="nf" className="h-5 w-5 border-2 border-white o object-cover rounded-full" />
              Dev
            </div>
            </a>
            <a
              href="https://www.linkedin.com/in/himank-pandoh-58a0b52b1/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#38bdf8] hover:text-[#7dd3fc] transition-colors duration-300 inline-block relative hover:-translate-y-0.5"
            >
               <div className="flex gap-1 justify-center items-center">
              <img src={himank} alt="nf" className="h-5 w-5 border-2 border-white object-cover rounded-full" />
              Himank
            </div>
            </a>
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes flowingLine {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </section>
  );
};

export default Footer;