import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, FileText, X } from "react-feather";
import { Spinner } from "@/components/ui/spinner";
import { downloadLeadershipReport, fetchLeadershipReportBlob } from "../../services/api";

function PdfCanvasViewer({ blob }) {
  const containerRef = useRef(null);
  const [rendering, setRendering] = useState(true);
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let pdfDoc = null;

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const arrayBuffer = await blob.arrayBuffer();
        pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (cancelled) return;

          const page = await pdfDoc.getPage(pageNum);
          const containerWidth = container.clientWidth || window.innerWidth - 32;
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = Math.max(containerWidth / baseViewport.width, 1);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "mx-auto mb-4 block max-w-full rounded-lg bg-white shadow-lg";

          const context = canvas.getContext("2d");
          await page.render({ canvasContext: context, viewport }).promise;

          const wrapper = document.createElement("div");
          wrapper.className = "flex justify-center";
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);
        }
      } catch (err) {
        if (!cancelled) setRenderError(err.message || "Failed to render PDF");
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
      pdfDoc?.destroy?.();
    };
  }, [blob]);

  if (renderError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-red-300">{renderError}</p>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {rendering && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#12121f]">
          <Spinner className="size-6 text-cyan-400" />
          <p className="text-sm font-light text-gray-500">Rendering report…</p>
        </div>
      )}
      <div ref={containerRef} className="h-full overflow-y-auto p-3 sm:p-4" />
    </div>
  );
}

function shouldUseCanvasPdfViewer() {
  if (typeof window === "undefined") return true;
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod|webOS|IEMobile|Opera Mini/i.test(ua)) return true;
  // iPadOS reports as Mac with touch points.
  if (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) return true;
  return window.matchMedia("(max-width: 768px)").matches && navigator.maxTouchPoints > 0;
}

export function LeadershipReportPdfViewer({ sessionId, open, onClose }) {
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const useCanvasViewer = shouldUseCanvasPdfViewer();

  useEffect(() => {
    if (!open || !sessionId) {
      setPdfBlob(null);
      setPdfUrl(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let objectUrl = null;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);
      setPdfBlob(null);
      setPdfUrl(null);
      try {
        const blob = await fetchLeadershipReportBlob(sessionId, { signal: controller.signal });
        if (cancelled) return;
        setPdfBlob(blob);
        if (!useCanvasViewer) {
          objectUrl = URL.createObjectURL(blob);
          setPdfUrl(objectUrl);
        }
      } catch (err) {
        if (!cancelled && err.name !== "AbortError") {
          setError(err.message || "Failed to load report");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, sessionId, useCanvasViewer]);

  const handleDownload = async () => {
    if (!sessionId || downloading) return;
    setDownloading(true);
    try {
      await downloadLeadershipReport(sessionId);
    } catch (err) {
      setError(err.message || "Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && sessionId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex flex-col bg-black/70 py-12 px-6 backdrop-blur-sm sm:p-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1e1e2f] shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                  <FileText className="h-4 w-4 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xs font-normal text-richblack-25 sm:text-base">
                    Leadership transition report
                  </h2>
                  <p className="truncate font-mono text-[11px] font-light text-gray-500">{sessionId}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={loading || downloading || Boolean(error)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-normal text-emerald-200 hover:bg-emerald-500/15 disabled:opacity-50 sm:text-sm"
                >
                  {downloading ? (
                    <Spinner className="size-3.5 text-emerald-200" />
                  ) : (
                    <Download className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                  )}
                  Download
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="group flex h-6 w-6 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-red-500/90 transition-all duration-200 hover:bg-red-600 hover:scale-105 active:scale-95 shadow-sm"
                  aria-label="Close report viewer"
                >
                  <X className="h-4 w-4 text-white transition-opacity group-hover:opacity-100" />
                </button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 bg-[#12121f]">
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Spinner className="size-6 text-cyan-400" />
                  <p className="text-sm font-light text-gray-500">Loading report…</p>
                </div>
              )}

              {error && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <p className="text-sm text-red-300">{error}</p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-gray-500/30 px-4 py-1.5 text-sm text-gray-300 hover:bg-white/[0.04]"
                  >
                    Close
                  </button>
                </div>
              )}

              {pdfBlob && !loading && !error && useCanvasViewer && (
                <PdfCanvasViewer blob={pdfBlob} />
              )}

              {pdfUrl && !loading && !error && !useCanvasViewer && (
                <iframe
                  title={`Leadership report ${sessionId}`}
                  src={pdfUrl}
                  className="h-full w-full border-0 bg-white"
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
