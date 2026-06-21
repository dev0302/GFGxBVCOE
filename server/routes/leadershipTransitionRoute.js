const express = require("express");
const {
  getPositions,
  getPeople,
  getConfig,
  addAllowedUser,
  removeAllowedUser,
  promotePerson,
  getHistory,
  getPendingPromotionEmails,
  sendPendingPromotionEmails,
  endSession,
} = require("../controllers/leadershipTransitionController");
const { auth, canAccessDashboard, canAccessLeadershipTransition } = require("../middlewares/AuthZ");

const router = express.Router();

router.get("/positions", auth, canAccessLeadershipTransition, getPositions);
router.get("/people", auth, canAccessLeadershipTransition, getPeople);
router.get("/config", auth, canAccessLeadershipTransition, getConfig);
router.post("/config/add", auth, canAccessDashboard, addAllowedUser);
router.post("/config/remove", auth, canAccessDashboard, removeAllowedUser);
router.post("/promote", auth, canAccessLeadershipTransition, promotePerson);
router.post("/end-session", auth, canAccessLeadershipTransition, endSession);
router.get("/pending-emails", auth, canAccessLeadershipTransition, getPendingPromotionEmails);
router.post("/pending-emails/send", auth, canAccessLeadershipTransition, sendPendingPromotionEmails);
router.get("/history", auth, canAccessLeadershipTransition, getHistory);

module.exports = router;
