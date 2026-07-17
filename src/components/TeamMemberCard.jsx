import { Mail, Phone, Edit3, Trash2, Users } from "react-feather";
import { photoPreviewUrl, avatarPlaceholder } from "../utils/teamMemberUtils";
import { getAccountTypeLabel } from "../services/api";

export default function TeamMemberCard({
  row,
  openEdit,
  deleteConfirmId,
  setDeleteConfirmId,
  handleDelete,
}) {
  const isTeamMember = row.type === "teamMember";
  const m = isTeamMember ? row.teamMember : row;
  const u = row.user;
  const profile = u?.additionalDetails || {};
  const pre = row.predefinedProfile || {};

  const name = isTeamMember
    ? m.name || m.email || "—"
    : row.registered
      ? [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() || row.email
      : pre?.name || row.email;

  const photoUrl = isTeamMember
    ? m.photo || m.image_drive_link
    : row.registered
      ? u?.image
      : pre?.image
        ? pre.image.startsWith("http")
          ? pre.image
          : `https://www.gfg-bvcoe.com${pre.image.startsWith("/") ? "" : "/"}${pre.image}`
        : null;

  const tagLabel = isTeamMember
    ? "Team member"
    : row.registered
      ? profile?.position || getAccountTypeLabel(u?.accountType) || u?.accountType || ""
      : "Not registered yet";

  const year = isTeamMember
    ? m.year || "—"
    : row.registered
      ? profile?.year || profile?.yearOfStudy || "—"
      : pre?.year || "—";

  const branch = isTeamMember
    ? m.branch || "—"
    : row.registered
      ? profile?.branch || "—"
      : pre?.branch || "—";

  const email = isTeamMember ? m.email || "—" : row.email || "—";

  const contact = isTeamMember
    ? m.contact || "—"
    : row.registered
      ? u?.contact || "—"
      : "—";

  return (
    <div className="rounded-[20px] border border-gray-500/20 bg-[#212130] p-5 flex flex-col hover:border-gray-500/40 transition-colors shadow-lg">
      <div className="flex gap-4">
        <img
          src={photoUrl ? photoPreviewUrl(photoUrl) : avatarPlaceholder(name)}
          alt={name}
          className="h-[60px] w-[60px] rounded-full object-cover border border-gray-500/30 shrink-0"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = avatarPlaceholder(name);
          }}
        />
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-1 mb-0.5">
            <h3 className="font-semibold text-gray-200 truncate text-[15px]">
              {name}
            </h3>
            {tagLabel && (
              <span
                className={`inline-flex w-fit items-center px-2 py-0.5 rounded-md text-[10px] font-medium shrink-0 ${
                  tagLabel === "Not registered yet"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {tagLabel}
              </span>
            )}
          </div>
          <p className="text-[12px] text-gray-400 mt-1 truncate font-light">
            {year !== "—" ? `${year} Year` : ""}
            {year !== "—" && branch !== "—" ? " · " : ""}
            {branch !== "—" ? branch : ""}
          </p>
          <div className="flex items-center gap-2 mt-3 text-[12px] text-gray-400 font-light">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{email}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[12px] text-gray-400 font-light">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{contact}</span>
          </div>
        </div>
      </div>

      <div
        className={`grid ${
          isTeamMember ? "grid-cols-4" : "grid-cols-3"
        } gap-2 mt-5 pt-4 border-t border-gray-500/10`}
      >
        <a
          href={`mailto:${email}`}
          className="flex items-center justify-center py-2.5 rounded-xl text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors bg-[#252536] border border-gray-500/20"
        >
          <Mail className="h-4 w-4" />
        </a>
        <a
          href={`tel:${contact}`}
          className="flex items-center justify-center py-2.5 rounded-xl text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors bg-[#252536] border border-gray-500/20"
        >
          <Phone className="h-4 w-4" />
        </a>
        {isTeamMember ? (
          <>
            <button
              type="button"
              onClick={() => openEdit(m)}
              className="flex items-center justify-center py-2.5 rounded-xl text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors bg-[#252536] border border-gray-500/20"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            {deleteConfirmId === m._id ? (
              <div className="flex items-center justify-center py-2.5 rounded-xl text-red-400 bg-red-500/10 border border-red-500/20 text-xs gap-1">
                <button
                  onClick={() => handleDelete(m._id)}
                  className="hover:text-red-300 font-bold"
                >
                  Y
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  N
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteConfirmId(m._id)}
                className="flex items-center justify-center py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors bg-[#252536] border border-gray-500/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            className="flex items-center justify-center py-2.5 rounded-xl text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors bg-[#252536] border border-gray-500/20 cursor-default opacity-50"
          >
            <Users className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
