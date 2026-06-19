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
  getAllLeadershipPositions,
  findPositionById,
};
