const express = require("express");
const { auth, isLeadOrHead } = require("../middlewares/AuthZ");
const {
  submitPost,
  getPendingPosts,
  approvePost,
  getPublicPosts,
  getPostBySlug,
} = require("../controllers/blogController");

const router = express.Router();

// Author submits a new post (requires user authentication)
router.post("/submit", auth, submitPost);

// Leads/Heads can view a list of all posts pending approval (requires authentication and lead/head role)
router.get("/pending", auth, isLeadOrHead, getPendingPosts);

// Leads/Heads can approve or reject a pending post (requires authentication and lead/head role)
router.post("/approve/:postId", auth, isLeadOrHead, approvePost);

// Public feed: view all published posts (public, no authentication needed)
router.get("/public", getPublicPosts);

// Public route: fetch specific blog post details by its SEO slug (public)
router.get("/post/:slug", getPostBySlug);





module.exports = router;

