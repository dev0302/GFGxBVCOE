const express = require("express");
const { auth } = require("../middlewares/AuthZ");

const {
  getDashboardAllowed,
  addDashboardAllowedDepartment,
  removeDashboardAllowedDepartment,
  updateDashboardMemberAccess,
  requireCanManageDashboardConfig,
} = require("../controllers/dashboardController");

const router = express.Router();

// Read allowed departments for a given dashboard (auth required).
router.get(
  "/:dashboardKey/allowed",
  auth,
  requireCanManageDashboardConfig,
  getDashboardAllowed,
);

// Manage "Departments allowed" list (auth required + dashboard core roles).
router.post(
  "/:dashboardKey/allowed/add",
  auth,
  requireCanManageDashboardConfig,
  addDashboardAllowedDepartment,
);
router.post(
  "/:dashboardKey/allowed/remove",
  auth,
  requireCanManageDashboardConfig,
  removeDashboardAllowedDepartment,
);
router.post(
  "/:dashboardKey/member-access",
  auth,
  requireCanManageDashboardConfig,
  updateDashboardMemberAccess,
);

module.exports = router;
