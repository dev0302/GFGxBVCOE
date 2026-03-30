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

/**
 * Transform a Cloudinary image URL for event card images.
 * Requests a ~512px wide version with automatic format & quality:
 *   /upload/w_512,f_auto,q_auto/
 *
 * Rendered CSS size is unchanged; this only affects the downloaded asset.
 */
export function cloudinaryEventCardImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary.com")) return url;
  if (url.includes("/video/upload/")) return url;

  // If a width transform is already present, leave it as-is to respect explicit URLs.
  if (url.match(/\/upload\/[^/]*w_\d+/)) return url;

  const CARD_TRANSFORM = "/upload/w_512,f_auto,q_auto/";
  return url.replace("/upload/", CARD_TRANSFORM);
}

/**
 * Transform a Cloudinary image URL specifically for standard member avatars.
 * Ensures a 64x64 cropped avatar with automatic format & quality:
 *   /upload/w_64,h_64,c_fill,f_auto,q_auto/
 *
 * Example:
 *   https://res.cloudinary.com/<cloud_name>/image/upload/v12345/profile.jpg
 *   → https://res.cloudinary.com/<cloud_name>/image/upload/w_64,h_64,c_fill,f_auto,q_auto/v12345/profile.jpg
 *
 * Non-Cloudinary URLs and Cloudinary video URLs are returned unchanged.
 */
export function cloudinaryAvatarUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary.com")) return url;
  if (url.includes("/video/upload/")) return url;

  const AVATAR_TRANSFORM = "/upload/w_64,h_64,c_fill,f_auto,q_auto/";

  // Idempotent: if the avatar transform is already present, return as-is.
  if (url.includes(AVATAR_TRANSFORM)) return url;

  // Insert the avatar transform right after `/upload/`, preserving version and path.
  return url.replace("/upload/", AVATAR_TRANSFORM);
}

/**
 * Larger avatar variant (navbar dropdown, etc.).
 * Ensures a 128x128 cropped avatar with automatic format & quality:
 *   /upload/w_128,h_128,c_fill,f_auto,q_auto/
 * Replaces any existing transformation segment before `/v{version}/`.
 */
export function cloudinaryLargeAvatarUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary.com")) return url;
  if (url.includes("/video/upload/")) return url;

  const T = "w_128,h_128,c_fill,f_auto,q_auto";
  const needle = `/upload/${T}/`;
  if (url.includes(needle)) return url;

  const versioned = url.match(/^(.+\/image\/upload\/)([\s\S]*?)(\/v\d+\/.+)$/);
  if (versioned) {
    return `${versioned[1]}${T}${versioned[3]}`;
  }
  const vOnly = url.match(/^(.+\/image\/upload\/)(v\d+\/.+)$/);
  if (vOnly) {
    return `${vOnly[1]}${T}/${vOnly[2]}`;
  }
  return url.replace("/upload/", `/upload/${T}/`);
}

/**
 * Tiny avatar variant for compact online indicators.
 * Ensures a 64x64 cropped avatar with automatic format & quality:
 *   /upload/w_64,h_64,c_fill,f_auto,q_auto/
 */
export function cloudinaryTinyAvatarUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary.com")) return url;
  if (url.includes("/video/upload/")) return url;

  const T = "w_64,h_64,c_fill,f_auto,q_auto";
  const needle = `/upload/${T}/`;
  if (url.includes(needle)) return url;

  const versioned = url.match(/^(.+\/image\/upload\/)([\s\S]*?)(\/v\d+\/.+)$/);
  if (versioned) {
    return `${versioned[1]}${T}${versioned[3]}`;
  }
  const vOnly = url.match(/^(.+\/image\/upload\/)(v\d+\/.+)$/);
  if (vOnly) {
    return `${vOnly[1]}${T}/${vOnly[2]}`;
  }
  return url.replace("/upload/", `/upload/${T}/`);
}

/**
 * Small square crop for compact pickers (e.g. upcoming-event import list).
 *   /upload/w_80,h_80,c_fill,f_auto,q_auto/
 */
export function cloudinaryPickerThumbUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary.com")) return url;
  if (url.includes("/video/upload/")) return url;

  const T = "/upload/w_80,h_80,c_fill,f_auto,q_auto/";
  if (url.match(/\/upload\/w_80,h_80,c_fill/)) return url;

  return url.replace("/upload/", T);
}

/**
 * Profile page avatar variant.
 * Ensures a 256x256 cropped avatar with automatic format & quality:
 *   /upload/w_256,h_256,c_fill,f_auto,q_auto/
 */
export function cloudinaryProfileAvatarUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary.com")) return url;
  if (url.includes("/video/upload/")) return url;

  const AVATAR_TRANSFORM = "/upload/w_256,h_256,c_fill,f_auto,q_auto/";

  if (url.includes(AVATAR_TRANSFORM)) return url;

  return url.replace("/upload/", AVATAR_TRANSFORM);
}
