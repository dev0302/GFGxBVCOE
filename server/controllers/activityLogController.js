const ActivityLog = require("../models/ActivityLog");

/**
 * GET /api/v1/activity-logs/:userId
 * Returns activity logs for the given user. Society roles only (Faculty Incharge, Chairperson, Vice-Chairperson).
 */
exports.getLogsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("getLogsByUserId error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch activity logs.",
    });
  }
};
