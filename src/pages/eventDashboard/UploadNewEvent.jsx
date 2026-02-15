import { useState, useRef, useCallback, useEffect } from "react";
import { createEvent } from "../../services/api";
import { toast } from "sonner";
import { SectionTitle, inputClass, labelClass } from "../../components/EventDashboard/SectionTitle";

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const isVideo = (file) => file?.type?.startsWith("video/") || VIDEO_TYPES.includes(file?.type);

export default function UploadNewEvent() {
  const [loading, setLoading] = useState(false);
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

  previewUrlsRef.current = previewUrls;
  useEffect(() => {
    return () => previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
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

  const addSpeaker = () => setSpeakers((s) => [...s, { name: "", title: "" }]);
  const removeSpeaker = (i) => setSpeakers((s) => s.filter((_, idx) => idx !== i));
  const updateSpeaker = (i, field, value) => setSpeakers((s) => s.map((sp, idx) => (idx === i ? { ...sp, [field]: value } : sp)));
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

    toast.promise(createEvent(formData), {
      loading: "Uploading event…",
      success: () => {
        resetForm();
        return "Event published successfully.";
      },
      error: (err) => err.message || "Upload failed.",
    }).finally(() => setLoading(false));
  };

  return (
    <div className="flex min-h-full w-full justify-center bg-[#1e1e2f] pb-20 px-4 sm:px-6 lg:px-10">
      <div className="w-full max-w-3xl py-10 flex flex-col gap-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Upload new event</h1>
          <p className="mt-2 text-gray-400 text-sm">New events appear on the Events page. Add images and videos for the gallery.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
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
            <div
              onDrop={(e) => { e.preventDefault(); addGalleryFiles(e.dataTransfer.files); }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-500/50 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors"
            >
              <div className="text-4xl mb-2 opacity-80">📁</div>
              <p className="text-gray-300 font-medium">Drop files here or click to browse</p>
              <p className="text-sm text-gray-500 mt-1">Images and videos. Multiple files supported.</p>
            </div>
            {galleryFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryFiles.map((file, index) => {
                  const url = previewUrls[index];
                  const isVid = isVideo(file);
                  return (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-[#252536] border border-gray-500/30">
                      {isVid ? <video src={url} muted playsInline preload="metadata" className="w-full h-full object-cover" /> : <img src={url} alt="" className="w-full h-full object-cover" />}
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeGalleryFile(index); }} className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center text-sm font-bold">×</button>
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
}
