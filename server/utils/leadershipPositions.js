const TEAM_DEPARTMENTS = [
  "Social Media and Promotion",
  "Technical",
  "Event Management",
  "Public Relation and Outreach",
  "Design",
  "Content and Documentation",
  "Photography and Videography",
  "Sponsorship and Marketing",
];

const SOCIETY_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson"];

const SOCIETY_ROLE_LABELS = {
  ADMIN: "Faculty Incharge",
  Chairperson: "Chairperson",
  "Vice-Chairperson": "Vice-Chairperson",
};

function getDepartmentRankFromPosition(positionTitle) {
  const lower = String(positionTitle || "").trim().toLowerCase();
  if (!lower || lower === "member") return "Member";
  if (lower.includes("head")) return "Head";
  if (lower.includes("lead")) return "Lead";
  if (lower.includes("member")) return "Member";
  return null;
}

/**
 * Build a display label like "Technical Member" or "Chairperson".
 * Society roles (Faculty Incharge, Chairperson, Vice-Chairperson) are shown as-is.
 * Department roles always include Member, Lead, or Head.
 */
function formatLeadershipRoleLabel({
  accountType = "",
  department = "",
  position = "",
  p0 = "",
} = {}) {
  const pos = String(position || p0 || "").trim();
  const dept = String(department || accountType || "").trim();

  if (SOCIETY_ROLES.includes(dept)) {
    if (pos && SOCIETY_ROLE_LABELS[pos]) return SOCIETY_ROLE_LABELS[pos];
    if (pos && Object.values(SOCIETY_ROLE_LABELS).includes(pos)) return pos;
    return SOCIETY_ROLE_LABELS[dept] || dept;
  }

  if (pos && pos !== "Member") {
    const rank = getDepartmentRankFromPosition(pos);
    const matchedDept = TEAM_DEPARTMENTS.find((d) => pos.startsWith(d));
    if (matchedDept && rank) return `${matchedDept} ${rank}`;
    if (TEAM_DEPARTMENTS.includes(dept) && rank) return `${dept} ${rank}`;
    if (TEAM_DEPARTMENTS.some((d) => pos.startsWith(d))) return pos;
  }

  if (TEAM_DEPARTMENTS.includes(dept)) {
    const rank = getDepartmentRankFromPosition(pos) || "Member";
    return `${dept} ${rank}`;
  }

  if (pos && pos !== "Member") return pos;
  if (dept) return dept;
  return "Member";
}

function formatPreviousRoleLabel(details, oldAccountType, oldSignupDepts) {
  if (oldAccountType) {
    return formatLeadershipRoleLabel({
      accountType: oldAccountType,
      department: oldAccountType,
      position: details?.position,
      p0: details?.p0,
    });
  }

  if (oldSignupDepts?.length === 1) {
    return formatLeadershipRoleLabel({
      department: oldSignupDepts[0],
      position: details?.position,
      p0: details?.p0,
    });
  }

  if (oldSignupDepts?.length > 1) {
    return oldSignupDepts
      .map((dept) =>
        formatLeadershipRoleLabel({
          department: dept,
          position: details?.position,
          p0: details?.p0,
        })
      )
      .join(", ");
  }

  return formatLeadershipRoleLabel({
    position: details?.position,
    p0: details?.p0,
  });
}

function getAllLeadershipPositions() {
  const positions = [
    {
      id: "chairperson",
      label: "Chairperson",
      accountType: "Chairperson",
      positionTitle: "Chairperson",
    },
    {
      id: "vice-chairperson",
      label: "Vice-Chairperson",
      accountType: "Vice-Chairperson",
      positionTitle: "Vice-Chairperson",
    },
  ];

  for (const dept of TEAM_DEPARTMENTS) {
    positions.push({
      id: `${slugify(dept)}-lead`,
      label: `${dept} Lead`,
      accountType: dept,
      positionTitle: `${dept} Lead`,
    });
    positions.push({
      id: `${slugify(dept)}-head`,
      label: `${dept} Head`,
      accountType: dept,
      positionTitle: `${dept} Head`,
    });
  }

  return positions;
}

function slugify(dept) {
  return dept.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function findPositionById(positionId) {
  return getAllLeadershipPositions().find((p) => p.id === positionId) || null;
}

module.exports = {
  TEAM_DEPARTMENTS,
  SOCIETY_ROLES,
  SOCIETY_ROLE_LABELS,
  getAllLeadershipPositions,
  findPositionById,
  formatLeadershipRoleLabel,
  formatPreviousRoleLabel,
};
