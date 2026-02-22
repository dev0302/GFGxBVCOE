import { useEffect, useState } from "react";
import gfgLogo from "../images/gfgLogo.png";
import { Instagram, Linkedin, Monitor, ChevronDown } from "react-feather"; // Added ChevronDown
import dev from "../images/dev.png";
import himank from "../images/himank.webp";
import gaurav from "../images/gaurav.jpg";
import vansh from "../images/vansh.png";
import harpreet from "../images/harpreet.png";

const Footer = () => {
  const [locStats, setLocStats] = useState([]);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false); // Toggle state

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(
          "https://api.github.com/repos/dev0302/GFGxBVCOE/stats/contributors"
        );

        if (res.status === 202) {
          setTimeout(fetchStats, 2000);
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          const cleaned = data
            .filter((c) => c.author)
            .slice(0, 10) 
            .map((c) => ({
              name: c.author.login,
              additions: c.weeks.reduce((s, w) => s + w.a, 0),
              deletions: c.weeks.reduce((s, w) => s + w.d, 0),
            }))
            .sort((a, b) => b.additions - a.additions);

          setLocStats(cleaned);
        }
      } catch (error) {
        console.error("Error fetching GitHub stats:", error);
      }
    };

    fetchStats();
  }, []);

  const maxAdditions =
    locStats.length > 0 ? Math.max(...locStats.map((c) => c.additions)) : 1;

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
          @keyframes typewriter { from { width: 0; } to { width: 100%; } }
          @keyframes blink { 50% { border-color: transparent; } }
          @keyframes flowingLine {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .typewriter-text {
            overflow: hidden;
            white-space: nowrap;
            border-right: 2px solid #4ade80;
            display: inline-block;
            animation: typewriter 3.5s steps(40, end), blink 0.75s step-end infinite;
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
              className="w-[55px] h-[55px] rounded-full border-green-400 border-4 object-cover"
            />
            <h2 className="text-2xl font-bold text-white m-0">GFG Society</h2>
            <div className="h-6">
              <p className="typewriter-text text-[0.95rem] opacity-80 leading-6 text-[#cbd5e1]">
                Igniting Innovation. Inspiring Change.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="min-w-[250px]">
            <h3 className="text-[#f8fafc] text-2xl font-bold relative inline-block pb-1 mb-4">
              Contact Us
              <span
                className="absolute bottom-0 left-0 w-full h-[3px] rounded-[3px]"
                style={{
                  background: "linear-gradient(90deg, #161629, #4ade80, #22c55e, #4ade80, #161629)",
                  backgroundSize: "200% 100%",
                  animation: "flowingLine 3s linear infinite",
                }}
              ></span>
            </h3>
            <div className="flex flex-col gap-3">
              <a href="https://discord.gg/6X7Gc7Np" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-green-400 hover:text-blue-400 transition-colors">
                <Monitor size={20} /> Join us on Discord
              </a>
              <a href="https://www.instagram.com/gfg_bvcoe" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-green-400 hover:text-blue-400 transition-colors">
                <Instagram size={20} /> @gfg_bvcoe
              </a>
              <a href="https://www.linkedin.com/company/geeksforgeeks-campus-body-bvcoe/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-green-400 hover:text-blue-400 transition-colors">
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
              {[
                { name: "Dev", link: "https://www.linkedin.com/in/dev-malik-976230311/", img: dev, isLead: true },
                { name: "Himank", link: "https://www.linkedin.com/in/himank-pandoh-58a0b52b1/", img: himank },
                { name: "Gaurav", link: "https://www.linkedin.com/in/gaurav-karakoti/", img: gaurav },
              ].map((person, index) => (
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
                  <span className="text-sm font-medium text-white/80 group-hover:text-[#38bdf8] transition-colors duration-300 tracking-wide">
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
              {[
                { name: "Vansh", link: "https://www.linkedin.com/in/vansh-raikwar-90b148229", img: vansh }, 
                { name: "Harpreet", link: "https://www.linkedin.com/in/harpreet-singh-257b19362", img: harpreet },
              ].map((person, index) => (
                <a key={index} href={person.link} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-2">
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full opacity-0 group-hover:opacity-100 transition duration-300 blur"></div>
                    <img src={person.img} alt={person.name} className="relative h-12 w-12 rounded-full border-2 border-white/20 object-cover bg-slate-800 p-0.5 shadow-xl" />
                  </div>
                  <span className="text-sm font-medium text-white/80 group-hover:text-emerald-400 transition-colors duration-300 tracking-wide">{person.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* TOGGLEABLE LOC CONTRIBUTION MATRIX */}
        {locStats.length > 0 && (
          <div className="mt-16 mx-auto max-w-2xl bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl transition-all duration-500">
            {/* Clickable Header */}
            <button 
              onClick={() => setIsMatrixOpen(!isMatrixOpen)}
              className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors group"
            >
              <div className="flex flex-col gap-1 items-start">
                <h4 className="text-[11px] text-gray-400 uppercase tracking-[0.2em] font-bold">Open Source Contribution Matrix</h4>
                <div className={`h-0.5 bg-emerald-500/50 rounded-full transition-all duration-500 ${isMatrixOpen ? 'w-24' : 'w-12'}`}></div>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline text-[9px] font-mono text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 animate-pulse">
                  Live Repository Stats
                </span>
                <ChevronDown 
                  size={20} 
                  className={`text-gray-400 group-hover:text-emerald-400 transition-transform duration-500 ${isMatrixOpen ? 'rotate-180' : 'rotate-0'}`}
                />
              </div>
            </button>

            {/* Collapsible Body */}
            <div 
              className={`transition-all duration-500 ease-in-out ${isMatrixOpen ? 'max-h-[1000px] opacity-100 pb-8 px-6' : 'max-h-0 opacity-0 overflow-hidden'}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-4 border-t border-white/5">
                {locStats.map((c, i) => (
                  <div key={i} className="flex flex-col gap-2 group">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-semibold text-white/90 group-hover:text-emerald-400 transition-colors tracking-tight">
                        {c.name}
                      </span>
                      <div className="text-[10px] font-mono flex gap-2">
                        <span className="text-emerald-400">+{c.additions.toLocaleString()}</span>
                        <span className="text-red-400/60">-{c.deletions.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-[5px] w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-green-300 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                        style={{ width: isMatrixOpen ? `${(c.additions / maxAdditions) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 pt-8 text-center text-[11px] border-t border-white/5">
          <p className="opacity-40">&copy; {new Date().getFullYear()} GeeksforGeeks Campus Body – BVCOE. All rights reserved.</p>
        </div>
      </footer>
    </section>
  );
};

export default Footer;