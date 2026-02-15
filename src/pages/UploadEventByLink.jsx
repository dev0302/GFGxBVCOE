import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { validateUploadLink, createEventByLink } from "../services/api";
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

const UploadEventByLink = () => {
  const { token } = useParams();
  const [linkStatus, setLinkStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

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
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      setLinkStatus({ valid: false });
      return;
    }
    validateUploadLink(token).then((res) => {
      setLinkStatus(res.success && res.valid ? { valid: true, expiresAt: res.expiresAt } : { valid: false });
    });
  }, [token]);

  const previewUrlsRef = useRef([]);
  previewUrlsRef.current = previewUrls;
  useEffect(() => {
    return () => previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const addGalleryFiles = useCallback((newFiles) => {
    const list = Array.from(newFiles || []);
    if (list.length === 0) return;
    setGalleryFiles((prev) => [...prev, ...list]);
    setPreviewUrls((prev) => [...prev, ...list.map((f) => URL.createObjectURL(f))]);
  }, []);
  const removeGalleryFile = useCallback((index) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const addSpeaker = () => setSpeakers((s) => [...s, { name: "", title: "" }]);
  const removeSpeaker = (i) => setSpeakers((s) => s.filter((_, idx) => idx !== i));
  const updateSpeaker = (i, field, value) => setSpeakers((s) => s.map((sp, idx) => (idx === i ? { ...sp, [field]: value } : sp)));
  const addAgenda = () => setAgenda((a) => [...a, ""]);
  const removeAgenda = (i) => setAgenda((a) => a.filter((_, idx) => idx !== i));
  const updateAgenda = (i, value) => setAgenda((a) => a.map((item, idx) => (idx === i ? value : item)));
  const addPrerequisite = () => setPrerequisites((p) => [...p, ""]);
  const removePrerequisite = (i) => setPrerequisites((p) => p.filter((_, idx) => idx !== i));
  const updatePrerequisite = (i, value) => setPrerequisites((p) => p.map((item, idx) => (idx === i ? value : item)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !time.trim() || !location.trim() || !category.trim() || !description.trim()) {
      toast.error("Missing required fields");
      return;
    }
    if (galleryFiles.length === 0) {
      toast.error("Add at least one image or video in the gallery.");
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

    try {
      await createEventByLink(token, formData);
      setSubmitted(true);
      toast.success("Event published successfully.");
    } catch (err) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  if (linkStatus === null) {
    return (
      <div className="min-h-screen darkthemebg pt-24 pb-20 flex items-center justify-center">
        <p className="text-gray-400">Checking link…</p>
      </div>
    );
  }

  if (!linkStatus.valid) {
    return (
      <div className="min-h-screen darkthemebg pt-24 pb-20 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-xl font-medium text-white mb-2">Link expired or invalid</p>
          <p className="text-gray-400 mb-6">This upload link has expired or is not valid. Ask for a new link.</p>
          <Link to="/" className="inline-block px-6 py-3 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium">
            Go to home
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen darkthemebg pt-24 pb-20 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-xl font-medium text-white mb-2">Event published</p>
          <p className="text-gray-400 mb-6">Your event has been uploaded successfully and will appear on the Events page.</p>
          <Link to="/events" className="inline-block px-6 py-3 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium">
            View events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen darkthemebg pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-sm font-medium mb-3">
            Upload via link
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Upload event</h1>
          <p className="text-gray-400">Fill the form below to publish an event. This link expires in 12 hours.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <SectionTitle icon="📋">Event details</SectionTitle>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. HACK N FRAG 2025" required />
              </div>
              <div>
                <label className={labelClass}>Category *</label>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} placeholder="e.g. BVEST Gaming Event" required />
              </div>
              <div>
                <label className={labelClass}>Location *</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="e.g. A-405, BVCOE" required />
              </div>
              <div>
                <label className={labelClass}>Short description (card) *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass + " min-h-[88px] resize-y"} placeholder="Brief description for the event card" required />
              </div>
              <div>
                <label className={labelClass}>Modal description (optional)</label>
                <textarea value={modalDescription} onChange={(e) => setModalDescription(e.target.value)} className={inputClass + " min-h-[88px] resize-y"} placeholder="Longer description for the Know More modal" />
              </div>
              <div>
                <label className={labelClass}>Target audience (optional)</label>
                <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className={inputClass} placeholder="e.g. All BVCOE students" />
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <SectionTitle icon="📅">Date & time</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date *</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass + " [color-scheme:dark]"} required />
              </div>
              <div>
                <label className={labelClass}>Time *</label>
                <input type="text" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} placeholder="e.g. 10:00 AM - 3:00 PM" required />
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <SectionTitle icon="🖼️">Gallery (images & videos) *</SectionTitle>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={(e) => { addGalleryFiles(e.target.files); e.target.value = ""; }} className="hidden" />
            <div onClick={() => fileInputRef.current?.click()} onDrop={(e) => { e.preventDefault(); addGalleryFiles(e.dataTransfer.files); }} onDragOver={(e) => e.preventDefault()} className="border-2 border-dashed border-gray-500/50 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors">
              <div className="text-4xl mb-2 opacity-80">📁</div>
              <p className="text-gray-300 font-medium">Drop files here or click to browse</p>
              <p className="text-sm text-gray-500 mt-1">At least one image or video required.</p>
            </div>
            {galleryFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryFiles.map((file, index) => {
                  const url = previewUrls[index];
                  const isVid = isVideo(file);
                  return (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-[#252536] border border-gray-500/30">
                      {isVid ? <video src={url} muted playsInline preload="metadata" className="w-full h-full object-cover" /> : <img src={url} alt="" className="w-full h-full object-cover" />}
                      <button type="button" onClick={() => removeGalleryFile(index)} className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center text-sm font-bold">×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon="🎤">Speakers</SectionTitle>
              <button type="button" onClick={addSpeaker} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">+ Add</button>
            </div>
            <div className="space-y-3">
              {speakers.map((sp, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" value={sp.name} onChange={(e) => updateSpeaker(i, "name", e.target.value)} className={inputClass + " flex-1"} placeholder="Name" />
                  <input type="text" value={sp.title} onChange={(e) => updateSpeaker(i, "title", e.target.value)} className={inputClass + " flex-1"} placeholder="Title / role" />
                  {speakers.length > 1 && <button type="button" onClick={() => removeSpeaker(i)} className="p-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 shrink-0">Remove</button>}
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon="📌">Agenda</SectionTitle>
              <button type="button" onClick={addAgenda} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">+ Add</button>
            </div>
            <div className="space-y-2">
              {agenda.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={item} onChange={(e) => updateAgenda(i, e.target.value)} className={inputClass} placeholder="Agenda item" />
                  {agenda.length > 1 && <button type="button" onClick={() => removeAgenda(i)} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">Remove</button>}
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon="✓">Prerequisites</SectionTitle>
              <button type="button" onClick={addPrerequisite} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">+ Add</button>
            </div>
            <div className="space-y-2">
              {prerequisites.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={item} onChange={(e) => updatePrerequisite(i, e.target.value)} className={inputClass} placeholder="Prerequisite" />
                  {prerequisites.length > 1 && <button type="button" onClick={() => removePrerequisite(i)} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">Remove</button>}
                </div>
              ))}
            </div>
          </section>

          <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {loading ? "Publishing…" : "Publish event"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadEventByLink;
