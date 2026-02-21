import { useState, useEffect, useCallback } from "react";
import { getEventsForManage, deleteEvent, cancelScheduledDelete, forceDeleteEvent, getForceDeleteAllowed } from "../../services/api";
import { toast } from "sonner";
import { SectionTitle } from "../../components/EventDashboard/SectionTitle";
import EditEventModal from "../../components/EventDashboard/EditEventModal";
import { Spinner } from "@/components/ui/spinner";
import { NativeTypewriter } from "../../components/ui/native-typewriter";

export default function ManageEvents() {
  const [managedEvents, setManagedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmEv, setDeleteConfirmEv] = useState(null);
  const [forceDeleteConfirmEv, setForceDeleteConfirmEv] = useState(null);
  const [forceDeletingId, setForceDeletingId] = useState(null);
  const [canForceDelete, setCanForceDelete] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [editingEv, setEditingEv] = useState(null);

  const loadManagedEvents = useCallback(() => {
    setLoading(true);
    getEventsForManage()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setManagedEvents(res.data);
      })
      .catch(() => setManagedEvents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadManagedEvents();
  }, [loadManagedEvents]);

  useEffect(() => {
    getForceDeleteAllowed()
      .then((res) => setCanForceDelete(res.success && res.allowed === true))
      .catch(() => setCanForceDelete(false));
  }, []);

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

  const openForceDeleteConfirm = (ev) => setForceDeleteConfirmEv(ev);
  const closeForceDeleteConfirm = () => setForceDeleteConfirmEv(null);

  const handleConfirmForceDelete = async () => {
    if (!forceDeleteConfirmEv) return;
    const id = forceDeleteConfirmEv._id;
    setForceDeletingId(id);
    closeForceDeleteConfirm();
    toast.promise(forceDeleteEvent(id), {
      loading: "Deleting permanently…",
      success: () => {
        loadManagedEvents();
        return "Event deleted permanently.";
      },
      error: (err) => err.message || "Failed to force-delete.",
    }).finally(() => setForceDeletingId(null));
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
    return new Date(dateStr).toLocaleDateString(undefined, { dateStyle: "medium" });
  };

  return (
    <div className="flex min-h-full w-full justify-center bg-[#1e1e2f] pb-20 px-3 sm:px-6 md:px-8 lg:px-10">
      <div className="w-full max-w-3xl py-6 sm:py-8 md:py-10 flex flex-col gap-6 sm:gap-8 md:gap-10">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">Manage uploaded events</h1>
          <p className="mt-1.5 sm:mt-2 text-gray-400 text-xs sm:text-sm">
          <NativeTypewriter content="Only events uploaded through this dashboard. Hardcoded events on the Events page are not listed here." className="text-gray-400 text-xs sm:text-sm" speed={15} cursor={false} />
        </p>
        </div>

        <section className="bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 border border-gray-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl">
          <SectionTitle icon="⚙️">Events list</SectionTitle>
          {loading ? (
            <div className="min-h-[180px] flex items-center justify-center">
              <Spinner className="size-5 text-gray-400" />
            </div>
          ) : managedEvents.length === 0 ? (
            <p className="text-gray-500 py-4 sm:py-6 text-center text-sm sm:text-base rounded-xl bg-[#252536]/50 border border-gray-500/20">No uploaded events yet.</p>
          ) : (
            <ul className="space-y-2 sm:space-y-3">
              {managedEvents.map((ev) => (
                <li key={ev._id} className="relative flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-3 px-3 py-3 pr-24 sm:px-5 sm:py-4 sm:pr-28 rounded-lg sm:rounded-xl bg-[#252536] border border-gray-500/20 hover:border-gray-500/40 transition-colors">
                  {canForceDelete && (
                    <button
                      type="button"
                      onClick={() => openForceDeleteConfirm(ev)}
                      disabled={forceDeletingId === ev._id}
                      className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2 py-1 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] rounded-md bg-rose-600/40 text-white hover:bg-rose-600/80 font-medium disabled:opacity-50"
                      title="Delete permanently now (no 10-day delay)"
                    >
                      {forceDeletingId === ev._id ? "Deleting…" : "Force delete"}
                    </button>
                  )}
                  <div className="min-w-0 flex-1 order-1">
                    <span className="font-medium text-white block truncate text-sm sm:text-base">{ev.title}</span>
                    <span className="text-xs text-gray-400 block mt-0.5 sm:mt-0">
                      {ev.date} · {ev.category}
                      {ev.scheduledDeleteAt && <span className="ml-1 sm:ml-2 text-amber-400">· Deletes {formatScheduledDate(ev.scheduledDeleteAt)}</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 order-2 sm:order-none flex-wrap">
                    <button type="button" onClick={() => setEditingEv(ev)} className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium">
                      Edit
                    </button>
                    {ev.scheduledDeleteAt ? (
                      <button type="button" onClick={() => handleCancelScheduledDelete(ev)} disabled={cancellingId === ev._id} className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-medium disabled:opacity-50">
                        {cancellingId === ev._id ? "Cancelling…" : "Cancel deletion"}
                      </button>
                    ) : (
                      <button type="button" onClick={() => openDeleteConfirm(ev)} disabled={deletingId === ev._id} className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium disabled:opacity-50">
                        {deletingId === ev._id ? "Scheduling…" : "Delete"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {deleteConfirmEv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60" onClick={closeDeleteConfirm}>
            <div className="bg-[#1e1e2f] border border-gray-500/30 rounded-xl sm:rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Delete event?</h3>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">This event will stay in the database for 10 days. After 10 days it will be automatically deleted if not cancelled. You can cancel the deletion anytime before then.</p>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
                <button type="button" onClick={closeDeleteConfirm} className="w-full sm:w-auto px-3 py-2 sm:px-4 rounded-lg border border-gray-500/50 text-gray-300 hover:bg-gray-500/20 font-medium text-sm sm:text-base">Cancel</button>
                <button type="button" onClick={handleConfirmScheduleDelete} className="w-full sm:w-auto px-3 py-2 sm:px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium text-sm sm:text-base">Delete</button>
              </div>
            </div>
          </div>
        )}

        {forceDeleteConfirmEv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60" onClick={closeForceDeleteConfirm}>
            <div className="bg-[#1e1e2f] border border-gray-500/30 rounded-xl sm:rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-600/30 flex items-center justify-center text-rose-400 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Force delete event?</h3>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">This will permanently delete the event from the database immediately. This cannot be undone.</p>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
                <button type="button" onClick={closeForceDeleteConfirm} className="w-full sm:w-auto px-3 py-2 sm:px-4 rounded-lg border border-gray-500/50 text-gray-300 hover:bg-gray-500/20 font-medium text-sm sm:text-base">Cancel</button>
                <button type="button" onClick={handleConfirmForceDelete} className="w-full sm:w-auto px-3 py-2 sm:px-4 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-medium text-sm sm:text-base">Force delete</button>
              </div>
            </div>
          </div>
        )}

        {editingEv && (
          <EditEventModal
            event={editingEv}
            onClose={() => setEditingEv(null)}
            onSaved={() => { setEditingEv(null); loadManagedEvents(); }}
          />
        )}
      </div>
    </div>
  );
}
