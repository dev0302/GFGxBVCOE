const express = require("express");
const { enrollMember } = require("../controllers/memberEnrollController");

const router = express.Router();

// Public member onboarding route. Server-side validation prevents malformed uploads.
router.post("/", enrollMember);

module.exports = router;
