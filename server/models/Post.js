const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 200000, // HTML markup from WYSIWYG adds overhead over plain text
    },
    summary: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    coverImage: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    tags: [{
      type: String,
      trim: true,
    }],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending_approval", "published", "rejected"],
      default: "pending_approval",
    },
    feedback: {
      type: String,
      default: "",
    },
    notifyEmail: {
      type: String,
      trim: true,
      default: "",
    },
    fullName: {
      type: String,
      trim: true,
      default: "",
    },
    qualityAudit: {
      hasCode: { type: Boolean, default: false },
      hasHeadings: { type: Boolean, default: false },
      shortParagraphs: { type: Boolean, default: false },
      score: { type: Number, default: 0 }
    },
    // Editorial history
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewAction: {
      type: String,
      enum: ["approved", "rejected", null],
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
