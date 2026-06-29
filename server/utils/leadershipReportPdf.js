const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const REPORTS_DIR = path.join(__dirname, "..", "reports", "leadership");
const ORG_NAME = process.env.ORG_NAME || "GeeksforGeeks Student Chapter – BVCOE";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function buildReportHtml(session) {
  const promotions = (session.pendingChanges || []).filter(
    (c) => c.changeType === "promotion" || c.changeType === "role_change"
  );
  const transfers = (session.pendingChanges || []).filter(
    (c) => c.changeType === "department_transfer"
  );
  const sessionEnds = (session.pendingChanges || []).filter(
    (c) => c.changeType === "end_session"
  );
  const approvalStatus = session.approvals || [];
  const coreApprover = approvalStatus.find((a) => a.category === "core");
  const deptApprover = approvalStatus.find((a) => a.category === "department");
  const effectiveDate = session.effectiveDate || session.appliedAt || new Date();

  const promotionRows = promotions
    .map(
      (p) => `
      <tr>
        <td>${escapeHtml(p.personName)}</td>
        <td>${escapeHtml(p.previousRole)}</td>
        <td>${escapeHtml(p.newRole)}</td>
        <td>${escapeHtml(p.newDepartment || p.previousDepartment)}</td>
        <td>${formatDate(effectiveDate)}</td>
      </tr>`
    )
    .join("");

  const transferRows = transfers
    .map(
      (t) => `
      <tr>
        <td>${escapeHtml(t.personName)}</td>
        <td>${escapeHtml(t.previousDepartment)}</td>
        <td>${escapeHtml(t.newDepartment)}</td>
        <td>${escapeHtml(t.newRole || t.previousRole)}</td>
      </tr>`
    )
    .join("");

  const endRows = sessionEnds
    .map(
      (e) => `
      <tr>
        <td>${escapeHtml(e.personName)}</td>
        <td>${escapeHtml(e.previousRole)}</td>
        <td>${escapeHtml(e.previousDepartment)}</td>
        <td>${formatDate(effectiveDate)}</td>
        <td>Session ended</td>
      </tr>`
    )
    .join("");

  const collaboratorList = (session.collaborators || [])
    .map((c) => escapeHtml(c.name))
    .join(", ");

  const approvalChain = approvalStatus
    .map((a) => `${escapeHtml(a.name)} (${escapeHtml(a.role)}) – ${formatDate(a.approvedAt)}`)
    .join("<br/>");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; color: #111; margin: 0; padding: 40px; font-size: 11pt; }
    h1 { font-size: 18pt; text-align: center; margin: 0 0 4px; letter-spacing: 0.5px; }
    h2 { font-size: 13pt; text-align: center; font-weight: normal; margin: 0 0 24px; color: #333; }
    .meta { border: 1px solid #333; padding: 12px 16px; margin-bottom: 24px; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .meta-row:last-child { margin-bottom: 0; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 12pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; font-size: 10pt; }
    th { background: #f0f0f0; font-weight: bold; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #333; font-size: 9pt; color: #444; text-align: center; }
    .label { font-weight: bold; }
  </style>
</head>
<body>
  <h1>${escapeHtml(ORG_NAME)}</h1>
  <h2>Leadership Transition Report</h2>

  <div class="meta">
    <div class="meta-row"><span class="label">Document ID:</span><span>${escapeHtml(session.sessionId)}</span></div>
    <div class="meta-row"><span class="label">Generation Date:</span><span>${formatDate(session.appliedAt || new Date())}</span></div>
    <div class="meta-row"><span class="label">Effective Date:</span><span>${formatDate(effectiveDate)}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Session Information</div>
    <p><span class="label">Created By:</span> ${escapeHtml(session.createdByName)}</p>
    <p><span class="label">Collaborators:</span> ${collaboratorList || "—"}</p>
    <p><span class="label">Finalized By:</span> ${escapeHtml(session.finalizedByName || "—")}</p>
    <p><span class="label">Applied By:</span> ${escapeHtml(session.appliedByName || "—")}</p>
    <p><span class="label">Approval Chain:</span><br/>${approvalChain || "—"}</p>
    <p><span class="label">Approval Timestamp:</span> ${formatDate(session.appliedAt)}</p>
  </div>

  ${
    promotions.length
      ? `<div class="section">
    <div class="section-title">Promotions</div>
    <table>
      <thead><tr><th>Member</th><th>Old Role</th><th>New Role</th><th>Department</th><th>Effective Date</th></tr></thead>
      <tbody>${promotionRows}</tbody>
    </table>
  </div>`
      : ""
  }

  ${
    sessionEnds.length
      ? `<div class="section">
    <div class="section-title">Session Endings</div>
    <table>
      <thead><tr><th>Member</th><th>Role</th><th>Department</th><th>End Date</th><th>Reason</th></tr></thead>
      <tbody>${endRows}</tbody>
    </table>
  </div>`
      : ""
  }

  ${
    transfers.length
      ? `<div class="section">
    <div class="section-title">Department Transfers</div>
    <table>
      <thead><tr><th>Member</th><th>Previous Dept</th><th>New Dept</th><th>Role</th></tr></thead>
      <tbody>${transferRows}</tbody>
    </table>
  </div>`
      : ""
  }

  <div class="section">
    <div class="section-title">Approval Summary</div>
    <p><span class="label">Core Approver:</span> ${coreApprover ? `${escapeHtml(coreApprover.name)} (${escapeHtml(coreApprover.role)})` : "—"}</p>
    <p><span class="label">Department Approver:</span> ${deptApprover ? `${escapeHtml(deptApprover.name)} (${escapeHtml(deptApprover.role)})` : "—"}</p>
    <p><span class="label">Final Executor:</span> ${escapeHtml(session.appliedByName || "—")}</p>
  </div>

  <div class="footer">
    Generated Automatically By Leadership Transition System<br/>
    Version ${escapeHtml(session.version || "1.0.0")} · Reference: ${escapeHtml(session.documentHash || session.sessionId)}
  </div>
</body>
</html>`;
}

async function generateLeadershipReportPdf(session) {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const hash = crypto
    .createHash("sha256")
    .update(`${session.sessionId}-${Date.now()}`)
    .digest("hex")
    .slice(0, 16);

  const filename = `${session.sessionId}-${hash}.pdf`;
  const filepath = path.join(REPORTS_DIR, filename);
  const html = buildReportHtml({ ...session.toObject?.() || session, documentHash: hash });

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.pdf({
      path: filepath,
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
  } finally {
    await browser.close();
  }

  return { filepath, filename, documentHash: hash };
}

module.exports = { generateLeadershipReportPdf, REPORTS_DIR, buildReportHtml };
