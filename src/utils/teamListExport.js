/**
 * Export team member list to PDF or Excel (official-style format).
 * Uses jspdf + jspdf-autotable for PDF, xlsx for Excel.
 */

import { jsPDF } from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import * as XLSX from "xlsx";
import { avatarPlaceholder, photoPdfAvatarUrl } from "./teamMemberUtils";

applyPlugin(jsPDF);

const SOCIAL_COLUMNS = new Set(["github", "instagram", "linkedin"]);
const SOCIAL_SVGS = {
  github: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" fill="#24292F"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/></svg>',
  instagram: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="#E1306C"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>',
  linkedin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="#0077B5"><path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"/></svg>',
};

let cachedSocialPngs = {};

async function loadSocialIcons() {
  const platforms = ["github", "instagram", "linkedin"];
  await Promise.all(
    platforms.map((plat) => {
      if (cachedSocialPngs[plat]) return Promise.resolve();
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext("2d");
          const scale = Math.min(64 / img.width, 64 / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (64 - w) / 2;
          const y = (64 - h) / 2;
          ctx.drawImage(img, x, y, w, h);
          cachedSocialPngs[plat] = canvas.toDataURL("image/png");
          resolve();
        };
        img.onerror = resolve; 
        img.src = `data:image/svg+xml;utf8,${encodeURIComponent(SOCIAL_SVGS[plat])}`;
      });
    })
  );
}

function drawSocialIcon(doc, cell, colKey, url) {
  if (!url || !url.trim()) return;
  const size = 3.5;
  const cx = cell.x + cell.width / 2;
  const cy = cell.y + cell.height / 2;
  
  if (cachedSocialPngs[colKey]) {
    doc.addImage(cachedSocialPngs[colKey], "PNG", cx - size / 2, cy - size / 2, size, size);
  }
  
  doc.link(cx - size / 2, cy - size / 2, size, size, { url: url.trim() });
}

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
export async function downloadTeamListPDF(members, columns, labels, title, options = {}) {
  await loadSocialIcons();
  const includePhotos = options.includePhotos !== false;
  const nameColIndex = columns.indexOf("name");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const head = columns.map((k) => {
    if (k === "github") return "GH";
    if (k === "instagram") return "IG";
    if (k === "linkedin") return "LI";
    return labels[k] || k;
  });
  const membersForTable = includePhotos && nameColIndex >= 0
    ? await attachPdfPhotoData(members)
    : members;
  const rows = membersForTable.map((m) =>
    columns.map((k) => {
      if (SOCIAL_COLUMNS.has(k)) return "";
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

  const columnStyles = {};
  if (includePhotos && nameColIndex >= 0) {
    columnStyles[nameColIndex] = {
      cellPadding: { top: 1.5, right: 1.5, bottom: 1.5, left: PDF_MEMBER_PHOTO_MM + 3 },
      minCellHeight: PDF_MEMBER_PHOTO_CELL_HEIGHT,
    };
  }
  columns.forEach((k, i) => {
    if (SOCIAL_COLUMNS.has(k)) {
      columnStyles[i] = { ...(columnStyles[i] || {}), cellWidth: 7, halign: "center" };
    }
  });

  doc.autoTable({
    head: [head],
    body: rows,
    startY: 38,
    styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [22, 22, 22], lineColor: [120, 120, 120], lineWidth: 0.1 },
    headStyles: { fillColor: [58, 58, 58], textColor: [245, 245, 245] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: 14, right: 14 },
    columnStyles,
    didDrawCell: (data) => {
      if (data.section !== "body") return;
      if (includePhotos && nameColIndex >= 0 && data.column.index === nameColIndex) {
        const dataUrl = membersForTable[data.row.index]?._pdfPhotoDataUrl;
        if (dataUrl) {
          const size = PDF_MEMBER_PHOTO_MM;
          const y = data.cell.y + Math.max(1.5, (data.cell.height - size) / 2);
          doc.addImage(dataUrl, "JPEG", data.cell.x + 1.5, y, size, size);
        }
      }
      const colKey = columns[data.column.index];
      if (SOCIAL_COLUMNS.has(colKey)) {
        drawSocialIcon(doc, data.cell, colKey, membersForTable[data.row.index]?.[colKey]);
      }
    },
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
  await loadSocialIcons();
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
  const head = columns.map((k) => {
    if (k === "github") return "GH";
    if (k === "instagram") return "IG";
    if (k === "linkedin") return "LI";
    return labels[k] || k;
  });
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
        if (SOCIAL_COLUMNS.has(k)) return "";
        const raw = k === "photo" ? m.photo || m.image_drive_link : m[k];
        const v = raw != null && String(raw).trim() !== "" ? String(raw).trim() : "—";
        return String(v).substring(0, 80);
      })
    );

    const columnStyles = {};
    if (includePhotos && nameColIndex >= 0) {
      columnStyles[nameColIndex] = {
        cellPadding: { top: 1.5, right: 1.5, bottom: 1.5, left: PDF_MEMBER_PHOTO_MM + 3 },
        minCellHeight: PDF_MEMBER_PHOTO_CELL_HEIGHT,
      };
    }
    columns.forEach((k, i) => {
      if (SOCIAL_COLUMNS.has(k)) {
        columnStyles[i] = { ...(columnStyles[i] || {}), cellWidth: 7, halign: "center" };
      }
    });

    doc.autoTable({
      head: [head],
      body: rows,
      startY,
      styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [22, 22, 22], lineColor: [120, 120, 120], lineWidth: 0.1 },
      headStyles: { fillColor: [58, 58, 58], textColor: [245, 245, 245] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 14, right: 14 },
      columnStyles,
      didDrawCell: (data) => {
        if (data.section !== "body") return;
        if (includePhotos && nameColIndex >= 0 && data.column.index === nameColIndex) {
          const member = membersForTable[data.row.index];
          const dataUrl = member?._pdfPhotoDataUrl;
          if (dataUrl) {
            const pad = 1.5;
            const size = PDF_MEMBER_PHOTO_MM;
            const y = data.cell.y + Math.max(pad, (data.cell.height - size) / 2);
            doc.addImage(dataUrl, "JPEG", data.cell.x + pad, y, size, size);
          }
        }
        const colKey = columns[data.column.index];
        if (SOCIAL_COLUMNS.has(colKey)) {
          drawSocialIcon(doc, data.cell, colKey, membersForTable[data.row.index]?.[colKey]);
        }
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
    const sheetName = dept.replace(/[\\/*?:[\]]/g, "").substring(0, 31);
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
  if (raw) return photoPdfAvatarUrl(raw);
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
        const maxSide = 512;
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
