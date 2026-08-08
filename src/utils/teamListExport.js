/**
 * Export team member list to PDF or Excel (official-style format).
 * Uses jspdf + jspdf-autotable for PDF, xlsx for Excel.
 */

import { jsPDF } from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import * as XLSX from "xlsx";
import { avatarPlaceholder, photoPreviewLargeAvatarUrl } from "./teamMemberUtils";

applyPlugin(jsPDF);

const ORG_NAME = "GFG BVCOE";
const IST_DATE_OPTIONS = {
  timeZone: "Asia/Kolkata",
  dateStyle: "medium",
  timeStyle: "short",
};

function formatISTDateTime(date = new Date()) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-IN", IST_DATE_OPTIONS);
}

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
  doc.text(`Generated on ${formatISTDateTime()}`, 14, 32);

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
export async function downloadAllDepartmentsPDF(departmentMembersMap, columns, labels, title, options = {}) {
  const includePhotos = options.includePhotos === true;
  const nameColIndex = columns.indexOf("name");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let startY = 18;

  doc.setFontSize(16);
  doc.text(ORG_NAME, 14, startY);
  startY += 8;
  doc.setFontSize(12);
  doc.text(title || "Society member list (all departments)", 14, startY);
  startY += 6;
  doc.setFontSize(9);
  doc.text(`Generated on ${formatISTDateTime()}`, 14, startY);
  startY += 12;

  // Preserve the caller's insertion order so society exports can place shared
  // leadership sections before the department-by-department sections.
  const deptNames = Object.keys(departmentMembersMap);
  const head = columns.map((k) => labels[k] || k);
  const uniquePeople = new Set();
  deptNames.forEach((section) => {
    (departmentMembersMap[section] || []).forEach((member) => {
      const key = String(member.email || member.name || "").trim().toLowerCase();
      if (key) uniquePeople.add(key);
    });
  });
  const totalPeople = uniquePeople.size;

  doc.setFontSize(10);
  doc.text(`Total persons in society: ${totalPeople}`, 14, startY);
  startY += 8;

  for (const dept of deptNames) {
    const members = departmentMembersMap[dept] || [];
    if (members.length === 0) continue;

    if (startY > 250) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(58, 58, 58);
    doc.text(`${dept} (${members.length})`, 14, startY);
    doc.setTextColor(0, 0, 0);
    startY += 6;

    const membersForTable =
      includePhotos && nameColIndex >= 0 ? await attachPdfPhotoData(members) : members;

    const rows = membersForTable.map((m) =>
      columns.map((k) => {
        const raw = k === "photo" ? m.photo || m.image_drive_link : m[k];
        const v = raw != null && String(raw).trim() !== "" ? String(raw).trim() : "—";
        return String(v).substring(0, 80);
      })
    );

    const columnStyles = {};
    if (includePhotos && nameColIndex >= 0) {
      columnStyles[nameColIndex] = {
        cellPadding: { top: 2, right: 2, bottom: 2, left: PDF_MEMBER_PHOTO_MM + 4 },
        minCellHeight: PDF_MEMBER_PHOTO_CELL_HEIGHT,
      };
    }

    doc.autoTable({
      head: [head],
      body: rows,
      startY,
      styles: { fontSize: 8, textColor: [22, 22, 22], lineColor: [120, 120, 120], lineWidth: 0.1 },
      headStyles: { fillColor: [58, 58, 58], textColor: [245, 245, 245] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 14, right: 14 },
      columnStyles,
      didDrawCell: (data) => {
        if (!includePhotos || nameColIndex < 0 || data.section !== "body") return;
        if (data.column.index !== nameColIndex) return;
        const member = membersForTable[data.row.index];
        const dataUrl = member?._pdfPhotoDataUrl;
        if (!dataUrl) return;
        const pad = 1.5;
        const size = PDF_MEMBER_PHOTO_MM;
        const y = data.cell.y + Math.max(pad, (data.cell.height - size) / 2);
        doc.addImage(dataUrl, "JPEG", data.cell.x + pad, y, size, size);
      },
    });
    startY = doc.lastAutoTable.finalY + 14;
  }

  doc.save(sanitizeFilename(`${title || "society-member-list"}.pdf`));
}

export function downloadAllDepartmentsExcel(departmentMembersMap, columns, labels, title) {
  const wb = XLSX.utils.book_new();
  const head = columns.map((k) => labels[k] || k);
  const deptNames = Object.keys(departmentMembersMap);
  const uniquePeople = new Set();
  deptNames.forEach((section) => {
    (departmentMembersMap[section] || []).forEach((member) => {
      const key = String(member.email || member.name || "").trim().toLowerCase();
      if (key) uniquePeople.add(key);
    });
  });
  const summaryData = [
    [title || "Society member list"],
    ["Total persons in society", uniquePeople.size],
    [],
    ["Section", "Count"],
    ...deptNames.map((section) => [section, (departmentMembersMap[section] || []).length]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary");

  deptNames.forEach((dept) => {
    const members = departmentMembersMap[dept] || [];
    const rows = members.map((m) =>
      columns.map((k) => {
        const raw = k === "photo" ? m.photo || m.image_drive_link : m[k];
        return raw != null && String(raw).trim() !== "" ? String(raw).trim() : "—";
      })
    );
    const data = [[`Section: ${dept}`, `Count: ${members.length}`], head, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const sheetName = dept.replace(/[\\/*?:\[\]]/g, "").substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  XLSX.writeFile(wb, sanitizeFilename(`${title || "society-member-list"}.xlsx`));
}

function sanitizeFilename(name) {
  return name.replace(/[\\/*?:"<>|]/g, "-").trim() || "export";
}

const PDF_MEMBER_PHOTO_MM = 10;
const PDF_MEMBER_PHOTO_CELL_HEIGHT = 12;

function memberPhotoSource(member) {
  const raw = (member?.photo || member?.image_drive_link || member?.image || "").trim();
  if (raw) return photoPreviewLargeAvatarUrl(raw);
  return avatarPlaceholder(member?.name || "Member");
}

/** Draw image as a centered circle (cover crop) on canvas. */
function drawCircularImage(ctx, img, size) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const nw = img.naturalWidth || size;
  const nh = img.naturalHeight || size;
  const scale = Math.max(size / nw, size / nh);
  const drawW = nw * scale;
  const drawH = nh * scale;
  const offsetX = (size - drawW) / 2;
  const offsetY = (size - drawH) / 2;
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  ctx.restore();
}

/** Load remote avatar as JPEG data URL for jsPDF (colour preserved via canvas). */
function imageUrlToJpegDataUrl(url, options = {}) {
  const { circular = false } = options;
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const maxSide = 256;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        if (circular) {
          canvas.width = maxSide;
          canvas.height = maxSide;
          drawCircularImage(ctx, img, maxSide);
        } else {
          const nw = img.naturalWidth || maxSide;
          const nh = img.naturalHeight || maxSide;
          const scale = Math.min(1, maxSide / Math.max(nw, nh, 1));
          canvas.width = Math.max(1, Math.round(nw * scale));
          canvas.height = Math.max(1, Math.round(nh * scale));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function attachPdfPhotoData(members) {
  return Promise.all(
    members.map(async (member) => ({
      ...member,
      _pdfPhotoDataUrl: await imageUrlToJpegDataUrl(memberPhotoSource(member), { circular: true }),
    }))
  );
}
