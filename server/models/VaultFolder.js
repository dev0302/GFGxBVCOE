const mongoose = require("mongoose");

const vaultFolderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  parentId: { type: String, default: null },
  department: { type: String, default: "all" },
  color: { type: String, default: "cyan" },
  createdBy: { type: String, default: "Event Management Lead" },
  createdByAvatar: { type: String, default: "" },
  createdByEmail: { type: String, default: "" },
  isLocked: { type: Boolean, default: false },
  lockedBy: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("VaultFolder", vaultFolderSchema);
