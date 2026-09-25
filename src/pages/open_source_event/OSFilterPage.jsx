import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getOSProjects } from "../../services/api";
import { ArrowLeft, ChevronDown, SlidersHorizontal, X } from "lucide-react";

const difficultyOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "capstone", label: "Capstone" },
  { value: "advanced", label: "Advanced" },
];

export default function OSFilterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-fill from URL params passed by ProjectsPage
  const [selectedStacks, setSelectedStacks] = useState(() => {
    const raw = searchParams.get("stacks");
    return raw ? raw.split(",").filter(Boolean) : [];
  });
  const [difficulty, setDifficulty] = useState(
    () => searchParams.get("difficulty") || "",
  );
  const [stackInput, setStackInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingStacks, setLoadingStacks] = useState(true);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch projects just to get the unique stacks list
  useEffect(() => {
    let active = true;
    getOSProjects()
      .then((data) => {
        if (active) setProjects(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingStacks(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const availableStacks = useMemo(() => {
    const map = new Map();
    projects
      .flatMap((p) => p.stacks || [])
      .forEach((s) => {
        const label = String(s || "").trim();
        if (label) map.set(label.toLowerCase(), label);
      });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const filteredDropdownStacks = availableStacks.filter(
    (s) =>
      !selectedStacks.some((sel) => sel.toLowerCase() === s.toLowerCase()) &&
      s.toLowerCase().includes(stackInput.trim().toLowerCase()),
  );

  const addStack = (stack) => {
    const trimmed = stack.trim();
    if (!trimmed) return;
    setSelectedStacks((cur) =>
      cur.some((s) => s.toLowerCase() === trimmed.toLowerCase())
        ? cur
        : [...cur, trimmed],
    );
    setStackInput("");
    setIsDropdownOpen(false);
  };

  const removeStack = (stack) => {
    setSelectedStacks((cur) =>
      cur.filter((s) => s.toLowerCase() !== stack.toLowerCase()),
    );
  };

  const handleApply = () => {
    const params = new URLSearchParams();
    if (selectedStacks.length) params.set("stacks", selectedStacks.join(","));
    if (difficulty) params.set("difficulty", difficulty);
    const qs = params.toString();
    navigate(`/open-source${qs ? `?${qs}` : ""}`);
  };

  const handleReset = () => {
    setSelectedStacks([]);
    setStackInput("");
    setDifficulty("");
  };

  const handleBack = () => navigate("/open-source");

  return (
    <div className="relative min-h-screen bg-[#020808] font-montserrat text-white">
      {/* Top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.13),transparent_65%)]" />

      <main className="relative mx-auto max-w-2xl px-5 pb-24 pt-24 sm:px-8">
        {/* Back link */}
        <button
          type="button"
          onClick={handleBack}
          className="mb-10 flex items-center gap-2 text-sm text-richblack-100 transition hover:text-emerald-300"
        >
          <ArrowLeft size={15} />
          Back to Projects
        </button>

        {/* Page header */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-emerald-300">
            GFG BVCOE · Open Source
          </p>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300">
              <SlidersHorizontal size={20} />
            </span>
            Filter Projects
          </h1>
          <p className="mt-4 text-sm leading-6 text-richblack-100">
            Choose tech stacks and a difficulty level to narrow down the project
            list.
          </p>
        </div>

        {/* ── Form card ── */}
        <div className="rounded-2xl border border-emerald-300/15 bg-[#07130f]/80 shadow-xl shadow-black/25 backdrop-blur">
          {/* Tech Stack section */}
          <div className="p-6 sm:p-8">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-400">
              Tech Stack
            </p>

            {/* Input row */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={stackInput}
                  onChange={(e) => {
                    setStackInput(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      if (stackInput.trim()) {
                        addStack(stackInput);
                      } else if (filteredDropdownStacks.length === 1) {
                        addStack(filteredDropdownStacks[0]);
                      }
                    }
                    if (e.key === "Escape") setIsDropdownOpen(false);
                  }}
                  placeholder="Type a stack and press Enter…"
                  className="h-12 flex-1 rounded-xl border border-white/[0.1] bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-richblack-200 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen((v) => !v);
                    inputRef.current?.focus();
                  }}
                  aria-label="Browse available stacks"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-emerald-300/30 text-emerald-300 transition hover:bg-emerald-400/10"
                >
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {/* Dropdown list */}
              {isDropdownOpen && (
                <div className="absolute inset-x-0 top-[calc(100%+8px)] z-20 rounded-xl border border-emerald-300/20 bg-[#0d1f18] shadow-2xl shadow-black/60">
                  {loadingStacks ? (
                    <p className="px-4 py-4 text-sm text-richblack-200">
                      Loading stacks…
                    </p>
                  ) : filteredDropdownStacks.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto p-1.5 [scrollbar-color:rgba(110,231,183,0.4)_transparent] [scrollbar-width:thin]">
                      {filteredDropdownStacks.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addStack(s)}
                          className="flex w-full items-center rounded-lg px-4 py-2.5 text-left text-sm text-richblack-100 transition hover:bg-emerald-400/10 hover:text-emerald-200"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-4 text-sm text-richblack-300">
                      {availableStacks.length === 0
                        ? "No stacks found in projects"
                        : "No matching stacks"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Selected stack tags */}
            {selectedStacks.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedStacks.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => removeStack(s)}
                    className="flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:border-red-300/50 hover:bg-red-400/10 hover:text-red-200"
                  >
                    {s}
                    <X size={12} />
                  </button>
                ))}
              </div>
            )}

            {selectedStacks.length === 0 && !loadingStacks && (
              <p className="mt-3 text-xs text-richblack-200">
                {availableStacks.length > 0
                  ? `${availableStacks.length} stacks available — type or click ▾ to browse`
                  : "No stacks available yet"}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.06]" />

          {/* Difficulty Level section */}
          <div className="p-6 sm:p-8">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-400">
              Difficulty Level
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[{ value: "", label: "All levels" }, ...difficultyOptions].map(
                (opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setDifficulty(opt.value === difficulty ? "" : opt.value)
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      difficulty === opt.value
                        ? "border-emerald-300/70 bg-emerald-400 text-[#02140a] shadow-[0_0_16px_rgba(74,222,128,0.25)]"
                        : "border-white/[0.08] bg-white/[0.03] text-richblack-100 hover:border-emerald-300/40 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.06]" />

          {/* Action bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-6 sm:p-8">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-white/[0.1] px-5 py-2.5 text-sm font-semibold text-richblack-100 transition hover:border-emerald-300/30 hover:text-white"
            >
              Reset
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-white/[0.1] px-5 py-2.5 text-sm font-semibold text-richblack-100 transition hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-6 py-2.5 text-sm font-semibold text-[#16231d] transition hover:from-green-300 hover:to-emerald-200"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
