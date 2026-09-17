import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { getOSProjects } from "../../services/api";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Upload,
  Search,
  SlidersHorizontal,
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

const copyAdminEmail = async (email) => {
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

const difficultyDisplayMap = {
  beginner: "easy",
  intermediate: "medium",
  advanced: "high",
};

const normalizeDifficulty = (level) => {
  const raw = String(level || "").trim().toLowerCase();
  return difficultyDisplayMap[raw] || raw;
};

function ProjectsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedStack, setSelectedStack] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [draftStack, setDraftStack] = useState("");
  const [draftDifficulty, setDraftDifficulty] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [descriptionOverflow, setDescriptionOverflow] = useState({});
  const descriptionRefs = useRef({});
  const categoryScrollerRef = useRef(null);

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

  const stacks = useMemo(
    () => [...new Set(projects.flatMap((project) => project.stacks || []))],
    [projects],
  );

  const difficulties = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return Array.from(
      new Set(
        projects
          .map((project) => normalizeDifficulty(project.difficultyLevel))
          .filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right));
  }, [projects]);

  const difficultyOptions = useMemo(() => {
    const levels =
      Array.isArray(difficulties) && difficulties.length
        ? difficulties
        : ["easy", "medium", "high"];

    const difficultyOrder = {
      easy: 1,
      medium: 2,
      high: 3,
    };

    return Array.from(
      new Set(
        levels
          .map((level) => String(level).trim().toLowerCase())
          .filter(Boolean),
      ),
    )
      .map((level) => ({
        value: level,
        label: level[0].toUpperCase() + level.slice(1),
      }))
      .sort(
        (left, right) =>
          (difficultyOrder[left.value] || 999) -
          (difficultyOrder[right.value] || 999),
      );
  }, [difficulties]);
  const hasActiveFilters = Boolean(selectedStack || selectedDifficulty);

  const openFilterPanel = () => {
    setDraftStack(selectedStack);
    setDraftDifficulty(selectedDifficulty);
    setIsFilterOpen(true);
  };

  const applyFilters = () => {
    setSelectedStack(draftStack);
    setSelectedDifficulty(draftDifficulty);
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    setSelectedStack("");
    setSelectedDifficulty("");
    setDraftStack("");
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
        (!selectedStack ||
          project.stacks.some(
            (stack) => stack.toLowerCase() === selectedStack.toLowerCase(),
          )) &&
        (!selectedDifficulty ||
          normalizeDifficulty(project.difficultyLevel) === selectedDifficulty)
      );
    });
  }, [category, projects, query, selectedStack, selectedDifficulty]);

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
    <div className="projects-page min-h-screen bg-[#242435] text-[#f8f4e9]">
      <main className="relative mx-auto max-w-[1440px] px-5 pb-20 pt-16 sm:px-8 lg:px-12 lg:pt-24">
        <header className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl mt-10 font-semibold tracking-[-0.04em] text-[#fffaf0] sm:text-5xl lg:text-6xl">
            GFG{" "}
            <em className="bg-gradient-to-r from-emerald-400 via-green-300 to-lime-300 bg-clip-text font-serif font-normal text-transparent">
              Open Source
            </em>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#a9a8bc] sm:text-base">
            Open Source builds what the world dreams. Code without borders, grow
            without limits. Together, we make innovation bigger.
          </p>
        </header>

        <section className="mx-auto mt-14 max-w-[1210px] rounded-[26px] border border-white/[0.1] bg-[#1b1b2a]/80 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-[520px]">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8f8da4]"
                size={18}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects, tracks, or requirements..."
                className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#10101a] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-[#666579] focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
              />
            </label>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto">
              <Link
                to="/open-source/leaderboard"
                className="flex h-12 items-center justify-center rounded-xl border border-white/[0.1] bg-[#10101a] px-5 text-sm font-semibold text-[#d0ced8] transition hover:border-emerald-300/40 hover:text-white sm:min-w-[132px]"
              >
                Leaderboard
              </Link>
              {canUploadProjects(user) && (
                <Link
                  to="/open-source/upload"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-5 text-sm font-semibold text-[#16231d] transition hover:from-green-300 hover:to-emerald-200 sm:min-w-[132px]"
                >
                  <Upload size={17} />
                  Upload
                </Link>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-5">
            <div className="relative">
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
                <div className="absolute left-0 top-[calc(100%+12px)] z-30 w-[min(420px,calc(100vw-40px))] rounded-[22px] border border-emerald-300/20 bg-[#171724] p-4 shadow-2xl shadow-black/50">
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
                      <input
                        list="os-project-stacks"
                        value={draftStack}
                        onChange={(event) => setDraftStack(event.target.value)}
                        placeholder="Type or select a stack"
                        className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#10101a] px-4 text-sm text-white outline-none transition placeholder:text-[#666579] focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
                      />
                      <datalist id="os-project-stacks">
                        {stacks.map((stack) => (
                          <option key={stack} value={stack} />
                        ))}
                      </datalist>
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
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto mt-9 flex max-w-[1210px] items-center gap-2 border-b border-white/[0.1] pb-3">
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
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/[0.1] bg-[#1b1b2a] text-[#a9a8bc] transition hover:border-emerald-300/50 hover:text-white"
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
                className={`shrink-0 rounded-full border px-5 py-2.5 text-sm transition ${category === item ? "border-[#f8e7b6] bg-[#f8e7b6] font-semibold text-[#242435]" : "border-white/[0.1] bg-[#1b1b2a]/60 text-[#a9a8bc] hover:border-white/25 hover:text-white"}`}
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
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/[0.1] bg-[#1b1b2a] text-[#a9a8bc] transition hover:border-emerald-300/50 hover:text-white"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        <section
          className="mx-auto mt-7 grid max-w-[1210px] items-start gap-5 md:grid-cols-2 xl:grid-cols-3"
          aria-live="polite"
        >
          {loading && (
            <p className="col-span-full py-12 text-center text-[#a9a8bc]">
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
                className="group relative flex min-h-[390px] flex-col overflow-hidden rounded-[24px] border border-white/[0.1] bg-[#191925] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-[#1d1d2c] hover:shadow-[0_20px_48px_rgba(17,185,91,0.14)]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
                {project.difficultyLevel && (
                  <span className="absolute right-5 top-5 rounded-full border border-emerald-300/60 bg-[#10291f] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 shadow-[0_0_16px_rgba(74,222,128,0.45)]">
                    {project.difficultyLevel}
                  </span>
                )}
                <div className="flex items-start gap-4 pr-24">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400/75">
                      Open source project
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#fffaf0]">
                      {project.name}
                    </h2>
                    <span className="mt-3 inline-flex rounded-full border border-white/[0.1] bg-[#12121c] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#b8b6c7]">
                      {project.category}
                    </span>
                  </div>
                </div>
                <a
                  href={getRepositoryUrl(project.repository)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#12121c] px-3 py-2.5 text-sm text-[#c8f7d5] transition hover:border-emerald-400/40 hover:bg-[#15241d]"
                >
                  <Github size={16} className="shrink-0 text-emerald-400" />
                  <span className="truncate">{project.repository}</span>
                  <ExternalLink
                    size={13}
                    className="ml-auto shrink-0 text-[#77768b] transition group-hover:text-emerald-300"
                  />
                </a>
                <div
                  className={`relative mt-6 rounded-xl border border-emerald-300/[0.12] bg-gradient-to-br from-[#151f1d] via-[#121a1b] to-[#12121c] p-4 pb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${expandedDescriptions[getProjectKey(project)] ? "" : "h-[152px]"}`}
                >
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                    Project brief
                  </div>
                  <p
                    ref={(element) => {
                      descriptionRefs.current[getProjectKey(project)] = element;
                    }}
                    className={`[overflow-wrap:anywhere] border-l border-emerald-400/50 pl-4 text-[15px] leading-6 text-[#d0ced8] ${expandedDescriptions[getProjectKey(project)] ? "" : "max-h-[72px] overflow-hidden"}`}
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
                      className="rounded-md border border-white/[0.07] bg-[#12121c] px-2.5 py-1.5 text-[11px] text-[#aaa8b9]"
                    >
                      {stack}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-white/[0.08] pt-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#77768b]">
                      Project admin
                    </p>
                    <p className="mt-1 text-sm text-[#e5e0d3]">
                      {project.admin}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {project.adminEmail && (
                        <button
                          type="button"
                          onClick={() => copyAdminEmail(project.adminEmail)}
                          aria-label={`Copy ${project.admin}'s email`}
                          title="Copy email"
                          className="text-[#77768b] transition hover:text-emerald-400"
                        >
                          <Mail size={15} />
                        </button>
                      )}
                      {project.adminLinkedIn && (
                        <a
                          href={project.adminLinkedIn}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${project.admin} on LinkedIn`}
                          title={`${project.admin} on LinkedIn`}
                          className="text-[#77768b] transition hover:text-emerald-400"
                        >
                          <Linkedin size={15} />
                        </a>
                      )}
                      {project.adminGithub && (
                        <a
                          href={project.adminGithub}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${project.admin} on GitHub`}
                          title={`${project.admin} on GitHub`}
                          className="text-[#77768b] transition hover:text-emerald-400"
                        >
                          <Github size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                  <a
                    href={getRepositoryUrl(project.repository)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-400 to-lime-300 px-3 py-2 text-sm font-semibold text-[#16231d] transition hover:from-green-300 hover:to-emerald-200 hover:shadow-[0_0_18px_rgba(74,222,128,0.35)]"
                  >
                    <Github size={16} /> Github Repo
                  </a>
                </div>
              </article>
            ))}
        </section>
        {!loading && !loadError && filteredProjects.length === 0 && (
          <div className="mx-auto mt-10 max-w-[1210px] rounded-2xl border border-dashed border-white/15 p-12 text-center text-[#a9a8bc]">
            No projects match these filters.
          </div>
        )}
        <p className="mt-10 flex items-center justify-center gap-1 text-center text-xs text-[#77768b]">
          More specifications are being reviewed <ChevronRight size={14} />
        </p>
      </main>
    </div>
  );
}

export default ProjectsPage;
