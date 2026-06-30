const mongoose = require("mongoose");

const recruitmentFormFieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ["text", "number", "select", "checkbox", "textarea"],
    required: true,
  },
  required: { type: Boolean, default: false },
  options: [String], // only useful for select type
});

const recruitmentFormSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    fields: [recruitmentFormFieldSchema],
    status: {
      type: String,
      enum: ["ACTIVE", "PAUSED", "SUSPENDED"],
      default: "ACTIVE",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

recruitmentFormSchema.index({ formId: 1 });

module.exports = mongoose.model("RecruitmentForm", recruitmentFormSchema);
