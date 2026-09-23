const express = require("express");
const { auth, optionalAuth } = require("../middlewares/AuthZ");
const {
  createOSProject,
  getOSProjects,
  getOSProject,
  updateOSProject,
  deleteOSProject,
} = require("../controllers/OSprojectController");

const router = express.Router();

router.get("/", optionalAuth, getOSProjects);
router.get("/:id", optionalAuth, getOSProject);
router.post("/", auth, createOSProject);
router.patch("/:id", auth, updateOSProject);
router.delete("/:id", auth, deleteOSProject);

module.exports = router;
