import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink, MoreHorizontal, Minimize2 } from "react-feather";
import { motion, AnimatePresence } from "framer-motion";
import { photoOriginalUrl, avatarPlaceholder } from "../utils/teamMemberUtils";
import { Spinner } from "@/components/ui/spinner";

export default function ImageModal({ open, src, name, onClose }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
    }
  }, [open, src]);

  if (!open || !src) return null;

  const originalSrc = photoOriginalUrl(src) || src;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="relative w-[92vw] max-w-2xl h-[75vh] max-h-[580px] sm:h-[620px] bg-[#161622]/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col p-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* macOS Style Window Header */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-t-xl bg-[#1e1e2d]/80 border-b border-white/10 shrink-0">
            {/* macOS 3 Traffic Dots */}
            <div className="flex items-center gap-2 w-20">
              <button
                type="button"
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 flex items-center justify-center cursor-pointer group shadow-sm transition-all border border-[#e0443e]/40"
                title="Close"
                aria-label="Close modal"
              >
                <X className="h-2 w-2 text-[#4c0000] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 flex items-center justify-center cursor-pointer group shadow-sm transition-all border border-[#dea123]/40"
                title="Minimize"
                aria-label="Minimize modal"
              >
                <Minimize2 className="h-2 w-2 text-[#5c4100] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              {originalSrc ? (
                <a
                  href={originalSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 flex items-center justify-center cursor-pointer group shadow-sm transition-all border border-[#1aab2f]/40"
                  title="Open original photo in new tab"
                  aria-label="Open original photo"
                >
                  <ExternalLink className="h-2 w-2 text-[#003800] opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ) : (
                <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab2f]/40" />
              )}
            </div>

            {/* macOS Window Title */}
            <span className="text-xs font-medium text-gray-300 tracking-wide truncate max-w-[200px] sm:max-w-xs text-center select-none">
              {name || "Photo Viewer"}
            </span>

            {/* Right side iOS 3-dots indicator */}
            <div className="flex items-center justify-end w-20">
              <span className="p-1 rounded-md text-gray-400 opacity-60">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            </div>
          </div>

          {/* Slim Bezel Main Display Viewport */}
          <div className="relative flex-1 w-full h-full min-h-0 flex items-center justify-center p-2 rounded-b-xl bg-black/50 overflow-hidden">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141420]/90 z-10 gap-2.5">
                <Spinner className="size-6 text-gray-400" />
                <span className="text-xs text-gray-400 font-medium tracking-wide">Loading original photo...</span>
              </div>
            )}
            <img
              src={originalSrc}
              alt={name || "Photo"}
              onLoad={() => setLoading(false)}
              onError={(e) => {
                setLoading(false);
                e.target.onerror = null;
                e.target.src = avatarPlaceholder(name);
              }}
              className="w-full h-full object-contain rounded-lg shadow-2xl transition-all"
            />

            {/* iOS Floating Action Bar */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.5)] transition-all">
              {originalSrc && (
                <a
                  href={originalSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-gray-200 hover:text-white font-medium px-2 py-0.5 rounded-full transition-colors"
                  title="Open original quality in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Original</span>
                </a>
              )}
              {originalSrc && <span className="w-px h-3.5 bg-white/20" />}
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 text-xs text-gray-300 hover:text-white font-medium px-2 py-0.5 rounded-full transition-colors"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
                <span>Close</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
