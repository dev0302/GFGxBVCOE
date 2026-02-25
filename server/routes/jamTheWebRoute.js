const express = require("express");
const { getJamTeams, submitJamScores, getResultsDeclared, declareResults } = require("../controllers/jamTheWebController");
const { auth } = require("../middlewares/AuthZ");

const router = express.Router();

router.get("/declared", getResultsDeclared); // Public
router.post("/declare", auth, declareResults);
router.get("/", getJamTeams); // Public: view-only for guests
router.post("/submit", auth, submitJamScores);

module.exports = router;

