import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMe, updateProfile, updateAvatar, changePassword, deleteAccount } from "../services/api";
import { toast } from "sonner";
import { Trash2, X } from "react-feather";

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    about: "",
    contact: "",
    yearOfStudy: "",
    section: "",
    non_tech_society: "",
    instagram: "",
    linkedin: "",
    github: "",
  });
  const [profileDetails, setProfileDetails] = useState({
    branch: "",
    year: "",
    position: "",
    p0: "",
    p1: "",
    p2: "",
    timeline: [],
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await getMe();
        const data = res.user || res;
        const profile = data.additionalDetails || {};
        setFormData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          gender: profile.gender || "",
          dob: profile.dob ? profile.dob.substring(0, 10) : "",
          about: profile.about || "",
          contact: profile.phoneNumber || data.contact || "",
          yearOfStudy: profile.yearOfStudy || "",
          section: profile.section || "",
          non_tech_society: profile.non_tech_society || "",
          instagram: profile.socials?.instagram || "",
          linkedin: profile.socials?.linkedin || "",
          github: profile.socials?.github || "",
        });
        setProfileDetails({
          branch: profile.branch || "",
          year: profile.year || "",
          position: profile.position || "",
          p0: profile.p0 || "",
          p1: profile.p1 || "",
          p2: profile.p2 || "",
          timeline: Array.isArray(profile.timeline) ? profile.timeline : [],
        });
        setAvatarPreview(data.image || "");
      } catch (err) {
        toast.error(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender || undefined,
        dob: formData.dob || undefined,
        about: formData.about || undefined,
        contact: formData.contact || undefined,
        yearOfStudy: formData.yearOfStudy || undefined,
        section: formData.section || undefined,
        non_tech_society: formData.non_tech_society || undefined,
        instagram: formData.instagram || undefined,
        linkedin: formData.linkedin || undefined,
        github: formData.github || undefined,
      });
      if (res.data) setUser(res.data);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarSave = async () => {
    if (!avatarFile) {
      toast.error("Select an image first");
      return;
    }
    setSavingAvatar(true);
    try {
      const res = await updateAvatar(avatarFile);
      if (res.data) setUser(res.data);
      setAvatarPreview(res.data?.image || avatarPreview);
      setAvatarFile(null);
      toast.success("Display picture updated");
    } catch (err) {
      toast.error(err.message || "Failed to update picture");
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordForm;
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password should be at least 6 characters.");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ oldPassword, newPassword, confirmPassword });
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteAccount();
      toast.success("Account deleted.");
      if (logout) await logout();
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message || "Failed to delete account");
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">My profile</h1>
          <p className="text-gray-400 text-sm">Manage your details and display picture</p>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : (
          <div className="bg-gradient-to-br from-[#1e1e2f]/90 to-[#2c2c3e]/90 border border-gray-500/30 rounded-2xl p-6 md:p-8 shadow-xl space-y-8">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt=""
                    className="h-20 w-20 rounded-full object-cover border-2 border-gray-500/50"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-600/80 text-2xl font-semibold text-white">
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </div>
                )}
              </div>
              <div className="space-y-3 min-w-0">
                <p className="text-sm font-medium text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="text-xs text-gray-400 file:mr-2 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleAvatarSave}
                    disabled={savingAvatar || !avatarFile}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium disabled:opacity-50"
                  >
                    {savingAvatar ? "Saving…" : "Save picture"}
                  </button>
                </div>
              </div>
            </div>

            {/* Branch, Year, Position & Roles (p0, p1, p2) */}
            {(profileDetails.branch || profileDetails.year || profileDetails.position || profileDetails.p0 || profileDetails.p1 || profileDetails.p2) && (
              <div className="rounded-xl bg-[#252536]/60 border border-gray-500/30 p-5">
                <h2 className="text-sm font-semibold text-cyan-400/90 uppercase tracking-wider mb-4">Role & details</h2>
                <div className="flex flex-wrap gap-2">
                  {profileDetails.branch && (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 text-sm font-medium border border-cyan-500/30">
                      {profileDetails.branch}
                    </span>
                  )}
                  {profileDetails.year && (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-sm font-medium border border-emerald-500/30">
                      {profileDetails.year} year
                    </span>
                  )}
                  {profileDetails.position && (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-violet-500/15 text-violet-300 text-sm font-medium border border-violet-500/30">
                      {profileDetails.position}
                    </span>
                  )}
                  {profileDetails.p0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-sm font-medium border border-amber-500/30" title="Primary role">
                      {profileDetails.p0}
                    </span>
                  )}
                  {profileDetails.p1 && profileDetails.p1 !== "NA" && profileDetails.p1 !== "nil" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-sky-500/15 text-sky-300 text-sm font-medium border border-sky-500/30" title="Additional role">
                      {profileDetails.p1}
                    </span>
                  )}
                  {profileDetails.p2 && profileDetails.p2 !== "NA" && profileDetails.p2 !== "nil" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-rose-500/15 text-rose-300 text-sm font-medium border border-rose-500/30" title="Additional role">
                      {profileDetails.p2}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            {profileDetails.timeline.length > 0 && (
              <div className="rounded-xl bg-[#252536]/60 border border-gray-500/30 p-5">
                <h2 className="text-sm font-semibold text-cyan-400/90 uppercase tracking-wider mb-5">Timeline</h2>
                <div className="relative">
                  {/* vertical line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-cyan-500/50 via-cyan-400/30 to-transparent rounded-full" />
                  <ul className="space-y-0">
                    {profileDetails.timeline.map((item, i) => (
                      <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                        <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 border-2 border-cyan-400/60 ring-4 ring-[#1e1e2f]" />
                        <div className="min-w-0 flex-1 rounded-xl bg-[#1e1e2f]/80 border border-gray-500/20 p-4 hover:border-cyan-500/30 transition-colors">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            {item.year && (
                              <span className="text-xs font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded">
                                {String(item.year)}
                              </span>
                            )}
                            {item.role && (
                              <span className="text-sm font-semibold text-white">{item.role}</span>
                            )}
                          </div>
                          {item.project && (
                            <p className="text-sm text-cyan-300/90 font-medium mb-1">{item.project}</p>
                          )}
                          {item.description && (
                            <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4">
                <div>
                  <label className={labelClass}>First name</label>
                  <input
                    value={formData.firstName}
                    onChange={handleChange("firstName")}
                    className={inputClass}
                    placeholder="First name"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Last name</label>
                  <input
                    value={formData.lastName}
                    onChange={handleChange("lastName")}
                    className={inputClass}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select
                  value={formData.gender}
                  onChange={handleChange("gender")}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Date of birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={handleChange("dob")}
                  className={inputClass + " [color-scheme:dark]"}
                />
              </div>
              <div>
                <label className={labelClass}>Contact</label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={handleChange("contact")}
                  className={inputClass}
                  placeholder="Phone or contact"
                />
              </div>
              <div>
                <label className={labelClass}>Year of study</label>
                <input
                  value={formData.yearOfStudy}
                  onChange={handleChange("yearOfStudy")}
                  className={inputClass}
                  placeholder="e.g. 2nd year"
                />
              </div>
              <div>
                <label className={labelClass}>Section</label>
                <input
                  value={formData.section}
                  onChange={handleChange("section")}
                  className={inputClass}
                  placeholder="e.g. A, B, or section name"
                />
              </div>
              <div>
                <label className={labelClass}>Non-tech society</label>
                <input
                  value={formData.non_tech_society}
                  onChange={handleChange("non_tech_society")}
                  className={inputClass}
                  placeholder="e.g. Music club, Dance, etc."
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>About you</label>
                <textarea
                  value={formData.about}
                  onChange={handleChange("about")}
                  rows={3}
                  className={inputClass + " resize-y"}
                  placeholder="A bit about yourself, interests, experience."
                />
              </div>
              <div className="sm:col-span-2 border-t border-gray-500/30 pt-5">
                <p className="text-sm font-medium text-gray-300 mb-3">Social links</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className={labelClass}>Instagram</label>
                    <div className="flex items-center gap-2">
                      <input
                        value={formData.instagram}
                        onChange={handleChange("instagram")}
                        className={inputClass + " flex-1 min-w-0"}
                        placeholder="https://instagram.com/..."
                      />
                      <a
                        href={formData.instagram?.trim() ? (formData.instagram.trim().startsWith("http") ? formData.instagram.trim() : `https://instagram.com/${formData.instagram.trim().replace(/^@/, "")}`) : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => !formData.instagram?.trim() && e.preventDefault()}
                        className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-500/40 bg-[#252536] text-pink-400 hover:bg-pink-500/20 hover:border-pink-500/50 transition-colors ${!formData.instagram?.trim() ? "pointer-events-none opacity-50" : ""}`}
                        title="Open Instagram"
                        aria-label="Open Instagram link"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>LinkedIn</label>
                    <div className="flex items-center gap-2">
                      <input
                        value={formData.linkedin}
                        onChange={handleChange("linkedin")}
                        className={inputClass + " flex-1 min-w-0"}
                        placeholder="https://linkedin.com/in/..."
                      />
                      <a
                        href={formData.linkedin?.trim() ? (formData.linkedin.trim().startsWith("http") ? formData.linkedin.trim() : `https://linkedin.com/in/${formData.linkedin.trim()}`) : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => !formData.linkedin?.trim() && e.preventDefault()}
                        className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-500/40 bg-[#252536] text-[#0a66c2] hover:bg-[#0a66c2]/20 hover:border-[#0a66c2]/50 transition-colors ${!formData.linkedin?.trim() ? "pointer-events-none opacity-50" : ""}`}
                        title="Open LinkedIn"
                        aria-label="Open LinkedIn link"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>GitHub</label>
                    <div className="flex items-center gap-2">
                      <input
                        value={formData.github}
                        onChange={handleChange("github")}
                        className={inputClass + " flex-1 min-w-0"}
                        placeholder="https://github.com/..."
                      />
                      <a
                        href={formData.github?.trim() ? (formData.github.trim().startsWith("http") ? formData.github.trim() : `https://github.com/${formData.github.trim().replace(/^@/, "")}`) : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => !formData.github?.trim() && e.preventDefault()}
                        className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-500/40 bg-[#252536] text-gray-300 hover:bg-gray-500/20 hover:border-cyan-500/50 transition-colors ${!formData.github?.trim() ? "pointer-events-none opacity-50" : ""}`}
                        title="Open GitHub"
                        aria-label="Open GitHub link"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>

            {/* Change password */}
            <div className="border-t border-gray-500/30 pt-8">
              <h2 className="text-lg font-semibold text-white mb-1">Change password</h2>
              <p className="text-sm text-gray-400 mb-4">Update your account password. You will need your current password.</p>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className={labelClass}>Current password</label>
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))}
                    className={inputClass}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className={labelClass}>New password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    className={inputClass}
                    placeholder="••••••••"
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className={labelClass}>Confirm new password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    className={inputClass}
                    placeholder="••••••••"
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold disabled:opacity-50"
                >
                  {savingPassword ? "Updating…" : "Update password"}
                </button>
              </form>
            </div>

            {/* Delete account */}
            <div className="border-t border-gray-500/30 pt-8">
              <h2 className="text-lg font-semibold text-white mb-1">Delete account</h2>
              <p className="text-sm text-gray-400 mb-4">
                Permanently delete your account and all associated profile data. This cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium text-sm transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete my account
              </button>
            </div>
          </div>
        )}

        {/* Delete account confirmation modal */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !deletingAccount && setShowDeleteConfirm(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <div
              className="bg-[#1e1e2f] rounded-2xl border border-gray-500/40 shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 id="delete-account-title" className="text-lg font-bold text-white flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-400" />
                  Delete account?
                </h2>
                <button
                  type="button"
                  onClick={() => !deletingAccount && setShowDeleteConfirm(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-500/30 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-300 text-sm mb-6">
                This will permanently delete your account and all your profile data (additional details). You will need to sign up again to use the platform. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deletingAccount}
                  className="px-4 py-2.5 rounded-xl border border-gray-500/50 text-gray-300 hover:bg-gray-500/20 font-medium text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm disabled:opacity-50"
                >
                  {deletingAccount ? "Deleting…" : "Yes, delete my account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
