import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, FileText, X } from "react-feather";
import { Spinner } from "@/components/ui/spinner";
import { downloadLeadershipReport, fetchLeadershipReportBlob } from "../../services/api";

export function LeadershipReportPdfViewer({ sessionId, open, onClose }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open || !sessionId) {
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
      setPdfUrl(null);
      try {
        const blob = await fetchLeadershipReportBlob(sessionId, { signal: controller.signal });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
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
  }, [open, sessionId]);

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

              {pdfUrl && !loading && !error && (
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
