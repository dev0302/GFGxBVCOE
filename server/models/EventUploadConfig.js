const mongoose = require("mongoose");

const CONFIG_KEY = "event-upload-allowed";

/** Always allowed to access /uploadevent (Faculty Incharge, Chairperson, Vice-Chairperson, Event Management). */
const CORE_EVENT_UPLOAD_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson", "Event Management"];

const eventUploadConfigSchema = new mongoose.Schema(
  {
    configKey: { type: String, default: CONFIG_KEY, unique: true },
    /** Departments allowed to access /uploadevent in addition to core. */
    extraAllowedDepartments: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("EventUploadConfig", eventUploadConfigSchema);
module.exports.CONFIG_KEY = CONFIG_KEY;
module.exports.CORE_EVENT_UPLOAD_ROLES = CORE_EVENT_UPLOAD_ROLES;
