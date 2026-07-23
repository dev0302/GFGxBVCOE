const LeadershipTransitionConfig = require("../models/LeadershipTransitionConfig");
const User = require("../models/User");
const { SOCIETY_ROLES, TEAM_DEPARTMENTS } = require("./leadershipPositions");

function isDepartmentLead(user = {}) {
  user = user || {};
  const accountType = String(user.accountType || "").trim();
  const profile = user.additionalDetails || {};
  const position = String(profile.position || profile.p0 || "").trim();
  return TEAM_DEPARTMENTS.includes(accountType) && /\blead\b/i.test(position);
}

function userHasDefaultLeadershipTransitionAccess(user = {}) {
  user = user || {};
  const accountType = String(user.accountType || "").trim();
  return SOCIETY_ROLES.includes(accountType) || isDepartmentLead(user);
}

async function userCanAccessLeadershipTransition(userId, accountType) {
  const type = String(accountType || "").trim();
  if (SOCIETY_ROLES.includes(type)) return true;

  // Department Leads have default access. Resolve their profile here so every
  // API route uses the same server-authoritative rule.
  const user = await User.findById(userId).populate("additionalDetails").lean();
  if (userHasDefaultLeadershipTransitionAccess(user)) return true;

  const config = await LeadershipTransitionConfig.findOne().lean();
  const allowed = (config?.allowedUserIds || []).map((id) => String(id));
  return allowed.includes(String(userId));
}

module.exports = {
  isDepartmentLead,
  userHasDefaultLeadershipTransitionAccess,
  userCanAccessLeadershipTransition,
};
