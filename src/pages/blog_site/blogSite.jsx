import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPublicPosts } from "../../services/blog_api";
import { useAuth } from "../../context/AuthContext";

const canReviewPosts = (user) => {
  const position = String(
    user?.additionalDetails?.position || user?.additionalDetails?.p0 || "",
  ).toLowerCase();
  return (
    ["ADMIN", "Chairperson", "Vice-Chairperson", "Treasurer"].includes(
      user?.accountType,
    ) ||
    position.includes("lead") ||
    position.includes("head")
  );
};

const BlogSite = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryPage, setCategoryPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Get unique categories
  const categories = [
    "Technology",
    "Science & Innovation",
    "Finance & Business",
    "Education & Career",
    "Lifestyle",
    "Campus & Community",
    "Entertainment",
    "Sports",
    "Culture & Society",
    "Politics & Current Affairs",
  ];
  const categoriesPerPage = 3;
  const categoryPageCount = Math.ceil(categories.length / categoriesPerPage);
  const visibleCategories = categories.slice(
    categoryPage * categoriesPerPage,
    (categoryPage + 1) * categoriesPerPage,
  );

  // Filter posts based on selected category
    // Filter posts based on selected category and search query
  const filteredPosts = posts
    .filter((post) =>
      selectedCategory ? post.category === selectedCategory : true,
    )
    .filter((post) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        post.title?.toLowerCase().includes(query) ||
        post.summary?.toLowerCase().includes(query)
      );
    });

  return (
    <div className="min-h-screen bg-[#020b08] text-[#e8f1ed]">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-12">
        {/* <div className="absolute inset-0 opacity-10">
          <div className="top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className=" top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div> */}

        <div className="relative max-w-7xl mt-20  items-center m-auto px-4 sm:px-6 lg:px-8 flex flex-col">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-audiowide font-bold text-richblack-5 mb-2 leading-tight">
            The GFG-BVCOE{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Journal
            </span>
          </h1>
          <p className="text-lg sm:text-xl font-nunito mb-4 max-w-2xl leading-relaxed bg-gradient-to-r from-richblack-100 to-richblack-200 bg-clip-text text-transparent">
            Share your journey in words — because stories inspire change.
          </p>
        </div>
      </div>

            {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search posts by title or summary..."
          className="w-full rounded-full border border-richblack-200 bg-richblack-700 px-5 py-3 text-sm font-montserrat text-richblack-5 placeholder-richblack-300 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30"
        />
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous categories"
            disabled={categoryPage === 0}
            onClick={() => setCategoryPage((page) => Math.max(page - 1, 0))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-richblack-200 bg-richblack-700 text-richblack-100 transition hover:bg-richblack-800 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full font-montserrat font-semibold text-sm transition-all duration-300 ${
                selectedCategory === null
                  ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-richblack-5 shadow-lg shadow-cyan-500/50"
                  : "bg-richblack-700 text-richblack-100 hover:bg-richblack-800 border border-richblack-200"
              }`}
            >
              All Posts
            </button>
            {visibleCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`min-h-5  rounded-full font-montserrat font-semibold text-sm transition-all duration-300 ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-richblack-5 shadow-lg shadow-cyan-500/50"
                    : "bg-richblack-700 text-richblack-100 hover:bg-richblack-800 border border-richblack-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-label="Next categories"
            disabled={categoryPage === categoryPageCount - 1}
            onClick={() =>
              setCategoryPage((page) =>
                Math.min(page + 1, categoryPageCount - 1),
              )
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-richblack-200 bg-richblack-700 text-richblack-100 transition hover:bg-richblack-800 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-richblack-5 font-audiowide">
            All Posts
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => navigate("/blog/create")}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-2.5 font-montserrat text-sm font-semibold text-richblack-5 shadow-lg shadow-cyan-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-cyan-500/40 sm:px-5"
            >
              <PenLine size={16} />
              <span>Write a post</span>
            </button>
            {canReviewPosts(user) && (
              <button
                onClick={() => navigate("/blog/approval")}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 font-montserrat text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400 hover:text-[#07130c] sm:px-5"
              >
                Editorial desk
              </button>
            )}
          </div>
        </div>

        {loading && (
          <p className="text-center py-20 text-richblack-200 text-lg font-montserrat">
            Loading posts...
          </p>
        )}

        {!loading && error && (
          <p className="text-center py-20 text-red-300 text-lg font-montserrat">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <BlogCard
                key={post._id || post.slug}
                post={post}
                navigate={navigate}
              />
            ))}
          </div>
        )}

        {/* No posts message */}
        {!loading && !error && filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-richblack-200 text-lg font-montserrat">
              No posts found in this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const BlogCard = ({ post, navigate }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Color mapping for different categories
  const categoryColors = {
    "Web Development": "text-[#55df8b] border-green-400/20 bg-green-700/[0.08]",
    React: "text-[#55df8b] border-green-400/20 bg-green-700/[0.08]",
    CSS: "text-[#55df8b] border-green-400/20 bg-green-700/[0.08]",
    JavaScript: "text-[#55df8b] border-green-400/20 bg-green-700/[0.08]",
    Design: "text-[#55df8b] border-green-400/20 bg-green-700/[0.08]",
  };

  const getCategoryColor = (category) => {
    return (
      categoryColors[category] ||
      "text-[#55df8b] border-green-400/20 bg-green-700/[0.08]"
    );
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group h-full"
    >
      <div
        className={`relative h-full flex flex-col overflow-hidden rounded-3xl border bg-[#04120c]/70 shadow-[0_15px_50px_rgba(0,0,0,0.18)] transition duration-500 ${
          isHovered
            ? "-translate-y-1 border-green-500/35 bg-[#071d12] shadow-[0_20px_60px_rgba(15,180,80,0.08)]"
            : "border-green-900/25"
        }`}
      >
        {/* Image Container */}
        <div className="relative h-56 overflow-hidden bg-[#03130c]">
          <img
            src={
              post.coverImage ||
              "https://placehold.co/800x500/03130c/55df8b?text=GFG+Journal"
            }
            alt={post.title}
            className={`h-full w-full object-cover opacity-60 transition duration-700 ${
              isHovered ? "scale-110 opacity-100" : "scale-100"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#04120c] via-[#04120c]/30 to-transparent"></div>

          {/* Category Badge */}
          <div className="absolute left-6 top-6">
            <span
              className={`inline-block rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[1.5px] backdrop-blur-md ${getCategoryColor(post.category)}`}
            >
              {post.category || "GFG JOURNAL"}
            </span>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
          {/* Title */}
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold tracking-[1.5px] text-[#48db83]">
              GFG × BVCOE
            </div>
            <button
              type="button"
              aria-label={`Read ${post.title}`}
              onClick={() =>
                navigate(`/blog/post/${encodeURIComponent(post.slug)}`)
              }
              className="flex h-9 w-9 items-center justify-center rounded-full border border-green-900/40 text-lg text-[#91a49a] transition hover:rotate-45 hover:border-green-400/40 hover:bg-green-500 hover:text-white"
            >
              ↗
            </button>
          </div>
          <h3 className="mt-5 line-clamp-2 text-[23px] font-semibold leading-[1.15] tracking-[-1px] text-[#e5eeea] transition-colors group-hover:text-[#39d878]">
            {post.title}
          </h3>

          {/* Description */}
          <p className="mt-4 line-clamp-3 text-[13px] leading-6 text-[#82928a]">
            {post.summary ||
              "Read the latest story from the GFG-BVCOE community."}
          </p>

          {/* Meta Information */}
          <div className="mt-8 flex items-center justify-between border-t border-green-900/25 pt-4 text-[9px] font-medium tracking-[1px] text-[#58675f]">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-green-900/40 bg-green-700/20 text-xs font-bold text-[#55df8b]">
                {getAuthorName(post.author).charAt(0)}
              </div>
              <span className="truncate uppercase text-[#82928a]">
                {getAuthorName(post.author)}
              </span>
            </div>
            <span className="ml-2 whitespace-nowrap">
              {formatPublishedDate(post.createdAt)}
            </span>
          </div>
        </div>

        {/* Read More Button */}
        <div className="px-6 pb-6 pt-0 sm:px-7">
          <button
            onClick={() =>
              navigate(`/blog/post/${encodeURIComponent(post.slug)}`)
            }
            className="w-full rounded-full border border-green-400/20 bg-green-700/[0.08] px-4 py-3 text-sm font-semibold text-[#55df8b] transition hover:border-green-400/40 hover:bg-green-500 hover:text-white"
          >
            Read story <span className="ml-1">↗</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const getAuthorName = (author) => {
  if (!author) return "GFG-BVCOE";
  if (typeof author === "string") return author;
  return (
    `${author.firstName || ""} ${author.lastName || ""}`.trim() || "GFG-BVCOE"
  );
};

const formatPublishedDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default BlogSite;
