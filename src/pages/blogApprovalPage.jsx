import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock3,
  Eye,
  FileText,
  History,
  LayoutList,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { approvePost, deletePost, getAllPosts, getPendingPosts, getReviewHistory } from "../services/blog_api";

const canReviewPosts = (user) => {
  if (
    ["ADMIN", "Chairperson", "Vice-Chairperson", "Treasurer"].includes(
      user?.accountType,
    )
  ) {
    return true;
  }
  const position = String(
    user?.additionalDetails?.position || user?.additionalDetails?.p0 || "",
  ).toLowerCase();
  return position.includes("lead") || position.includes("head");
};

const getAuthorName = (author, submittedName = "") => {
  if (submittedName.trim()) return submittedName.trim();
  if (!author) return "Unknown author";
  return (
    `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
    "Unknown author"
  );
};

const getContentPreview = (content = "") =>
  content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS — shared identity with the blog listing
   page: dark forest background, one radius scale, one
   border/glow recipe, consistent spacing rhythm.
═══════════════════════════════════════════════════ */
const tokens = {
  panel: "rgba(255,255,255,0.035)",
  border: "rgba(120,220,160,0.14)",
  borderHover: "rgba(120,220,160,0.32)",
  textPrimary: "#eaf7ee",
  textMuted: "#7fa88f",
  accent: "#3ddc84",
  accentSoft: "#8ff0b4",
};

const BlogApprovalPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [managedPosts, setManagedPosts] = useState([]);
  const [manageLoading, setManageLoading] = useState(true);
  const [manageFilter, setManageFilter] = useState("all"); // "all" | "published" | "pending_approval" | "rejected"
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadPosts = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await getPendingPosts();
      setPosts(Array.isArray(response.posts) ? response.posts : []);
    } catch (error) {
      setLoadError(error.message || "Unable to load pending posts.");
    } finally {
      setLoading(false);
    }
  };

  const loadManaged = () => {
    setManageLoading(true);
    getAllPosts()
      .then((data) => setManagedPosts(Array.isArray(data.posts) ? data.posts : []))
      .catch(() => setManagedPosts([]))
      .finally(() => setManageLoading(false));
  };

  const refreshHistory = () =>
    getReviewHistory()
      .then((data) => setHistory(Array.isArray(data.posts) ? data.posts : []))
      .catch(() => {});

  useEffect(() => {
    if (!authLoading && user && canReviewPosts(user)) {
      loadPosts();
      loadManaged();
      setHistoryLoading(true);
      getReviewHistory()
        .then((data) => setHistory(Array.isArray(data.posts) ? data.posts : []))
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [authLoading, user?._id]);

  const handleDecision = async (post, action) => {
    if (action === "reject" && !feedback.trim()) {
      toast.error("Add feedback before rejecting a post.");
      return;
    }
    setProcessingId(post._id);
    try {
      await approvePost(post._id, action, feedback.trim());
      setPosts((current) => current.filter((item) => item._id !== post._id));
      setSelectedPost(null);
      setFeedback("");
      toast.success(
        action === "approve"
          ? "Post approved and published."
          : "Post rejected with feedback.",
      );
      refreshHistory();
      loadManaged();
    } catch (error) {
      toast.error(error.message || "Unable to process this post.");
    } finally {
      setProcessingId("");
    }
  };

  const handleDelete = async (postId) => {
    setDeletingId(postId);
    try {
      await deletePost(postId);
      setManagedPosts((prev) => prev.filter((p) => p._id !== postId));
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setDeleteConfirmId(null);
      toast.success("Post deleted successfully.");
      refreshHistory();
    } catch (err) {
      toast.error(err.message || "Failed to delete post.");
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading)
    return (
      <div
        className="min-h-screen"
        style={{ background: "linear-gradient(160deg,#02100a 0%,#03170d 45%,#041d10 75%,#02100a 100%)" }}
      />
    );
  if (!user) return <Navigate to="/login" replace />;
  if (!canReviewPosts(user)) return <Navigate to="/blog" replace />;

  return (
    <main
      className="relative min-h-screen overflow-x-hidden px-4 pb-20 pt-24 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(160deg,#02100a 0%,#03170d 45%,#041d10 75%,#02100a 100%)", color: tokens.textPrimary }}
    >
      {/* Ambient glow layer — matches blog listing page */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full opacity-[0.14] sm:h-[520px] sm:w-[520px]"
          style={{ background: "radial-gradient(circle,#22c55e 0%,#16a34a 40%,transparent 70%)", filter: "blur(100px)" }}
        />
        <div
          className="absolute top-1/4 -right-24 h-[360px] w-[360px] rounded-full opacity-[0.09] sm:h-[460px] sm:w-[460px]"
          style={{ background: "radial-gradient(circle,#4ade80 0%,#15803d 50%,transparent 70%)", filter: "blur(120px)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* ── BACK NAVIGATION ── */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 font-montserrat text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
          style={{ color: tokens.accentSoft, background: "rgba(34,197,94,0.07)", border: `1px solid ${tokens.border}` }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* ── HEADER ── */}
        <header
          className="mb-8 overflow-hidden rounded-3xl p-6 sm:p-9"
          style={{ background: tokens.panel, border: `1px solid ${tokens.border}`, backdropFilter: "blur(14px)" }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div
                className="mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[2px]"
                style={{ color: tokens.accentSoft, background: "rgba(34,197,94,0.1)", border: `1px solid ${tokens.border}` }}
              >
                <ShieldCheck size={14} /> Editorial desk
              </div>
              <h1 className="font-audiowide text-3xl leading-tight sm:text-5xl" style={{ color: "#e4ede7" }}>
                Review the next story.
              </h1>
              <p className="mt-3 max-w-2xl font-nunito text-sm leading-6" style={{ color: tokens.textMuted }}>
                Read submissions from the community, leave thoughtful feedback,
                and help the journal stay useful and welcoming.
              </p>
            </div>
            <div
              className="flex items-center gap-3 rounded-2xl px-5 py-4"
              style={{ background: "rgba(34,197,94,0.08)", border: `1px solid ${tokens.border}` }}
            >
              <FileText style={{ color: tokens.accent }} size={22} />
              <div>
                <p className="text-2xl font-bold tabular-nums">{loading ? "–" : posts.length}</p>
                <p className="font-montserrat text-[11px] uppercase tracking-wider" style={{ color: tokens.accentSoft }}>
                  Pending posts
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ── ERROR ── */}
        {loadError && (
          <section
            className="rounded-3xl p-6 text-center"
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}
          >
            <p className="font-semibold text-red-200">{loadError}</p>
            <button
              type="button"
              onClick={loadPosts}
              className="mt-4 rounded-full px-4 py-2 text-sm font-bold text-red-100 transition hover:brightness-110"
              style={{ background: "rgba(248,113,113,0.2)" }}
            >
              Try again
            </button>
          </section>
        )}

        {/* ── LOADING ── */}
        {loading && !loadError && (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin" style={{ color: tokens.accent }} size={30} />
            <p className="font-montserrat text-sm" style={{ color: tokens.textMuted }}>Loading submissions...</p>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && !loadError && posts.length === 0 && (
          <section
            className="rounded-3xl px-6 py-16 text-center"
            style={{ background: tokens.panel, border: `1px solid ${tokens.border}` }}
          >
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "rgba(34,197,94,0.1)", border: `1px solid ${tokens.border}` }}
            >
              <Check style={{ color: tokens.accent }} size={26} />
            </div>
            <h2 className="font-audiowide text-xl font-bold" style={{ color: "#e4ede7" }}>The desk is clear.</h2>
            <p className="mt-2 font-montserrat text-sm" style={{ color: tokens.textMuted }}>
              There are no community posts waiting for review.
            </p>
          </section>
        )}

        {/* ── PENDING GRID ── */}
        {!loading && !loadError && posts.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post._id}
                className="group flex flex-col overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-1"
                style={{
                  background: "linear-gradient(160deg,rgba(14,60,30,0.42) 0%,rgba(4,30,14,0.7) 60%,rgba(2,11,6,0.88) 100%)",
                  border: `1px solid ${tokens.border}`,
                  boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = tokens.borderHover)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = tokens.border)}
              >
                <div className="relative h-44 overflow-hidden sm:h-48" style={{ background: "#07100c" }}>
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt=""
                      className="h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center" style={{ color: "rgba(61,220,132,0.3)" }}>
                      <FileText size={40} />
                    </div>
                  )}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(2,13,7,0.92) 0%,transparent 65%)" }} />
                  {post.category && (
                    <span
                      className="absolute left-3.5 top-3.5 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[1.6px]"
                      style={{ color: tokens.accent, background: "rgba(3,20,10,0.85)", border: `1px solid ${tokens.border}` }}
                    >
                      {post.category}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-center gap-1.5 font-montserrat text-xs" style={{ color: tokens.textMuted }}>
                    <Clock3 size={13} className="text-amber-300" /> Submitted {formatDate(post.createdAt)}
                  </div>
                  <h2 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug sm:text-xl" style={{ color: "#d8f3e2" }}>
                    {post.title}
                  </h2>
                  <p className="mt-2.5 line-clamp-3 flex-1 text-[13px] leading-6" style={{ color: "#6f9682" }}>
                    {post.summary || getContentPreview(post.content)}
                  </p>
                  <div
                    className="mt-5 flex items-center justify-between border-t pt-4"
                    style={{ borderColor: "rgba(34,197,94,0.1)" }}
                  >
                    <span className="truncate font-montserrat text-[10px] font-semibold uppercase tracking-[0.6px]" style={{ color: tokens.textMuted }}>
                      By {getAuthorName(post.author, post.fullName)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPost(post);
                        setFeedback("");
                      }}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 font-montserrat text-xs font-bold transition-all duration-300 hover:-translate-y-0.5"
                      style={{ color: tokens.accent, background: "rgba(34,197,94,0.1)", border: `1px solid ${tokens.border}` }}
                    >
                      <Eye size={14} /> Review
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ── EDITORIAL HISTORY ── */}
        <section className="mt-14">
          <div className="mb-6 flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "rgba(34,197,94,0.1)", border: `1px solid ${tokens.border}` }}
            >
              <History size={18} style={{ color: tokens.accent }} />
            </div>
            <div>
              <h2 className="font-audiowide text-xl font-bold" style={{ color: "#e4ede7" }}>
                Editorial History
              </h2>
              <p className="font-montserrat text-xs" style={{ color: tokens.textMuted }}>
                All past decisions made on this desk
              </p>
            </div>
          </div>

          {historyLoading ? (
            <div className="flex items-center gap-3 py-8">
              <Loader2 className="animate-spin" style={{ color: tokens.accent }} size={20} />
              <span className="font-montserrat text-sm" style={{ color: tokens.textMuted }}>Loading history…</span>
            </div>
          ) : history.length === 0 ? (
            <div
              className="rounded-2xl px-6 py-10 text-center"
              style={{ background: tokens.panel, border: `1px solid ${tokens.border}` }}
            >
              <p className="font-montserrat text-sm" style={{ color: tokens.textMuted }}>
                No reviews recorded yet. History will appear here once posts are approved or rejected.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((post) => {
                const isApproved = post.reviewAction === "approved";
                const reviewerName = post.reviewedBy
                  ? `${post.reviewedBy.firstName || ""} ${post.reviewedBy.lastName || ""}`.trim()
                  : "Unknown reviewer";
                const reviewedDate = post.reviewedAt
                  ? new Date(post.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                  : "";

                return (
                  <div
                    key={post._id}
                    className="flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-start sm:justify-between"
                    style={{
                      background: isApproved
                        ? "linear-gradient(135deg,rgba(22,163,74,0.07) 0%,rgba(4,30,14,0.6) 100%)"
                        : "linear-gradient(135deg,rgba(220,38,38,0.07) 0%,rgba(20,4,4,0.6) 100%)",
                      border: `1px solid ${isApproved ? "rgba(34,197,94,0.18)" : "rgba(248,113,113,0.18)"}`,
                    }}
                  >
                    {/* Left — post info */}
                    <div className="flex flex-1 flex-col gap-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[1.4px]"
                          style={isApproved
                            ? { color: "#4ade80", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }
                            : { color: "#fca5a5", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)" }}
                        >
                          {isApproved ? <Check size={10} /> : <X size={10} />}
                          {isApproved ? "Approved" : "Rejected"}
                        </span>
                        {post.category && (
                          <span className="text-[10px] uppercase tracking-wider" style={{ color: tokens.textMuted }}>
                            {post.category}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate font-semibold leading-snug" style={{ color: "#d8f3e2" }}>
                        {post.title}
                      </p>
                      <p className="font-montserrat text-xs" style={{ color: tokens.textMuted }}>
                        By {getAuthorName(post.author, post.fullName)}
                      </p>
                      {post.feedback && !isApproved && (
                        <p className="mt-1 line-clamp-2 text-xs italic" style={{ color: "rgba(252,165,165,0.7)" }}>
                          "{post.feedback}"
                        </p>
                      )}
                    </div>

                    {/* Right — reviewer + date */}
                    <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                      <p className="font-montserrat text-xs font-semibold" style={{ color: isApproved ? tokens.accentSoft : "#fca5a5" }}>
                        {reviewerName}
                      </p>
                      <p className="flex items-center gap-1 font-montserrat text-[11px]" style={{ color: tokens.textMuted }}>
                        <Clock3 size={11} /> {reviewedDate}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── MANAGE UPLOADED BLOGS ── */}
        <section className="mt-14">
          {/* Section header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "rgba(34,197,94,0.1)", border: `1px solid ${tokens.border}` }}
              >
                <LayoutList size={18} style={{ color: tokens.accent }} />
              </div>
              <div>
                <h2 className="font-audiowide text-xl font-bold" style={{ color: "#e4ede7" }}>
                  Manage Uploaded Blogs
                </h2>
                <p className="font-montserrat text-xs" style={{ color: tokens.textMuted }}>
                  View and delete any post across all statuses
                </p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All" },
                { key: "published", label: "Published" },
                { key: "pending_approval", label: "Pending" },
                { key: "rejected", label: "Rejected" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setManageFilter(key)}
                  className="rounded-full px-3.5 py-1.5 font-montserrat text-xs font-semibold transition-all duration-200"
                  style={
                    manageFilter === key
                      ? { background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", boxShadow: "0 4px 14px rgba(34,197,94,0.3)" }
                      : { background: "rgba(14,60,30,0.4)", color: tokens.accentSoft, border: `1px solid ${tokens.border}` }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {manageLoading ? (
            <div className="flex items-center gap-3 py-8">
              <Loader2 className="animate-spin" style={{ color: tokens.accent }} size={20} />
              <span className="font-montserrat text-sm" style={{ color: tokens.textMuted }}>Loading posts…</span>
            </div>
          ) : (() => {
            const filtered = manageFilter === "all"
              ? managedPosts
              : managedPosts.filter((p) => p.status === manageFilter);

            if (filtered.length === 0) {
              return (
                <div
                  className="rounded-2xl px-6 py-10 text-center"
                  style={{ background: tokens.panel, border: `1px solid ${tokens.border}` }}
                >
                  <p className="font-montserrat text-sm" style={{ color: tokens.textMuted }}>
                    No posts found for this filter.
                  </p>
                </div>
              );
            }

            return (
              <div className="flex flex-col divide-y" style={{ borderRadius: "16px", border: `1px solid ${tokens.border}`, overflow: "hidden", background: "rgba(4,20,11,0.55)", divideColor: tokens.border }}>
                {filtered.map((post) => {
                  const statusColors = {
                    published: { bg: "rgba(34,197,94,0.12)", text: "#4ade80", border: "rgba(34,197,94,0.25)", label: "Published" },
                    pending_approval: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24", border: "rgba(251,191,36,0.25)", label: "Pending" },
                    rejected: { bg: "rgba(248,113,113,0.1)", text: "#fca5a5", border: "rgba(248,113,113,0.25)", label: "Rejected" },
                  };
                  const sc = statusColors[post.status] || statusColors.pending_approval;
                  const isConfirming = deleteConfirmId === post._id;
                  const isDeleting = deletingId === post._id;

                  return (
                    <div
                      key={post._id}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                      style={{ borderColor: `1px solid ${tokens.border}` }}
                    >
                      {/* Post info */}
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-0.5 font-montserrat text-[10px] font-bold uppercase tracking-[1.2px]"
                            style={{ color: sc.text, background: sc.bg, border: `1px solid ${sc.border}` }}
                          >
                            {sc.label}
                          </span>
                          {post.category && (
                            <span className="font-montserrat text-[10px] uppercase tracking-wider" style={{ color: tokens.textMuted }}>
                              {post.category}
                            </span>
                          )}
                        </div>
                        <p className="truncate font-semibold" style={{ color: "#d8f3e2" }}>{post.title}</p>
                        <p className="font-montserrat text-xs" style={{ color: tokens.textMuted }}>
                          By {getAuthorName(post.author, post.fullName)} · {formatDate(post.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        {isConfirming ? (
                          <>
                            <span className="font-montserrat text-xs" style={{ color: "#fca5a5" }}>Delete permanently?</span>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDelete(post._id)}
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-montserrat text-xs font-bold transition-all disabled:opacity-50"
                              style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.35)", color: "#fca5a5" }}
                            >
                              {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              {isDeleting ? "Deleting…" : "Yes, delete"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded-full px-3 py-1.5 font-montserrat text-xs font-semibold transition-all"
                              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${tokens.border}`, color: tokens.textMuted }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(post._id)}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-montserrat text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
                            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#fca5a5" }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </section>
      </div>

      {/* ── REVIEW MODAL ── */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close review"
            onClick={() => setSelectedPost(null)}
            className="absolute inset-0 cursor-default"
          />
          <section
            className="relative z-10 max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl shadow-2xl"
            style={{ background: "#0a150f", border: `1px solid ${tokens.border}` }}
          >
            <button
              type="button"
              aria-label="Close review"
              onClick={() => setSelectedPost(null)}
              className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: "rgba(0,0,0,0.5)", color: tokens.accentSoft }}
            >
              <X size={18} />
            </button>

            {selectedPost.coverImage && (
              <div className="relative h-52 w-full overflow-hidden sm:h-72">
                <img src={selectedPost.coverImage} alt="" className="h-full w-full object-cover opacity-80" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top,#0a150f 0%,transparent 55%)" }} />
              </div>
            )}

            <div className="p-6 sm:p-9">
              <p className="font-montserrat text-xs font-bold uppercase tracking-[2px]" style={{ color: tokens.accent }}>
                {selectedPost.category || "Community submission"}
              </p>
              <h2 className="mt-3 max-w-3xl font-audiowide text-2xl font-bold leading-tight sm:text-4xl" style={{ color: "#e4ede7" }}>
                {selectedPost.title}
              </h2>
              <p className="mt-4 font-montserrat text-sm" style={{ color: tokens.textMuted }}>
                By {getAuthorName(selectedPost.author, selectedPost.fullName)} · {formatDate(selectedPost.createdAt)}
              </p>

              <div
                className="blog-prose mt-7 border-t pt-7 font-nunito text-[15px] leading-8 sm:text-base"
                style={{ borderColor: "rgba(34,197,94,0.1)", color: "#b7cbc0" }}
                dangerouslySetInnerHTML={{ __html: selectedPost.content }}
              />

              <div className="mt-8 border-t pt-6" style={{ borderColor: "rgba(34,197,94,0.1)" }}>
                <label
                  htmlFor="review-feedback"
                  className="mb-2 flex flex-wrap items-center gap-2 font-montserrat text-sm font-bold"
                  style={{ color: "#e4ede7" }}
                >
                  <MessageSquare size={16} style={{ color: tokens.accent }} /> Feedback for the author
                  <span className="font-normal" style={{ color: tokens.textMuted }}>(required when rejecting)</span>
                </label>
                <textarea
                  id="review-feedback"
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  rows={3}
                  placeholder="Suggest a clear improvement or explain your decision..."
                  className="w-full resize-y rounded-2xl p-4 font-nunito text-sm leading-6 outline-none transition-all duration-300 focus:ring-2"
                  style={{
                    background: "rgba(4,25,14,0.55)",
                    border: `1px solid ${tokens.border}`,
                    color: tokens.textPrimary,
                  }}
                />
                <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={processingId === selectedPost._id}
                    onClick={() => handleDecision(selectedPost, "reject")}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-montserrat text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                    style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#fca5a5" }}
                  >
                    <X size={16} /> Reject post
                  </button>
                  <button
                    type="button"
                    disabled={processingId === selectedPost._id}
                    onClick={() => handleDecision(selectedPost, "approve")}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-montserrat text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg,#16a34a 0%,#22c55e 50%,#4ade80 100%)",
                      boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
                    }}
                  >
                    {processingId === selectedPost._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Approve & publish
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default BlogApprovalPage;
