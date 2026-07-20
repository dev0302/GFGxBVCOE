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
  startLeadershipDraftSession,
  getLeadershipAppliedSessions,
  finalizeLeadershipDraft,
  approveLeadershipDraft,
  revokeLeadershipDraftApproval,
  discardLeadershipDraft,
  applyLeadershipDraft,
  removeLeadershipDraftChange,
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
import { LeadershipReportPdfViewer } from "../../components/LeadershipTransition/LeadershipReportPdfViewer";
import HowItWorksStepper from "../../components/LeadershipTransition/HowItWorksStepper";
import { useAuth } from "../../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle, Search as SearchIcon, X, TrendingUp, LogOut, FileText, Users, Play, Eye, ArrowUpRight, Zap } from "react-feather";

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
      <p className="cursor-help text-sm font-medium text-gray-200">{title}</p>
      <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-lg border border-gray-500/25 bg-[#1e1e2f] p-3 text-xs font-light leading-relaxed text-gray-400 shadow-xl group-hover:block">
        {hint}
      </div>
    </div>
  );
}

function ApprovalApproverRow({ approval, collaborators }) {
  const image = getApproverImage(approval, collaborators);
  const firstName = getFirstName(approval.name);

  return (
    <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
      <PersonAvatar image={image} name={approval.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-normal text-gray-200">{firstName}</p>
        <p className="truncate text-xs font-light text-gray-500">{approval.role}</p>
      </div>
      <Check className="h-4 w-4 shrink-0 text-emerald-400/90" aria-hidden />
    </div>
  );
}

function ApprovalCard({ title, hint, approved, approval, collaborators, pendingText }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <ApprovalSectionLabel title={title} hint={hint} />
          {!approved && (
            <p className="mt-2 text-xs font-light leading-relaxed text-gray-500">{pendingText}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-normal ${
            approved
              ? "border border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300"
              : "border border-gray-500/20 bg-gray-500/[0.08] text-gray-400"
          }`}
        >
          {approved ? "Approved" : "Pending"}
        </span>
      </div>
      {approved && approval ? (
        <ApprovalApproverRow approval={approval} collaborators={collaborators} />
      ) : null}
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

function SessionStatCard({ label, value, hint, accent = "text-richblack-25", onClick, icon: Icon }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-4 text-left backdrop-blur-sm transition-all ${
        onClick ? "cursor-pointer hover:border-cyan-500/25 hover:bg-cyan-500/[0.06]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[8px] sm:text-[11px] font-light uppercase tracking-[0.14em] text-gray-400">{label}</p>
        {Icon ? <Icon className="h-3.5 w-3.5 text-gray-500 group-hover:text-cyan-400/80" /> : null}
      </div>
      <p className={`mt-2 text-2xl sm:text-3xl font-light tabular-nums ${accent}`}>{value}</p>
      {hint ? <p className="mt-1 text-[9px] sm:text-[12px] font-light text-gray-400/80">{hint}</p> : null}
      {onClick ? (
        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-normal text-cyan-400/80 group-hover:text-cyan-300">
          View <ArrowUpRight className="h-3 w-3" />
        </span>
      ) : null}
    </Tag>
  );
}

function SessionIdleScreen({ onStart, starting, appliedCount, onViewApplied }) {
  return (
    <div className="flex  flex-col items-center justify-center px-4 pt-10">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-[#252545]/90 to-[#181828]/95 py-8 px-4 sm:py-10 sm:px-10 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-violet-500/[0.06] blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-6 flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.08]">
            <Zap className="h-5 w-4 sm:h-5 sm:w-4 text-cyan-300" strokeWidth={1.5} />
          </div>

          <p className="text-[11px] font-light uppercase tracking-[0.2em] text-cyan-400/80">
            Leadership transition
          </p>
          <h1 className="mt-3 text-[22px] font-light tracking-tight text-richblack-25 sm:text-4xl ">
            No session initialized yet
          </h1>
          <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-gray-400">
            Start a collaborative leadership change session to queue promotions, session endings,
            collect approvals, and apply changes together in real time.
          </p>

          <button
            type="button"
            onClick={onStart}
            disabled={starting}
            className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-gradient-to-r from-cyan-500/90 to-cyan-600/90 px-7 py-3.5 text-sm font-normal text-white shadow-[0_8px_32px_rgba(34,211,238,0.18)] transition hover:from-cyan-400 hover:to-cyan-500 disabled:opacity-60"
          >
            {starting ? (
              <Spinner className="size-4 text-white" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            {starting ? "Starting session…" : "Start session"}
          </button>

          {appliedCount > 0 && (
            <button
              type="button"
              onClick={onViewApplied}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-light text-gray-500 transition hover:text-cyan-400/90"
            >
              {appliedCount} transition{appliedCount === 1 ? "" : "s"} completed · View history
              <ArrowUpRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
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
  const [viewAppliedOpen, setViewAppliedOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [appliedSessions, setAppliedSessions] = useState([]);
  const [lastReportSessionId, setLastReportSessionId] = useState(null);
  const [reportViewerSessionId, setReportViewerSessionId] = useState(null);

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
      const [peopleRes, positionsRes, sessionsRes] = await Promise.all([
        getLeadershipPeople(),
        getLeadershipPositions(),
        getLeadershipAppliedSessions().catch(() => ({ success: false, data: [] })),
      ]);
      if (peopleRes.success) setPeople(peopleRes.data || []);
      if (positionsRes.success) setPositions(positionsRes.data || []);
      if (sessionsRes.success) setAppliedSessions(sessionsRes.data || []);
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
      const syncCollaborators = (list) => {
        if (!Array.isArray(list)) return;
        setCollaborators(list);
        setDraft((prev) => (prev ? { ...prev, collaborators: list } : prev));
      };

      if (payload.collaborators) syncCollaborators(payload.collaborators);

      if (payload.event === "draft-discarded") {
        setDraft(null);
        setApprovalStatus(null);
        setFinalizeOpen(false);
        setApplyConfirmOpen(false);
        setViewChangesOpen(false);
        setCollaborators([]);
      }
      if (payload.event === "changes-applied") {
        setDraft(null);
        setApprovalStatus(null);
        setFinalizeOpen(false);
        setApplyConfirmOpen(false);
        setCollaborators([]);
        if (payload.session?.sessionId) {
          setLastReportSessionId(payload.session.sessionId);
        }
        loadData();
        getLeadershipAppliedSessions()
          .then((res) => {
            if (res.success) setAppliedSessions(res.data || []);
          })
          .catch(() => {});
      }
      if (payload.event === "draft-created") {
        joinLeadershipPromotions();
        if (payload.session) {
          setDraft(payload.session);
        } else {
          loadDraft();
        }
      }
      if (
        payload.event === "draft-updated" ||
        payload.event === "approval-added" ||
        payload.event === "approval-removed" ||
        payload.event === "leadership-draft-state"
      ) {
        if (payload.session) {
          setDraft((prev) => ({
            ...payload.session,
            collaborators:
              (Array.isArray(payload.collaborators) && payload.collaborators.length
                ? payload.collaborators
                : prev?.collaborators?.length
                  ? prev.collaborators
                  : payload.session.collaborators) || [],
          }));
        } else {
          loadDraft();
        }
        if (payload.event === "approval-added" || payload.event === "approval-removed") {
          loadDraft();
        }
      }
      if (
        payload.event === "collaborator-joined" ||
        payload.event === "collaborator-left" ||
        payload.event === "leadership-presence"
      ) {
        if (payload.collaborators) syncCollaborators(payload.collaborators);
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

  const liveCollaborators = useMemo(() => {
    if (collaborators.length > 0) return collaborators;
    return draft?.collaborators || [];
  }, [collaborators, draft?.collaborators]);

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
      setApplyConfirmOpen(false);
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
    setActionLoading(true);
    try {
      const res = await applyLeadershipDraft();
      if (res.success) {
        if (res.data) setPeople(res.data);
        setDraft(null);
        setApprovalStatus(null);
        setFinalizeOpen(false);
        setApplyConfirmOpen(false);
        if (res.draft?.sessionId) setLastReportSessionId(res.draft.sessionId);
        toast.success(res.message || "Changes applied successfully.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to apply changes");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartSession = async () => {
    setStartingSession(true);
    try {
      const res = await startLeadershipDraftSession();
      if (res.success) {
        setDraft(res.draft || null);
        setApprovalStatus(res.approvalStatus || null);
        if (res.collaborators?.length) {
          setCollaborators(res.collaborators);
        }
        joinLeadershipPromotions();
        toast.success(res.message || "Session started.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to start session");
    } finally {
      setStartingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-full w-full items-center justify-center bg-[#1a1a2e] pb-20 font-nunito">
        <Spinner className="size-6 text-cyan-400" />
      </div>
    );
  }

  if (!hasActiveDraft) {
    return (
      <div className="min-h-full w-full bg-[#1a1a2e] pb-20 font-nunito">
        <style>{`
          @keyframes slow-pulse {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 1; }
          }
          .animate-slow-pulse {
            animation: slow-pulse 2.2s ease-in-out infinite;
          }
        `}</style>
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-10">
          {lastReportSessionId && (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-3.5 mt-8">
              <p className="text-sm font-light text-emerald-200">Changes applied successfully.</p>
              <button
                type="button"
                onClick={() => setReportViewerSessionId(lastReportSessionId)}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-sm font-normal text-emerald-200 hover:bg-emerald-500/15"
              >
                <FileText className="h-4 w-4" />
                View Report PDF
              </button>
            </div>
          )}
          <SessionIdleScreen
            onStart={handleStartSession}
            starting={startingSession}
            appliedCount={appliedSessions.length}
            onViewApplied={() => setViewAppliedOpen(true)}
          />
        </div>
        
        <HowItWorksStepper />

        <AnimatePresence>
          {viewAppliedOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-8 sm:p-4 backdrop-blur-sm"
              onClick={() => setViewAppliedOpen(false)}
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-white/[0.08] bg-[#1e1e2f] shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
                  <div>
                    <h2 className="text-lg font-normal text-richblack-25">Transitions completed</h2>
                    <p className="mt-0.5 text-xs font-light text-gray-400/90">Applied leadership change sessions</p>
                  </div>
                  <button
  type="button"
  onClick={() => setViewAppliedOpen(false)}
  className="group flex h-8 w-8 items-center justify-center rounded-full bg-red-400/40 text-gray-400 transition-all duration-200 hover:bg-red-500/80 hover:text-red-300"
  aria-label="Close"
>
  <X className="h-4 w-4" />
</button>
                </div>
                <div className="space-y-3 p-6">
                  {appliedSessions.length === 0 ? (
                    <p className="py-8 text-center text-sm font-light text-gray-500">No transitions applied yet.</p>
                  ) : (
                    appliedSessions.map((session) => (
                      <div
                        key={session.sessionId}
                        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-sm font-normal text-cyan-400">{session.sessionId}</p>
                            <p className="mt-1 text-xs font-light text-gray-400">
                              {session.changeCount} change{session.changeCount === 1 ? "" : "s"} · Applied by {session.appliedByName || "—"}
                            </p>
                            <p className="mt-0.5 text-xs font-light text-gray-500">
                              {session.appliedAt ? new Date(session.appliedAt).toLocaleString() : "—"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReportViewerSessionId(session.sessionId)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-normal text-emerald-300 hover:bg-emerald-500/15"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            PDF
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <LeadershipReportPdfViewer
          sessionId={reportViewerSessionId}
          open={Boolean(reportViewerSessionId)}
          onClose={() => setReportViewerSessionId(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full justify-center bg-[#1a1a2e] pb-20 px-4 sm:px-6 lg:px-10 font-nunito">
      <style>{`
        @keyframes slow-pulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
        .animate-slow-pulse {
          animation: slow-pulse 2.2s ease-in-out infinite;
        }
      `}</style>
      <div className="w-full max-w-5xl py-10 flex flex-col gap-8">
        {/* Active session banner */}
        <section className="overflow-hidden rounded-[24px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] via-[#252545]/80 to-[#181828]/90 shadow-[0_16px_48px_rgba(0,0,0,0.25)]">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <p className="text-[10px] sm:text-[12px] font-normal uppercase tracking-[0.16em] text-emerald-300/90">
                Leadership Change Session Active
              </p>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 font-mono text-[11px] font-normal text-gray-400">
                {draft.sessionId}
              </span>
              <span className="ml-auto rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-normal text-cyan-300">
                {statusLabel(draft.status)}
              </span>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:p-6 grid-cols-2 lg:grid-cols-4">
            <SessionStatCard
              label="Pending promotions"
              value={changeCounts.promotions + changeCounts.transfers}
              hint="Queued role changes"
              accent="text-cyan-300"
              icon={TrendingUp}
              onClick={() => setViewChangesOpen(true)}
            />
            <SessionStatCard
              label="Pending session ends"
              value={changeCounts.sessionEnds}
              hint="Queued tenure endings"
              accent="text-red-300"
              icon={LogOut}
              onClick={() => setViewChangesOpen(true)}
            />
            <SessionStatCard
              label="Changes queued"
              value={changeCounts.total}
              hint="Total in this session"
              accent="text-violet-300"
              icon={Eye}
              onClick={() => setViewChangesOpen(true)}
            />
            <SessionStatCard
              label="Transitions done"
              value={appliedSessions.length}
              hint="Previously applied"
              accent="text-emerald-300"
              icon={CheckCircle}
              onClick={() => setViewAppliedOpen(true)}
            />
          </div>

          <div className="flex flex-col gap-4 border-t border-white/[0.06] px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-light text-gray-500">
              <p>
                <span className="text-gray-600">Created by</span>{" "}
                <span className="text-gray-300">{draft.createdByName}</span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Collaborators</span>
                <CollaboratorAvatars collaborators={liveCollaborators} maxVisible={5} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setViewChangesOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-normal text-gray-200 hover:border-cyan-500/30 hover:bg-cyan-500/[0.06]"
              >
                <Eye className="h-3.5 w-3.5" />
                View changes
              </button>
              {draft.status === "DRAFT" && (
                <button
                  type="button"
                  disabled={actionLoading || changeCounts.total === 0}
                  onClick={handleFinalize}
                  className={`rounded-full bg-cyan-500/90 px-5 py-2 text-sm font-normal text-white hover:bg-cyan-400 transition-all duration-300 disabled:opacity-50 ${
                    changeCounts.total > 0 && !actionLoading ? "animate-slow-pulse hover:animate-none" : ""
                  }`}
                >
                  Finalize
                </button>
              )}
              {isSessionCreator && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDiscard}
                  className="rounded-full border border-red-500/25 px-4 py-2 text-sm font-normal text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Discard
                </button>
              )}
              {(draft.status === "APPROVAL_PENDING" || draft.status === "READY_TO_APPLY") && (
                <button
                  type="button"
                  onClick={() => setFinalizeOpen(true)}
                  className="rounded-full bg-cyan-500/90 px-5 py-2 text-sm font-normal text-white hover:bg-cyan-400"
                >
                  Review & Approve
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-richblack-25">
              Leadership promotions
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-light leading-relaxed text-gray-400">
              Queue changes collaboratively, collect approvals, then apply. Changes sync in real
              time for all authorized users.
            </p>
          </div>

          <div className="shrink-0 self-start rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400/80" />
              <span className="text-xs font-light text-gray-500">Active collaborators</span>
            </div>
            <div className="mt-2">
              <CollaboratorAvatars collaborators={liveCollaborators} />
            </div>
          </div>
        </div>

        {lastReportSessionId && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-3.5">
            <p className="text-sm font-light text-emerald-200">Changes applied successfully.</p>
            <button
              type="button"
              onClick={() => setReportViewerSessionId(lastReportSessionId)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-sm font-normal text-emerald-200 hover:bg-emerald-500/15"
            >
              <FileText className="h-4 w-4" />
              View Report PDF
            </button>
          </div>
        )}

        <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1 shadow-[0_4px_24px_rgba(0,0,0,0.15)] focus-within:border-cyan-500/25">
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

        <section className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6 shadow-xl backdrop-blur-sm">
          <SectionTitle icon="👥">Active society members ({filteredPeople.length})</SectionTitle>
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
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setViewChangesOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-white/[0.08] bg-[#1e1e2f] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
                <div>
                  <h2 className="text-lg font-normal text-richblack-25">Queued transitions</h2>
                  <p className="mt-0.5 font-mono text-xs font-light text-gray-500">{draft.sessionId}</p>
                </div>
                <button type="button" onClick={() => setViewChangesOpen(false)} className="text-gray-400 hover:text-gray-200">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-white/[0.06] px-6 py-4">
                <div className="rounded-xl bg-cyan-500/[0.06] px-3 py-2 text-center">
                  <p className="text-lg font-light tabular-nums text-cyan-300">{changeCounts.promotions + changeCounts.transfers}</p>
                  <p className="text-[10px] font-light uppercase tracking-wider text-gray-500">Promotions</p>
                </div>
                <div className="rounded-xl bg-red-500/[0.06] px-3 py-2 text-center">
                  <p className="text-lg font-light tabular-nums text-red-300">{changeCounts.sessionEnds}</p>
                  <p className="text-[10px] font-light uppercase tracking-wider text-gray-500">Ends</p>
                </div>
                <div className="rounded-xl bg-violet-500/[0.06] px-3 py-2 text-center">
                  <p className="text-lg font-light tabular-nums text-violet-300">{changeCounts.total}</p>
                  <p className="text-[10px] font-light uppercase tracking-wider text-gray-500">Total</p>
                </div>
              </div>

              <div className="space-y-2 p-6">
                {(draft.pendingChanges || []).length === 0 ? (
                  <p className="py-8 text-center text-sm font-light text-gray-500">No pending changes yet. Select a member to queue a transition.</p>
                ) : (
                  draft.pendingChanges.map((change) => (
                    <div
                      key={change.id}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-normal text-richblack-25">{change.personName}</p>
                          <p className="text-xs font-light text-gray-500">{change.personEmail}</p>
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
                            className="text-xs font-light text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {change.changeType === "end_session" ? (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-light text-red-300">
                          <LogOut className="h-3 w-3" /> End session · {change.previousRole}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs font-light text-gray-400">
                          {change.previousRole} →{" "}
                          <span className="font-normal text-cyan-300">{change.newRole}</span>
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

      {/* Applied Transitions Modal */}
      <AnimatePresence>
        {viewAppliedOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setViewAppliedOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-white/[0.08] bg-[#1e1e2f] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
                <div>
                  <h2 className="text-lg font-normal text-richblack-25">Transitions completed</h2>
                  <p className="mt-0.5 text-xs font-light text-gray-500">Applied leadership change sessions</p>
                </div>
                <button type="button" onClick={() => setViewAppliedOpen(false)} className="text-gray-400 hover:text-gray-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 p-6">
                {appliedSessions.length === 0 ? (
                  <p className="py-8 text-center text-sm font-light text-gray-500">No transitions applied yet.</p>
                ) : (
                  appliedSessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm font-normal text-emerald-300">{session.sessionId}</p>
                          <p className="mt-1 text-xs font-light text-gray-500">
                            {session.changeCount} change{session.changeCount === 1 ? "" : "s"} · Applied by {session.appliedByName || "—"}
                          </p>
                          <p className="mt-0.5 text-xs font-light text-gray-600">
                            {session.appliedAt ? new Date(session.appliedAt).toLocaleString() : "—"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReportViewerSessionId(session.sessionId)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-normal text-emerald-300 hover:bg-emerald-500/15"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          PDF
                        </button>
                      </div>
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
                          <li key={c.id} className="flex items-center justify-between py-1.5 border-b border-gray-500/10 last:border-0">
                            <span className="truncate text-sm text-gray-300">
                              {c.personName} → <span className="font-semibold text-cyan-300">{c.newRole}</span>
                            </span>
                            {userHasApproved ? (
                              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                <Check className="h-3 w-3" /> Approved
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleApprove}
                                className="rounded bg-cyan-500/10 hover:bg-cyan-500 hover:text-white px-2.5 py-1 text-xs font-bold text-cyan-300 border border-cyan-400/40 transition-all duration-300 disabled:opacity-50 shrink-0 animate-slow-pulse hover:animate-none"
                              >
                                Add My Approval
                              </button>
                            )}
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
                    {liveCollaborators.map((c) => c.name).join(", ") || "—"}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Created by: {draft.createdByName}
                  </p>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <ApprovalCard
                    title="Core Approval"
                    hint={CORE_APPROVAL_HINT}
                    approved={Boolean(approvalStatus?.coreApproval)}
                    approval={approvalStatus?.coreApproval}
                    collaborators={liveCollaborators}
                    pendingText="Awaiting Faculty Incharge, Chairperson, or Vice-Chairperson."
                  />
                  <ApprovalCard
                    title="Department Approval"
                    hint={DEPARTMENT_APPROVAL_HINT}
                    approved={Boolean(approvalStatus?.departmentApproval)}
                    approval={approvalStatus?.departmentApproval}
                    collaborators={liveCollaborators}
                    pendingText="Awaiting any Department Head or Department Lead."
                  />

                  <div className="border-t border-white/[0.06] pt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-normal text-gray-400">Session approval progress</span>
                      <span className="rounded-full border border-gray-500/20 bg-gray-500/[0.08] px-2.5 py-0.5 font-normal text-gray-300">
                        {approvalStatus?.completedCount ?? 0} of {approvalStatus?.requiredCount ?? 2}
                      </span>
                    </div>
                    <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-gray-700/40">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (approvalStatus?.completedCount ?? 0) >= (approvalStatus?.requiredCount ?? 2)
                            ? "bg-emerald-400/80"
                            : "bg-cyan-400/70"
                        }`}
                        style={{
                          width: `${((approvalStatus?.completedCount ?? 0) / (approvalStatus?.requiredCount ?? 2)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
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
                    onClick={() => setApplyConfirmOpen(true)}
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

      {/* Apply Changes Confirmation Modal */}
      <AnimatePresence>
        {applyConfirmOpen && draft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
            onClick={() => !actionLoading && setApplyConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-cyan-500/25 bg-[#252540] p-6 shadow-2xl"
            >
              <div className="mb-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/15 ring-1 ring-cyan-500/25">
                  <CheckCircle className="h-7 w-7 text-cyan-300" strokeWidth={1.75} />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-richblack-25">Apply all changes?</h3>
                <p className="mt-3 text-sm text-gray-400">
                  Apply{" "}
                  <span className="font-medium text-cyan-300">
                    {changeCounts.total} queued change{changeCounts.total === 1 ? "" : "s"}
                  </span>{" "}
                  for session{" "}
                  <span className="font-mono text-xs text-gray-300">{draft.sessionId}</span>? This
                  takes effect immediately and cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setApplyConfirmOpen(false)}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl border border-gray-500/40 py-2.5 text-sm text-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {actionLoading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Spinner className="size-4 text-white" />
                      Applying…
                    </span>
                  ) : (
                    "Apply Changes"
                  )}
                </button>
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

      <LeadershipReportPdfViewer
        sessionId={reportViewerSessionId}
        open={Boolean(reportViewerSessionId)}
        onClose={() => setReportViewerSessionId(null)}
      />
    </div>
  );
}
