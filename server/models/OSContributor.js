const mongoose = require("mongoose");

const contributionSchema = new mongoose.Schema(
  {
    beginner: { type: Number, default: 0, min: 0 },
    intermediate: { type: Number, default: 0, min: 0 },
    advanced: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const osContributorSchema = new mongoose.Schema(
  {
    github_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z\d](?:[a-z\d-]{0,37})$/i,
    },
    github_profile_url: { type: String, default: "" },
    github_avatar_url: { type: String, default: "" },
    total_contributions: {
      type: contributionSchema,
      default: () => ({}),
    },
    points: { type: Number, default: 0, min: 0 },
    email_id: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      default: "",
    },
    contact: { type: String, trim: true, default: "" },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    last_synced_at: { type: Date, default: null },
  },
  { timestamps: true },
);

osContributorSchema.index({ points: -1 });

module.exports = mongoose.model("OSContributor", osContributorSchema);
