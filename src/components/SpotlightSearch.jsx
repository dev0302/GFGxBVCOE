import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Command, Search, UserRound, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllPeople, getEvents } from "../services/api";
import { avatarPlaceholder, photoPreviewUrl } from "../utils/teamMemberUtils";
import { MemberDetailModal, PredefinedOnlyDetailModal, UserDetailModal } from "./Search";
import siteEvents from "../data/eventData";

const EXAMPLES = ["Search a person", "year:3rd", "branch:cse", "section:cse-4", "event:geekhunt"];
const personName = (item) => {
  const data = item.data || item;
  return data.name || [data.firstName, data.lastName].filter(Boolean).join(" ") || data.email || "Member";
};
const personMeta = (item) => {
  const data = item.data || item;
  const profile = data.additionalDetails || data.profile || {};
  return {
    year: data.year || profile.year || profile.yearOfStudy || "",
    branch: data.branch || profile.branch || "",
    section: data.section || profile.section || "",
    department: item.department || data.accountType || "",
  };
};

export default function SpotlightSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 100);
    if (hasLoadedRef.current || !user) return () => window.clearTimeout(focusTimer);
    hasLoadedRef.current = true;
    setLoading(true);
    Promise.all([getAllPeople(), getEvents()])
      .then(([peopleResult, eventsResult]) => {
        setPeople(peopleResult.data || []);
        setEvents([...(eventsResult.data || []), ...siteEvents]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => window.clearTimeout(focusTimer);
  }, [open, user]);

  const { peopleResults, eventResults, mode } = useMemo(() => {
    const value = query.trim();
    const matched = value.match(/^(year|branch|section|event)\s*:\s*(.*)$/i);
    const field = matched?.[1]?.toLowerCase() || "name";
    const term = (matched?.[2] ?? value).trim().toLowerCase();
    if (field === "event") {
      return { peopleResults: [], eventResults: events.filter((event) => `${event.title || event.name || ""} ${event.description || ""}`.toLowerCase().includes(term)).slice(0, 10), mode: "event" };
    }
    const filtered = people.filter((item) => {
      const data = item.data || {};
      const meta = personMeta(item);
      if (!term) return false;
      if (field === "year") return String(meta.year).toLowerCase().includes(term);
      if (field === "branch") return String(meta.branch).toLowerCase().includes(term);
      if (field === "section") return String(meta.section).toLowerCase().includes(term);
      return `${personName(item)} ${data.email || ""} ${meta.branch} ${meta.year} ${meta.section}`.toLowerCase().includes(term);
    }).slice(0, 12);
    return { peopleResults: filtered, eventResults: [], mode: field };
  }, [query, people, events]);

  const close = () => { setOpen(false); setQuery(""); };
  const openPerson = (item) => { setSelected(item); setOpen(false); };

  return (
    <>
      {open && createPortal(
        <AnimatePresence>
          <motion.div className="fixed inset-0 z-[150] bg-black/60 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={close}>
            <motion.div
              className="mx-auto mt-[12vh] w-full max-w-2xl overflow-hidden rounded-[24px] border border-white/15 bg-[#17171a]/95 shadow-[0_28px_90px_rgba(0,0,0,0.62)]"
              initial={{ opacity: 0, y: -18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ type: "spring", stiffness: 380, damping: 30 }} onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <Search className="h-5 w-5 text-white/45" />
                <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people, events, or filters…" className="min-w-0 flex-1 bg-transparent text-[17px] text-white outline-none placeholder:text-white/35" />
                <button type="button" onClick={close} className="rounded-lg p-1 text-white/45 transition hover:bg-white/10 hover:text-white" aria-label="Close search"><X size={19} /></button>
                <kbd className="hidden rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-white/45 sm:block">ESC</kbd>
              </div>
              <div className="max-h-[55vh] overflow-y-auto p-2" data-lenis-prevent>
                {!query.trim() ? (
                  <div className="p-3"><p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Try a search</p>{EXAMPLES.map((example) => <button key={example} onClick={() => setQuery(example)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/75 transition hover:bg-white/8"><Command size={15} className="text-white/35" />{example}</button>)}</div>
                ) : loading ? <p className="p-8 text-center text-sm text-white/45">Searching records…</p> : (
                  <>
                    {mode === "event" ? <ResultLabel label="Events" count={eventResults.length} /> : <ResultLabel label="People" count={peopleResults.length} />}
                    {peopleResults.map((item) => {
                      const data = item.data || {}; const name = personName(item); const meta = personMeta(item);
                      const image = data.photo || data.image || (data.image ? data.image : "");
                      return <button key={`${item.type}-${data._id || data.email}`} onClick={() => openPerson(item)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/8">
                        {image ? <img src={photoPreviewUrl(image)} alt="" className="h-9 w-9 rounded-full object-cover" onError={(event) => { event.currentTarget.src = avatarPlaceholder(name); }} /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/55"><UserRound size={17} /></span>}
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-white">{name}</span><span className="block truncate text-xs text-white/45">{[meta.branch, meta.year, meta.section].filter(Boolean).join(" · ") || meta.department || "Member"}</span></span><Users size={16} className="text-white/25" />
                      </button>;
                    })}
                    {eventResults.map((event) => <button key={event._id || event.id || event.title} onClick={() => { close(); navigate("/events"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/8"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-400/15 text-violet-200"><CalendarDays size={17} /></span><span className="min-w-0"><span className="block truncate text-sm font-medium text-white">{event.title || event.name}</span><span className="block truncate text-xs text-white/45">{event.date || "Event"}</span></span></button>)}
                    {!peopleResults.length && !eventResults.length && <p className="p-8 text-center text-sm text-white/45">No matching results.</p>}
                  </>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[11px] text-white/35"><span>Search across the site</span><span><kbd className="rounded border border-white/15 px-1">⌘</kbd> <kbd className="rounded border border-white/15 px-1">K</kbd></span></div>
            </motion.div>
          </motion.div>
        </AnimatePresence>, document.body,
      )}
      {selected?.type === "teamMember" && <MemberDetailModal member={selected.data} onClose={() => setSelected(null)} />}
      {selected?.type === "user" && <UserDetailModal user={selected.data} onClose={() => setSelected(null)} />}
      {selected?.type === "predefinedOnly" && <PredefinedOnlyDetailModal predefined={selected.data} onClose={() => setSelected(null)} />}
    </>
  );
}

function ResultLabel({ label, count }) { return <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">{label} · {count}</p>; }
