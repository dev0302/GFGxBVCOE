import gfgLogo from "../images/gfgLogo.png";
import footerBg from "../images/footerbg.jpg";
import { Instagram } from 'react-feather';
import { Linkedin } from 'react-feather';
import { Monitor } from 'react-feather';
import dev from "../images/dev.png"
import himank from "../images/himank.webp"
import gaurav from "../images/gaurav.jpg"
import vansh from "../images/vansh.png"
import harpreet from "../images/harpreet.png"


const Footer = () => {
    
  return (
    <section 
      className="relative text-[#cbd5e1] font-inter px-4 pt-12 pb-10 font-sans overflow-hidden"
      style={{
        backgroundImage: `url('/corepic_1.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}
    >
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-[#161629]/85 md:bg-[#161629]/90 backdrop-blur-sm  overflow-hidden"></div>

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

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-[#cbd5e1] text-sm">
          <p className="opacity-60 mb-10">&copy; {new Date().getFullYear()} GeeksforGeeks Campus Body - BVCOE. All rights reserved.</p>

          {/* Main Container */}
          <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-12 md:gap-20">
            
            {/* SECTION 1: DEVELOPED BY (Now on the Left) */}
            <div className="flex flex-col items-center gap-6">
              <span className="text-gray-500 uppercase tracking-[0.2em] text-[11px] font-bold">
                Developed by
              </span>
              <div className="flex flex-wrap justify-center items-center gap-8">
                {[
                  { name: "Dev", link: "https://www.linkedin.com/in/dev-malik-976230311/", img: dev },
                  { name: "Himank", link: "https://www.linkedin.com/in/himank-pandoh-58a0b52b1/", img: himank },
                  { name: "Gaurav", link: "https://www.linkedin.com/in/gaurav-karakoti/", img: gaurav },
                ].map((dev, index) => (
                  <a
                    key={index}
                    href={dev.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className="relative">
                      {/* Cyan Glow */}
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#38bdf8] to-[#7dd3fc] rounded-full opacity-0 group-hover:opacity-100 transition duration-300 blur"></div>
                      <img
                        src={dev.img}
                        alt={dev.name}
                        className="relative h-14 w-14 rounded-full border-2 border-white/20 object-cover bg-slate-800 p-0.5 shadow-xl"
                      />
                    </div>
                    <span className="text-sm font-medium text-white/80 group-hover:text-[#38bdf8] transition-colors duration-300 tracking-wide">
                      {dev.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Vertical Divider for Desktop */}
            <div className="hidden md:block w-px h-24 bg-gradient-to-b from-transparent via-white/10 to-transparent self-center"></div>

            {/* SECTION 2: CONTRIBUTORS (Now on the Right) */}
            <div className="flex flex-col items-center gap-6">
              <span className="text-gray-500 uppercase tracking-[0.2em] text-[11px] font-bold">
                Contributors
              </span>
              <div className="flex flex-wrap justify-center items-center gap-8">
                {[
                  { name: "Vansh", link: "https://www.linkedin.com/in/vansh-raikwar-90b148229?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", img: vansh }, 
                  { name: "Harpreet", link: "#", img: harpreet },
                ].map((person, index) => (
                  <a
                    key={index}
                    href={person.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className="relative">
                      {/* Green/Emerald Glow */}
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full opacity-0 group-hover:opacity-100 transition duration-300 blur"></div>
                      <img
                        src={person.img}
                        alt={person.name}
                        className="relative h-12 w-12 rounded-full border-2 border-white/20 object-cover bg-slate-800 p-0.5 shadow-xl"
                      />
                    </div>
                    <span className="text-sm font-medium text-white/80 group-hover:text-emerald-400 transition-colors duration-300 tracking-wide">
                      {person.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </footer>
    </section>
  );
};

export default Footer;