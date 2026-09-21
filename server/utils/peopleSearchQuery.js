const TEAM_DEPARTMENTS = [
  "Social Media and Promotion",
  "Technical",
  "Event Management",
  "Design and Creative",
  "Content and Documentation",
  "Capture The Event",
  "Sponsorship and Marketing",
];

const SOCIETY_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson", "Treasurer"];

const SOCIETY_ALIASES = [
  { role: "Vice-Chairperson", terms: ["vice-chairperson", "vice chairperson", "vice chair", "vicechairperson"] },
  { role: "Chairperson", terms: ["chairperson", "chair"] },
  { role: "Treasurer", terms: ["treasurer"] },
  { role: "ADMIN", terms: ["admin", "faculty incharge", "faculty", "incharge"] },
];

const PREFIX_RE =
  /^(year|branch|section|event|gender|position|role|dept|department|social)\s*:\s*(.*)$/i;

const SOCIAL_ALIASES = [
  { platform: "github", aliases: ["github", "gh", "git"] },
  { platform: "instagram", aliases: ["instagram", "insta", "ig"] },
  { platform: "linkedin", aliases: ["linkedin", "linked", "li"] },
];

function text(value) {
  return String(value || "").trim();
}

function resolveSocialPlatform(term) {
  const needle = text(term).toLowerCase();
  if (!needle) return "";
  const exact = SOCIAL_ALIASES.find((option) => option.aliases.includes(needle) || option.platform === needle);
  if (exact) return exact.platform;
  return SOCIAL_ALIASES.find((option) => option.aliases.some((alias) => alias.startsWith(needle) && needle.length >= 3))?.platform || "";
}

function parsePeopleSearchQuery(raw) {
  const value = text(raw);
  const matched = value.match(PREFIX_RE);
  if (!matched) return { field: "auto", term: value, raw: value, socialPlatform: "" };
  const key = matched[1].toLowerCase();
  const field =
    key === "dept" || key === "department"
      ? "department"
      : key === "role"
        ? "position"
        : key;
  const term = text(matched[2]);
  return {
    field,
    term,
    raw: value,
    socialPlatform: field === "social" ? resolveSocialPlatform(term) : "",
  };
}

function matchesGender(value, term) {
  const gender = text(value).toLowerCase();
  const needle = text(term).toLowerCase();
  if (!gender || !needle) return false;
  if (needle === "m" || needle === "male") return gender === "male";
  if (needle === "f" || needle === "female") return gender === "female";
  if (needle === "other") return gender === "other";
  return gender === needle;
}

function detectRank(term) {
  const t = text(term).toLowerCase();
  if (/\blead\b/.test(t)) return "lead";
  if (/\bhead\b/.test(t)) return "head";
  if (/\bmember\b/.test(t)) return "member";
  return "";
}

function departmentMatchesTerm(department, term) {
  const dept = text(department).toLowerCase();
  const cleaned = text(term)
    .toLowerCase()
    .replace(/\b(lead|head|member|core)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!dept || !cleaned) return false;
  if (dept === cleaned || dept.startsWith(cleaned)) return true;
  const tokens = cleaned.split(" ").filter((token) => token.length >= 3);
  if (!tokens.length) return false;
  return tokens.every((token) => dept.includes(token));
}

function detectDepartment(term) {
  const cleaned = text(term)
    .toLowerCase()
    .replace(/\b(lead|head|member|core)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  const ranked = [...TEAM_DEPARTMENTS].sort((a, b) => b.length - a.length);
  return ranked.find((dept) => departmentMatchesTerm(dept, cleaned)) || "";
}

function detectSocietyRole(term) {
  const t = text(term).toLowerCase();
  if (!t) return "";
  for (const entry of SOCIETY_ALIASES) {
    if (entry.terms.some((alias) => t === alias || t.includes(alias))) return entry.role;
  }
  return "";
}

function detectRoleQuery(term) {
  return {
    department: detectDepartment(term),
    rank: detectRank(term),
    societyRole: detectSocietyRole(term),
  };
}

function roleHaystack(record, department) {
  const profile = record.additionalDetails || record.profile || {};
  return [
    profile.position,
    profile.role,
    profile.p0,
    profile.p1,
    profile.p2,
    record.position,
    record.role,
    department,
    record.department,
    record.accountType,
  ]
    .map((value) => text(value))
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesRank(haystack, rank) {
  if (!rank) return true;
  if (rank === "lead") return /\blead\b/.test(haystack);
  if (rank === "head") return /\bhead\b/.test(haystack);
  if (rank === "member") return !/\b(lead|head)\b/.test(haystack);
  return true;
}

function matchesPositionOrDepartment(record, term, department) {
  const intent = detectRoleQuery(term);
  const dept = department || record.department || record.accountType || "";
  const haystack = roleHaystack(record, dept);

  if (intent.societyRole) {
    const account = text(record.accountType);
    const hay = haystack;
    if (intent.societyRole === "ADMIN") {
      return account === "ADMIN" || /\bfaculty\b/.test(hay) || /\bincharge\b/.test(hay);
    }
    return account === intent.societyRole || hay.includes(intent.societyRole.toLowerCase());
  }

  if (intent.department) {
    const inDept = departmentMatchesTerm(dept, intent.department) || haystack.includes(intent.department.toLowerCase());
    if (!inDept) return false;
    return matchesRank(haystack, intent.rank);
  }

  if (intent.rank) return matchesRank(haystack, intent.rank);

  const needle = text(term).toLowerCase();
  return Boolean(needle) && haystack.includes(needle);
}

function isBroadPeopleQuery(parsed) {
  if (parsed?.field === "social") return Boolean(resolveSocialPlatform(parsed.term));
  if (!parsed?.term) return false;
  if (["gender", "department", "position"].includes(parsed.field)) return true;
  if (parsed.field !== "auto") return false;
  const intent = detectRoleQuery(parsed.term);
  return Boolean(intent.department || intent.rank || intent.societyRole);
}

function personRecordMatches(record, parsed, department) {
  const field = parsed?.field || "auto";
  const term = text(parsed?.term);
  if (field === "event") return false;
  if (field === "social") return Boolean(resolveSocialPlatform(term));
  if (!term) return field === "auto";

  const profile = record.additionalDetails || record.profile || {};
  const dept = department || record.department || record.accountType || "";
  const name = text(record.name || `${record.firstName || ""} ${record.lastName || ""}`);
  const lower = term.toLowerCase();

  if (field === "gender") {
    return matchesGender(profile.gender || record.gender, term);
  }
  if (field === "year") {
    return `${record.year || ""} ${profile.year || ""} ${profile.yearOfStudy || ""}`.toLowerCase().includes(lower);
  }
  if (field === "branch") {
    return `${record.branch || ""} ${profile.branch || ""}`.toLowerCase().includes(lower);
  }
  if (field === "section") {
    return `${record.section || ""} ${profile.section || ""}`.toLowerCase().includes(lower);
  }
  if (field === "department") {
    return departmentMatchesTerm(dept, term) || matchesPositionOrDepartment(record, term, dept);
  }
  if (field === "position") {
    return matchesPositionOrDepartment(record, term, dept);
  }

  const basic = [
    name,
    record.email,
    record.branch,
    profile.branch,
    record.year,
    profile.year,
    profile.yearOfStudy,
    record.section,
    profile.section,
    record.contact,
    record.non_tech_society,
    dept,
  ]
    .map((value) => text(value).toLowerCase())
    .join(" ");
  if (basic.includes(lower) || (record.contact && String(record.contact).includes(term))) return true;
  return matchesPositionOrDepartment(record, term, dept);
}

module.exports = {
  TEAM_DEPARTMENTS,
  SOCIETY_ROLES,
  parsePeopleSearchQuery,
  resolveSocialPlatform,
  matchesGender,
  detectRoleQuery,
  departmentMatchesTerm,
  personRecordMatches,
  isBroadPeopleQuery,
};
