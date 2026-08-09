const express = require("express");
const { auth, requireRegisteredUser } = require("../middlewares/AuthZ");
const {
  getBroadcastEmailAudience,
  getBrevoEmailAnalytics,
  getCloudinaryStorageUsage,
  getMongoDatabaseAnalytics,
  sendBroadcastEmail,
  getMemberBroadcastEmailAudience,
  sendMemberBroadcastEmail,
  getUnsignedMemberBroadcastEmailAudience,
  sendUnsignedMemberBroadcastEmail,
  getTargetedEmailRecipients,
  sendTargetedEmail,
} = require("../controllers/settingsController");

const router = express.Router();

router.get("/cloudinary-storage", auth, requireRegisteredUser, getCloudinaryStorageUsage);
router.get("/database", auth, requireRegisteredUser, getMongoDatabaseAnalytics);
router.get("/email-service", auth, requireRegisteredUser, getBrevoEmailAnalytics);
router.get("/broadcast-email/audience", auth, requireRegisteredUser, getBroadcastEmailAudience);
router.post("/broadcast-email/send", auth, requireRegisteredUser, sendBroadcastEmail);
router.get("/member-broadcast-email/audience", auth, requireRegisteredUser, getMemberBroadcastEmailAudience);
router.post("/member-broadcast-email/send", auth, requireRegisteredUser, sendMemberBroadcastEmail);
router.get("/member-broadcast-email/unsigned-audience", auth, requireRegisteredUser, getUnsignedMemberBroadcastEmailAudience);
router.post("/member-broadcast-email/unsigned-send", auth, requireRegisteredUser, sendUnsignedMemberBroadcastEmail);
router.get("/targeted-email/recipients", auth, requireRegisteredUser, getTargetedEmailRecipients);
router.post("/targeted-email/send", auth, requireRegisteredUser, sendTargetedEmail);

module.exports = router;
