import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { animateSuccessBurst } from "./animations";

export default function LiveUploadProgress({ items = [] }) {
  const doneRef = useRef(null);

  useEffect(() => {
    if (!items.length) return;
    const done = items.every((x) => x.progress >= 100);
    if (done) animateSuccessBurst(doneRef.current);
  }, [items]);

  if (!items.length) return null;

  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
          Live transfer
        </p>
        <span ref={doneRef} className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" /> Sync
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.fileId} className="rounded-lg border border-gray-500/20 bg-[#1f2433]/60 p-2">
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-gray-300">
              <span className="truncate">{item.name || "Image"}</span>
              <span>{Math.round(item.progress || 0)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-500/25">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, item.progress || 0))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
