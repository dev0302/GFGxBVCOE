const mongoose = require("mongoose");

const excelFileSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  data: { type: Buffer, required: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ExcelFile", excelFileSchema);
