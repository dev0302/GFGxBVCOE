import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { createEvent, getUpcomingEventsForImport } from "../../services/api";
import { toast } from "sonner";
import { SectionTitle, inputClass, labelClass } from "../../components/EventDashboard/SectionTitle";
import { Spinner } from "../../components/ui/spinner";
import { AILoader } from "../../components/ui/ai-loader";
import { PulseLoader, TextShimmerLoader } from "../../components/ui/loader";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, Calendar, MapPin, X } from "lucide-react";
import { cloudinaryAvatarUrl, cloudinaryPickerThumbUrl } from "../../utils/cloudinary";

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const isVideo = (file) => file?.type?.startsWith("video/") || VIDEO_TYPES.includes(file?.type);
const BASE = import.meta.env.VITE_API_BASE_URL;
function formatUpcomingDate(value) {
  if (value == null || value === "") return "";
  const dt = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function isUpcomingDatePast(value) {
  if (value == null || value === "") return false;
  const dt = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dt.getTime())) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return dt < start;
}

/** Latest updatedAt / createdAt among import-pool rows (for “Recent” tag). */
function getMostRecentlyTouchedUpcomingId(events) {
  if (!events?.length) return null;
  let bestId = events[0]._id;
  let bestTs = new Date(events[0].updatedAt || events[0].createdAt || 0).getTime();
  for (let i = 1; i < events.length; i++) {
    const ev = events[i];
    const ts = new Date(ev.updatedAt || ev.createdAt || 0).getTime();
    if (ts > bestTs) {
      bestTs = ts;
      bestId = ev._id;
    }
  }
  return bestId;
}

export default function UploadNewEvent() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [importDropdownOpen, setImportDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef([]);
  const importDropdownRef = useRef(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [speakers, setSpeakers] = useState([{ name: "", title: "" }]);
  const [agenda, setAgenda] = useState([""]);
  const [prerequisites, setPrerequisites] = useState([""]);

  previewUrlsRef.current = previewUrls;
  useEffect(() => {
    setUpcomingLoading(true);
    getUpcomingEventsForImport()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setUpcomingEvents(res.data);
      })
      .catch(() => toast.error("Failed to load upcoming events"))
      .finally(() => setUpcomingLoading(false));
  }, []);
  useEffect(() => {
    return () => previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    if (!importDropdownOpen) return;
    const onDown = (e) => {
      if (importDropdownRef.current && !importDropdownRef.current.contains(e.target)) {
        setImportDropdownOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setImportDropdownOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [importDropdownOpen]);

  const [isAutoFilling, setIsAutoFilling] = useState(false);
  /** Shown only after dropdown AI import succeeds; cleared on successful publish (resetForm). */
  const [showAiReviewNotice, setShowAiReviewNotice] = useState(false);
  const AI_IMPORT_MIN_MS = 2000;
  const handleImportEvent = async (eventIdOverride) => {
    const id = eventIdOverride ?? selectedEventId;
    if (!id) {
      toast.error("Select an event first");
      return;
    }

    const startedAt = Date.now();
    setIsAutoFilling(true);

    try {
      const selected = upcomingEvents.find((ev) => ev._id === id);

      if (!selected) throw new Error("Event not found");

      console.log("Sending to AI:", selected);

      const res = await fetch(`${BASE}/api/v1/ai/format-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rawData: selected }),
      });

      const result = await res.json();

      // console.log("AI response:", result);

      if (!result.success) throw new Error("AI failed");

      const data = result.data;

      // 🎯 Fill form
      setTitle(data.title || "");
      setDate(data.date?.slice(0, 10) || "");
      setTime(data.time || "");
      setLocation(data.location || "");
      setCategory(data.category || "");
      setDescription(data.description || "");
      setModalDescription(data.modalDescription || "");
      setTargetAudience(data.targetAudience || "");

      setSpeakers(
        data.speakers?.length ? data.speakers : [{ name: "", title: "" }]
      );
      setAgenda(data.agenda?.length ? data.agenda : [""]);
      setPrerequisites(
        data.prerequisites?.length ? data.prerequisites : [""]
      );

      setShowAiReviewNotice(true);
      toast.success("Event auto-filled with AI ✨");
    } catch (err) {
      console.error("IMPORT ERROR:", err);
      setShowAiReviewNotice(false);
      toast.error("Failed to import event");
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, AI_IMPORT_MIN_MS - elapsed);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      setIsAutoFilling(false);
    }
  };

  const selectedUpcoming = upcomingEvents.find((ev) => ev._id === selectedEventId);
  const importPoolRecentEventId = useMemo(
    () => getMostRecentlyTouchedUpcomingId(upcomingEvents),
    [upcomingEvents]
  );
  const addGalleryFiles = useCallback((newFiles) => {
    const list = Array.from(newFiles || []);
    if (list.length === 0) return;
    setGalleryFiles((prev) => [...prev, ...list]);
    setPreviewUrls((prev) => {
      const next = [...prev];
      list.forEach((f) => next.push(URL.createObjectURL(f)));
      return next;
    });
  }, []);
  const removeGalleryFile = useCallback((index) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const addSpeaker = () => setSpeakers((s) => [...s, { name: "", title: "" }]);
  const removeSpeaker = (i) => setSpeakers((s) => s.filter((_, idx) => idx !== i));
  const updateSpeaker = (i, field, value) => setSpeakers((s) => s.map((sp, idx) => (idx === i ? { ...sp, [field]: value } : sp)));
  const addAgenda = () => setAgenda((a) => [...a, ""]);
  const removeAgenda = (i) => setAgenda((a) => a.filter((_, idx) => idx !== i));
  const updateAgenda = (i, value) => setAgenda((a) => a.map((item, idx) => (idx === i ? value : item)));
  const addPrerequisite = () => setPrerequisites((p) => [...p, ""]);
  const removePrerequisite = (i) => setPrerequisites((p) => p.filter((_, idx) => idx !== i));
  const updatePrerequisite = (i, value) => setPrerequisites((p) => p.map((item, idx) => (idx === i ? value : item)));

  const resetForm = () => {
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
    setCategory("");
    setDescription("");
    setModalDescription("");
    setTargetAudience("");
    setGalleryFiles([]);
    setPreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    setSpeakers([{ name: "", title: "" }]);
    setAgenda([""]);
    setPrerequisites([""]);
    setShowAiReviewNotice(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !time.trim() || !location.trim() || !category.trim() || !description.trim()) {
      toast.error("Missing required fields");
      return;
    }
    if (galleryFiles.length === 0) {
      toast.error("Add at least one image or video in the gallery.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("date", date);
    formData.append("time", time.trim());
    formData.append("location", location.trim());
    formData.append("category", category.trim());
    formData.append("description", description.trim());
    formData.append("modalDescription", modalDescription.trim());
    formData.append("targetAudience", targetAudience.trim());
    formData.append("speakers", JSON.stringify(speakers.filter((s) => s.name || s.title)));
    formData.append("agenda", JSON.stringify(agenda.filter(Boolean)));
    formData.append("prerequisites", JSON.stringify(prerequisites.filter(Boolean)));
    galleryFiles.forEach((file) => formData.append("gallery", file));

    toast.promise(createEvent(formData), {
      loading: "Uploading event…",
      success: () => {
        resetForm();
        return "Event published successfully.";
      },
      error: (err) => err.message || "Upload failed.",
    }).finally(() => setLoading(false));
  };


  return (
    <div className="flex min-h-full w-full justify-center bg-[#1e1e2f] pb-20 px-4 sm:px-6 lg:px-10">
      {isAutoFilling ? <AILoader text="Generating" /> : null}
      <AnimatePresence>
        {importDropdownOpen && (
          <motion.button
            type="button"
            key="import-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-label="Close event picker"
            className="fixed inset-0 z-[45] bg-[#1e1e2f]/50"
            onClick={() => setImportDropdownOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="w-full max-w-3xl py-10 flex flex-col gap-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-richblack-25">Upload new event</h1>
          <p className="mt-2 text-gray-400 text-sm">
            New events appear on the Events page. Add images and videos for the gallery.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">

          <div
            ref={importDropdownRef}
            className={`relative mb-2 rounded-2xl border p-5 shadow-xl transition-[box-shadow,border-color] duration-200 bg-gradient-to-br from-[#1e1e2f]/90 to-[#2c2c3e]/90 ${
              importDropdownOpen
                ? "z-[50] border-cyan-500/35 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/15"
                : "border-gray-500/25 shadow-black/20"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/70">Optional import</p>
                  <h2 className="mt-0.5 text-base font-semibold text-richblack-25 sm:text-lg font-rounded">Directly import from an recent upcoming event</h2>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-500">
                    Open the picker and choose a row — AI fills the form. All publish fields hide until you close the picker or select an event.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {importDropdownOpen && (
                  <button
                    type="button"
                    onClick={() => setImportDropdownOpen(false)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-500/35 bg-[#252536]/80 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-cyan-500/30 hover:bg-gray-500/15"
                  >
                    <X className="h-3.5 w-3.5" />
                    Close
                  </button>
                )}
                {isAutoFilling && (
                  <div className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-100">
                    <Spinner className="size-3.5 text-cyan-300" />
                    Autofilling…
                  </div>
                )}
              </div>
            </div>

            <div className="relative mt-4">
              <button
                type="button"
                disabled={isAutoFilling || upcomingLoading}
                onClick={() => !isAutoFilling && !upcomingLoading && setImportDropdownOpen((o) => !o)}
                className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  importDropdownOpen
                    ? "border-cyan-500/40 bg-[#252536]"
                    : "border-gray-500/40 bg-[#252536]/90 hover:border-cyan-500/35 hover:bg-[#252536]"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-gray-500/30 bg-[#1e1e2f]">
                  {selectedUpcoming?.poster ? (
                    <img
                      src={cloudinaryAvatarUrl(selectedUpcoming.poster)}
                      alt=""
                      className="h-full w-full object-cover"
                      width={64}
                      height={64}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base text-gray-600">📅</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-richblack-25">
                    {selectedUpcoming?.title || "Tap to choose from an upcoming event…"}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {selectedUpcoming ? formatUpcomingDate(selectedUpcoming.date) : "Poster preview · date · AI autofill on select"}
                  </p>
                </div>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-cyan-400/80 transition-transform duration-200 group-hover:text-cyan-300 ${importDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {importDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.99 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className=" w-10/12 sm:w-full mt-4 sm:mt-0 mx-auto z-[55] overflow-hidden rounded-2xl border border-gray-500/30 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] shadow-xl shadow-black/25 ring-1 ring-cyan-500/10 max-sm:fixed max-sm:inset-x-3 max-sm:bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] max-sm:top-[max(4.5rem,env(safe-area-inset-top,0px))] max-sm:flex max-sm:max-h-[min(88dvh,calc(100dvh-7.5rem))] max-sm:flex-col max-sm:shadow-2xl sm:absolute sm:inset-x-0 sm:bottom-auto sm:top-[calc(100%+0.625rem)] sm:max-h-none sm:flex-none"
                  >
                    <div className="flex shrink-0 items-start justify-between gap-2 border-b border-gray-500/25 bg-[#252536]/95 px-3 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-[#252536]/80 sm:gap-3 sm:px-4 sm:py-3.5">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-sm font-semibold text-richblack-25 sm:text-xs">Pick upcoming event</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-gray-400 sm:mt-1 sm:max-w-[20rem] md:max-w-none">
                          <span className="max-[380px]:hidden sm:inline">Selecting a row runs AI and closes this panel</span>
                          <span className="min-[381px]:hidden sm:hidden">Tap a row — AI fills the form</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        <span className="rounded-lg border border-gray-500/30 bg-[#252536]/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-300">
                          {upcomingEvents.length} total
                        </span>
                        <button
                          type="button"
                          onClick={() => setImportDropdownOpen(false)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-500/40 bg-[#252536]/90 text-gray-400 transition hover:border-cyan-500/35 hover:bg-gray-500/15 hover:text-richblack-25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500/50"
                          aria-label="Close event picker"
                        >
                          <X className="h-5 w-5" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain p-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/20 hover:scrollbar-thumb-cyan-500/35 max-sm:max-h-none sm:max-h-[min(300px,50dvh)] sm:flex-none md:max-h-[min(380px,56dvh)] lg:max-h-[min(440px,60dvh)] landscape:max-sm:max-h-[min(70dvh,20rem)]">
                      {upcomingLoading ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-14 text-sm text-gray-500">
                          <Spinner className="size-6 text-cyan-400" />
                          Loading upcoming events…
                        </div>
                      ) : upcomingEvents.length === 0 ? (
                        <p className="px-4 py-10 text-center text-sm text-gray-500">
                          No upcoming events yet. Add one under <span className="text-cyan-400/90">EM Dashboard → Upcoming event</span>.
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-1 max-sm:gap-2 sm:gap-1.5">
                          {upcomingEvents.map((ev, idx) => (
                            <li key={ev._id}>
                              <button
                                type="button"
                                disabled={isAutoFilling}
                                onClick={() => {
                                  setSelectedEventId(ev._id);
                                  setImportDropdownOpen(false);
                                  handleImportEvent(ev._id);
                                }}
                                className="flex w-full min-h-[3.5rem] items-stretch gap-2 rounded-xl border border-transparent bg-transparent p-2 text-left transition hover:border-cyan-500/25 hover:bg-cyan-500/[0.06] active:scale-[0.99] active:bg-cyan-500/[0.08] disabled:opacity-50 sm:min-h-0 sm:gap-3 sm:p-2"
                              >
                                <span className="flex w-5 shrink-0 items-center justify-center text-[10px] font-mono text-gray-500 sm:w-6">
                                  {String(idx + 1).padStart(2, "0")}
                                </span>
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-500/30 bg-[#252536] sm:h-[4.5rem] sm:w-[4.5rem]">
                                  {ev.poster ? (
                                    <img
                                      src={cloudinaryPickerThumbUrl(ev.poster)}
                                      alt=""
                                      className="h-full w-full object-cover"
                                      width={80}
                                      height={80}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2c2c3e] to-[#252536] text-xl text-gray-500">
                                      📅
                                    </div>
                                  )}
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 border-l border-gray-500/20 pl-2 sm:pl-3">
                                  <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
                                    <p className="line-clamp-2 min-w-0 flex-1 text-[13px] font-semibold leading-snug text-white">{ev.title}</p>
                                    {importPoolRecentEventId === ev._id ? (
                                      <span className="shrink-0 rounded-md border border-cyan-500/40 bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-cyan-200/95">
                                        Recent
                                      </span>
                                    ) : null}
                                    {isUpcomingDatePast(ev.date) ? (
                                      <span className="shrink-0 rounded-md border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-200/95">
                                        Past
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-cyan-400/85">
                                    <Calendar className="h-3.5 w-3.5 shrink-0 opacity-80 sm:h-3 sm:w-3" />
                                    {formatUpcomingDate(ev.date)}
                                    {ev.time ? <span className="text-gray-500">· {ev.time}</span> : null}
                                  </p>
                                  {ev.location ? (
                                    <p className="flex items-start gap-1.5 text-[10px] text-gray-500 sm:items-center">
                                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0 sm:h-3 sm:w-3" />
                                      <span className="line-clamp-2 sm:line-clamp-1">{ev.location}</span>
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex shrink-0 items-center self-center pr-0.5 sm:pr-1">
                                  <span className="rounded-lg border border-cyan-500/25 bg-cyan-500/[0.08] p-2.5 text-cyan-300/90 sm:p-2">
                                    <Sparkles className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                                  </span>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {showAiReviewNotice ? (
              <div
                className="mt-4 flex items-start gap-3 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-500/[0.12] via-blue-400/[0.06] to-transparent px-4 py-3 shadow-[0_0_24px_-10px_rgba(59,130,246,0.35)] ring-1 ring-blue-400/20"
                role="note"
              >
                <PulseLoader
                  size="sm"
                  className="mt-0.5 shrink-0"
                  pulseClassName="border-blue-400/90 shadow-[0_0_10px_rgba(59,130,246,0.35)]"
                />
                <div className="min-w-0 text-[13px] leading-snug sm:text-sm">
                  <span className="font-semibold tracking-tight text-blue-100">
                    AI can misread fields
                  </span>
                  <span className="font-medium text-blue-200/70"> — </span>
                  <TextShimmerLoader
                    text="always review before publishing."
                    size="sm"
                    gradientClassName="bg-[linear-gradient(to_right,rgba(147,197,253,0.35)_25%,rgb(239,246,255)_50%,rgba(147,197,253,0.35)_75%)]"
                    className="inline-block align-baseline !text-[13px] sm:!text-sm !leading-snug"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <AnimatePresence initial={false}>
            {!importDropdownOpen && (
              <motion.div
                key="upload-form-body"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex flex-col gap-10 overflow-hidden"
              >
                <div className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
                  <SectionTitle icon="📋">Event details</SectionTitle>
                  <div className="space-y-4">
              <div>
                <label className={labelClass}>Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. HACK N FRAG 2025" required />
              </div>
              <div>
                <label className={labelClass}>Category *</label>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} placeholder="e.g. BVEST Gaming Event" required />
              </div>
              <div>
                <label className={labelClass}>Location *</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="e.g. A-405, BVCOE" required />
              </div>
              <div>
                <label className={labelClass}>Short description (card) *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass + " min-h-[88px] resize-y"} placeholder="Brief description for the event card" required />
              </div>
              <div>
                <label className={labelClass}>Modal description (optional)</label>
                <textarea value={modalDescription} onChange={(e) => setModalDescription(e.target.value)} className={inputClass + " min-h-[88px] resize-y"} placeholder="Longer description for the Know More modal" />
              </div>
              <div>
                <label className={labelClass}>Target audience (optional)</label>
                <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className={inputClass} placeholder="e.g. All BVCOE students" />
              </div>
                  </div>
                </div>

                <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <SectionTitle icon="📅">Date & time</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date *</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass + " [color-scheme:dark]"} required />
              </div>
              <div>
                <label className={labelClass}>Time *</label>
                <input type="text" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} placeholder="e.g. 10:00 AM - 3:00 PM" required />
              </div>
            </div>
                </section>

                <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <SectionTitle icon="🖼️">Gallery (images & videos) *</SectionTitle>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={(e) => { addGalleryFiles(e.target.files); e.target.value = ""; }} className="hidden" />
            <div
              onDrop={(e) => { e.preventDefault(); addGalleryFiles(e.dataTransfer.files); }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-500/50 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors"
            >
              <div className="text-4xl mb-2 opacity-80">📁</div>
              <p className="text-gray-300 font-medium">Drop files here or click to browse</p>
              <p className="text-sm text-gray-500 mt-1">Images and videos. Multiple files supported.</p>
            </div>
            {galleryFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryFiles.map((file, index) => {
                  const url = previewUrls[index];
                  const isVid = isVideo(file);
                  return (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-[#252536] border border-gray-500/30">
                      {isVid ? <video src={url} muted playsInline preload="metadata" className="w-full h-full object-cover" /> : <img src={url} alt="" className="w-full h-full object-cover" />}
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeGalleryFile(index); }} className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500/90 text-richblack-25 flex items-center justify-center text-sm font-bold">×</button>
                    </div>
                  );
                })}
              </div>
            )}
                </section>

                <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon="🎤">Speakers</SectionTitle>
              <button type="button" onClick={addSpeaker} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">+ Add</button>
            </div>
            <div className="space-y-3">
              {speakers.map((sp, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" value={sp.name} onChange={(e) => updateSpeaker(i, "name", e.target.value)} className={inputClass + " flex-1"} placeholder="Name" />
                  <input type="text" value={sp.title} onChange={(e) => updateSpeaker(i, "title", e.target.value)} className={inputClass + " flex-1"} placeholder="Title / role" />
                  {speakers.length > 1 && <button type="button" onClick={() => removeSpeaker(i)} className="p-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 shrink-0">Remove</button>}
                </div>
              ))}
            </div>
                </section>

                <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon="📌">Agenda</SectionTitle>
              <button type="button" onClick={addAgenda} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">+ Add</button>
            </div>
            <div className="space-y-2">
              {agenda.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={item} onChange={(e) => updateAgenda(i, e.target.value)} className={inputClass} placeholder="Agenda item" />
                  {agenda.length > 1 && <button type="button" onClick={() => removeAgenda(i)} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">Remove</button>}
                </div>
              ))}
            </div>
                </section>

                <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon="✓">Prerequisites</SectionTitle>
              <button type="button" onClick={addPrerequisite} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">+ Add</button>
            </div>
            <div className="space-y-2">
              {prerequisites.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={item} onChange={(e) => updatePrerequisite(i, e.target.value)} className={inputClass} placeholder="Prerequisite" />
                  {prerequisites.length > 1 && <button type="button" onClick={() => removePrerequisite(i)} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">Remove</button>}
                </div>
              ))}
            </div>
                </section>

                <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-richblack-25 font-semibold shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {loading ? "Publishing…" : "Publish event"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
