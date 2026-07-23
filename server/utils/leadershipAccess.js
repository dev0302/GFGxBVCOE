const LeadershipTransitionConfig = require("../models/LeadershipTransitionConfig");
const User = require("../models/User");
const { SOCIETY_ROLES, TEAM_DEPARTMENTS } = require("./leadershipPositions");

function isDepartmentLead(accountType, additionalDetails = {}) {
  const department = String(accountType || "").trim();
  const position = String(
    additionalDetails?.position || additionalDetails?.p0 || ""
  ).trim();
  return TEAM_DEPARTMENTS.includes(department) && /\blead\b/i.test(position);
}

async function userCanAccessLeadershipTransition(userId, accountType, additionalDetails) {
  const type = String(accountType || "").trim();
  if (SOCIETY_ROLES.includes(type)) return true;

  // API requests only carry the role in their JWT, so resolve the profile here
  // before making the shared access decision. Login and /me already provide it.
  let profile = additionalDetails;
  if (!profile && TEAM_DEPARTMENTS.includes(type) && userId) {
    const user = await User.findById(userId).populate("additionalDetails").lean();
    profile = user?.additionalDetails;
  }
  if (isDepartmentLead(type, profile)) return true;

  const config = await LeadershipTransitionConfig.findOne().lean();
  const allowed = (config?.allowedUserIds || []).map((id) => String(id));
  return allowed.includes(String(userId));
}

module.exports = { userCanAccessLeadershipTransition, isDepartmentLead };
