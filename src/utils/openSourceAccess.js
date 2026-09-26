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
  return position.includes("head") || position.includes("lead");
}

export function hasCoreRole(user) {
  if (!user) return false;
  return SOCIETY_CORE_ROLES.includes(String(user.accountType || "").trim());
}

export function isProjectUploader(user, project) {
  if (!user || !project) return false;
  const userId = String(user._id || user.id || "");

  const createdById =
    typeof project.createdBy === "object" && project.createdBy !== null
      ? String(project.createdBy._id || project.createdBy.id || "")
      : String(project.createdBy || "");

  if (userId && createdById && userId === createdById) {
    return true;
  }

  const userEmail = String(user.email || "").trim().toLowerCase();
  const maintainerEmail = String(project.maintainerEmail || "").trim().toLowerCase();
  if (userEmail && maintainerEmail && userEmail === maintainerEmail) {
    return true;
  }

  return false;
}

export function canDeleteProject(user, project) {
  if (!user || !project) return false;
  return hasCoreRole(user) || isProjectUploader(user, project);
}
