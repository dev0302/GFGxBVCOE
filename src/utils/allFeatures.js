import {
  AUTH_DEPARTMENTS,
  getAccountTypeLabel,
  isSocietyRole,
  userCanAccessLeadershipTransition,
  userCanManageEvents,
} from "../services/api";
import { canAccessOpenSource } from "./openSourceAccess";

const CORE_ROLES = "Faculty Incharge, Chairperson, Vice-Chairperson, or Treasurer";
const CORE_AND_LEADS = `${CORE_ROLES}, or a department Head / Lead`;
const EM_AND_CORE = "Event Management, or a core society role";

function leadOrHead(user) {
  const position = String(
    user?.additionalDetails?.position || user?.additionalDetails?.p0 || "",
  ).toLowerCase();
  return position.includes("lead") || position.includes("head");
}

function dashboardKeys(user) {
  return Array.isArray(user?.dashboardAccess) ? user.dashboardAccess : [];
}

function hasDashboard(user, key) {
  if (isSocietyRole(user?.accountType)) return true;
  return dashboardKeys(user).includes(key);
}

function memberSections(user, key) {
  return user?.departmentDashboardSections?.[key] || [];
}

function teamPath(user) {
  if (isSocietyRole(user?.accountType)) return "/manage-society";
  if (user?.isDepartmentMember) return "/view-team";
  return "/manage-team";
}

function teamName(user) {
  if (isSocietyRole(user?.accountType)) return "Manage society";
  if (user?.isDepartmentMember) return "View your team";
  return "Manage your team";
}

function documentVaultPath(user) {
  if (userCanManageEvents(user)) return "/em-dashboard/documents";
  const own = user?.accountType;
  if (own && hasDashboard(user, own)) {
    return `/dashboard/${encodeURIComponent(own)}/documents`;
  }
  const first = dashboardKeys(user).find((k) => k && k !== "Event Management");
  if (first) return `/dashboard/${encodeURIComponent(first)}/documents`;
  return "/em-dashboard/documents";
}

function canUseDocumentVault(user) {
  if (userCanManageEvents(user)) return true;
  if (isSocietyRole(user?.accountType)) return true;
  const access = dashboardKeys(user);
  if (!user?.isDepartmentMember && access.length) return true;
  if (user?.isDepartmentMember) {
    return access.some((key) => memberSections(user, key).includes("documents"));
  }
  return false;
}

function canUseDeptGenerateQr(user) {
  if (isSocietyRole(user?.accountType)) return true;
  const access = dashboardKeys(user);
  if (!user?.isDepartmentMember && access.length) return true;
  if (user?.isDepartmentMember) {
    return access.some((key) => memberSections(user, key).includes("generate-qr"));
  }
  return false;
}

function generateQrPath(user) {
  if (userCanManageEvents(user)) return "/em-dashboard/generate-qr";
  const own = user?.accountType;
  if (own && hasDashboard(user, own)) {
    return `/dashboard/${encodeURIComponent(own)}/generate-qr`;
  }
  const first = dashboardKeys(user).find((k) => k && k !== "Event Management");
  if (first) return `/dashboard/${encodeURIComponent(first)}/generate-qr`;
  return "/em-dashboard/generate-qr";
}

function lockedFor(roles) {
  return `Not allowed for your role. Available to ${roles}.`;
}

/**
 * Full feature catalog with per-user allow/deny. Locked items stay visible.
 */
export function buildAllFeatures(user, extras = {}) {
  const { hasVectorVisionAccess = false, tenureEnding = false } = extras;
  if (!user) return [];

  const isSociety = isSocietyRole(user.accountType);
  const canEvents = userCanManageEvents(user);
  const canOs = canAccessOpenSource(user);
  const canLeadership = userCanAccessLeadershipTransition(user);
  const canBlogReview = isSociety || leadOrHead(user);
  const settingsOk = !user.isDepartmentMember;
  const paused = tenureEnding
    ? "Your session is ending, so this feature is paused."
    : null;

  const deptDashboards = AUTH_DEPARTMENTS.filter((d) => d && !isSocietyRole(d)).map(
    (key) => {
      const allowed = !tenureEnding && hasDashboard(user, key);
      const ownLocked =
        user.isDepartmentMember &&
        key === user.accountType &&
        !dashboardKeys(user).includes(key);
      return {
        id: `dashboard-${key}`,
        name: `${getAccountTypeLabel(key) || key} Dashboard`,
        icon: "layout",
        category: "Dashboards",
        path: key === "Event Management" ? "/em-dashboard" : `/dashboard/${encodeURIComponent(key)}`,
        allowed,
        lockedReason: paused
          || (ownLocked
            ? "Coming soon — ask your Head or Lead to enable this dashboard."
            : lockedFor("core society roles, or members granted this dashboard")),
      };
    },
  );

  return [
    {
      id: "profile",
      name: "Your profile",
      icon: "user",
      category: "Account",
      path: "/profile",
      allowed: true,
    },
    {
      id: "settings",
      name: "Settings",
      icon: "settings",
      category: "Account",
      path: "/settings",
      allowed: settingsOk,
      lockedReason: "Not allowed for department members. Available to signed-in heads, leads, and core roles.",
    },
    {
      id: "wifi-event-images",
      name: "Wifi event images",
      icon: "image",
      category: "Account",
      path: "/settings?tab=wifi-event-images",
      allowed: settingsOk,
      lockedReason: "Not allowed for department members. Open Settings as a head, lead, or core role.",
    },
    {
      id: "tasks",
      name: "Task management",
      icon: "clipboard",
      category: "Account",
      path: "/tasks",
      allowed: true,
    },
    {
      id: "manage-team",
      name: teamName(user),
      icon: "users",
      category: "Team",
      path: teamPath(user),
      allowed: !tenureEnding,
      lockedReason: paused || lockedFor(CORE_ROLES),
    },
    {
      id: "signup-dashboard",
      name: "Signup dashboard",
      icon: "sliders",
      category: "Team",
      path: "/dashboard",
      allowed: isSociety && !tenureEnding,
      lockedReason: paused || lockedFor(CORE_ROLES),
    },
    {
      id: "leadership",
      name: "Leadership transition",
      icon: "trending",
      category: "Team",
      path: "/leadership-transition",
      allowed: canLeadership && !tenureEnding,
      lockedReason: paused || lockedFor(CORE_AND_LEADS),
    },
    {
      id: "em-dashboard",
      name: "EM dashboard",
      icon: "calendar",
      category: "Events",
      path: "/em-dashboard",
      allowed: canEvents && !tenureEnding,
      lockedReason: paused || lockedFor(EM_AND_CORE),
    },
    {
      id: "upload-event",
      name: "Upload event",
      icon: "upload",
      category: "Events",
      path: "/em-dashboard/upload",
      allowed: canEvents && !tenureEnding,
      lockedReason: paused || lockedFor(EM_AND_CORE),
    },
    {
      id: "upcoming-event",
      name: "Upcoming event",
      icon: "calendar",
      category: "Events",
      path: "/em-dashboard/upcoming",
      allowed: canEvents && !tenureEnding,
      lockedReason: paused || lockedFor(EM_AND_CORE),
    },
    {
      id: "manage-events",
      name: "Manage events",
      icon: "list",
      category: "Events",
      path: "/em-dashboard/manage",
      allowed: canEvents && !tenureEnding,
      lockedReason: paused || lockedFor(EM_AND_CORE),
    },
    {
      id: "document-vault",
      name: "Document vault",
      icon: "folder",
      category: "Events",
      path: documentVaultPath(user),
      allowed: canUseDocumentVault(user) && !tenureEnding,
      lockedReason:
        paused ||
        "Not allowed for your role. Ask a Head, Lead, or core member to enable Document Vault for you.",
    },
    {
      id: "generate-link",
      name: "Generate upload link",
      icon: "link",
      category: "Events",
      path: "/em-dashboard/generate-link",
      allowed: canEvents && !tenureEnding,
      lockedReason: paused || lockedFor(EM_AND_CORE),
    },
    {
      id: "generate-qr",
      name: "Generate QR",
      icon: "grid",
      category: "Events",
      path: generateQrPath(user),
      allowed: (canEvents || canUseDeptGenerateQr(user)) && !tenureEnding,
      lockedReason:
        paused ||
        "Not allowed for your role. Ask a Head, Lead, or core member to enable Generate QR.",
    },
    {
      id: "vector-vision",
      name: "Vector Vision",
      icon: "eye",
      category: "Events",
      path: "/em-dashboard/vector-vision",
      allowed: canEvents && !tenureEnding,
      lockedReason: paused || lockedFor(EM_AND_CORE),
    },
    {
      id: "face-enrollment",
      name: "Face enrollment",
      icon: "user-check",
      category: "Events",
      path: "/member-enrollment",
      allowed: canEvents && !tenureEnding,
      lockedReason: paused || lockedFor(EM_AND_CORE),
    },
    {
      id: "vectorvision-admin",
      name: "VectorVision admin",
      icon: "database",
      category: "Events",
      path: "/vectorvision-admin",
      allowed: Boolean(hasVectorVisionAccess) && !tenureEnding,
      lockedReason:
        paused || "Not allowed for your role. Requires Vector Vision admin access from a higher role.",
    },
    ...deptDashboards,
    {
      id: "blog",
      name: "Blog",
      icon: "book",
      category: "Explore",
      path: "/blog",
      allowed: true,
    },
    {
      id: "blog-create",
      name: "Write a blog",
      icon: "edit",
      category: "Explore",
      path: "/blog/create",
      allowed: Boolean(user),
    },
    {
      id: "blog-approval",
      name: "Blog approval",
      icon: "check",
      category: "Explore",
      path: "/blog/approval",
      allowed: canBlogReview,
      lockedReason: lockedFor(CORE_AND_LEADS),
    },
    {
      id: "open-source",
      name: "Open source",
      icon: "code",
      category: "Explore",
      path: "/open-source",
      allowed: true,
    },
    {
      id: "gallery",
      name: "Gallery",
      icon: "image",
      category: "Explore",
      path: "/gallery",
      allowed: true,
    },
    {
      id: "films",
      name: "Films",
      icon: "film",
      category: "Explore",
      path: "/films",
      allowed: true,
    },
    {
      id: "events",
      name: "Events",
      icon: "calendar",
      category: "Explore",
      path: "/events",
      allowed: true,
    },
    {
      id: "team-page",
      name: "Team",
      icon: "users",
      category: "Explore",
      path: "/team",
      allowed: true,
    },
    {
      id: "quiz",
      name: "Quiz",
      icon: "help",
      category: "Explore",
      path: "/quiz",
      allowed: true,
    },
    {
      id: "jam-the-web",
      name: "Jam the Web",
      icon: "globe",
      category: "Explore",
      path: "/jam-the-web",
      allowed: true,
    },
    {
      id: "contact",
      name: "Contact",
      icon: "mail",
      category: "Explore",
      path: "/contact",
      allowed: true,
    },
  ];
}

export const FEATURE_CATEGORIES = [
  "Account",
  "Team",
  "Events",
  "Dashboards",
  "Explore",
];
