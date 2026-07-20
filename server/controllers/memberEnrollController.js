const fs = require("fs/promises");
const cloudinary = require("cloudinary").v2;
const Member = require("../models/Member");
const { imageUpload } = require("../config/cloudinary");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const ROLL_NUMBER_PATTERN = /^\d{11}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toArray(files) {
  return Array.isArray(files) ? files : files ? [files] : [];
}

async function fileBuffer(file) {
  if (file.data?.length) return file.data;
  return fs.readFile(file.tempFilePath);
}

async function removeTempFiles(files) {
  await Promise.all(files.map(async (file) => {
    if (file.tempFilePath) await fs.unlink(file.tempFilePath).catch(() => {});
  }));
}

function hasValidImageSignature(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer)) return false;
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return (mimeType === "image/jpeg" && isJpeg) || (mimeType === "image/png" && isPng);
}

exports.enrollMember = async (req, res) => {
  const files = toArray(req.files?.faces);
  const uploadedPaths = [];

  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const rollNumber = String(req.body?.rollNumber || "").trim();

    if (!name || !EMAIL_PATTERN.test(email) || !ROLL_NUMBER_PATTERN.test(rollNumber)) {
      return res.status(400).json({ success: false, message: "Enter a name, valid email address, and 11-digit roll number." });
    }
    if (files.length < 6 || files.length > 10) {
      return res.status(400).json({ success: false, message: "Upload between 6 and 10 face images." });
    }
    for (const file of files) {
      if (!IMAGE_TYPES.has(file.mimetype) || file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ success: false, message: "Each image must be a JPG, JPEG, or PNG no larger than 5 MB." });
      }
      if (!hasValidImageSignature(await fileBuffer(file), file.mimetype)) {
        return res.status(400).json({ success: false, message: "One or more files are not valid image files." });
      }
    }

    const existing = await Member.exists({ $or: [{ email }, { rollNumber }] });
    if (existing) {
      return res.status(409).json({ success: false, message: "A member with this email address or roll number is already enrolled." });
    }

    const folder = `raw_images/${rollNumber}`;
    const imageUrls = [];
    for (const [index, file] of files.entries()) {
      const publicId = `${folder}/face_${index + 1}`;
      // Never overwrite an existing roll-number folder: a concurrent duplicate request must fail safely.
      const result = await imageUpload(file, folder, 100, `face_${index + 1}`, {
        overwrite: false,
        unique_filename: false,
      });
      uploadedPaths.push(publicId);
      imageUrls.push(result.secure_url);
    }

    const member = await Member.create({ name, email, rollNumber, imageUrls, processed: false, enrolledAt: new Date() });
    return res.status(201).json({ success: true, message: "Member enrolled for VectorVision processing.", data: member });
  } catch (error) {
    console.error("VectorVision member enrollment failed:", error);
    if (uploadedPaths.length) {
      try {
        await Promise.all(uploadedPaths.map((publicId) => cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true })));
      } catch (cleanupError) {
        console.error("Could not clean up failed Cloudinary assets:", cleanupError);
      }
    }
    const duplicate = error?.code === 11000;
    return res.status(duplicate ? 409 : 500).json({
      success: false,
      message: duplicate ? "A member with this email address or roll number is already enrolled." : "Enrollment failed. Uploaded files were rolled back.",
    });
  } finally {
    await removeTempFiles(files);
  }
};
