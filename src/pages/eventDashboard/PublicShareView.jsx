import { useState, useEffect } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { Folder, FileText, Download, Eye, Share2, ExternalLink, X, File, Image as ImageIcon, Info, Lock, Unlock } from "react-feather";
import { motion } from "framer-motion";
import logo from "../../images/gfgLogo.png";
import { getPublicVaultShareItems, getVaultItems } from "../../services/api";

const STORAGE_KEY = "gfg_event_vault_documents_v2";

function getInlinePdfUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (url.includes("cloudinary.com") && url.includes("/raw/upload/")) {
    return url.replace("/raw/upload/", "/image/upload/f_pdf/");
  }
  return url;
}

function getCloudinaryAvatarUrl(avatarUrl, rawName) {
  let name = rawName || "User";
  if (name.includes("@")) {
    name = name.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  if (avatarUrl && typeof avatarUrl === "string" && avatarUrl.startsWith("http")) {
    if (avatarUrl.includes("cloudinary.com")) {
      if (avatarUrl.includes("w_64,h_64")) return avatarUrl;
      if (avatarUrl.includes("/upload/")) {
        return avatarUrl.replace("/upload/", "/upload/w_64,h_64,c_fill,g_face,f_auto,q_auto/");
      }
    }
    return avatarUrl;
  }
  const safeName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${safeName}&background=0284c7&color=fff&bold=true`;
}

function DocumentPreviewViewer({ previewDoc }) {
  const [viewerType, setViewerType] = useState("native"); // 'native' | 'google' | 'office'

  if (!previewDoc || !previewDoc.url) return null;
  const name = (previewDoc.name || "").toLowerCase();
  const type = (previewDoc.type || "").toLowerCase();
  const url = previewDoc.url;

  const isImage = type.includes("image") || /\.(png|jpe?g|webp|gif|svg|bmp|heic|avif)$/i.test(name);
  const isVideo = type.includes("video") || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(name);
  const isAudio = type.includes("audio") || /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(name);
  const isPdf = type.includes("pdf") || name.endsWith(".pdf");
  const isWord = /\.(docx?|doc|odt)$/i.test(name) || type.includes("word") || type.includes("officedocument.wordprocessingml");
  const isExcel = /\.(xlsx?|xls|ods|csv)$/i.test(name) || type.includes("sheet") || type.includes("excel");
  const isPowerPoint = /\.(pptx?|ppt|odp)$/i.test(name) || type.includes("presentation") || type.includes("powerpoint");

  // 1. Image
  if (isImage) {
    return (
      <img
        src={url}
        alt={previewDoc.name}
        className="w-full h-full object-contain rounded-lg shadow-xl"
      />
    );
  }

  // 2. Video
  if (isVideo) {
    return (
      <video
        controls
        autoPlay
        src={url}
        className="w-full h-full max-h-full rounded-lg shadow-xl object-contain"
      >
        Your browser does not support playing this video.
      </video>
    );
  }

  // 3. Audio
  if (isAudio) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-[#1a1a28] border border-white/10 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 animate-pulse">
          🎵
        </div>
        <p className="text-sm font-semibold text-gray-200">{previewDoc.name}</p>
        <audio controls src={url} className="w-full max-w-md" />
      </div>
    );
  }

  // 4. PDF Viewers (Native Browser PDF + Google PDF Engine option)
  if (isPdf) {
    const inlinePdf = getInlinePdfUrl(url);
    const googlePdfViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    const targetPdfUrl = viewerType === "google" ? googlePdfViewerUrl : inlinePdf;

    return (
      <div className="w-full h-full relative rounded-lg overflow-hidden border border-white/10 bg-[#1a1a28] flex flex-col">
        <div className="px-3 py-1.5 bg-[#141420] border-b border-white/10 flex items-center justify-between text-[11px] text-gray-300 shrink-0 flex-wrap gap-2">
          <span className="font-semibold text-gray-200 flex items-center gap-1.5">
            <span>📄</span> PDF Document Viewer
          </span>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-gray-400">View Mode:</span>
            <button
              type="button"
              onClick={() => setViewerType("native")}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewerType !== "google" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              Native PDF
            </button>
            <button
              type="button"
              onClick={() => setViewerType("google")}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewerType === "google" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              Google Engine
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-cyan-300 font-semibold border border-white/10 transition-colors"
            >
              Open Direct PDF ↗
            </a>
          </div>
        </div>

        <div className="relative flex-1 w-full h-full bg-white overflow-hidden">
          <iframe
            src={targetPdfUrl}
            className="w-full h-full border-0 bg-white"
            title={previewDoc.name}
          />
        </div>
      </div>
    );
  }

  // 5. Office Documents (Word, Excel, PowerPoint) / Google Docs Viewer / Office Online Viewer
  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  const targetViewerUrl = viewerType === "office" ? officeViewerUrl : googleViewerUrl;

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border border-white/10 bg-[#1a1a28] flex flex-col">
      <div className="px-3 py-1.5 bg-[#141420] border-b border-white/10 flex items-center justify-between text-[11px] text-gray-300 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-200">
            {isWord ? "📄 Word Document" : isExcel ? "📊 Excel Spreadsheet" : isPowerPoint ? "📊 Presentation" : "📁 Document"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-gray-400">Engine:</span>
          <button
            type="button"
            onClick={() => setViewerType("google")}
            className={`px-2 py-0.5 rounded transition-colors ${
              viewerType !== "office" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => setViewerType("office")}
            className={`px-2 py-0.5 rounded transition-colors ${
              viewerType === "office" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Office Online
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-cyan-300 font-semibold border border-white/10 transition-colors"
          >
            Open Original ↗
          </a>
        </div>
      </div>

      <div className="relative flex-1 w-full h-full bg-[#1a1a28] overflow-hidden">
        <iframe
          src={targetViewerUrl}
          className="w-full h-full border-0 bg-white"
          title={previewDoc.name}
        />
      </div>
    </div>
  );
}

export default function PublicShareView() {
  const { shareToken } = useParams();
  const [searchParams] = useSearchParams();
  const nameParam = searchParams.get("name") || "Shared Vault Item";

  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [infoTarget, setInfoTarget] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (shareToken) {
          const res = await getPublicVaultShareItems(shareToken);
          if (res?.success) {
            setDocuments(res.documents || []);
            setFolders(res.folders || []);
            return;
          }
        }
        // Fallback: fetch all public vault items
        const allRes = await getVaultItems();
        if (allRes?.success) {
          setDocuments(allRes.documents || []);
          setFolders(allRes.folders || []);
        }
      } catch (err) {
        console.error("Failed to load public shared items:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [shareToken]);

  return (
    <div className=" i-fonts min-h-screen bg-[#0d0d16] text-gray-100 flex flex-col p-3 sm:p-8 pt-8 sm:pt-14">
      {/* Header Bar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between border-b border-white/10 pb-4 sm:pb-6 gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <img src={logo} alt="GFG Logo" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-green-300/40 shadow-lg shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-green-100 to-cyan-400 truncate">
              GFGxBVCOE Document Vault
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-400 truncate">Public Shared Access</p>
          </div>
        </div>

        <Link
          to="/"
          className="i-fonts px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] sm:text-xs font-semibold text-white transition-all shrink-0"
        >
          Go to Website →
        </Link>
      </div>

      {/* Main macOS Styled Container */}
      <main className="max-w-5xl mx-auto w-full flex-1 pt-4 sm:pt-8 space-y-4 sm:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-[#161624]/90 border border-white/15 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col p-1.5"
        >
          {/* macOS Window Header */}
          <div className=" i-fonts flex items-center justify-between px-4 py-3 rounded-t-xl bg-[#1e1e2d]/90 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
              <Folder className="h-4 w-4 text-cyan-400" />
              <span>{nameParam}</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Public Link
            </span>
          </div>

          {/* Shared Files Grid */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Shared Documents ({documents.length})</span>
              <span>ReadOnly Access</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {documents.map((doc) => {
                const isPdf = doc.type?.includes("pdf");
                const isImg = doc.type?.includes("image");

                return (
                  <div
                    key={doc.id || doc._id}
                    onClick={() => setPreviewDoc(doc)}
                    className="p-4 rounded-xl bg-[#181827] border border-white/10 hover:border-cyan-400/50 hover:bg-[#1c1c30] cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                          isPdf
                            ? "bg-red-500/15 border-red-500/30 text-red-400"
                            : isImg
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : "bg-blue-500/15 border-blue-500/30 text-blue-400"
                        }`}
                      >
                        {isPdf ? <FileText className="h-5 w-5" /> : isImg ? <ImageIcon className="h-5 w-5" /> : <File className="h-5 w-5" />}
                      </div>

                      {/* Always Visible Top Right Action Buttons */}
                      <div className="flex items-center gap-1 opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDoc(doc);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                          title="View Document"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInfoTarget({ type: "doc", item: doc });
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                          title="Details & Metadata"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-200 group-hover:text-cyan-200 truncate">
                          {doc.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{doc.size || "Cloudinary Asset"}</p>
                      </div>

                      {/* Uploader Avatar & Full Name Badge */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px]">
                        <div
                          className="flex items-center gap-1.5 min-w-0 flex-1 pr-1"
                          title={`Uploaded by ${doc.createdBy} ${doc.createdByEmail ? `(${doc.createdByEmail})` : ""}`}
                        >
                          <img
                            src={getCloudinaryAvatarUrl(doc.createdByAvatar, doc.createdBy)}
                            alt={doc.createdBy || "Uploader"}
                            className="w-4 h-4 rounded-full border border-cyan-400/40 object-cover shrink-0"
                          />
                          <span className="truncate text-gray-300 font-medium">{doc.createdBy || "Member"}</span>
                        </div>
                        {/* Lock Status Indicator in bottom right */}
                        <div
                          className="p-0.5 text-gray-400 shrink-0"
                          title={doc.isLocked ? `Locked by ${doc.lockedBy || "uploader"}` : "Unlocked"}
                        >
                          {doc.isLocked ? (
                            <Lock className="h-3.5 w-3.5 text-amber-400" />
                          ) : (
                            <Unlock className="h-3.5 w-3.5 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Details & Metadata Modal */}
      {infoTarget && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setInfoTarget(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-md bg-[#161622]/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl overflow-hidden flex flex-col p-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-t-xl bg-[#1e1e2d]/90 border-b border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInfoTarget(null)}
                  className="w-3 h-3 rounded-full bg-[#ff5f56]"
                />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <span className="text-xs font-semibold text-gray-200">File Metadata Details</span>
              <button type="button" onClick={() => setInfoTarget(null)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-white truncate">{infoTarget.item.name}</h5>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                    {infoTarget.item.type || "Cloudinary Asset"}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-gray-300">
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Uploaded By</span>
                  <div className="flex items-center gap-2">
                    <img
                      src={getCloudinaryAvatarUrl(
                        infoTarget.item.createdByAvatar,
                        infoTarget.item.createdBy || infoTarget.item.uploadedBy || "Event Management Member"
                      )}
                      alt={infoTarget.item.createdBy || "Uploader"}
                      className="w-5 h-5 rounded-full border border-cyan-400/40 object-cover shadow-sm"
                    />
                    <span className="font-semibold text-cyan-300">
                      {infoTarget.item.createdBy || infoTarget.item.uploadedBy || "Event Management Member"}
                    </span>
                  </div>
                </div>
                {infoTarget.item.createdByEmail && (
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-gray-400">Uploader Email</span>
                    <span className="font-mono text-cyan-200/90 text-[11px]">{infoTarget.item.createdByEmail}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Date & Timestamp</span>
                  <span className="font-mono text-gray-200">
                    {infoTarget.item.createdAt
                      ? new Date(infoTarget.item.createdAt).toLocaleString()
                      : "Recently"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">File Size</span>
                  <span className="font-mono text-emerald-300">{infoTarget.item.size || "Unknown"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Lock Protection</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                      infoTarget.item.isLocked
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {infoTarget.item.isLocked
                      ? `Locked by ${infoTarget.item.lockedBy || "Uploader"}`
                      : "Unlocked"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInfoTarget(null)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                >
                  Close Details
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* macOS Document Viewer Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md"
          onClick={() => setPreviewDoc(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-[94vw] max-w-4xl h-[82vh] max-h-[720px] bg-[#161622]/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl overflow-hidden flex flex-col p-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* macOS Header */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-t-xl bg-[#1e1e2d]/90 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="w-3 h-3 rounded-full bg-[#ff5f56]"
                />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>

              <div className="flex items-center gap-2 max-w-md min-w-0">
                <img
                  src={getCloudinaryAvatarUrl(
                    previewDoc.createdByAvatar,
                    previewDoc.createdBy || previewDoc.uploadedBy || "Event Management Member"
                  )}
                  alt={previewDoc.createdBy || "Uploader"}
                  className="w-5 h-5 rounded-full border border-cyan-400/40 object-cover shadow-sm shrink-0"
                />
                <span className="text-xs font-semibold text-gray-200 truncate">{previewDoc.name}</span>
                <span className="text-[10px] text-cyan-300/80 truncate hidden sm:inline">
                  by {previewDoc.createdBy || previewDoc.uploadedBy || "Member"} {previewDoc.createdByEmail ? `(${previewDoc.createdByEmail})` : ""}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-md text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Viewport */}
            <div className="relative flex-1 w-full h-full min-h-0 bg-black/60 rounded-b-xl overflow-hidden flex items-center justify-center p-3">
              <DocumentPreviewViewer previewDoc={previewDoc} />

              {/* Download Bar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                {previewDoc.url && (
                  <a
                    href={previewDoc.url}
                    download={previewDoc.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-cyan-300 font-semibold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download File</span>
                  </a>
                )}
                <span className="w-px h-3.5 bg-white/20" />
                <button
                  type="button"
                  onClick={() => setInfoTarget({ type: "doc", item: previewDoc })}
                  className="flex items-center gap-1.5 text-xs text-gray-200 hover:text-cyan-300 font-medium"
                >
                  <Info className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Details</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
