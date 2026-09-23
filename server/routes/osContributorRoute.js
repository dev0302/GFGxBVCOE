const express = require("express");
const {
  createOrUpdateContributor,
  getContributor,
  getContributorLeaderboard,
} = require("../controllers/osContributorController");

const router = express.Router();

router.get("/leaderboard", getContributorLeaderboard);
router.get("/:githubName", getContributor);
router.post("/", createOrUpdateContributor);

module.exports = router;
