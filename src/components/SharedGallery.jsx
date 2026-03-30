import { Trash2 } from "lucide-react";
import { useRef } from "react";
import { animateThumbIn } from "./realtimeUpload/animations";

export default function SharedGallery({ images = [], onRemove }) {
  const seen = useRef(new Set());

  return (
    <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.04] p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300/85">
        Shared Gallery Sync
      </p>
      {!images.length ? (
        <p className="text-xs text-gray-500">No images uploaded</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {images.map((img) => (
            <div
              key={img.fileId}
              ref={(node) => {
                if (!node) return;
                if (!seen.current.has(img.fileId)) {
                  seen.current.add(img.fileId);
                  animateThumbIn(node);
                }
              }}
              className="group relative aspect-square overflow-hidden rounded-lg border border-gray-500/25 bg-[#1f2433]"
            >
              {img.preview ? (
                <img src={img.preview} alt={img.name || ""} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
                  waiting
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemove?.(img)}
                className="absolute right-1.5 top-1.5 hidden h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white group-hover:flex"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

