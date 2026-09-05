import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { getOSGithubOAuthUrl, getOSProjects } from "../../services/api";
import {
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Github,
  Linkedin,
  LoaderCircle,
  Mail,
  Upload,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

const categories = [
  "All",
  "Core Engine",
  "Backend Services",
  "DevTools & MCP",
  "UI Components",
  "Documentation",
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

const OS_CONTRIBUTOR_STORAGE_KEY = "gfg_open_source_contributor";

function ProjectsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedStack, setSelectedStack] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [descriptionOverflow, setDescriptionOverflow] = useState({});
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [connectedContributor, setConnectedContributor] = useState(() => {
    try {
      const storedContributor = JSON.parse(
        localStorage.getItem(OS_CONTRIBUTOR_STORAGE_KEY) || "null",
      );
      return storedContributor?.github_name ? storedContributor : null;
    } catch {
      return null;
    }
  });
  const [githubConnecting, setGithubConnecting] = useState(false);
  const [githubError, setGithubError] = useState("");
  const githubPopupRef = useRef(null);
  const descriptionRefs = useRef({});

  const handleGithubConnect = (event) => {
    event.preventDefault();
    setGithubError("");
    setGithubConnecting(true);
    githubPopupRef.current = window.open(
      getOSGithubOAuthUrl(),
      "gfg-github-login",
      "width=560,height=720,menubar=no,toolbar=no,location=yes,resizable=yes",
    );
    if (!githubPopupRef.current) {
      setGithubConnecting(false);
      setGithubError("Please allow popups to connect GitHub.");
    }
  };

  useEffect(() => {
    const handleGithubMessage = (event) => {
      const apiOrigin = new URL(
        import.meta.env.VITE_API_BASE_URL || window.location.origin,
        window.location.origin,
      ).origin;
      if (
        event.source !== githubPopupRef.current ||
        ![window.location.origin, apiOrigin].includes(event.origin) ||
        event.data?.type !== "GFG_GITHUB_RESULT"
      )
        return;

      githubPopupRef.current = null;
      setGithubConnecting(false);
      if (event.data.success) {
        const contributor = {
          github_name: event.data.github_name,
          github_profile_url: event.data.github_profile_url,
          total_contributions: event.data.total_contributions,
          points: event.data.points,
        };
        setConnectedContributor(contributor);
        localStorage.setItem(
          OS_CONTRIBUTOR_STORAGE_KEY,
          JSON.stringify(contributor),
        );
        setGithubModalOpen(false);
        toast.success(`Connected GitHub: @${event.data.github_name}`);
      } else {
        setGithubError(event.data.message || "Unable to connect GitHub");
      }
    };

    window.addEventListener("message", handleGithubMessage);
    return () => window.removeEventListener("message", handleGithubMessage);
  }, []);

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

  const stacks = [
    ...new Set(projects.flatMap((project) => project.stacks)),
    "Python",
  ];
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
        (!selectedStack || project.stacks.includes(selectedStack))
      );
    });
  }, [category, projects, query, selectedStack]);

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
              <button
                type="button"
                disabled={Boolean(connectedContributor?.github_name)}
                onClick={() => {
                  if (connectedContributor?.github_name) return;
                  setGithubError("");
                  setGithubModalOpen(true);
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-[#10291f] px-5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/60 hover:bg-[#153b28] disabled:cursor-default disabled:opacity-100 sm:min-w-[170px]"
              >
                <Github size={17} />
                {connectedContributor?.github_name
                  ? "Connected"
                  : "Connect GitHub"}
              </button>
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
            <span className="mr-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#77768b]">
              <SlidersHorizontal size={14} /> Stack filters
            </span>
            {stacks.map((stack) => (
              <button
                key={stack}
                onClick={() =>
                  setSelectedStack(selectedStack === stack ? "" : stack)
                }
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${selectedStack === stack ? "border-emerald-300/60 bg-gradient-to-r from-emerald-400 to-lime-300 text-[#16231d]" : "border-white/[0.08] bg-[#10101a] text-[#a9a8bc] hover:border-white/20 hover:text-white"}`}
              >
                {stack}
              </button>
            ))}
          </div>
        </section>

        <nav
          className="mx-auto mt-9 flex max-w-[1210px] gap-2 overflow-x-auto border-b border-white/[0.1] pb-3"
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
      {githubModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setGithubModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-github-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1b1b2a] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/80">
                  Open source profile
                </p>
                <h2
                  id="connect-github-title"
                  className="mt-2 text-2xl font-semibold text-[#fffaf0]"
                >
                  Connect GitHub
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setGithubModalOpen(false)}
                aria-label="Close GitHub connection dialog"
                className="text-[#77768b] transition hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#a9a8bc]">
              Sign in with GitHub to connect your username with the open-source
              program. This does not change your GFG website login.
            </p>
            <form onSubmit={handleGithubConnect} className="mt-6">
              <button
                type="submit"
                disabled={githubConnecting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#16161f] transition hover:bg-[#e8f8ed] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {githubConnecting && (
                  <LoaderCircle size={17} className="animate-spin" />
                )}
                <Github size={17} />
                {githubConnecting
                  ? "Waiting for GitHub..."
                  : "Continue with GitHub"}
              </button>
            </form>
            {githubError && (
              <p className="mt-3 text-sm text-red-300">{githubError}</p>
            )}
            {connectedContributor && (
              <div className="mt-5 rounded-xl border border-emerald-300/20 bg-[#10291f] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                  <CheckCircle2 size={17} /> @{connectedContributor.github_name}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-[#77768b]">Points</p>
                    <p className="mt-1 font-semibold text-white">
                      {connectedContributor.points}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#77768b]">Beginner</p>
                    <p className="mt-1 font-semibold text-white">
                      {connectedContributor.total_contributions?.beginner || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#77768b]">Intermediate</p>
                    <p className="mt-1 font-semibold text-white">
                      {connectedContributor.total_contributions?.intermediate ||
                        0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#77768b]">Advanced</p>
                    <p className="mt-1 font-semibold text-white">
                      {connectedContributor.total_contributions?.advanced || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;
