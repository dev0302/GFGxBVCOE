const VectorVisionAccessConfig = require("../models/VectorVisionAccessConfig");

const CONFIG_KEY = "vectorvision-admin";

async function getAccessConfig() {
  return VectorVisionAccessConfig.findOneAndUpdate(
    { configKey: CONFIG_KEY },
    { $setOnInsert: { configKey: CONFIG_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

async function canAccessVectorVision(user) {
  const email = String(user?.email || "").trim().toLowerCase();
  if (!email) return false;

  const config = await getAccessConfig();
  return (config.allowedEmails || []).includes(email);
}

async function requireVectorVisionAccess(req, res, next) {
  try {
    if (await canAccessVectorVision(req.user)) return next();
    return res.status(403).json({
      success: false,
      message: "VectorVision administration access is not granted for this account.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not verify VectorVision access.",
    });
  }
}

module.exports = { requireVectorVisionAccess, canAccessVectorVision };
