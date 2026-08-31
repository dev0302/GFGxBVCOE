const mongoose = require("mongoose");

const CONFIG_KEY = "task-visibility-config";

const taskConfigSchema = new mongoose.Schema(
  {
    configKey: { type: String, default: CONFIG_KEY, unique: true },
    allowExecutivesSeeAll: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaskConfig", taskConfigSchema);
module.exports.CONFIG_KEY = CONFIG_KEY;
