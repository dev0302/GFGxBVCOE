const express = require("express");
const { auth, optionalAuth } = require("../middlewares/AuthZ");
const Event = require("../models/Event"); 
const {
  createEvent,
  getAllEvents,
  scheduleDeleteEvent,
  cancelScheduledDelete,
  forceDeleteEvent,
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
  getForceDeleteAllowed,
  addForceDeleteDepartment,
  removeForceDeleteDepartment,
  requireCanManageForceDeleteConfig,
  requireCanForceDeleteEvent,
  getUpcomingEvents,
  createUpcomingEvent,
  updateUpcomingEvent,
  deleteUpcomingEvent,
} = require("../controllers/eventController");

const router = express.Router();

router.get("/upcoming", getUpcomingEvents);
router.post("/", optionalAuth, createEvent);
router.get("/", getAllEvents);
router.post("/upload-link", auth, requireEventUploadAccess, createUploadLink);
router.delete("/upload-link/:token", auth, requireEventUploadAccess, suspendUploadLink);
router.get("/upload-by-link/:token", validateUploadLink);
router.post("/upload-by-link/:token", createEventByLink);
router.delete("/:id/force", auth, requireEventUploadAccess, requireCanForceDeleteEvent, forceDeleteEvent);
router.delete("/:id", auth, requireEventUploadAccess, scheduleDeleteEvent);
router.patch("/:id/cancel-delete", auth, requireEventUploadAccess, cancelScheduledDelete);
router.put("/:id", auth, requireEventUploadAccess, updateEvent);

router.get("/upload-allowed", auth, requireEventUploadAccess, requireCanManageEventUploadConfig, getEventUploadAllowed);
router.get("/force-delete-allowed", auth, requireEventUploadAccess, getForceDeleteAllowed);
router.post("/force-delete-allowed/add", auth, requireEventUploadAccess, requireCanManageForceDeleteConfig, addForceDeleteDepartment);
router.post("/force-delete-allowed/remove", auth, requireEventUploadAccess, requireCanManageForceDeleteConfig, removeForceDeleteDepartment);
router.post("/upload-allowed/add", auth, requireEventUploadAccess, requireCanManageEventUploadConfig, addEventUploadDepartment);
router.post("/upload-allowed/remove", auth, requireEventUploadAccess, requireCanManageEventUploadConfig, removeEventUploadDepartment);

router.post("/upcoming", auth, requireEventUploadAccess, createUpcomingEvent);
router.put("/upcoming/:id", auth, requireEventUploadAccess, updateUpcomingEvent);
router.delete("/upcoming/:id", auth, requireEventUploadAccess, deleteUpcomingEvent);

router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching event",
    });
  }
});
module.exports = router;
