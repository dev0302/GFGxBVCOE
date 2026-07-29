const express = require("express");
const { auth } = require("../middlewares/AuthZ");
const {
  getBroadcastEmailAudience,
  getBrevoEmailAnalytics,
  getCloudinaryStorageUsage,
  getMongoDatabaseAnalytics,
  sendBroadcastEmail,
  getTargetedEmailRecipients,
  sendTargetedEmail,
} = require("../controllers/settingsController");

const router = express.Router();

router.get("/cloudinary-storage", auth, getCloudinaryStorageUsage);
router.get("/database", auth, getMongoDatabaseAnalytics);
router.get("/email-service", auth, getBrevoEmailAnalytics);
router.get("/broadcast-email/audience", auth, getBroadcastEmailAudience);
router.post("/broadcast-email/send", auth, sendBroadcastEmail);
router.get("/targeted-email/recipients", auth, getTargetedEmailRecipients);
router.post("/targeted-email/send", auth, sendTargetedEmail);

module.exports = router;
