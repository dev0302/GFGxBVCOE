const express = require("express");
const { auth } = require("../middlewares/AuthZ");
const {
  getBroadcastEmailAudience,
  getBrevoEmailAnalytics,
  getCloudinaryStorageUsage,
  getMongoDatabaseAnalytics,
  sendBroadcastEmail,
} = require("../controllers/settingsController");

const router = express.Router();

router.get("/cloudinary-storage", auth, getCloudinaryStorageUsage);
router.get("/database", auth, getMongoDatabaseAnalytics);
router.get("/email-service", auth, getBrevoEmailAnalytics);
router.get("/broadcast-email/audience", auth, getBroadcastEmailAudience);
router.post("/broadcast-email/send", auth, sendBroadcastEmail);

module.exports = router;
