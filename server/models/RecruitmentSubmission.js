const mongoose = require("mongoose");
const crypto = require("crypto");

const recruitmentSubmissionSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true }, // refers to recruitmentForm.formId
    email: { type: String, required: true, lowercase: true, trim: true },
    editToken: { type: String, required: true, unique: true },
    answers: {
      type: Map,
      of: String,
      default: {},
    },
    photo: { type: String, default: "" }, // Cloudinary image URL
  },
  { timestamps: true }
);

recruitmentSubmissionSchema.index({ formId: 1, email: 1 });
recruitmentSubmissionSchema.index({ editToken: 1 });

function generateEditToken() {
  return crypto.randomBytes(24).toString("hex");
}

module.exports = mongoose.model("RecruitmentSubmission", recruitmentSubmissionSchema);
module.exports.generateEditToken = generateEditToken;
