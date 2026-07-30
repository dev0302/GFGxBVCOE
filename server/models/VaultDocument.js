const mongoose = require("mongoose");

const vaultDocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  folderId: { type: String, default: null },
  department: { type: String, default: "all" },
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  resource_type: { type: String, default: "auto" },
  type: { type: String, default: "application/octet-stream" },
  size: { type: String, default: "0 B" },
  description: { type: String, default: "" },
  content: { type: String, default: "" },
  createdBy: { type: String, default: "Event Management Lead" },
  createdByAvatar: { type: String, default: "" },
  createdByEmail: { type: String, default: "" },
  isLocked: { type: Boolean, default: false },
  lockedBy: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("VaultDocument", vaultDocumentSchema);
