const mongoose = require("mongoose");

const timelineItemSchema = new mongoose.Schema(
  { year: String, role: String, project: String, description: String },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    gender: { type: String, default: null },
    dob: { type: Date, default: null },
    about: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    yearOfStudy: { type: String, default: null },
    branch: { type: String, default: null },
    section: { type: String, default: null },
    non_tech_society: { type: String, default: null },
    year: { type: String, default: null },
    position: { type: String, default: null },
    p0: { type: String, default: null },
    p1: { type: String, default: null },
    p2: { type: String, default: null },
    timeline: [timelineItemSchema],
    socials: {
      instagram: { type: String, default: null },
      linkedin: { type: String, default: null },
      github: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
