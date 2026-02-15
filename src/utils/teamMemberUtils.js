/** Extract Google Drive file ID from share link. */
function getDriveFileId(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  const fileIdMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/\/open\?id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/thumbnail\?id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return fileIdMatch ? fileIdMatch[1] : null;
}

/** Convert Google Drive share link to a viewable image URL for preview (thumbnail API works in img src). */
export function driveLinkToImageUrl(url) {
  const id = getDriveFileId(url);
  if (id) {
    return `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
  }
  return url || "";
}

/** Preview URL for photo field: Drive links converted to thumbnail URL; Cloudinary/other https as-is. */
export function photoPreviewUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (/drive\.google\.com/i.test(trimmed)) {
    const driveUrl = driveLinkToImageUrl(trimmed);
    if (driveUrl && driveUrl !== trimmed) return driveUrl;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const driveUrl = driveLinkToImageUrl(trimmed);
  return driveUrl || trimmed;
}

/** Placeholder avatar URL when no photo or image fails (initials from name). */
export function avatarPlaceholder(name) {
  const n = name || "Member";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&size=80&background=374151&color=9ca3af`;
}
