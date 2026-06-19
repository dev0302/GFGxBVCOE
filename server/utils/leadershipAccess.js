const LeadershipTransitionConfig = require("../models/LeadershipTransitionConfig");
const { SOCIETY_ROLES } = require("./leadershipPositions");

async function userCanAccessLeadershipTransition(userId, accountType) {
  const type = String(accountType || "").trim();
  if (SOCIETY_ROLES.includes(type)) return true;
  const config = await LeadershipTransitionConfig.findOne().lean();
  const allowed = (config?.allowedUserIds || []).map((id) => String(id));
  return allowed.includes(String(userId));
}

module.exports = { userCanAccessLeadershipTransition };
