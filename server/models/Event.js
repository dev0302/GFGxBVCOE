const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    modalDescription: { type: String, default: "" },
    galleryImages: [{ type: String }],
    speakers: [
      {
        name: { type: String, default: "" },
        title: { type: String, default: "" },
      },
    ],
    agenda: [{ type: String }],
    prerequisites: [{ type: String }],
    targetAudience: { type: String, default: "" },
    /** When set, event will be auto-deleted after this date (e.g. 10 days after user clicks Delete). */
    scheduledDeleteAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
