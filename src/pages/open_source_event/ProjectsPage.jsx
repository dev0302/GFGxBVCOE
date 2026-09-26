import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { deleteOSProject, getOSProjects } from "../../services/api";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { canAccessOpenSource } from "../../utils/openSourceAccess";
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
  Trash2,
  X,
} from "lucide-react";

const categories = [
  "All",
  "Web Development",
  "App Development",
  "AI & Machine Learning",
  "Blockchain & Web3",
  "Systems & Backend",
  "Cybersecurity",
  "Cloud, DevOps & Infrastructure",
  "Developer Tools",
];

export const canUploadProjects = (user) => {
  return canAccessOpenSource(user);
};

export const canDeleteOSProjects = (user) => {
  return canAccessOpenSource(user);
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

const normalizeDifficulty = (level) =>
  String(level || "").trim().toLowerCase();

const difficultyOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "capstone", label: "Capstone" },
  { value: "advanced", label: "Advanced" },
];

function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [descriptionOverflow, setDescriptionOverflow] = useState({});
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const descriptionRefs = useRef({});
  const categoryScrollerRef = useRef(null);

  // Filters live in the URL
  const selectedStacks = useMemo(() => {
    const raw = searchParams.get("stacks");
    return raw ? raw.split(",").filter(Boolean) : [];
  }, [searchParams]);

  const selectedDifficulty = searchParams.get("difficulty") || "";
  const hasActiveFilters = Boolean(selectedStacks.length || selectedDifficulty);

  // Navigate to the dedicated filter page, carrying current filter state
  const openFilterPage = () => {
    const params = new URLSearchParams();
    if (selectedStacks.length) params.set("stacks", selectedStacks.join(","));
    if (selectedDifficulty) params.set("difficulty", selectedDifficulty);
    const qs = params.toString();
    navigate(`/open-source/filter${qs ? `?${qs}` : ""}`);
  };

  const removeStack = (stackToRemove) => {
    const next = selectedStacks.filter(
      (s) => s.toLowerCase() !== stackToRemove.toLowerCase(),
    );
    const params = new URLSearchParams(searchParams);
    if (next.length) params.set("stacks", next.join(","));
    else params.delete("stacks");
    setSearchParams(params, { replace: true });
  };

  const clearDifficulty = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("difficulty");
    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("stacks");
    params.delete("difficulty");
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    let active = true;
    getOSProjects()
      .then((data) => { if (active) setProjects(data); })
      .catch((error) => { if (active) setLoadError(error.message || "Failed to load projects"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
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

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const searchable = [
        project.name, project.repository, project.description,
        project.category, ...project.stacks,
      ].join(" ").toLowerCase();
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (category === "All" || project.category === category) &&
        (!selectedStacks.length ||
          project.stacks.some((stack) =>
            selectedStacks.some((sel) => stack.toLowerCase() === sel.toLowerCase()),
          )) &&
        (!selectedDifficulty ||
          normalizeDifficulty(project.difficultyLevel) === selectedDifficulty)
      );
    });
  }, [category, projects, query, selectedDifficulty, selectedStacks]);

  useEffect(() => {
    const measureDescriptions = () => {
      const overflow = {};
      filteredProjects.forEach((project) => {
        const projectKey = getProjectKey(project);
        const el = descriptionRefs.current[projectKey];
        if (el) overflow[projectKey] = el.scrollHeight > 72;
      });
      setDescriptionOverflow(overflow);
    };
    measureDescriptions();
    const resizeObserver = new ResizeObserver(measureDescriptions);
    filteredProjects.forEach((project) => {
      const el = descriptionRefs.current[getProjectKey(project)];
      if (el) resizeObserver.observe(el);
    });
    return () => resizeObserver.disconnect();
  }, [filteredProjects]);

  return (
    <div className="projects-page relative min-h-screen overflow-hidden bg-[#020808] font-montserrat text-richblack-25">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.16),transparent_68%)]" />
      <main className="relative mx-auto max-w-[1280px] px-5 pb-20 pt-24 sm:px-8 lg:px-12 lg:pt-28">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-emerald-300">GFG BVCOE community</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            GFG <em className="font-normal text-emerald-400">Open Source</em>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-richblack-100 sm:text-base">
            Open Source builds what the world dreams. Code without borders, grow without limits. Together, we make innovation bigger.
          </p>
        </header>

        <section className="relative z-40 mx-auto mt-12 max-w-[1210px] rounded-2xl border border-emerald-300/15 bg-[#07130f]/80 p-5 shadow-xl shadow-black/20 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-[520px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400/70" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects, tracks, or requirements..."
                className="h-12 w-full rounded-xl border border-white/10 bg-black/25 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-richblack-200 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
              />
            </label>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto">
              <Link to="/open-source/leaderboard" className="flex h-12 items-center justify-center rounded-xl border border-emerald-300/20 bg-white/[0.04] px-5 text-sm font-semibold text-richblack-25 transition hover:border-emerald-300/50 hover:bg-emerald-400/10 sm:min-w-[132px]">
                Leaderboard
              </Link>
              {canUploadProjects(user) && (
                <Link to="/open-source/upload" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-[#02140a] transition hover:bg-emerald-300 sm:min-w-[132px]">
                  <Upload size={17} /> Upload
                </Link>
              )}
            </div>
          </div>
          <div className="mt-5 border-t border-white/[0.07] pt-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openFilterPage}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  hasActiveFilters
                    ? "border-emerald-300/60 bg-gradient-to-r from-emerald-400 to-lime-300 text-[#16231d] shadow-[0_0_18px_rgba(74,222,128,0.35)]"
                    : "border-white/[0.08] bg-[#10101a] text-[#a9a8bc] hover:border-emerald-300/40 hover:text-white"
                }`}
              >
                <SlidersHorizontal size={16} />
                Stack Filters
                {hasActiveFilters && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#16231d]/40 text-[10px] font-bold">
                    {selectedStacks.length + (selectedDifficulty ? 1 : 0)}
                  </span>
                )}
              </button>
              {selectedStacks.map((stack) => (
                <button key={stack} type="button" onClick={() => removeStack(stack)}
                  className="flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:border-red-300/40 hover:bg-red-400/10 hover:text-red-200">
                  {stack} <X size={12} />
                </button>
              ))}
              {selectedDifficulty && (
                <button type="button" onClick={clearDifficulty}
                  className="flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200 transition hover:border-red-300/40 hover:bg-red-400/10 hover:text-red-200">
                  {difficultyOptions.find((d) => d.value === selectedDifficulty)?.label ?? selectedDifficulty}
                  <X size={12} />
                </button>
              )}
              {hasActiveFilters && (
                <button type="button" onClick={resetFilters}
                  className="text-xs text-richblack-200 underline-offset-2 transition hover:text-red-300 hover:underline">
                  Clear all
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto mt-9 flex max-w-[1210px] items-center gap-2 border-b border-emerald-300/15 pb-3">
          <button type="button" onClick={() => categoryScrollerRef.current?.scrollBy({ left: -220, behavior: "smooth" })}
            aria-label="Scroll categories left"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-richblack-100 transition hover:border-emerald-300/50 hover:text-emerald-300">
            <ChevronLeft size={17} />
          </button>
          <nav ref={categoryScrollerRef} className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Project categories">
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full border px-5 py-2.5 text-sm transition ${category === item ? "border-emerald-300/70 bg-emerald-400 font-semibold text-[#02140a]" : "border-white/10 bg-white/[0.03] text-richblack-100 hover:border-emerald-300/40 hover:text-white"}`}>
                {item}
              </button>
            ))}
          </nav>
          <button type="button" onClick={() => categoryScrollerRef.current?.scrollBy({ left: 220, behavior: "smooth" })}
            aria-label="Scroll categories right"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-richblack-100 transition hover:border-emerald-300/50 hover:text-emerald-300">
            <ChevronRight size={17} />
          </button>
        </div>

        <section className="mx-auto mt-7 grid max-w-[1210px] items-start gap-5 md:grid-cols-2 xl:grid-cols-3" aria-live="polite">
          {loading && <p className="col-span-full py-12 text-center text-richblack-100">Loading projects...</p>}
          {!loading && loadError && <p className="col-span-full py-12 text-center text-red-300">{loadError}</p>}
          {!loading && !loadError && filteredProjects.map((project) => (
            <article key={getProjectKey(project)}
              className="group relative flex min-h-[390px] flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#07130f]/85 p-6 shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/50 hover:shadow-[0_18px_36px_rgba(16,185,129,0.12)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
              {(project.difficultyLevel || (canDeleteOSProjects(user) && project._id)) && (
                <div className="absolute right-5 top-5 flex items-center gap-2">
                  {project.difficultyLevel && (
                    <span className="rounded-full border border-emerald-300/50 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      {project.difficultyLevel}
                    </span>
                  )}
                  {canDeleteOSProjects(user) && project._id && (
                    <button type="button" onClick={() => setProjectToDelete(project)}
                      aria-label={`Delete ${project.name}`} title="Delete project"
                      className="grid h-8 w-8 place-items-center rounded-full border border-red-400/30 bg-red-500/10 text-red-300 transition hover:border-red-300/60 hover:bg-red-500/20 hover:text-red-100">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-start gap-4 pr-24">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400/75">Open source project</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">{project.name}</h2>
                  <span className="mt-3 inline-flex rounded-full border border-emerald-300/15 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-richblack-100">
                    {project.category}
                  </span>
                </div>
              </div>
              <a href={getRepositoryUrl(project.repository)} target="_blank" rel="noreferrer"
                className="mt-6 flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-emerald-100 transition hover:border-emerald-400/50 hover:bg-emerald-400/[0.07]">
                <Github size={16} className="shrink-0 text-emerald-400" />
                <span className="truncate">{project.repository}</span>
                <ExternalLink size={13} className="ml-auto shrink-0 text-richblack-100 transition group-hover:text-emerald-300" />
              </a>
              <div className={`relative mt-6 rounded-xl border border-emerald-300/[0.12] bg-black/15 p-4 pb-6 ${expandedDescriptions[getProjectKey(project)] ? "" : "h-[152px]"}`}>
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                  Project brief
                </div>
                <p ref={(element) => { descriptionRefs.current[getProjectKey(project)] = element; }}
                  className={`[overflow-wrap:anywhere] border-l border-emerald-400/50 pl-4 text-[15px] leading-6 text-richblack-100 ${expandedDescriptions[getProjectKey(project)] ? "" : "max-h-[72px] overflow-hidden"}`}>
                  {project.description}
                </p>
                {descriptionOverflow[getProjectKey(project)] && (
                  <button type="button"
                    onClick={() => setExpandedDescriptions((current) => ({ ...current, [getProjectKey(project)]: !current[getProjectKey(project)] }))}
                    className="mt-3 text-xs font-semibold text-emerald-300 transition hover:text-lime-200">
                    {expandedDescriptions[getProjectKey(project)] ? "[Show Less]" : "[Show More]"}
                  </button>
                )}
              </div>
              <div className="mb-2 mt-5 flex flex-wrap gap-2">
                {project.stacks.map((stack) => (
                  <span key={stack} className="rounded-md border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5 text-[11px] text-richblack-100">
                    {stack}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-white/[0.08] pt-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-richblack-100">Project Maintainer</p>
                  <p className="mt-1 text-sm text-richblack-25">{project.maintainer}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {project.maintainerEmail && (
                      <button type="button" onClick={() => copyMaintainerEmail(project.maintainerEmail)}
                        aria-label={`Copy ${project.maintainer}'s email`} title="Copy email"
                        className="text-richblack-100 transition hover:text-emerald-400">
                        <Mail size={15} />
                      </button>
                    )}
                    {project.maintainerLinkedIn && (
                      <a href={project.maintainerLinkedIn} target="_blank" rel="noreferrer"
                        aria-label={`${project.maintainer} on LinkedIn`} title={`${project.maintainer} on LinkedIn`}
                        className="text-richblack-100 transition hover:text-emerald-400">
                        <Linkedin size={15} />
                      </a>
                    )}
                    {project.maintainerGithub && (
                      <a href={project.maintainerGithub} target="_blank" rel="noreferrer"
                        aria-label={`${project.maintainer} on GitHub`} title={`${project.maintainer} on GitHub`}
                        className="text-richblack-100 transition hover:text-emerald-400">
                        <Github size={15} />
                      </a>
                    )}
                  </div>
                </div>
                <a href={getRepositoryUrl(`${project.repository}/issues`)} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-[#02140a] transition hover:bg-emerald-300 hover:shadow-[0_0_18px_rgba(74,222,128,0.25)]">
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
        description={`Delete "${projectToDelete?.name || "this project"}"? This action cannot be undone.`}
        confirmLabel="Delete project"
        loading={deletingProject}
        onClose={() => !deletingProject && setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
}

export default ProjectsPage;
