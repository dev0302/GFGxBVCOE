const express = require("express");
const { optionalAuth } = require("../middlewares/AuthZ");
const {
  connectContributor,
  getContributor,
  getContributorLeaderboard,
  syncContributor,
  startGithubOAuth,
  githubOAuthCallback,
} = require("../controllers/osContributorController");

const router = express.Router();

router.get("/github/start", startGithubOAuth);
router.get("/github/callback", githubOAuthCallback);
router.get("/leaderboard", getContributorLeaderboard);
router.get("/sync/:githubName", syncContributor);
router.post("/sync/:githubName", syncContributor);
router.post("/connect", optionalAuth, connectContributor);
router.get("/:githubName", getContributor);

module.exports = router;
