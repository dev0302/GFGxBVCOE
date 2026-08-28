import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Folder, ChevronRight, Upload, LogIn, Check, AlertCircle, File as FileIcon, FileText, Image as ImageIcon, RefreshCw, ArrowLeft } from "react-feather";
import { useAuth } from "../context/AuthContext";
import { getVaultItems, uploadVaultDocument } from "../services/api";
import { getShareFile, deleteShareFile, clearStaleShareFiles } from "../utils/shareFileStore";
import { Spinner } from "@/components/ui/spinner";

const MAX_FILE_SIZE = 200 * 1024 * 1024;

const ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt"];

const LOCAL_TEST_FOLDERS = [
  { _id: "local-gfg-events", id: "local-gfg-events", name: "GFG Events", parentId: null },
  { _id: "local-sih", id: "local-sih", name: "SIH 2026", parentId: "local-gfg-events" },
  { _id: "local-workshops", id: "local-workshops", name: "Workshops", parentId: "local-gfg-events" },
  { _id: "local-resources", id: "local-resources", name: "Resources", parentId: null },
  { _id: "local-dsa", id: "local-dsa", name: "DSA", parentId: "local-resources" },
  { _id: "local-webdev", id: "local-webdev", name: "Web Development", parentId: "local-resources" },
];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function isAllowedFile(file) {
  if (!file) return false;
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (ALLOWED_MIMES.includes(type)) return true;
  return ALLOWED_EXTS.some((ext) => name.endsWith(ext));
}

function fileIcon(file) {
  const name = (file?.name || "").toLowerCase();
  const type = (file?.type || "").toLowerCase();
  if (type.includes("image") || /\.(png|jpe?g|webp|gif)$/i.test(name))
    return <ImageIcon className="h-4 w-4 text-emerald-400" />;
  if (type.includes("pdf") || name.endsWith(".pdf")) return <FileText className="h-4 w-4 text-red-400" />;
  return <FileIcon className="h-4 w-4 text-emerald-300" />;
}

function prettyType(file) {
  const name = (file?.name || "").toLowerCase();
  const type = (file?.type || "").toLowerCase();
  if (type.includes("image") || /\.(png|jpe?g|webp|gif)$/i.test(name)) return "Image";
  if (type.includes("pdf") || name.endsWith(".pdf")) return "PDF";
  if (/\.(docx?)$/i.test(name)) return "Word";
  if (/\.(pptx?)$/i.test(name)) return "Presentation";
  if (/\.(xlsx?|xls)$/i.test(name)) return "Spreadsheet";
  if (type.includes("text") || name.endsWith(".txt")) return "Text";
  return type ? type.split("/").pop().toUpperCase() : "File";
}

function isImageFile(file) {
  if (!file) return false;
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  return type.includes("image") || /\.(png|jpe?g|webp|gif)$/i.test(name);
}

// Intelligent truncation: preserve extension, truncate middle of basename
function displayFilename(name, maxBase = 22) {
  if (!name) return "";
  const dot = name.lastIndexOf(".");
  if (dot === -1 || dot === 0) {
    return name.length > maxBase + 8 ? `${name.slice(0, maxBase)}…` : name;
  }
  const base = name.slice(0, dot);
  const ext = name.slice(dot); // includes dot
  if (base.length <= maxBase) return name;
  return `${base.slice(0, maxBase)}…${ext}`;
}

export default function ShareTarget() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const shareId = searchParams.get("id") || "";
  const isLocalTest = import.meta.env.DEV;

  const [pendingFile, setPendingFile] = useState(null);
  const [pendingMeta, setPendingMeta] = useState(null);
  const [loadingFile, setLoadingFile] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [folders, setFolders] = useState([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [foldersError, setFoldersError] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [thumbUrl, setThumbUrl] = useState(null);
  const [showFullName, setShowFullName] = useState(false);

  const breadcrumbs = useMemo(() => {
    const list = [];
    let curr = currentFolderId;
    while (curr) {
      const found = folders.find((f) => (f._id || f.id) === curr);
      if (found) {
        list.unshift(found);
        curr = found.parentId;
      } else break;
    }
    return list;
  }, [currentFolderId, folders]);

  const currentFolders = useMemo(() => {
    return folders.filter((f) => (f.parentId || null) === (currentFolderId || null));
  }, [folders, currentFolderId]);

  // Thumbnail for images — use local Blob only, revoke on unmount/change
  useEffect(() => {
    if (!pendingFile || !isImageFile(pendingFile)) {
      setThumbUrl(null);
      return;
    }
    let url = null;
    try {
      url = URL.createObjectURL(pendingFile);
      setThumbUrl(url);
    } catch {
      setThumbUrl(null);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [pendingFile]);

  useEffect(() => {
    let cancelled = false;
    clearStaleShareFiles();
    async function load() {
      setLoadingFile(true);
      setLoadError("");
      if (!shareId) {
        setLoadingFile(false);
        setLoadError("No shared file found. Please share a file again from your Gallery or Files app after installing the GFG BVCOE PWA.");
        return;
      }
      try {
        const rec = await getShareFile(shareId);
        if (cancelled) return;
        if (!rec || !rec.blob) {
          setLoadError("This shared file has expired or was already saved. Please share again.");
          return;
        }
        const blob = rec.blob;
        const GlobalFile = typeof globalThis !== "undefined" ? globalThis.File : undefined;
        const isFileInstance = (() => {
          if (GlobalFile) {
            try { return blob instanceof GlobalFile; } catch { return false; }
          }
          return blob && typeof blob.name === "string" && typeof blob.size === "number";
        })();
        const file = isFileInstance
          ? blob
          : (() => {
              if (GlobalFile) {
                try { return new GlobalFile([blob], rec.name || blob.name || "shared-file", { type: rec.type || blob.type || "application/octet-stream" }); } catch { return blob; }
              }
              return blob;
            })();
        const actualFile = file && file.size ? file : blob;
        if (actualFile.size > MAX_FILE_SIZE) {
          setValidationError(`File too large (${formatBytes(actualFile.size)}). Maximum allowed is ${formatBytes(MAX_FILE_SIZE)}.`);
        } else if (!isAllowedFile(actualFile)) {
          setValidationError(`Unsupported file type "${actualFile.type || "unknown"}". Supported: JPG, PNG, WEBP, GIF, PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, TXT.`);
        } else {
          setValidationError("");
        }
        setPendingFile(actualFile);
        setPendingMeta(rec);
      } catch (e) {
        if (!cancelled) setLoadError(e.message || "Failed to load shared file.");
      } finally {
        if (!cancelled) setLoadingFile(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [shareId]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    async function fetchFolders() {
      try {
        setFoldersLoading(true);
        setFoldersError("");
        const data = await getVaultItems();
        if (!cancelled && data?.success) {
          setFolders(data.folders || []);
        }
      } catch (e) {
        if (!cancelled) {
          if (isLocalTest) {
            setFolders(LOCAL_TEST_FOLDERS);
            setFoldersError("");
          } else {
            setFoldersError(e.message || "Failed to load folders");
          }
        }
      } finally {
        if (!cancelled) setFoldersLoading(false);
      }
    }
    fetchFolders();
    return () => { cancelled = true; };
  }, [authLoading, isLocalTest]);

  const selectedFolder = useMemo(() => {
    if (currentFolderId === null) return null;
    return folders.find((f) => (f._id || f.id) === currentFolderId) || null;
  }, [currentFolderId, folders]);

  const handleCancel = async () => {
    if (shareId) await deleteShareFile(shareId).catch(() => {});
    navigate("/", { replace: true });
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (pendingFile.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Max ${formatBytes(MAX_FILE_SIZE)}.`);
      return;
    }
    if (!isAllowedFile(pendingFile)) {
      toast.error("Unsupported file type.");
      return;
    }
    if (isLocalTest) {
      try {
        setUploading(true);
        await new Promise((r) => setTimeout(r, 400));
        setSuccess({ name: pendingFile.name });
        toast.success(`Saved to "${selectedFolder ? selectedFolder.name : "Root Vault"}" (local test mode)`);
        if (shareId) await deleteShareFile(shareId).catch(() => {});
      } finally {
        setUploading(false);
      }
      return;
    }
    if (!user) {
      toast.error("Please log in to save to Document Vault.");
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", pendingFile, pendingFile.name);
      if (currentFolderId) fd.append("folderId", currentFolderId);
      const res = await uploadVaultDocument(fd);
      if (res?.success) {
        const doc = res.document || (res.documents && res.documents[0]);
        setSuccess(doc || { name: pendingFile.name });
        toast.success(`Saved "${pendingFile.name}" to ${selectedFolder ? selectedFolder.name : "Root Vault"}!`);
        if (shareId) await deleteShareFile(shareId).catch(() => {});
        setTimeout(() => navigate("/em-dashboard/documents"), 1200);
      } else {
        throw new Error(res?.message || "Upload failed");
      }
    } catch (e) {
      toast.error(e.message || "Failed to upload to Document Vault");
    } finally {
      setUploading(false);
    }
  };

  const isUnauthenticated = !authLoading && !user && !isLocalTest;
  const destinationLabel = breadcrumbs.length ? breadcrumbs.map((b) => b.name).join(" / ") : "Root Vault";

  return (
    <div className="flex-1 min-h-0 bg-[#020808]">
      <div className="mx-auto w-full max-w-[520px] px-3 py-3 sm:px-4 sm:py-5 space-y-3">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] font-medium leading-none text-green-300/80 hover:text-green-300 transition-colors">
          <ArrowLeft className="h-3 w-3 shrink-0 -translate-y-[1px]" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-1">
          <h1 className="text-[15px] font-bold tracking-tight text-white flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/15 border border-green-500/20 text-green-400 shrink-0">
              <Folder className="h-3.5 w-3.5" />
            </span>
            <span className="i-fonts">Save to Document Vault</span>
          </h1>
          <p className="text-xs leading-none text-slate-400 i-fonts">Choose where to save this file</p>
        </div>

        {isLocalTest && !success && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/15 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium leading-none text-amber-300/90">
            <span className="h-1 w-1 rounded-full bg-amber-400/80" />
            Local test mode · No data leaves this device
          </div>
        )}

        {loadingFile ? (
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3">
            <Spinner className="size-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-400">Loading shared file…</span>
          </div>
        ) : loadError ? (
          <div className="flex gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/15 px-3 py-3 text-sm leading-snug text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400/80" />
            <span className="min-w-0 text-xs leading-snug">{loadError}</span>
          </div>
        ) : pendingFile ? (
          <div className="space-y-3">
            {/* File — compact, with thumbnail for images */}
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-green-500/10 px-3 py-2.5">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-black/30 border border-white/10 shrink-0">
                {thumbUrl ? (
                  <img src={thumbUrl} alt={pendingFile.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-green-400">{fileIcon(pendingFile)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setShowFullName((v) => !v)}
                  className="block w-full text-left"
                  title={pendingFile.name}
                  aria-label={showFullName ? "Show truncated filename" : "Show full filename"}
                >
                  <p className={`text-xs font-semibold leading-tight text-white i-fonts ${showFullName ? "whitespace-normal break-all" : "truncate"}`}>
                    {showFullName ? pendingFile.name : displayFilename(pendingFile.name, 26)}
                  </p>
                </button>
                <p className="mt-0.5 text-[11px] leading-none text-slate-400">
                  {prettyType(pendingFile)} · {formatBytes(pendingFile.size)}
                </p>
              </div>
              <span className="hidden sm:block shrink-0 text-[10px] leading-none text-slate-500">
                {pendingMeta?.createdAt ? new Date(pendingMeta.createdAt).toLocaleDateString() : ""}
              </span>
            </div>

            {validationError && (
              <div className="flex gap-2 rounded-xl bg-red-500/10 border border-red-500/15 px-3 py-2.5 text-xs leading-snug text-red-300">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {success && (
              <div className="flex gap-2 rounded-xl bg-green-500/10 border border-green-500/15 px-3 py-2.5 text-xs font-medium leading-snug text-green-200">
                <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  {isLocalTest ? `Saved to "${selectedFolder ? selectedFolder.name : "Root Vault"}" (local test mode)` : `Saved to ${selectedFolder ? selectedFolder.name : "Root Vault"} — redirecting…`}
                </span>
              </div>
            )}

            {isUnauthenticated ? (
              <div className="rounded-xl bg-white/[0.03] border border-white/10 px-3 py-3 space-y-2.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-green-200">
                  <LogIn className="h-3.5 w-3.5 text-green-400" /> Please log in to save
                </p>
                <p className="text-xs leading-snug text-slate-400 i-fonts">Your file is preserved. Log in and you will return here.</p>
                <Link
                  to={`/login?next=${encodeURIComponent(`/share-target?id=${encodeURIComponent(shareId)}`)}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-green-600 hover:bg-green-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
                >
                  <LogIn className="h-3 w-3" /> Log in to continue
                </Link>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl bg-white/[0.03] border border-green-500/10">
                  <div className="flex items-center gap-1 border-b border-white/5 px-2 py-2">
                    <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-[11px] font-medium leading-none scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setCurrentFolderId(null)}
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 transition-colors ${
                          currentFolderId === null ? "bg-green-500/15 text-green-300 border border-green-500/20" : "bg-white/[0.04] text-slate-400 hover:text-white border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <Folder className="h-3 w-3" />
                        Root Vault
                      </button>
                      {breadcrumbs.map((b) => {
                        const id = b._id || b.id;
                        const isActive = currentFolderId === id;
                        return (
                          <span key={id} className="inline-flex items-center gap-1 shrink-0">
                            <ChevronRight className="h-3 w-3 text-white/20 shrink-0" />
                            <button
                              type="button"
                              onClick={() => setCurrentFolderId(id)}
                              title={b.name}
                              className={`max-w-[110px] shrink-0 truncate rounded-full px-2.5 py-1.5 transition-colors ${isActive ? "bg-green-500/15 text-green-300 border border-green-500/20" : "bg-white/[0.04] text-slate-400 hover:text-white border border-white/10 hover:bg-white/10"}`}
                            >
                              {b.name}
                            </button>
                          </span>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setFoldersLoading(true);
                        try {
                          const data = await getVaultItems();
                          if (data?.success) setFolders(data.folders || []);
                        } catch (e) {
                          if (isLocalTest) {
                            setFolders(LOCAL_TEST_FOLDERS);
                            setFoldersError("");
                          } else {
                            setFoldersError(e.message);
                          }
                        } finally {
                          setFoldersLoading(false);
                        }
                      }}
                      className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label="Refresh folders"
                    >
                      <RefreshCw className={`h-3 w-3 ${foldersLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  <div className="p-2">
                    {foldersLoading ? (
                      <div className="flex items-center justify-center gap-2 py-5 text-xs text-slate-400">
                        <Spinner className="size-3.5" /> Syncing…
                      </div>
                    ) : foldersError ? (
                      <div className="flex gap-2 rounded-lg bg-red-500/10 border border-red-500/15 px-3 py-2 text-xs text-red-300">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{foldersError}</span>
                      </div>
                    ) : currentFolders.length === 0 ? (
                      <div className="rounded-lg bg-black/20 border border-white/5 px-3 py-2 text-center text-xs leading-snug text-slate-400 i-fonts">
                        No subfolders · Saving to <span className="font-semibold text-green-300">{selectedFolder ? selectedFolder.name : "Root Vault"}</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {currentFolders.map((f) => {
                          const fid = f._id || f.id;
                          return (
                            <button
                              key={fid}
                              type="button"
                              onClick={() => setCurrentFolderId(fid)}
                              title={f.name}
                              className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-2 text-left transition-colors hover:border-green-500/20 hover:bg-green-500/10 active:scale-[0.99]"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-green-500/10 border border-green-500/10 text-green-400">
                                <Folder className="h-3 w-3" />
                              </span>
                              <span className="min-w-0 flex-1 truncate text-xs font-medium leading-tight text-slate-200 i-fonts">{f.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-white/5 bg-black/20 px-3 py-2">
                    <span className="min-w-0 truncate text-[11px] leading-none text-slate-400">
                      Saving to · <span className="font-semibold text-green-300">{destinationLabel}</span>
                    </span>
                    {selectedFolder && (
                      <button type="button" onClick={() => setCurrentFolderId(selectedFolder.parentId || null)} className="shrink-0 text-[11px] font-medium leading-none text-green-300 hover:text-green-200">
                        Up
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={uploading}
                    className="flex-1 rounded-full border border-white/10 bg-white/[0.04] py-2.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading || !!validationError || !!success}
                    className="flex-[1.35] inline-flex items-center justify-center gap-1.5 rounded-full bg-green-600 hover:bg-green-500 py-2.5 text-xs font-semibold text-white shadow-sm disabled:opacity-50 transition-colors active:scale-[0.99]"
                  >
                    {uploading ? <Spinner className="size-3.5 text-white" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploading ? "Saving…" : "Save to Vault"}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}

        {!shareId && !loadingFile && (
          <p className="text-center text-xs leading-snug text-slate-500 i-fonts">
            Tip: Share from Gallery/Files → <span className="font-semibold text-green-300">GFG BVCOE</span>
          </p>
        )}
      </div>
    </div>
  );
}
