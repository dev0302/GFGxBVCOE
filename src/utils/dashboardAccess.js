const SOCIETY_ROLES = [
  "ADMIN",
  "Chairperson",
  "Vice-Chairperson",
  "Treasurer",
];

/**
 * Department dashboard configuration may be changed only by society roles or
 * the Head / Lead of that dashboard's own department.
 */
export function canManageDepartmentDashboard(user, dashboardKey) {
  if (!user || user.isDepartmentMember) return false;

  const accountType = String(user.accountType || "").trim();
  if (SOCIETY_ROLES.includes(accountType)) return true;
  if (accountType !== String(dashboardKey || "").trim()) return false;

  const profile = user.additionalDetails || {};
  const position = String(profile.position || profile.p0 || "").toLowerCase();
  return position.includes("head") || position.includes("lead");
}
