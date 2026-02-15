const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
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
        "Social Media and Promotion",
        "Technical",
        "Event Management",
        "Public Relation and Outreach",
        "Design",
        "Content and Documentation",
        "Photography and Videography",
        "Sponsorship and Marketing",
      ],
    },
    additionalDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
