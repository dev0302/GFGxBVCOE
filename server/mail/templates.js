const BASE_STYLES = {
  wrapper: "margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #020617;",
  outerTable: "background-color: #020617; padding: 40px 0;",
  card: "background-color: #0f172a; border-radius: 8px; border: 1px solid #1e293b;",
  cardCell: "padding: 40px 30px; text-align: center;",
  title: "color: #e5e7eb; margin: 0 0 20px 0; font-size: 24px;",
  body: "color: #94a3b8; margin: 0 0 30px 0; font-size: 14px; line-height: 1.6;",
  box: "background-color: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 20px; margin: 30px 0;",
  footer: "color: #64748b; margin: 20px 0 0 0; font-size: 12px;",
  link: "color: #22d3ee; text-decoration: none;",
  button: "display: inline-block; background-color: #5FB53F; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 10px 0;",
};

function wrapCard(innerHtml) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GFGxBVCOE</title>
    </head>
    <body style="${BASE_STYLES.wrapper}">
        <table width="100%" cellpadding="0" cellspacing="0" style="${BASE_STYLES.outerTable}">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="${BASE_STYLES.card}">
                        <tr>
                            <td style="${BASE_STYLES.cardCell}">
                                ${innerHtml}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
}

/**
 * Email verification / signup OTP
 * @param {string} otp - 6-digit OTP
 * @param {string} [autofillUrl] - URL to autofill OTP on signup page (opens signup and fills OTP when clicked)
 */
exports.emailVerificationTemplate = (otp, autofillUrl) => {
  const autofillBlock = autofillUrl
    ? `
    <p style="${BASE_STYLES.body} margin-bottom: 16px;">
      Click below to autofill the OTP on your open signup tab:
    </p>
    <div style="margin-bottom: 20px;">
      <a href="${autofillUrl}" style="${BASE_STYLES.button}">Autofill OTP</a>
    </div>
  `
    : "";
  const otpLabel = autofillUrl ? "Or enter the OTP manually:" : "Use the OTP below:";
  const otpBlock = `
    <p style="${BASE_STYLES.body} margin-bottom: 12px;">
      ${otpLabel}
    </p>
    <div style="${BASE_STYLES.box} margin-top: 0;">
      <p style="color: #e5e7eb; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: monospace;">
        ${otp}
      </p>
    </div>
  `;
  const inner = `
    <h1 style="${BASE_STYLES.title}">Email Verification</h1>
    <p style="${BASE_STYLES.body}">
      Thank you for signing up for GFGxBVCOE. Please verify your email address.
    </p>
    <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 24px; margin: 24px 0;">
      ${autofillBlock}
      ${otpBlock}
    </div>
    <p style="${BASE_STYLES.footer}">
      This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.
    </p>
  `;
  return wrapCard(inner);
};

/**
 * Password reset link
 */
exports.passwordResetTemplate = (resetLink) => {
  const inner = `
    <h1 style="${BASE_STYLES.title}">Reset Your Password</h1>
    <p style="${BASE_STYLES.body}">
      You requested a password reset for your GFGxBVCOE account. Click the button below to set a new password.
    </p>
    <div style="${BASE_STYLES.box}">
      <a href="${resetLink}" style="${BASE_STYLES.button}">Reset password</a>
    </div>
    <p style="${BASE_STYLES.footer}">
      This link expires in 1 hour. If you didn't request this, you can ignore this email.
    </p>
  `;
  return wrapCard(inner);
};

/**
 * Password changed confirmation
 */
exports.passwordChangedTemplate = () => {
  const inner = `
    <h1 style="${BASE_STYLES.title}">Password Changed</h1>
    <p style="${BASE_STYLES.body}">
      Your GFGxBVCOE password was changed successfully.
    </p>
    <p style="${BASE_STYLES.footer}">
      If you didn't do this, please contact us or reset your password from the login page.
    </p>
  `;
  return wrapCard(inner);
};

function roleTransitionBlock(previousRole, newRole) {
  return `
    <div style="${BASE_STYLES.box} margin: 24px 0; text-align: center;">
      <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        Role transition
      </p>
      <p style="color: #94a3b8; font-size: 14px; margin: 0 0 8px 0;">
        ${previousRole || "Member"}
      </p>
      <p style="color: #22d3ee; font-size: 18px; margin: 0; font-weight: bold;">↓</p>
      <p style="color: #e5e7eb; font-size: 18px; font-weight: bold; margin: 8px 0 0 0;">
        ${newRole}
      </p>
    </div>
  `;
}

function signupButtonBlock(signupLink, label = "Sign up now") {
  return `
    <div style="margin: 20px 0;">
      <a href="${signupLink}" style="${BASE_STYLES.button}">${label}</a>
    </div>
  `;
}

function websiteButtonBlock(websiteUrl, label = "Visit GFGxBVCOE") {
  const url = websiteUrl.replace(/\/$/, "");
  return `
    <div style="margin: 20px 0;">
      <a href="${url}" style="${BASE_STYLES.button}">${label}</a>
    </div>
  `;
}

function celebrationHeader() {
  return `
    <div style="margin-bottom: 24px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%); border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px; margin-bottom: 16px;">
        🎉
      </div>
    </div>
  `;
}

function inspirationalQuoteBlock(quote, author) {
  return `
    <div style="border-left: 3px solid #22d3ee; padding: 18px 22px; margin: 28px 0; text-align: left; background-color: rgba(30, 41, 59, 0.6); border-radius: 0 6px 6px 0;">
      <p style="color: #cbd5e1; font-size: 15px; line-height: 1.75; margin: 0 0 10px 0; font-style: italic;">
        &ldquo;${escapeHtml(quote)}&rdquo;
      </p>
      ${author
      ? `<p style="color: #64748b; font-size: 12px; margin: 0; letter-spacing: 0.3px;">&mdash; ${escapeHtml(author)}</p>`
      : ""
    }
    </div>
  `;
}

function firstNameFromName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

function quotedDetail(value) {
  if (!value || !String(value).trim()) return "";
  return `
    <span style="color: #64748b;">&ldquo;</span><span style="color: #e5e7eb; font-style: italic;">${escapeHtml(value)}</span><span style="color: #64748b;">&rdquo;</span>
  `;
}

/**
 * Promotion congratulations for existing registered users.
 * data: { name, previousRole, newRole, newDepartment, websiteUrl }
 */
exports.promotionExistingUserTemplate = (data) => {
  const {
    name,
    previousRole,
    newRole,
    newDepartment,
    websiteUrl = "https://www.gfg-bvcoe.com",
  } = data;
  const deptLine = newDepartment ? `<strong style="color: #e5e7eb;">${newDepartment}</strong>` : "";
  const inner = `
    ${celebrationHeader()}
    <h1 style="${BASE_STYLES.title}">Congratulations on your promotion!</h1>
    <p style="${BASE_STYLES.body}">
      Hello <strong style="color: #e5e7eb;">${name || "there"}</strong>,
      we're thrilled to share that you've been promoted within GFG BVCOE.
    </p>
  ${roleTransitionBlock(previousRole, newRole)}
    ${inspirationalQuoteBlock(
    "Leadership is not about being in charge. It is about taking care of those in your charge.",
    "Simon Sinek"
  )}
    <p style="${BASE_STYLES.body}">
      Your new leadership role in ${deptLine || "the society"} is now active on the platform.
      Log in anytime to collaborate with the team and access your updated permissions.
    </p>
    ${inspirationalQuoteBlock(
    "The way to get started is to quit talking and begin doing. Your chapter with GFG BVCOE just turned a page — make it count.",
    "Walt Disney"
  )}
    ${websiteButtonBlock(websiteUrl, "Open GFGxBVCOE")}
    <p style="${BASE_STYLES.footer}">
      Thank you for your dedication to GFG BVCOE. We believe in you, and we look forward to everything you'll build in this new role.
    </p>
  `;
  return wrapCard(inner);
};

/**
 * Promotion congratulations for people not yet registered — includes signup CTAs.
 * data: { name, email, previousRole, newRole, newDepartment, websiteUrl, signupLink }
 */
exports.promotionNewUserTemplate = (data) => {
  const {
    name,
    email,
    previousRole,
    newRole,
    newDepartment,
    websiteUrl = "https://www.gfg-bvcoe.com",
    signupLink,
  } = data;
  const signupUrl = signupLink || `${websiteUrl.replace(/\/$/, "")}/signup`;
  const deptLabel = newDepartment || "GFG BVCOE";
  const inner = `
    ${signupButtonBlock(signupUrl, "Sign up to get started")}
    ${celebrationHeader()}
    <h1 style="${BASE_STYLES.title}">Congratulations on your leadership role!</h1>
    <p style="${BASE_STYLES.body}">
      Hello <strong style="color: #e5e7eb;">${name || "there"}</strong>,
      you've been appointed to a leadership position in GFG BVCOE. We're excited to welcome you aboard!
    </p>
    ${roleTransitionBlock(previousRole, newRole)}
    ${inspirationalQuoteBlock(
    "Great leaders don't set out to be a leader. They set out to make a difference — and that is exactly what we see in you.",
    "GFG BVCOE"
  )}
    <div style="${BASE_STYLES.box} margin: 24px 0; text-align: left;">
      <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        Your signup details
      </p>
      <p style="color: #94a3b8; font-size: 13px; margin: 0 0 8px 0;">
        <span style="color: #64748b;">Approved email:</span><br/>
        <strong style="color: #22d3ee;">${email}</strong>
      </p>
      <p style="color: #94a3b8; font-size: 13px; margin: 12px 0 0 0;">
        <span style="color: #64748b;">Department / role:</span><br/>
        <strong style="color: #e5e7eb;">${deptLabel}</strong>
        · <strong style="color: #e5e7eb;">${newRole}</strong>
      </p>
    </div>
    <p style="${BASE_STYLES.body}">
      Please sign up using the approved email above so we can grant you access and continue working together on the platform.
    </p>
    ${inspirationalQuoteBlock(
    "The best way to find yourself is to lose yourself in the service of others. Step in — your team is waiting for you.",
    "Mahatma Gandhi"
  )}
    ${signupButtonBlock(signupUrl, "Complete your signup")}
  ${websiteButtonBlock(websiteUrl, "Visit our website")}
    <p style="${BASE_STYLES.footer}">
      Sign up with <strong style="color: #94a3b8;">${email}</strong> to unlock your leadership access.
      If you didn't expect this email, you can safely ignore it.
    </p>
  `;
  return wrapCard(inner);
};

/**
 * Signup invite for predefined profile (not yet registered).
 * pre: { name, email, image, branch, year, position }
 * signupLink: full URL to signup page
 */
exports.signupInviteTemplate = (pre, signupLink) => {
  const imageUrl =
    pre.image && pre.image.trim()
      ? pre.image.startsWith("http")
        ? pre.image
        : `https://www.gfg-bvcoe.com${pre.image.startsWith("/") ? "" : "/"}${pre.image}`
      : null;
  const details = [pre.branch, pre.year, pre.position].filter(Boolean).join(" · ") || "Member";
  const inner = `
    <h1 style="${BASE_STYLES.title}">You're invited to join GFGxBVCOE</h1>
    <p style="${BASE_STYLES.body}">
      Hello ${pre.name || "there"}, you have been invited to complete your registration and join the GFG BVCOE community.
    </p>
    ${imageUrl ? `<p style="margin: 20px 0;"><img src="${imageUrl}" alt="Profile" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #334155;" /></p>` : ""}
    <p style="color: #94a3b8; font-size: 14px; margin: 10px 0;">
      ${details}
    </p>
    <p style="${BASE_STYLES.body}">
      Click the button below to sign up with your email and create your account.
    </p>
    <div style="${BASE_STYLES.box}">
      <a href="${signupLink}" style="${BASE_STYLES.button}">Sign up now</a>
    </div>
    <p style="${BASE_STYLES.footer}">
      This invite was sent by GFGxBVCOE. If you didn't expect this email, you can ignore it.
    </p>
  `;
  return wrapCard(inner);
};

function formatTenureDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function formatActivityDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function profileImageBlock(image, name) {
  if (!image || !String(image).trim()) return "";
  const url = image.startsWith("http")
    ? image
    : `https://www.gfg-bvcoe.com${image.startsWith("/") ? "" : "/"}${image}`;
  return `
    <p style="margin: 0 0 20px 0;">
      <img src="${escapeHtml(url)}" alt="${escapeHtml(name)}" width="88" height="88"
        style="width: 88px; height: 88px; border-radius: 50%; object-fit: cover; border: 3px solid #334155;" />
    </p>
  `;
}

function profileDetailRow(label, value) {
  if (!value || !String(value).trim()) return "";
  return `
    <tr>
      <td style="padding: 8px 0; color: #64748b; font-size: 12px; width: 38%; vertical-align: top;">${escapeHtml(label)}</td>
      <td style="padding: 8px 0; color: #e5e7eb; font-size: 13px; vertical-align: top;">${quotedDetail(value)}</td>
    </tr>
  `;
}

function profileSummaryBlock(data) {
  const rows = [
    profileDetailRow("Email", data.email),
    profileDetailRow("Contact", data.contact),
    profileDetailRow("Branch", data.branch),
    profileDetailRow("Year", data.year),
    profileDetailRow("Section", data.section),
    profileDetailRow("Non-tech society", data.nonTechSociety),
    profileDetailRow("Department", data.department),
    profileDetailRow("Leadership role", data.role),
  ]
    .filter(Boolean)
    .join("");

  if (!rows) return "";

  return `
    <div style="${BASE_STYLES.box} margin: 24px 0; text-align: left; padding: 20px;">
      <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 14px 0;">
        Your profile with us
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${rows}
      </table>
    </div>
  `;
}

function leadershipRolesBlock(data) {
  const roles = [
    { label: "Primary role", value: data.p0 || data.position },
    { label: "Secondary role", value: data.p1 },
    { label: "Additional role", value: data.p2 },
  ].filter((item) => item.value && String(item.value).trim());

  if (!roles.length) return "";

  const rows = roles
    .map(
      (item) => `
      <li style="color: #e5e7eb; font-size: 13px; margin: 0 0 8px 0; line-height: 1.5;">
        <span style="color: #64748b;">${escapeHtml(item.label)}:</span> ${quotedDetail(item.value)}
      </li>
    `
    )
    .join("");

  return `
    <div style="${BASE_STYLES.box} margin: 24px 0; text-align: left;">
      <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        Roles you held
      </p>
      <ul style="margin: 0; padding-left: 18px;">${rows}</ul>
    </div>
  `;
}

function aboutBlock(about) {
  if (!about || !String(about).trim()) return "";
  return `
    <div style="${BASE_STYLES.box} margin: 24px 0; text-align: left;">
      <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        About you
      </p>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-line;">
        &ldquo;${escapeHtml(about)}&rdquo;
      </p>
    </div>
  `;
}

function socialsBlock(socials = {}) {
  const links = [
    { label: "Instagram", value: socials.instagram },
    { label: "LinkedIn", value: socials.linkedin },
    { label: "GitHub", value: socials.github },
  ].filter((item) => item.value && String(item.value).trim());

  if (!links.length) return "";

  const rows = links
    .map(
      (item) => `
      <li style="margin: 0 0 8px 0;">
        <a href="${escapeHtml(item.value)}" style="${BASE_STYLES.link}; font-size: 13px;">${escapeHtml(item.label)}</a>
      </li>
    `
    )
    .join("");

  return `
    <div style="${BASE_STYLES.box} margin: 24px 0; text-align: left;">
      <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        Connect with you
      </p>
      <ul style="margin: 0; padding-left: 18px;">${rows}</ul>
    </div>
  `;
}

function signupDepartmentsBlock(departments) {
  const items = Array.isArray(departments) ? departments.filter(Boolean) : [];
  if (!items.length) return "";

  return `
    <div style="${BASE_STYLES.box} margin: 24px 0; text-align: left;">
      <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        Departments you served
      </p>
      <p style="color: #e5e7eb; font-size: 14px; margin: 0; line-height: 1.6;">
        ${items.map((dept) => quotedDetail(dept)).join(" · ")}
      </p>
    </div>
  `;
}

function tenurePeriodBlock(startedAt, endedAt) {
  const startedLabel = formatTenureDate(startedAt);
  const endedLabel = formatTenureDate(endedAt) || formatTenureDate(new Date());
  if (!startedLabel && !endedLabel) return "";

  return `
    <div style="${BASE_STYLES.box} margin: 24px 0; text-align: center;">
      <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        Your tenure
      </p>
      <p style="color: #e5e7eb; font-size: 16px; font-weight: bold; margin: 0;">
        &ldquo;${startedLabel ? `${startedLabel} – ${endedLabel}` : `Until ${endedLabel}`}&rdquo;
      </p>
    </div>
  `;
}

function timelineBlock(timeline) {
  const items = Array.isArray(timeline) ? timeline.filter((t) => t?.role || t?.project) : [];
  if (!items.length) return "";
  const rows = items
    .slice(0, 10)
    .map(
      (t) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #334155; color: #64748b; font-size: 12px; vertical-align: top;">${quotedDetail(t.year || "—")}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #334155; color: #e5e7eb; font-size: 13px; vertical-align: top;">
          <strong>${quotedDetail(t.role || "Role")}</strong>
          ${t.project ? `<br/><span style="color: #94a3b8;">${quotedDetail(t.project)}</span>` : ""}
          ${t.description ? `<br/><span style="color: #64748b; font-size: 12px;">${quotedDetail(t.description)}</span>` : ""}
        </td>
      </tr>
    `
    )
    .join("");
  return `
    <div style="${BASE_STYLES.box} margin: 24px 0; text-align: left; padding: 0; overflow: hidden;">
      <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0; padding: 16px 16px 8px;">
        Your journey with us
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${rows}
      </table>
    </div>
  `;
}

function activityHighlightsBlock(highlights, totalCount) {
  const items = Array.isArray(highlights) ? highlights : [];
  if (!items.length && !totalCount) return "";
  const rows = items
    .map(
      (h) => `
      <li style="color: #94a3b8; font-size: 13px; margin: 0 0 10px 0; line-height: 1.5;">
        <span style="color: #e5e7eb;">${quotedDetail((h.action || "Activity").replace(/_/g, " "))}</span>
        <span style="color: #64748b;"> · ${quotedDetail(h.category || "general")}</span>
        ${h.when ? `<span style="color: #64748b;"> · ${quotedDetail(formatActivityDate(h.when))}</span>` : ""}
      </li>
    `
    )
    .join("");
  return `
    <div style="${BASE_STYLES.box} margin: 24px 0; text-align: left;">
      <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        Platform contributions
      </p>
      ${totalCount ? `<p style="color: #22d3ee; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">${totalCount} recorded activit${totalCount === 1 ? "y" : "ies"}</p>` : ""}
      ${rows ? `<ul style="margin: 0; padding-left: 18px;">${rows}</ul>` : ""}
    </div>
  `;
}

function farewellHeader() {
  return `
    <div style="margin-bottom: 24px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #f472b6 0%, #a78bfa 50%, #22d3ee 100%); border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px; margin-bottom: 16px;">
        ✨
      </div>
    </div>
  `;
}

/**
 * Tenure end / farewell email for members completing their session.
 * data: {
 *   name, email, role, department, branch, year, section, nonTechSociety, about, contact,
 *   position, p0, p1, p2, image, socials, signupDepartments, timeline, activityLogCount,
 *   activityHighlights, tenureStartedAt, tenureEndedAt, websiteUrl, registered
 * }
 */
exports.tenureEndTemplate = (data) => {
  const {
    name,
    email,
    role,
    department,
    branch,
    year,
    section,
    nonTechSociety,
    about,
    contact,
    position,
    p0,
    p1,
    p2,
    image,
    socials = {},
    signupDepartments = [],
    timeline = [],
    activityLogCount = 0,
    activityHighlights = [],
    tenureStartedAt,
    tenureEndedAt,
    websiteUrl = "https://www.gfg-bvcoe.com",
    registered = true,
  } = data;

  const profileData = {
    name,
    email,
    role,
    department,
    branch,
    year,
    section,
    nonTechSociety,
    contact,
    position,
    p0,
    p1,
    p2,
  };

  const firstName = firstNameFromName(name);

  const inner = `
    ${farewellHeader()}
    ${profileImageBlock(image, name)}
    <p style="color: #e5e7eb; font-size: 19px; font-weight: 600; margin: 0 0 20px 0; font-style: italic; line-height: 1.5;">
      Your chapter closes here, ${escapeHtml(firstName)}.
    </p>
    <h1 style="${BASE_STYLES.title}">Thank you for an unforgettable journey</h1>
    <p style="${BASE_STYLES.body}">
      Someone will eventually sit in the seat you're leaving. They'll inherit the systems you built,
      the events you ran, and the standard you quietly set &mdash; even if they never know your name.
      <strong style="color: #e5e7eb;">We do.</strong> So before your access closes, here's everything
      on file about your time with GFG BVCOE, kept for good in our alumni archive.
    </p>
    ${tenurePeriodBlock(tenureStartedAt, tenureEndedAt)}
    <div style="${BASE_STYLES.box} margin: 24px 0; text-align: center;">
      <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        Final leadership role
      </p>
      <p style="color: #e5e7eb; font-size: 20px; font-weight: bold; margin: 0 0 8px 0;">
        ${quotedDetail(role || position || "Member")}
      </p>
      ${department
      ? `<p style="color: #94a3b8; font-size: 13px; margin: 0;">${quotedDetail(department)}</p>`
      : ""
    }
    </div>
    ${profileSummaryBlock(profileData)}
    ${leadershipRolesBlock(profileData)}
    ${aboutBlock(about)}
    ${signupDepartmentsBlock(signupDepartments)}
    ${socialsBlock(socials)}
    ${timelineBlock(timeline)}
    ${activityHighlightsBlock(activityHighlights, activityLogCount)}
    <p style="${BASE_STYLES.body}">
      Your profile, timeline, and activity history have been preserved in our alumni records.
      ${registered ? "Your platform access will end within 24 hours — please save anything you need before then." : ""}
    </p>
    <p style="${BASE_STYLES.body}">
      Thank you for the energy, leadership, and care you brought to GFG BVCOE.
      We are proud of everything you built here, and we hope you'll stay connected with the community.
    </p>
    ${websiteButtonBlock(websiteUrl, "Visit GFGxBVCOE")}
    <p style="${BASE_STYLES.footer}">
      With gratitude from the entire GFG BVCOE family. Once a GFGian, always a GFGian.
    </p>
  `;
  return wrapCard(inner);
};
