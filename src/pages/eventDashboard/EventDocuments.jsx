import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Folder,
  FolderPlus,
  FileText,
  Upload,
  Share2,
  Eye,
  Trash2,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Download,
  Grid,
  List,
  Search,
  File,
  Image as ImageIcon,
  Link,
  RefreshCw,
  Info,
  Lock,
  Unlock,
} from "react-feather";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  getVaultItems,
  createVaultFolder,
  deleteVaultFolder,
  uploadVaultDocument,
  deleteVaultDocument,
  toggleVaultFolderLock,
  toggleVaultDocumentLock,
} from "../../services/api";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

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
          <span className="font-semibold text-xs text-gray-200 flex items-center gap-1.5">
            <span>📄</span> PDF Document Viewer
          </span>
          <div className="sm:flex items-center gap-2 text-[8px] sm:text-[10px] hidden">
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

      <div className="relative flex-1 w-full h-full bg-white overflow-hidden">
        <iframe
          src={targetViewerUrl}
          className="w-full h-full border-0"
          title={previewDoc.name}
        />
      </div>
    </div>
  );
}

export default function EventDocuments() {
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  // Modals state
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [infoTarget, setInfoTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New folder state
  const [newFolderName, setNewFolderName] = useState("");

  // Hidden File Input Ref for direct PC file selection
  const fileInputRef = useRef(null);

  // Copy share link state
  const [copiedLink, setCopiedLink] = useState(false);

  // Toggle Lock Handler
  const handleToggleLock = async (type, item, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const itemId = item._id || item.id;
    try {
      let res;
      if (type === "folder") {
        res = await toggleVaultFolderLock(itemId);
        if (res?.success && res.folder) {
          setFolders((prev) =>
            prev.map((f) => ((f._id === itemId || f.id === itemId) ? res.folder : f))
          );
          toast.success(res.message);
        }
      } else {
        res = await toggleVaultDocumentLock(itemId);
        if (res?.success && res.document) {
          setDocuments((prev) =>
            prev.map((d) => ((d._id === itemId || d.id === itemId) ? res.document : d))
          );
          toast.success(res.message);
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to update lock status");
    }
  };

  // Open Delete Confirmation Modal for Folder
  const handleDeleteFolder = (folder, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const name = folder.name;

    if (folder.isLocked) {
      toast.error(`Folder "${name}" is currently locked! Nobody can delete it while locked. Please unlock it first.`);
      return;
    }

    setDeleteTarget({ type: "folder", item: folder });
  };

  // Open Delete Confirmation Modal for Document
  const handleDeleteDoc = (doc, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const name = doc.name;

    if (doc.isLocked) {
      toast.error(`Document "${name}" is currently locked! Nobody can delete it while locked. Please unlock it first.`);
      return;
    }

    setDeleteTarget({ type: "doc", item: doc });
  };

  // Execute actual deletion after user confirms in ConfirmDeleteModal
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, item } = deleteTarget;
    const itemId = item._id || item.id;
    const name = item.name;

    try {
      setIsDeleting(true);
      if (type === "folder") {
        await deleteVaultFolder(itemId);
        setFolders((prev) => prev.filter((f) => f._id !== itemId && f.id !== itemId));
        setDocuments((prev) => prev.filter((d) => d.folderId !== itemId));
        toast.success(`Folder "${name}" deleted!`);
      } else {
        await deleteVaultDocument(itemId);
        setDocuments((prev) => prev.filter((d) => d._id !== itemId && d.id !== itemId));
        if (previewDoc && (previewDoc._id === itemId || previewDoc.id === itemId)) {
          setPreviewDoc(null);
        }
        toast.success(`"${name}" deleted from Cloudinary & DB immediately!`);
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  // Load vault items from backend on mount
  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getVaultItems();
      if (data?.success) {
        setFolders(data.folders || []);
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to load vault items:", err);
      toast.error("Failed to sync vault items from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const list = [];
    let curr = currentFolderId;
    while (curr) {
      const found = folders.find((f) => f._id === curr || f.id === curr);
      if (found) {
        list.unshift(found);
        curr = found.parentId;
      } else {
        break;
      }
    }
    return list;
  }, [currentFolderId, folders]);

  // Current folder contents
  const currentFolders = useMemo(() => {
    return folders.filter((f) => {
      const parentMatches = (f.parentId || null) === (currentFolderId || null);
      if (searchQuery) {
        return f.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return parentMatches;
    });
  }, [folders, currentFolderId, searchQuery]);

  const currentDocs = useMemo(() => {
    return documents.filter((d) => {
      const parentMatches = (d.folderId || null) === (currentFolderId || null);
      if (searchQuery) {
        return d.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return parentMatches;
    });
  }, [documents, currentFolderId, searchQuery]);

  // Trigger PC file picker directly
  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle direct file upload to Cloudinary (supports single or multiple files)
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      if (currentFolderId) {
        formData.append("folderId", currentFolderId);
      }

      files.forEach((file) => {
        formData.append("file", file);
      });

      if (files.length === 1) {
        setUploadProgressText(`Uploading ${files[0].name} to Cloudinary...`);
      } else {
        setUploadProgressText(`Uploading ${files.length} documents to Cloudinary...`);
      }

      const res = await uploadVaultDocument(formData);
      if (res?.success) {
        const newItems = res.documents || (res.document ? [res.document] : []);
        setDocuments((prev) => [...newItems, ...prev]);
        toast.success(`Successfully uploaded ${newItems.length} file(s) to Cloudinary!`);
      } else {
        throw new Error(res.message || "Upload failed");
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      toast.error(err.message || "Failed to upload files to Cloudinary");
    } finally {
      setIsUploading(false);
      setUploadProgressText("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Create folder handler
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }
    try {
      const res = await createVaultFolder({
        name: newFolderName.trim(),
        parentId: currentFolderId || null,
      });
      if (res?.success && res.folder) {
        setFolders((prev) => [res.folder, ...prev]);
        toast.success(`Folder "${res.folder.name}" created!`);
        setNewFolderName("");
        setIsNewFolderOpen(false);
      }
    } catch (err) {
      toast.error(err.message || "Failed to create folder");
    }
  };



  // Public share URL generator
  const getShareUrl = (type, item) => {
    const origin = window.location.origin;
    const itemId = item._id || item.id;
    const token = btoa(`${type}:${itemId}`);
    return `${origin}/share/vault/${token}?name=${encodeURIComponent(item.name)}`;
  };

  const handleShareClick = (type, item, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const url = getShareUrl(type, item);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success(`Public share link for "${item.name}" copied to clipboard!`);
    setShareTarget({ type, item, url });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyShareLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Public share link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="flex-1 p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto w-full  sm:mt-[-20px] ">
      {/* Hidden File Input for PC File Browser (Supports Multiple Files) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-gray-500/20 pb-4 sm:pb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-richblack-25 tracking-tight flex items-center gap-2">
            <Folder className="h-5 w-5 text-cyan-400" />
            <span className="i-fonts font-bold">Document Vault</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 i-fonts ">
            Upload files directly to Cloudinary, organize folders & share public links (synced across all departments)
          </p>
        </div>

        {/* macOS Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchItems}
            className="p-2 shrink-0 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-gray-300 hover:text-white transition-all"
            title="Refresh Vault"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsNewFolderOpen(true)}
            className=" sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-gray-100 text-xs font-semibold backdrop-blur-xl shadow-md transition-all active:scale-95"
          >
            <FolderPlus className="h-4 w-4 text-cyan-400 shrink-0" />
            <span className="truncate">New Folder</span>
          </button>

          <button
            type="button"
            onClick={handleUploadButtonClick}
            disabled={isUploading}
            className="sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 border border-cyan-400/30 text-white text-xs font-semibold shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {isUploading ? (
              <Spinner className="size-4 text-white shrink-0" />
            ) : (
              <Upload className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate text-[8px] sm:text-xs">{isUploading ? "Uploading…" : "Upload Documents"}</span>
          </button>
        </div>
      </div>

      {/* Cloudinary Uploading Overlay Banner */}
      {isUploading && (
        <div className="p-3.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center gap-3 text-xs text-cyan-200 animate-pulse">
          <Spinner className="size-5 text-cyan-400 shrink-0" />
          <span className="font-medium text-sm sm:text-base">{uploadProgressText}</span>
        </div>
      )}

      {/* Toolbar: Breadcrumb + Search + View Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#181826]/90 border border-white/10 backdrop-blur-xl shadow-lg">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-medium text-gray-300 py-1">
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentFolderId === null
                ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                : "hover:bg-white/10 text-gray-400 hover:text-white"
            }`}
          >
            <Folder className="h-3.5 w-3.5 text-cyan-400" />
            <span>Root Vault</span>
          </button>

          {breadcrumbs.map((b) => {
            const bId = b._id || b.id;
            return (
              <div key={bId} className="flex items-center gap-1.5 shrink-0">
                <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                <button
                  type="button"
                  onClick={() => setCurrentFolderId(bId)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    currentFolderId === bId
                      ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                      : "hover:bg-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {b.name}
                </button>
              </div>
            );
          })}
        </div>

        {/* Search and Layout Toggle */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vault…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
          </div>

          <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-white/15 text-cyan-300" : "text-gray-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-white/15 text-cyan-300" : "text-gray-400 hover:text-white"
              }`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Contents Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-[#161622]/60 border border-white/10 gap-3">
          <Spinner className="size-8 text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">Syncing Document Vault...</span>
        </div>
      ) : currentFolders.length === 0 && currentDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center sm:p-14 p-8 rounded-2xl bg-[#161622]/60 border border-white/10 text-center space-y-3 i-fonts">
          <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Folder className="h-7 w-7" />
          </div>
          <h3 className="text-sm sm:text-lg font-bold text-richblack-25 ">No Documents or Folders</h3>
          <p className="text-xs text-gray-400 max-w-lg sm:max-w-sm i-fonts">
            This directory is empty. Click "Upload Document" to select any file from your PC and upload to Cloudinary.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsNewFolderOpen(true)}
              className="sm:px-3.5 px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-gray-200 font-medium"
            >
              Create Folder
            </button>
            <button
              type="button"
              onClick={handleUploadButtonClick}
              className="sm:px-3.5 px-2 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-medium shadow-md"
            >
              Select File from PC
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="space-y-6">
          {/* Folders Grid */}
          {currentFolders.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
                Folders ({currentFolders.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {currentFolders.map((folder) => {
                  const folderId = folder._id || folder.id;
                  const subDocsCount = documents.filter((d) => (d.folderId || null) === folderId).length;
                  return (
                    <motion.div
                      key={folderId}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentFolderId(folderId)}
                      className="group relative p-3.5 rounded-2xl bg-[#1a1a29]/90 border border-white/10 hover:border-cyan-400/40 hover:bg-[#1e1e32] cursor-pointer transition-all shadow-md flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* macOS Finder Folder Icon */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-sm">
                          <Folder className="h-5 w-5 fill-cyan-400/20" />
                        </div>
                        <div className="flex items-center gap-1 opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => handleShareClick("folder", folder, e)}
                            className="p-1 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                            title="Share Public Link"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInfoTarget({ type: "folder", item: folder });
                            }}
                            className="p-1 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                            title="View Details & Metadata"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteFolder(folder, e)}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                            title="Delete Folder & Cloudinary Files"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div>
                          <h5 className=" i-fonts text-xs font-semibold text-richblack-25 group-hover:text-white truncate">
                            {folder.name}
                          </h5>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {subDocsCount} {subDocsCount === 1 ? "file" : "files"}
                          </p>
                        </div>

                        {/* Creator Avatar & Full Name Badge */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px]">
                          <div
                            className="flex items-center gap-1.5 min-w-0 flex-1 pr-1"
                            title={`Created by ${folder.createdBy} ${folder.createdByEmail ? `(${folder.createdByEmail})` : ""}`}
                          >
                            <img
                              src={getCloudinaryAvatarUrl(folder.createdByAvatar, folder.createdBy)}
                              alt={folder.createdBy || "Creator"}
                              className="w-4 h-4 rounded-full border border-cyan-400/40 object-cover shrink-0"
                            />
                            <span className="truncate text-gray-300 font-medium">{folder.createdBy || "Lead"}</span>
                          </div>
                          {/* Lock Icon in bottom right */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleLock("folder", folder, e)}
                            className={`p-1 rounded-lg transition-colors shrink-0 ${
                              folder.isLocked
                                ? "text-amber-400 bg-amber-500/15 border border-amber-500/30"
                                : "text-gray-400 hover:text-cyan-300 hover:bg-white/10"
                            }`}
                            title={folder.isLocked ? `Locked by ${folder.lockedBy || "uploader"}` : "Click to Lock Folder"}
                          >
                            {folder.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Documents Grid */}
          {currentDocs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
                Files ({currentDocs.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {currentDocs.map((doc) => {
                  const docId = doc._id || doc.id;
                  const isPdf = doc.type?.includes("pdf") || doc.name?.endsWith(".pdf");
                  const isImg = doc.type?.includes("image") || /\.(png|jpe?g|webp|gif|svg)$/i.test(doc.name);

                  return (
                    <motion.div
                      key={docId}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative p-3.5 rounded-2xl bg-[#181827]/90 border border-white/10 hover:border-cyan-400/40 hover:bg-[#1d1d30] cursor-pointer transition-all shadow-md flex flex-col justify-between w-10/12 sm:w-full"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm ${
                            isPdf
                              ? "bg-red-500/15 border-red-500/30 text-red-400"
                              : isImg
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                              : "bg-blue-500/15 border-blue-500/30 text-blue-400"
                          }`}
                        >
                          {isPdf ? (
                            <FileText className="h-5 w-5" />
                          ) : isImg ? (
                            <ImageIcon className="h-5 w-5" />
                          ) : (
                            <File className="h-5 w-5" />
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewDoc(doc);
                            }}
                            className="p-1 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                            title="View Document"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleShareClick("doc", doc, e)}
                            className="p-1 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                            title="Share Link"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInfoTarget({ type: "doc", item: doc });
                            }}
                            className="p-1 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                            title="View Details & Metadata"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteDoc(doc, e)}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                            title="Delete Immediately from Cloudinary"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div>
                          <h5 className="text-xs font-semibold text-gray-200 group-hover:text-cyan-200 truncate">
                            {doc.name}
                          </h5>
                          <p className="text-[10px] text-gray-400 mt-0.5">{doc.size || "Cloudinary File"}</p>
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
                          {/* Lock Icon in bottom right */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleLock("doc", doc, e)}
                            className={`p-1 rounded-lg transition-colors shrink-0 ${
                              doc.isLocked
                                ? "text-amber-400 bg-amber-500/15 border border-amber-500/30"
                                : "text-gray-400 hover:text-cyan-300 hover:bg-white/10"
                            }`}
                            title={doc.isLocked ? `Locked by ${doc.lockedBy || "uploader"}` : "Click to Lock File"}
                          >
                            {doc.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-2xl bg-[#161622]/90 border border-white/10 overflow-x-auto shadow-lg">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="p-3 pl-4">Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Size</th>
                <th className="p-3">Uploaded / Created By</th>
                <th className="p-3">Date Uploaded</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-gray-300">
              {currentFolders.map((folder) => {
                const folderId = folder._id || folder.id;
                return (
                  <tr
                    key={folderId}
                    onClick={() => setCurrentFolderId(folderId)}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="p-3 pl-4 font-semibold text-gray-200 flex items-center gap-2.5">
                      <Folder className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>{folder.name}</span>
                    </td>
                    <td className="p-3 text-gray-400">Folder</td>
                    <td className="p-3 text-gray-400">—</td>
                    <td className="p-3 text-gray-300">
                      <div className="flex items-center gap-1.5 min-w-0" title={`Created by ${folder.createdBy} (${folder.createdByEmail || 'N/A'})`}>
                        <img
                          src={getCloudinaryAvatarUrl(folder.createdByAvatar, folder.createdBy)}
                          alt={folder.createdBy || "Creator"}
                          className="w-4 h-4 rounded-full border border-cyan-400/40 object-cover shrink-0"
                        />
                        <span className="truncate">{folder.createdBy || "Lead"}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-400">
                      {new Date(folder.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleShareClick("folder", folder, e)}
                          className="p-1 rounded-md text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                          title="Share Public Link"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInfoTarget({ type: "folder", item: folder });
                          }}
                          className="p-1 rounded-md text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                          title="View Details & Metadata"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleToggleLock("folder", folder, e)}
                          className={`p-1 rounded-md transition-colors ${
                            folder.isLocked
                              ? "text-amber-400 bg-amber-500/15 border border-amber-500/30"
                              : "text-gray-400 hover:text-cyan-300 hover:bg-white/10"
                          }`}
                          title={folder.isLocked ? `Locked by ${folder.lockedBy || "uploader"}` : "Lock Folder"}
                        >
                          {folder.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFolder(folder, e)}
                          className="p-1 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                          title="Delete Folder"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {currentDocs.map((doc) => {
                const docId = doc._id || doc.id;
                const isPdf = doc.type?.includes("pdf") || doc.name?.endsWith(".pdf");
                const isImg = doc.type?.includes("image") || /\.(png|jpe?g|webp|gif|svg)$/i.test(doc.name);
                return (
                  <tr
                    key={docId}
                    onClick={() => setPreviewDoc(doc)}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="p-3 pl-4 font-medium text-gray-200 flex items-center gap-2.5">
                      {isPdf ? (
                        <FileText className="h-4 w-4 text-red-400 shrink-0" />
                      ) : isImg ? (
                        <ImageIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <File className="h-4 w-4 text-blue-400 shrink-0" />
                      )}
                      <span>{doc.name}</span>
                    </td>
                    <td className="p-3 text-gray-400 uppercase text-[10px]">
                      {isPdf ? "PDF Document" : isImg ? "Image File" : "Cloudinary Asset"}
                    </td>
                    <td className="p-3 text-gray-400">{doc.size || "—"}</td>
                    <td className="p-3 text-gray-300">
                      <div className="flex items-center gap-1.5 min-w-0" title={`Uploaded by ${doc.createdBy} (${doc.createdByEmail || 'N/A'})`}>
                        <img
                          src={getCloudinaryAvatarUrl(doc.createdByAvatar, doc.createdBy)}
                          alt={doc.createdBy || "Uploader"}
                          className="w-4 h-4 rounded-full border border-cyan-400/40 object-cover shrink-0"
                        />
                        <span className="truncate">{doc.createdBy || "Member"}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDoc(doc);
                          }}
                          className="p-1 rounded-md text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                          title="View Document"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleShareClick("doc", doc, e)}
                          className="p-1 rounded-md text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                          title="Share Link"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInfoTarget({ type: "doc", item: doc });
                          }}
                          className="p-1 rounded-md text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                          title="View Details & Metadata"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleToggleLock("doc", doc, e)}
                          className={`p-1 rounded-md transition-colors ${
                            doc.isLocked
                              ? "text-amber-400 bg-amber-500/15 border border-amber-500/30"
                              : "text-gray-400 hover:text-cyan-300 hover:bg-white/10"
                          }`}
                          title={doc.isLocked ? `Locked by ${doc.lockedBy || "uploader"}` : "Lock File"}
                        >
                          {doc.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDoc(doc, e)}
                          className="p-1 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                          title="Delete Document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================== */}
      {/* MAC OS STYLED MODAL 1: CREATE NEW FOLDER MODAL                  */}
      {/* ============================================================== */}
      {isNewFolderOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsNewFolderOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-[#161622]/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col p-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* macOS Header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-t-xl bg-[#1e1e2d]/90 border-b border-white/10 i-fonts">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewFolderOpen(false)}
                    className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 flex items-center justify-center group transition-all"
                  >
                    <X className="h-2 w-2 text-[#4c0000] opacity-0 group-hover:opacity-100" />
                  </button>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <span className=" i-fonts text-xs font-semibold text-gray-200">Create New Folder</span>
                <div className="w-12" />
              </div>

              <form onSubmit={handleCreateFolder} className="p-5 space-y-4">
                <div>
                  <label className=" i-fonts block text-xs font-medium text-gray-300 mb-1">Folder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sponsorship Receipts"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                <div className=" i-fonts flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsNewFolderOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-md"
                  >
                    Create Folder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>,
          document.body
        )}

      {/* ============================================================== */}
      {/* MAC OS STYLED MODAL 2: IN-APP DOCUMENT VIEWER MODAL            */}
      {/* ============================================================== */}
      {previewDoc &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md"
            onClick={() => setPreviewDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="relative w-[82vw] max-w-7xl h-[90vh]  bg-[#161622]/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col p-1.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* macOS Header */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-t-xl bg-[#1e1e2d]/90 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 flex items-center justify-center group transition-all"
                  >
                    <X className="h-2 w-2 text-[#4c0000] opacity-0 group-hover:opacity-100" />
                  </button>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>

                <div className="flex items-center gap-2 max-w-md min-w-0">
                  <img
                    src={getCloudinaryAvatarUrl(
                      previewDoc.createdByAvatar,
                      previewDoc.createdBy || previewDoc.uploadedBy || "User"
                    )}
                    alt={previewDoc.createdBy || "Uploader"}
                    className="w-5 h-5 rounded-full border border-cyan-400/40 object-cover shadow-sm shrink-0"
                  />
                  <span className="text-xs font-semibold text-gray-200 truncate">
                    {previewDoc.name}
                  </span>
                  <span className="text-[10px] text-cyan-300/80 truncate hidden sm:inline">
                    by {previewDoc.createdBy || previewDoc.uploadedBy || "Member"} {previewDoc.createdByEmail ? `(${previewDoc.createdByEmail})` : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {previewDoc.url && (
                    <a
                      href={previewDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-white/10 transition-colors"
                      title="Open full document"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Viewport content */}
              <div className="relative flex-1 w-full h-full min-h-0 bg-black/90 rounded-b-xl overflow-hidden flex items-center justify-center p-3">
                <DocumentPreviewViewer previewDoc={previewDoc} />

                {/* Floating Action Pill */}
                <div className="absolute bottom-4 sm:left-1/2 sm:-translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-xl border border-white/20 shadow-2xl transition-all text-[6px] sm:text-sm bg-[#161616]/80  whitespace-nowrap">
                  {previewDoc.url && (
                    <a
                      href={previewDoc.url}
                      download={previewDoc.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5  text-cyan-300 hover:text-cyan-200 font-semibold"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                  )}
                  {previewDoc.url && <span className="w-px h-3.5" />}
                  <button
                    type="button"
                    onClick={() => setInfoTarget({ type: "doc", item: previewDoc })}
                    className="flex items-center gap-1.5  text-gray-200 hover:text-cyan-300 font-medium"
                  >
                    <Info className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Details</span>
                  </button>
                  <span className="w-px h-3.5 " />
                  <button
                    type="button"
                    onClick={(e) => handleDeleteDoc(previewDoc, e)}
                    className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-medium"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Cloudinary</span>
                  </button>
                  <span className="w-px h-3.5" />
                  <button
                    type="button"
                    onClick={(e) => handleShareClick("doc", previewDoc, e)}
                    className="flex items-center gap-1.5  text-gray-200 hover:text-white font-medium"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share Link</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

      {/* ============================================================== */}
      {/* MAC OS STYLED MODAL 3: PUBLIC SHARE LINK GENERATOR MODAL      */}
      {/* ============================================================== */}
      {shareTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShareTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-[#161622]/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col p-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* macOS Header */}
              <div className=" i-fonts flex items-center justify-between px-3.5 py-2.5 rounded-t-xl bg-[#1e1e2d]/90 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShareTarget(null)}
                    className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 flex items-center justify-center group transition-all"
                  >
                    <X className="h-2 w-2 text-[#4c0000] opacity-0 group-hover:opacity-100" />
                  </button>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <span className="text-xs font-semibold text-gray-200">Share Public Access Link</span>
                <div className="w-12" />
              </div>

              <div className="p-5 space-y-4 i-fonts">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
                  <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-white truncate">{shareTarget.item.name}</h5>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                      Public Shareable Link
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Generated URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getShareUrl(shareTarget.type, shareTarget.item)}
                      className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-cyan-300 font-mono select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyShareLink(getShareUrl(shareTarget.type, shareTarget.item))}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-md"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedLink ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div className=" i-fonts p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-400 space-y-1">
                  <p className="text-gray-200 font-semibold flex items-center gap-1.5">
                    <Link className="h-3.5 w-3.5 text-cyan-400" />
                    Public View Permission Enabled
                  </p>
                  <p>Anyone with this link can view and download this document or folder without needing to sign in.</p>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShareTarget(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-gray-300"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

      {/* ============================================================== */}
      {/* MAC OS STYLED MODAL 4: ITEM METADATA / DETAILS MODAL          */}
      {/* ============================================================== */}
      {infoTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setInfoTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-[#161622]/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col p-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* macOS Header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-t-xl bg-[#1e1e2d]/90 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInfoTarget(null)}
                    className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 flex items-center justify-center group transition-all"
                  >
                    <X className="h-2 w-2 text-[#4c0000] opacity-0 group-hover:opacity-100" />
                  </button>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <span className="text-xs font-semibold text-gray-200 i-fonts">
                  {infoTarget.type === "folder" ? "Folder Details & Metadata" : "File Details & Metadata"}
                </span>
                <button type="button" onClick={() => setInfoTarget(null)} className="text-gray-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                    {infoTarget.type === "folder" ? <Folder className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0 flex-1 i-fonts">
                    <h5 className="text-xs font-bold text-white truncate">{infoTarget.item.name}</h5>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                      {infoTarget.type === "folder" ? "Directory Folder" : infoTarget.item.type || "Cloudinary Asset"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-gray-300 i-fonts">
                  <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                    <span className="text-gray-400 shrink-0">Uploaded / Created By</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={getCloudinaryAvatarUrl(
                          infoTarget.item.createdByAvatar,
                          infoTarget.item.createdBy || infoTarget.item.uploadedBy || "User"
                        )}
                        alt={infoTarget.item.createdBy || "Uploader"}
                        className="w-8 h-8 rounded-full border border-cyan-400/40 object-cover shadow-sm shrink-0"
                      />
                      <div className="min-w-0 text-right">
                        <span className="font-semibold text-cyan-300 block truncate">
                          {infoTarget.item.createdBy || infoTarget.item.uploadedBy || "Unknown User"}
                        </span>
                        {infoTarget.item.createdByEmail && (
                          <span className="font-mono text-cyan-200/70 text-[10px] block truncate">
                            {infoTarget.item.createdByEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-gray-400">Date & Timestamp</span>
                    <span className="font-mono text-gray-200">
                      {infoTarget.item.createdAt
                        ? new Date(infoTarget.item.createdAt).toLocaleString()
                        : "Recently"}
                    </span>
                  </div>
                  {infoTarget.type === "doc" && (
                    <>
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-gray-400">File Size</span>
                        <span className="font-mono text-emerald-300">{infoTarget.item.size || "Unknown"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-gray-400">Cloudinary ID</span>
                        <span className="font-mono text-[10px] text-gray-400 truncate max-w-[200px]">
                          {infoTarget.item.public_id || "N/A"}
                        </span>
                      </div>
                    </>
                  )}
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
                        : "Unlocked (Editable)"}
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
          </div>,
          document.body
        )}

      {/* Reusable Delete Confirmation Dialog from Codebase */}
      {deleteTarget && (
        <ConfirmDeleteModal
          open={!!deleteTarget}
          title={
            deleteTarget.type === "folder"
              ? `Delete folder "${deleteTarget.item.name}"?`
              : `Delete "${deleteTarget.item.name}"?`
          }
          description={
            deleteTarget.type === "folder"
              ? `Are you sure you want to delete folder "${deleteTarget.item.name}" and all files inside? This action will permanently remove the folder and files from Cloudinary and database.`
              : `Are you sure you want to delete "${deleteTarget.item.name}"? This file will be permanently deleted from Cloudinary and database.`
          }
          confirmLabel="Delete"
          loading={isDeleting}
          onConfirm={handleConfirmDelete}
          onClose={() => !isDeleting && setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
