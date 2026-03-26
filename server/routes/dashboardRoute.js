const express = require("express");
const { auth } = require("../middlewares/AuthZ");

const {
  getDashboardAllowed,
  addDashboardAllowedDepartment,
  removeDashboardAllowedDepartment,
  requireCanManageDashboardConfig,
} = require("../controllers/dashboardController");

const router = express.Router();

// Read allowed departments for a given dashboard (auth required).
router.get("/:dashboardKey/allowed", auth, getDashboardAllowed);

// Manage "Departments allowed" list (auth required + dashboard core roles).
router.post("/:dashboardKey/allowed/add", auth, requireCanManageDashboardConfig, addDashboardAllowedDepartment);
router.post("/:dashboardKey/allowed/remove", auth, requireCanManageDashboardConfig, removeDashboardAllowedDepartment);

module.exports = router;

