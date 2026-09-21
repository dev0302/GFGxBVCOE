import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Command, Download, Search, UserRound, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getEvents, getSearchPeople } from "../services/api";
import { avatarPlaceholder, photoPreviewUrl } from "../utils/teamMemberUtils";
import {
  completionGhost,
  getSearchCompletions,
  parsePeopleSearchQuery,
  personHasSocial,
  personRecordMatches,
  personSocialValue,
  resolveSocialPlatform,
  socialPlatformLabel,
} from "../utils/peopleSearchQuery";
import { downloadSocialPresencePDF } from "../utils/teamListExport";
import { MemberDetailModal, PredefinedOnlyDetailModal, UserDetailModal } from "./Search";
import siteEvents from "../data/eventData";

export const SPOTLIGHT_OPEN_EVENT = "gfg-spotlight-open";
export const openSpotlight = () => {
  window.dispatchEvent(new CustomEvent(SPOTLIGHT_OPEN_EVENT));
};

const EXAMPLES = [
  "Search a person",
  "gender:male",
  "gender:female",
  "technical",
  "technical lead",
  "role:event management head",
  "year:3rd",
  "branch:cse",
  "event:geekhunt",
  "social:github",
  "social:insta",
  "social:linkedin",
];

const PERSON_TYPE_RANK = { user: 0, teamMember: 1, predefinedOnly: 2 };

function mergePersonItems(items) {
  const byKey = new Map();
  for (const item of items) {
    const data = item.data || {};
    const email = String(data.email || "").trim().toLowerCase();
    const key = email || `${item.type}:${data._id || personName(item)}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }
    const preferNew = (PERSON_TYPE_RANK[item.type] ?? 9) < (PERSON_TYPE_RANK[existing.type] ?? 9);
    const winner = preferNew ? { ...item } : { ...existing };
    const other = preferNew ? existing : item;
    const winnerData = winner.data || {};
    const otherData = other.data || {};
    winner.data = {
      ...otherData,
      ...winnerData,
      socials: {
        ...(otherData.socials || otherData.profile?.socials || otherData.additionalDetails?.socials || {}),
        ...(winnerData.socials || winnerData.profile?.socials || winnerData.additionalDetails?.socials || {}),
      },
      instaLink: winnerData.instaLink || otherData.instaLink || "",
      linkedinLink: winnerData.linkedinLink || otherData.linkedinLink || "",
    };
    byKey.set(key, winner);
  }
  return [...byKey.values()];
}

function sortPeopleByName(items) {
  return [...items].sort((a, b) => personName(a).localeCompare(personName(b), undefined, { sensitivity: "base" }));
}

function socialExportRow(item, platform) {
  const data = item.data || {};
  const meta = personMeta(item);
  return {
    name: personName(item),
    email: data.email || "",
    department: meta.department || "",
    link: personSocialValue(data, platform),
  };
}
const overlayTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] };
const panelTransition = { type: "spring", stiffness: 380, damping: 30, mass: 0.85 };
const contentTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.06 };

const mapSearchPeople = (result) => [
  ...(result.teamMembers || []).map((member) => ({
    type: "teamMember",
    data: member,
    department: member.department,
  })),
  ...(result.users || []).map((user) => ({ type: "user", data: user })),
  ...(result.predefinedOnly || []).map((profile) => ({
    type: "predefinedOnly",
    data: profile,
  })),
];

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
    department: item.department || data.department || data.accountType || "",
    gender: profile.gender || data.gender || "",
    role: profile.position || profile.role || profile.p0 || data.position || "",
  };
};

const isPhoneViewport = () => window.matchMedia("(max-width: 767px)").matches;
const isTypingTarget = (node) => {
  if (!node || node.nodeType !== 1) return false;
  const el = node.closest?.("input, textarea, select, [contenteditable='true']");
  return Boolean(el);
};

function isCircleGesture(points) {
  if (points.length < 18) return false;

  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  if (length < 220) return false;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let sumX = 0;
  let sumY = 0;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
    sumX += point.x;
    sumY += point.y;
  }
  const width = maxX - minX;
  const height = maxY - minY;
  if (width < 72 || height < 72) return false;
  if (Math.max(width, height) / Math.min(width, height) > 1.8) return false;

  const cx = sumX / points.length;
  const cy = sumY / points.length;
  const radii = points.map((point) => Math.hypot(point.x - cx, point.y - cy));
  const meanR = radii.reduce((sum, radius) => sum + radius, 0) / radii.length;
  if (meanR < 42) return false;
  const variance = radii.reduce((sum, radius) => sum + (radius - meanR) ** 2, 0) / radii.length;
  if (Math.sqrt(variance) / meanR > 0.3) return false;

  const bins = new Array(12).fill(false);
  for (const point of points) {
    const angle = Math.atan2(point.y - cy, point.x - cx);
    let index = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * bins.length);
    if (index >= bins.length) index = 0;
    bins[index] = true;
  }
  if (bins.filter(Boolean).length < 9) return false;

  const start = points[0];
  const end = points[points.length - 1];
  if (Math.hypot(start.x - end.x, start.y - end.y) > meanR * 0.8) return false;

  return { x: cx, y: cy };
}

export default function SpotlightSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [events, setEvents] = useState(() => [...siteEvents]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [gestureBurst, setGestureBurst] = useState(null);
  const [downloadingSocial, setDownloadingSocial] = useState(false);

  const openRef = useRef(false);
  const selectedRef = useRef(null);
  openRef.current = open;
  selectedRef.current = selected;

  const show = () => {
    if (!user) return;
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setQuery("");
    setSelected(null);
  };

  useEffect(() => {
    if (!user) {
      if (openRef.current) close();
      return undefined;
    }
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        show();
      }
      if (event.key === "Escape") {
        if (selectedRef.current) {
          event.preventDefault();
          setSelected(null);
          return;
        }
        if (openRef.current) {
          event.preventDefault();
          close();
        }
      }
    };
    const onOpenEvent = () => show();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(SPOTLIGHT_OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(SPOTLIGHT_OPEN_EVENT, onOpenEvent);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const points = [];
    let tracking = false;
    let last = null;

    const reset = () => {
      tracking = false;
      last = null;
      points.length = 0;
    };

    const onStart = (event) => {
      if (!isPhoneViewport() || openRef.current || event.touches.length !== 1) return;
      if (isTypingTarget(event.target)) return;
      const touch = event.touches[0];
      tracking = true;
      last = { x: touch.clientX, y: touch.clientY };
      points.length = 0;
      points.push(last);
    };

    const onMove = (event) => {
      if (!tracking || event.touches.length !== 1) {
        if (event.touches.length !== 1) reset();
        return;
      }
      const touch = event.touches[0];
      const next = { x: touch.clientX, y: touch.clientY };
      if (!last || Math.hypot(next.x - last.x, next.y - last.y) < 6) return;
      last = next;
      if (points.length < 220) points.push(next);
    };

    const onEnd = (event) => {
      if (!tracking) return;
      const circle = isCircleGesture(points);
      reset();
      if (!circle || openRef.current) return;
      event.preventDefault();
      setGestureBurst(circle);
      if (navigator.vibrate) navigator.vibrate(12);
      window.setTimeout(() => {
        setGestureBurst(null);
        show();
      }, 180);
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: false });
    window.addEventListener("touchcancel", reset);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", reset);
    };
  }, [user]);

  useEffect(() => {
    if (!open || !user) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 180);
    getEvents()
      .then((eventsResult) => {
        setEvents([...(eventsResult.data || []), ...siteEvents]);
      })
      .catch(() => {
        setEvents((current) => (current.length ? current : [...siteEvents]));
      });
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [open, user]);

  useEffect(() => {
    if (!open || !user) return undefined;
    const value = query.trim();
    const parsed = parsePeopleSearchQuery(value);
    if (parsed.field === "event") {
      setPeople([]);
      setLoading(false);
      return undefined;
    }
    const canSearch =
      parsed.term.length >= 2 ||
      (parsed.field === "gender" && parsed.term.length >= 1) ||
      (parsed.field === "social" && Boolean(parsed.socialPlatform || resolveSocialPlatform(parsed.term)));
    if (!canSearch) {
      setPeople([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      getSearchPeople(value, undefined, true)
        .then((result) => {
          if (cancelled) return;
          setPeople(mapSearchPeople(result));
        })
        .catch(() => {
          if (!cancelled) setPeople([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, user, query]);

  const { peopleResults, eventResults, mode, socialPlatform } = useMemo(() => {
    const value = query.trim();
    const parsed = parsePeopleSearchQuery(value);
    const field = parsed.field;
    const term = parsed.term.toLowerCase();
    if (field === "event") {
      return {
        peopleResults: [],
        eventResults: events.filter((event) =>
          `${event.title || event.name || ""} ${event.description || ""}`.toLowerCase().includes(term),
        ),
        mode: "event",
        socialPlatform: "",
      };
    }
    const filtered = people.filter((item) => {
      const data = { ...(item.data || {}), department: item.department || item.data?.department };
      return personRecordMatches(data, parsed, item.department || data.accountType);
    });
    const peopleResults = field === "social" ? mergePersonItems(filtered) : filtered;
    return { peopleResults, eventResults: [], mode: field, socialPlatform: parsed.socialPlatform || "" };
  }, [query, people, events]);

  const socialGroups = useMemo(() => {
    if (mode !== "social" || !socialPlatform) {
      return { withSocial: [], withoutSocial: [] };
    }
    const withSocial = [];
    const withoutSocial = [];
    for (const item of peopleResults) {
      if (personHasSocial(item.data, socialPlatform)) withSocial.push(item);
      else withoutSocial.push(item);
    }
    return {
      withSocial: sortPeopleByName(withSocial),
      withoutSocial: sortPeopleByName(withoutSocial),
    };
  }, [mode, peopleResults, socialPlatform]);

  const downloadSocialList = async () => {
    if (!socialPlatform || downloadingSocial) return;
    setDownloadingSocial(true);
    try {
      const label = socialPlatformLabel(socialPlatform);
      await downloadSocialPresencePDF({
        platform: socialPlatform,
        label,
        withSocial: socialGroups.withSocial.map((item) => socialExportRow(item, socialPlatform)),
        withoutSocial: socialGroups.withoutSocial.map((item) => socialExportRow(item, socialPlatform)),
      });
      toast.success(`${label} list downloaded`);
    } catch (error) {
      toast.error(error.message || "Failed to download PDF");
    } finally {
      setDownloadingSocial(false);
    }
  };

  const completions = useMemo(() => getSearchCompletions(query), [query]);
  const topCompletion = completions[0] || null;
  const ghost = completionGhost(query, topCompletion);
  const applyCompletion = (completion) => {
    if (!completion?.value) return;
    setQuery(completion.value);
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };

  const openPerson = (item) => setSelected(item);

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {gestureBurst && (
            <motion.span
              key="circle-burst"
              className="pointer-events-none fixed z-[149] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-green-300/80"
              style={{ left: gestureBurst.x, top: gestureBurst.y }}
              initial={{ opacity: 0.9, scale: 0.55 }}
              animate={{ opacity: 0, scale: 1.55 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="spotlight-overlay"
              className="fixed inset-0 z-[150] flex items-start justify-center bg-black/60 p-3 pt-[10vh] backdrop-blur-md sm:p-4 sm:pt-[12vh]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={overlayTransition}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) close();
              }}
            >
              <motion.div
                className="w-full max-w-2xl overflow-hidden rounded-[24px] border border-white/15 bg-[#17171a]/95 shadow-[0_28px_90px_rgba(0,0,0,0.62)]"
                initial={{ opacity: 0, y: -42, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -28, scale: 0.95 }}
                transition={panelTransition}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                  <Search className="h-5 w-5 shrink-0 text-white/45" />
                  <div className="relative min-w-0 flex-1">
                    <div
                      className="pointer-events-none absolute inset-0 truncate text-[17px] leading-[inherit]"
                      aria-hidden="true"
                    >
                      <span className="invisible whitespace-pre">{query}</span>
                      {ghost ? <span className="whitespace-pre text-white/40">{ghost}</span> : null}
                    </div>
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Tab" && topCompletion) {
                          event.preventDefault();
                          applyCompletion(topCompletion);
                        }
                      }}
                      placeholder="Name, gender:male, social:github…"
                      className="relative z-10 w-full bg-transparent text-[17px] text-white outline-none placeholder:text-white/35"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  {topCompletion ? (
                    <button
                      type="button"
                      onClick={() => applyCompletion(topCompletion)}
                      className="hidden shrink-0 items-center rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-white/55 transition hover:border-green-300/40 hover:text-green-200 sm:flex"
                      title={`Complete “${topCompletion.label}”`}
                    >
                      Tab
                    </button>
                  ) : (
                    <kbd className="hidden rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-white/45 sm:block">ESC</kbd>
                  )}
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg p-1 text-white/45 transition hover:bg-white/10 hover:text-white"
                    aria-label="Close search"
                  >
                    <X size={19} />
                  </button>
                </div>
                <motion.div
                  className="max-h-[55vh] overflow-y-auto overscroll-contain p-2"
                  data-lenis-prevent
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={contentTransition}
                >
                  {!query.trim() ? (
                    <div className="p-3">
                      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                        Try a search
                      </p>
                      {EXAMPLES.map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => setQuery(example)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/75 transition hover:bg-white/8"
                        >
                          <Command size={15} className="text-white/35" />
                          {example}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      {completions.length > 0 && (
                        <div className="mb-1">
                          <ResultLabel label="Suggestions" count={completions.length} />
                          {completions.map((completion, index) => (
                            <button
                              key={completion.value}
                              type="button"
                              onClick={() => applyCompletion(completion)}
                              className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/8 ${
                                index === 0 ? "bg-white/[0.04] text-white" : "text-white/75"
                              }`}
                            >
                              <span className="flex min-w-0 items-center gap-3">
                                <Command size={15} className="shrink-0 text-white/35" />
                                <span className="truncate">{completion.label}</span>
                              </span>
                              {index === 0 && (
                                <kbd className="shrink-0 rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-white/45">
                                  Tab
                                </kbd>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {loading ? (
                        <p className="p-8 text-center text-sm text-white/45">Searching records…</p>
                      ) : query.trim().length < 2 && mode !== "event" && mode !== "gender" && mode !== "social" ? (
                        <p className="p-8 text-center text-sm text-white/45">Type at least 2 characters.</p>
                      ) : (
                    <>
                      {mode === "event" ? (
                        <ResultLabel label="Events" count={eventResults.length} />
                      ) : mode === "social" && socialPlatform ? (
                        <div className="mb-1 flex items-center justify-between gap-2 px-3 pb-2 pt-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                            {socialPlatformLabel(socialPlatform)} · {socialGroups.withSocial.length} with · {socialGroups.withoutSocial.length} without
                          </p>
                          <button
                            type="button"
                            onClick={downloadSocialList}
                            disabled={downloadingSocial || loading}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-medium text-white/80 transition hover:border-green-300/40 hover:bg-white/8 hover:text-green-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Download size={12} />
                            {downloadingSocial ? "Preparing…" : "Download list"}
                          </button>
                        </div>
                      ) : (
                        <ResultLabel label="People" count={peopleResults.length} />
                      )}
                      {mode === "social" && socialPlatform ? (
                        <>
                          <ResultLabel label={`With ${socialPlatformLabel(socialPlatform)}`} count={socialGroups.withSocial.length} />
                          {socialGroups.withSocial.map((item) => (
                            <PersonRow
                              key={`${item.type}-${(item.data || {})._id || (item.data || {}).email}`}
                              item={item}
                              onOpen={openPerson}
                              socialHint={personSocialValue(item.data, socialPlatform)}
                            />
                          ))}
                          <ResultLabel label={`Without ${socialPlatformLabel(socialPlatform)}`} count={socialGroups.withoutSocial.length} />
                          {socialGroups.withoutSocial.map((item) => (
                            <PersonRow
                              key={`${item.type}-${(item.data || {})._id || (item.data || {}).email}`}
                              item={item}
                              onOpen={openPerson}
                            />
                          ))}
                        </>
                      ) : (
                        peopleResults.map((item) => (
                          <PersonRow
                            key={`${item.type}-${(item.data || {})._id || (item.data || {}).email}`}
                            item={item}
                            onOpen={openPerson}
                          />
                        ))
                      )}
                      {eventResults.map((event) => (
                        <button
                          key={event._id || event.id || event.title}
                          type="button"
                          onClick={() => {
                            close();
                            navigate("/events");
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/8"
                        >
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-400/15 text-violet-200">
                            <CalendarDays size={17} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-white">
                              {event.title || event.name}
                            </span>
                            <span className="block truncate text-xs text-white/45">{event.date || "Event"}</span>
                          </span>
                        </button>
                      ))}
                      {!peopleResults.length && !eventResults.length && completions.length === 0 && mode !== "social" && (
                        <p className="p-8 text-center text-sm text-white/45">No matching results.</p>
                      )}
                      {mode === "social" && socialPlatform && !peopleResults.length && !loading && (
                        <p className="p-8 text-center text-sm text-white/45">No people found.</p>
                      )}
                    </>
                      )}
                    </>
                  )}
                </motion.div>
                <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[11px] text-white/35">
                  <span>Tab completes department, role, or social:github</span>
                  <span className="hidden sm:inline">
                    <kbd className="rounded border border-white/15 px-1">⌘</kbd>{" "}
                    <kbd className="rounded border border-white/15 px-1">K</kbd>
                  </span>
                  <span className="sm:hidden">Draw a circle or tap Search</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
      {selected &&
        createPortal(
          <div className="fixed inset-0 z-[200]">
            {selected.type === "teamMember" && (
              <MemberDetailModal member={selected.data} onClose={() => setSelected(null)} />
            )}
            {selected.type === "user" && (
              <UserDetailModal user={selected.data} onClose={() => setSelected(null)} />
            )}
            {selected.type === "predefinedOnly" && (
              <PredefinedOnlyDetailModal predefined={selected.data} onClose={() => setSelected(null)} />
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function ResultLabel({ label, count }) {
  return (
    <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
      {label} · {count}
    </p>
  );
}

function PersonRow({ item, onOpen, socialHint }) {
  const data = item.data || {};
  const name = personName(item);
  const meta = personMeta(item);
  const image = data.photo || data.image || "";
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/8"
    >
      {image ? (
        <img
          src={photoPreviewUrl(image)}
          alt=""
          className="h-9 w-9 rounded-full object-cover"
          onError={(event) => {
            event.currentTarget.src = avatarPlaceholder(name);
          }}
        />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/55">
          <UserRound size={17} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-white">{name}</span>
        <span className="block truncate text-xs text-white/45">
          {socialHint || [meta.role, meta.department, meta.branch, meta.year].filter(Boolean).join(" · ") || "Member"}
        </span>
      </span>
      <Users size={16} className="text-white/25" />
    </button>
  );
}
