const fs = require("fs");
const path = require("path");
const { getTeamMemberModel } = require("../models/TeamMember");
const TeamInviteLink = require("../models/TeamInviteLink");
const SignupConfig = require("../models/SignupConfig");
const User = require("../models/User");
const PredefinedProfile = require("../models/PredefinedProfile");
const { imageUpload, deleteImageByUrl } = require("../config/cloudinary");
const { logActivity } = require("../utils/activityLog");
const XLSX = require("xlsx");

const SOCIETY_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson"];
const TEAM_DEPARTMENTS = [
  "Social Media and Promotion",
  "Technical",
  "Event Management",
  "Public Relation and Outreach",
  "Design",
  "Content and Documentation",
  "Photography and Videography",
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
    const members = await Model.find({}).sort({ createdAt: -1 });
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
    const config = await SignupConfig.findOne({ department }).lean();
    const allowedEmails = (config && config.allowedEmails) ? [...config.allowedEmails] : [];
    const roster = [];
    for (const email of allowedEmails) {
      const emailNorm = (email || "").trim().toLowerCase();
      if (!emailNorm) continue;
      const userDoc = await User.findOne({ email: emailNorm })
        .populate("additionalDetails")
        .select("-password")
        .lean();
      const emailEscaped = emailNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const predefined = await PredefinedProfile.findOne({
        email: { $regex: new RegExp(`^${emailEscaped}$`, "i") },
      }).lean();
      const registered = !!userDoc && userDoc.accountType === department;
      roster.push({
        email: emailNorm,
        registered,
        user: userDoc || null,
        predefinedProfile: predefined || null,
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
      const existingMember = await Model.findOne({ email: emailNorm });
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
    const member = await Model.findByIdAndUpdate(
      id,
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
    const member = await Model.findById(id);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found." });
    }
    if (member.photo) {
      await deleteImageByUrl(member.photo);
    }
    const email = member.email;
    const name = member.name;
    await Model.findByIdAndDelete(id);
    if (req.user?.id) {
      await logActivity(req.user.id, "team_member_delete", "team", { department, email, name }, id, "TeamMember");
    }
    return res.status(200).json({ success: true, message: "Member deleted." });
  } catch (error) {
    console.error("deleteMember error:", error);
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
    const token = TeamInviteLink.generateToken();
    const expiresAt = new Date(Date.now() + TeamInviteLink.INVITE_LINK_EXPIRY_HOURS * 60 * 60 * 1000);
    await TeamInviteLink.create({ token, department, expiresAt });
    if (req.user?.id) {
      await logActivity(req.user.id, "invite_link_create", "invite_link", { department }, "", "TeamInviteLink");
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
      const existingMember = await Model.findOne({ email: emailNorm });
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
