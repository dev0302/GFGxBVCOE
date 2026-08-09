const express = require("express");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  broadcastToUsers,
  broadcastToMembers,
  broadcastToDepartment,
} = require("../controllers/notificationController");
const { auth, requireRegisteredUser } = require("../middlewares/AuthZ");

const router = express.Router();

router.get("/", auth, getNotifications);
router.get("/unread-count", auth, getUnreadCount);
router.patch("/read-all", auth, markAllAsRead);
router.patch("/:id/read", auth, markAsRead);

// Broadcast notifications — only society roles (auth + requireRegisteredUser)
router.post("/broadcast-users", auth, requireRegisteredUser, broadcastToUsers);
router.post("/broadcast-members", auth, requireRegisteredUser, broadcastToMembers);
router.post("/broadcast-department", auth, requireRegisteredUser, broadcastToDepartment);

module.exports = router;
