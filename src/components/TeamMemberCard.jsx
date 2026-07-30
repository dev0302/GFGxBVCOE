import { Mail, Phone, Edit3, Trash2 } from "react-feather";
import { photoPreviewUrl, avatarPlaceholder } from "../utils/teamMemberUtils";
import { getAccountTypeLabel } from "../services/api";

export default function TeamMemberCard({
  row,
  openEdit,
  onRequestDelete,
  onOpenPhotoModal,
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
    <div className="rounded-lg sm:rounded-[20px] border border-gray-500/20 bg-[#212130] p-1.5 sm:p-4 flex flex-col justify-between hover:border-gray-500/40 transition-colors shadow-lg min-w-0">
      <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-1 sm:gap-2 min-w-0">
        <img
          src={photoUrl ? photoPreviewUrl(photoUrl) : avatarPlaceholder(name)}
          alt={name}
          className={`h-8 w-8 sm:h-14 sm:w-14 rounded-full object-cover border border-gray-500/30 shrink-0 ${
            photoUrl ? "cursor-pointer hover:scale-105 hover:border-cyan-400 transition-all" : ""
          }`}
          onClick={(e) => {
            if (!photoUrl) return;
            e.stopPropagation();
            onOpenPhotoModal?.(photoUrl, name);
          }}
          title={photoUrl ? `Click to view photo of ${name}` : name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = avatarPlaceholder(name);
          }}
        />
        <div className="w-full min-w-0 flex flex-col items-center sm:items-start justify-center">
          <div className="flex flex-col items-center sm:items-start justify-between gap-0.5 sm:gap-1 w-full min-w-0">
            <h3 className="font-semibold text-gray-200 truncate text-[10px] sm:text-sm md:text-[15px] w-full" title={name}>
              {name}
            </h3>
            {tagLabel && (
              <span
                className={`inline-flex items-center px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded-sm sm:rounded-md text-[8px] sm:text-[10px] font-medium shrink-0 max-w-full truncate ${
                  tagLabel === "Not registered yet"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {tagLabel}
              </span>
            )}
          </div>
          <p className="text-[8.5px] sm:text-[12px] text-gray-400 mt-0.5 sm:mt-1 truncate font-light w-full">
            {year !== "—" ? `${year} Year` : ""}
            {year !== "—" && branch !== "—" ? " · " : ""}
            {branch !== "—" ? branch : ""}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-1 mt-1 sm:mt-2 text-[8.5px] sm:text-[12px] text-gray-400 font-light w-full min-w-0">
            <Mail className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="truncate" title={email}>{email}</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-1 mt-0.5 sm:mt-1 text-[8.5px] sm:text-[12px] text-gray-400 font-light w-full min-w-0">
            <Phone className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="truncate" title={contact}>{contact}</span>
          </div>
        </div>
      </div>

      {isTeamMember && (
        <div className="grid grid-cols-2 gap-1 sm:gap-2 mt-1.5 sm:mt-3 pt-1.5 sm:pt-3 border-t border-gray-500/10 w-full">
          <button
            type="button"
            onClick={() => openEdit(m)}
            className="flex items-center justify-center py-1 sm:py-2 rounded-md sm:rounded-xl text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors bg-[#252536] border border-gray-500/20"
            title="Edit"
          >
            <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRequestDelete?.(m)}
            className="flex items-center justify-center py-1 sm:py-2 rounded-md sm:rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors bg-[#252536] border border-gray-500/20"
            title="Delete"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
