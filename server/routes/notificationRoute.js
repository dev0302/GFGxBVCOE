const express = require("express");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  broadcastToUsers,
  broadcastToMembers,
  broadcastToDepartment,
  replyToNotification,
  deleteReply,
} = require("../controllers/notificationController");
const { auth, requireRegisteredUser, requireSocietyRole } = require("../middlewares/AuthZ");

const router = express.Router();

router.get("/", auth, getNotifications);
router.get("/unread-count", auth, getUnreadCount);
router.patch("/read-all", auth, markAllAsRead);
router.patch("/:id/read", auth, markAsRead);

// Reply to a specific notification (recipient replies back to sender)
router.post("/:id/reply", auth, replyToNotification);

// Delete a reply — only the sender can delete their own reply
router.delete("/replies/:replyId", auth, deleteReply);

// Society-wide broadcasts — restricted to Chairperson / Vice-Chairperson / Treasurer / ADMIN
router.post("/broadcast-users", auth, requireSocietyRole, broadcastToUsers);
router.post("/broadcast-members", auth, requireSocietyRole, broadcastToMembers);

// Department-level broadcast — heads/leads/core can send to their own dept
router.post("/broadcast-department", auth, requireRegisteredUser, broadcastToDepartment);

module.exports = router;
