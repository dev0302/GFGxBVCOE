import { useEffect, useState } from "react";
import {
  Check,
  Clock3,
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  ShieldCheck,
  X,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { approvePost, getPendingPosts } from "../services/blog_api";

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

const getAuthorName = (author) => {
  if (!author) return "Unknown author";
  return (
    `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
    "Unknown author"
  );
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const BlogApprovalPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [processingId, setProcessingId] = useState("");

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

  useEffect(() => {
    if (!authLoading && user && canReviewPosts(user)) loadPosts();
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
    } catch (error) {
      toast.error(error.message || "Unable to process this post.");
    } finally {
      setProcessingId("");
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#090d10]" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!canReviewPosts(user)) return <Navigate to="/blog" replace />;

  return (
    <main className="min-h-screen bg-[#090d10] px-4 pb-20 pt-24 text-richblack-5 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden border border-emerald-400/20 bg-gradient-to-br from-[#13251e] via-[#101b18] to-[#11171b] p-6 shadow-2xl sm:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                <ShieldCheck size={14} /> Editorial desk
              </div>
              <h1 className="font-audiowide text-3xl leading-tight sm:text-5xl">
                Review the next story.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9caf9f]">
                Read submissions from the community, leave thoughtful feedback,
                and help the journal stay useful and welcoming.
              </p>
            </div>
            <div className="flex items-center gap-3 border border-emerald-400/20 bg-emerald-400/[0.08] px-5 py-4">
              <FileText className="text-emerald-300" size={22} />
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {loading ? "-" : posts.length}
                </p>
                <p className="text-xs uppercase tracking-wider text-emerald-200">
                  Pending posts
                </p>
              </div>
            </div>
          </div>
        </header>

        {loadError && (
          <section className="border border-red-400/20 bg-red-400/10 p-6 text-center">
            <p className="font-semibold text-red-200">{loadError}</p>
            <button
              type="button"
              onClick={loadPosts}
              className="mt-4 rounded-full bg-red-400/20 px-4 py-2 text-sm font-bold text-red-100 hover:bg-red-400/30"
            >
              Try again
            </button>
          </section>
        )}
        {loading && !loadError && (
          <div className="flex min-h-48 items-center justify-center">
            <Loader2 className="animate-spin text-emerald-300" size={30} />
          </div>
        )}
        {!loading && !loadError && posts.length === 0 && (
          <section className="border border-white/10 bg-[#11171b] px-6 py-16 text-center">
            <Check className="mx-auto text-emerald-300" size={34} />
            <h2 className="mt-4 text-xl font-bold">The desk is clear.</h2>
            <p className="mt-2 text-sm text-[#84968c]">
              There are no community posts waiting for review.
            </p>
          </section>
        )}

        {!loading && !loadError && posts.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post._id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#11171b] shadow-xl transition duration-300 hover:-translate-y-1 hover:border-emerald-400/35"
              >
                <div className="relative h-48 overflow-hidden bg-[#07100c]">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt=""
                      className="h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-emerald-300/40">
                      <FileText size={42} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#11171b] to-transparent" />
                  {post.category && (
                    <span className="absolute left-4 top-4 rounded-full border border-emerald-400/25 bg-[#082016]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      {post.category}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs text-[#71847a]">
                    <Clock3 size={14} className="text-amber-300" /> Submitted{" "}
                    {formatDate(post.createdAt)}
                  </div>
                  <h2 className="mt-3 line-clamp-2 text-xl font-bold leading-tight text-white">
                    {post.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-[#91a39a]">
                    {post.summary || post.content}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="truncate text-xs font-semibold uppercase tracking-wider text-[#81958a]">
                      By {getAuthorName(post.author)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPost(post);
                        setFeedback("");
                      }}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400 hover:text-[#07130c]"
                    >
                      <Eye size={14} /> Review
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close review"
            onClick={() => setSelectedPost(null)}
            className="absolute inset-0 cursor-default"
          />
          <section className="relative z-10 max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-emerald-400/20 bg-[#101916] shadow-2xl">
            <button
              type="button"
              aria-label="Close review"
              onClick={() => setSelectedPost(null)}
              className="absolute right-4 top-4 z-20 rounded-full bg-black/50 p-2 text-[#a5b7ad] hover:bg-emerald-400 hover:text-black"
            >
              <X size={18} />
            </button>
            {selectedPost.coverImage && (
              <img
                src={selectedPost.coverImage}
                alt=""
                className="h-52 w-full object-cover opacity-75 sm:h-72"
              />
            )}
            <div className="p-6 sm:p-9">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                {selectedPost.category || "Community submission"}
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-5xl">
                {selectedPost.title}
              </h2>
              <p className="mt-4 text-sm text-[#84968c]">
                By {getAuthorName(selectedPost.author)} ·{" "}
                {formatDate(selectedPost.createdAt)}
              </p>
              <div className="mt-7 whitespace-pre-wrap border-t border-white/10 pt-7 text-[15px] leading-8 text-[#b1c0b8] sm:text-[17px]">
                {selectedPost.content}
              </div>
              <div className="mt-8 border-t border-white/10 pt-6">
                <label
                  htmlFor="review-feedback"
                  className="mb-2 flex items-center gap-2 text-sm font-bold text-white"
                >
                  <MessageSquare size={16} className="text-emerald-300" />{" "}
                  Feedback for the author{" "}
                  <span className="font-normal text-[#71847a]">
                    (required when rejecting)
                  </span>
                </label>
                <textarea
                  id="review-feedback"
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  rows={3}
                  placeholder="Suggest a clear improvement or explain your decision..."
                  className="w-full resize-y border border-white/10 bg-[#0a100d] p-3 text-sm leading-6 text-white outline-none placeholder:text-[#586a60] focus:border-emerald-400/60"
                />
                <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={processingId === selectedPost._id}
                    onClick={() => handleDecision(selectedPost, "reject")}
                    className="inline-flex items-center justify-center gap-2 border border-red-400/30 px-5 py-3 text-sm font-bold text-red-200 transition hover:bg-red-400/10 disabled:opacity-50"
                  >
                    <X size={16} /> Reject post
                  </button>
                  <button
                    type="button"
                    disabled={processingId === selectedPost._id}
                    onClick={() => handleDecision(selectedPost, "approve")}
                    className="inline-flex items-center justify-center gap-2 bg-emerald-400 px-5 py-3 text-sm font-bold text-[#07130c] transition hover:bg-emerald-300 disabled:opacity-50"
                  >
                    {processingId === selectedPost._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}{" "}
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
