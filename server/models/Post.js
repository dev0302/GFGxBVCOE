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
      maxlength: 50000,
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
    qualityAudit: {
      hasCode: { type: Boolean, default: false },
      hasHeadings: { type: Boolean, default: false },
      shortParagraphs: { type: Boolean, default: false },
      score: { type: Number, default: 0 }
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
