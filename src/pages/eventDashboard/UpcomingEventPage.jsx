import { useState, useEffect, useCallback } from "react";
import {
  getUpcomingEvents,
  createUpcomingEvent,
  updateUpcomingEvent,
  deleteUpcomingEvent,
} from "../../services/api";
import { toast } from "sonner";
import { SectionTitle } from "../../components/EventDashboard/SectionTitle";
import { Calendar, Plus, Edit3, Trash2, X } from "react-feather";

const initialForm = {
  title: "",
  date: "",
  poster: "",
  location: "",
  time: "",
  targetAudience: "",
  otherLinks: "",
  otherDocs: "",
};

export default function UpcomingEventPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [posterFile, setPosterFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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
    setPosterFile(null);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || "",
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : "",
      poster: item.poster || "",
      location: item.location || "",
      time: item.time || "",
      targetAudience: item.targetAudience || "",
      otherLinks: typeof item.otherLinks === "string" ? item.otherLinks : (item.otherLinks ? JSON.stringify(item.otherLinks, null, 2) : ""),
      otherDocs: item.otherDocs || "",
    });
    setPosterFile(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditItem(null);
    setForm(initialForm);
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
      if (form.location?.trim()) fd.append("location", form.location.trim());
      if (form.time?.trim()) fd.append("time", form.time.trim());
      if (form.targetAudience?.trim()) fd.append("targetAudience", form.targetAudience.trim());
      if (form.otherLinks?.trim()) fd.append("otherLinks", form.otherLinks.trim());
      if (form.otherDocs?.trim()) fd.append("otherDocs", form.otherDocs.trim());
      if (posterFile) fd.append("poster", posterFile);

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
          <p className="mt-2 text-gray-400 text-sm">Events shown below hero on Home and Events page. Past events are auto-removed on the event date.</p>
        </div>

        <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
          <SectionTitle icon="📅">Upcoming events</SectionTitle>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            Add upcoming event
          </button>
          {loading ? (
            <p className="text-gray-500 py-6">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-gray-500 py-6 mt-4 rounded-xl bg-[#252536]/50 border border-gray-500/20">No upcoming events. Add one to show it on Home and Events page.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {list.map((item) => (
                <li
                  key={item._id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-xl bg-[#252536] border border-gray-500/20 hover:border-gray-500/40 transition-colors"
                >
                  <div className="min-w-0 flex-1 flex items-center gap-3">
                    {item.poster && (
                      <img src={item.poster} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                    )}
                    <div>
                      <span className="font-medium text-white block truncate">{item.title}</span>
                      <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-500/20"
                      title="Edit"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    {deleteConfirmId === item._id ? (
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Delete?</span>
                        <button type="button" onClick={() => handleDelete(item._id)} className="text-red-400 hover:text-red-300 font-medium">Yes</button>
                        <button type="button" onClick={() => setDeleteConfirmId(null)} className="text-gray-400">No</button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(item._id)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/20"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeForm} role="dialog" aria-modal="true">
          <div
            className="bg-[#1e1e2f] rounded-2xl border border-gray-500/30 w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-500/30 bg-[#1e1e2f]/95 z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white">{editItem ? "Edit upcoming event" : "Add upcoming event"}</h2>
              <button type="button" onClick={closeForm} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-500/30">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Event name / Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 outline-none text-sm"
                  placeholder="Event name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#252536] border border-gray-500/40 text-white focus:border-cyan-500 outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Poster image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 rounded-lg bg-[#252536] border border-gray-500/40 text-gray-300 text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-cyan-500/20 file:text-cyan-400"
                />
                {form.poster && !posterFile && (
                  <img src={form.poster} alt="Current" className="mt-2 h-24 rounded-lg object-cover border border-gray-500/30" />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Location (optional)</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 outline-none text-sm"
                  placeholder="Venue or address"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Time (optional)</label>
                <input
                  type="text"
                  value={form.time}
                  onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 outline-none text-sm"
                  placeholder="e.g. 10:00 AM"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Target audience (optional)</label>
                <input
                  type="text"
                  value={form.targetAudience}
                  onChange={(e) => setForm((p) => ({ ...p, targetAudience: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 outline-none text-sm"
                  placeholder="e.g. 2nd year CSE"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Other links (optional) — JSON or "Label, URL" per line</label>
                <textarea
                  value={form.otherLinks}
                  onChange={(e) => setForm((p) => ({ ...p, otherLinks: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 outline-none text-sm min-h-[80px]"
                  placeholder='[{"label":"Register","url":"https://..."}] or one per line'
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Other docs / URLs (optional)</label>
                <textarea
                  value={form.otherDocs}
                  onChange={(e) => setForm((p) => ({ ...p, otherDocs: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#252536] border border-gray-500/40 text-white placeholder-gray-500 focus:border-cyan-500 outline-none text-sm min-h-[60px]"
                  placeholder="One URL per line"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 rounded-xl border border-gray-500/50 text-gray-300 hover:bg-gray-500/20">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold disabled:opacity-50">
                  {saving ? "Saving…" : editItem ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
