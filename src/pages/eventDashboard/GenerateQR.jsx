import { useMemo, useRef, useState } from "react";
import { Download, Link2, Zap } from "react-feather";
import html2canvas from "html2canvas";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

const DEFAULT_URL = "https://geeksforgeeks.org";
const STORAGE_KEY = "gfg_generate_qr_last";

function getStoredGenerated() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.url || !data?.title) return null;
    return { url: data.url, title: data.title };
  } catch (_) {
    return null;
  }
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

async function downloadSvgAsPng(svgElement, fileName, size) {
  if (!svgElement) throw new Error("QR not available");

  const serialized = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to render QR image"));
      img.src = blobUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(image, 0, 0, size, size);

    const pngUrl = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = pngUrl;
    anchor.download = fileName;
    anchor.click();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}


export default function GenerateQR() {
  
  const [aiDescription, setAiDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [generated, setGenerated] = useState(() => getStoredGenerated());
  const [urlInput, setUrlInput] = useState(() => getStoredGenerated()?.url || "");
const generateAIContent = async () => {
  if (!urlInput.trim()) {
    toast.error("Enter URL first");
    return;
  }

  try {
    setAiLoading(true);

    const res = await fetch(`http://localhost:8080/api/generate-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: normalizeUrl(urlInput) }),
    });

    const contentType = res.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      const text = await res.text();
      console.error("Server returned:", text);
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Request failed");

    // 🔥 KEY PART (AUTO-FILL)
    setTitle(data.title);
    setAiDescription(data.description);

    toast.success("AI content generated ✨");

  } catch (err) {
    toast.error(err.message || "Failed to generate content");
  } finally {
    setAiLoading(false);
  }
};

  const [title, setTitle] = useState(() => getStoredGenerated()?.title || "");
  const [downloadingType, setDownloadingType] = useState(null);

  const normalWrapperRef = useRef(null);
  const stylishPosterRef = useRef(null);

  const qrValue = useMemo(() => normalizeUrl(generated?.url || "") || DEFAULT_URL, [generated]);

  const handleGenerate = () => {
    const enteredUrl = urlInput.trim();
    const enteredTitle = title.trim();
    if (!enteredUrl) {
      toast.error("Enter URL first");
      return;
    }
    if (!enteredTitle) {
      toast.error("Enter title first");
      return;
    }

    const payload = { url: enteredUrl, title: enteredTitle };
    setGenerated(payload);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) { }
    toast.success("QR generated");
  };

  const handleDeleteCurrent = () => {
    setGenerated(null);
    setUrlInput("");
    setTitle("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) { }
    toast.success("Current QR removed");
  };

  const handleDownload = async (type) => {
    try {
      setDownloadingType(type);
      if (type === "stylish") {
        const posterElement = stylishPosterRef.current;
        if (!posterElement) throw new Error("Poster not available");

        const canvas = await html2canvas(posterElement, {
          backgroundColor: null,
          scale: 3,
          useCORS: true,
        });

        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "gfg-stylish-qr-poster.png";
        link.click();
        toast.success("Stylish poster downloaded");
        return;
      }

      const svg = normalWrapperRef.current?.querySelector("svg");
      await downloadSvgAsPng(svg, "gfg-normal-qr.png", 1200);
      toast.success("Normal QR downloaded");
    } catch (error) {
      toast.error(error.message || "Failed to download PNG");
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <div className="flex min-h-full w-full justify-center bg-[#1e1e2f] px-4 pb-20 sm:px-6 lg:px-10">
      <div className="w-full max-w-3xl py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Generate QR</h1>
          <p className="mt-2 text-sm text-gray-400">
            Enter URL and title, then click Generate to reveal two QR designs with smooth animation.
          </p>
        </div>

        <section className="rounded-2xl border border-gray-500/20 bg-gradient-to-br from-[#1e1e2f]/85 to-[#2c2c3e]/85 p-6 shadow-xl md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-200">URL</span>
              <div className="flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-[#252536] px-3 py-2.5 focus-within:border-cyan-400">
                <Link2 className="h-4 w-4 text-cyan-400" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-200">Stylish card title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="GFG BVCOE"
                className="w-full rounded-xl border border-gray-500/35 bg-[#252536] px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-cyan-400"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              className="rounded-xl bg-cyan-500/20 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/30"
            >
              Generate QR
            </button>
            <button
              type="button"
              onClick={handleDeleteCurrent}
              disabled={!generated}
              className="rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete current QRs
            </button>
            <button
              type="button"
              onClick={generateAIContent}
              className="rounded-xl bg-purple-500/20 px-4 py-2.5 text-sm font-semibold text-purple-300 hover:bg-purple-500/30"
            >
              {aiLoading ? "Generating..." : "✨ Generate AI Description"}
            </button>
            {aiDescription && (
              <div className="mt-4 rounded-xl border border-purple-400/30 bg-purple-500/10 p-4">
                <p className="text-sm text-purple-200">{aiDescription}</p>
              </div>
            )}
            {generated && (
              <p className="text-xs text-gray-500">
                Last generated: <span className="text-gray-300">{qrValue}</span>
              </p>
            )}
          </div>
        </section>

        <AnimatePresence mode="wait">
          {generated ? (
            <motion.div
              key="generated-result"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mt-8 grid gap-6 lg:grid-cols-2"
            >
              <motion.article
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05, duration: 0.35 }}
                className="rounded-2xl border border-gray-500/20 bg-[#222233] p-6 shadow-lg"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Normal QR</h2>
                    <p className="text-xs text-gray-400">Classic high-contrast QR code</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload("normal")}
                    disabled={downloadingType !== null}
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloadingType === "normal" ? "Creating image..." : "Download PNG"}
                  </button>
                </div>

                <div className="grid place-items-center rounded-xl border border-gray-500/20 bg-white p-4" ref={normalWrapperRef}>
                  <QRCodeSVG value={qrValue} size={240} level="H" includeMargin bgColor="#ffffff" fgColor="#000000" />
                </div>
              </motion.article>

              <motion.article
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12, duration: 0.35 }}
                className="relative overflow-hidden rounded-2xl border border-gray-500/20 bg-[#121212] p-6 shadow-[0_0_50px_-20px_rgba(47,141,70,0.45)]"
              >
                <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                      <Zap className="h-4 w-4 text-[#2f8d46]" />
                      Stylish QR
                    </h2>
                    <p className="text-xs text-gray-400">Cyber glassmorphism style poster</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload("stylish")}
                    disabled={downloadingType !== null}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#2f8d46]/35 bg-[#2f8d46]/10 px-3 py-2 text-xs font-medium text-[#7ef3a0] transition-colors hover:bg-[#2f8d46]/20"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloadingType === "stylish" ? "Creating poster..." : "Download Poster PNG"}
                  </button>
                </div>

                <div ref={stylishPosterRef} className="relative z-10 overflow-hidden rounded-[30px] border border-white/10 bg-[#121212] p-6">
                  <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-25" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 85h180l48-45h260" stroke="#2f8d46" fill="none" strokeWidth="1" />
                    <circle cx="495" cy="40" r="3" fill="#2f8d46" />
                    <path d="M520 430h-180l-40 36h-230" stroke="#2f8d46" fill="none" strokeWidth="1" />
                    <circle cx="250" cy="466" r="3" fill="#2f8d46" />
                  </svg>

                  <div className="relative rounded-[32px] bg-gradient-to-br from-[#2f8d46]/30 to-transparent p-1 shadow-2xl">
                    <div className="relative flex flex-col items-center gap-6 rounded-[30px] border border-white/10 bg-[#1a1a1a]/90 p-7 backdrop-blur-xl">
                      <div className="absolute left-7 top-7 h-10 w-10 rounded-tl-xl border-l-2 border-t-2 border-[#2f8d46] opacity-60" />
                      <div className="absolute right-7 top-7 h-10 w-10 rounded-tr-xl border-r-2 border-t-2 border-[#2f8d46] opacity-60" />

                      <div className="rounded-2xl bg-[#2f8d46] p-4 shadow-[0_0_20px_rgba(47,141,70,0.4)]">
                        <QRCodeSVG
                          value={qrValue}
                          size={200}
                          bgColor="#2f8d46"
                          fgColor="#121212"
                          level="H"
                          includeMargin={false}
                        />
                      </div>

                      <div className="text-center">
                        <h3 className="text-xl font-bold uppercase italic tracking-widest text-white">
                          {generated.title || "GFG BVCOE"}
                        </h3>
                        <div className="mt-2 flex items-center justify-center gap-2 text-[#2f8d46]">
                          <span className="font-mono text-xs">&lt;/&gt;</span>
                          <div className="h-[1px] w-12 bg-[#2f8d46]/40" />
                          <span className="text-[10px] uppercase tracking-tight opacity-70">Connect Tech</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            </motion.div>
          ) : (
            <motion.div
              key="empty-placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 rounded-2xl border border-dashed border-gray-500/30 bg-[#202031]/60 p-8 text-center"
            >
              <p className="text-sm text-gray-400">
                Fill URL and title, then click <span className="text-cyan-300 font-semibold">Generate QR</span> to display both QR cards.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {downloadingType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] grid place-items-center bg-black/55 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md rounded-2xl border border-white/15 bg-gradient-to-br from-[#1f2032] to-[#23243a] p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold tracking-wide text-white">
                  {downloadingType === "stylish" ? "Generating Stylish Poster" : "Generating QR Image"}
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-cyan-300">
                  Processing
                </span>
              </div>

              <div className="relative mb-5 h-28 overflow-hidden rounded-xl border border-gray-500/30 bg-[#131420]">
                <motion.div
                  className="absolute inset-y-0 left-[-40%] w-[40%] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
                  animate={{ x: ["0%", "360%"] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.4, ease: "linear" }}
                />
                <motion.div
                  className="absolute left-4 top-5 h-16 w-16 rounded-lg border border-cyan-400/40 bg-cyan-400/10"
                  animate={{ opacity: [0.35, 1, 0.35], scale: [0.96, 1.04, 0.96] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.1, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute right-4 top-5 h-16 w-24 rounded-lg border border-[#2f8d46]/40 bg-[#2f8d46]/10"
                  animate={{ opacity: [1, 0.4, 1], y: [0, -2, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.1, ease: "easeInOut", delay: 0.2 }}
                />
                <motion.div
                  className="absolute bottom-4 left-4 h-2 rounded-full bg-cyan-300/70"
                  animate={{ width: ["10%", "88%", "10%"] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.7, ease: "easeInOut" }}
                />
              </div>

              <p className="text-xs text-gray-300">
                Creating high quality PNG. This takes a moment...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
