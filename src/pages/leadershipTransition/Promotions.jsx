import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SectionTitle } from "../../components/EventDashboard/SectionTitle";
import { Spinner } from "@/components/ui/spinner";
import {
  getLeadershipPeople,
  getLeadershipPositions,
  promoteLeadershipPerson,
  endLeadershipSession,
  getLeadershipDraft,
  finalizeLeadershipDraft,
  approveLeadershipDraft,
  revokeLeadershipDraftApproval,
  discardLeadershipDraft,
  applyLeadershipDraft,
  removeLeadershipDraftChange,
  downloadLeadershipReport,
  getAccountTypeLabel,
} from "../../services/api";
import {
  subscribeLeadershipUpdates,
  joinLeadershipPromotions,
  leaveLeadershipPromotions,
  subscribeLeadershipDraftEvents,
} from "../../services/socket";
import { cloudinaryTinyAvatarUrl } from "../../utils/cloudinary";
import { CollaboratorAvatars } from "../../components/LeadershipTransition/CollaboratorAvatars";
import { useAuth } from "../../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle, Search as SearchIcon, X, TrendingUp, LogOut, FileText, Users } from "react-feather";

const CORE_APPROVAL_HINT =
  "At least one person from: Faculty Incharge, Chairperson, or Vice-Chairperson.";
const DEPARTMENT_APPROVAL_HINT =
  "At least one person from: any Department Head or any Department Lead.";
const APPLY_CHANGES_HINT =
  "Apply is enabled once one core approver and one department approver have both added their approval.";

function getFirstName(name = "") {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "Member";
  return trimmed.split(/\s+/)[0];
}

function getApproverImage(approval, collaborators = []) {
  if (approval?.image) return approval.image;
  const match = collaborators.find((c) => c.userId === approval.userId);
  return match?.image || "";
}

function ApprovalSectionLabel({ title, hint }) {
  return (
    <div className="group relative inline-block">
      <p className="cursor-help text-sm font-bold tracking-wide text-cyan-300">{title}</p>
      <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-lg border border-cyan-500/20 bg-[#12121f] p-3 text-xs leading-relaxed text-gray-300 shadow-xl group-hover:block">
        {hint}
      </div>
    </div>
  );
}

function ApprovalApproverRow({ approval, collaborators }) {
  const image = getApproverImage(approval, collaborators);
  const firstName = getFirstName(approval.name);

  return (
    <div className="mt-2 flex items-center gap-2.5">
      <PersonAvatar image={image} name={approval.name} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-emerald-300">{firstName}</p>
        <p className="truncate text-xs text-gray-500">{approval.role}</p>
      </div>
      <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
    </div>
  );
}

function PersonAvatar({ image, name, size = "md" }) {
  const src = image ? cloudinaryTinyAvatarUrl(image) : "";
  const initials = String(name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  const sizeClass = size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs";

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${sizeClass} rounded-full object-cover border border-gray-500/40`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} items-center justify-center rounded-full bg-cyan-600/30 font-semibold text-cyan-100`}
    >
      {initials || "?"}
    </div>
  );
}

function countChanges(changes = []) {
  const promotions = changes.filter(
    (c) => c.changeType === "promotion" || c.changeType === "role_change"
  ).length;
  const transfers = changes.filter((c) => c.changeType === "department_transfer").length;
  const sessionEnds = changes.filter((c) => c.changeType === "end_session").length;
  return { promotions, transfers, sessionEnds, total: changes.length };
}

function statusLabel(status) {
  const map = {
    DRAFT: "Draft Mode",
    APPROVAL_PENDING: "Awaiting Approvals",
    READY_TO_APPLY: "Ready to Apply",
    APPLIED: "Applied",
    DISCARDED: "Discarded",
  };
  return map[status] || status;
}

export default function Promotions() {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personAction, setPersonAction] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [pendingEndSession, setPendingEndSession] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [viewChangesOpen, setViewChangesOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastReportSessionId, setLastReportSessionId] = useState(null);

  const loadDraft = useCallback(async () => {
    try {
      const res = await getLeadershipDraft();
      if (res.success) {
        setDraft(res.data || null);
        setApprovalStatus(res.approvalStatus || null);
      }
    } catch (err) {
      console.error("Failed to load draft:", err);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [peopleRes, positionsRes] = await Promise.all([
        getLeadershipPeople(),
        getLeadershipPositions(),
      ]);
      if (peopleRes.success) setPeople(peopleRes.data || []);
      if (positionsRes.success) setPositions(positionsRes.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadDraft();
    joinLeadershipPromotions();

    return () => {
      leaveLeadershipPromotions();
    };
  }, [loadData, loadDraft]);

  useEffect(() => {
    return subscribeLeadershipDraftEvents((payload) => {
      if (payload.collaborators) setCollaborators(payload.collaborators);
      if (payload.event === "draft-discarded") {
        setDraft(null);
        setApprovalStatus(null);
        setFinalizeOpen(false);
        setViewChangesOpen(false);
      }
      if (payload.event === "changes-applied") {
        setDraft(null);
        setApprovalStatus(null);
        setFinalizeOpen(false);
        if (payload.session?.sessionId) {
          setLastReportSessionId(payload.session.sessionId);
        }
        loadData();
      }
      if (
        payload.event === "draft-updated" ||
        payload.event === "approval-added" ||
        payload.event === "approval-removed" ||
        payload.event === "draft-created" ||
        payload.event === "leadership-draft-state"
      ) {
        loadDraft();
      }
    });
  }, [loadData, loadDraft]);

  useEffect(() => {
    return subscribeLeadershipUpdates(() => {
      loadData();
      loadDraft();
    });
  }, [loadData, loadDraft]);

  const hasActiveDraft = draft && ["DRAFT", "APPROVAL_PENDING", "READY_TO_APPLY"].includes(draft.status);
  const shouldWarnLeave =
    hasActiveDraft &&
    (draft.status === "DRAFT" ||
      (draft.status === "APPROVAL_PENDING" && !approvalStatus?.complete));

  useEffect(() => {
    const handler = (e) => {
      if (shouldWarnLeave) {
        e.preventDefault();
        e.returnValue =
          "You are currently participating in an active Leadership Change Session. Leaving now may discard pending changes if no approver remains.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [shouldWarnLeave]);

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.position || "").toLowerCase().includes(q) ||
        (p.accountType || "").toLowerCase().includes(q)
    );
  }, [people, search]);

  const groupedPositions = useMemo(() => {
    const society = positions.filter((p) =>
      ["chairperson", "vice-chairperson"].includes(p.id)
    );
    const byDept = {};
    for (const pos of positions) {
      if (society.some((s) => s.id === pos.id)) continue;
      const dept = pos.accountType;
      if (!byDept[dept]) byDept[dept] = [];
      byDept[dept].push(pos);
    }
    return { society, byDept };
  }, [positions]);

  const changeCounts = useMemo(
    () => countChanges(draft?.pendingChanges || []),
    [draft]
  );

  const currentUserId = user?._id ? String(user._id) : "";
  const isSessionCreator = Boolean(
    draft?.createdBy && currentUserId && String(draft.createdBy) === currentUserId
  );
  const userHasApproved = Boolean(
    draft?.approvals?.some((approval) => approval.userId === currentUserId)
  );
  const applyChangesDisabled = actionLoading || !approvalStatus?.complete;

  const closePersonModal = () => {
    if (promoting || endingSession) return;
    setPendingPromotion(null);
    setPendingEndSession(false);
    setPersonAction(null);
    setSelectedPerson(null);
  };

  const handleEndSession = async () => {
    if (!selectedPerson || endingSession) return;
    setEndingSession(true);
    try {
      const res = await endLeadershipSession({
        personType: selectedPerson.type,
        personId: selectedPerson.id,
        sourceDepartment: selectedPerson.sourceDepartment || undefined,
      });
      if (res.success) {
        if (res.data) setPeople(res.data);
        if (res.draft) setDraft(res.draft);
        toast.success(res.message || "Session end queued in draft");
        setPendingEndSession(false);
        setPersonAction(null);
        setSelectedPerson(null);
      }
    } catch (err) {
      toast.error(err.message || "Failed to queue session end");
    } finally {
      setEndingSession(false);
    }
  };

  const handlePromote = async (position) => {
    if (!selectedPerson || promoting) return;
    setPromoting(true);
    try {
      const res = await promoteLeadershipPerson({
        personType: selectedPerson.type,
        personId: selectedPerson.id,
        sourceDepartment: selectedPerson.sourceDepartment || undefined,
        targetPositionId: position.id,
      });
      if (res.success) {
        if (res.data) setPeople(res.data);
        if (res.draft) setDraft(res.draft);
        toast.success(res.message || "Promotion queued in draft");
        setPendingPromotion(null);
        setSelectedPerson(null);
      }
    } catch (err) {
      toast.error(err.message || "Failed to queue promotion");
    } finally {
      setPromoting(false);
    }
  };

  const handleFinalize = async () => {
    setActionLoading(true);
    try {
      const res = await finalizeLeadershipDraft();
      if (res.success) {
        setDraft(res.draft);
        setApprovalStatus(res.approvalStatus);
        setFinalizeOpen(true);
        toast.success("Review and collect approvals to apply changes.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to finalize");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDiscard = async () => {
    if (!window.confirm("Discard this draft session and all pending changes?")) return;
    setActionLoading(true);
    try {
      await discardLeadershipDraft("Discarded by collaborator.");
      setDraft(null);
      setApprovalStatus(null);
      setFinalizeOpen(false);
      setViewChangesOpen(false);
      toast.success("Draft session discarded.");
    } catch (err) {
      toast.error(err.message || "Failed to discard");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await approveLeadershipDraft();
      if (res.success) {
        setDraft(res.draft);
        setApprovalStatus(res.approvalStatus);
        toast.success(res.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeApproval = async () => {
    setActionLoading(true);
    try {
      const res = await revokeLeadershipDraftApproval();
      if (res.success) {
        setDraft(res.draft);
        setApprovalStatus(res.approvalStatus);
        toast.success("Approval revoked.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to revoke");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApply = async () => {
    if (!window.confirm("Apply all queued leadership changes? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      const res = await applyLeadershipDraft();
      if (res.success) {
        if (res.data) setPeople(res.data);
        setDraft(null);
        setApprovalStatus(null);
        setFinalizeOpen(false);
        if (res.draft?.sessionId) setLastReportSessionId(res.draft.sessionId);
        toast.success(res.message || "Changes applied successfully.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to apply changes");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadReport = async (sessionId) => {
    try {
      await downloadLeadershipReport(sessionId);
      toast.success("Report downloaded.");
    } catch (err) {
      toast.error(err.message || "Failed to download report");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-full w-full items-center justify-center bg-[#1e1e2f] pb-20">
        <Spinner className="size-6 text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full justify-center bg-[#1e1e2f] pb-20 px-4 sm:px-6 lg:px-10">
      <div className="w-full max-w-5xl py-10 flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-richblack-25">
              Leadership promotions
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Queue changes collaboratively, collect approvals, then apply. Changes sync in real
              time for all authorized users.
            </p>
          </div>

          <div className="shrink-0 self-start rounded-xl border border-gray-500/25 bg-[#252540]/80 px-3 py-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-gray-400">Active collaborators</span>
            </div>
            <div className="mt-2">
              <CollaboratorAvatars collaborators={collaborators} />
            </div>
          </div>
        </div>

        {hasActiveDraft && (
          <section className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-[#252540]/90 p-5 shadow-lg shadow-cyan-500/5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Leadership Change Session Active
                </p>
                <h2 className="mt-1 text-lg font-bold text-richblack-25">{draft.sessionId}</h2>
                <div className="mt-3 space-y-1 text-sm text-gray-400">
                  <p>
                    <span className="text-gray-500">Created by:</span>{" "}
                    <span className="text-gray-200">{draft.createdByName}</span>
                  </p>
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-500">Collaborators:</span>
                    <CollaboratorAvatars collaborators={draft.collaborators} maxVisible={5} />
                  </p>
                  <p>
                    Pending promotions:{" "}
                    <span className="text-cyan-300">{changeCounts.promotions + changeCounts.transfers}</span>
                    {" · "}
                    Pending session ends:{" "}
                    <span className="text-red-300">{changeCounts.sessionEnds}</span>
                  </p>
                  <p>
                    Status:{" "}
                    <span className="font-medium text-cyan-200">{statusLabel(draft.status)}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setViewChangesOpen(true)}
                  className="rounded-lg border border-gray-500/30 bg-[#1e1e2f]/80 px-3 py-2 text-sm text-gray-200 hover:border-cyan-500/40"
                >
                  View Changes
                </button>
                {draft.status === "DRAFT" && (
                  <button
                    type="button"
                    disabled={actionLoading || changeCounts.total === 0}
                    onClick={handleFinalize}
                    className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
                  >
                    Finalize
                  </button>
                )}
                {isSessionCreator && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleDiscard}
                    className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    Discard Draft
                  </button>
                )}
                {(draft.status === "APPROVAL_PENDING" || draft.status === "READY_TO_APPLY") && (
                  <button
                    type="button"
                    onClick={() => setFinalizeOpen(true)}
                    className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
                  >
                    Review & Approve
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {lastReportSessionId && !hasActiveDraft && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
            <p className="text-sm text-emerald-200">Changes applied successfully.</p>
            <button
              type="button"
              onClick={() => handleDownloadReport(lastReportSessionId)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600/20 px-3 py-1.5 text-sm font-medium text-emerald-200 hover:bg-emerald-600/30"
            >
              <FileText className="h-4 w-4" />
              Download Report PDF
            </button>
          </div>
        )}

        <div className="group relative rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-[#252540]/80 to-[#151525]/90 p-1 shadow-[0_4px_24px_rgba(0,0,0,0.2)] focus-within:border-cyan-500/35">
          <SearchIcon
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, role…"
            className="w-full rounded-xl border border-transparent bg-[#12121f]/70 py-3.5 pl-11 pr-4 text-sm text-richblack-25 placeholder:text-gray-500 focus:border-cyan-500/25 focus:bg-[#12121f] focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
          />
        </div>

        <section className="rounded-2xl border border-gray-500/20 bg-gradient-to-br from-[#1e1e2f]/80 to-[#2c2c3e]/80 p-4 sm:p-6 shadow-xl">
          <SectionTitle icon="👥">Society roster ({filteredPeople.length})</SectionTitle>
          <div className="mt-4 grid gap-2">
            {filteredPeople.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No people found.</p>
            ) : (
              filteredPeople.map((person) => (
                <button
                  key={`${person.type}-${person.id}`}
                  type="button"
                  onClick={() => setSelectedPerson(person)}
                  className="group relative flex w-full items-center gap-3 rounded-xl border border-gray-500/20 bg-[#151525]/60 px-4 py-3 text-left transition hover:border-cyan-500/50 hover:bg-cyan-500/10"
                >
                  <PersonAvatar image={person.image} name={person.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-richblack-25">
                      {person.name || person.email}
                    </div>
                    <div className="truncate text-xs text-gray-500">{person.email}</div>
                  </div>
                  <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                    <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                      {person.position ||
                        getAccountTypeLabel(person.accountType) ||
                        person.accountType ||
                        "Member"}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      {/* View Changes Modal */}
      <AnimatePresence>
        {viewChangesOpen && draft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
            onClick={() => setViewChangesOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-500/30 bg-[#1e1e2f] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-500/20 px-5 py-4">
                <h2 className="text-lg font-semibold text-richblack-25">
                  Pending Changes · {draft.sessionId}
                </h2>
                <button type="button" onClick={() => setViewChangesOpen(false)} className="text-gray-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 p-5">
                {(draft.pendingChanges || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No pending changes.</p>
                ) : (
                  draft.pendingChanges.map((change) => (
                    <div
                      key={change.id}
                      className="rounded-xl border border-gray-500/20 bg-[#151525]/70 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-richblack-25">{change.personName}</p>
                          <p className="text-xs text-gray-500">{change.personEmail}</p>
                        </div>
                        {draft.status === "DRAFT" && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await removeLeadershipDraftChange(change.id);
                                if (res.draft) setDraft(res.draft);
                                else setDraft(null);
                                toast.success("Change removed.");
                              } catch (err) {
                                toast.error(err.message);
                              }
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {change.changeType === "end_session" ? (
                        <p className="mt-2 text-xs text-red-300">End session · {change.previousRole}</p>
                      ) : (
                        <p className="mt-2 text-xs text-gray-400">
                          {change.previousRole} →{" "}
                          <span className="text-cyan-300">{change.newRole}</span>
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finalize / Approval Modal */}
      <AnimatePresence>
        {finalizeOpen && draft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/65 p-4"
            onClick={() => !actionLoading && setFinalizeOpen(false)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-500/25 bg-[#1e1e2f] shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-gray-500/20 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-richblack-25">
                    Leadership Change Session Review
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">{draft.sessionId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => !actionLoading && setFinalizeOpen(false)}
                  disabled={actionLoading}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-500/10 hover:text-gray-200 disabled:opacity-50"
                  aria-label="Close review modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 px-6 py-5">
                {changeCounts.promotions + changeCounts.transfers > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-cyan-300">Promotions</h3>
                    <ul className="mt-2 space-y-1 text-sm text-gray-300">
                      {draft.pendingChanges
                        .filter((c) => c.changeType !== "end_session")
                        .map((c) => (
                          <li key={c.id}>
                            {c.personName} → {c.newRole}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {changeCounts.sessionEnds > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-red-300">Session Endings</h3>
                    <ul className="mt-2 space-y-1 text-sm text-gray-300">
                      {draft.pendingChanges
                        .filter((c) => c.changeType === "end_session")
                        .map((c) => (
                          <li key={c.id}>{c.personName}</li>
                        ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-gray-300">Collaborators</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {draft.collaborators?.map((c) => c.name).join(", ") || "—"}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Created by: {draft.createdByName}
                  </p>
                </div>

                <div className="space-y-4 rounded-xl border border-gray-500/25 bg-[#151525]/60 p-4">
                  <div>
                    <ApprovalSectionLabel title="Core Approval" hint={CORE_APPROVAL_HINT} />
                    {approvalStatus?.coreApproval ? (
                      <ApprovalApproverRow
                        approval={approvalStatus.coreApproval}
                        collaborators={draft.collaborators}
                      />
                    ) : (
                      <p className="mt-2 text-sm leading-relaxed text-gray-500">
                        Pending approval from at least one of:{" "}
                        <span className="text-gray-300">Faculty Incharge</span>,{" "}
                        <span className="text-gray-300">Chairperson</span>, or{" "}
                        <span className="text-gray-300">Vice-Chairperson</span>.
                      </p>
                    )}
                  </div>
                  <div className="border-t border-gray-500/15 pt-4">
                    <ApprovalSectionLabel
                      title="Department Approval"
                      hint={DEPARTMENT_APPROVAL_HINT}
                    />
                    {approvalStatus?.departmentApproval ? (
                      <ApprovalApproverRow
                        approval={approvalStatus.departmentApproval}
                        collaborators={draft.collaborators}
                      />
                    ) : (
                      <p className="mt-2 text-sm leading-relaxed text-gray-500">
                        Pending approval from at least one{" "}
                        <span className="text-gray-300">Department Head</span> or{" "}
                        <span className="text-gray-300">Department Lead</span>.
                      </p>
                    )}
                  </div>
                  <p className="border-t border-gray-500/15 pt-4 text-sm text-cyan-200">
                    Status: {approvalStatus?.completedCount ?? 0} of{" "}
                    {approvalStatus?.requiredCount ?? 2} required approvals completed
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-gray-500/20 px-6 py-4">
                <button
                  type="button"
                  disabled={actionLoading || userHasApproved}
                  onClick={handleApprove}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50 ${
                    userHasApproved
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
                  }`}
                >
                  {userHasApproved ? (
                    <>
                      <Check className="h-4 w-4" />
                      Approved
                    </>
                  ) : actionLoading ? (
                    "Processing…"
                  ) : (
                    "Add My Approval"
                  )}
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !userHasApproved}
                  onClick={handleRevokeApproval}
                  className="rounded-lg border border-gray-500/30 px-4 py-2 text-sm text-gray-300 hover:bg-gray-500/10 disabled:opacity-50"
                >
                  Revoke My Approval
                </button>
                {isSessionCreator && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleDiscard}
                    className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    Discard Draft
                  </button>
                )}
                <div className="group relative ml-auto">
                  <button
                    type="button"
                    disabled={applyChangesDisabled}
                    onClick={handleApply}
                    className="rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Apply Changes
                  </button>
                  {applyChangesDisabled && (
                    <div className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 hidden w-64 rounded-lg border border-cyan-500/20 bg-[#12121f] p-3 text-xs leading-relaxed text-gray-300 shadow-xl group-hover:block">
                      {APPLY_CHANGES_HINT}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Person action modals — same as before with updated copy */}
      <AnimatePresence>
        {selectedPerson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center"
            onClick={closePersonModal}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-500/30 bg-[#1e1e2f] shadow-2xl"
            >
              <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-gray-500/20 bg-[#1e1e2f] px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-cyan-400">
                    {personAction === "promote"
                      ? "Queue promotion"
                      : personAction === "end_session"
                        ? "Queue session end"
                        : "Choose action"}
                  </p>
                  <h2 className="text-lg font-semibold text-richblack-25">
                    {selectedPerson.name || selectedPerson.email}
                  </h2>
                </div>
                <button type="button" onClick={closePersonModal} className="text-gray-400">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!personAction && (
                <div className="space-y-3 p-5">
                  <p className="text-sm text-gray-400">
                    Changes are queued in the draft session until approved and applied.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPersonAction("promote")}
                    className="flex w-full items-center gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-4 py-4 text-left hover:bg-cyan-500/10"
                  >
                    <TrendingUp className="h-5 w-5 text-cyan-300" />
                    <span>
                      <span className="block text-sm font-semibold text-richblack-25">Promote</span>
                      <span className="block text-xs text-gray-500">Queue a leadership promotion</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonAction("end_session")}
                    className="flex w-full items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-4 text-left hover:bg-red-500/10"
                  >
                    <LogOut className="h-5 w-5 text-red-300" />
                    <span>
                      <span className="block text-sm font-semibold text-richblack-25">End session</span>
                      <span className="block text-xs text-gray-500">Queue tenure ending</span>
                    </span>
                  </button>
                </div>
              )}

              {personAction === "end_session" && (
                <div className="space-y-4 p-5">
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-gray-300">
                    <p className="font-medium text-red-200">When applied, this will:</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-gray-400">
                      <li>Archive profile & activity to alumni</li>
                      <li>Remove from signup configs and team roster</li>
                      <li>Send farewell email after final approval</li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    disabled={endingSession}
                    onClick={() => setPendingEndSession(true)}
                    className="w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Queue session end
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonAction(null)}
                    className="w-full rounded-xl border border-gray-500/40 px-4 py-2.5 text-sm text-gray-300"
                  >
                    Back
                  </button>
                </div>
              )}

              {personAction === "promote" && (
                <div className="space-y-5 p-5">
                  <button
                    type="button"
                    onClick={() => setPersonAction(null)}
                    className="text-xs text-gray-500 hover:text-gray-300"
                  >
                    ← Back to actions
                  </button>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Society core</p>
                    <div className="grid gap-2">
                      {groupedPositions.society.map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          disabled={promoting}
                          onClick={() => setPendingPromotion(pos)}
                          className="rounded-xl border border-gray-500/25 px-4 py-3 text-left text-sm text-gray-300 hover:border-cyan-500/40 disabled:opacity-50"
                        >
                          Promote to <span className="font-medium text-cyan-300">{pos.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {Object.entries(groupedPositions.byDept).map(([dept, deptPositions]) => (
                    <div key={dept}>
                      <p className="mb-2 text-xs font-semibold uppercase text-gray-400">{dept}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {deptPositions.map((pos) => (
                          <button
                            key={pos.id}
                            type="button"
                            disabled={promoting}
                            onClick={() => setPendingPromotion(pos)}
                            className="rounded-xl border border-gray-500/25 px-4 py-3 text-left text-sm text-gray-300 hover:border-cyan-500/40 disabled:opacity-50"
                          >
                            Promote to{" "}
                            <span className="font-medium text-cyan-300">{pos.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <AnimatePresence>
              {pendingPromotion && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!promoting) setPendingPromotion(null);
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-sm rounded-3xl border border-cyan-500/25 bg-[#252540] p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-5 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/15 ring-1 ring-cyan-500/25">
                        <CheckCircle className="h-7 w-7 text-cyan-300" strokeWidth={1.75} />
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-richblack-25">
                        Queue promotion?
                      </h3>
                      <p className="mt-3 text-sm text-gray-400">
                        Queue{" "}
                        <span className="font-medium text-gray-200">
                          {selectedPerson.name || selectedPerson.email}
                        </span>{" "}
                        for promotion to{" "}
                        <span className="font-semibold text-cyan-300">{pendingPromotion.label}</span>?
                        Changes apply only after collaborative approval.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingPromotion(null)}
                        disabled={promoting}
                        className="flex-1 rounded-xl border border-gray-500/40 py-2.5 text-sm text-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePromote(pendingPromotion)}
                        disabled={promoting}
                        className="flex-1 rounded-xl bg-cyan-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {promoting ? "Queuing…" : "Queue promotion"}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {pendingEndSession && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!endingSession) setPendingEndSession(false);
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-sm rounded-3xl border border-red-500/25 bg-[#252540] p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-5 text-center">
                      <LogOut className="mx-auto h-7 w-7 text-red-300" />
                      <h3 className="mt-3 text-lg font-semibold text-richblack-25">
                        Queue session end?
                      </h3>
                      <p className="mt-3 text-sm text-gray-400">
                        Queue end of tenure for{" "}
                        <span className="font-medium text-gray-200">
                          {selectedPerson.name || selectedPerson.email}
                        </span>
                        ? Applied only after approval.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingEndSession(false)}
                        disabled={endingSession}
                        className="flex-1 rounded-xl border border-gray-500/40 py-2.5 text-sm text-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleEndSession}
                        disabled={endingSession}
                        className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {endingSession ? "Queuing…" : "Queue session end"}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
