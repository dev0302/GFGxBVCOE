import { ArrowLeft, CalendarDays, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPostBySlug } from "../services/blog_api";
import { setPageMeta, resetPageMeta } from "../utils/pageMeta";

const getAuthorName = (author) => {
  if (!author) return "GFG-BVCOE";
  return (`${author.firstName || ''} ${author.lastName || ''}`.trim() || 'GFG-BVCOE');
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const BlogPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadPost = async () => {
      try {
        const data = await getPostBySlug(slug);
        if (!cancelled) setPost(data.post);
      } catch (requestError) {
        if (!cancelled)
          setError(requestError.message || "Failed to load this post.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPost();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!post) return;

    setPageMeta({
      title: post.title,
      description:
        post.summary?.trim() ||
        "Read this story from the GFG-BVCOE community.",
      image: post.coverImage || "/gfg_web_og.png",
      url: `${window.location.origin}/blog/post/${encodeURIComponent(post.slug || slug)}`,
    });

    return () => resetPageMeta();
  }, [post, slug]);

  if (loading) {
    return (
      <main
        className="relative min-h-screen overflow-hidden"
        style={{ background: "linear-gradient(135deg, #020d07 0%, #03140a 50%, #020d07 100%)" }}
      >
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(74,222,128,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="flex min-h-screen flex-col items-center justify-center gap-5">
          <div
            className="h-14 w-14 animate-spin rounded-full"
            style={{
              border: "2px solid rgba(74,222,128,0.15)",
              borderTopColor: "#22c55e",
              boxShadow: "0 0 24px rgba(34,197,94,0.35)",
            }}
          />
          <p className="font-montserrat text-[#4a7a5c]">Loading story...</p>
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main
        className="relative min-h-screen overflow-hidden"
        style={{ background: "linear-gradient(135deg, #020d07 0%, #03140a 50%, #020d07 100%)" }}
      >
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(74,222,128,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
          <div
            className="rounded-2xl px-8 py-6"
            style={{
              background: "linear-gradient(135deg, rgba(14,60,30,0.6) 0%, rgba(4,30,14,0.8) 100%)",
              border: "1px solid rgba(74,222,128,0.2)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            <p className="font-montserrat text-lg text-[#6b8f78]">
              {error || "This story could not be found."}
            </p>
          </div>
          <button
            onClick={() => navigate("/blog")}
            className="rounded-full px-6 py-3 font-montserrat text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
              boxShadow: "0 4px 20px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            Back to journal
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden pb-28"
      style={{ background: "linear-gradient(135deg, #020d07 0%, #03140a 40%, #041a0d 70%, #020d07 100%)" }}
    >
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #22c55e 0%, #16a34a 40%, transparent 70%)", filter: "blur(80px)" }}
        />
        <div
          className="absolute bottom-10 right-0 h-[400px] w-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4ade80 0%, #15803d 50%, transparent 70%)", filter: "blur(100px)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(rgba(74,222,128,0.8) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <article className="relative z-10 mx-auto w-[92%] max-w-[1050px] pt-28 sm:pt-36">
        {/* Back button */}
        <button
          onClick={() => navigate("/blog")}
          className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 font-montserrat text-sm font-semibold transition-all duration-300 hover:-translate-x-1"
          style={{
            color: "#4ade80",
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(74,222,128,0.2)",
          }}
        >
          <ArrowLeft size={15} /> Back to journal
        </button>

        {/* Article card */}
        <div
          className="overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(160deg, rgba(14,60,30,0.45) 0%, rgba(4,30,14,0.8) 60%, rgba(2,11,6,0.95) 100%)",
            border: "1px solid rgba(74,222,128,0.2)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Hero image */}
          <div className="relative h-[260px] sm:h-[420px] overflow-hidden">
            <img
              src={post.coverImage || "https://placehold.co/1200x600/031a0d/4ade80?text=GFG+Journal"}
              alt={post.title}
              className="h-full w-full object-cover"
              style={{ opacity: 0.7 }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(2,11,6,0.97) 0%, rgba(4,20,10,0.4) 55%, transparent 100%)" }}
            />
            <div
              className="absolute inset-0 opacity-20"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)" }}
            />
            {post.category && (
              <span
                className="absolute bottom-6 left-6 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[1.8px] text-[#4ade80] sm:left-10"
                style={{
                  background: "linear-gradient(135deg, rgba(5,46,22,0.9) 0%, rgba(2,13,7,0.95) 100%)",
                  border: "1px solid rgba(74,222,128,0.4)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5), 0 0 20px rgba(34,197,94,0.1), inset 0 1px 0 rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {post.category}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="px-6 pb-14 sm:px-12 sm:pb-18">
            <h1
              className="mt-10 max-w-4xl font-audiowide text-3xl font-bold leading-tight tracking-[-1.5px] sm:text-5xl"
              style={{
                background: "linear-gradient(135deg, #ffffff 30%, #86efac 70%, #22c55e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {post.title}
            </h1>

            {post.summary && (
              <p className="mt-6 max-w-3xl font-nunito text-lg leading-8 text-[#7aab8c]">
                {post.summary}
              </p>
            )}

            <div
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y py-5 text-xs uppercase tracking-[1px]"
              style={{ borderColor: "rgba(34,197,94,0.15)", color: "#4a7a5c" }}
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    background: "linear-gradient(135deg, rgba(22,163,74,0.4) 0%, rgba(5,46,22,0.7) 100%)",
                    border: "1px solid rgba(74,222,128,0.3)",
                    color: "#4ade80",
                  }}
                >
                  {getAuthorName(post.author).charAt(0)}
                </span>
                <UserRound size={13} className="text-[#22c55e]" />
                <span style={{ color: "#6b8f78" }}>{getAuthorName(post.author)}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={13} className="text-[#22c55e]" />
                <span style={{ color: "#6b8f78" }}>{formatDate(post.createdAt)}</span>
              </span>
            </div>

            {post.tags?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{
                      background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(74,222,128,0.22)",
                      color: "#4ade80",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div
              className="mt-8 mb-8 h-px w-full"
              style={{
                background: "linear-gradient(90deg, rgba(74,222,128,0.4), rgba(34,197,94,0.15), transparent)",
              }}
            />

            <div
              className="blog-prose mt-2 font-nunito text-[16.5px] leading-[1.9] sm:text-[18px]"
              style={{ color: "#9dbfac" }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={() => navigate("/blog")}
            className="inline-flex items-center gap-2 rounded-full px-7 py-3 font-montserrat text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #15803d 0%, #22c55e 60%, #4ade80 100%)",
              boxShadow: "0 6px 24px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <ArrowLeft size={15} />
            Back to journal
          </button>
        </div>
      </article>
    </main>
  );
};

export default BlogPage;