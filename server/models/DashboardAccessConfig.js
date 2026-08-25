const mongoose = require("mongoose");

/**
 * Stores "Departments allowed" for each department dashboard.
 *
 * A dashboardKey represents a department (e.g. "Technical", "Design and Creative", ...).
 * - Core access: Society roles + that dashboardKey itself
 * - Extra access: additional departments pushed via UI
 */
const dashboardAccessConfigSchema = new mongoose.Schema(
  {
    dashboardKey: { type: String, required: true, unique: true, trim: true },
    extraAllowedDepartments: [{ type: String, trim: true }],
    // Kept for backwards compatibility with existing dashboard-wide settings.
    // New settings grant member access section by section.
    departmentMembersEnabled: { type: Boolean, default: false },
    memberSectionAccess: { type: Map, of: Boolean, default: {} },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "DashboardAccessConfig",
  dashboardAccessConfigSchema,
);
