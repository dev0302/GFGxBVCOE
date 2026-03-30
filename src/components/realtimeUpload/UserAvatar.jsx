import { useRef } from "react";
import { cloudinaryTinyAvatarUrl } from "../../utils/cloudinary";
import { animateAvatarHover } from "./animations";

export default function UserAvatar({ user, onClick, registerRef, disabled = false }) {
  const ref = useRef(null);
  const src = user?.image ? cloudinaryTinyAvatarUrl(user.image) : "";

  const attachRef = (node) => {
    ref.current = node;
    if (typeof registerRef === "function") registerRef(user.id, node);
  };

  const initials = String(user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");

  return (
    <button
      type="button"
      ref={attachRef}
      title={user?.name || "Online user"}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => animateAvatarHover(ref.current, true)}
      onMouseLeave={() => animateAvatarHover(ref.current, false)}
      className={`group relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-slate-800 ${
        disabled ? "cursor-not-allowed opacity-45" : ""
      }`}
    >
      {src ? (
        <img src={src} alt={user.name} className="h-9 w-9 rounded-full object-cover" loading="lazy" />
      ) : (
        <span className="text-[11px] font-semibold text-richblack-25">{initials || "U"}</span>
      )}
      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-[#1e1e2f] bg-emerald-400" />
      <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-500/30 bg-[#151525] px-2 py-0.5 text-[10px] text-gray-200 shadow-lg group-hover:block">
        {user?.name}
      </span>
    </button>
  );
}
