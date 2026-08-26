const Post = require("../models/Post");
const User = require("../models/User");
const {
  ensureCategoryExists,
  findCategoryByName,
  listCategoryNames,
} = require("../utils/blogCategoryStore");
const {
  notifyBlogSubmission,
  notifyBlogStatusChange,
} = require("../utils/notificationService");
const {
  containsProfanity,
  sanitizeHtml,
  calculateQualityAudit,
} = require("../utils/moderation");
const { imageUpload } = require("../config/cloudinary");
const { userCanReviewBlog } = require("../utils/leadershipAccess");

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
};

const generateUniqueSlug = async (title) => {
  let slug = slugify(title);
  let uniqueSlug = slug;
  let count = 1;
  while (await Post.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${slug}-${count}`;
    count++;
  }
  return uniqueSlug;
};

const normalizeTags = (tags) => {
  if (typeof tags !== "string") return tags;
  try {
    const parsedTags = JSON.parse(tags);
    return parsedTags;
  } catch {
    return tags;
  }
};

exports.submitPost = async (req, res) => {
  try {
    const { title, content, summary, coverImage, category, notifyEmail, fullName } = req.body;
    const tags = normalizeTags(req.body.tags);
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and Content are required fields.",
      });
    }

    // NoSQL Injection Prevention: Strictly validate input types
    if (typeof title !== "string" || typeof content !== "string") {
      return res.status(400).json({
        success: false,
        message: "Title and Content must be strings.",
      });
    }
    if (summary && typeof summary !== "string") {
      return res.status(400).json({
        success: false,
        message: "Summary must be a string.",
      });
    }
    if (category && typeof category !== "string") {
      return res.status(400).json({
        success: false,
        message: "Category must be a string.",
      });
    }
    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: "Tags must be an array of strings.",
      });
    }
    if (!fullName || (typeof fullName === "string" && !fullName.trim())) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }
    if (typeof fullName !== "string") {
      return res.status(400).json({
        success: false,
        message: "Full name must be a string.",
      });
    }
    if (!notifyEmail || (typeof notifyEmail === "string" && !notifyEmail.trim())) {
      return res.status(400).json({
        success: false,
        message: "Notification email is required.",
      });
    }
    if (typeof notifyEmail !== "string") {
      return res.status(400).json({
        success: false,
        message: "Notification email must be a string.",
      });
    }
    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail.trim())) {
      return res.status(400).json({
        success: false,
        message: "Notification email is not a valid email address.",
      });
    }

    let coverImageUrl = "";
    if (req.files && req.files.coverImage) {
      const uploadResult = await imageUpload(
        req.files.coverImage,
        "blogImages",
        80,
      );
      coverImageUrl = uploadResult.secure_url;
    } else if (coverImage) {
      if (typeof coverImage !== "string") {
        return res.status(400).json({
          success: false,
          message: "Cover image must be a string URL.",
        });
      }
      coverImageUrl = coverImage;
    }

    // Content Moderation: Reject vulgar/profanity words
    if (
      containsProfanity(title) ||
      containsProfanity(content) ||
      containsProfanity(summary || "")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Submission blocked: Content contains inappropriate or vulgar language.",
      });
    }

    // XSS Security: Sanitize HTML content
    const sanitizedContent = sanitizeHtml(content);

    // Scribble Style Quality Audit
    const qualityAudit = calculateQualityAudit(sanitizedContent);

    const slug = await generateUniqueSlug(title);
    const normalizedCategory = category?.trim()
      ? await ensureCategoryExists(category)
      : "";

    const post = await Post.create({
      title,
      slug,
      content: sanitizedContent,
      summary: summary || "",
      coverImage: coverImageUrl,
      category: normalizedCategory || "",
      tags: tags || [],
      author: req.user.id,
      status: "pending_approval",
      qualityAudit,
      fullName: fullName.trim(),
      notifyEmail: notifyEmail.trim(),
    });

    const author = await User.findById(req.user.id).select(
      "firstName lastName email",
    );

    notifyBlogSubmission({ post, author }).catch((err) =>
      console.error("notifyBlogSubmission background error:", err),
    );

    return res.status(201).json({
      success: true,
      message: "Post submitted successfully and is pending approval.",
      post,
    });
  } catch (error) {
    console.error("submitPost error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit post.",
      error: error.message,
    });
  }
};

exports.getPendingPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "pending_approval" })
      .populate("author", "firstName lastName email image role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("getPendingPosts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pending posts.",
      error: error.message,
    });
  }
};

exports.approvePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { action, feedback } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Valid action ('approve' or 'reject') is required.",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found.",
      });
    }

    if (post.status !== "pending_approval") {
      return res.status(400).json({
        success: false,
        message: `Post has already been processed (status is currently '${post.status}').`,
      });
    }

    const reviewer = await User.findById(req.user.id);
    const author = await User.findById(post.author);

    if (action === "approve") {
      post.status = "published";
      post.feedback = "";
    } else {
      post.status = "rejected";
      post.feedback = feedback || "No feedback provided.";
    }

    // Store editorial audit trail
    post.reviewedBy = reviewer._id;
    post.reviewedAt = new Date();
    post.reviewAction = action === "approve" ? "approved" : "rejected";

    await post.save();

    if (author) {
      notifyBlogStatusChange({
        post,
        author,
        reviewer,
        action,
        feedback: post.feedback,
      }).catch((err) =>
        console.error("notifyBlogStatusChange background error:", err),
      );
    }

    return res.status(200).json({
      success: true,
      message: `Post has been successfully ${action === "approve" ? "approved and published" : "rejected"}.`,
      post,
    });
  } catch (error) {
    console.error("approvePost error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process post approval/rejection.",
      error: error.message,
    });
  }
};

function toAbsoluteAssetUrl(siteUrl, value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!siteUrl) return trimmed;
  return `${siteUrl}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

exports.getBlogOgMeta = async (req, res) => {
  try {
    const post = await Post.findOne({ status: "published" })
      .sort({ createdAt: -1 })
      .select("title summary coverImage slug createdAt");

    const siteUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
    const defaultTitle = "GFG BVCOE Blog";
    const defaultDescription =
      "Stories, insights, and updates from the GFG-BVCOE community.";
    const defaultImage = toAbsoluteAssetUrl(siteUrl, "/gfg_web_og.png");

    const image = post?.coverImage?.trim()
      ? toAbsoluteAssetUrl(siteUrl, post.coverImage)
      : defaultImage;

    return res.status(200).json({
      success: true,
      og: {
        title: post?.title?.trim() || defaultTitle,
        description: post?.summary?.trim() || defaultDescription,
        image,
        url: siteUrl ? `${siteUrl}/blog` : "/blog",
      },
    });
  } catch (error) {
    console.error("getBlogOgMeta error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve blog preview metadata.",
      error: error.message,
    });
  }
};

exports.getPublicPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "published" })
      .populate("author", "firstName lastName image role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("getPublicPosts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve public blog posts.",
      error: error.message,
    });
  }
};

exports.getReviewHistory = async (req, res) => {
  try {
    const posts = await Post.find({
      status: { $in: ["published", "rejected"] },
      reviewedBy: { $ne: null },
    })
      .populate("author", "firstName lastName email image")
      .populate("reviewedBy", "firstName lastName email image accountType")
      .sort({ reviewedAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("getReviewHistory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve review history.",
      error: error.message,
    });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("author", "firstName lastName email image")
      .populate("reviewedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("getAllPosts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve posts.",
      error: error.message,
    });
  }
};

exports.getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await Post.findOne({ slug, status: "published" }).populate(
      "author",
      "firstName lastName image role",
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found.",
      });
    }

    return res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("getPostBySlug error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve blog post.",
      error: error.message,
    });
  }
};

exports.editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, summary, coverImage, category } = req.body;
    const tags = normalizeTags(req.body.tags);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found.",
      });
    }

    // Only the author of the post can edit it
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only the author of the post can edit it.",
      });
    }

    // Validation (type checks)
    if (title && typeof title !== "string") {
      return res.status(400).json({
        success: false,
        message: "Title must be a string.",
      });
    }
    if (content && typeof content !== "string") {
      return res.status(400).json({
        success: false,
        message: "Content must be a string.",
      });
    }
    if (summary && typeof summary !== "string") {
      return res.status(400).json({
        success: false,
        message: "Summary must be a string.",
      });
    }
    if (category && typeof category !== "string") {
      return res.status(400).json({
        success: false,
        message: "Category must be a string.",
      });
    }
    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: "Tags must be an array of strings.",
      });
    }

    // Moderation and Audit checks
    const checkTitle = title || post.title;
    const checkContent = content || post.content;
    const checkSummary = summary || post.summary || "";

    if (
      containsProfanity(checkTitle) ||
      containsProfanity(checkContent) ||
      containsProfanity(checkSummary)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Update blocked: Content contains inappropriate or vulgar language.",
      });
    }

    // Apply updates
    if (title && title !== post.title) {
      post.title = title;
      post.slug = await generateUniqueSlug(title);
    }

    if (content) {
      post.content = sanitizeHtml(content);
      post.qualityAudit = calculateQualityAudit(post.content);
    }

    if (summary !== undefined) {
      post.summary = summary;
    }

    if (category !== undefined) {
      post.category = category?.trim()
        ? await ensureCategoryExists(category)
        : "";
    }

    if (tags !== undefined) {
      post.tags = tags;
    }

    // Handle cover image upload or URL string
    if (req.files && req.files.coverImage) {
      const uploadResult = await imageUpload(
        req.files.coverImage,
        "blogImages",
        80,
      );
      post.coverImage = uploadResult.secure_url;
    } else if (coverImage !== undefined) {
      if (coverImage && typeof coverImage !== "string") {
        return res.status(400).json({
          success: false,
          message: "Cover image must be a string URL.",
        });
      }
      post.coverImage = coverImage;
    }

    // Reset status to pending_approval on edit
    post.status = "pending_approval";
    post.feedback = "";

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Post updated successfully and is pending approval.",
      post,
    });
  } catch (error) {
    console.error("editPost error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to edit post.",
      error: error.message,
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await listCategoryNames();
    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("getCategories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve blog categories.",
      error: error.message,
    });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const trimmed = name.trim();
    if (trimmed.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Category name must be 80 characters or fewer.",
      });
    }

    if (containsProfanity(trimmed)) {
      return res.status(400).json({
        success: false,
        message: "Category name contains inappropriate language.",
      });
    }

    const existing = await findCategoryByName(trimmed);
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Category already exists.",
        category: existing.name,
      });
    }

    const category = await ensureCategoryExists(trimmed);
    return res.status(201).json({
      success: true,
      message: "Category added successfully.",
      category,
    });
  } catch (error) {
    console.error("addCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add category.",
      error: error.message,
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Delete access belongs to the author, or editorial leads, heads, and admins.
    const isAuthor = post.author.toString() === req.user.id;
    const isLeadOrHeadOrAdmin = await userCanReviewBlog(req.user.id);

    if (!isAuthor && !isLeadOrHeadOrAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You do not have permission to delete this post.",
      });
    }

    await Post.findByIdAndDelete(postId);

    return res.status(200).json({
      success: true,
      message: "Blog post deleted successfully.",
    });
  } catch (error) {
    console.error("deletePost error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete post.",
      error: error.message,
    });
  }
};
