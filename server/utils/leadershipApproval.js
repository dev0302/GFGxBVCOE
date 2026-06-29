const {
  SOCIETY_ROLES,
  SOCIETY_ROLE_LABELS,
  TEAM_DEPARTMENTS,
  formatLeadershipRoleLabel,
} = require("./leadershipPositions");

function getDepartmentRank(position = "") {
  const lower = String(position || "").trim().toLowerCase();
  if (lower.includes("head")) return "Head";
  if (lower.includes("lead")) return "Lead";
  return null;
}

function resolveUserRoleLabel(user = {}) {
  const profile = user.additionalDetails || {};
  return formatLeadershipRoleLabel({
    accountType: user.accountType || "",
    department: user.accountType || "",
    position: profile.position || profile.p0 || "",
    p0: profile.p0 || "",
  });
}

function getUserApprovalInfo(user = {}) {
  const accountType = String(user.accountType || "").trim();
  const profile = user.additionalDetails || {};
  const position = profile.position || profile.p0 || "";
  const roleLabel = resolveUserRoleLabel(user);
  const department = TEAM_DEPARTMENTS.includes(accountType) ? accountType : "";

  if (SOCIETY_ROLES.includes(accountType)) {
    return {
      category: "core",
      role: SOCIETY_ROLE_LABELS[accountType] || roleLabel,
      department: "",
      canApprove: true,
    };
  }

  const rank = getDepartmentRank(position);
  if (TEAM_DEPARTMENTS.includes(accountType) && (rank === "Head" || rank === "Lead")) {
    return {
      category: "department",
      role: roleLabel,
      department,
      canApprove: true,
    };
  }

  return {
    category: null,
    role: roleLabel,
    department,
    canApprove: false,
  };
}

function checkApprovalsComplete(approvals = []) {
  const hasCore = approvals.some((a) => a.category === "core");
  const hasDepartment = approvals.some((a) => a.category === "department");
  return {
    hasCore,
    hasDepartment,
    complete: hasCore && hasDepartment,
    completedCount: (hasCore ? 1 : 0) + (hasDepartment ? 1 : 0),
    requiredCount: 2,
  };
}

function serializeApprovalStatus(approvals = []) {
  const status = checkApprovalsComplete(approvals);
  const coreApproval = approvals.find((a) => a.category === "core") || null;
  const deptApproval = approvals.find((a) => a.category === "department") || null;
  return {
    ...status,
    coreApproval,
    departmentApproval: deptApproval,
  };
}

module.exports = {
  getUserApprovalInfo,
  checkApprovalsComplete,
  serializeApprovalStatus,
  resolveUserRoleLabel,
};
