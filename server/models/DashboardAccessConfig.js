const mongoose = require("mongoose");

/**
 * Stores "Departments allowed" for each department dashboard.
 *
 * A dashboardKey represents a department (e.g. "Technical", "Design", ...).
 * - Core access: Society roles + that dashboardKey itself
 * - Extra access: additional departments pushed via UI
 */
const dashboardAccessConfigSchema = new mongoose.Schema(
  {
    dashboardKey: { type: String, required: true, unique: true, trim: true },
    extraAllowedDepartments: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("DashboardAccessConfig", dashboardAccessConfigSchema);

