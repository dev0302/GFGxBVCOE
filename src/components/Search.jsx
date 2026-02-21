import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { getSearchPeople, getAccountTypeLabel, sendSignupInvite } from "../services/api";
import { driveLinkToImageUrl, avatarPlaceholder } from "../utils/teamMemberUtils";
import { Search as SearchIcon, X, Mail } from "react-feather";
import "./Search.css";
import { Spinner } from "./ui/spinner";



const TEAM_FIELDS = [
  "name",
  "year",
  "branch",
  "section",
  "email",
  "contact",
  "photo",
  "non_tech_society",
];
const TEAM_LABELS = {
  name: "Name",
  year: "Year",
  branch: "Branch",
  section: "Section",
  email: "Email",
  contact: "Contact",
  photo: "Photo",
  non_tech_society: "Non-tech society",
};

export function MemberDetailModal({ member, onClose }) {
  if (!member) return null;
  const photoUrl = (member.photo || member.image_drive_link)
    ? driveLinkToImageUrl(member.photo || member.image_drive_link)
    : avatarPlaceholder(member.name);

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-full items-center justify-center overflow-hidden overscroll-none p-4 py-8 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Member details"
    >
      <div
        className="bg-[#1e1e2f] rounded-2xl border border-gray-500/40 shadow-2xl w-full max-w-lg h-5/6 flex flex-col overflow-hidden shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-500/30 bg-[#1e1e2f]/95 z-10 shrink-0">
          <h2 className="text-lg font-bold text-white">Team member</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-500/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-6 flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }} data-lenis-prevent>
          <div className="flex flex-col items-center gap-3">
            <img
              src={photoUrl}
              alt={member.name || "Member"}
              className="h-24 w-24 rounded-full object-cover border-2 border-gray-500/50"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = avatarPlaceholder(member.name);
              }}
            />
            <h3 className="text-xl font-bold text-white text-center">
              {member.name || "—"}
            </h3>
            {(member.year || member.branch) && (
              <p className="text-gray-400 text-sm">
                {[member.year, member.branch].filter(Boolean).join(" • ")}
              </p>
            )}
          </div>
          <dl className="grid gap-3">
            {TEAM_FIELDS.filter((k) => k !== "photo").map((key) => {
              const value = member[key];
              const isEmpty = value == null || String(value).trim() === "";
              return (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3"
                >
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider shrink-0 w-32">
                    {TEAM_LABELS[key]}
                  </dt>
                  <dd className="text-gray-200 text-sm break-all">
                    {key === "email" && value ? (
                      <a
                        href={`mailto:${value}`}
                        className="text-cyan-400 hover:underline"
                      >
                        {value}
                      </a>
                    ) : key === "contact" && value ? (
                      <a
                        href={`tel:${value}`}
                        className="text-cyan-400 hover:underline"
                      >
                        {value}
                      </a>
                    ) : isEmpty ? (
                      "—"
                    ) : (
                      String(value)
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
          {(member.photo || member.image_drive_link) && (
            <div className="pt-2 border-t border-gray-500/20">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Photo link
              </span>
              <a
                href={member.photo || member.image_drive_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-cyan-400 text-sm mt-1 truncate hover:underline"
              >
                {member.photo || member.image_drive_link}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const PREDEFINED_IMAGE_BASE = "https://www.gfg-bvcoe.com";

function DetailRow({ label, value, link }) {
  const isEmpty = value == null || String(value).trim() === "";
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider shrink-0 w-36">
        {label}
      </dt>
      <dd className="text-gray-200 text-sm break-all">
        {isEmpty ? "—" : link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
            {value}
          </a>
        ) : (
          String(value)
        )}
      </dd>
    </div>
  );
}

export function PredefinedOnlyDetailModal({ predefined, onClose }) {
  if (!predefined) return null;
  const pre = predefined;
  const imagePath = (pre.image || "").trim();
  const imgSrc = imagePath
    ? imagePath.startsWith("http")
      ? imagePath
      : `${PREDEFINED_IMAGE_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
    : avatarPlaceholder(pre.name);

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-full items-center justify-center overflow-hidden overscroll-none p-4 py-8 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Predefined profile (not registered yet)"
    >
      <div
        className="bg-[#1e1e2f] rounded-2xl border border-gray-500/40 shadow-2xl w-full max-w-2xl h-[calc(100vh-2rem)] flex flex-col overflow-hidden shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-500/30 bg-[#1e1e2f]/95 z-10 shrink-0">
          <h2 className="text-lg font-bold text-white">Profile (not registered yet)</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-500/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-8 flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }} data-lenis-prevent>
          <div className="flex flex-col items-center gap-3">
            <img
              src={imgSrc}
              alt={pre.name || "—"}
              className="h-28 w-28 rounded-full object-cover border-2 border-gray-500/50"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = avatarPlaceholder(pre.name);
              }}
            />
            <h3 className="text-xl font-bold text-white text-center">{pre.name || "—"}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/40">
              Not registered yet
            </span>
            {(pre.branch || pre.year) && (
              <p className="text-gray-400 text-sm text-center">
                {[pre.branch, pre.year].filter(Boolean).join(" • ")}
              </p>
            )}
          </div>
          <section>
            <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3 border-b border-gray-500/30 pb-1">
              Predefined profile
            </h4>
            <dl className="grid gap-2">
              <DetailRow label="Name" value={pre.name} />
              <DetailRow label="Email" value={pre.email} />
              <DetailRow label="Branch" value={pre.branch} />
              <DetailRow label="Year" value={pre.year} />
              <DetailRow label="Position" value={pre.position} />
              <DetailRow label="P0" value={pre.p0} />
              <DetailRow label="P1" value={pre.p1} />
              <DetailRow label="P2" value={pre.p2} />
              <DetailRow
                label="Instagram"
                value={pre.instaLink}
                link={pre.instaLink && pre.instaLink !== "nil" ? pre.instaLink : undefined}
              />
              <DetailRow label="LinkedIn" value={pre.linkedinLink} link={pre.linkedinLink || undefined} />
              {pre.image && (
                <DetailRow label="Image URL" value={pre.image} link={pre.image} />
              )}
              {Array.isArray(pre.timeline) && pre.timeline.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline
                  </span>
                  <ul className="mt-2 space-y-2">
                    {pre.timeline.map((t, i) => (
                      <li
                        key={i}
                        className="text-gray-200 text-sm bg-gray-500/10 rounded-lg p-3"
                      >
                        {t.year && <span className="text-cyan-400 font-medium">{t.year}</span>}
                        {t.role && ` • ${t.role}`}
                        {t.project && ` • ${t.project}`}
                        {t.description && (
                          <p className="text-gray-400 mt-1">{t.description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

export function UserDetailModal({ user, onClose }) {
  if (!user) return null;
  const profile = user.additionalDetails || {};
  const pre = user.predefinedProfile || {};
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—";
  const imgSrc = user.image || (pre.image ? `${pre.image}` : null) || avatarPlaceholder(fullName);

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-full items-center justify-center overflow-hidden overscroll-none p-4 py-8 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="User profile details"
    >
      <div
        className="bg-[#1e1e2f] rounded-2xl border border-gray-500/40 shadow-2xl w-full max-w-2xl h-5/6 flex flex-col overflow-hidden shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-500/30 bg-[#1e1e2f]/95 z-10 shrink-0">
          <h2 className="text-lg font-bold text-white">Profile & details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-500/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-8 flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }} data-lenis-prevent>
          {/* Header: photo + name */}
          <div className="flex flex-col items-center gap-3">
            <img
              src={imgSrc}
              alt={fullName}
              className="h-28 w-28 rounded-full object-cover border-2 border-gray-500/50"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = avatarPlaceholder(fullName);
              }}
            />
            <h3 className="text-xl font-bold text-white text-center">{fullName}</h3>
            {(profile.branch || profile.year || user.accountType) && (
              <p className="text-gray-400 text-sm text-center">
                {[profile.branch, profile.year].filter(Boolean).join(" • ")}
                {user.accountType && (
                  <span className="ml-1 text-cyan-400">({getAccountTypeLabel(user.accountType) || user.accountType})</span>
                )}
              </p>
            )}
          </div>

          {/* Account (User) */}
          <section>
            <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3 border-b border-gray-500/30 pb-1">
              Account
            </h4>
            <dl className="grid gap-2">
              <DetailRow label="First name" value={user.firstName} />
              <DetailRow label="Last name" value={user.lastName} />
              <DetailRow
                label="Email"
                value={user.email}
                link={user.email ? `mailto:${user.email}` : undefined}
              />
              <DetailRow
                label="Contact"
                value={user.contact}
                link={user.contact ? `tel:${user.contact}` : undefined}
              />
              <DetailRow label="Department / Role" value={getAccountTypeLabel(user.accountType) || user.accountType} />
            </dl>
          </section>

          {/* Profile (additionalDetails) */}
          <section>
            <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3 border-b border-gray-500/30 pb-1">
              Profile
            </h4>
            <dl className="grid gap-2">
              <DetailRow label="Gender" value={profile.gender} />
              <DetailRow
                label="Date of birth"
                value={profile.dob ? new Date(profile.dob).toLocaleDateString() : null}
              />
              <DetailRow label="About" value={profile.about} />
              <DetailRow label="Year of study" value={profile.yearOfStudy} />
              <DetailRow label="Branch" value={profile.branch} />
              <DetailRow label="Year" value={profile.year} />
              <DetailRow label="Position" value={profile.position} />
              <DetailRow label="P0" value={profile.p0} />
              <DetailRow label="P1" value={profile.p1} />
              <DetailRow label="P2" value={profile.p2} />
              {profile.socials && (
                <>
                  <DetailRow
                    label="Instagram"
                    value={profile.socials.instagram}
                    link={profile.socials.instagram || undefined}
                  />
                  <DetailRow
                    label="LinkedIn"
                    value={profile.socials.linkedin}
                    link={profile.socials.linkedin || undefined}
                  />
                  <DetailRow
                    label="GitHub"
                    value={profile.socials.github}
                    link={profile.socials.github || undefined}
                  />
                </>
              )}
              {Array.isArray(profile.timeline) && profile.timeline.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline
                  </span>
                  <ul className="mt-2 space-y-2">
                    {profile.timeline.map((t, i) => (
                      <li
                        key={i}
                        className="text-gray-200 text-sm bg-gray-500/10 rounded-lg p-3"
                      >
                        {t.year && <span className="text-cyan-400 font-medium">{t.year}</span>}
                        {t.role && ` • ${t.role}`}
                        {t.project && ` • ${t.project}`}
                        {t.description && (
                          <p className="text-gray-400 mt-1">{t.description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </dl>
          </section>

          {/* Predefined profile section hidden for registered users */}
        </div>
      </div>
    </div>
  );
}

export default function Search({ variant = "navbar", isDarkNavbar = true, placeholder = "Search members…", className = "" }) {
  const { user } = useAuth();
  const [results, setResults] = useState({ teamMembers: [], users: [], predefinedOnly: [] });
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // { type: 'teamMember' | 'user' | 'predefinedOnly', data }
  const [sendingInviteTo, setSendingInviteTo] = useState(null); // email while sending invite
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const q = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      getSearchPeople(q)
        .then((res) => setResults({
          teamMembers: res.teamMembers || [],
          users: res.users || [],
          predefinedOnly: res.predefinedOnly || [],
        }))
        .catch(() => setResults({ teamMembers: [], users: [], predefinedOnly: [] }))
        .finally(() => setLoading(false));
    }, q.length === 0 ? 0 : 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [user, query]);

  useEffect(() => {
    const onClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Lock background scroll when a profile/member modal is open
  useEffect(() => {
    if (selectedItem) {
      const scrollY = window.scrollY;
      const prevHtml = document.documentElement.style.overflow;
      const prevBody = document.body.style.overflow;
      const prevBodyPosition = document.body.style.position;
      const prevBodyTop = document.body.style.top;
      const prevBodyWidth = document.body.style.width;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      return () => {
        document.documentElement.style.overflow = prevHtml;
        document.body.style.overflow = prevBody;
        document.body.style.position = prevBodyPosition;
        document.body.style.top = prevBodyTop;
        document.body.style.width = prevBodyWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, [selectedItem]);

  const { teamMembers, users, predefinedOnly } = results;
  const q = query.trim().toLowerCase();
  const filteredTeamMembers = q
    ? teamMembers.filter((m) => (m.name || "").toLowerCase().startsWith(q))
    : [];
  const filteredUsers = q
    ? users.filter((u) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.startsWith(q) || email.startsWith(q);
    })
    : [];
  const filteredPredefinedOnly = q
    ? predefinedOnly.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      return name.startsWith(q) || email.startsWith(q);
    })
    : [];
  const totalCount = filteredTeamMembers.length + filteredUsers.length + filteredPredefinedOnly.length;
  const hasQuery = query.trim().length > 0;
  const showDropdown = dropdownOpen && hasQuery;
  const isDark = variant === "manage-team" || (variant === "navbar" && isDarkNavbar);
  const isNavbar = variant === "navbar";

  const inputBase =
    "w-full rounded-2xl border bg-transparent text-sm outline-none transition-colors";
  const inputTheme = isNavbar
    ? "border-white/50 text-white placeholder-white/70 focus:border-white bg-white/5"
    : isDark
      ? "border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 bg-[#252536]"
      : "border-green-400/40 text-white placeholder-green-200/70 focus:border-green-400 bg-green-900/30";
  const inputSize =
    variant === "navbar"
      ? "pl-9 pr-4 py-2 max-w-[180px]"
      : variant === "hero"
        ? "pl-10 pr-5 py-3 max-w-md mx-auto text-base"
        : "pl-10 pr-4 py-2.5";

  if (!user) return null;

  return (
    <>
      <div
        ref={wrapRef}
        className={`search-input-wrap ${showDropdown ? "show-dropdown" : ""} ${className}`}
      >
        <div className="relative">
          <SearchIcon
            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isNavbar ? "text-white" : isDark ? "text-gray-400" : "text-green-300/90"}`}
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => { if (query.trim().length > 0) setDropdownOpen(true); }}
            placeholder={placeholder}
            className={`${inputBase} ${inputTheme} ${inputSize}`}
            aria-label="Search team members and people"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
          />
        </div>
        {showDropdown && (
          <div
            className="search-dropdown search-dropdown-card absolute left-0 right-0 mt-2 rounded-2xl border border-gray-500/40 bg-[#1e1e2f] z-50 min-w-[320px] w-full max-w-[560px]"
            role="listbox"
          >
            <div className="search-dropdown-header">
              <div className="search-dropdown-title">
                Members
                <span className="search-dropdown-badge">{totalCount}</span>
              </div>
            </div>
            <div className="search-member-list">
              {loading ? (
                <div className="flex items-center justify-center gap-2 px-2 py-4 text-sm text-gray-400">
                  <Spinner className="size-4 text-gray-400" />
                  <span>Loading...</span>
                </div>
              ) : totalCount === 0 ? (
                <div className="px-2 py-4 text-center text-gray-500 text-sm">No results</div>
              ) : (
                <>
                  {filteredTeamMembers.slice(0, 15).map((m) => {
                    const src = (m.photo || m.image_drive_link)
                      ? driveLinkToImageUrl(m.photo || m.image_drive_link)
                      : avatarPlaceholder(m.name);
                    return (
                      <button
                        key={`tm-${m._id}`}
                        type="button"
                        role="option"
                        className="search-member-row"
                        onClick={() => {
                          setSelectedItem({ type: "teamMember", data: m });
                          setDropdownOpen(false);
                          setQuery("");
                        }}
                      >
                        <div className="user-info">
                          <div className="avatar-wrap">
                            <img
                              src={src}
                              alt=""
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = avatarPlaceholder(m.name);
                              }}
                            />
                          </div>
                          <span className="name">{m.name || "—"}</span>
                        </div>
                        <span className="role-badge team">Team</span>
                      </button>
                    );
                  })}
                  {filteredUsers.slice(0, 15).map((u) => {
                    const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
                    const src = u.image || avatarPlaceholder(name);
                    const roleLabel = u.additionalDetails?.position || getAccountTypeLabel(u.accountType) || u.accountType || "Member";
                    return (
                      <button
                        key={`u-${u._id}`}
                        type="button"
                        role="option"
                        className="search-member-row"
                        onClick={() => {
                          setSelectedItem({ type: "user", data: u });
                          setDropdownOpen(false);
                          setQuery("");
                        }}
                      >
                        <div className="user-info">
                          <div className="avatar-wrap">
                            <img
                              src={src}
                              alt=""
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = avatarPlaceholder(name);
                              }}
                            />
                          </div>
                          <span className="name">{name}</span>
                        </div>
                        <span className="role-badge member">{roleLabel}</span>
                      </button>
                    );
                  })}
                  {filteredPredefinedOnly.slice(0, 15).map((p) => {
                    const name = p.name || p.email || "—";
                    const imagePath = (p.image || "").trim();
                    const src = imagePath
                      ? imagePath.startsWith("http")
                        ? imagePath
                        : `${PREDEFINED_IMAGE_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
                      : avatarPlaceholder(name);
                    const email = (p.email || "").trim().toLowerCase();
                    const isSending = sendingInviteTo === email;
                    return (
                      <div
                        key={`pre-${p._id}`}
                        role="option"
                        className="search-member-row flex items-center justify-between w-full"
                      >
                        <button
                          type="button"
                          className="flex-1 flex items-center min-w-0 text-left"
                          onClick={() => {
                            setSelectedItem({ type: "predefinedOnly", data: p });
                            setDropdownOpen(false);
                            setQuery("");
                          }}
                        >
                          <div className="user-info">
                            <div className="avatar-wrap">
                              <img
                                src={src}
                                alt=""
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = avatarPlaceholder(name);
                                }}
                              />
                            </div>
                            <span className="name">{name}</span>
                          </div>
                        </button>
                        <span className="role-badge bg-red-500/20 text-red-400 border border-red-500/40 shrink-0">
                          Not registered yet
                        </span>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!email || isSending) return;
                            setSendingInviteTo(email);
                            try {
                              await sendSignupInvite(email);
                              toast.success("Invite email sent.");
                            } catch (err) {
                              toast.error(err.message || "Failed to send invite");
                            } finally {
                              setSendingInviteTo(null);
                            }
                          }}
                          disabled={isSending}
                          title="Send signup invite email"
                          className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-50 shrink-0 ml-1 inline-flex items-center gap-1"
                        >
                          {isSending ? <span className="text-xs">Sending…</span> : <Mail className="h-4 w-4" />}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {selectedItem?.type === "teamMember" &&
        createPortal(
          <MemberDetailModal
            member={selectedItem.data}
            onClose={() => setSelectedItem(null)}
          />,
          document.body
        )}
      {selectedItem?.type === "user" &&
        createPortal(
          <UserDetailModal
            user={selectedItem.data}
            onClose={() => setSelectedItem(null)}
          />,
          document.body
        )}
      {selectedItem?.type === "predefinedOnly" &&
        createPortal(
          <PredefinedOnlyDetailModal
            predefined={selectedItem.data}
            onClose={() => setSelectedItem(null)}
          />,
          document.body
        )}
    </>
  );
}
