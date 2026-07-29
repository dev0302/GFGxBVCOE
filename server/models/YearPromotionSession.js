const mongoose = require("mongoose");

const yearChangeSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ["profile", "predefined", "teamMember"],
      required: true,
    },
    entityId: { type: String, required: true },
    department: { type: String, default: "" },
    email: { type: String, default: "" },
    name: { type: String, default: "" },
    oldYear: { type: String, default: "" },
    newYear: { type: String, default: "" },
    oldYearOfStudy: { type: String, default: "" },
    newYearOfStudy: { type: String, default: "" },
  },
  { _id: false }
);

const actorSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { _id: false }
);

const yearPromotionSessionSchema = new mongoose.Schema(
  {
    appliedBy: { type: actorSchema, required: true },
    appliedAt: { type: Date, default: Date.now },
    revertedBy: { type: actorSchema, default: null },
    revertedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "reverted"],
      default: "active",
    },
    totalUpdated: { type: Number, default: 0 },
    summary: {
      type: Map,
      of: Number,
      default: {},
    },
    changes: [yearChangeSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("YearPromotionSession", yearPromotionSessionSchema);
