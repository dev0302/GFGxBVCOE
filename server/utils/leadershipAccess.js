const LeadershipTransitionConfig = require("../models/LeadershipTransitionConfig");
const User = require("../models/User");
const {
  SOCIETY_ROLES,
  TEAM_DEPARTMENTS,
  getDepartmentRankFromPosition,
} = require("./leadershipPositions");

function isDefaultLeadershipTransitionRole(accountType, position = "") {
  const type = String(accountType || "").trim();
  return (
    SOCIETY_ROLES.includes(type) ||
    (TEAM_DEPARTMENTS.includes(type) &&
      getDepartmentRankFromPosition(position) === "Lead")
  );
}

async function userCanAccessLeadershipTransition(
  userId,
  accountType,
  position = "",
) {
  const type = String(accountType || "").trim();
  let rolePosition = position;

  // JWTs have the account type but not the profile position that identifies
  // Department Leads, so resolve it for backend authorization checks.
  if (!rolePosition && TEAM_DEPARTMENTS.includes(type) && userId) {
    const user = await User.findById(userId)
      .populate("additionalDetails", "position p0")
      .lean();
    rolePosition =
      user?.additionalDetails?.position || user?.additionalDetails?.p0 || "";
  }

  if (isDefaultLeadershipTransitionRole(type, rolePosition)) return true;
  const config = await LeadershipTransitionConfig.findOne().lean();
  const allowed = (config?.allowedUserIds || []).map((id) => String(id));
  return allowed.includes(String(userId));
}

async function userCanReviewBlog(userId) {
  const user = await User.findById(userId)
    .populate("additionalDetails", "position p0")
    .lean();
  if (!user) return false;
  if (SOCIETY_ROLES.includes(String(user.accountType || "").trim())) {
    return true;
  }

  const position =
    user.additionalDetails?.position || user.additionalDetails?.p0 || "";
  return ["Lead", "Head"].includes(getDepartmentRankFromPosition(position));
}

module.exports = {
  isDefaultLeadershipTransitionRole,
  userCanAccessLeadershipTransition,
  userCanReviewBlog,
};
