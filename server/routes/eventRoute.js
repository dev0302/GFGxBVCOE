const express = require("express");
const { auth } = require("../middlewares/AuthZ");
const {
  createEvent,
  getAllEvents,
  scheduleDeleteEvent,
  cancelScheduledDelete,
  updateEvent,
  createUploadLink,
  suspendUploadLink,
  validateUploadLink,
  createEventByLink,
  getEventUploadAllowed,
  addEventUploadDepartment,
  removeEventUploadDepartment,
  requireEventUploadAccess,
  requireCanManageEventUploadConfig,
  getUpcomingEvents,
  createUpcomingEvent,
  updateUpcomingEvent,
  deleteUpcomingEvent,
} = require("../controllers/eventController");

const router = express.Router();

router.get("/upcoming", getUpcomingEvents);
router.post("/", createEvent);
router.get("/", getAllEvents);
router.post("/upload-link", auth, requireEventUploadAccess, createUploadLink);
router.delete("/upload-link/:token", auth, requireEventUploadAccess, suspendUploadLink);
router.get("/upload-by-link/:token", validateUploadLink);
router.post("/upload-by-link/:token", createEventByLink);
router.delete("/:id", scheduleDeleteEvent);
router.patch("/:id/cancel-delete", cancelScheduledDelete);
router.put("/:id", updateEvent);

router.get("/upload-allowed", auth, requireEventUploadAccess, requireCanManageEventUploadConfig, getEventUploadAllowed);
router.post("/upload-allowed/add", auth, requireEventUploadAccess, requireCanManageEventUploadConfig, addEventUploadDepartment);
router.post("/upload-allowed/remove", auth, requireEventUploadAccess, requireCanManageEventUploadConfig, removeEventUploadDepartment);

router.post("/upcoming", auth, requireEventUploadAccess, createUpcomingEvent);
router.put("/upcoming/:id", auth, requireEventUploadAccess, updateUpcomingEvent);
router.delete("/upcoming/:id", auth, requireEventUploadAccess, deleteUpcomingEvent);

module.exports = router;
