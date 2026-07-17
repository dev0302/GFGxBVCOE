import { useState, useEffect, useMemo, useRef } from "react";
import { getUpcomingEvents } from "../services/api";
import { MapPin, Clock, Users, ExternalLink, ChevronDown, ChevronUp } from "react-feather";
import { Accordion } from "./ui/accordion";
import { cloudinaryEventCardImageUrl } from "../utils/cloudinary";

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

function parseLinks(str) {
  if (!str?.trim()) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return str.split("\n").filter(Boolean).map((l) => ({
      label: l.split(",")[0],
      url: l.split(",")[1],
    }));
  }
}

function CountdownGrid({ targetDateTime, theme }) {
  const countdown = useCountdown(targetDateTime);

  if (countdown.expired) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {[
        { v: countdown.days, l: "Days" },
        { v: countdown.hours, l: "Hours" },
        { v: countdown.minutes, l: "Minutes" },
        { v: countdown.seconds, l: "Seconds" }
      ].map((item) => (
        <div
          key={item.l}
          className={`${theme.card} rounded-3xl p-6 flex flex-col items-center justify-center border animate-fadeIn`}
        >
          <span className="text-4xl md:text-5xl font-black text-richblack-25 tabular-nums tracking-tighter">
            {String(item.v).padStart(2, "0")}
          </span>
          <span className={`text-[10px] uppercase font-bold tracking-widest mt-2 opacity-60 ${theme.text}`}>
            {item.l}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function UpcomingEventSection({ variant = "events" }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const descriptionRef = useRef(null);

  useEffect(() => {
    if (descriptionRef.current && !isExpanded) {
      setIsOverflowing(descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight);
    }
  }, [event, isExpanded]);

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
  const isHome = variant === "home";
  const links = useMemo(() => parseLinks(event?.otherLinks), [event?.otherLinks]);
  const theme = useMemo(() => ({
    bg: isHome ? "bg-[#061a11]" : "bg-[#0f0f1a]",
    accent: isHome ? "from-green-400 to-emerald-500" : "from-cyan-400 to-blue-500",
    card: isHome ? "bg-green-900/20 border-green-500/20" : "bg-white/[0.03] border-white/10",
    text: isHome ? "text-green-400" : "text-cyan-400",
    btn: isHome ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20"
  }), [isHome]);

  if (loading || !event) return null;

  const eventDate = event.date ? new Date(event.date) : null;
  const dayNum = eventDate ? eventDate.getDate() : null;
  const monthShort = eventDate ? eventDate.toLocaleDateString(undefined, { month: "short" }) : "";
  const weekday = eventDate ? eventDate.toLocaleDateString(undefined, { weekday: "long" }) : "";
  const displayTime = event.time?.trim() || null;

  return (
    <section className={`relative overflow-hidden py-24 ${theme.bg}`}>
      {/* Background Mesh Glows */}
      <div className={`absolute top-0 left-1/4 w-80 h-80 bg-gradient-to-r ${theme.accent} opacity-10 blur-3xl rounded-full`} />
      <div className={`absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r ${theme.accent} opacity-5 blur-3xl rounded-full`} />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-6 animate-fadeIn">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current ${theme.text}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 bg-current ${theme.text}`}></span>
              </span>
              <span className={`text-[10px] uppercase font-bold tracking-[0.2em] text-richblack-25/80`}>Live Countdown</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-richblack-25 tracking-tight mb-4">
              <span className={`bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}>UPCOMING</span> EVENT
            </h2>
          </div>

          {/* Countdown Grid */}
          <CountdownGrid targetDateTime={targetDateTime} theme={theme} />

          {/* Main Content Card */}
          <div className={`${theme.card} rounded-[2.5rem] overflow-hidden border flex flex-col lg:flex-row shadow-xl shadow-black/40 animate-fadeIn`}>
            {/* Poster Area */}
            {event.poster && (
              <div className="lg:w-1/2 relative group">
                <img 
                  src={cloudinaryEventCardImageUrl(event.poster)} 
                  className="w-full h-full object-cover aspect-video lg:aspect-auto min-h-[400px] transition-transform duration-500 group-hover:scale-[1.04]" 
                  alt="Poster" 
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:bg-gradient-to-r" />
                
                {/* Floating Date Badge */}
                <div className="absolute top-6 left-6 p-4 rounded-2xl bg-black/45 border border-white/20 flex flex-col items-center">
                  <span className="text-2xl font-black text-richblack-25 leading-none">{dayNum}</span>
                  <span className="text-[10px] uppercase font-bold text-richblack-25/70">{monthShort}</span>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="p-8 md:p-12 lg:w-1/2 flex flex-col">
              <div className="flex-1">
                <div
                  className="relative mb-6 inline-block px-6 py-3 bg-[linear-gradient(to_right,rgba(255,255,255,0.25)_1.5px,transparent_1.5px),linear-gradient(to_right,rgba(255,255,255,0.25)_1.5px,transparent_1.5px),linear-gradient(to_left,rgba(255,255,255,0.25)_1.5px,transparent_1.5px),linear-gradient(to_left,rgba(255,255,255,0.25)_1.5px,transparent_1.5px),linear-gradient(to_bottom,rgba(255,255,255,0.25)_1.5px,transparent_1.5px),linear-gradient(to_bottom,rgba(255,255,255,0.25)_1.5px,transparent_1.5px),linear-gradient(to_top,rgba(255,255,255,0.25)_1.5px,transparent_1.5px),linear-gradient(to_top,rgba(255,255,255,0.25)_1.5px,transparent_1.5px)] bg-[length:15px_15px] bg-no-repeat bg-[position:0_0,0_100%,100%_0,100%_100%,0_0,100%_0,0_100%,100%_100%]"
                >
                  <h3 className="relative z-10 text-3xl font-bold leading-[1.1] bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    {event.title}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 gap-5 mb-8">
                  <div className="flex items-center gap-4 text-richblack-25/70">
                    <div className={`p-2 rounded-lg ${theme.bg} border border-white/5`}>
                      <Clock size={18} className={theme.text} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider opacity-50">Timeline</p>
                      <p className="text-sm font-medium">{weekday}, {displayTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-richblack-25/70">
                    <div className={`p-2 rounded-lg ${theme.bg} border border-white/5`}>
                      <MapPin size={18} className={theme.text} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider opacity-50">Location</p>
                      <p className="text-sm font-medium line-clamp-1">{event.location}</p>
                    </div>
                  </div>

                  {event.targetAudience && (
                    <div className="flex items-center gap-4 text-richblack-25/70">
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

                <div className="relative">
                  <p 
                    ref={descriptionRef}
                    className={`text-richblack-25/60 text-sm leading-relaxed mb-2 transition-all duration-300 break-words ${!isExpanded ? "line-clamp-3" : ""}`}
                  >
                    {event.description}
                  </p>
                  {(isOverflowing || isExpanded) && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1 mb-8 transition-colors ${theme.text} hover:opacity-80`}
                    >
                      {isExpanded ? "Show Less" : "Read More"}
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap gap-3 pt-8 border-t border-white/5">
                {links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold transition-transform hover:-translate-y-0.5 active:scale-95 ${theme.btn}`}
                  >
                    {link.label}
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* FAQ Accordion – only when event has FAQs */}
          {Array.isArray(event.faqs) && event.faqs.filter((f) => (f.question || "").trim() || (f.answer || "").trim()).length > 0 && (
            <div className="mt-16 animate-fadeIn">
              <h3 className={`text-2xl font-bold text-richblack-25 mb-6 flex items-center gap-2`}>
                <span className={`bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}>FAQ</span>
                <span className="h-px flex-1 max-w-[80px] bg-white/20 rounded" />
              </h3>
              <Accordion
                items={event.faqs
                  .filter((f) => (f.question || "").trim() || (f.answer || "").trim())
                  .map((f) => ({ title: (f.question || "").trim() || "Question", content: (f.answer || "").trim() || "—" }))}
                itemClassName={`${theme.card} border`}
                triggerClassName="text-richblack-25/90"
                contentClassName="text-richblack-25/60"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
