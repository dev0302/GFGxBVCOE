import { ArrowLeft, CalendarDays, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPostBySlug } from "../services/blog_api";

const getAuthorName = (author) => {
  if (!author) return "GFG-BVCOE";
  return (
    `${author.firstName || ""} ${author.lastName || ""}`.trim() || "GFG-BVCOE"
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
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020b08] px-6 pt-32 text-center text-[#91a19a]">
        Loading story...
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen bg-[#020b08] px-6 pt-32 text-center text-[#91a19a]">
        <p>{error || "This story could not be found."}</p>
        <button
          onClick={() => navigate("/blog")}
          className="mt-6 rounded-full bg-[#16a957] px-5 py-2.5 font-semibold text-white hover:bg-[#1fc568]"
        >
          Back to journal
        </button>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020b08] pb-24 text-[#e8f1ed]">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(rgba(24,205,93,0.16) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      <article className="relative z-10 mx-auto w-[92%] max-w-[1050px] pt-28 sm:pt-36">
        <button
          onClick={() => navigate("/blog")}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#91a49a] transition hover:text-[#39d878]"
        >
          <ArrowLeft size={16} /> Back to journal
        </button>
        <div className="overflow-hidden rounded-3xl border border-green-800/30 bg-gradient-to-br from-[#092619]/90 to-[#03110b]/95 shadow-[0_20px_70px_rgba(0,0,0,0.3)]">
          <div className="relative h-[260px] sm:h-[400px]">
            <img
              src={
                post.coverImage ||
                "https://placehold.co/1200x600/092619/55df8b?text=GFG+Journal"
              }
              alt={post.title}
              className="h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#04120c] via-[#04120c]/20 to-transparent" />
            {post.category && (
              <span className="absolute bottom-6 left-6 rounded-full border border-green-400/25 bg-[#03130c]/80 px-4 py-2 text-[10px] font-bold uppercase tracking-[1.5px] text-[#55df8b] backdrop-blur-md sm:left-10">
                {post.category}
              </span>
            )}
          </div>
          <div className="px-6 pb-12 sm:px-12 sm:pb-16">
            <h1 className="mt-8 max-w-4xl text-4xl font-bold leading-tight tracking-[-1.5px] text-white sm:text-6xl">
              {post.title}
            </h1>
            {post.summary && (
              <p className="mt-6 max-w-3xl text-lg leading-8 text-[#a3b2ab]">
                {post.summary}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-green-900/30 py-5 text-xs uppercase tracking-[1px] text-[#63736c]">
              <span className="inline-flex items-center gap-2">
                <UserRound size={15} className="text-[#48db83]" />{" "}
                {getAuthorName(post.author)}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={15} className="text-[#48db83]" />{" "}
                {formatDate(post.createdAt)}
              </span>
            </div>
            {post.tags?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-green-400/20 bg-green-700/[0.08] px-3 py-1.5 text-xs text-[#55df8b]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-10 whitespace-pre-wrap text-[16px] leading-8 text-[#b0c0b8] sm:text-[18px] sm:leading-9">
              {post.content}
            </div>
          </div>
        </div>
      </article>
    </main>
  );
};

export default BlogPage;
