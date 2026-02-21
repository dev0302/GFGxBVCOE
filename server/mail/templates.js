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
  button: "display: inline-block; background-color: #22d3ee; color: #0f172a; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 10px 0;",
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
