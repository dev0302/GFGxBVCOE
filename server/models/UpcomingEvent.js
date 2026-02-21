const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  { question: { type: String, trim: true }, answer: { type: String, trim: true } },
  { _id: false }
);

const upcomingEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    description: { type: String, default: "" },
    poster: { type: String, default: "" },
    location: { type: String, default: "" },
    time: { type: String, default: "" },
    targetAudience: { type: String, default: "" },
    otherLinks: { type: String, default: "" }, // JSON string: [{ label, url }]
    otherDocs: { type: String, default: "" }, // JSON string or comma-separated URLs
    faqs: { type: [faqSchema], default: [] },
  },
  { timestamps: true }
);

upcomingEventSchema.index({ date: 1 });

module.exports = mongoose.model("UpcomingEvent", upcomingEventSchema);
