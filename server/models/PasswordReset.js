const mongoose = require("mongoose");
const crypto = require("crypto");

const passwordResetSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

passwordResetSchema.index({ token: 1 });
passwordResetSchema.index({ expiresAt: 1 });

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = mongoose.model("PasswordReset", passwordResetSchema);
module.exports.generateToken = generateToken;
