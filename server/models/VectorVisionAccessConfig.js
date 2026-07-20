const mongoose = require("mongoose");

const BOOTSTRAP_ALLOWED_EMAILS = [
  "devmalik838400@gmail.com",
  "soumyasuryan86@gmail.com",
];

const vectorVisionAccessConfigSchema = new mongoose.Schema(
  {
    configKey: { type: String, required: true, unique: true, default: "vectorvision-admin" },
    allowedEmails: {
      type: [String],
      default: () => [...BOOTSTRAP_ALLOWED_EMAILS],
      set: (emails) => [...new Set((emails || []).map((email) => String(email).trim().toLowerCase()).filter(Boolean))],
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("VectorVisionAccessConfig", vectorVisionAccessConfigSchema);
module.exports.BOOTSTRAP_ALLOWED_EMAILS = BOOTSTRAP_ALLOWED_EMAILS;
