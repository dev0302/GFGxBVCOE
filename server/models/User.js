const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    contact: { type: String, default: "" },
    accountType: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "ADMIN",
        "Chairperson",
        "Vice-Chairperson",
        "Treasurer",
        "Social Media and Promotion",
        "Technical",
        "Event Management",
        "Design and Creative",
        "Content and Documentation",
        "Capture The Event",
        "Sponsorship and Marketing",
      ],
    },
    additionalDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
    image: { type: String, default: "" },
    /** Updated on site open (heartbeat + socket connect) for “last seen” roster */
    lastSeen: { type: Date, default: null, index: true },
    /** Set when tenure ends — user gets 24h grace period before account deletion */
    tenureEndedAt: { type: Date, default: null, index: true },
    sessionExpiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
