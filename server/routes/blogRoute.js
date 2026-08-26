const express = require("express");
const { auth, isLeadOrHead } = require("../middlewares/AuthZ");
const {
  submitPost,
  getPendingPosts,
  approvePost,
  getPublicPosts,
  getPostBySlug,
  editPost,
  deletePost,
  getReviewHistory,
  getAllPosts,
  getCategories,
  addCategory,
} = require("../controllers/blogController");

const router = express.Router();

// Author submits a new post (requires user authentication)
router.post("/submit", auth, submitPost);

// Leads/Heads can view a list of all posts pending approval
router.get("/pending", auth, isLeadOrHead, getPendingPosts);

// Leads/Heads can approve or reject a pending post
router.post("/approve/:postId", auth, isLeadOrHead, approvePost);

// Leads/Heads can view editorial review history (approved + rejected)
router.get("/history", auth, isLeadOrHead, getReviewHistory);

// Leads/Heads can view all posts for management (all statuses)
router.get("/all", auth, isLeadOrHead, getAllPosts);

// Public feed: view all published posts
router.get("/public", getPublicPosts);

// Public list of blog categories
router.get("/categories", getCategories);

// Authenticated users can add a new category
router.post("/categories", auth, addCategory);

// Public route: fetch specific blog post details by slug
router.get("/post/:slug", getPostBySlug);

// Author edits their own post
router.put("/edit/:postId", auth, editPost);

// Author, Leads, Heads or Admins can delete a post
router.delete("/delete/:postId", auth, deletePost);

module.exports = router;
