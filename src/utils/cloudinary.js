/**
 * Transform a Cloudinary image URL for optimal delivery (f_auto, q_auto).
 * - Chrome → WebP, Safari → HEIC/JPEG, Firefox → JPEG
 * Only applies to Cloudinary image URLs; video URLs and non-Cloudinary URLs are returned unchanged.
 * @param {string} url - Image or media URL
 * @returns {string} - URL with /upload/f_auto,q_auto/ for Cloudinary images, else unchanged
 */
export function cloudinaryImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary.com")) return url;
  if (url.includes("/video/upload/")) return url;
  if (url.includes("/upload/f_")) return url;
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}
