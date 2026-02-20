
const mongoose = require("mongoose");
const crypto = require("crypto");

const INVITE_LINK_EXPIRY_HOURS = 12;

const teamInviteLinkSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    department: { type: String, required: true, trim: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

teamInviteLinkSchema.index({ token: 1 });
teamInviteLinkSchema.index({ expiresAt: 1 });

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

module.exports = mongoose.model("TeamInviteLink", teamInviteLinkSchema);
module.exports.generateToken = generateToken;
module.exports.INVITE_LINK_EXPIRY_HOURS = INVITE_LINK_EXPIRY_HOURS;
