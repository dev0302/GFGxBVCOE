import { cloudinaryTinyAvatarUrl } from "../../utils/cloudinary";

export function CollaboratorAvatar({ image, name, size = "md" }) {
  const src = image ? cloudinaryTinyAvatarUrl(image) : "";
  const initials = String(name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  const sizeClass = size === "sm" ? "h-8 w-8 text-[10px]" : "h-9 w-9 text-xs";

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${sizeClass} rounded-full object-cover border-2 border-[#1e1e2f] ring-1 ring-cyan-500/30`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full bg-cyan-600/30 font-semibold text-cyan-100 border-2 border-[#1e1e2f] ring-1 ring-cyan-500/30`}
    >
      {initials || "?"}
    </div>
  );
}

export function CollaboratorAvatars({ collaborators = [], maxVisible = 4 }) {
  const visible = collaborators.slice(0, maxVisible);
  const overflow = collaborators.length - maxVisible;

  if (!collaborators.length) {
    return <span className="text-xs text-gray-500">No one else here</span>;
  }

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((c) => (
          <div key={c.userId} className="group relative">
            <CollaboratorAvatar image={c.image} name={c.name} />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-[180px] -translate-x-1/2 rounded-lg border border-cyan-500/30 bg-[#151525] px-2.5 py-2 text-left shadow-xl group-hover:block">
              <p className="text-xs font-semibold text-richblack-25">{c.name}</p>
              <p className="text-[10px] text-cyan-300">{c.role}</p>
              {c.department && (
                <p className="text-[10px] text-gray-500">{c.department}</p>
              )}
            </div>
          </div>
        ))}
        {overflow > 0 && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#1e1e2f] bg-[#252540] text-xs font-semibold text-cyan-300 ring-1 ring-cyan-500/30">
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}
