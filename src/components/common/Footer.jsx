import gfgLogo from "../../images/gfgLogo.png";
import { Instagram, Linkedin, Monitor } from "react-feather";
import dev from "../../images/dev.png";
import himank from "../../images/himank.webp";
import gaurav from "../../images/gaurav.jpg";
import vansh from "../../images/vansh.png";
import harpreet from "../../images/harpreet.png";

const Footer = () => {
  const devs = [
    {
      name: "Dev",
      img: dev,
      link: "https://www.linkedin.com/in/dev-malik-976230311/",
      isLead: true,
    },
    {
      name: "Himank",
      img: himank,
      link: "https://www.linkedin.com/in/himank-pandoh-58a0b52b1/",
    },
    {
      name: "Gaurav",
      img: gaurav,
      link: "https://www.linkedin.com/in/gaurav-karakoti/",
    },
  ];

  const contributors = [
    {
      name: "Vansh",
      img: vansh,
      link: "https://www.linkedin.com/in/vansh-raikwar-90b148229",
    },
    {
      name: "Harpreet",
      img: harpreet,
      link: "https://www.linkedin.com/in/harpreet-singh-257b19362",
    },
  ];

  return (
    <section
      className="relative text-[#cbd5e1] font-inter px-4 pt-12 pb-10 overflow-hidden"
      style={{
        backgroundImage: `url('/corepic_1.webp')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <style>
        {`
          @keyframes flowingLine {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      <div className="absolute inset-0 bg-[#161629]/90 backdrop-blur-sm"></div>

      <footer className="max-w-[1200px] mx-auto relative z-10">
        <div className="flex flex-wrap justify-between gap-12 md:gap-16 sm:w-11/12 mx-auto">
          {/* Brand */}
          <div className="flex flex-col gap-4 min-w-[250px] md:ml-20 text-left">
            <img
              src={gfgLogo}
              alt="GFG Logo"
              loading="lazy"
              className="w-[55px] h-[55px] rounded-full border-green-400 border-4 object-cover"
            />
            <h2 className="text-2xl font-bold text-richblack-25 m-0">GFG Society</h2>
            <p className="text-[0.95rem] opacity-80 leading-6 text-[#cbd5e1]">
              Igniting innovation. Inspiring change.
            </p>
          </div>

          {/* Contact */}
          <div className="min-w-[250px]">
            <h3 className="text-[#f8fafc] text-2xl font-bold relative inline-block pb-1 mb-4">
              Contact Us
              <span
                className="absolute bottom-0 left-0 w-full h-[3px] rounded-[3px]"
                style={{
                  background:
                    "linear-gradient(90deg, #161629, #4ade80, #22c55e, #4ade80, #161629)",
                  backgroundSize: "200% 100%",
                  animation: "flowingLine 3s linear infinite",
                }}
              ></span>
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="https://discord.gg/6X7Gc7Np"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-green-400 hover:text-blue-400 transition-colors"
              >
                <Monitor size={20} /> Join us on Discord
              </a>
              <a
                href="https://www.instagram.com/gfg_bvcoe"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-green-400 hover:text-blue-400 transition-colors"
              >
                <Instagram size={20} /> @gfg_bvcoe
              </a>
              <a
                href="https://www.linkedin.com/company/geeksforgeeks-campus-body-bvcoe/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-green-400 hover:text-blue-400 transition-colors"
              >
                <Linkedin size={20} /> LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* TEAM SECTION */}
        <div className="mt-16 flex flex-col md:flex-row justify-center items-center md:items-start gap-12 md:gap-20">
          {/* Developed By Section */}
          <div className="flex flex-col items-center gap-6">
            <span className="text-gray-500 uppercase tracking-[0.2em] text-[11px] font-bold">
              Developed by
            </span>
            <div className="flex flex-wrap justify-center items-end gap-8">
              {devs.map((person, index) => (
                <a
                  key={index}
                  href={person.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="relative flex flex-col items-center">
                    {person.isLead && (
                      <span className="absolute -top-6 whitespace-nowrap bg-blue-500/20 text-[#38bdf8] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#38bdf8]/30 uppercase tracking-tighter">
                        Lead Developer
                      </span>
                    )}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#38bdf8] to-[#7dd3fc] rounded-full opacity-0 group-hover:opacity-100 transition duration-300 blur"></div>
                    <img
                      src={person.img}
                      alt={person.name}
                      className="relative h-14 w-14 rounded-full border-2 border-white/20 object-cover bg-slate-800 p-0.5 shadow-xl"
                    />
                  </div>
                  <span className="text-sm font-medium text-richblack-25/80 group-hover:text-[#38bdf8] transition-colors duration-300 tracking-wide">
                    {person.name}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="hidden md:block w-px h-24 bg-gradient-to-b from-transparent via-white/10 to-transparent self-center"></div>

          {/* Contributors Section */}
          <div className="flex flex-col items-center gap-6">
            <span className="text-gray-500 uppercase tracking-[0.2em] text-[11px] font-bold">
              Contributors
            </span>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {contributors.map((person, index) => (
                <a
                  key={index}
                  href={person.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full opacity-0 group-hover:opacity-100 transition duration-300 blur"></div>
                    <img
                      src={person.img}
                      alt={person.name}
                      className="relative h-12 w-12 rounded-full border-2 border-white/20 object-cover bg-slate-800 p-0.5 shadow-xl"
                    />
                  </div>
                  <span className="text-sm font-medium text-richblack-25/80 group-hover:text-emerald-400 transition-colors duration-300 tracking-wide">
                    {person.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 text-center text-[11px] border-t border-white/5">
          <p className="opacity-40">
            &copy; {new Date().getFullYear()} GeeksforGeeks Campus Body – BVCOE.
            All rights reserved.
          </p>
        </div>
      </footer>
    </section>
  );
};

export default Footer;

