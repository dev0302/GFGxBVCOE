const express = require("express");
const { auth, canAccessDashboard } = require("../middlewares/AuthZ");
const {
  getBrevoEmailAnalytics,
  getCloudinaryStorageUsage,
  getMongoDatabaseAnalytics,
} = require("../controllers/settingsController");

const router = express.Router();

router.get("/cloudinary-storage", auth, canAccessDashboard, getCloudinaryStorageUsage);
router.get("/database", auth, canAccessDashboard, getMongoDatabaseAnalytics);
router.get("/email-service", auth, canAccessDashboard, getBrevoEmailAnalytics);

module.exports = router;
