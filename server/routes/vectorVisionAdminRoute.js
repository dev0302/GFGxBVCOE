const express = require("express");
const { auth } = require("../middlewares/AuthZ");
const { requireVectorVisionAccess, canAccessVectorVision } = require("../middlewares/vectorVisionAccess");
const { getPendingMembers, triggerIngestion } = require("../controllers/vectorVisionAdminController");

const router = express.Router();

// This endpoint is only a UI hint. The protected data and action endpoints below
// always repeat the authorization check on the server.
router.get("/access", auth, async (req, res) => {
  try {
    return res.json({ success: true, allowed: await canAccessVectorVision(req.user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not verify VectorVision access." });
  }
});

router.get("/members/pending", auth, requireVectorVisionAccess, getPendingMembers);
router.post("/trigger-ingestion", auth, requireVectorVisionAccess, triggerIngestion);

module.exports = router;
