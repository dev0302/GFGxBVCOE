const Post = require("../models/Post");
const User = require("../models/User");
const { notifyBlogSubmission, notifyBlogStatusChange } = require("../utils/notificationService");
const { containsProfanity, sanitizeHtml, calculateQualityAudit } = require("../utils/moderation");
const { imageUpload } = require("../config/cloudinary");

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

exports.submitPost = async (req, res) => {
  try {
    const { title, content, summary, coverImage, category, tags } = req.body;
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

    let coverImageUrl = "";
    if (req.files && req.files.coverImage) {
      const uploadResult = await imageUpload(req.files.coverImage, "blogImages", 80);
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
    if (containsProfanity(title) || containsProfanity(content) || containsProfanity(summary || "")) {
      return res.status(400).json({
        success: false,
        message: "Submission blocked: Content contains inappropriate or vulgar language.",
      });
    }

    // XSS Security: Sanitize HTML content
    const sanitizedContent = sanitizeHtml(content);

    // Scribble Style Quality Audit
    const qualityAudit = calculateQualityAudit(sanitizedContent);

    const slug = await generateUniqueSlug(title);

    const post = await Post.create({
      title,
      slug,
      content: sanitizedContent,
      summary: summary || "",
      coverImage: coverImageUrl,
      category: category || "",
      tags: tags || [],
      author: req.user.id,
      status: "pending_approval",
      qualityAudit,
    });

    const author = await User.findById(req.user.id).select("firstName lastName email");

    notifyBlogSubmission({ post, author }).catch((err) =>
      console.error("notifyBlogSubmission background error:", err)
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

    await post.save();

    if (author) {
      notifyBlogStatusChange({
        post,
        author,
        reviewer,
        action,
        feedback: post.feedback,
      }).catch((err) =>
        console.error("notifyBlogStatusChange background error:", err)
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

exports.getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await Post.findOne({ slug, status: "published" })
      .populate("author", "firstName lastName image role");

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
