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

// Upload file to Cloudinary
async function uploadFileToCloudinary(file, folder, quality, publicId = null) {
  const options = {
    folder,
    public_id: publicId ?? file.name.split(".")[0],
    resource_type: "auto",
  };
  if (quality) {
    options.quality = quality;
  }
  return await cloudinary.uploader.upload(file.tempFilePath, options);
}

exports.cloudinaryConnect = cloudinaryConnect;

exports.imageUpload = async (file, folder, quality, publicId = null) => {
  try {
    if (!file) throw new Error("No file provided for upload.");
    if (!file.name || !file.name.includes("."))
      throw new Error("Invalid file name. File must have an extension.");

    const supportedTypes = [
      "jpg", "jpeg", "png", "gif", "bmp", "webp",
      "svg", "tiff", "tif", "heic", "heif", "avif",
      "raw", "ico"
    ];
    const fileType = file.name.split(".").pop().toLowerCase();
    if (!isFileTypeSupported(supportedTypes, fileType)) {
      throw new Error(`.${fileType} files are not supported. Allowed: ${supportedTypes.join(", ")}`);
    }

    const response = await uploadFileToCloudinary(file, folder, quality, publicId);
    return response;
  } catch (error) {
    throw new Error(error.message || "Failed to upload image to Cloudinary.");
  }
};

exports.uploadImageFromUrl = async (imageUrl, folder = "gfg-avatars") => {
  try {
    if (!imageUrl || typeof imageUrl !== "string") throw new Error("Invalid image URL.");
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
      "mp4", "avi", "mov", "wmv", "flv", "mkv", "webm", "mpeg", "mpg", "3gp", "m4v"
    ];
    const fileType = file.name.split(".").pop().toLowerCase();
    if (!isFileTypeSupported(supportedTypes, fileType)) {
      throw new Error(`.${fileType} files are not supported. Allowed: ${supportedTypes.join(", ")}`);
    }

    const response = await uploadFileToCloudinary(file, folder, quality);
    return response;
  } catch (error) {
    throw new Error(error.message || "Failed to upload video to Cloudinary.");
  }
};
