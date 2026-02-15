import { useState, useEffect, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createEvent, getEventsForManage, deleteEvent, cancelScheduledDelete, updateEvent, userCanManageEvents, canManageEventUploadConfig, getEventUploadAllowed, addEventUploadDepartment, removeEventUploadDepartment, createUploadLink, AUTH_DEPARTMENTS, getAccountTypeLabel, getMe } from "../services/api";
import { toast } from "sonner";

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const isVideo = (file) => file?.type?.startsWith("video/") || VIDEO_TYPES.includes(file?.type);

const SectionTitle = ({ icon, children }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="text-2xl">{icon}</span>
    <h2 className="text-lg font-semibold text-white tracking-tight">{children}</h2>
    <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/40 to-transparent rounded" />
  </div>
);

const EditEventModal = ({ event, onClose, onSaved, inputClass, labelClass }) => {
  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.date ?? "");
  const [time, setTime] = useState(event?.time ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [category, setCategory] = useState(event?.category ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [modalDescription, setModalDescription] = useState(event?.modalDescription ?? "");
  const [targetAudience, setTargetAudience] = useState(event?.targetAudience ?? "");
  const [speakers, setSpeakers] = useState(
    event?.speakers?.length ? event.speakers.map((s) => ({ name: s.name ?? "", title: s.title ?? "" })) : [{ name: "", title: "" }]
  );
  const [agenda, setAgenda] = useState(event?.agenda?.length ? [...event.agenda] : [""]);
  const [prerequisites, setPrerequisites] = useState(event?.prerequisites?.length ? [...event.prerequisites] : [""]);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const addSpeaker = () => setSpeakers((s) => [...s, { name: "", title: "" }]);
  const removeSpeaker = (i) => setSpeakers((s) => s.filter((_, idx) => idx !== i));
  const updateSpeaker = (i, field, value) => setSpeakers((s) => s.map((sp, idx) => (idx === i ? { ...sp, [field]: value } : sp)));
  const addAgenda = () => setAgenda((a) => [...a, ""]);
  const removeAgenda = (i) => setAgenda((a) => a.filter((_, idx) => idx !== i));
  const updateAgenda = (i, value) => setAgenda((a) => a.map((item, idx) => (idx === i ? value : item)));
  const addPrerequisite = () => setPrerequisites((p) => [...p, ""]);
  const removePrerequisite = (i) => setPrerequisites((p) => p.filter((_, idx) => idx !== i));
  const updatePrerequisite = (i, value) => setPrerequisites((p) => p.map((item, idx) => (idx === i ? value : item)));

  const addGalleryFiles = (newFiles) => {
    const list = Array.from(newFiles || []);
    if (list.length === 0) return;
    setGalleryFiles((prev) => [...prev, ...list]);
    setPreviewUrls((prev) => [...prev, ...list.map((f) => URL.createObjectURL(f))]);
  };
  const removeGalleryFile = (index) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !time.trim() || !location.trim() || !category.trim() || !description.trim()) {
      toast.error("Missing required fields");
      return;
    }
    setSaving(true);
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("date", date);
    formData.append("time", time.trim());
    formData.append("location", location.trim());
    formData.append("category", category.trim());
    formData.append("description", description.trim());
    formData.append("modalDescription", modalDescription.trim());
    formData.append("targetAudience", targetAudience.trim());
    formData.append("speakers", JSON.stringify(speakers.filter((s) => s.name || s.title)));
    formData.append("agenda", JSON.stringify(agenda.filter(Boolean)));
    formData.append("prerequisites", JSON.stringify(prerequisites.filter(Boolean)));
    galleryFiles.forEach((file) => formData.append("gallery", file));

    try {
      await updateEvent(event._id, formData);
      toast.success("Event updated.");
      onSaved();
    } catch (err) {
      toast.error(err.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const existingGallery = event?.galleryImages ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-[#1e1e2f] border border-gray-500/30 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-500/20">
          <h3 className="text-lg font-semibold text-white">Edit event</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-500/20 hover:text-white">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className={labelClass}>Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Category *</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Location *</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass + " [color-scheme:dark]"} required />
            </div>
            <div>
              <label className={labelClass}>Time *</label>
              <input type="text" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} required />
            </div>
          </div>
          <div>
            <label className={labelClass}>Short description (card) *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass + " min-h-[80px] resize-y"} required />
          </div>
          <div>
            <label className={labelClass}>Modal description (optional)</label>
            <textarea value={modalDescription} onChange={(e) => setModalDescription(e.target.value)} className={inputClass + " min-h-[80px] resize-y"} />
          </div>
          <div>
            <label className={labelClass}>Target audience (optional)</label>
            <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className={inputClass} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Speakers</label>
              <button type="button" onClick={addSpeaker} className="text-sm text-cyan-400 hover:text-cyan-300">+ Add</button>
            </div>
            <div className="space-y-2">
              {speakers.map((sp, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={sp.name} onChange={(e) => updateSpeaker(i, "name", e.target.value)} className={inputClass + " flex-1"} placeholder="Name" />
                  <input type="text" value={sp.title} onChange={(e) => updateSpeaker(i, "title", e.target.value)} className={inputClass + " flex-1"} placeholder="Title" />
                  {speakers.length > 1 && <button type="button" onClick={() => removeSpeaker(i)} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">Remove</button>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Agenda</label>
              <button type="button" onClick={addAgenda} className="text-sm text-cyan-400 hover:text-cyan-300">+ Add</button>
            </div>
            <div className="space-y-2">
              {agenda.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={item} onChange={(e) => updateAgenda(i, e.target.value)} className={inputClass} />
                  {agenda.length > 1 && <button type="button" onClick={() => removeAgenda(i)} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">Remove</button>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Prerequisites</label>
              <button type="button" onClick={addPrerequisite} className="text-sm text-cyan-400 hover:text-cyan-300">+ Add</button>
            </div>
            <div className="space-y-2">
              {prerequisites.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={item} onChange={(e) => updatePrerequisite(i, e.target.value)} className={inputClass} />
                  {prerequisites.length > 1 && <button type="button" onClick={() => removePrerequisite(i)} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">Remove</button>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Gallery (optional – add new to replace)</label>
            {existingGallery.length > 0 && (
              <p className="text-xs text-gray-500 mb-2">Current: {existingGallery.length} file(s). Add new files below to replace.</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => { addGalleryFiles(e.target.files); e.target.value = ""; }}
              className="hidden"
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-3 border border-dashed border-gray-500/50 rounded-xl text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400">
              Add new images/videos (optional)
            </button>
            {galleryFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {galleryFiles.map((file, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#252536]">
                    {file.type.startsWith("video/") ? (
                      <video src={previewUrls[i]} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={previewUrls[i]} alt="" className="w-full h-full object-cover" />
                    )}
                    <button type="button" onClick={() => removeGalleryFile(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-red-500 text-white text-xs">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-500/50 text-gray-300 hover:bg-gray-500/20 font-medium">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 font-medium disabled:opacity-50">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UploadEvent = () => {
  const { user, loading: authLoading, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [managedEvents, setManagedEvents] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmEv, setDeleteConfirmEv] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [editingEv, setEditingEv] = useState(null);
  const [allowedConfig, setAllowedConfig] = useState(null);
  const [loadingAllowed, setLoadingAllowed] = useState(false);
  const [addingDept, setAddingDept] = useState(false);
  const [removingDept, setRemovingDept] = useState(null);
  const [addDeptValue, setAddDeptValue] = useState("");
  const UPLOAD_LINK_STORAGE_KEY = "gfg_upload_event_link";
  const [uploadLinkData, setUploadLinkData] = useState(() => {
    try {
      const raw = localStorage.getItem(UPLOAD_LINK_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.token && data?.expiresAt && new Date(data.expiresAt) > new Date()) return data;
        localStorage.removeItem(UPLOAD_LINK_STORAGE_KEY);
      }
    } catch (_) {}
    return null;
  });
  const [linkDisclosed, setLinkDisclosed] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef([]);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const [speakers, setSpeakers] = useState([{ name: "", title: "" }]);
  const [agenda, setAgenda] = useState([""]);
  const [prerequisites, setPrerequisites] = useState([""]);

  const loadManagedEvents = useCallback(() => {
    getEventsForManage()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setManagedEvents(res.data);
      })
      .catch(() => setManagedEvents([]));
  }, []);

  const loadAllowedConfig = useCallback(() => {
    setLoadingAllowed(true);
    getEventUploadAllowed()
      .then((res) => {
        if (res.success && res.data) setAllowedConfig(res.data);
      })
      .catch(() => setAllowedConfig(null))
      .finally(() => setLoadingAllowed(false));
  }, []);

  useEffect(() => {
    if (user && userCanManageEvents(user)) loadManagedEvents();
  }, [user, loadManagedEvents]);

  useEffect(() => {
    if (user && canManageEventUploadConfig(user.accountType)) loadAllowedConfig();
  }, [user, loadAllowedConfig]);

  previewUrlsRef.current = previewUrls;
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const addGalleryFiles = useCallback((newFiles) => {
    const list = Array.from(newFiles || []);
    if (list.length === 0) return;
    setGalleryFiles((prev) => [...prev, ...list]);
    setPreviewUrls((prev) => {
      const next = [...prev];
      list.forEach((f) => next.push(URL.createObjectURL(f)));
      return next;
    });
  }, []);

  const removeGalleryFile = useCallback((index) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e1e2f]">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e1e2f]">
        <p className="text-gray-400">Redirecting to login…</p>
        <Navigate to="/login" replace />
      </div>
    );
  }
  if (!userCanManageEvents(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e1e2f]">
        <p className="text-gray-400">Redirecting…</p>
        <Navigate to="/" replace />
      </div>
    );
  }

  const handleGalleryInputChange = (e) => {
    addGalleryFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addGalleryFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const addSpeaker = () => setSpeakers((s) => [...s, { name: "", title: "" }]);
  const removeSpeaker = (i) => setSpeakers((s) => s.filter((_, idx) => idx !== i));
  const updateSpeaker = (i, field, value) => {
    setSpeakers((s) => s.map((sp, idx) => (idx === i ? { ...sp, [field]: value } : sp)));
  };
  const addAgenda = () => setAgenda((a) => [...a, ""]);
  const removeAgenda = (i) => setAgenda((a) => a.filter((_, idx) => idx !== i));
  const updateAgenda = (i, value) => setAgenda((a) => a.map((item, idx) => (idx === i ? value : item)));
  const addPrerequisite = () => setPrerequisites((p) => [...p, ""]);
  const removePrerequisite = (i) => setPrerequisites((p) => p.filter((_, idx) => idx !== i));
  const updatePrerequisite = (i, value) => setPrerequisites((p) => p.map((item, idx) => (idx === i ? value : item)));

  const resetForm = () => {
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
    setCategory("");
    setDescription("");
    setModalDescription("");
    setTargetAudience("");
    setGalleryFiles([]);
    setPreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    setSpeakers([{ name: "", title: "" }]);
    setAgenda([""]);
    setPrerequisites([""]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !time.trim() || !location.trim() || !category.trim() || !description.trim()) {
      toast.error("Missing required fields", { description: "Title, date, time, location, category and description are required." });
      return;
    }
    if (galleryFiles.length === 0) {
      toast.error("Gallery required", { description: "Add at least one image or video." });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("date", date);
    formData.append("time", time.trim());
    formData.append("location", location.trim());
    formData.append("category", category.trim());
    formData.append("description", description.trim());
    formData.append("modalDescription", modalDescription.trim());
    formData.append("targetAudience", targetAudience.trim());
    formData.append("speakers", JSON.stringify(speakers.filter((s) => s.name || s.title)));
    formData.append("agenda", JSON.stringify(agenda.filter(Boolean)));
    formData.append("prerequisites", JSON.stringify(prerequisites.filter(Boolean)));
    galleryFiles.forEach((file) => formData.append("gallery", file));

    toast.promise(createEvent(formData), {
      loading: "Uploading event…",
      success: () => {
        loadManagedEvents();
        resetForm();
        return "Event published successfully.";
      },
      error: (err) => err.message || "Upload failed.",
    }).finally(() => setLoading(false));
  };

  const openDeleteConfirm = (ev) => setDeleteConfirmEv(ev);
  const closeDeleteConfirm = () => setDeleteConfirmEv(null);

  const handleConfirmScheduleDelete = async () => {
    if (!deleteConfirmEv) return;
    const id = deleteConfirmEv._id;
    setDeletingId(id);
    closeDeleteConfirm();
    toast.promise(deleteEvent(id), {
      loading: "Scheduling deletion…",
      success: () => {
        loadManagedEvents();
        return "Event will be deleted in 10 days. You can cancel before then.";
      },
      error: (err) => err.message || "Failed to schedule deletion.",
    }).finally(() => setDeletingId(null));
  };

  const handleCancelScheduledDelete = async (ev) => {
    setCancellingId(ev._id);
    toast.promise(cancelScheduledDelete(ev._id), {
      loading: "Cancelling deletion…",
      success: () => {
        loadManagedEvents();
        return "Deletion cancelled. Event will stay.";
      },
      error: (err) => err.message || "Failed to cancel.",
    }).finally(() => setCancellingId(null));
  };

  const formatScheduledDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { dateStyle: "medium" });
  };

  const handleAddAllowedDept = () => {
    const dept = addDeptValue.trim();
    if (!dept) return;
    setAddingDept(true);
    addEventUploadDepartment(dept)
      .then((res) => {
        if (res.data) setAllowedConfig(res.data);
        setAddDeptValue("");
        toast.success("Department added. They will see Manage Events in their menu.");
        return getMe().then((r) => r.user && setUser(r.user));
      })
      .catch((err) => toast.error(err.message || "Failed to add"))
      .finally(() => setAddingDept(false));
  };

  const handleGenerateUploadLink = () => {
    setGeneratingLink(true);
    createUploadLink()
      .then((res) => {
        if (res.success && res.data) {
          setUploadLinkData(res.data);
          try {
            localStorage.setItem(UPLOAD_LINK_STORAGE_KEY, JSON.stringify(res.data));
          } catch (_) {}
          setLinkDisclosed(false);
        }
        toast.success("Link generated. Valid for 12 hours.");
      })
      .catch((err) => toast.error(err.message || "Failed to generate link"))
      .finally(() => setGeneratingLink(false));
  };

  const copyUploadLink = () => {
    if (!uploadLinkData?.token) return;
    const url = `${window.location.origin}/uploadevent/link/${uploadLinkData.token}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied to clipboard")).catch(() => toast.error("Could not copy"));
  };

  const handleRemoveAllowedDept = (department) => {
    setRemovingDept(department);
    removeEventUploadDepartment(department)
      .then((res) => {
        if (res.data) setAllowedConfig(res.data);
        toast.success("Department removed.");
        return getMe().then((r) => r.user && setUser(r.user));
      })
      .catch((err) => toast.error(err.message || "Failed to remove"))
      .finally(() => setRemovingDept(null));
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-sm font-medium mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Event management
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Upload new event
          </h1>
          <p className="text-gray-400">
            New events appear on the Events page alongside existing ones. Add images and videos for the gallery.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Basic info */}
          <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <SectionTitle icon="📋">Event details</SectionTitle>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. HACK N FRAG 2025"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Category *</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. BVEST Gaming Event"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Location *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. A-405, BVCOE"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Short description (card) *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass + " min-h-[88px] resize-y"}
                  placeholder="Brief description for the event card"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Modal description (optional)</label>
                <textarea
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  className={inputClass + " min-h-[88px] resize-y"}
                  placeholder="Longer description for the Know More modal"
                />
              </div>
              <div>
                <label className={labelClass}>Target audience (optional)</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. All BVCOE students"
                />
              </div>
            </div>
          </section>

          {/* Date & time */}
          <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <SectionTitle icon="📅">Date & time</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass + " [color-scheme:dark]"}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Time *</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 10:00 AM - 3:00 PM"
                  required
                />
              </div>
            </div>
          </section>

          {/* Gallery */}
          <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <SectionTitle icon="🖼️">Gallery (images & videos) *</SectionTitle>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleGalleryInputChange}
              className="hidden"
            />
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-500/50 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors"
            >
              <div className="text-4xl mb-2 opacity-80">📁</div>
              <p className="text-gray-300 font-medium">Drop files here or click to browse</p>
              <p className="text-sm text-gray-500 mt-1">Images (jpg, png, webp…) and videos (mp4, webm…). Multiple files supported.</p>
            </div>

            {galleryFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-cyan-300 mb-3">{galleryFiles.length} file(s) · Reorder by removing and re-adding</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {galleryFiles.map((file, index) => {
                    const url = previewUrls[index];
                    const isVid = isVideo(file);
                    return (
                      <div
                        key={index}
                        className="relative group aspect-square rounded-xl overflow-hidden bg-[#252536] border border-gray-500/30"
                      >
                        {isVid ? (
                          <video
                            src={url}
                            muted
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs text-white/90 font-medium">
                            {isVid ? "Video" : "Image"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeGalleryFile(index);
                          }}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center text-sm font-bold hover:bg-red-500 transition"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Speakers */}
          <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon="🎤">Speakers</SectionTitle>
              <button type="button" onClick={addSpeaker} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {speakers.map((sp, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={sp.name}
                    onChange={(e) => updateSpeaker(i, "name", e.target.value)}
                    className={inputClass + " flex-1"}
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    value={sp.title}
                    onChange={(e) => updateSpeaker(i, "title", e.target.value)}
                    className={inputClass + " flex-1"}
                    placeholder="Title / role"
                  />
                  {speakers.length > 1 && (
                    <button type="button" onClick={() => removeSpeaker(i)} className="p-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 shrink-0">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Agenda */}
          <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon="📌">Agenda</SectionTitle>
              <button type="button" onClick={addAgenda} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {agenda.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateAgenda(i, e.target.value)}
                    className={inputClass}
                    placeholder="Agenda item"
                  />
                  {agenda.length > 1 && (
                    <button type="button" onClick={() => removeAgenda(i)} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Prerequisites */}
          <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon="✓">Prerequisites</SectionTitle>
              <button type="button" onClick={addPrerequisite} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {prerequisites.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updatePrerequisite(i, e.target.value)}
                    className={inputClass}
                    placeholder="Prerequisite"
                  />
                  {prerequisites.length > 1 && (
                    <button type="button" onClick={() => removePrerequisite(i)} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Publishing…" : "Publish event"}
          </button>
        </form>

        {/* Generate upload link (anyone with event upload access) */}
        <section className="mt-14 bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
          <SectionTitle icon="🔗">Generate upload event link</SectionTitle>
          <p className="text-sm text-gray-400 mb-4">
            Create a link that anyone can use to open the upload event form without logging in. The link expires in 12 hours.
          </p>
          <button
            type="button"
            onClick={handleGenerateUploadLink}
            disabled={generatingLink}
            className="px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium disabled:opacity-50"
          >
            {generatingLink ? "Generating…" : "Generate link"}
          </button>
          {uploadLinkData?.token && (
            <div className="mt-4 p-4 rounded-xl bg-[#252536] border border-gray-500/20">
              <p className="text-xs text-gray-400 mb-2">Share this link (expires in 12 hours). Link is saved and will remain here until it expires or you generate a new one.</p>
              <p className="text-sm font-mono break-all mb-2 min-h-[1.5rem]">
                {linkDisclosed && typeof window !== "undefined" ? (
                  <span className="text-cyan-300">{`${window.location.origin}/uploadevent/link/${uploadLinkData.token}`}</span>
                ) : (
                  <span className="text-gray-500">••••••••••••••••/uploadevent/link/••••••••••••••••</span>
                )}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Expires: {uploadLinkData.expiresAt ? new Date(uploadLinkData.expiresAt).toLocaleString() : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setLinkDisclosed((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg bg-gray-500/30 text-gray-300 hover:bg-gray-500/50 text-sm font-medium"
                >
                  {linkDisclosed ? "Hide link" : "Disclose link"}
                </button>
                <button
                  type="button"
                  onClick={copyUploadLink}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-sm font-medium"
                >
                  Copy link
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Departments allowed to upload events (only Faculty Incharge, Chairperson, Vice-Chairperson, Event Management can see and edit) */}
        {canManageEventUploadConfig(user?.accountType) && (
        <section className="mt-14 bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
          <SectionTitle icon="👥">Departments allowed to visit Upload Event page</SectionTitle>
          <p className="text-sm text-gray-400 mb-4">
            Faculty Incharge, Chairperson, Vice-Chairperson and Event Management are always allowed. Add or remove other departments below. Added departments will see &quot;Manage Events&quot; in their profile dropdown.
          </p>
          {loadingAllowed ? (
            <p className="text-gray-500 py-4">Loading…</p>
          ) : allowedConfig ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Always allowed (cannot be removed)</p>
                <div className="flex flex-wrap gap-2">
                  {allowedConfig.core?.map((d) => (
                    <span key={d} className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-sm font-medium">
                      {getAccountTypeLabel(d) || d}
                    </span>
                  ))}
                </div>
              </div>
              {allowedConfig.extra?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2">Additionally allowed</p>
                  <ul className="space-y-2">
                    {allowedConfig.extra.map((d) => (
                      <li key={d} className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-[#252536] border border-gray-500/20">
                        <span className="text-white font-medium">{getAccountTypeLabel(d) || d}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAllowedDept(d)}
                          disabled={removingDept === d}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium disabled:opacity-50"
                        >
                          {removingDept === d ? "Removing…" : "Remove"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Add department</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={addDeptValue}
                    onChange={(e) => setAddDeptValue(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-white focus:border-cyan-500 outline-none min-w-[200px]"
                  >
                    <option value="">Select department</option>
                    {AUTH_DEPARTMENTS.filter((d) => !allowedConfig.all?.includes(d)).map((d) => (
                      <option key={d} value={d}>{getAccountTypeLabel(d) || d}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddAllowedDept}
                    disabled={!addDeptValue.trim() || addingDept}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingDept ? "Adding…" : "Add"}
                  </button>
                </div>
                {AUTH_DEPARTMENTS.filter((d) => !allowedConfig.all?.includes(d)).length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">All departments are already in the allowed list.</p>
                )}
              </div>
            </div>
          ) : null}
        </section>
        )}

        {/* Manage events */}
        <section className="mt-8 sm:mt-10 md:mt-14 bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl">
          <SectionTitle icon="⚙️">Manage uploaded events</SectionTitle>
          <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
            Only events uploaded through this page. Hardcoded events on the Events page are not listed here.
          </p>
          {managedEvents.length === 0 ? (
            <p className="text-gray-500 py-4 sm:py-6 text-center text-sm sm:text-base rounded-xl bg-[#252536]/50 border border-gray-500/20">
              No uploaded events yet.
            </p>
          ) : (
            <ul className="space-y-2 sm:space-y-3">
              {managedEvents.map((ev) => (
                <li
                  key={ev._id}
                  className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-3 px-3 py-3 sm:px-5 sm:py-4 rounded-lg sm:rounded-xl bg-[#252536] border border-gray-500/20 hover:border-gray-500/40 transition-colors"
                >
                  <div className="min-w-0 flex-1 order-1">
                    <span className="font-medium text-white block truncate text-sm sm:text-base">{ev.title}</span>
                    <span className="text-xs text-gray-400 block mt-0.5 sm:mt-0">
                      {ev.date} · {ev.category}
                      {ev.scheduledDeleteAt && (
                        <span className="ml-1 sm:ml-2 text-amber-400">
                          · Deletes {formatScheduledDate(ev.scheduledDeleteAt)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 order-2 sm:order-none flex-wrap">
                    <button
                      type="button"
                      onClick={() => setEditingEv(ev)}
                      className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium"
                    >
                      Edit
                    </button>
                    {ev.scheduledDeleteAt ? (
                      <button
                        type="button"
                        onClick={() => handleCancelScheduledDelete(ev)}
                        disabled={cancellingId === ev._id}
                        className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-medium disabled:opacity-50"
                      >
                        {cancellingId === ev._id ? "Cancelling…" : "Cancel deletion"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openDeleteConfirm(ev)}
                        disabled={deletingId === ev._id}
                        className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium disabled:opacity-50"
                      >
                        {deletingId === ev._id ? "Scheduling…" : "Delete"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Delete confirmation dialog */}
        {deleteConfirmEv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60" onClick={closeDeleteConfirm}>
            <div
              className="bg-[#1e1e2f] border border-gray-500/30 rounded-xl sm:rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Delete event?</h3>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">
                This event will stay in the database for 10 days. After 10 days it will be automatically deleted if not cancelled. You can cancel the deletion anytime before then.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeDeleteConfirm}
                  className="w-full sm:w-auto px-3 py-2 sm:px-4 rounded-lg border border-gray-500/50 text-gray-300 hover:bg-gray-500/20 font-medium text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmScheduleDelete}
                  className="w-full sm:w-auto px-3 py-2 sm:px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium text-sm sm:text-base"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit event modal */}
        {editingEv && (
          <EditEventModal
            event={editingEv}
            onClose={() => setEditingEv(null)}
            onSaved={() => {
              setEditingEv(null);
              loadManagedEvents();
            }}
            inputClass={inputClass}
            labelClass={labelClass}
          />
        )}
      </div>
    </div>
  );
};

export default UploadEvent;
