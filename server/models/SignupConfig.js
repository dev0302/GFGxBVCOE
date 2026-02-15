const mongoose = require("mongoose");

const signupConfigSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    allowedEmails: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SignupConfig", signupConfigSchema);
