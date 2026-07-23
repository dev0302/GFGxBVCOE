const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    // BVCOE roll numbers are issued as 11 digits, e.g. 01111515625.
    rollNumber: { type: String, required: true, trim: true, unique: true, match: /^\d{11}$/ },
    imageUrls: {
      type: [String],
      required: true,
      validate: {
        validator: (urls) => Array.isArray(urls) && urls.length >= 6 && urls.length <= 10,
        message: "A member enrollment requires between 6 and 10 face images.",
      },
    },
    processed: { type: Boolean, default: false, index: true },
    enrolledAt: { type: Date, default: Date.now },
  },
  { collection: "members", versionKey: false }
);

module.exports = mongoose.model("Member", memberSchema);
