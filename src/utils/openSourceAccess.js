const SOCIETY_CORE_ROLES = [
  "ADMIN",
  "Chairperson",
  "Vice-Chairperson",
  "Treasurer",
  "Faculty Incharge",
];

export function canAccessOpenSource(user) {
  if (!user) return false;
  if (SOCIETY_CORE_ROLES.includes(String(user.accountType || "").trim())) {
    return true;
  }

  const position = String(
    user.additionalDetails?.position || user.additionalDetails?.p0 || "",
  ).toLowerCase();
  return position.includes("head");
}
