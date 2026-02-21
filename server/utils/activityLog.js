const ActivityLog = require("../models/ActivityLog");

/**
 * Record an activity for a user. Call this from controllers after successful actions.
 * @param {string} userId - Mongoose ObjectId string of the user who performed the action
 * @param {string} action - Short action key, e.g. 'invite_link_create', 'event_force_delete'
 * @param {string} category - Category, e.g. 'invite_link', 'event', 'team', 'permission', 'signup_config'
 * @param {object} details - Optional extra data (e.g. department, title, targetId)
 * @param {string} targetId - Optional ID of affected resource
 * @param {string} targetType - Optional type, e.g. 'Event', 'TeamMember'
 */
async function logActivity(userId, action, category, details = {}, targetId = "", targetType = "") {
  if (!userId) return;
  try {
    await ActivityLog.create({
      userId,
      action,
      category,
      details: typeof details === "object" ? details : { value: details },
      targetId: targetId || "",
      targetType: targetType || "",
    });
  } catch (err) {
    console.error("logActivity error:", err);
  }
}

module.exports = { logActivity };
