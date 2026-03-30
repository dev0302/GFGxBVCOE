const DashboardAccessConfig = require("../models/DashboardAccessConfig");

const SOCIETY_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson"];

// These keys should match the department/accountType values in the frontend AUTH_DEPARTMENTS list (excluding society roles).
const DASHBOARD_KEYS = [
  "Social Media and Promotion",
  "Technical",
  "Event Management",
  "Public Relation and Outreach",
  "Design",
  "Content and Documentation",
  "Photography and Videography",
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
    doc = await DashboardAccessConfig.create({ dashboardKey, extraAllowedDepartments: [] });
  }
  return doc;
}

async function getDashboardAllowedList(dashboardKey) {
  const core = computeCoreRoles(dashboardKey);
  const doc = await DashboardAccessConfig.findOne({ dashboardKey }).lean();
  const extra = (doc?.extraAllowedDepartments || []).filter(Boolean);
  return { core, extra, all: [...core, ...extra] };
}

async function requireDashboardAccess(req, res, next) {
  try {
    const { dashboardKey } = req.params;
    const accountType = String(req.user?.accountType || '').trim();
    if (!isKnownDashboardKey(dashboardKey)) {
      return res.status(404).json({ success: false, message: "Unknown dashboard." });
    }

    const { all } = await getDashboardAllowedList(dashboardKey);
    if (!all.includes(accountType)) {
      return res.status(403).json({ success: false, message: "You do not have access to this dashboard." });
    }
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Access check failed." });
  }
}

function requireCanManageDashboardConfig(req, res, next) {
  const { dashboardKey } = req.params;
  const accountType = String(req.user?.accountType || '').trim();
  const canManage = computeCoreRoles(dashboardKey).includes(accountType);
  if (!canManage) {
    return res.status(403).json({
      success: false,
      message: "Only society roles or the dashboard department can manage this list.",
    });
  }
  next();
}

async function getDashboardAllowed(req, res) {
  try {
    const { dashboardKey } = req.params;
    if (!isKnownDashboardKey(dashboardKey)) {
      return res.status(404).json({ success: false, message: "Unknown dashboard." });
    }
    const { core, extra, all } = await getDashboardAllowedList(dashboardKey);
    return res.status(200).json({ success: true, data: { core, extra, all } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch allowed departments." });
  }
}

async function addDashboardAllowedDepartment(req, res) {
  try {
    const { dashboardKey } = req.params;
    const { department } = req.body;
    const dept = (department || "").trim();

    if (!isKnownDashboardKey(dashboardKey)) {
      return res.status(404).json({ success: false, message: "Unknown dashboard." });
    }
    if (!dept) {
      return res.status(400).json({ success: false, message: "Department is required." });
    }

    const core = computeCoreRoles(dashboardKey);
    if (core.includes(dept)) {
      return res.status(400).json({ success: false, message: "This department is already in the core list." });
    }

    const doc = await getDashboardConfig(dashboardKey);
    if (doc.extraAllowedDepartments.includes(dept)) {
      return res.status(400).json({ success: false, message: "Department already allowed." });
    }

    doc.extraAllowedDepartments.push(dept);
    await doc.save();

    const allowed = await getDashboardAllowedList(dashboardKey);
    return res.status(200).json({ success: true, message: "Department added.", data: allowed });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to add department." });
  }
}

async function removeDashboardAllowedDepartment(req, res) {
  try {
    const { dashboardKey } = req.params;
    const { department } = req.body;
    const dept = (department || "").trim();

    if (!isKnownDashboardKey(dashboardKey)) {
      return res.status(404).json({ success: false, message: "Unknown dashboard." });
    }
    if (!dept) {
      return res.status(400).json({ success: false, message: "Department is required." });
    }

    const core = computeCoreRoles(dashboardKey);
    if (core.includes(dept)) {
      return res.status(400).json({ success: false, message: "Core departments cannot be removed." });
    }

    const doc = await DashboardAccessConfig.findOne({ dashboardKey });
    if (!doc) {
      return res.status(200).json({ success: true, data: { core, extra: [], all: core } });
    }

    doc.extraAllowedDepartments = (doc.extraAllowedDepartments || []).filter((d) => d !== dept);
    await doc.save();

    const allowed = await getDashboardAllowedList(dashboardKey);
    return res.status(200).json({ success: true, message: "Department removed.", data: allowed });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to remove department." });
  }
}

module.exports = {
  DASHBOARD_KEYS,
  getDashboardAllowed,
  addDashboardAllowedDepartment,
  removeDashboardAllowedDepartment,
  requireDashboardAccess,
  requireCanManageDashboardConfig,
};

