import { useState, useEffect, useMemo } from "react";
import { getUpcomingEvents } from "../services/api";
import { MapPin, Clock, Users, ExternalLink, Calendar } from "react-feather";
import { motion, AnimatePresence } from "framer-motion";
import CornerFrameScrambleText from "./ui/corner-frame-scramble-text";
import { Accordion } from "./ui/accordion";

// ... parseTimeIntoDate and useCountdown stay exactly the same ...
function parseTimeIntoDate(date, timeStr) {
  if (!date || !timeStr?.trim()) return date ? new Date(new Date(date).setHours(9, 0, 0, 0)) : null;
  const d = new Date(date);
  const s = timeStr.trim();
  const ampm = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(s);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10) || 0;
    const pm = /PM/i.test(ampm[3] || "");
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(9, 0, 0, 0);
  }
  return d;
}

function useCountdown(targetDate) {
  const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        setLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setLeft({ days, hours, minutes, seconds, expired: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate?.getTime()]);
  return left;
}

export default function UpcomingEventSection({ variant = "events" }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUpcomingEvents()
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setEvent(res.data[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const targetDateTime = useMemo(
    () => (event ? parseTimeIntoDate(event.date, event.time) : null),
    [event?.date, event?.time]
  );
  const countdown = useCountdown(targetDateTime);

  if (loading || !event) return null;

  const eventDate = event.date ? new Date(event.date) : null;
  const dayNum = eventDate ? eventDate.getDate() : null;
  const monthShort = eventDate ? eventDate.toLocaleDateString(undefined, { month: "short" }) : "";
  const weekday = eventDate ? eventDate.toLocaleDateString(undefined, { weekday: "long" }) : "";
  const displayTime = event.time?.trim() || null;

  const parseLinks = (str) => {
    if (!str?.trim()) return [];
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return str.split("\n").filter(Boolean).map(l => ({ label: l.split(",")[0], url: l.split(",")[1] }));
    }
  };

  const links = parseLinks(event.otherLinks);
  const isHome = variant === "home";

  // MODERN THEME MAPPING
  const theme = {
    bg: isHome ? "bg-[#061a11]" : "bg-[#0f0f1a]",
    accent: isHome ? "from-green-400 to-emerald-500" : "from-cyan-400 to-blue-500",
    glow: isHome ? "shadow-green-500/20" : "shadow-cyan-500/20",
    card: isHome ? "bg-green-900/20 border-green-500/20" : "bg-white/[0.03] border-white/10",
    text: isHome ? "text-green-400" : "text-cyan-400",
    btn: isHome ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20"
  };

  return (
    <section className={`relative overflow-hidden py-24 ${theme.bg}`}>
      {/* Background Mesh Glows */}
      <div className={`absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r ${theme.accent} opacity-10 blur-[120px] rounded-full`} />
      <div className={`absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r ${theme.accent} opacity-5 blur-[120px] rounded-full`} />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-12">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-6`}
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current ${theme.text}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 bg-current ${theme.text}`}></span>
              </span>
              <span className={`text-[10px] uppercase font-bold tracking-[0.2em] text-white/80`}>Live Countdown</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              <span className={`bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}>UPCOMING</span> EVENT
            </h2>
          </div>

          {/* Countdown Grid */}
          {!countdown.expired && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { v: countdown.days, l: "Days" },
                { v: countdown.hours, l: "Hours" },
                { v: countdown.minutes, l: "Minutes" },
                { v: countdown.seconds, l: "Seconds" }
              ].map((item, i) => (
                <motion.div
                  key={item.l}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`${theme.card} backdrop-blur-md rounded-3xl p-6 flex flex-col items-center justify-center border`}
                >
                  <span className="text-4xl md:text-5xl font-black text-white tabular-nums tracking-tighter">
                    {String(item.v).padStart(2, "0")}
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-widest mt-2 opacity-60 ${theme.text}`}>
                    {item.l}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className={`${theme.card} backdrop-blur-xl rounded-[2.5rem] overflow-hidden border flex flex-col lg:flex-row shadow-2xl shadow-black/50`}
          >
            {/* Poster Area */}
            {event.poster && (
              <div className="lg:w-1/2 relative group">
                <img 
                  src={event.poster} 
                  className="w-full h-full object-cover aspect-video lg:aspect-auto min-h-[400px] transition-transform duration-700 group-hover:scale-110" 
                  alt="Poster" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:bg-gradient-to-r" />
                
                {/* Floating Date Badge */}
                <div className="absolute top-6 left-6 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center">
                  <span className="text-2xl font-black text-white leading-none">{dayNum}</span>
                  <span className="text-[10px] uppercase font-bold text-white/70">{monthShort}</span>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="p-8 md:p-12 lg:w-1/2 flex flex-col">
              <div className="flex-1">
                <CornerFrameScrambleText
                  value={event.title}
                  as="h3"
                  loop
                  loopDelay={2500}
                  className="mb-6"
                  style={{ '--foreground': 'rgba(255,255,255,0.25)' }}
                  textClassName="text-3xl font-bold leading-[1.1] bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
                />
                
                <div className="grid grid-cols-1 gap-5 mb-8">
                  <div className="flex items-center gap-4 text-white/70">
                    <div className={`p-2 rounded-lg ${theme.bg} border border-white/5`}>
                      <Clock size={18} className={theme.text} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider opacity-50">Timeline</p>
                      <p className="text-sm font-medium">{weekday}, {displayTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-white/70">
                    <div className={`p-2 rounded-lg ${theme.bg} border border-white/5`}>
                      <MapPin size={18} className={theme.text} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider opacity-50">Location</p>
                      <p className="text-sm font-medium line-clamp-1">{event.location}</p>
                    </div>
                  </div>

                  {event.targetAudience && (
                    <div className="flex items-center gap-4 text-white/70">
                      <div className={`p-2 rounded-lg ${theme.bg} border border-white/5`}>
                        <Users size={18} className={theme.text} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-50">Audience</p>
                        <p className="text-sm font-medium">{event.targetAudience}</p>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-white/60 text-sm leading-relaxed mb-8 line-clamp-4">
                  {event.description}
                </p>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap gap-3 pt-8 border-t border-white/5">
                {links.map((link, i) => (
                  <motion.a
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    key={i}
                    href={link.url}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold transition-all ${theme.btn}`}
                  >
                    {link.label}
                    <ExternalLink size={14} />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* FAQ Accordion – only when event has FAQs */}
          {Array.isArray(event.faqs) && event.faqs.filter((f) => (f.question || "").trim() || (f.answer || "").trim()).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="mt-16"
            >
              <h3 className={`text-2xl font-bold text-white mb-6 flex items-center gap-2`}>
                <span className={`bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}>FAQ</span>
                <span className="h-px flex-1 max-w-[80px] bg-white/20 rounded" />
              </h3>
              <Accordion
                items={event.faqs
                  .filter((f) => (f.question || "").trim() || (f.answer || "").trim())
                  .map((f) => ({ title: (f.question || "").trim() || "Question", content: (f.answer || "").trim() || "—" }))}
                itemClassName={`${theme.card} border`}
                triggerClassName="text-white/90"
                contentClassName="text-white/60"
              />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}