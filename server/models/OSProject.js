const mongoose = require("mongoose");

const projectCategories = [
  "Web Development",
  "App Development",
  "Blockchain & Web3",
  "Systems & Backend",
  "Cybersecurity",
  "Cloud, DevOps & Infrastructure",
  "Developer Tools",
];
const difficultyLevels = ["beginner", "intermediate", "capstone", "advanced"];

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
    maintainer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    maintainerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    maintainerLinkedIn: {
      type: String,
      required: true,
      trim: true,
      match: urlPattern,
    },
    maintainerGithub: {
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
