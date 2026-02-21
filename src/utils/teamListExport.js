/**
 * Export team member list to PDF or Excel (official-style format).
 * Uses jspdf + jspdf-autotable for PDF, xlsx for Excel.
 */

import { jsPDF } from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import * as XLSX from "xlsx";

applyPlugin(jsPDF);

const ORG_NAME = "GFG BVCOE";

/**
 * Build rows for export from members and selected column keys.
 * @param {Array<Object>} members - list of member objects
 * @param {string[]} columns - e.g. ['name','email','contact']
 * @param {Object} labels - map of key -> display label
 */
export function buildExportRows(members, columns, labels) {
  return members.map((m) => {
    const row = {};
    columns.forEach((k) => {
      const raw = k === "photo" ? m.photo || m.image_drive_link : m[k];
      row[labels[k] || k] = raw != null && String(raw).trim() !== "" ? String(raw).trim() : "—";
    });
    return row;
  });
}

/**
 * Download PDF: title page + table with selected columns.
 */
export function downloadTeamListPDF(members, columns, labels, title) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const head = columns.map((k) => labels[k] || k);
  const rows = members.map((m) =>
    columns.map((k) => {
      const raw = k === "photo" ? m.photo || m.image_drive_link : m[k];
      const v = raw != null && String(raw).trim() !== "" ? String(raw).trim() : "—";
      return String(v).substring(0, 80);
    })
  );

  doc.setFontSize(16);
  doc.text(ORG_NAME, 14, 18);
  doc.setFontSize(12);
  doc.text(title || "Member list", 14, 26);
  doc.setFontSize(9);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 32);

  doc.autoTable({
    head: [head],
    body: rows,
    startY: 38,
    styles: { fontSize: 8, textColor: [22, 22, 22], lineColor: [120, 120, 120], lineWidth: 0.1 },
    headStyles: { fillColor: [58, 58, 58], textColor: [245, 245, 245] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: 14, right: 14 },
  });

  doc.save(sanitizeFilename(`${title || "member-list"}.pdf`));
}

/**
 * Download Excel: one sheet with header row and data.
 */
export function downloadTeamListExcel(members, columns, labels, title) {
  const head = columns.map((k) => labels[k] || k);
  const rows = members.map((m) =>
    columns.map((k) => {
      const raw = k === "photo" ? m.photo || m.image_drive_link : m[k];
      return raw != null && String(raw).trim() !== "" ? String(raw).trim() : "—";
    })
  );
  const data = [head, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const colWidths = head.map((_, i) => ({
    wch: Math.min(40, Math.max(10, ...rows.map((r) => String(r[i] || "").length))),
  }));
  ws["!cols"] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title ? title.substring(0, 31) : "Members");
  XLSX.writeFile(wb, sanitizeFilename(`${title || "member-list"}.xlsx`));
}

/**
 * Export multiple departments (for Manage Society "print whole list").
 * PDF: section per department with subheadings; Excel: one sheet per department or one sheet with department column.
 */
export function downloadAllDepartmentsPDF(departmentMembersMap, columns, labels, title) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let startY = 18;

  doc.setFontSize(16);
  doc.text(ORG_NAME, 14, startY);
  startY += 8;
  doc.setFontSize(12);
  doc.text(title || "Society member list (all departments)", 14, startY);
  startY += 6;
  doc.setFontSize(9);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, startY);
  startY += 12;

  const deptNames = Object.keys(departmentMembersMap).sort();
  const head = columns.map((k) => labels[k] || k);

  deptNames.forEach((dept) => {
    const members = departmentMembersMap[dept] || [];
    if (members.length === 0) return;

    if (startY > 250) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(58, 58, 58);
    doc.text(dept, 14, startY);
    doc.setTextColor(0, 0, 0);
    startY += 6;

    const rows = members.map((m) =>
      columns.map((k) => {
        const raw = k === "photo" ? m.photo || m.image_drive_link : m[k];
        const v = raw != null && String(raw).trim() !== "" ? String(raw).trim() : "—";
        return String(v).substring(0, 80);
      })
    );

    doc.autoTable({
      head: [head],
      body: rows,
      startY,
      styles: { fontSize: 8, textColor: [22, 22, 22], lineColor: [120, 120, 120], lineWidth: 0.1 },
      headStyles: { fillColor: [58, 58, 58], textColor: [245, 245, 245] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 14, right: 14 },
    });
    startY = doc.lastAutoTable.finalY + 14;
  });

  doc.save(sanitizeFilename(`${title || "society-member-list"}.pdf`));
}

export function downloadAllDepartmentsExcel(departmentMembersMap, columns, labels, title) {
  const wb = XLSX.utils.book_new();
  const head = columns.map((k) => labels[k] || k);
  const deptNames = Object.keys(departmentMembersMap).sort();

  deptNames.forEach((dept) => {
    const members = departmentMembersMap[dept] || [];
    const rows = members.map((m) =>
      columns.map((k) => {
        const raw = k === "photo" ? m.photo || m.image_drive_link : m[k];
        return raw != null && String(raw).trim() !== "" ? String(raw).trim() : "—";
      })
    );
    const data = [[`Department: ${dept}`], head, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const sheetName = dept.replace(/[\\/*?:\[\]]/g, "").substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  XLSX.writeFile(wb, sanitizeFilename(`${title || "society-member-list"}.xlsx`));
}

function sanitizeFilename(name) {
  return name.replace(/[\\/*?:"<>|]/g, "-").trim() || "export";
}
