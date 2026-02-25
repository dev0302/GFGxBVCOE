const express = require("express");
const { getJamTeams, submitJamScores } = require("../controllers/jamTheWebController");
const { auth } = require("../middlewares/AuthZ");

const router = express.Router();

router.get("/", getJamTeams); // Public: view-only for guests
router.post("/submit", auth, submitJamScores);

module.exports = router;

