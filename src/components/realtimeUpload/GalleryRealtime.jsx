import { useEffect, useRef } from "react";
import { animateThumbIn } from "./animations";

export default function GalleryRealtime({ images = [] }) {
  const refs = useRef({});

  useEffect(() => {
    images.forEach((img) => {
      const el = refs.current[img.fileId];
      if (el && !el.dataset.animated) {
        el.dataset.animated = "1";
        animateThumbIn(el);
      }
    });
  }, [images]);

  if (!images.length) return null;

  return (
    <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.04] p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300/85">
        Live incoming images
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {images.map((img) => (
          <div
            key={img.fileId}
            ref={(node) => {
              refs.current[img.fileId] = node;
            }}
            className="relative aspect-square overflow-hidden rounded-lg border border-gray-500/25 bg-[#1f2433]"
          >
            {img.preview ? (
              <img src={img.preview} alt={img.name || ""} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
                waiting
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
