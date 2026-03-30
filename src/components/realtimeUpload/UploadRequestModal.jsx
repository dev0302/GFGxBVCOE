import { useEffect, useRef, useState } from "react";
import { X, UploadCloud } from "lucide-react";
import { animateModalOpen } from "./animations";

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadRequestModal({
  open,
  request,
  onClose,
  onLocalAddFiles,
  onEmitProgress,
  onEmitComplete,
  onEmitNewImage,
}) {
  const fileRef = useRef(null);
  const modalRef = useRef(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) animateModalOpen(modalRef.current);
  }, [open]);

  if (!open || !request) return null;

  const handleFiles = async (incoming) => {
    const files = Array.from(incoming || []).filter((f) => f?.type?.startsWith("image/"));
    if (!files.length) return;
    setBusy(true);
    onLocalAddFiles?.(files);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${request.requestId}-${i}-${Date.now()}`;
      for (let p = 8; p <= 100; p += 16) {
        onEmitProgress?.({ requestId: request.requestId, fileId, name: file.name, progress: Math.min(p, 100) });
        await new Promise((r) => setTimeout(r, 90));
      }
      const preview = await toDataUrl(file).catch(() => "");
      onEmitNewImage?.({
        requestId: request.requestId,
        fileId,
        name: file.name,
        preview,
      });
    }

    onEmitComplete?.({ requestId: request.requestId, total: files.length });
    setBusy(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-md rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-richblack-25">Upload Images for Event</h3>
            <p className="mt-1 text-xs text-gray-400">
              Requested by {request.senderName || "a teammate"}.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-500/30 p-1.5 text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
          className="group flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cyan-400/30 bg-cyan-400/[0.05] px-4 py-10 text-center transition hover:border-cyan-400/55 hover:bg-cyan-400/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UploadCloud className="h-7 w-7 text-cyan-300" />
          <p className="text-sm font-medium text-gray-200">Drop images or click to choose</p>
          <p className="text-xs text-gray-500">
            {busy ? "Transferring..." : "Images appear live to requester"}
          </p>
        </button>
      </div>
    </div>
  );
}
