const TEAM_DEPARTMENTS = [
  "Social Media and Promotion",
  "Technical",
  "Event Management",
  "Design and Creative",
  "Content and Documentation",
  "Capture The Event",
  "Sponsorship and Marketing",
];

const SOCIETY_LABELS = ["Chairperson", "Vice-Chairperson", "Treasurer", "Faculty Incharge"];
const RANKS = ["Lead", "Head", "Member"];

export const SEARCH_SUGGESTIONS = [
  ...TEAM_DEPARTMENTS,
  ...TEAM_DEPARTMENTS.flatMap((dept) => RANKS.map((rank) => `${dept} ${rank}`)),
  ...SOCIETY_LABELS,
  ...RANKS,
];

const SOCIETY_ALIASES = [
  { role: "Vice-Chairperson", terms: ["vice-chairperson", "vice chairperson", "vice chair", "vicechairperson"] },
  { role: "Chairperson", terms: ["chairperson", "chair"] },
  { role: "Treasurer", terms: ["treasurer"] },
  { role: "ADMIN", terms: ["admin", "faculty incharge", "faculty", "incharge"] },
];

const PREFIX_RE =
  /^(year|branch|section|event|gender|position|role|dept|department|social)\s*:\s*(.*)$/i;

export const SOCIAL_SEARCH_OPTIONS = [
  { platform: "github", aliases: ["github", "gh", "git"], label: "GitHub", query: "social:github" },
  { platform: "instagram", aliases: ["instagram", "insta", "ig"], label: "Instagram", query: "social:insta" },
  { platform: "linkedin", aliases: ["linkedin", "linked", "li"], label: "LinkedIn", query: "social:linkedin" },
];

const text = (value) => String(value || "").trim();

export function resolveSocialPlatform(term) {
  const needle = text(term).toLowerCase();
  if (!needle) return "";
  const exact = SOCIAL_SEARCH_OPTIONS.find((option) => option.aliases.includes(needle) || option.platform === needle);
  if (exact) return exact.platform;
  return SOCIAL_SEARCH_OPTIONS.find((option) => option.aliases.some((alias) => alias.startsWith(needle) && needle.length >= 3))?.platform || "";
}

export function socialPlatformLabel(platform) {
  return SOCIAL_SEARCH_OPTIONS.find((option) => option.platform === platform)?.label || platform || "Social";
}

export function personSocialValue(record, platform) {
  if (!record || !platform) return "";
  const profile = record.additionalDetails || record.profile || {};
  const socials = record.socials || profile.socials || {};
  let value = socials[platform] || "";
  if (!value && platform === "instagram") {
    value = record.instaLink || profile.instaLink || "";
  }
  if (!value && platform === "linkedin") {
    value = record.linkedinLink || profile.linkedinLink || "";
  }
  const cleaned = text(value);
  if (!cleaned) return "";
  const lower = cleaned.toLowerCase();
  if (["nil", "n/a", "na", "none", "-", "null"].includes(lower)) return "";
  return cleaned;
}

export function personHasSocial(record, platform) {
  return Boolean(personSocialValue(record, platform));
}

export function parsePeopleSearchQuery(raw) {
  const value = text(raw);
  const matched = value.match(PREFIX_RE);
  if (!matched) return { field: "auto", term: value, raw: value, socialPlatform: "" };
  const key = matched[1].toLowerCase();
  const field =
    key === "dept" || key === "department" ? "department" : key === "role" ? "position" : key;
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
  return [...TEAM_DEPARTMENTS]
    .sort((a, b) => b.length - a.length)
    .find((dept) => departmentMatchesTerm(dept, cleaned)) || "";
}

function detectSocietyRole(term) {
  const t = text(term).toLowerCase();
  if (!t) return "";
  for (const entry of SOCIETY_ALIASES) {
    if (entry.terms.some((alias) => t === alias || t.includes(alias))) return entry.role;
  }
  return "";
}

export function detectRoleQuery(term) {
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
    if (intent.societyRole === "ADMIN") {
      return account === "ADMIN" || /\bfaculty\b/.test(haystack) || /\bincharge\b/.test(haystack);
    }
    return account === intent.societyRole || haystack.includes(intent.societyRole.toLowerCase());
  }

  if (intent.department) {
    const inDept =
      departmentMatchesTerm(dept, intent.department) || haystack.includes(intent.department.toLowerCase());
    if (!inDept) return false;
    return matchesRank(haystack, intent.rank);
  }

  if (intent.rank) return matchesRank(haystack, intent.rank);
  const needle = text(term).toLowerCase();
  return Boolean(needle) && haystack.includes(needle);
}

export function personRecordMatches(record, parsed, department) {
  const field = parsed?.field || "auto";
  const term = text(parsed?.term);
  if (field === "event") return false;
  if (field === "social") return Boolean(resolveSocialPlatform(term));
  if (!term) return field === "auto";

  const profile = record.additionalDetails || record.profile || {};
  const dept = department || record.department || record.accountType || "";
  const name = text(record.name || `${record.firstName || ""} ${record.lastName || ""}`);
  const lower = term.toLowerCase();

  if (field === "gender") return matchesGender(profile.gender || record.gender, term);
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
  if (field === "position") return matchesPositionOrDepartment(record, term, dept);

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

function suggestionScore(label, term) {
  const l = label.toLowerCase();
  const t = text(term).toLowerCase();
  if (!t || l === t) return 0;
  if (l.startsWith(t)) return 400 - Math.min(l.length, 80);
  const tokens = t.split(/\s+/).filter(Boolean);
  if (tokens.length && tokens.every((token) => l.includes(token))) return 200 - Math.min(l.length, 80);
  if (l.includes(t)) return 80;
  return 0;
}

function rankBias(label, term) {
  const t = text(term).toLowerCase();
  const wantsLead = /\blea/.test(t);
  const wantsHead = /\bhea/.test(t);
  const wantsMember = /\bmem/.test(t);
  const isLead = / lead$/i.test(label);
  const isHead = / head$/i.test(label);
  const isMember = / member$/i.test(label);
  if (wantsLead) return isLead ? 60 : -20;
  if (wantsHead) return isHead ? 60 : -20;
  if (wantsMember) return isMember ? 60 : -20;
  if (isLead || isHead || isMember) return -15;
  return 10;
}

export function getSearchCompletions(raw, limit = 6) {
  const value = String(raw || "");
  const parsed = parsePeopleSearchQuery(value);
  if (["year", "branch", "section", "event"].includes(parsed.field)) return [];

  if (parsed.field === "social" || /^social\b/i.test(value.trim())) {
    return SOCIAL_SEARCH_OPTIONS
      .filter((option) => {
        if (option.query.toLowerCase() === value.trim().toLowerCase()) return false;
        if (!parsed.term) return true;
        return option.aliases.some((alias) => alias.startsWith(parsed.term.toLowerCase())) || option.platform.startsWith(parsed.term.toLowerCase());
      })
      .slice(0, limit)
      .map((option) => ({
        label: option.query,
        value: option.query,
      }));
  }

  const prefixMatch = value.match(/^(role|position|dept|department|gender)\s*:\s*/i);
  const prefixText = prefixMatch ? prefixMatch[0] : "";

  if (parsed.field === "gender") {
    return ["male", "female", "other"]
      .filter((option) => !parsed.term || option.startsWith(parsed.term.toLowerCase()))
      .filter((option) => option !== parsed.term.toLowerCase())
      .slice(0, limit)
      .map((option) => ({
        label: option,
        value: `${prefixText || "gender:"}${option}`,
      }));
  }

  const term = parsed.term;
  if (term.length < 2) return [];
  if (SEARCH_SUGGESTIONS.some((label) => label.toLowerCase() === term.toLowerCase())) return [];

  return SEARCH_SUGGESTIONS
    .map((label) => ({
      label,
      score: suggestionScore(label, term) + rankBias(label, term),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.label.length - b.label.length)
    .slice(0, limit)
    .map((item) => ({
      label: item.label,
      value: `${prefixText}${item.label}`,
    }));
}

export function completionGhost(query, suggestion) {
  const typed = String(query || "");
  const complete = String(suggestion?.value || "");
  if (!typed || !complete) return "";
  if (!complete.toLowerCase().startsWith(typed.toLowerCase())) return "";
  return complete.slice(typed.length);
}
