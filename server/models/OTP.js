const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    otp: { type: String, required: true },
    pollToken: { type: String, trim: true, sparse: true }, // one-time token for autofill polling
    autofillAllowed: { type: Boolean, default: false }, // set when user clicks "Autofill" link in email
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 5 * 60, // OTP expires in 5 minutes
    },
  }
);

module.exports = mongoose.model("OTP", otpSchema);
