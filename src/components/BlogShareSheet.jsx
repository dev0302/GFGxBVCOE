import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Linkedin, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { sharePostToLinkedIn } from "../utils/blogShare";

const channels = [
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Opens the LinkedIn app if installed, otherwise the website. Post text is copied for you.",
    accent: "#0a66c2",
    Icon: Linkedin,
  },
];

export default function BlogShareSheet({ post, open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const handleShare = async (channelId) => {
    try {
      if (channelId === "linkedin") {
        await sharePostToLinkedIn(post);
        toast.success("LinkedIn opened. Post text is on your clipboard — paste if it is not already filled in.");
        onClose();
      }
    } catch (error) {
      toast.error(error.message || "Could not open LinkedIn.");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-share-title"
        onClick={(event) => event.stopPropagation()}
        className="relative z-10 w-full max-w-md rounded-t-3xl p-5 sm:rounded-3xl sm:p-6"
        style={{
          background: "linear-gradient(160deg, rgba(8,28,16,0.98) 0%, rgba(3,16,9,0.98) 100%)",
          border: "1px solid rgba(120,220,160,0.22)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[1.8px] text-[#4ade80]">
              <Share2 size={13} /> Share story
            </p>
            <h2 id="blog-share-title" className="mt-1 font-audiowide text-lg text-[#eaf7ee]">
              Choose a medium
            </h2>
            <p className="mt-1 line-clamp-2 font-nunito text-sm text-[#7fa88f]">{post?.title}</p>
          </div>
          <button
            type="button"
            aria-label="Close share options"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#8ff0b4] transition hover:bg-white/5"
            style={{ border: "1px solid rgba(120,220,160,0.2)" }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2.5">
          {channels.map((channel) => {
            const Icon = channel.Icon;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => handleShare(channel.id)}
                className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(120,220,160,0.16)",
                }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: channel.accent }}
                >
                  <Icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block font-montserrat text-sm font-semibold text-[#eaf7ee]">
                    {channel.name}
                  </span>
                  <span className="mt-0.5 block font-nunito text-xs text-[#7fa88f]">
                    {channel.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
