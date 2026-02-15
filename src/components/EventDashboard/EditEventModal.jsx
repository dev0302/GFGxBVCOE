import { useState, useRef } from "react";
import { toast } from "sonner";
import { updateEvent } from "../../services/api";
import { inputClass, labelClass } from "./SectionTitle";

export default function EditEventModal({ event, onClose, onSaved }) {
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
}
