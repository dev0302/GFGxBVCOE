import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { updateEvent } from "../../services/api";
import { inputClass as defaultInputClass, labelClass as defaultLabelClass } from "./SectionTitle";
import { cloudinaryImageUrl } from "../../utils/cloudinary";

function isVideoUrl(url) {
  return /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(url);
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `n-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildInitialGalleryItems(event) {
  const urls = event?.galleryImages ?? [];
  return urls.map((url, i) => ({
    id: `ex-${i}-${newId()}`,
    type: "existing",
    url,
  }));
}

function moveItem(arr, from, to) {
  if (from === to) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const DRAG_MIME = "application/x-gallery-index";

export default function EditEventModal({ event, onClose, onSaved, inputClass: inputClassProp, labelClass: labelClassProp }) {
  const inputClass = inputClassProp ?? defaultInputClass;
  const labelClass = labelClassProp ?? defaultLabelClass;
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
  const [galleryItems, setGalleryItems] = useState(() => buildInitialGalleryItems(event));
  const [saving, setSaving] = useState(false);
  const [dragFromIndex, setDragFromIndex] = useState(null);
  const fileInputRef = useRef(null);
  const galleryItemsRef = useRef(galleryItems);
  galleryItemsRef.current = galleryItems;

  useEffect(() => {
    return () => {
      galleryItemsRef.current.forEach((item) => {
        if (item.type === "new" && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
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

  const addGalleryFiles = (newFiles) => {
    const list = Array.from(newFiles || []);
    if (list.length === 0) return;
    setGalleryItems((prev) => [
      ...prev,
      ...list.map((file) => ({
        id: newId(),
        type: "new",
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const removeGalleryItem = (id) => {
    setGalleryItems((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.type === "new" && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData(DRAG_MIME, String(index));
    e.dataTransfer.effectAllowed = "move";
    setDragFromIndex(index);
  };

  const handleDragEnd = () => {
    setDragFromIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnIndex = (e, dropIndex) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData(DRAG_MIME);
    const from = parseInt(raw, 10);
    if (Number.isNaN(from)) return;
    setGalleryItems((prev) => moveItem(prev, from, dropIndex));
    setDragFromIndex(null);
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

    const keptExistingUrls = galleryItems.filter((i) => i.type === "existing").map((i) => i.url);
    formData.append("galleryKeepUrls", JSON.stringify(keptExistingUrls));

    let newIdx = 0;
    const galleryOrder = galleryItems.map((item) => {
      if (item.type === "existing") return item.url;
      const idx = newIdx++;
      return `__new__${idx}`;
    });
    formData.append("galleryOrder", JSON.stringify(galleryOrder));

    galleryItems.forEach((item) => {
      if (item.type === "new") formData.append("gallery", item.file);
    });

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
              <button type="button" onClick={addSpeaker} className="text-sm text-cyan-400 hover:text-cyan-300">
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {speakers.map((sp, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={sp.name} onChange={(e) => updateSpeaker(i, "name", e.target.value)} className={inputClass + " flex-1"} placeholder="Name" />
                  <input type="text" value={sp.title} onChange={(e) => updateSpeaker(i, "title", e.target.value)} className={inputClass + " flex-1"} placeholder="Title" />
                  {speakers.length > 1 && (
                    <button type="button" onClick={() => removeSpeaker(i)} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Agenda</label>
              <button type="button" onClick={addAgenda} className="text-sm text-cyan-400 hover:text-cyan-300">
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {agenda.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={item} onChange={(e) => updateAgenda(i, e.target.value)} className={inputClass} />
                  {agenda.length > 1 && (
                    <button type="button" onClick={() => removeAgenda(i)} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Prerequisites</label>
              <button type="button" onClick={addPrerequisite} className="text-sm text-cyan-400 hover:text-cyan-300">
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {prerequisites.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={item} onChange={(e) => updatePrerequisite(i, e.target.value)} className={inputClass} />
                  {prerequisites.length > 1 && (
                    <button type="button" onClick={() => removePrerequisite(i)} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Gallery</label>
            <p className="text-xs text-gray-500 mb-2">
              Drag and drop to reorder. The <span className="text-cyan-400/90 font-medium">first</span> item is the event card thumbnail on the Events page. Click × to remove. Add new
              files below.
            </p>
            {galleryItems.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 mb-3">
                {galleryItems.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnIndex(e, index)}
                    className={`relative w-[4.5rem] h-[4.5rem] rounded-lg overflow-hidden bg-[#252536] shrink-0 cursor-grab active:cursor-grabbing border transition-colors ${
                      index === 0 ? "border-cyan-500/50 ring-1 ring-cyan-500/30" : "border-transparent"
                    } ${dragFromIndex === index ? "opacity-60" : ""}`}
                    title="Drag to reorder"
                  >
                    {index === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 z-[1] bg-black/65 text-[9px] text-center text-cyan-200/95 py-0.5 pointer-events-none">Thumbnail</span>
                    )}
                    {item.type === "existing" ? (
                      isVideoUrl(item.url) ? (
                        <video src={item.url} className="w-full h-full object-cover pointer-events-none" muted playsInline />
                      ) : (
                        <img src={cloudinaryImageUrl(item.url)} alt="" className="w-full h-full object-cover pointer-events-none" />
                      )
                    ) : item.file.type.startsWith("video/") ? (
                      <video src={item.previewUrl} className="w-full h-full object-cover pointer-events-none" muted playsInline />
                    ) : (
                      <img src={item.previewUrl} alt="" className="w-full h-full object-cover pointer-events-none" />
                    )}
                    <button
                      type="button"
                      draggable={false}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => removeGalleryItem(item.id)}
                      className="absolute top-0.5 right-0.5 z-[2] w-5 h-5 rounded bg-red-500 text-white text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => {
                addGalleryFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 border border-dashed border-gray-500/50 rounded-xl text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400"
            >
              Add new images/videos
            </button>
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
