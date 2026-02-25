const mongoose = require("mongoose");

const jamTheWebConfigSchema = new mongoose.Schema(
  {
    resultsDeclared: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "jamthewebconfig" }
);

// Single document config - use findOneAndUpdate with upsert
module.exports = mongoose.model("JamTheWebConfig", jamTheWebConfigSchema);
