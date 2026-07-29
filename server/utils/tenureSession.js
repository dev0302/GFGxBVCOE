const User = require("../models/User");
const Profile = require("../models/Profile");

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

function getSessionExpiresAt(fromDate = new Date()) {
  return new Date(fromDate.getTime() + GRACE_PERIOD_MS);
}

async function deleteUserAndProfile(userDoc) {
  if (!userDoc) return;
  const profileId = userDoc.additionalDetails;
  await User.findByIdAndDelete(userDoc._id);
  if (profileId) {
    await Profile.findByIdAndDelete(profileId);
  }
}

/**
 * Remove all accounts whose leadership-tenure grace period has elapsed.
 * This is intentionally callable by a server-side scheduler so cleanup does
 * not depend on the former member returning to the site.
 */
async function cleanupExpiredTenureUsers(now = new Date()) {
  const expiredUsers = await User.find({
    sessionExpiresAt: { $ne: null, $lte: now },
  }).select("additionalDetails");

  for (const user of expiredUsers) {
    await deleteUserAndProfile(user);
  }

  return expiredUsers.length;
}

/**
 * If the user's 24h grace period has passed, delete account and return expired=true.
 */
async function checkAndFinalizeExpiredSession(userId) {
  const userDoc = await User.findById(userId).select("sessionExpiresAt tenureEndedAt additionalDetails");
  if (!userDoc) {
    return { expired: true, user: null };
  }

  if (userDoc.sessionExpiresAt && new Date() >= new Date(userDoc.sessionExpiresAt)) {
    await deleteUserAndProfile(userDoc);
    return { expired: true, user: null };
  }

  return {
    expired: false,
    user: userDoc,
    tenureEndedAt: userDoc.tenureEndedAt || null,
    sessionExpiresAt: userDoc.sessionExpiresAt || null,
  };
}

module.exports = {
  GRACE_PERIOD_MS,
  getSessionExpiresAt,
  deleteUserAndProfile,
  cleanupExpiredTenureUsers,
  checkAndFinalizeExpiredSession,
};
