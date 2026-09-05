import { useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { canUploadProjects } from "./ProjectsPage";
import { createOSProject } from "../../services/api";

const categories = [
  "Core Engine",
  "Backend Services",
  "DevTools & MCP",
  "UI Components",
  "Documentation",
];
const difficultyLevels = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

function UploadProjectPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    repository: "",
    description: "",
    category: categories[0],
    difficultyLevel: difficultyLevels[0].value,
    stacks: "",
    admin: "",
    adminEmail: "",
    adminLinkedIn: "",
    adminGithub: "",
  });

  if (loading) return null;
  if (!canUploadProjects(user)) return <Navigate to="/open-source" replace />;

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitProject = async (event) => {
    event.preventDefault();
    const project = {
      name: form.name.trim(),
      repository: form.repository
        .trim()
        .replace(/^https?:\/\/(www\.)?github\.com\//, "")
        .replace(/\/$/, ""),
      description: form.description.trim(),
      category: form.category,
      difficultyLevel: form.difficultyLevel,
      stacks: form.stacks
        .split(",")
        .map((stack) => stack.trim())
        .filter(Boolean),
      admin:
        form.admin.trim() ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.email,
      adminEmail: form.adminEmail.trim(),
      adminLinkedIn: normalizeProfileUrl(form.adminLinkedIn),
      adminGithub: normalizeProfileUrl(form.adminGithub),
      accent: "#4ade80",
    };
    if (
      !project.name ||
      !project.repository ||
      !project.description ||
      !project.stacks.length ||
      !project.adminEmail ||
      !project.adminLinkedIn ||
      !project.adminGithub
    ) {
      toast.error("Complete the project details and all admin contact fields.");
      return;
    }
    try {
      await createOSProject(project);
      toast.success("Project added to the open source specifications.");
      navigate("/open-source");
    } catch (error) {
      toast.error(error.message || "Failed to add project");
    }
  };

  return (
    <div className="min-h-screen bg-[#242435] px-5 pb-20 pt-16 text-[#f8f4e9] sm:px-8 lg:px-12 lg:pt-24">
      <main className="mx-auto max-w-3xl">
        <Link
          to="/open-source"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#a9a8bc] transition hover:text-emerald-400"
        >
          <ArrowLeft size={16} /> Back to projects
        </Link>
        <div className="rounded-[26px] border border-white/[0.1] bg-[#1b1b2a]/90 p-6 shadow-2xl shadow-black/20 sm:p-9">
          <div className="mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-400">
              Project administration
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[#fffaf0] sm:text-4xl">
              Add an open source project
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#a9a8bc]">
              Share the project specification contributors will use to choose
              their track.
            </p>
          </div>
          <form onSubmit={submitProject} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="Project name"
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="e.g. Kepler"
                required
              />
              <Field
                label="Project repository"
                name="repository"
                value={form.repository}
                onChange={updateField}
                placeholder="github.com/org/project"
                required
              />
            </div>
            <label className="block text-sm text-[#d7d5df]">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                rows={4}
                required
                placeholder="What will contributors build?"
                className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#10101a] px-4 py-3 text-sm text-white outline-none placeholder:text-[#666579] focus:border-emerald-400/60"
              />
            </label>
            <label className="block text-sm text-[#d7d5df]">
              Category
              <select
                name="category"
                value={form.category}
                onChange={updateField}
                className="mt-2 h-12 w-full rounded-xl border border-white/[0.1] bg-[#10101a] px-4 text-sm text-white outline-none focus:border-emerald-400/60"
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-[#d7d5df]">
              Difficulty level
              <select
                name="difficultyLevel"
                value={form.difficultyLevel}
                onChange={updateField}
                required
                className="mt-2 h-12 w-full rounded-xl border border-white/[0.1] bg-[#10101a] px-4 text-sm text-white outline-none focus:border-emerald-400/60"
              >
                {difficultyLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Tech stack"
              name="stacks"
              value={form.stacks}
              onChange={updateField}
              placeholder="React, Node.js, MongoDB"
              hint="Separate technologies with commas."
              required
            />
            <Field
              label="Project admin"
              name="admin"
              value={form.admin}
              onChange={updateField}
              placeholder="Defaults to your profile name"
            />
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="Admin email"
                name="adminEmail"
                type="email"
                value={form.adminEmail}
                onChange={updateField}
                placeholder="admin@example.com"
                required
              />
              <Field
                label="Admin LinkedIn"
                name="adminLinkedIn"
                value={form.adminLinkedIn}
                onChange={updateField}
                placeholder="linkedin.com/in/username"
                required
              />
            </div>
            <Field
              label="Admin GitHub"
              name="adminGithub"
              value={form.adminGithub}
              onChange={updateField}
              placeholder="github.com/username"
              required
            />
            <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-6 sm:flex-row sm:justify-end">
              <Link
                to="/open-source"
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.1] px-5 text-sm text-[#a9a8bc] hover:text-white"
              >
                <X size={16} /> Cancel
              </Link>
              <button
                type="submit"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-lime-300 px-5 text-sm font-semibold text-[#16231d] hover:from-green-300 hover:to-emerald-200"
              >
                <Save size={16} /> Add project
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function normalizeProfileUrl(value) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";
  return /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;
}

function Field({ label, name, value, onChange, placeholder, hint, ...props }) {
  return (
    <label className="block text-sm text-[#d7d5df]">
      {label}
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-xl border border-white/[0.1] bg-[#10101a] px-4 text-sm text-white outline-none placeholder:text-[#666579] focus:border-emerald-400/60"
        {...props}
      />
      {hint && (
        <span className="mt-2 block text-xs text-[#77768b]">{hint}</span>
      )}
    </label>
  );
}

export default UploadProjectPage;
