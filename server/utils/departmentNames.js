/** Legacy department names mapped to their current canonical values. */
const DEPARTMENT_RENAMES = {
  Design: "Design and Creative",
  "Creative and Design": "Design and Creative",
  "Creative & Design": "Design and Creative",
  "Design & Creative": "Design and Creative",
  "Photography and Videography": "Capture The Event",
};

const LEGACY_DEPARTMENT_NAMES = Object.keys(DEPARTMENT_RENAMES);

/**
 * Normalize a department/accountType value (exact match only).
 */
function normalizeDepartmentName(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return trimmed;
  return DEPARTMENT_RENAMES[trimmed] || trimmed;
}

/**
 * Normalize free-text fields that may embed legacy department names
 * (positions, roles, labels). Safe to run repeatedly.
 */
function renameText(value) {
  let next = String(value || "");
  // Collapse duplicated segments from the former non-idempotent rename:
  // "Design and Creative and Creative Head" -> "Design and Creative Head"
  next = next.replace(/\bDesign\s+and\s+Creative\s+and\s+Creatives?\b/gi, "Design and Creative");
  next = next.replace(/\bDesign(?:\s+and\s+Creative\b)+/gi, "Design and Creative");
  next = next.replace(/\bCreative\s*(?:and|&)\s*Design\b/gi, "Design and Creative");
  next = next.replace(/\bDesign\s*&\s*Creative\b/gi, "Design and Creative");
  // Rename standalone legacy "Design" only when not already "Design and Creative"
  next = next.replace(/\bDesign\b(?!\s+and\s+Creative)/gi, "Design and Creative");
  next = next.replace(/\bPhotography and Videography\b/gi, "Capture The Event");
  next = next.replace(/\bPhotography Head\b/gi, "Capture The Event Head");
  return next;
}

function departmentsMatch(left, right) {
  return normalizeDepartmentName(left) === normalizeDepartmentName(right);
}

/** Legacy SignupConfig / collection keys that resolve to a canonical department. */
function legacyDepartmentNamesFor(canonicalDepartment) {
  return LEGACY_DEPARTMENT_NAMES.filter(
    (legacy) => DEPARTMENT_RENAMES[legacy] === normalizeDepartmentName(canonicalDepartment)
  );
}

/** Department query keys including legacy aliases (for SignupConfig lookups). */
function departmentLookupKeys(department) {
  const canonical = normalizeDepartmentName(department);
  return [...new Set([canonical, ...legacyDepartmentNamesFor(canonical)])];
}

function normalizeProfileTextFields(profile = {}) {
  if (!profile || typeof profile !== "object") return profile;
  const next = { ...profile };
  for (const field of ["position", "p0", "p1", "p2", "role", "department", "accountType"]) {
    if (typeof next[field] === "string" && next[field]) {
      next[field] = renameText(next[field]);
    }
  }
  if (typeof next.accountType === "string" && next.accountType) {
    next.accountType = normalizeDepartmentName(next.accountType);
  }
  if (typeof next.department === "string" && next.department) {
    next.department = normalizeDepartmentName(next.department);
  }
  if (Array.isArray(next.timeline)) {
    next.timeline = next.timeline.map((item) => {
      if (!item || typeof item !== "object") return item;
      const entry = { ...item };
      if (typeof entry.role === "string" && entry.role) {
        entry.role = renameText(entry.role);
      }
      if (typeof entry.description === "string" && entry.description) {
        entry.description = renameText(entry.description);
      }
      return entry;
    });
  }
  return next;
}

module.exports = {
  DEPARTMENT_RENAMES,
  normalizeDepartmentName,
  renameText,
  departmentsMatch,
  legacyDepartmentNamesFor,
  departmentLookupKeys,
  normalizeProfileTextFields,
};
