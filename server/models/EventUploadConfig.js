const mongoose = require("mongoose");

const CONFIG_KEY = "event-upload-allowed";
const FORCE_DELETE_CONFIG_KEY = "event-force-delete-allowed";

/** Always allowed to access /uploadevent (Faculty Incharge, Chairperson, Vice-Chairperson, Event Management). */
const CORE_EVENT_UPLOAD_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson", "Event Management"];

/** Faculty Incharge, Chairperson, Vice-Chairperson can always force-delete; Faculty Incharge can allow other departments via config. */
const CORE_FORCE_DELETE_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson"];

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
module.exports.FORCE_DELETE_CONFIG_KEY = FORCE_DELETE_CONFIG_KEY;
module.exports.CORE_EVENT_UPLOAD_ROLES = CORE_EVENT_UPLOAD_ROLES;
module.exports.CORE_FORCE_DELETE_ROLES = CORE_FORCE_DELETE_ROLES;
