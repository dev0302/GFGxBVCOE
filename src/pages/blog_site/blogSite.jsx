import React, { useEffect, useState } from "react";
import { getPublicPosts } from "../../services/blog_api";

const BlogSite = () => {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    ...new Set(posts.map((post) => post.category).filter(Boolean)),
  ];

  // Filter posts based on selected category
  const filteredPosts = selectedCategory
    ? posts.filter((post) => post.category === selectedCategory)
    : posts;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#252537" }}>
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

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-wrap gap-3">
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
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 rounded-full font-montserrat font-semibold text-sm transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-richblack-5 shadow-lg shadow-cyan-500/50"
                  : "bg-richblack-700 text-richblack-100 hover:bg-richblack-800 border border-richblack-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-richblack-5 font-audiowide mb-8">
          All Posts
        </h2>

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
              <BlogCard key={post._id || post.slug} post={post} />
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

const BlogCard = ({ post }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Color mapping for different categories
  const categoryColors = {
    "Web Development": "from-blue-500 to-cyan-500",
    React: "from-purple-500 to-pink-500",
    CSS: "from-yellow-500 to-orange-500",
    JavaScript: "from-yellow-400 to-yellow-600",
    Design: "from-red-500 to-pink-500",
  };

  const getCategoryColor = (category) => {
    return categoryColors[category] || "from-cyan-500 to-purple-500";
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group h-full"
    >
      <div
        className={`relative h-full flex flex-col rounded-2xl overflow-hidden bg-gradient-to-br from-[#1e1e2f] to-[#2c2c3e] backdrop-blur-sm border border-gray-700/50 transition-all duration-300 ${
          isHovered
            ? "border-cyan-500/50 shadow-2xl shadow-cyan-500/20 transform -translate-y-2"
            : "hover:border-gray-600/50"
        }`}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden h-48 sm:h-56 bg-gray-900">
          <img
            src={
              post.coverImage ||
              "https://placehold.co/800x500/1e1e2f/94a3b8?text=GFG+Journal"
            }
            alt={post.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isHovered ? "scale-110" : "scale-100"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span
              className={`inline-block px-3 py-1 bg-gradient-to-r ${getCategoryColor(
                post.category,
              )} text-white text-xs font-bold rounded-full backdrop-blur-md bg-opacity-80`}
            >
              {post.category}
            </span>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col">
          {/* Title */}
          <h3 className="text-lg sm:text-xl font-bold text-richblack-5 mb-3 font-montserrat line-clamp-2 group-hover:text-cyan-400 transition-colors duration-300">
            {post.title}
          </h3>

          {/* Description */}
          <p className="text-richblack-200 text-sm sm:text-base font-nunito mb-4 flex-1 line-clamp-3">
            {post.summary ||
              "Read the latest story from the GFG-BVCOE community."}
          </p>

          {/* Meta Information */}
          <div className="flex items-center justify-between pt-4 border-t border-richblack-200/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-richblack-5 text-xs font-bold">
                {getAuthorName(post.author).charAt(0)}
              </div>
              <span className="text-richblack-100 text-sm font-montserrat truncate">
                {getAuthorName(post.author)}
              </span>
            </div>
            <span className="text-richblack-200 text-xs sm:text-sm font-montserrat whitespace-nowrap ml-2">
              {formatPublishedDate(post.createdAt)}
            </span>
          </div>
        </div>

        {/* Read More Button */}
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
          <button
            className={`w-full py-2.5 px-4 rounded-lg font-montserrat font-semibold text-sm transition-all duration-300 ${
              isHovered
                ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-richblack-5 shadow-lg shadow-cyan-500/50"
                : "bg-richblack-700/50 text-richblack-100 border border-richblack-200/30 hover:bg-richblack-800/50"
            }`}
          >
            Read More
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
