import { useState, useEffect, useMemo } from "react";
import { getUpcomingEvents } from "../services/api";
import { MapPin, Clock, Users, ExternalLink } from "react-feather";

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
        } else {
          setEvent(null);
        }
      })
      .catch(() => setEvent(null))
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
  const year = eventDate ? eventDate.getFullYear() : "";
  const displayTime = event.time?.trim() || null;

  const parseLinks = (str) => {
    if (!str?.trim()) return [];
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed.filter((l) => l && (l.url || l.label)) : [];
    } catch {
      return str.split("\n").filter(Boolean).map((line) => {
        const [label, url] = line.split(",").map((s) => s.trim());
        return { label: label || "Link", url: url || label };
      });
    }
  };

  const links = parseLinks(event.otherLinks);
  const isHome = variant === "home";

  const sectionClass = isHome
    ? "relative z-10 py-14 md:py-20 bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 border-y border-green-700/30"
    : "relative z-10 py-14 md:py-20 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] border-y border-gray-500/20";

  const badgeClass = isHome
    ? "text-green-300"
    : "text-cyan-300";
  const iconClass = isHome
    ? "text-green-400"
    : "text-cyan-400";
  const titleAccentClass = isHome
    ? "text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-400"
    : "text-cyan-400";
  const cardClass = isHome
    ? "rounded-2xl border border-green-700/40 bg-green-900/40 shadow-xl overflow-hidden backdrop-blur-sm"
    : "rounded-2xl border border-gray-500/30 bg-[#252536]/90 shadow-xl overflow-hidden backdrop-blur-sm";
  const linkBtnClass = isHome
    ? "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600/40 text-green-200 hover:bg-green-600/60 text-sm font-medium border border-green-500/30 transition-colors"
    : "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium transition-colors";

  return (
    <section className={sectionClass}>
      <div className="container mx-auto px-4 sm:px-6 flex justify-center">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isHome ? "bg-green-400" : "bg-cyan-400"}`} />
            <span className={`text-sm font-medium uppercase tracking-wider ${badgeClass}`}>
              Upcoming event
            </span>
            <div className={`w-2 h-2 rounded-full animate-pulse ${isHome ? "bg-green-400" : "bg-cyan-400"}`} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">
            Next <span className={titleAccentClass}>Event</span>
          </h2>

          {eventDate && (
            <div className="flex justify-center mb-8">
              <div className={`inline-flex gap-3 sm:gap-4 p-4 rounded-2xl border ${isHome ? "bg-green-800/40 border-green-600/50" : "bg-[#252536]/80 border-gray-500/30"}`}>
                {countdown.expired ? (
                  <div className={`text-lg font-semibold ${isHome ? "text-green-200" : "text-cyan-300"}`}>
                    Event day — see you there!
                  </div>
                ) : (
                  [
                    { value: countdown.days, label: "Days" },
                    { value: countdown.hours, label: "Hours" },
                    { value: countdown.minutes, label: "Mins" },
                    { value: countdown.seconds, label: "Secs" },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      className={`flex flex-col items-center min-w-[56px] sm:min-w-[64px] py-3 px-2 sm:py-4 sm:px-3 rounded-xl ${isHome ? "bg-green-700/50" : "bg-cyan-500/20"}`}
                    >
                      <span className={`text-2xl sm:text-3xl font-bold tabular-nums leading-none ${isHome ? "text-green-100" : "text-cyan-200"}`}>
                        {String(value).padStart(2, "0")}
                      </span>
                      <span className={`text-xs font-medium uppercase tracking-wider mt-1.5 ${isHome ? "text-green-300/90" : "text-cyan-400/90"}`}>
                        {label}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <article className={`${cardClass} flex flex-col md:flex-row`}>
            {event.poster && (
              <div className="md:w-2/5 lg:w-2/5 shrink-0 aspect-video md:aspect-auto md:min-h-[280px] overflow-hidden bg-black/20">
                <img
                  src={event.poster}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className={`flex-1 p-6 md:p-8 flex flex-col justify-center ${event.poster ? "md:pl-8" : ""}`}>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 leading-tight">
                {event.title}
              </h3>

              {eventDate && (
                <div className={`flex items-center gap-4 mb-4 p-4 rounded-xl border ${isHome ? "bg-green-800/30 border-green-600/40" : "bg-[#1e1e2f]/80 border-gray-500/30"}`}>
                  <div className={`flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-lg ${isHome ? "bg-green-700/40" : "bg-cyan-500/20"}`}>
                    <span className={`text-2xl font-bold leading-none ${isHome ? "text-green-200" : "text-cyan-300"}`}>
                      {dayNum}
                    </span>
                    <span className={`text-xs font-medium uppercase tracking-wider mt-1 ${isHome ? "text-green-300/90" : "text-cyan-400/90"}`}>
                      {monthShort}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white">
                      {weekday}
                      {year && <span className="text-gray-400 font-normal">, {year}</span>}
                    </div>
                    {displayTime && (
                      <div className={`flex items-center gap-1.5 mt-1 text-sm ${isHome ? "text-green-200" : "text-cyan-300"}`}>
                        <Clock className="h-4 w-4 shrink-0 opacity-90" />
                        <span>{displayTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2.5 text-sm">
                {event.location && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className={`h-4 w-4 shrink-0 ${iconClass}`} />
                    <span className="line-clamp-2">{event.location}</span>
                  </div>
                )}
                {event.targetAudience && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className={`h-4 w-4 shrink-0 ${iconClass}`} />
                    <span>{event.targetAudience}</span>
                  </div>
                )}
              </div>
              {(links.length > 0 || event.otherDocs?.trim()) && (
                <div className="mt-6 pt-4 border-t border-gray-500/20 flex flex-wrap gap-2">
                  {links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkBtnClass}
                    >
                      {link.label}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ))}
                  {event.otherDocs?.trim() &&
                    event.otherDocs.split(/\s+/).filter(Boolean).map((url, i) => (
                      <a
                        key={`doc-${i}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkBtnClass}
                      >
                        Docs
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ))}
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
