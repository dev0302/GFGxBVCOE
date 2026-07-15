/**
 * Removes leadership-transition test history from MongoDB, local disk, and Cloudinary.
 *
 * Usage (from server/): npm run clear:leadership-records
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const LeadershipDraftSession = require("../models/LeadershipDraftSession");
const ActivityLog = require("../models/ActivityLog");
const { REPORTS_DIR } = require("../utils/leadershipReportPdf");
const { cloudinaryConnect } = require("../config/cloudinary");
const dbConnect = require("../config/database");

function getPublicIdFromUrl(url) {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return null;
    const assetPath = match[1];
    const lastSlash = assetPath.lastIndexOf("/");
    const nameWithExt = lastSlash === -1 ? assetPath : assetPath.slice(lastSlash + 1);
    const dot = nameWithExt.lastIndexOf(".");
    const name = dot === -1 ? nameWithExt : nameWithExt.slice(0, dot);
    return lastSlash === -1 ? name : `${assetPath.slice(0, lastSlash)}/${name}`;
  } catch {
    return null;
  }
}

async function deleteCloudinaryRawByUrl(url) {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return { url, deleted: false, reason: "not_cloudinary" };
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    return { url, publicId, deleted: result?.result === "ok", result: result?.result };
  } catch (error) {
    return { url, publicId, deleted: false, error: error.message };
  }
}

async function deleteAllLeadershipReportsFromCloudinary() {
  return cloudinary.api
    .delete_resources_by_prefix("leadership-reports", { resource_type: "raw" })
    .catch((error) => ({ error: error.message }));
}

async function clearLocalReportPdfs() {
  if (!fs.existsSync(REPORTS_DIR)) return 0;
  const files = fs.readdirSync(REPORTS_DIR).filter((f) => f.toLowerCase().endsWith(".pdf"));
  for (const file of files) {
    fs.unlinkSync(path.join(REPORTS_DIR, file));
  }
  return files.length;
}

async function clearCloudinary() {
  if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
    console.warn("Cloudinary credentials missing — skipping Cloudinary cleanup.");
    return;
  }

  cloudinaryConnect();

  const prefixCleanup = await deleteAllLeadershipReportsFromCloudinary();
  if (prefixCleanup?.error) {
    console.warn(`Cloudinary folder cleanup warning: ${prefixCleanup.error}`);
  } else {
    const deleted = prefixCleanup?.deleted || {};
    const deletedCount = Object.values(deleted).filter((v) => v === "deleted").length;
    console.log(`Cloudinary folder cleanup (leadership-reports): ${deletedCount} asset(s) removed.`);
  }
}

async function clearDatabaseAndLinkedCloudinary() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set in server/.env");
  }

  await dbConnect();

  const sessions = await LeadershipDraftSession.find(
    {},
    { reportPdfUrl: 1, sessionId: 1, status: 1 }
  ).lean();

  const reportUrls = [...new Set(sessions.map((s) => s.reportPdfUrl).filter(Boolean))];
  console.log(`Found ${sessions.length} leadership session(s), ${reportUrls.length} linked Cloudinary URL(s).`);

  if (process.env.CLOUD_NAME && process.env.API_KEY && process.env.API_SECRET) {
    for (const url of reportUrls) {
      const result = await deleteCloudinaryRawByUrl(url);
      console.log(
        result.deleted
          ? `Deleted Cloudinary report: ${result.publicId}`
          : `Cloudinary report skipped/failed: ${url}${result.error ? ` (${result.error})` : ""}`
      );
    }
  }

  const sessionResult = await LeadershipDraftSession.deleteMany({});
  const logResult = await ActivityLog.deleteMany({ category: "leadership_transition" });

  console.log(`Deleted ${sessionResult.deletedCount} leadership draft session(s) from DB.`);
  console.log(`Deleted ${logResult.deletedCount} leadership activity log(s) from DB.`);

  await mongoose.disconnect();
}

async function main() {
  await clearCloudinary();

  const pdfCount = await clearLocalReportPdfs();
  console.log(`Deleted ${pdfCount} local report PDF file(s).`);

  await clearDatabaseAndLinkedCloudinary();
  console.log("Leadership transition test records cleared.");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
