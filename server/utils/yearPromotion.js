const YEAR_PROMOTION_MAP = {
  "1st": "2nd",
  "2nd": "3rd",
  "3rd": "4th",
  "4th": "4+",
  "4+": "4+",
};

function normalizeYear(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "1" || raw === "first" || raw.startsWith("1st")) return "1st";
  if (raw === "2" || raw === "second" || raw.startsWith("2nd")) return "2nd";
  if (raw === "3" || raw === "third" || raw.startsWith("3rd")) return "3rd";
  if (raw === "4" || raw === "fourth" || raw.startsWith("4th")) return "4th";
  if (raw === "4+" || raw === "4 plus" || raw.includes("4+")) return "4+";
  return "";
}

function promoteYear(value) {
  const normalized = normalizeYear(value);
  if (!normalized) return null;
  return YEAR_PROMOTION_MAP[normalized] ?? null;
}

function getProfileYear(profile) {
  if (!profile) return "";
  return profile.year || profile.yearOfStudy || "";
}

module.exports = {
  YEAR_PROMOTION_MAP,
  normalizeYear,
  promoteYear,
  getProfileYear,
};
