const DashboardAccessConfig = require("../models/DashboardAccessConfig");
const User = require("../models/User");
const { getDepartmentRankFromPosition } = require("../utils/leadershipPositions");

const SOCIETY_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson", "Treasurer"];

// These keys should match the department/accountType values in the frontend AUTH_DEPARTMENTS list (excluding society roles).
const DASHBOARD_KEYS = [
  "Social Media and Promotion",
  "Technical",
  "Event Management",
  "Design and Creative",
  "Content and Documentation",
  "Capture The Event",
  "Sponsorship and Marketing",
];

function computeCoreRoles(dashboardKey) {
  return [...SOCIETY_ROLES, dashboardKey];
}

function isKnownDashboardKey(dashboardKey) {
  return DASHBOARD_KEYS.includes(dashboardKey);
}

async function getDashboardConfig(dashboardKey) {
  // Create-on-read so GET always returns a consistent shape.
  let doc = await DashboardAccessConfig.findOne({ dashboardKey });
  if (!doc) {
    doc = await DashboardAccessConfig.create({
      dashboardKey,
      extraAllowedDepartments: [],
    });
  }
  return doc;
}

async function getDashboardAllowedList(dashboardKey) {
  const core = computeCoreRoles(dashboardKey);
  const doc = await DashboardAccessConfig.findOne({ dashboardKey }).lean();
  const extra = (doc?.extraAllowedDepartments || []).filter(Boolean);
  return {
    core,
    extra,
    all: [...core, ...extra],
    departmentMembersEnabled: doc?.departmentMembersEnabled === true,
  };
}

async function requireDashboardAccess(req, res, next) {
  try {
    const { dashboardKey } = req.params;
    const accountType = String(req.user?.accountType || "").trim();
    if (!isKnownDashboardKey(dashboardKey)) {
      return res
        .status(404)
        .json({ success: false, message: "Unknown dashboard." });
    }

    const { all } = await getDashboardAllowedList(dashboardKey);
    if (!all.includes(accountType)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You do not have access to this dashboard.",
        });
    }
    next();
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Access check failed." });
  }
}

async function requireCanManageDashboardConfig(req, res, next) {
  try {
    const { dashboardKey } = req.params;
    const accountType = String(req.user?.accountType || "").trim();

    if (!isKnownDashboardKey(dashboardKey)) {
      return res.status(404).json({ success: false, message: "Unknown dashboard." });
    }

    // Society roles manage every department dashboard. Department-member
    // accounts and ordinary department members cannot change access settings.
    if (SOCIETY_ROLES.includes(accountType)) return next();
    if (req.user?.isDepartmentMember || accountType !== dashboardKey) {
      return res.status(403).json({
        success: false,
        message: "Only society roles or this department's Head or Lead can manage this list.",
      });
    }

    const user = await User.findById(req.user.id)
      .populate("additionalDetails", "position p0")
      .lean();
    const position = user?.additionalDetails?.position || user?.additionalDetails?.p0 || "";
    const rank = getDepartmentRankFromPosition(position);
    if (rank !== "Head" && rank !== "Lead") {
      return res.status(403).json({
        success: false,
        message: "Only society roles or this department's Head or Lead can manage this list.",
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Access check failed.",
    });
  }
}

async function getDashboardAllowed(req, res) {
  try {
    const { dashboardKey } = req.params;
    if (!isKnownDashboardKey(dashboardKey)) {
      return res
        .status(404)
        .json({ success: false, message: "Unknown dashboard." });
    }
    const allowed = await getDashboardAllowedList(dashboardKey);
    return res.status(200).json({ success: true, data: allowed });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        message: err.message || "Failed to fetch allowed departments.",
      });
  }
}

async function updateDashboardMemberAccess(req, res) {
  try {
    const { dashboardKey } = req.params;
    const { enabled } = req.body;

    if (!isKnownDashboardKey(dashboardKey)) {
      return res
        .status(404)
        .json({ success: false, message: "Unknown dashboard." });
    }
    if (typeof enabled !== "boolean") {
      return res
        .status(400)
        .json({ success: false, message: "Enabled must be a boolean." });
    }

    const doc = await getDashboardConfig(dashboardKey);
    doc.departmentMembersEnabled = enabled;
    await doc.save();

    const allowed = await getDashboardAllowedList(dashboardKey);
    return res
      .status(200)
      .json({
        success: true,
        message: "Department member access updated.",
        data: allowed,
      });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        message: err.message || "Failed to update department member access.",
      });
  }
}

async function addDashboardAllowedDepartment(req, res) {
  try {
    const { dashboardKey } = req.params;
    const { department } = req.body;
    const dept = (department || "").trim();

    if (!isKnownDashboardKey(dashboardKey)) {
      return res
        .status(404)
        .json({ success: false, message: "Unknown dashboard." });
    }
    if (!dept) {
      return res
        .status(400)
        .json({ success: false, message: "Department is required." });
    }

    const core = computeCoreRoles(dashboardKey);
    if (core.includes(dept)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "This department is already in the core list.",
        });
    }

    const doc = await getDashboardConfig(dashboardKey);
    if (doc.extraAllowedDepartments.includes(dept)) {
      return res
        .status(400)
        .json({ success: false, message: "Department already allowed." });
    }

    doc.extraAllowedDepartments.push(dept);
    await doc.save();

    const allowed = await getDashboardAllowedList(dashboardKey);
    return res
      .status(200)
      .json({ success: true, message: "Department added.", data: allowed });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        message: err.message || "Failed to add department.",
      });
  }
}

async function removeDashboardAllowedDepartment(req, res) {
  try {
    const { dashboardKey } = req.params;
    const { department } = req.body;
    const dept = (department || "").trim();

    if (!isKnownDashboardKey(dashboardKey)) {
      return res
        .status(404)
        .json({ success: false, message: "Unknown dashboard." });
    }
    if (!dept) {
      return res
        .status(400)
        .json({ success: false, message: "Department is required." });
    }

    const core = computeCoreRoles(dashboardKey);
    if (core.includes(dept)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Core departments cannot be removed.",
        });
    }

    const doc = await DashboardAccessConfig.findOne({ dashboardKey });
    if (!doc) {
      return res
        .status(200)
        .json({ success: true, data: { core, extra: [], all: core } });
    }

    doc.extraAllowedDepartments = (doc.extraAllowedDepartments || []).filter(
      (d) => d !== dept,
    );
    await doc.save();

    const allowed = await getDashboardAllowedList(dashboardKey);
    return res
      .status(200)
      .json({ success: true, message: "Department removed.", data: allowed });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        message: err.message || "Failed to remove department.",
      });
  }
}

module.exports = {
  DASHBOARD_KEYS,
  getDashboardAllowed,
  addDashboardAllowedDepartment,
  removeDashboardAllowedDepartment,
  updateDashboardMemberAccess,
  requireDashboardAccess,
  requireCanManageDashboardConfig,
};
