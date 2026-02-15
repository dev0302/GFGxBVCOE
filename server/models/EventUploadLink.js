const mongoose = require("mongoose");
const crypto = require("crypto");

const eventUploadLinkSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

eventUploadLinkSchema.index({ expiresAt: 1 });
eventUploadLinkSchema.index({ token: 1 });

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

module.exports = mongoose.model("EventUploadLink", eventUploadLinkSchema);
module.exports.generateToken = generateToken;
