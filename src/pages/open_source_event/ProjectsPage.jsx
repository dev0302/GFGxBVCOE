import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { deleteOSProject, getOSProjects } from "../../services/api";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Upload,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

const categories = [
  "All",
  "Web Development",
  "App Development",
  "Blockchain & Web3",
  "Systems & Backend",
  "Cybersecurity",
  "Cloud, DevOps & Infrastructure",
  "Developer Tools",
];

export const canUploadProjects = (user) => {
  if (
    ["ADMIN", "Chairperson", "Vice-Chairperson", "Treasurer"].includes(
      user?.accountType,
    )
  ) {
    return true;
  }
  const position = String(
    user?.additionalDetails?.position || user?.additionalDetails?.p0 || "",
  ).toLowerCase();
  return position.includes("lead") || position.includes("head");
};

export const canDeleteOSProjects = (user) => {
  const accountType = String(user?.accountType || "").trim();
  if (["ADMIN", "Chairperson", "Vice-Chairperson"].includes(accountType)) {
    return true;
  }

  const position = String(
    user?.additionalDetails?.position || user?.additionalDetails?.p0 || "",
  ).toLowerCase();
  return position.includes("lead");
};

const copyMaintainerEmail = async (email) => {
  try {
    await navigator.clipboard.writeText(email);
    toast.success("Email copied to clipboard");
  } catch {
    toast.error("Unable to copy email");
  }
};

const getRepositoryUrl = (repository) => {
  const value = String(repository || "").trim();
  if (/^https?:\/\//i.test(value)) return value;
  return `https://github.com/${value.replace(/^((www\.)?github\.com)\//i, "")}`;
};

const getProjectKey = (project) =>
  project._id || project.repository || project.name;

const normalizeDifficulty = (level) => {
  return String(level || "").trim().toLowerCase();
};

const difficultyOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "capstone", label: "Capstone" },
  { value: "advanced", label: "Advanced" },
];

function ProjectsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedStacks, setSelectedStacks] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [draftStacks, setDraftStacks] = useState([]);
  const [draftStackInput, setDraftStackInput] = useState("");
  const [isStackListOpen, setIsStackListOpen] = useState(false);
  const [draftDifficulty, setDraftDifficulty] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [descriptionOverflow, setDescriptionOverflow] = useState({});
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const descriptionRefs = useRef({});
  const categoryScrollerRef = useRef(null);
  const filterPanelRef = useRef(null);

  useEffect(() => {
    let active = true;
    getOSProjects()
      .then((data) => {
        if (active) setProjects(data);
      })
      .catch((error) => {
        if (active) setLoadError(error.message || "Failed to load projects");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleDeleteProject = async () => {
    if (!projectToDelete?._id) return;

    setDeletingProject(true);
    try {
      await deleteOSProject(projectToDelete._id);
      setProjects((current) =>
        current.filter((project) => project._id !== projectToDelete._id),
      );
      toast.success("Open source project deleted successfully");
      setProjectToDelete(null);
    } catch (error) {
      toast.error(error.message || "Failed to delete open source project");
    } finally {
      setDeletingProject(false);
    }
  };

  const stacks = useMemo(() => {
    const uniqueStacks = new Map();
    projects.flatMap((project) => project.stacks || []).forEach((stack) => {
      const label = String(stack || "").trim();
      if (label) uniqueStacks.set(label.toLowerCase(), label);
    });
    return Array.from(uniqueStacks.values()).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [projects]);
  const hasActiveFilters = Boolean(
    selectedStacks.length || selectedDifficulty,
  );

  const addDraftStack = () => {
    const stack = draftStackInput.trim();
    if (!stack) return;

    setDraftStacks((current) =>
      current.some((item) => item.toLowerCase() === stack.toLowerCase())
        ? current
        : [...current, stack],
    );
    setDraftStackInput("");
  };

  const removeDraftStack = (stackToRemove) => {
    setDraftStacks((current) =>
      current.filter(
        (stack) => stack.toLowerCase() !== stackToRemove.toLowerCase(),
      ),
    );
  };

  const selectDraftStack = (stack) => {
    setDraftStacks((current) =>
      current.some((item) => item.toLowerCase() === stack.toLowerCase())
        ? current
        : [...current, stack],
    );
    setDraftStackInput("");
    setIsStackListOpen(false);
  };

  const openFilterPanel = () => {
    setDraftStacks(selectedStacks);
    setDraftStackInput("");
    setIsStackListOpen(false);
    setDraftDifficulty(selectedDifficulty);
    setIsFilterOpen(true);
  };

  const applyFilters = () => {
    const pendingStack = draftStackInput.trim();
    const nextStacks =
      pendingStack &&
      !draftStacks.some(
        (stack) => stack.toLowerCase() === pendingStack.toLowerCase(),
      )
        ? [...draftStacks, pendingStack]
        : draftStacks;
    setSelectedStacks(nextStacks);
    setSelectedDifficulty(draftDifficulty);
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    setSelectedStacks([]);
    setSelectedDifficulty("");
    setDraftStacks([]);
    setDraftStackInput("");
    setIsStackListOpen(false);
    setDraftDifficulty("");
    setIsFilterOpen(false);
  };

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const searchable = [
        project.name,
        project.repository,
        project.description,
        project.category,
        ...project.stacks,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (category === "All" || project.category === category) &&
        (!selectedStacks.length ||
          project.stacks.some((stack) =>
            selectedStacks.some(
              (selectedStack) =>
                stack.toLowerCase() === selectedStack.toLowerCase(),
            ),
          )) &&
        (!selectedDifficulty ||
          normalizeDifficulty(project.difficultyLevel) === selectedDifficulty)
      );
    });
  }, [category, projects, query, selectedDifficulty, selectedStacks]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        isFilterOpen &&
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target)
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isFilterOpen]);

  useEffect(() => {
    const measureDescriptions = () => {
      const overflow = {};
      filteredProjects.forEach((project) => {
        const projectKey = getProjectKey(project);
        const description = descriptionRefs.current[projectKey];
        if (description) {
          overflow[projectKey] = description.scrollHeight > 72;
        }
      });
      setDescriptionOverflow(overflow);
    };

    measureDescriptions();
    const resizeObserver = new ResizeObserver(measureDescriptions);
    filteredProjects.forEach((project) => {
      const description = descriptionRefs.current[getProjectKey(project)];
      if (description) resizeObserver.observe(description);
    });

    return () => resizeObserver.disconnect();
  }, [filteredProjects]);

  return (
    <div className="projects-page relative min-h-screen overflow-hidden bg-[#020808] font-montserrat text-richblack-25">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.16),transparent_68%)]" />
      <main className="relative mx-auto max-w-[1280px] px-5 pb-20 pt-24 sm:px-8 lg:px-12 lg:pt-28">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-emerald-300">
            GFG BVCOE community
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            GFG{" "}
            <em className="font-normal text-emerald-400">
              Open Source
            </em>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-richblack-100 sm:text-base">
            Open Source builds what the world dreams. Code without borders, grow
            without limits. Together, we make innovation bigger.
          </p>
        </header>

        <section className="relative z-40 mx-auto mt-12 max-w-[1210px] rounded-2xl border border-emerald-300/15 bg-[#07130f]/80 p-5 shadow-xl shadow-black/20 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-[520px]">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400/70"
                size={18}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects, tracks, or requirements..."
                className="h-12 w-full rounded-xl border border-white/10 bg-black/25 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-richblack-200 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
              />
            </label>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto">
              <Link
                to="/open-source/leaderboard"
                className="flex h-12 items-center justify-center rounded-xl border border-emerald-300/20 bg-white/[0.04] px-5 text-sm font-semibold text-richblack-25 transition hover:border-emerald-300/50 hover:bg-emerald-400/10 sm:min-w-[132px]"
              >
                Leaderboard
              </Link>
              {canUploadProjects(user) && (
                <Link
                  to="/open-source/upload"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-[#02140a] transition hover:bg-emerald-300 sm:min-w-[132px]"
                >
                  <Upload size={17} />
                  Upload
                </Link>
              )}
            </div>
          </div>
          <div className="mt-5 border-t border-white/[0.07] pt-5">
            <div ref={filterPanelRef} className="relative inline-block">
              <button
                type="button"
                onClick={openFilterPanel}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  hasActiveFilters
                    ? "border-emerald-300/60 bg-gradient-to-r from-emerald-400 to-lime-300 text-[#16231d] shadow-[0_0_18px_rgba(74,222,128,0.35)]"
                    : "border-white/[0.08] bg-[#10101a] text-[#a9a8bc] hover:border-emerald-300/40 hover:text-white"
                }`}
              >
                <SlidersHorizontal size={16} />
                Stack Filters
              </button>

              {isFilterOpen && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    aria-label="Close filters"
                    className="fixed inset-0 z-40 cursor-default bg-black/45 backdrop-blur-sm"
                  />
                  <div className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-32px)] w-[min(420px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[22px] border border-emerald-300/20 bg-[#171724] p-4 shadow-2xl shadow-black/50">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                        Stack Filters
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-[#fffaf0]">
                        Filter Projects
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      aria-label="Close filters"
                      className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] bg-[#10101a] text-[#a9a8bc] transition hover:border-emerald-300/50 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#a9a8bc]">
                        Tech Stack
                      </label>
                      <div className="relative flex gap-2">
                        <input
                          value={draftStackInput}
                          onChange={(event) =>
                            setDraftStackInput(event.target.value)
                          }
                          onFocus={() => setIsStackListOpen(true)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === ",") {
                              event.preventDefault();
                              addDraftStack();
                            }
                          }}
                          placeholder="Type a stack and press Enter"
                          className="h-11 min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-[#10101a] px-4 text-sm text-white outline-none transition placeholder:text-[#666579] focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
                        />
                        <button
                          type="button"
                          onClick={() => setIsStackListOpen((current) => !current)}
                          aria-label="Toggle stack list"
                          aria-expanded={isStackListOpen}
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-emerald-300/30 text-emerald-300 transition hover:bg-emerald-400/10"
                        >
                          <ChevronDown
                            size={17}
                            className={`transition-transform ${isStackListOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isStackListOpen && (
                          <div className="absolute inset-x-0 top-[calc(100%+8px)] z-10 overflow-hidden rounded-xl border border-emerald-300/20 bg-[#10101a] shadow-xl shadow-black/40">
                            <div className="max-h-44 overflow-y-auto overscroll-contain p-1.5 [scrollbar-color:rgba(110,231,183,0.5)_transparent] [scrollbar-width:thin]">
                              {stacks
                                .filter(
                                  (stack) =>
                                    !draftStacks.some(
                                      (selected) =>
                                        selected.toLowerCase() ===
                                        stack.toLowerCase(),
                                    ) &&
                                    stack
                                      .toLowerCase()
                                      .includes(draftStackInput.trim().toLowerCase()),
                                )
                                .map((stack) => (
                                  <button
                                    key={stack}
                                    type="button"
                                    onClick={() => selectDraftStack(stack)}
                                    className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-richblack-100 transition hover:bg-emerald-400/10 hover:text-emerald-200"
                                  >
                                    {stack}
                                  </button>
                                ))}
                              {stacks.filter(
                                (stack) =>
                                  !draftStacks.some(
                                    (selected) =>
                                      selected.toLowerCase() ===
                                      stack.toLowerCase(),
                                  ) &&
                                  stack
                                    .toLowerCase()
                                    .includes(
                                      draftStackInput.trim().toLowerCase(),
                                    ),
                              ).length === 0 && (
                                <p className="px-3 py-3 text-sm text-[#77768b]">
                                  No matching stacks
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {draftStacks.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {draftStacks.map((stack) => (
                            <button
                              key={stack}
                              type="button"
                              onClick={() => removeDraftStack(stack)}
                              className="flex items-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200 transition hover:border-red-300/50 hover:text-red-200"
                            >
                              {stack} <X size={13} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#a9a8bc]">
                        Difficulty Level
                      </label>
                      <select
                        value={draftDifficulty}
                        onChange={(event) => setDraftDifficulty(event.target.value)}
                        className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#10101a] px-4 text-sm text-white outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
                      >
                        <option value="">All levels</option>
                        {difficultyOptions.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="rounded-xl border border-white/[0.1] bg-transparent px-4 py-2 text-sm font-semibold text-[#d0ced8] transition hover:border-emerald-300/40 hover:text-white"
                    >
                      Reset Filters
                    </button>
                    <button
                      type="button"
                      onClick={applyFilters}
                      className="rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2 text-sm font-semibold text-[#16231d] transition hover:from-green-300 hover:to-emerald-200"
                    >
                      Apply Filters
                    </button>
                  </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto mt-9 flex max-w-[1210px] items-center gap-2 border-b border-emerald-300/15 pb-3">
          <button
            type="button"
            onClick={() =>
              categoryScrollerRef.current?.scrollBy({
                left: -220,
                behavior: "smooth",
              })
            }
            aria-label="Scroll categories left"
            title="Scroll categories left"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-richblack-100 transition hover:border-emerald-300/50 hover:text-emerald-300"
          >
            <ChevronLeft size={17} />
          </button>
          <nav
            ref={categoryScrollerRef}
            className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Project categories"
          >
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full border px-5 py-2.5 text-sm transition ${category === item ? "border-emerald-300/70 bg-emerald-400 font-semibold text-[#02140a]" : "border-white/10 bg-white/[0.03] text-richblack-100 hover:border-emerald-300/40 hover:text-white"}`}
              >
                {item}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={() =>
              categoryScrollerRef.current?.scrollBy({
                left: 220,
                behavior: "smooth",
              })
            }
            aria-label="Scroll categories right"
            title="Scroll categories right"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-richblack-100 transition hover:border-emerald-300/50 hover:text-emerald-300"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        <section
          className="mx-auto mt-7 grid max-w-[1210px] items-start gap-5 md:grid-cols-2 xl:grid-cols-3"
          aria-live="polite"
        >
          {loading && (
            <p className="col-span-full py-12 text-center text-richblack-100">
              Loading projects...
            </p>
          )}
          {!loading && loadError && (
            <p className="col-span-full py-12 text-center text-red-300">
              {loadError}
            </p>
          )}
          {!loading &&
            !loadError &&
            filteredProjects.map((project) => (
              <article
                key={getProjectKey(project)}
                className="group relative flex min-h-[390px] flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#07130f]/85 p-6 shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/50 hover:shadow-[0_18px_36px_rgba(16,185,129,0.12)]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
                {(project.difficultyLevel ||
                  (canDeleteOSProjects(user) && project._id)) && (
                  <div className="absolute right-5 top-5 flex items-center gap-2">
                    {project.difficultyLevel && (
                      <span className="rounded-full border border-emerald-300/50 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        {project.difficultyLevel}
                      </span>
                    )}
                    {canDeleteOSProjects(user) && project._id && (
                      <button
                        type="button"
                        onClick={() => setProjectToDelete(project)}
                        aria-label={`Delete ${project.name}`}
                        title="Delete project"
                        className="grid h-8 w-8 place-items-center rounded-full border border-red-400/30 bg-red-500/10 text-red-300 transition hover:border-red-300/60 hover:bg-red-500/20 hover:text-red-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                )}
                <div className="flex items-start gap-4 pr-24">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400/75">
                      Open source project
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                      {project.name}
                    </h2>
                    <span className="mt-3 inline-flex rounded-full border border-emerald-300/15 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-richblack-100">
                      {project.category}
                    </span>
                  </div>
                </div>
                <a
                  href={getRepositoryUrl(project.repository)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-emerald-100 transition hover:border-emerald-400/50 hover:bg-emerald-400/[0.07]"
                >
                  <Github size={16} className="shrink-0 text-emerald-400" />
                  <span className="truncate">{project.repository}</span>
                  <ExternalLink
                    size={13}
                    className="ml-auto shrink-0 text-richblack-100 transition group-hover:text-emerald-300"
                  />
                </a>
                <div
                  className={`relative mt-6 rounded-xl border border-emerald-300/[0.12] bg-black/15 p-4 pb-6 ${expandedDescriptions[getProjectKey(project)] ? "" : "h-[152px]"}`}
                >
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                    Project brief
                  </div>
                  <p
                    ref={(element) => {
                      descriptionRefs.current[getProjectKey(project)] = element;
                    }}
                    className={`[overflow-wrap:anywhere] border-l border-emerald-400/50 pl-4 text-[15px] leading-6 text-richblack-100 ${expandedDescriptions[getProjectKey(project)] ? "" : "max-h-[72px] overflow-hidden"}`}
                  >
                    {project.description}
                  </p>
                  {descriptionOverflow[getProjectKey(project)] && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedDescriptions((current) => ({
                          ...current,
                          [getProjectKey(project)]:
                            !current[getProjectKey(project)],
                        }))
                      }
                      className="mt-3 text-xs font-semibold text-emerald-300 transition hover:text-lime-200"
                    >
                      {expandedDescriptions[getProjectKey(project)]
                        ? "[Show Less]"
                        : " [Show More]"}
                    </button>
                  )}
                </div>
                <div className="mb-2 mt-5 flex flex-wrap gap-2">
                  {project.stacks.map((stack) => (
                    <span
                      key={stack}
                      className="rounded-md border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5 text-[11px] text-richblack-100"
                    >
                      {stack}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-white/[0.08] pt-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-richblack-100">
                      Project Maintainer
                    </p>
                    <p className="mt-1 text-sm text-richblack-25">
                      {project.maintainer}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {project.maintainerEmail && (
                        <button
                          type="button"
                          onClick={() => copyMaintainerEmail(project.maintainerEmail)}
                          aria-label={`Copy ${project.maintainer}'s email`}
                          title="Copy email"
                          className="text-richblack-100 transition hover:text-emerald-400"
                        >
                          <Mail size={15} />
                        </button>
                      )}
                      {project.maintainerLinkedIn && (
                        <a
                          href={project.maintainerLinkedIn}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${project.maintainer} on LinkedIn`}
                          title={`${project.maintainer} on LinkedIn`}
                          className="text-richblack-100 transition hover:text-emerald-400"
                        >
                          <Linkedin size={15} />
                        </a>
                      )}
                      {project.maintainerGithub && (
                        <a
                          href={project.maintainerGithub}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${project.maintainer} on GitHub`}
                          title={`${project.maintainer} on GitHub`}
                          className="text-richblack-100 transition hover:text-emerald-400"
                        >
                          <Github size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                  <a
                    href={getRepositoryUrl(`${project.repository}/issues`)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-[#02140a] transition hover:bg-emerald-300 hover:shadow-[0_0_18px_rgba(74,222,128,0.25)]"
                  >
                    <Github size={16} /> Repo Issues
                  </a>
                </div>
              </article>
            ))}
        </section>
        {!loading && !loadError && filteredProjects.length === 0 && (
          <div className="mx-auto mt-10 max-w-[1210px] rounded-2xl border border-dashed border-emerald-300/20 bg-white/[0.02] p-12 text-center text-richblack-100">
            No projects match these filters.
          </div>
        )}
        <p className="mt-10 flex items-center justify-center gap-1 text-center text-xs text-richblack-100">
          More specifications are being reviewed <ChevronRight size={14} />
        </p>
      </main>
      <ConfirmDeleteModal
        open={Boolean(projectToDelete)}
        title="Delete open source project?"
        description={`Delete “${projectToDelete?.name || "this project"}”? This action cannot be undone.`}
        confirmLabel="Delete project"
        loading={deletingProject}
        onClose={() => !deletingProject && setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
}

export default ProjectsPage;
