import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { getOSProjects } from "../../services/api";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Layers,
  FileText,
  User,
  GitPullRequest,
  AlertCircle,
  Copy,
  Check,
  Code2,
  Sparkles,
} from "lucide-react";

export const getRepositoryUrl = (repository) => {
  const value = String(repository || "").trim();
  if (/^https?:\/\//i.test(value)) return value;
  return `https://github.com/${value.replace(/^((www\.)?github\.com)\//i, "")}`;
};

const getDifficultyBadge = (level) => {
  const normalized = String(level || "").trim().toLowerCase();
  switch (normalized) {
    case "beginner":
      return {
        label: "Beginner",
        style: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
      };
    case "intermediate":
      return {
        label: "Intermediate",
        style: "border-sky-400/40 bg-sky-500/10 text-sky-300",
      };
    case "advanced":
      return {
        label: "Advanced",
        style: "border-amber-400/40 bg-amber-500/10 text-amber-300",
      };
    case "capstone":
      return {
        label: "Capstone",
        style: "border-purple-400/40 bg-purple-500/10 text-purple-300",
      };
    default:
      return {
        label: level || "All Levels",
        style: "border-emerald-300/30 bg-white/[0.04] text-richblack-100",
      };
  }
};

const getMaintainerPhotoUrl = (project) => {
  if (project?.maintainerPhoto) return project.maintainerPhoto;
  if (project?.maintainerAvatar) return project.maintainerAvatar;
  if (project?.photo) return project.photo;

  const github = String(project?.maintainerGithub || "").trim();
  if (github) {
    const username = github
      .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
      .replace(/\/.*$/, "")
      .replace(/^@/, "")
      .trim();
    if (username) {
      return `https://github.com/${username}.png?size=200`;
    }
  }

  return "";
};

function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [project, setProject] = useState(state?.project || null);
  const [loading, setLoading] = useState(!state?.project);
  const [error, setError] = useState("");
  const [copiedClone, setCopiedClone] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (project) return;
    let active = true;
    setLoading(true);

    getOSProjects()
      .then((projects) => {
        if (!active) return;
        const decodedId = decodeURIComponent(id || "").toLowerCase();
        const found = (projects || []).find(
          (p) =>
            p._id === id ||
            String(p.name || "").toLowerCase() === decodedId ||
            String(p.repository || "").toLowerCase() === decodedId,
        );

        if (found) {
          setProject(found);
        } else {
          setError("Project could not be found.");
        }
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load project details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, project]);

  const copyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Maintainer email copied to clipboard!");
    } catch {
      toast.error("Unable to copy email.");
    }
  };

  const copyCloneUrl = async () => {
    if (!project?.repository) return;
    const url = getRepositoryUrl(project.repository);
    const gitCloneCmd = `git clone ${url}.git`;
    try {
      await navigator.clipboard.writeText(gitCloneCmd);
      setCopiedClone(true);
      toast.success("Git clone command copied to clipboard!");
      setTimeout(() => setCopiedClone(false), 2500);
    } catch {
      toast.error("Failed to copy clone command.");
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#020808] font-montserrat text-richblack-25">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.16),transparent_68%)]" />
        <div className="relative mx-auto max-w-5xl px-5 py-24 sm:px-8">
          <div className="h-6 w-32 animate-pulse rounded-lg bg-white/10" />
          <div className="mt-8 space-y-4">
            <div className="h-12 w-3/4 animate-pulse rounded-xl bg-white/10" />
            <div className="h-6 w-1/3 animate-pulse rounded-lg bg-white/10" />
            <div className="mt-10 h-72 animate-pulse rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#020808] font-montserrat text-richblack-25">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.16),transparent_68%)]" />
        <div className="relative mx-auto flex max-w-xl flex-col items-center px-5 py-32 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
            <AlertCircle size={32} />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white">Project Not Found</h1>
          <p className="mt-2 text-sm text-richblack-100">
            {error || "The project you are looking for does not exist or may have been removed."}
          </p>
          <Link
            to="/open-source"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-[#02140a] transition hover:bg-emerald-300"
          >
            <ArrowLeft size={16} /> Back to Open Source
          </Link>
        </div>
      </div>
    );
  }

  const difficulty = getDifficultyBadge(project.difficultyLevel);
  const repoUrl = getRepositoryUrl(project.repository);
  const maintainerPhoto = getMaintainerPhotoUrl(project);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020808] font-montserrat text-richblack-25">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.18),transparent_68%)]" />

      <main className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 sm:px-8 lg:px-12 lg:pt-24">
        {/* Breadcrumb / Back button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/open-source")}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-richblack-100 backdrop-blur transition hover:border-emerald-300/40 hover:bg-emerald-400/10 hover:text-white"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Back to Projects
          </button>

          <div className="flex items-center gap-2 text-xs text-richblack-200">
            <Link to="/open-source" className="hover:text-emerald-300">
              Open Source
            </Link>
            <span>/</span>
            <span className="max-w-[200px] truncate text-emerald-400">{project.name}</span>
          </div>
        </div>

        {/* Hero Section */}
        <header className="mt-8 rounded-3xl border border-emerald-300/15 bg-gradient-to-b from-[#07130f]/90 to-[#040c0a]/90 p-6 shadow-2xl backdrop-blur sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  <Sparkles size={13} className="text-emerald-400" />
                  {project.category}
                </span>

                {project.difficultyLevel && (
                  <span
                    className={`rounded-full border px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider ${difficulty.style}`}
                  >
                    {difficulty.label}
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {project.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-black/40 px-3.5 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-400 hover:text-white"
                >
                  <Github size={15} className="text-emerald-400" />
                  <span className="font-mono">{project.repository}</span>
                  <ExternalLink size={12} className="text-richblack-200" />
                </a>

                <button
                  type="button"
                  onClick={copyCloneUrl}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-richblack-100 transition hover:border-emerald-300/40 hover:text-emerald-200"
                  title="Copy git clone command"
                >
                  {copiedClone ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span>Copied git clone</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Clone command</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Link Buttons */}
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:border-emerald-400/50 hover:bg-emerald-400/10"
              >
                <Github size={17} /> View Code
              </a>
              <a
                href={getRepositoryUrl(`${project.repository}/issues`)}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-[#02140a] transition hover:bg-emerald-300 hover:shadow-[0_0_20px_rgba(74,222,128,0.3)]"
              >
                <AlertCircle size={16} /> Browse Issues
              </a>
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Main Column (2 spans) */}
          <div className="space-y-8 lg:col-span-2">
            {/* Description & Overview */}
            <section className="rounded-2xl border border-white/[0.09] bg-[#07130f]/85 p-6 shadow-xl backdrop-blur sm:p-8">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/80">
                <FileText size={16} className="text-emerald-400" />
                Project Description & Scope
              </div>
              <div className="border-l-2 border-emerald-400/50 pl-5 pt-1">
                <p className="whitespace-pre-line text-base leading-relaxed text-richblack-100 sm:text-lg">
                  {project.description}
                </p>
              </div>
            </section>

            {/* Full Tech Stack */}
            <section className="rounded-2xl border border-white/[0.09] bg-[#07130f]/85 p-6 shadow-xl backdrop-blur sm:p-8">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/80">
                  <Layers size={16} className="text-emerald-400" />
                  Tech Stack & Dependencies
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                  {project.stacks?.length || 0} Technologies
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {(project.stacks || []).map((stack) => (
                  <span
                    key={stack}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-black/40 px-3.5 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-400 hover:bg-emerald-400/10 hover:text-white"
                  >
                    <Code2 size={13} className="text-emerald-400" />
                    {stack}
                  </span>
                ))}
              </div>

              <p className="mt-5 text-xs text-richblack-200">
                Contributors will work primarily with these languages, frameworks, and runtime environments.
              </p>
            </section>

            {/* Contribution Workflow Guide */}
            <section className="rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-emerald-950/20 to-black/30 p-6 shadow-xl backdrop-blur sm:p-8">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/80">
                <GitPullRequest size={16} className="text-emerald-400" />
                How to Contribute
              </div>
              <ol className="mt-4 space-y-3 text-sm text-richblack-100">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-bold text-emerald-300">
                    1
                  </span>
                  <span>
                    Fork the repository on GitHub and clone your fork to your local environment.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-bold text-emerald-300">
                    2
                  </span>
                  <span>
                    Explore open issues or propose an enhancement by creating a new issue first.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-bold text-emerald-300">
                    3
                  </span>
                  <span>
                    Create a feature branch, make your commits cleanly, and open a Pull Request
                    linking to the issue.
                  </span>
                </li>
              </ol>
            </section>
          </div>

          {/* Sidebar Column (1 span) */}
          <div className="space-y-6">
            {/* Maintainer Info Card */}
            <div className="rounded-2xl border border-white/[0.09] bg-[#07130f]/85 p-6 shadow-xl backdrop-blur">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/80">
                <User size={15} className="text-emerald-400" />
                Project Maintainer
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="relative h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-tr from-emerald-400 via-emerald-300 to-lime-400 p-[1.5px] shadow-[0_0_15px_rgba(74,222,128,0.25)]">
                  <div className="grid h-full w-full place-items-center overflow-hidden rounded-[14px] bg-[#07130f]">
                    {maintainerPhoto && !photoError ? (
                      <img
                        src={maintainerPhoto}
                        alt={project.maintainer || "Project Maintainer"}
                        className="h-full w-full object-cover"
                        onError={() => setPhotoError(true)}
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xl font-bold text-emerald-300">
                        {project.maintainer?.charAt(0)?.toUpperCase() || "M"}
                      </span>
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#07130f] bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white">{project.maintainer}</p>
                  <p className="text-xs text-emerald-400/80">Project Lead & Reviewer</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                {project.maintainerEmail && (
                  <button
                    type="button"
                    onClick={() => copyEmail(project.maintainerEmail)}
                    className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/25 px-4 py-2.5 text-xs text-richblack-100 transition hover:border-emerald-400/50 hover:text-white"
                  >
                    <span className="flex items-center gap-2.5">
                      <Mail size={15} className="text-emerald-400" />
                      <span className="max-w-[170px] truncate">{project.maintainerEmail}</span>
                    </span>
                    <Copy size={13} className="text-richblack-200" />
                  </button>
                )}

                {project.maintainerLinkedIn && (
                  <a
                    href={project.maintainerLinkedIn}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/25 px-4 py-2.5 text-xs text-richblack-100 transition hover:border-emerald-400/50 hover:text-white"
                  >
                    <span className="flex items-center gap-2.5">
                      <Linkedin size={15} className="text-sky-400" />
                      LinkedIn Profile
                    </span>
                    <ExternalLink size={13} className="text-richblack-200" />
                  </a>
                )}

                {project.maintainerGithub && (
                  <a
                    href={project.maintainerGithub}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/25 px-4 py-2.5 text-xs text-richblack-100 transition hover:border-emerald-400/50 hover:text-white"
                  >
                    <span className="flex items-center gap-2.5">
                      <Github size={15} className="text-emerald-400" />
                      GitHub Profile
                    </span>
                    <ExternalLink size={13} className="text-richblack-200" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Metadata Card */}
            <div className="rounded-2xl border border-white/[0.09] bg-[#07130f]/85 p-6 shadow-xl backdrop-blur">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/80">
                Quick Summary
              </h3>

              <div className="mt-4 divide-y divide-white/[0.06] text-xs">
                <div className="flex justify-between py-2.5">
                  <span className="text-richblack-200">Category</span>
                  <span className="font-semibold text-white">{project.category}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-richblack-200">Difficulty</span>
                  <span className="font-semibold text-emerald-300">
                    {difficulty.label}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-richblack-200">Tech Stacks</span>
                  <span className="font-semibold text-white">
                    {project.stacks?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-richblack-200">Repository</span>
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-[140px] truncate text-emerald-400 underline hover:text-emerald-300"
                  >
                    {project.repository}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProjectDetailPage;

