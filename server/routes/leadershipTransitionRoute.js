const express = require("express");
const {
  getPositions,
  getPeople,
  getConfig,
  addAllowedUser,
  removeAllowedUser,
  promotePerson,
  getHistory,
  endSession,
} = require("../controllers/leadershipTransitionController");
const {
  getActiveDraft,
  finalizeDraft,
  approveDraft,
  revokeApproval,
  discardDraft,
  applyDraft,
  downloadReport,
  getAppliedSessions,
  removeDraftChange,
} = require("../controllers/leadershipDraftController");
const { auth, canAccessDashboard, canAccessLeadershipTransition } = require("../middlewares/AuthZ");

const router = express.Router();

router.get("/positions", auth, canAccessLeadershipTransition, getPositions);
router.get("/people", auth, canAccessLeadershipTransition, getPeople);
router.get("/config", auth, canAccessLeadershipTransition, getConfig);
router.post("/config/add", auth, canAccessDashboard, addAllowedUser);
router.post("/config/remove", auth, canAccessDashboard, removeAllowedUser);
router.post("/promote", auth, canAccessLeadershipTransition, promotePerson);
router.post("/end-session", auth, canAccessLeadershipTransition, endSession);
router.get("/history", auth, canAccessLeadershipTransition, getHistory);

router.get("/draft/active", auth, canAccessLeadershipTransition, getActiveDraft);
router.post("/draft/finalize", auth, canAccessLeadershipTransition, finalizeDraft);
router.post("/draft/approve", auth, canAccessLeadershipTransition, approveDraft);
router.post("/draft/revoke-approval", auth, canAccessLeadershipTransition, revokeApproval);
router.post("/draft/discard", auth, canAccessLeadershipTransition, discardDraft);
router.post("/draft/apply", auth, canAccessLeadershipTransition, applyDraft);
router.delete("/draft/changes/:changeId", auth, canAccessLeadershipTransition, removeDraftChange);
router.get("/draft/report/:sessionId", auth, canAccessLeadershipTransition, downloadReport);
router.get("/draft/sessions", auth, canAccessLeadershipTransition, getAppliedSessions);

module.exports = router;
