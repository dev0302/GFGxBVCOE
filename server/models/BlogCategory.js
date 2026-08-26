const mongoose = require("mongoose");

const blogCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 80,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BlogCategory", blogCategorySchema);
