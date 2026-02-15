const mongoose = require("mongoose");

const timelineItemSchema = new mongoose.Schema(
  {
    year: { type: String, default: "" },
    role: { type: String, default: "" },
    project: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const predefinedProfileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    branch: { type: String, default: "" },
    year: { type: String, default: "" },
    position: { type: String, default: "" },
    p0: { type: String, default: "" },
    p1: { type: String, default: "" },
    p2: { type: String, default: "" },
    image: { type: String, default: "" },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    instaLink: { type: String, default: "" },
    linkedinLink: { type: String, default: "" },
    timeline: [timelineItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("PredefinedProfile", predefinedProfileSchema);
