const fs = require("fs");
const path = require("path");
const { getTeamMemberModel } = require("../models/TeamMember");
const TeamInviteLink = require("../models/TeamInviteLink");
const SignupConfig = require("../models/SignupConfig");
const User = require("../models/User");
const PredefinedProfile = require("../models/PredefinedProfile");
const { imageUpload, deleteImageByUrl } = require("../config/cloudinary");
const { logActivity } = require("../utils/activityLog");
const { notifyTeamInviteSubmission } = require("../utils/notificationService");
const { normalizeProfileTextFields, departmentLookupKeys } = require("../utils/departmentNames");
const XLSX = require("xlsx");

const SOCIETY_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson", "Treasurer"];
const TEAM_DEPARTMENTS = [
  "Social Media and Promotion",
  "Technical",
  "Event Management",
  "Public Relation and Outreach",
  "Design and Creative",
  "Content and Documentation",
  "Capture The Event",
  "Sponsorship and Marketing",
];

const EXCEL_COLUMNS = [
  "name",
  "year",
  "branch",
  "section",
  "email",
  "contact",
  "photo",
  "non_tech_society",
];

/** Days to keep soft-deleted team members before DB + photo purge. */
const TEAM_MEMBER_SOFT_RETENTION_DAYS = 7;

const activeTeamMemberFilter = {
  $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
};

async function purgeExpiredDeletedTeamMembers(Model) {
  const cutoff = new Date(Date.now() - TEAM_MEMBER_SOFT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const expired = await Model.find({
    deletedAt: { $ne: null, $lte: cutoff },
  }).lean();
  for (const member of expired) {
    if (member.photo) await deleteImageByUrl(member.photo);
  }
  if (expired.length > 0) {
    await Model.deleteMany({
      deletedAt: { $ne: null, $lte: cutoff },
    });
  }
}

function resolveDepartment(req) {
  const accountType = req.user?.accountType;
  if (!accountType) return null;
  const isSociety = SOCIETY_ROLES.includes(accountType);
  const dept = isSociety ? req.query?.department || req.body?.department : accountType;
  if (!dept) return null;
  if (isSociety && !TEAM_DEPARTMENTS.includes(dept)) return null;
  if (!isSociety && dept !== accountType) return null;
  return dept;
}

exports.getDepartments = async (req, res) => {
  try {
    const accountType = req.user?.accountType;
    if (!SOCIETY_ROLES.includes(accountType)) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }
    return res.status(200).json({ success: true, data: TEAM_DEPARTMENTS });
  } catch (error) {
    console.error("getDepartments error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyTeamMembers = async (req, res) => {
  try {
    const department = resolveDepartment(req);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: SOCIETY_ROLES.includes(req.user?.accountType)
          ? "Department query required (e.g. ?department=Technical)."
          : "Department not found.",
      });
    }
    const Model = getTeamMemberModel(department);
    await purgeExpiredDeletedTeamMembers(Model);
    const members = await Model.find(activeTeamMemberFilter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: members });
  } catch (error) {
    console.error("getMyTeamMembers error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/team/roster?department=X
 * Returns roster from signup config: each allowed email with registered (User) or not, plus user/predefined details.
 */
exports.getDepartmentRoster = async (req, res) => {
  try {
    const department = resolveDepartment(req);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: SOCIETY_ROLES.includes(req.user?.accountType)
          ? "Department query required (e.g. ?department=Technical)."
          : "Department not found.",
      });
    }
    const departmentKeys = departmentLookupKeys(department);
    const configs = await SignupConfig.find({ department: { $in: departmentKeys } }).lean();
    const allowedEmails = [...new Set(
      configs.flatMap((config) => config.allowedEmails || [])
        .map((email) => (email || "").trim().toLowerCase())
        .filter(Boolean)
    )];
    // A leadership account can predate the signup-config entry. Include those
    // active users so a Head or Lead is never hidden from their own roster.
    const departmentUsers = await User.find({
      accountType: { $in: departmentKeys },
      tenureEndedAt: null,
    })
      .populate("additionalDetails")
      .select("-password")
      .lean();
    const userByEmail = new Map(
      departmentUsers.map((user) => [(user.email || "").trim().toLowerCase(), user])
    );
    for (const email of userByEmail.keys()) {
      if (email) allowedEmails.push(email);
    }
    const rosterEmails = [...new Set(allowedEmails)];
    const roster = [];
    for (const email of rosterEmails) {
      const emailNorm = (email || "").trim().toLowerCase();
      if (!emailNorm) continue;
      const userDoc = userByEmail.get(emailNorm) || await User.findOne({ email: emailNorm })
        .populate("additionalDetails")
        .select("-password")
        .lean();
      const emailEscaped = emailNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const predefined = await PredefinedProfile.findOne({
        email: { $regex: new RegExp(`^${emailEscaped}$`, "i") },
      }).lean();
      const registered = !!userDoc && departmentKeys.includes(userDoc.accountType);
      const normalizedPredefined = predefined ? normalizeProfileTextFields(predefined) : null;
      const normalizedUser = userDoc
        ? {
            ...userDoc,
            additionalDetails: userDoc.additionalDetails
              ? normalizeProfileTextFields(userDoc.additionalDetails)
              : userDoc.additionalDetails,
          }
        : null;
      roster.push({
        email: emailNorm,
        registered,
        user: normalizedUser,
        predefinedProfile: normalizedPredefined,
      });
    }
    return res.status(200).json({ success: true, data: roster });
  } catch (error) {
    console.error("getDepartmentRoster error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const department = resolveDepartment(req);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: SOCIETY_ROLES.includes(req.user?.accountType)
          ? "Department required in body."
          : "Department not found.",
      });
    }
    const {
      name,
      year,
      branch,
      section,
      email,
      contact,
      photo,
      non_tech_society,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }

    const emailNorm = (email || "").trim().toLowerCase();
    if (emailNorm) {
      // 1. Check if user already exists in User collection
      const existingUser = await User.findOne({ email: emailNorm });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "This user is already registered." });
      }

      // 2. Check if already in the team for this department
      const Model = getTeamMemberModel(department);
      const existingMember = await Model.findOne({ email: emailNorm, ...activeTeamMemberFilter });
      if (existingMember) {
        return res.status(400).json({ success: false, message: "This email is already added to this department." });
      }
    }

    const Model = getTeamMemberModel(department);
    const member = await Model.create({
      name: (name || "").trim(),
      year: (year || "").toString().trim(),
      branch: (branch || "").trim(),
      section: (section || "").trim(),
      email: (email || "").trim().toLowerCase(),
      contact: (contact || "").toString().trim(),
      photo: (photo || "").trim(),
      non_tech_society: (non_tech_society || "").trim(),
      addedBy: req.user.id,
    });

    if (req.user?.id) {
      await logActivity(req.user.id, "team_member_add", "team", { department, email: member.email, name: member.name }, member._id.toString(), "TeamMember");
    }
    return res.status(201).json({ success: true, data: member });
  } catch (error) {
    console.error("addMember error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const department = resolveDepartment(req);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: SOCIETY_ROLES.includes(req.user?.accountType)
          ? "Department required in body."
          : "Department not found.",
      });
    }
    const { id } = req.params;
    const {
      name,
      year,
      branch,
      section,
      email,
      contact,
      photo,
      non_tech_society,
    } = req.body;

    const Model = getTeamMemberModel(department);
    const newPhoto = photo !== undefined ? (photo || "").trim() : undefined;
    if (newPhoto !== undefined) {
      const existing = await Model.findById(id).lean();
      if (existing?.photo && existing.photo !== newPhoto && existing.photo.includes("cloudinary.com")) {
        await deleteImageByUrl(existing.photo);
      }
    }
    const member = await Model.findOneAndUpdate(
      { _id: id, ...activeTeamMemberFilter },
      {
        ...(name !== undefined && { name: (name || "").trim() }),
        ...(year !== undefined && { year: (year || "").toString().trim() }),
        ...(branch !== undefined && { branch: (branch || "").trim() }),
        ...(section !== undefined && { section: (section || "").trim() }),
        ...(email !== undefined && { email: (email || "").trim().toLowerCase() }),
        ...(contact !== undefined && { contact: (contact || "").toString().trim() }),
        ...(photo !== undefined && { photo: newPhoto }),
        ...(non_tech_society !== undefined && { non_tech_society: (non_tech_society || "").trim() }),
      },
      { new: true }
    );
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found." });
    }
    if (req.user?.id) {
      await logActivity(req.user.id, "team_member_update", "team", { department, memberId: id }, id, "TeamMember");
    }
    return res.status(200).json({ success: true, data: member });
  } catch (error) {
    console.error("updateMember error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const department = resolveDepartment(req);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: SOCIETY_ROLES.includes(req.user?.accountType)
          ? "Department required in body."
          : "Department not found.",
      });
    }
    const { id } = req.params;
    const Model = getTeamMemberModel(department);
    await purgeExpiredDeletedTeamMembers(Model);
    const member = await Model.findOne({ _id: id, ...activeTeamMemberFilter });
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found." });
    }
    const email = member.email;
    const name = member.name;
    member.deletedAt = new Date();
    member.deletedBy = req.user?.id || null;
    await member.save();
    if (req.user?.id) {
      await logActivity(req.user.id, "team_member_delete", "team", { department, email, name, softDelete: true }, id, "TeamMember");
    }
    return res.status(200).json({ success: true, message: "Member moved to deleted list." });
  } catch (error) {
    console.error("deleteMember error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDeletedTeamMembers = async (req, res) => {
  try {
    const department = resolveDepartment(req);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: SOCIETY_ROLES.includes(req.user?.accountType)
          ? "Department query required (e.g. ?department=Technical)."
          : "Department not found.",
      });
    }
    const Model = getTeamMemberModel(department);
    await purgeExpiredDeletedTeamMembers(Model);
    const members = await Model.find({ deletedAt: { $ne: null } }).sort({ deletedAt: -1 });
    return res.status(200).json({
      success: true,
      data: members,
      retentionDays: TEAM_MEMBER_SOFT_RETENTION_DAYS,
    });
  } catch (error) {
    console.error("getDeletedTeamMembers error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.restoreTeamMember = async (req, res) => {
  try {
    const department = resolveDepartment(req);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: SOCIETY_ROLES.includes(req.user?.accountType)
          ? "Department required in body."
          : "Department not found.",
      });
    }
    const { id } = req.params;
    const Model = getTeamMemberModel(department);
    await purgeExpiredDeletedTeamMembers(Model);
    const member = await Model.findOne({ _id: id, deletedAt: { $ne: null } });
    if (!member) {
      return res.status(404).json({ success: false, message: "Deleted member not found." });
    }
    const emailNorm = (member.email || "").trim().toLowerCase();
    if (emailNorm) {
      const conflict = await Model.findOne({
        _id: { $ne: id },
        email: emailNorm,
        ...activeTeamMemberFilter,
      });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: "Another active member already uses this email.",
        });
      }
    }
    member.deletedAt = null;
    member.deletedBy = null;
    await member.save();
    if (req.user?.id) {
      await logActivity(
        req.user.id,
        "team_member_restore",
        "team",
        { department, email: member.email, name: member.name },
        id,
        "TeamMember"
      );
    }
    return res.status(200).json({ success: true, data: member, message: "Member restored." });
  } catch (error) {
    console.error("restoreTeamMember error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.restoreAllDeletedTeamMembers = async (req, res) => {
  try {
    const department = resolveDepartment(req);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: SOCIETY_ROLES.includes(req.user?.accountType)
          ? "Department required in body."
          : "Department not found.",
      });
    }
    const Model = getTeamMemberModel(department);
    await purgeExpiredDeletedTeamMembers(Model);
    const deleted = await Model.find({ deletedAt: { $ne: null } }).sort({ deletedAt: -1 });
    let restored = 0;
    const skipped = [];
    for (const member of deleted) {
      const emailNorm = (member.email || "").trim().toLowerCase();
      if (emailNorm) {
        const conflict = await Model.findOne({
          _id: { $ne: member._id },
          email: emailNorm,
          ...activeTeamMemberFilter,
        });
        if (conflict) {
          skipped.push({ id: member._id, email: member.email, reason: "email_conflict" });
          continue;
        }
      }
      member.deletedAt = null;
      member.deletedBy = null;
      await member.save();
      restored += 1;
    }
    if (req.user?.id && restored > 0) {
      await logActivity(req.user.id, "team_member_restore_all", "team", { department, restored }, null, "TeamMember");
    }
    return res.status(200).json({
      success: true,
      message: restored > 0 ? `Restored ${restored} member(s).` : "No members to restore.",
      restored,
      skipped,
    });
  } catch (error) {
    console.error("restoreAllDeletedTeamMembers error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadExcel = async (req, res) => {
  try {
    const department = resolveDepartment(req);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: SOCIETY_ROLES.includes(req.user?.accountType)
          ? "Department required in body."
          : "Department not found.",
      });
    }

    if (!req.files?.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const file = req.files.file;
    if (!file.name || !file.name.match(/\.(xlsx|xls)$/i)) {
      return res.status(400).json({ success: false, message: "Only Excel files (.xlsx, .xls) are allowed." });
    }

    let buffer = file.data;
    if (!buffer || buffer.length === 0) {
      if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
        buffer = fs.readFileSync(file.tempFilePath);
      } else {
        return res.status(400).json({ success: false, message: "File data could not be read. Try uploading again." });
      }
    }

    const workbook = XLSX.read(buffer, { type: "buffer", raw: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

    if (!rows.length) {
      return res.status(400).json({ success: false, message: "Excel file is empty." });
    }

    const normalize = (val) => {
      if (val == null) return "";
      return String(val)
        .replace(/\uFEFF/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_");
    };

    const firstRow = rows[0];
    const originalKeys = Object.keys(firstRow);
    const normToOrig = {};
    for (const k of originalKeys) {
      const n = normalize(k);
      if (n) normToOrig[n] = k;
    }

    if (!normToOrig.name) {
      const found = originalKeys.length ? originalKeys.join(", ") : "(no columns)";
      return res.status(400).json({
        success: false,
        message: "Excel must have a 'name' column. Use the template for correct columns. Found: " + found,
      });
    }

    const getCol = (row, key) => {
      const orig = normToOrig[key];
      if (!orig) return "";
      const val = row[orig];
      return val != null ? String(val).trim() : "";
    };

    const toInsert = [];
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const name = getCol(row, "name");
      if (!name) continue;

      toInsert.push({
        name,
        year: getCol(row, "year"),
        branch: getCol(row, "branch"),
        section: getCol(row, "section"),
        email: (getCol(row, "email") || "").toLowerCase(),
        contact: getCol(row, "contact"),
        photo: getCol(row, "photo") || getCol(row, "image_drive_link"),
        non_tech_society: getCol(row, "non_tech_society"),
        addedBy: req.user.id,
      });
    }

    if (!toInsert.length) {
      return res.status(400).json({ success: false, message: "No valid rows (need at least a name)." });
    }

    const Model = getTeamMemberModel(department);
    const inserted = await Model.insertMany(toInsert);
    return res.status(201).json({
      success: true,
      message: `Added ${inserted.length} member(s).`,
      data: inserted,
    });
  } catch (error) {
    console.error("uploadExcel error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadTemplate = async (req, res) => {
  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([EXCEL_COLUMNS]);
    XLSX.utils.book_append_sheet(wb, ws, "Team members");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=team_members_template.xlsx");
    res.send(buf);
  } catch (error) {
    console.error("downloadTemplate error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

function randomImageName() {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

exports.uploadTeamPhoto = async (req, res) => {
  try {
    if (!req.files?.photo) {
      return res.status(400).json({ success: false, message: "No photo file provided." });
    }
    const file = req.files.photo;
    const result = await imageUpload(file, "membersImages", 85, randomImageName());
    return res.status(200).json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    console.error("uploadTeamPhoto error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Team invite link (join by link) ----------
async function findActiveInviteLink(department) {
  return TeamInviteLink.findOne({
    department,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
}

function parseExpiresInToHours(val) {
  if (!val || typeof val !== "string") return 12; // default 12h
  const clean = val.toLowerCase().trim();
  const match = clean.match(/^(\d+)(h|hr|d|day|days)?$/);
  if (!match) return 12;
  const num = parseInt(match[1], 10);
  const unit = match[2];
  if (!unit || unit.startsWith("h")) {
    return num;
  }
  if (unit.startsWith("d")) {
    return num * 24;
  }
  return 12;
}

exports.getActiveInviteLink = async (req, res) => {
  try {
    const department = resolveDepartment(req);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: SOCIETY_ROLES.includes(req.user?.accountType)
          ? "Department required."
          : "Department not found.",
      });
    }
    const link = await findActiveInviteLink(department);
    if (!link) {
      return res.status(200).json({ success: true, data: null });
    }
    return res.status(200).json({
      success: true,
      data: {
        token: link.token,
        department: link.department,
        expiresAt: link.expiresAt,
      },
    });
  } catch (error) {
    console.error("getActiveInviteLink error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createInviteLink = async (req, res) => {
  try {
    const department = resolveDepartment(req);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: SOCIETY_ROLES.includes(req.user?.accountType)
          ? "Department required in body."
          : "Department not found.",
      });
    }

    const existing = await findActiveInviteLink(department);
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Active invite link already exists.",
        existing: true,
        data: {
          token: existing.token,
          department: existing.department,
          expiresAt: existing.expiresAt,
        },
      });
    }

    const { expiresIn } = req.body;
    const hours = parseExpiresInToHours(expiresIn);
    const token = TeamInviteLink.generateToken();
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    await TeamInviteLink.create({ token, department, expiresAt });
    if (req.user?.id) {
      await logActivity(req.user.id, "invite_link_create", "invite_link", { department, expiresIn: expiresIn || "12h" }, "", "TeamInviteLink");
    }
    return res.status(201).json({
      success: true,
      message: "Invite link created.",
      data: { token, department, expiresAt },
    });
  } catch (error) {
    console.error("createInviteLink error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.validateTeamInviteLink = async (req, res) => {
  try {
    const { token } = req.params;
    const link = await TeamInviteLink.findOne({ token });
    if (!link) {
      return res.status(404).json({ success: false, valid: false, message: "Invalid link." });
    }
    if (new Date() > link.expiresAt) {
      return res.status(400).json({ success: false, valid: false, message: "Link has expired." });
    }
    return res.status(200).json({
      success: true,
      valid: true,
      department: link.department,
      expiresAt: link.expiresAt,
    });
  } catch (error) {
    console.error("validateTeamInviteLink error:", error);
    return res.status(500).json({ success: false, valid: false });
  }
};

exports.uploadTeamPhotoByInviteLink = async (req, res) => {
  try {
    const { token } = req.params;
    const link = await TeamInviteLink.findOne({ token });
    if (!link) {
      return res.status(404).json({ success: false, message: "Invalid link." });
    }
    if (new Date() > link.expiresAt) {
      return res.status(400).json({ success: false, message: "Link has expired." });
    }
    if (!req.files?.photo) {
      return res.status(400).json({ success: false, message: "No photo file provided." });
    }
    const file = req.files.photo;
    const result = await imageUpload(file, "membersImages", 85, randomImageName());
    const previousPhotoUrl = typeof req.body?.previousPhotoUrl === "string" ? req.body.previousPhotoUrl.trim() : "";
    if (previousPhotoUrl && previousPhotoUrl.includes("cloudinary.com")) {
      await deleteImageByUrl(previousPhotoUrl);
    }
    return res.status(200).json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    console.error("uploadTeamPhotoByInviteLink error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addMemberByInviteLink = async (req, res) => {
  try {
    const { token } = req.params;
    const link = await TeamInviteLink.findOne({ token });
    if (!link) {
      return res.status(404).json({ success: false, message: "Invalid link." });
    }
    if (new Date() > link.expiresAt) {
      return res.status(400).json({ success: false, message: "Link has expired." });
    }
    const {
      name,
      year,
      branch,
      section,
      email,
      contact,
      photo,
      non_tech_society,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }

    //  Check if user already exists in User collection
    const emailNorm = (email || "").trim().toLowerCase();
    if (emailNorm) {

      const existingUser = await User.findOne({ email: emailNorm });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "You are already registered as a Core/Head member. This form is only for Executive applications." });
      }

      const Model = getTeamMemberModel(link.department);
      const existingMember = await Model.findOne({ email: emailNorm, ...activeTeamMemberFilter });
      if (existingMember) {
        return res.status(400).json({ success: false, message: "You are already registered in this department." });
      }
    }

    const Model = getTeamMemberModel(link.department);
    const member = await Model.create({
      name: (name || "").trim(),
      year: (year || "").toString().trim(),
      branch: (branch || "").trim(),
      section: (section || "").trim(),
      email: (email || "").trim().toLowerCase(),
      contact: (contact || "").toString().trim(),
      photo: (photo || "").trim(),
      non_tech_society: (non_tech_society || "").trim(),
      addedBy: null,
    });

    notifyTeamInviteSubmission({
      department: link.department,
      memberName: member.name,
      memberId: member._id,
    }).catch((err) => console.error("notifyTeamInviteSubmission error:", err));

    return res.status(201).json({ success: true, data: member, message: "You have been added to the team." });
  } catch (error) {
    console.error("addMemberByInviteLink error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.suspendTeamInviteLink = async (req, res) => {
  try {
    const { token } = req.params;
    const link = await TeamInviteLink.findOne({ token });
    const result = await TeamInviteLink.deleteOne({ token });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Link not found or already suspended." });
    }
    if (req.user?.id) {
      await logActivity(req.user.id, "invite_link_suspend", "invite_link", { department: link?.department }, "", "TeamInviteLink");
    }
    return res.status(200).json({ success: true, message: "Link suspended." });
  } catch (error) {
    console.error("suspendTeamInviteLink error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
