const mongoose = require("mongoose");

const projectCategories = [
  "Core Engine",
  "Backend Services",
  "DevTools & MCP",
  "UI Components",
  "Documentation",
];
const difficultyLevels = ["beginner", "intermediate", "advanced"];

const urlPattern = /^https?:\/\/[^\s]+$/i;

const osProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    repository: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[\w.-]+\/[\w.-]+$/,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      required: true,
      enum: projectCategories,
      index: true,
    },
    difficultyLevel: {
      type: String,
      required: true,
      enum: difficultyLevels,
      index: true,
    },
    stacks: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 60,
        },
      ],
      required: true,
      validate: {
        validator: (stacks) => stacks.length > 0,
        message: "At least one technology stack is required.",
      },
    },
    admin: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    adminEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    adminLinkedIn: {
      type: String,
      required: true,
      trim: true,
      match: urlPattern,
    },
    adminGithub: {
      type: String,
      required: true,
      trim: true,
      match: urlPattern,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

osProjectSchema.index({ isPublished: 1, category: 1, createdAt: -1 });
osProjectSchema.index({ name: "text", description: "text", stacks: "text" });

module.exports = mongoose.model("OSProject", osProjectSchema);
