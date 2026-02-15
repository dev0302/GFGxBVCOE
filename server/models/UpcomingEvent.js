const mongoose = require("mongoose");

const upcomingEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    poster: { type: String, default: "" },
    location: { type: String, default: "" },
    time: { type: String, default: "" },
    targetAudience: { type: String, default: "" },
    otherLinks: { type: String, default: "" }, // JSON string: [{ label, url }]
    otherDocs: { type: String, default: "" }, // JSON string or comma-separated URLs
  },
  { timestamps: true }
);

upcomingEventSchema.index({ date: 1 });

module.exports = mongoose.model("UpcomingEvent", upcomingEventSchema);
