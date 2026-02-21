const express = require("express");
const { getLogsByUserId } = require("../controllers/activityLogController");
const { auth, canAccessDashboard } = require("../middlewares/AuthZ");

const router = express.Router();

router.get("/:userId", auth, canAccessDashboard, getLogsByUserId);

module.exports = router;
