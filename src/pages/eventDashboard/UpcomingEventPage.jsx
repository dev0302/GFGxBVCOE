import { useState, useEffect, useCallback } from "react";
import {
  getUpcomingEvents,
  createUpcomingEvent,
  updateUpcomingEvent,
  deleteUpcomingEvent,
} from "../../services/api";
import { toast } from "sonner";
import { SectionTitle, inputClass, labelClass } from "../../components/EventDashboard/SectionTitle";
import { Calendar, Plus, Edit3, Trash2, X } from "react-feather";
import { Spinner } from "@/components/ui/spinner";
import { NativeTypewriter } from "../../components/ui/native-typewriter";
import { motion, AnimatePresence } from "framer-motion";

const initialForm = {
  title: "",
  date: "",
  description: "",
  poster: "",
  location: "",
  time: "",
  targetAudience: "",
  otherLinks: "",
  otherDocs: "",
};

const initialFaq = () => ({ question: "", answer: "" });


export default function UpcomingEventPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [faqs, setFaqs] = useState([]);
  const [posterFile, setPosterFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const addFaq = () => setFaqs((p) => [...p, initialFaq()]);
  const removeFaq = (index) => setFaqs((p) => p.filter((_, i) => i !== index));
  const updateFaq = (index, field, value) =>
    setFaqs((p) => p.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const load = useCallback(() => {
    getUpcomingEvents()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setList(res.data);
        else setList([]);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditItem(null);
    setForm(initialForm);
    setFaqs([]);
    setPosterFile(null);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || "",
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : "",
      description: item.description || "",
      poster: item.poster || "",
      location: item.location || "",
      time: item.time || "",
      targetAudience: item.targetAudience || "",
      otherLinks: typeof item.otherLinks === "string" ? item.otherLinks : (item.otherLinks ? JSON.stringify(item.otherLinks, null, 2) : ""),
      otherDocs: item.otherDocs || "",
    });
    setFaqs(Array.isArray(item.faqs) && item.faqs.length > 0
      ? item.faqs.map((f) => ({ question: f.question || "", answer: f.answer || "" }))
      : []);
    setPosterFile(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditItem(null);
    setForm(initialForm);
    setFaqs([]);
    setPosterFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.date?.trim()) {
      toast.error("Date is required");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("date", form.date);
      if (form.description?.trim()) fd.append("description", form.description.trim());
      if (form.location?.trim()) fd.append("location", form.location.trim());
      if (form.time?.trim()) fd.append("time", form.time.trim());
      if (form.targetAudience?.trim()) fd.append("targetAudience", form.targetAudience.trim());
      if (form.otherLinks?.trim()) fd.append("otherLinks", form.otherLinks.trim());
      if (form.otherDocs?.trim()) fd.append("otherDocs", form.otherDocs.trim());
      if (posterFile) fd.append("poster", posterFile);
      const faqsToSave = faqs.filter((f) => (f.question || "").trim() || (f.answer || "").trim());
      if (faqsToSave.length > 0) fd.append("faqs", JSON.stringify(faqsToSave));

      if (editItem) {
        await updateUpcomingEvent(editItem._id, fd);
        toast.success("Upcoming event updated");
      } else {
        await createUpcomingEvent(fd);
        toast.success("Upcoming event added");
      }
      closeForm();
      load();
    } catch (err) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteUpcomingEvent(id);
      toast.success("Deleted");
      setDeleteConfirmId(null);
      load();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" });
  };

  return (
    <div className="flex min-h-full w-full justify-center bg-[#1e1e2f] pb-20 px-4 sm:px-6 lg:px-10">
      <div className="w-full max-w-3xl py-10 flex flex-col gap-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Upcoming event</h1>
          <p className="mt-2 text-gray-400 text-sm">
            <NativeTypewriter content="Events shown below hero on Home and Events page. Past events are auto-removed on the event date." className="text-gray-400 text-sm" speed={15} cursor={false} />
          </p>
        </div>

        <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
          <SectionTitle icon="📅">Upcoming events</SectionTitle>
          
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium text-sm border border-cyan-500/30 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add upcoming event
          </button>
          {loading ? (
            <div className="py-8 flex justify-center"><Spinner className="size-6 text-cyan-400" /></div>
          ) : list.length === 0 ? (
            <div className="mt-6 p-8 rounded-2xl bg-[#252536]/50 border border-gray-500/20 text-center">
              <Calendar className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No upcoming events yet.</p>
              <p className="text-gray-500 text-xs mt-1">Add one to show it on Home and Events page.</p>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {list.map((item, idx) => (
                <motion.li
                  key={item._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-[#252536]/80 border border-gray-500/20 hover:border-cyan-500/30 hover:bg-[#252536] transition-all duration-200"
                >
                  <div className="min-w-0 flex-1 flex items-center gap-4">
                    {item.poster ? (
                      <img src={item.poster} alt="" className="h-14 w-14 rounded-xl object-cover shrink-0 border border-gray-500/30" />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <Calendar className="h-6 w-6 text-cyan-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-semibold text-white block truncate">{item.title}</span>
                      <span className="text-xs text-cyan-400/90 block">{formatDate(item.date)}</span>
                      {item.description && (
                        <span className="text-xs text-gray-500 line-clamp-2 max-w-xl mt-0.5">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="p-2.5 rounded-xl text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    {deleteConfirmId === item._id ? (
                      <span className="flex items-center gap-2 text-sm px-2">
                        <span className="text-gray-400">Delete?</span>
                        <button type="button" onClick={() => handleDelete(item._id)} className="text-red-400 hover:text-red-300 font-medium">Yes</button>
                        <button type="button" onClick={() => setDeleteConfirmId(null)} className="text-gray-400 hover:text-white">No</button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(item._id)}
                        className="p-2.5 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeForm}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#1e1e2f] rounded-2xl border border-gray-500/30 w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 flex items-center justify-between p-5 border-b border-gray-500/30 bg-[#1e1e2f]/98 backdrop-blur-sm z-10 rounded-t-2xl">
                <h2 className="text-lg font-bold text-white">{editItem ? "Edit upcoming event" : "Add upcoming event"}</h2>
                <button type="button" onClick={closeForm} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-500/30 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Basics</h3>
                  <div>
                    <label className={labelClass}>Event name / Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      className={inputClass}
                      placeholder="Event name"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Date *</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Time (optional)</label>
                      <input
                        type="text"
                        value={form.time}
                        onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                        className={inputClass}
                        placeholder="e.g. 10:00 AM"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Description (optional)</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      className={inputClass + " min-h-[100px]"}
                      placeholder="Short description for the upcoming event"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Venue & audience</h3>
                  <div>
                    <label className={labelClass}>Location (optional)</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                      className={inputClass}
                      placeholder="Venue or address"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Target audience (optional)</label>
                    <input
                      type="text"
                      value={form.targetAudience}
                      onChange={(e) => setForm((p) => ({ ...p, targetAudience: e.target.value }))}
                      className={inputClass}
                      placeholder="e.g. 2nd year CSE"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Media & links</h3>
                  <div>
                    <label className={labelClass}>Poster image (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#252536] border border-gray-500/40 text-gray-300 text-sm file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:text-cyan-400 file:font-medium"
                    />
                    {form.poster && !posterFile && (
                      <img src={form.poster} alt="Current poster" className="mt-2 h-28 rounded-xl object-cover border border-gray-500/30" />
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Other links (optional) — JSON or "Label, URL" per line</label>
                    <textarea
                      value={form.otherLinks}
                      onChange={(e) => setForm((p) => ({ ...p, otherLinks: e.target.value }))}
                      className={inputClass + " min-h-[80px]"}
                      placeholder='[{"label":"Register","url":"https://..."}] or one per line'
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Other docs / URLs (optional)</label>
                    <textarea
                      value={form.otherDocs}
                      onChange={(e) => setForm((p) => ({ ...p, otherDocs: e.target.value }))}
                      className={inputClass + " min-h-[60px]"}
                      placeholder="One URL per line"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">FAQs (optional)</h3>
                  <p className="text-xs text-gray-500">These appear in the FAQ accordion below the event on the Events page.</p>
                  {faqs.map((faq, index) => (
                    <div key={index} className="p-4 rounded-xl bg-[#252536]/60 border border-gray-500/20 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-gray-400">FAQ #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeFaq(index)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Remove FAQ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div>
                        <label className={labelClass}>Question</label>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => updateFaq(index, "question", e.target.value)}
                          className={inputClass}
                          placeholder="e.g. Where will the event be held?"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Answer</label>
                        <textarea
                          value={faq.answer}
                          onChange={(e) => updateFaq(index, "answer", e.target.value)}
                          className={inputClass + " min-h-[72px]"}
                          placeholder="Short answer"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFaq}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 text-sm font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add FAQ
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeForm} className="flex-1 py-3 rounded-xl border border-gray-500/50 text-gray-300 hover:bg-gray-500/20 font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold disabled:opacity-50 transition-colors">
                    {saving ? "Saving…" : editItem ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
