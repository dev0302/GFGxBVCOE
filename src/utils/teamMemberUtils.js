import { cloudinaryAvatarUrl, cloudinaryLargeAvatarUrl } from "./cloudinary";

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

/**
 * Preview URL for member photos/avatars:
 * - Google Drive links → thumbnail URL
 * - Cloudinary URLs → 64x64 avatar transform (/upload/w_64,h_64,c_fill,f_auto,q_auto/)
 * - Other https URLs → unchanged
 * - Plain IDs/paths → best-effort Drive thumbnail or original string
 */
export function photoPreviewUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  // Google Drive → thumbnail API
  if (/drive\.google\.com/i.test(trimmed)) {
    const driveUrl = driveLinkToImageUrl(trimmed);
    if (driveUrl && driveUrl !== trimmed) return driveUrl;
  }

  // Cloudinary → optimized 64x64 avatar transform
  if (/cloudinary\.com/i.test(trimmed)) {
    return cloudinaryAvatarUrl(trimmed);
  }

  // Other absolute URLs → as-is
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Fallback: try treating as Drive link, else original
  const driveUrl = driveLinkToImageUrl(trimmed);
  return driveUrl || trimmed;
}

/**
 * Larger avatar preview (e.g. whole-society modal):
 * - Google Drive links → thumbnail URL
 * - Cloudinary URLs → 128x128 avatar transform (/upload/w_128,h_128,c_fill,f_auto,q_auto/)
 * - Other https URLs → unchanged
 */
export function photoPreviewLargeAvatarUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  if (/drive\.google\.com/i.test(trimmed)) {
    const driveUrl = driveLinkToImageUrl(trimmed);
    if (driveUrl && driveUrl !== trimmed) return driveUrl;
  }

  if (/cloudinary\.com/i.test(trimmed)) {
    return cloudinaryLargeAvatarUrl(trimmed);
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
