import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, PenLine, Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getBlogCategories, getPublicPosts, getPendingPosts } from "../../services/blog_api";
import { useAuth } from "../../context/AuthContext";
import { NativeTypewriter } from "../../components/ui/native-typewriter";
import confetti from "canvas-confetti";

const canReviewPosts = (user) => {
  const position = String(
    user?.additionalDetails?.position || user?.additionalDetails?.p0 || "",
  ).toLowerCase();
  return (
    ["ADMIN", "Chairperson", "Vice-Chairperson", "Treasurer"].includes(user?.accountType) ||
    position.includes("lead") ||
    position.includes("head")
  );
};

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS
   Kept the existing dark-forest / signal-green identity,
   just made it consistent: one radius scale, one shadow
   scale, one spacing rhythm, one glass-panel recipe.
═══════════════════════════════════════════════════ */
const tokens = {
  panel: "rgba(255,255,255,0.035)",
  panelHover: "rgba(74,222,128,0.07)",
  border: "rgba(120,220,160,0.14)",
  borderHover: "rgba(120,220,160,0.32)",
  textPrimary: "#eaf7ee",
  textMuted: "#7fa88f",
  accent: "#3ddc84",
  accentSoft: "#8ff0b4",
};

const BlogSite = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await getPublicPosts();
        setPosts(Array.isArray(data.posts) ? data.posts : []);
      } catch (requestError) {
        setError(requestError.message || "Failed to load blog posts.");
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  useEffect(() => {
    getBlogCategories()
      .then((data) => {
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!canReviewPosts(user)) return;
    getPendingPosts()
      .then((data) => {
        const arr = Array.isArray(data.posts) ? data.posts : [];
        setPendingCount(arr.length);
      })
      .catch(() => {});
  }, [user]);

  // ── Celebration confetti on page open ──
  useEffect(() => {
    const end = Date.now() + 3 * 1000;
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

    const frame = () => {
      if (Date.now() > end) return;
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors,
      });
      requestAnimationFrame(frame);
    };

    frame();
  }, []);

  const filteredPosts = posts
    .filter((post) => (selectedCategory ? post.category === selectedCategory : true))
    .filter((post) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return post.title?.toLowerCase().includes(query) || post.summary?.toLowerCase().includes(query);
    });

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: "linear-gradient(160deg,#02100a 0%,#03170d 45%,#041d10 75%,#02100a 100%)" }}
    >
      <style>{`
        @keyframes bs-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        .bs-scrollbar-hide::-webkit-scrollbar { display: none; }
        .bs-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @media (prefers-reduced-motion: reduce) {
          .bs-scrollbar-hide, * { scroll-behavior: auto !important; }
        }
      `}</style>

      {/* Background glow layer */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-[0.16] sm:h-[600px] sm:w-[600px]"
          style={{ background: "radial-gradient(circle,#22c55e 0%,#16a34a 40%,transparent 70%)", filter: "blur(90px)" }}
        />
        <div
          className="absolute top-1/3 -right-24 h-[380px] w-[380px] rounded-full opacity-[0.10] sm:h-[500px] sm:w-[500px]"
          style={{ background: "radial-gradient(circle,#4ade80 0%,#15803d 50%,transparent 70%)", filter: "blur(110px)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 h-[320px] w-[320px] rounded-full opacity-[0.07] sm:h-[400px] sm:w-[400px]"
          style={{ background: "radial-gradient(circle,#86efac 0%,#166534 50%,transparent 70%)", filter: "blur(90px)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "radial-gradient(rgba(74,222,128,0.9) 1px,transparent 1px)", backgroundSize: "30px 30px" }}
        />
      </div>

      <div className="relative z-10" style={{ color: tokens.textPrimary }}>
        {/* ── HERO ── */}
        <section className="flex flex-col items-center px-4 pb-14 pt-24 text-center sm:pt-32">
        

          <h1
            className="font-audiowide text-[2.25rem] font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: "#e4ede7" }}
          >
            The Gfg-Bvcoe
            <span
              className="ml-3 block sm:inline"
              style={{
                background: "linear-gradient(90deg,#4ade80 0%,#22c55e 50%,#86efac 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 26px rgba(74,222,128,0.4))",
              }}
            >
              Journal
            </span>
          </h1>

          <p className="i-fonts mt-5 max-w-lg font-nunito text-base leading-relaxed sm:text-lg" style={{ color: tokens.textMuted }}>
            <NativeTypewriter
              content="Share your journey in words - because stories inspire change."
              speed={45}
              deleteSpeed={25}
              pauseMs={5000}
              loop
              cursor
              style={{ color: tokens.textMuted }}
            />
          </p>

          <div
            className="mt-9 h-px w-32 rounded-full"
            style={{ background: "linear-gradient(90deg,transparent,#22c55e,transparent)", boxShadow: "0 0 10px rgba(34,197,94,0.5)" }}
          />
        </section>

        {/* ── CONTROLS ── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="flex flex-col gap-4 rounded-3xl p-4 sm:p-5"
            style={{ background: tokens.panel, border: `1px solid ${tokens.border}`, backdropFilter: "blur(14px)" }}
          >
            {/* Search + actions row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: tokens.accent }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full rounded-full py-3 pl-11 pr-5 text-sm font-montserrat outline-none transition-all duration-300 focus:ring-2"
                  style={{
                    color: tokens.textPrimary,
                    background: "rgba(4,25,14,0.55)",
                    border: `1px solid ${tokens.border}`,
                  }}
                />
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                <button
                  onClick={() => navigate("/blog/create")}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full sm:px-5 py-2.5 font-montserrat sm:text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 sm:flex-none text-[12px] px-4"
                  style={{
                    background: "linear-gradient(135deg,#16a34a 0%,#22c55e 50%,#4ade80 100%)",
                    boxShadow: "0 4px 20px rgba(34,197,94,0.3),inset 0 1px 0 rgba(255,255,255,0.2)",
                  }}
                >
                  <PenLine size={15} /> Write a post
                </button>

                {canReviewPosts(user) && (
                  <button
                    onClick={() => navigate("/blog/approval")}
                    className="relative inline-flex flex-1 items-center justify-center gap-2 rounded-full sm:px-5 py-2.5 font-montserrat sm:text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 sm:flex-none text-[12px] px-4"
                    style={{
                      background: "linear-gradient(135deg,#4c1d95 0%,#6d28d9 40%,#7c3aed 70%,#818cf8 100%)",
                      boxShadow: "0 4px 20px rgba(109,40,217,0.35),inset 0 1px 0 rgba(255,255,255,0.15)",
                      border: "1px solid rgba(167,139,250,0.35)",
                    }}
                  >
                    Editorial desk
                    {pendingCount > 0 && (
                      <span
                        className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none"
                        style={{
                          background: "linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)",
                          color: "#fff",
                          boxShadow: "0 0 8px rgba(239,68,68,0.6)",
                          animation: "bs-pulse 2s ease-in-out infinite",
                        }}
                      >
                        {pendingCount > 99 ? "99+" : pendingCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Category rail */}
            <div className="relative -mx-1">
              <div className="bs-scrollbar-hide flex gap-2 overflow-x-auto px-1 py-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 font-montserrat text-[13px] font-semibold transition-all duration-300"
                  style={
                    !selectedCategory
                      ? {
                          background: "linear-gradient(135deg,#16a34a 0%,#22c55e 60%,#4ade80 100%)",
                          color: "#fff",
                          boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
                        }
                      : {
                          background: "rgba(14,60,30,0.4)",
                          color: tokens.accentSoft,
                          border: `1px solid ${tokens.border}`,
                        }
                  }
                >
                  All Posts
                </button>
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 font-montserrat text-[13px] font-semibold transition-all duration-300"
                      style={
                        isActive
                          ? {
                              background: "linear-gradient(135deg,#16a34a 0%,#22c55e 60%,#4ade80 100%)",
                              color: "#fff",
                              boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
                            }
                          : {
                              background: "rgba(14,60,30,0.4)",
                              color: tokens.accentSoft,
                              border: `1px solid ${tokens.border}`,
                            }
                      }
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 sm:hidden" style={{ background: "linear-gradient(90deg,transparent,rgba(3,20,10,0.9))" }} />
            </div>
          </div>
        </div>

        {/* ── POSTS GRID ── */}
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-9 flex flex-wrap items-center gap-4">
            <h2
              className="font-audiowide text-xl font-bold sm:text-2xl lg:text-3xl"
              style={{
                background: "linear-gradient(90deg,#ffffff 30%,#4ade80 80%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {selectedCategory ?? "All Posts"}
            </h2>
            <div className="h-px flex-1 min-w-[24px]" style={{ background: "linear-gradient(90deg,rgba(74,222,128,0.4),transparent)" }} />
            {!loading && (
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ color: tokens.accent, background: "rgba(34,197,94,0.1)", border: `1px solid ${tokens.border}` }}
              >
                {filteredPosts.length} posts
              </span>
            )}
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-28">
              <div
                className="h-11 w-11 animate-spin rounded-full"
                style={{ border: "2px solid rgba(74,222,128,0.15)", borderTopColor: "#22c55e", boxShadow: "0 0 20px rgba(34,197,94,0.3)" }}
              />
              <p className="mt-5 font-montserrat text-sm" style={{ color: tokens.textMuted }}>Loading posts...</p>
            </div>
          )}

          {!loading && error && (
            <p className="py-20 text-center font-montserrat text-red-400">{error}</p>
          )}

          {!loading && !error && filteredPosts.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPosts.map((post) => (
                <BlogCard key={post._id || post.slug} post={post} navigate={navigate} />
              ))}
            </div>
          )}

          {!loading && !error && filteredPosts.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-3xl py-24 text-center" style={{ background: tokens.panel, border: `1px solid ${tokens.border}` }}>
              <div
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "rgba(14,60,30,0.6)", border: `1px solid ${tokens.border}` }}
              >
                <Search size={24} style={{ color: tokens.accent }} />
              </div>
              <p className="font-montserrat text-base" style={{ color: tokens.textMuted }}>No posts found.</p>
              <p className="mt-1 font-montserrat text-xs" style={{ color: "rgba(127,168,143,0.6)" }}>Try a different search term or category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   BLOG CARD
═══════════════════════════════════════════════════ */
const BlogCard = ({ post, navigate }) => {
  const [isHovered, setIsHovered] = useState(false);

  const goToPost = () => navigate("/blog/post/" + encodeURIComponent(post.slug));

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={goToPost}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") goToPost(); }}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl transition-all duration-500 focus:outline-none focus-visible:ring-2"
      style={{
        border: isHovered ? `1px solid ${tokens.borderHover}` : `1px solid ${tokens.border}`,
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden sm:h-48">
        <img
          src={post.coverImage || "https://placehold.co/800x500/031a0d/4ade80?text=GFG+Journal"}
          alt={post.title}
          className="h-full w-full object-cover transition-all duration-700"
          style={{ transform: isHovered ? "scale(1.06)" : "scale(1)", opacity: isHovered ? 0.9 : 0.72 }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(2,13,7,0.95) 0%,rgba(4,20,10,0.3) 55%,transparent 100%)" }} />

        {post.category && (
          <span
            className="absolute left-3.5 top-3.5 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[1.6px]"
            style={{ color: tokens.accent, background: "rgba(3,20,10,0.85)", border: `1px solid ${tokens.border}` }}
          >
            {post.category}
          </span>
        )}

        <button
          type="button"
          aria-label={"Read " + post.title}
          onClick={(e) => { e.stopPropagation(); goToPost(); }}
          className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full text-sm text-white transition-all duration-300 hover:rotate-45"
          style={{ background: "rgba(22,163,74,0.5)", border: `1px solid ${tokens.borderHover}` }}
        >
          &#8599;
        </button>
      </div>

      {/* Text content */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-[9px] font-bold tracking-[2px]" style={{ color: tokens.accent }}>GFG × BVCOE</p>
        <h3
          className="mt-2.5 line-clamp-2 text-lg font-semibold leading-snug transition-colors duration-300 sm:text-xl"
          style={{ color: isHovered ? tokens.accent : "#d8f3e2" }}
        >
          {post.title}
        </h3>
        <p className="mt-2.5 line-clamp-3 flex-1 text-[13px] leading-6" style={{ color: "#6f9682" }}>
          {post.summary || "Read the latest story from the GFG-BVCOE community."}
        </p>

        {post.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2.5 py-1 text-[10px] font-medium"
                style={{ background: "rgba(34,197,94,0.08)", border: `1px solid ${tokens.border}`, color: tokens.accent }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div
          className="mt-5 flex items-center justify-between border-t pt-4 text-[10px] font-medium uppercase tracking-[0.6px]"
          style={{ borderColor: "rgba(34,197,94,0.1)", color: tokens.textMuted }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: "rgba(22,163,74,0.32)", border: `1px solid ${tokens.border}`, color: tokens.accent }}
            >
              {getAuthorName(post.author).charAt(0)}
            </div>
            <span className="truncate" style={{ color: "#6f9682" }}>{getAuthorName(post.author)}</span>
          </div>
          <span className="shrink-0">{formatPublishedDate(post.createdAt)}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <button
          onClick={(e) => { e.stopPropagation(); goToPost(); }}
          className="w-full rounded-full py-3 text-sm font-bold transition-all duration-300"
          style={
            isHovered
              ? {
                  background: "linear-gradient(135deg,#15803d 0%,#22c55e 100%)",
                  color: "#ffffff",
                  boxShadow: "0 6px 20px rgba(34,197,94,0.3)",
                }
              : {
                  background: "rgba(22,163,74,0.08)",
                  color: tokens.accent,
                  border: `1px solid ${tokens.border}`,
                }
          }
        >
          Read Blog &#8599;
        </button>
      </div>
    </div>
  );
};

const getAuthorName = (author) => {
  if (!author) return "GFG-BVCOE";
  if (typeof author === "string") return author;
  return (`${author.firstName || ''} ${author.lastName || ''}`.trim() || 'GFG-BVCOE');
};

const formatPublishedDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default BlogSite;
