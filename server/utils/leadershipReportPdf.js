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
        <td style="font-weight: 600; color: #1d1d1f;">${escapeHtml(p.personName)}</td>
        <td style="color: #515154;">${escapeHtml(p.previousRole)}</td>
        <td style="color: #1d1d1f; font-weight: 600;">${escapeHtml(p.newRole)}</td>
        <td style="color: #515154;">${escapeHtml(p.newDepartment || p.previousDepartment)}</td>
        <td style="color: #86868b;">${formatDate(effectiveDate)}</td>
      </tr>`
    )
    .join("");

  const transferRows = transfers
    .map(
      (t) => `
      <tr>
        <td style="font-weight: 600; color: #1d1d1f;">${escapeHtml(t.personName)}</td>
        <td style="color: #515154;">${escapeHtml(t.previousDepartment)}</td>
        <td style="color: #1d1d1f; font-weight: 600;">${escapeHtml(t.newDepartment)}</td>
        <td style="color: #515154;">${escapeHtml(t.newRole || t.previousRole)}</td>
      </tr>`
    )
    .join("");

  const endRows = sessionEnds
    .map(
      (e) => `
      <tr>
        <td style="font-weight: 600; color: #1d1d1f;">${escapeHtml(e.personName)}</td>
        <td style="color: #515154;">${escapeHtml(e.previousRole)}</td>
        <td style="color: #515154;">${escapeHtml(e.previousDepartment)}</td>
        <td style="color: #86868b;">${formatDate(effectiveDate)}</td>
        <td><span style="display: inline-block; background-color: #f5f5f7; border: 1px solid #d2d2d7; color: #1d1d1f; font-size: 7pt; font-weight: 600; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Terminated</span></td>
      </tr>`
    )
    .join("");

  const collaboratorList = (session.collaborators || [])
    .map((c) => escapeHtml(c.name))
    .join(", ");

  const approvalChain = approvalStatus
    .map((a) => `<div style="margin-bottom: 4px; color: #1d1d1f;"><strong style="font-weight: 600;">${escapeHtml(a.name)}</strong> <span style="color: #86868b; font-size: 8.5pt;">(${escapeHtml(a.role)})</span> <span style="font-weight: 600; font-size: 8.5pt; color: #1d1d1f;">[Approved]</span> <span style="color: #86868b; font-size: 8pt; font-style: italic;">on ${formatDate(a.approvedAt)}</span></div>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; }
    body {
      font-family: 'Figtree', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1d1d1f;
      margin: 0;
      padding: 32px 36px;
      font-size: 9.5pt;
      line-height: 1.45;
      background-color: #ffffff;
      -webkit-print-color-adjust: exact;
      border: 1px solid #1d1d1f;
      min-height: 279mm;
    }
    .header-container {
      text-align: center;
      margin-bottom: 16px;
      padding-top: 10px;
    }
    .org-name {
      font-size: 9.5pt;
      font-weight: 600;
      color: #86868b;
      margin: 0 0 4px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .doc-title {
      font-size: 18pt;
      font-weight: 700;
      color: #1d1d1f;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .meta-card {
      background: #f5f5f7;
      border: 1px solid #d2d2d7;
      padding: 8px 12px;
      border-radius: 6px;
    }
    .meta-label {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #86868b;
      margin-bottom: 2px;
      font-weight: 700;
    }
    .meta-value {
      font-size: 9.5pt;
      font-weight: 600;
      color: #1d1d1f;
    }
    .section {
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #1d1d1f;
      border-bottom: 1px solid #d2d2d7;
      padding-bottom: 4px;
      margin-bottom: 8px;
      letter-spacing: 0.2px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
      background: #ffffff;
      border: 1px solid #d2d2d7;
      padding: 10px 14px;
      border-radius: 6px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 8pt;
      font-weight: 700;
      color: #86868b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 9.5pt;
      color: #1d1d1f;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 4px;
      border: 1px solid #d2d2d7;
      border-radius: 6px;
      overflow: hidden;
    }
    th, td {
      padding: 6px 10px;
      text-align: left;
      font-size: 9pt;
      border-bottom: 1px solid #d2d2d7;
    }
    th {
      background: #f5f5f7;
      font-weight: 700;
      color: #1d1d1f;
      border-bottom: 1.5px solid #d2d2d7;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.5px;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .approval-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 4px;
    }
    .approval-card {
      border: 1px dashed #d2d2d7;
      background: #ffffff;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      min-height: 100px;
    }
    .approval-card.approved {
      border: 1.5px solid #1d1d1f;
      background: #ffffff;
    }
    .badge {
      font-size: 7.5pt;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .badge-approved {
      background-color: #1d1d1f;
      color: #ffffff;
      border: 1px solid #1d1d1f;
    }
    .badge-pending {
      background-color: transparent;
      color: #86868b;
      border: 1px solid #d2d2d7;
    }
    .approver-name {
      font-weight: 600;
      font-size: 9.5pt;
      color: #1d1d1f;
      margin-bottom: 1px;
    }
    .approver-title {
      font-size: 8pt;
      color: #86868b;
      margin-bottom: 4px;
    }
    .approver-date {
      font-size: 7.5pt;
      color: #86868b;
      font-style: italic;
      border-top: 1px solid #f5f5f7;
      padding-top: 4px;
      width: 100%;
    }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #d2d2d7;
      font-size: 8pt;
      color: #86868b;
      text-align: center;
      line-height: 1.5;
    }
    .hash-ref {
      font-family: monospace;
      font-size: 7.5pt;
      color: #1d1d1f;
      background: #f5f5f7;
      padding: 1px 4px;
      border-radius: 3px;
      display: inline-block;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="header-container">
    <h1 class="org-name">${escapeHtml(ORG_NAME)}</h1>
    <h2 class="doc-title">Leadership Transition Record</h2>
  </div>

  <div class="meta-grid">
    <div class="meta-card">
      <div class="meta-label">Document ID</div>
      <div class="meta-value" style="font-family: monospace; font-size: 8pt;">${escapeHtml(session.sessionId)}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">PDF Generation Date</div>
      <div class="meta-value">${formatDate(new Date())}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Transition Date</div>
      <div class="meta-value">${formatDate(session.appliedAt || new Date())}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Session Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Created By</div>
        <div class="info-value">${escapeHtml(session.createdByName)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Collaborators</div>
        <div class="info-value">${collaboratorList || "—"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Finalized By</div>
        <div class="info-value">${escapeHtml(session.finalizedByName || "—")}</div>
      </div>
      <div class="info-item" style="grid-column: span 2;">
        <div class="info-label">Verification Logs / Approval History</div>
        <div class="info-value" style="margin-top: 6px; border-top: 1px solid #f5f5f7; padding-top: 8px;">
          ${approvalChain || '<span style="color: #86868b; font-style: italic;">No approvals recorded</span>'}
        </div>
      </div>
    </div>
  </div>

  ${
    promotions.length
      ? `<div class="section">
    <div class="section-title">Promotions & Role Changes</div>
    <table>
      <thead>
        <tr>
          <th>Member</th>
          <th>Previous Role</th>
          <th>New Role</th>
          <th>Department</th>
          <th>Effective Date</th>
        </tr>
      </thead>
      <tbody>${promotionRows}</tbody>
    </table>
  </div>`
      : ""
  }

  ${
    transfers.length
      ? `<div class="section">
    <div class="section-title">Department Transfers</div>
    <table>
      <thead>
        <tr>
          <th>Member</th>
          <th>Previous Department</th>
          <th>New Department</th>
          <th>Assigned Role</th>
        </tr>
      </thead>
      <tbody>${transferRows}</tbody>
    </table>
  </div>`
      : ""
  }

  ${
    sessionEnds.length
      ? `<div class="section">
    <div class="section-title">Session Endings</div>
    <table>
      <thead>
        <tr>
          <th>Member</th>
          <th>Role</th>
          <th>Department</th>
          <th>End Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${endRows}</tbody>
    </table>
  </div>`
      : ""
  }

  <div class="section">
    <div class="section-title">Verification & Approvals</div>
    <div class="approval-grid">
      <div class="approval-card ${deptApprover ? 'approved' : ''}">
        <div>
          <span class="badge ${deptApprover ? 'badge-approved' : 'badge-pending'}">${deptApprover ? 'Approved' : 'Pending'}</span>
          <div class="approver-name">${deptApprover ? escapeHtml(deptApprover.name) : 'Department Authority'}</div>
          <div class="approver-title">${deptApprover ? escapeHtml(deptApprover.role) : 'Department Lead / Head Review'}</div>
        </div>
        <div class="approver-date">${deptApprover ? formatDate(deptApprover.approvedAt) : 'Signature Pending'}</div>
      </div>
      
      <div class="approval-card ${coreApprover ? 'approved' : ''}">
        <div>
          <span class="badge ${coreApprover ? 'badge-approved' : 'badge-pending'}">${coreApprover ? 'Approved' : 'Pending'}</span>
          <div class="approver-name">${coreApprover ? escapeHtml(coreApprover.name) : 'Core Authority'}</div>
          <div class="approver-title">${coreApprover ? escapeHtml(coreApprover.role) : 'Chairperson / Vice-Chairperson'}</div>
        </div>
        <div class="approver-date">${coreApprover ? formatDate(coreApprover.approvedAt) : 'Signature Pending'}</div>
      </div>

      <div class="approval-card ${session.appliedByName ? 'approved' : ''}">
        <div>
          <span class="badge ${session.appliedByName ? 'badge-approved' : 'badge-pending'}">${session.appliedByName ? 'Executed' : 'Pending'}</span>
          <div class="approver-name">${session.appliedByName ? escapeHtml(session.appliedByName) : 'System Executor'}</div>
          <div class="approver-title">Faculty Incharge / Administrator</div>
        </div>
        <div class="approver-date">${session.appliedByName && session.appliedAt ? formatDate(session.appliedAt) : 'Execution Pending'}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    GeeksforGeeks Student Chapter – BVCOE · Official Transition Document<br/>
    This record is electronically generated and digitally approved by authorized entities.<br/>
    Version ${escapeHtml(session.version || "1.0.0")} · Document Hash: <span class="hash-ref">${escapeHtml(session.documentHash || session.sessionId)}</span>
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
      margin: { top: "7mm", bottom: "7mm", left: "7mm", right: "7mm" },
    });
  } finally {
    await browser.close();
  }

  return { filepath, filename, documentHash: hash };
}

module.exports = { generateLeadershipReportPdf, REPORTS_DIR, buildReportHtml };
