const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const cloudinaryConnect = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });
    console.log("Cloudinary Connected Successfully");
  } catch (error) {
    console.log("Error while connecting to cloudinary");
    console.log(error);
  }
};

// check extension
function isFileTypeSupported(supportedTypes, fileType) {
  return supportedTypes.includes(fileType);
}

// Upload file to Cloudinary (quality 1–100; applied to image and video for compression)
async function uploadFileToCloudinary(
  file,
  folder,
  quality,
  publicId = null,
  extraOptions = {},
) {
  const options = {
    folder,
    public_id: publicId ?? file.name.split(".")[0],
    resource_type: "auto",
  };
  if (quality != null && quality !== "" && typeof quality === "number") {
    options.quality = quality;
  }
  return await cloudinary.uploader.upload(file.tempFilePath, {
    ...options,
    ...extraOptions,
  });
}

exports.cloudinaryConnect = cloudinaryConnect;
exports.cloudinary = cloudinary;

exports.imageUpload = async (
  file,
  folder,
  quality,
  publicId = null,
  extraOptions = {},
) => {
  try {
    if (!file) throw new Error("No file provided for upload.");
    if (!file.name || !file.name.includes("."))
      throw new Error("Invalid file name. File must have an extension.");

    const supportedTypes = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "webp",
      "svg",
      "tiff",
      "tif",
      "heic",
      "heif",
      "avif",
      "raw",
      "ico",
    ];
    const fileType = file.name.split(".").pop().toLowerCase();
    if (!isFileTypeSupported(supportedTypes, fileType)) {
      throw new Error(
        `.${fileType} files are not supported. Allowed: ${supportedTypes.join(", ")}`,
      );
    }

    const response = await uploadFileToCloudinary(
      file,
      folder,
      quality,
      publicId,
      extraOptions,
    );
    return response;
  } catch (error) {
    throw new Error(error.message || "Failed to upload image to Cloudinary.");
  }
};

exports.uploadImageFromUrl = async (imageUrl, folder = "gfg-avatars") => {
  try {
    if (!imageUrl || typeof imageUrl !== "string")
      throw new Error("Invalid image URL.");
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder,
      resource_type: "image",
    });
    return result;
  } catch (error) {
    throw new Error(error.message || "Failed to upload image from URL.");
  }
};

exports.videoUpload = async (file, folder, quality) => {
  try {
    if (!file) throw new Error("No file provided for upload.");
    if (!file.name || !file.name.includes("."))
      throw new Error("Invalid file name. File must have an extension.");

    const supportedTypes = [
      "mp4",
      "avi",
      "mov",
      "wmv",
      "flv",
      "mkv",
      "webm",
      "mpeg",
      "mpg",
      "3gp",
      "m4v",
    ];
    const fileType = file.name.split(".").pop().toLowerCase();
    if (!isFileTypeSupported(supportedTypes, fileType)) {
      throw new Error(
        `.${fileType} files are not supported. Allowed: ${supportedTypes.join(", ")}`,
      );
    }

    const response = await uploadFileToCloudinary(file, folder, quality);
    return response;
  } catch (error) {
    throw new Error(error.message || "Failed to upload video to Cloudinary.");
  }
};

/**
 * Extract Cloudinary public_id from a Cloudinary URL.
 * URL format: .../upload/v<version>/<folder>/<name>.<ext>  =>  public_id = "<folder>/<name>"
 * @param {string} url - Full Cloudinary URL (e.g. secure_url)
 * @returns {string|null} - public_id or null if not a Cloudinary URL / parse failed
 */
function getPublicIdFromUrl(url) {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com"))
    return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return null;
    const path = match[1];
    const lastSlash = path.lastIndexOf("/");
    const nameWithExt = lastSlash === -1 ? path : path.slice(lastSlash + 1);
    const dot = nameWithExt.lastIndexOf(".");
    const name = dot === -1 ? nameWithExt : nameWithExt.slice(0, dot);
    const publicId =
      lastSlash === -1 ? name : `${path.slice(0, lastSlash)}/${name}`;
    return publicId || null;
  } catch {
    return null;
  }
}

/**
 * Delete an image from Cloudinary by its URL (e.g. stored poster URL).
 * Safe to call with non-Cloudinary or empty URL; no-op in that case.
 * @param {string} imageUrl - Full Cloudinary image URL
 * @param {object} [options] - { resource_type: 'image' } (default)
 * @returns {Promise<{ result: string }|null>} - Cloudinary result or null if not deleted
 */
exports.deleteImageByUrl = async (imageUrl, options = {}) => {
  try {
    const publicId = getPublicIdFromUrl(imageUrl);
    if (!publicId) return null;
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: options.resource_type || "image",
      ...options,
    });
    console.log("Cloudinary image deleted:", {
      deleted: true,
      publicId,
      url: imageUrl,
      result: result?.result ?? result,
    });
    return result;
  } catch (error) {
    console.error("Cloudinary deleteImageByUrl error:", error.message);
    return null;
  }
};

/**
 * Infer Cloudinary resource_type from URL (video URLs contain /video/ in path).
 * @param {string} url - Full Cloudinary URL
 * @returns {'image'|'video'}
 */
function getResourceTypeFromUrl(url) {
  return url && url.includes("/video/") ? "video" : "image";
}

/**
 * Delete any Cloudinary asset (image or video) by URL. Infers resource_type from URL.
 * Safe to call with non-Cloudinary or empty URL; no-op in that case.
 * @param {string} assetUrl - Full Cloudinary asset URL (image or video)
 * @param {object} [options] - Override resource_type if needed
 * @returns {Promise<{ result: string }|null>}
 */
exports.uploadRawFromPath = async (filePath, folder, publicId = null) => {
  try {
    if (!filePath) throw new Error("No file path provided for upload.");
    const options = {
      folder,
      resource_type: "raw",
    };
    if (publicId) options.public_id = publicId;
    return await cloudinary.uploader.upload(filePath, options);
  } catch (error) {
    throw new Error(error.message || "Failed to upload file to Cloudinary.");
  }
};

exports.deleteAssetByUrl = async (assetUrl, options = {}) => {
  try {
    const publicId = getPublicIdFromUrl(assetUrl);
    if (!publicId) return null;
    const resourceType =
      options.resource_type ?? getResourceTypeFromUrl(assetUrl);
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      ...options,
    });
    console.log("Cloudinary asset deleted:", {
      deleted: true,
      type: resourceType,
      publicId,
      url: assetUrl,
      result: result?.result ?? result,
    });
    return result;
  } catch (error) {
    console.error("Cloudinary deleteAssetByUrl error:", error.message);
    return null;
  }
};

/**
 * Fetch all image URLs stored in a Cloudinary folder.
 * @param {string} folder - Cloudinary folder name, e.g. "wifi_event"
 * @returns {Promise<string[]>} - Secure image URLs
 */
exports.getImagesFromCloudinaryFolder = async (folder = "wifi_event") => {
  if (!folder || typeof folder !== "string") {
    throw new Error("A valid Cloudinary folder name is required.");
  }

  const normalizedFolder = folder.trim().replace(/^\/+|\/+$/g, "");
  if (!normalizedFolder) {
    throw new Error("A valid Cloudinary folder name is required.");
  }

  const imageUrls = [];
  const seen = new Set();

  const addUrls = (resources = []) => {
    for (const resource of resources) {
      const url = resource?.secure_url || resource?.url;
      if (!url || seen.has(url)) continue;
      seen.add(url);
      imageUrls.push(url);
    }
  };

  const prefixCandidates = [normalizedFolder, `${normalizedFolder}/`];

  for (const prefix of prefixCandidates) {
    let nextCursor;
    do {
      const result = await cloudinary.api.resources({
        resource_type: "image",
        type: "upload",
        prefix,
        max_results: 500,
        next_cursor: nextCursor,
      });

      addUrls(result.resources || []);
      nextCursor = result.next_cursor;
    } while (nextCursor);
  }

  if (imageUrls.length === 0) {
    let nextCursor;
    do {
      const result = await cloudinary.api.resources({
        resource_type: "image",
        type: "upload",
        max_results: 500,
        next_cursor: nextCursor,
      });

      const filtered = (result.resources || []).filter((resource) => {
        const publicId = String(resource?.public_id || "").trim();
        const folderName = String(resource?.folder || "").trim();

        return (
          publicId === normalizedFolder ||
          publicId.startsWith(`${normalizedFolder}/`) ||
          publicId.includes(`/${normalizedFolder}/`) ||
          folderName === normalizedFolder ||
          folderName.startsWith(`${normalizedFolder}/`)
        );
      });

      addUrls(filtered);
      nextCursor = result.next_cursor;
    } while (nextCursor);
  }

  return imageUrls;
};
