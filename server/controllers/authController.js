const OTP = require("../models/OTP");
const PasswordReset = require("../models/PasswordReset");
const User = require("../models/User");
const Profile = require("../models/Profile");
const PredefinedProfile = require("../models/PredefinedProfile");
const SignupConfig = require("../models/SignupConfig");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mailSender = require("../utils/mailSender");
const { emailVerificationTemplate, passwordResetTemplate, passwordChangedTemplate, signupInviteTemplate } = require("../mail/templates");
const { imageUpload, uploadImageFromUrl } = require("../config/cloudinary");
const { getTeamMemberModel } = require("../models/TeamMember");
const { getEventUploadAllowedList } = require("./eventController");
const SOCIETY_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson"];

const PREDEFINED_IMAGE_BASE = "https://www.gfg-bvcoe.com";

/** Find PredefinedProfile by email (case-insensitive) so stored casing never causes "not found". */
function findPredefinedByEmail(email) {
  const trimmed = (email || "").trim();
  if (!trimmed) return null;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return PredefinedProfile.findOne({ email: { $regex: new RegExp(`^${escaped}$`, "i") } }).lean();
}

exports.sendOTP = async (req, res) => {
  try {
    const { email, department } = req.body;
    if (!email || !department) {
      return res.status(400).json({
        success: false,
        message: "Email and department are required.",
      });
    }

    const checkUserPresent = await User.findOne({ email: email.trim().toLowerCase() });
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already registered.",
      });
    }

    const config = await SignupConfig.findOne({
      department: department.trim(),
      allowedEmails: email.trim().toLowerCase(),
    });
    if (!config) {
      return res.status(403).json({
        success: false,
        message: "This email is not allowed to sign up for the selected department.",
      });
    }

    await OTP.collection.createIndex({ otp: 1 }, { unique: true }).catch(() => {});

    let otp;
    let otpBody;
    const emailNorm = email.trim().toLowerCase();

    while (true) {
      try {
        otp = otpGenerator.generate(6, {
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });
        otpBody = await OTP.create({ email: emailNorm, otp });
        break;
      } catch (err) {
        if (err.code === 11000) continue;
        throw err;
      }
    }

    const htmlContent = emailVerificationTemplate(otp);
    await mailSender(emailNorm, "GFGxBVCOE – Signup OTP", htmlContent);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("sendOTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      otp,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword || !otp || !accountType) {
      return res.status(403).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const emailNorm = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: emailNorm });
    if (existingUser) {
      return res.status(401).json({
        success: false,
        message: "User already exists.",
      });
    }

    const config = await SignupConfig.findOne({
      department: accountType.trim(),
      allowedEmails: emailNorm,
    });
    if (!config) {
      return res.status(403).json({
        success: false,
        message: "This email is not allowed to sign up for the selected department.",
      });
    }

    const recentOTP = await OTP.find({ email: emailNorm }).sort({ createdAt: -1 }).limit(1);
    if (!recentOTP.length || recentOTP[0].otp.toString() !== otp.toString()) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const profileDetails = await Profile.create({
      gender: null,
      dob: null,
      about: null,
      phoneNumber: null,
    });

    const newUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: emailNorm,
      password: hashPassword,
      contact: "",
      accountType: accountType.trim(),
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(firstName + " " + lastName)}`,
    });

    const payload = {
      email: newUser.email,
      id: newUser._id,
      accountType: newUser.accountType,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1y" });

    let userObj = newUser.toObject();
    userObj.token = token;
    userObj.password = undefined;

    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // 🔥 REQUIRED for cross-site
    };
    res.cookie("Token", token, options);
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: userObj,
    });
  } catch (error) {
    console.error("signup error:", error);
    return res.status(400).json({
      success: false,
      message: "Error while creating the entry in database.",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    let user = await User.findOne({ email: email.trim().toLowerCase() }).populate("additionalDetails");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not registered.",
      });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(403).json({
        success: false,
        message: "Password incorrect.",
      });
    }

    const payload = {
      email: user.email,
      id: user._id,
      accountType: user.accountType,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1y" });

    user = user.toObject();
    user.token = token;
    user.password = undefined;
    const eventUploadAllowed = await getEventUploadAllowedList();
    user.canManageEvents = eventUploadAllowed.includes(user.accountType);

    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // 🔥 REQUIRED for cross-site
    };
    res.cookie("Token", token, options).status(200).json({
      success: true,
      token,
      user,
      message: "User logged in successfully.",
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
};

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const emailNorm = email?.trim()?.toLowerCase();
    if (!emailNorm) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      });
    }

    const token = PasswordReset.generateToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    await PasswordReset.deleteMany({ email: emailNorm });
    await PasswordReset.create({ email: emailNorm, token, expiresAt });

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${baseUrl}/reset-password/${token}`;
    const htmlContent = passwordResetTemplate(resetLink);

    if (process.env.BREVO_API_KEY && process.env.SENDER_EMAIL) {
      await mailSender(user.email, "Reset your password – GFGxBVCOE", htmlContent);
    } else {
      console.log("[forgotPassword] No mail config. Reset link:", resetLink);
    }

    return res.status(200).json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process request.",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Token, password and confirm password are required.",
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match.",
      });
    }

    const resetDoc = await PasswordReset.findOne({ token });
    if (!resetDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link.",
      });
    }
    if (new Date() > resetDoc.expiresAt) {
      await PasswordReset.deleteOne({ token });
      return res.status(400).json({
        success: false,
        message: "Reset link has expired.",
      });
    }

    const user = await User.findOne({ email: resetDoc.email });
    if (!user) {
      await PasswordReset.deleteOne({ token });
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    await PasswordReset.deleteOne({ token });

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password.",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    if (process.env.BREVO_API_KEY && process.env.SENDER_EMAIL) {
      const htmlContent = passwordChangedTemplate();
      await mailSender(user.email, "Password Changed – GFGxBVCOE", htmlContent);
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating password.",
      error: error.message,
    });
  }
};

exports.me = async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id).populate("additionalDetails").select("-password");
    if (!userDoc) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    const user = userDoc.toObject();
    const eventUploadAllowed = await getEventUploadAllowedList();
    user.canManageEvents = eventUploadAllowed.includes(user.accountType);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = (req, res) => {
  res
    .cookie("Token", "", { expires: new Date(0), httpOnly: true, sameSite: "lax" })
    .status(200)
    .json({ success: true, message: "Logged out." });
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      gender,
      dob,
      about,
      contact,
      yearOfStudy,
      section,
      non_tech_society,
      instagram,
      linkedin,
      github,
    } = req.body;

    const user = await User.findById(userId).populate("additionalDetails");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (contact !== undefined) user.contact = (contact || "").trim();
    await user.save();

    let profile = user.additionalDetails;
    if (!profile) {
      profile = await Profile.create({
        gender: gender || null,
        dob: dob || null,
        about: about || null,
        phoneNumber: contact || null,
        yearOfStudy: yearOfStudy || null,
        section: section || null,
        non_tech_society: non_tech_society || null,
        socials: {
          instagram: instagram || null,
          linkedin: linkedin || null,
          github: github || null,
        },
      });
      user.additionalDetails = profile._id;
      await user.save();
    } else {
      if (gender !== undefined) profile.gender = gender || null;
      if (dob !== undefined) profile.dob = dob || null;
      if (about !== undefined) profile.about = about || null;
      if (contact !== undefined) profile.phoneNumber = (contact || "").trim() || null;
      if (yearOfStudy !== undefined) profile.yearOfStudy = yearOfStudy || null;
      if (section !== undefined) profile.section = section || null;
      if (non_tech_society !== undefined) profile.non_tech_society = non_tech_society || null;
      if (instagram !== undefined || linkedin !== undefined || github !== undefined) {
        profile.socials = profile.socials || {};
        if (instagram !== undefined) profile.socials.instagram = instagram || null;
        if (linkedin !== undefined) profile.socials.linkedin = linkedin || null;
        if (github !== undefined) profile.socials.github = github || null;
      }
      await profile.save();
    }

    const updated = await User.findById(userId).populate("additionalDetails").select("-password");
    return res.status(200).json({ success: true, message: "Profile updated.", data: updated });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.files?.avatar) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }
    const file = req.files.avatar;
    const result = await imageUpload(file, "gfg-avatars");
    const user = await User.findByIdAndUpdate(
      userId,
      { image: result.secure_url },
      { new: true }
    )
      .populate("additionalDetails")
      .select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Display picture updated.",
      data: user,
    });
  } catch (error) {
    console.error("updateAvatar error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update avatar.",
    });
  }
};

function sendSSE(res, event, message) {
  res.write(`data: ${JSON.stringify({ event, message })}\n\n`);
}

exports.enrichProfile = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      sendSSE(res, "error", "Not authenticated.");
      sendSSE(res, "done", "");
      return res.end();
    }

    sendSSE(res, "checking_predefined", "Fetching details…");
    const predefined = await findPredefinedByEmail(userEmail);

    if (!predefined) {
      sendSSE(res, "no_predefined", "No predefined profile found.");
      sendSSE(res, "done", "");
      return res.end();
    }

    sendSSE(res, "details_found", "Your details found, updating…");
    const user = await User.findById(req.user.id).populate("additionalDetails");
    if (!user) {
      sendSSE(res, "error", "User not found.");
      sendSSE(res, "done", "");
      return res.end();
    }

    const nameParts = (predefined.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || user.firstName;
    const lastName = nameParts.slice(1).join(" ") || user.lastName;
    user.firstName = firstName;
    user.lastName = lastName;
    await user.save();

    const profile = user.additionalDetails;
    if (profile) {
      if (predefined.branch) profile.branch = predefined.branch;
      if (predefined.year) {
        profile.year = predefined.year;
        profile.yearOfStudy = predefined.year;
      }
      if (predefined.position) profile.position = predefined.position;
      if (predefined.p0 !== undefined && predefined.p0 !== "") profile.p0 = predefined.p0;
      if (predefined.p1 !== undefined && predefined.p1 !== "") profile.p1 = predefined.p1;
      if (predefined.p2 !== undefined && predefined.p2 !== "") profile.p2 = predefined.p2;
      if (profile.socials) {
        if (predefined.instaLink && predefined.instaLink !== "nil") profile.socials.instagram = predefined.instaLink;
        if (predefined.linkedinLink) profile.socials.linkedin = predefined.linkedinLink;
      } else {
        profile.socials = {
          instagram: predefined.instaLink && predefined.instaLink !== "nil" ? predefined.instaLink : null,
          linkedin: predefined.linkedinLink || null,
          github: null,
        };
      }
      if (Array.isArray(predefined.timeline) && predefined.timeline.length) {
        profile.timeline = predefined.timeline;
      }
      await profile.save();
    }

    const imagePath = (predefined.image || "").trim();
    if (imagePath) {
      sendSSE(res, "uploading_image", "Uploading image…");
      const imageUrl = imagePath.startsWith("http") ? imagePath : `${PREDEFINED_IMAGE_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
      try {
        const upload = await uploadImageFromUrl(imageUrl, "gfg-avatars");
        user.image = upload.secure_url;
        await user.save();
      } catch (err) {
        console.error("enrichProfile image upload error:", err);
      }
    }

    sendSSE(res, "done", "Profile updated.");
    res.end();
  } catch (error) {
    console.error("enrichProfile error:", error);
    sendSSE(res, "error", error.message || "Something went wrong.");
    sendSSE(res, "done", "");
    res.end();
  }
};

/**
 * Search people: team members (department-scoped) + users (with profile and predefinedProfile).
 * GET /api/v1/auth/search-people?q=...
 */
exports.searchPeople = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const department = req.user?.accountType;
    let teamMembers = [];
    let users = [];
    let predefinedOnly = [];

    if (department && !SOCIETY_ROLES.includes(department)) {
      const TeamModel = getTeamMemberModel(department);
      const all = await TeamModel.find({}).sort({ createdAt: -1 }).lean();
      if (q.length >= 2) {
        const lower = q.toLowerCase();
        teamMembers = all.filter(
          (m) =>
            (m.name && m.name.toLowerCase().includes(lower)) ||
            (m.email && m.email.toLowerCase().includes(lower)) ||
            (m.branch && m.branch.toLowerCase().includes(lower)) ||
            (m.year && String(m.year).toLowerCase().includes(lower)) ||
            (m.section && m.section.toLowerCase().includes(lower)) ||
            (m.non_tech_society && m.non_tech_society.toLowerCase().includes(lower)) ||
            (m.contact && String(m.contact).includes(q))
        );
      } else {
        teamMembers = all;
      }
      teamMembers = teamMembers.slice(0, 20);
    }

    if (q.length >= 2) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      const qLower = q.toLowerCase();
      let userDocs = await User.find({
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex },
          { accountType: regex },
        ],
      })
        .select("-password")
        .populate("additionalDetails")
        .limit(20)
        .lean();

      if (q.includes(" ")) {
        const firstToken = q.split(/\s+/)[0];
        if (firstToken.length >= 1) {
          const firstRegex = new RegExp(firstToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
          const byFirst = await User.find({ firstName: firstRegex })
            .select("-password")
            .populate("additionalDetails")
            .limit(50)
            .lean();
          const seen = new Set(userDocs.map((u) => u._id.toString()));
          for (const u of byFirst) {
            if (seen.has(u._id.toString())) continue;
            const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").toLowerCase();
            if (fullName.includes(qLower) || fullName.startsWith(qLower)) {
              userDocs.push(u);
              seen.add(u._id.toString());
            }
          }
          userDocs = userDocs.slice(0, 20);
        }
      }

      for (const u of userDocs) {
        const predefined = await PredefinedProfile.findOne({ email: u.email }).lean();
        u.predefinedProfile = predefined || null;
      }
      users = userDocs;

      // Predefined profiles that have no registered user (not signed up yet)
      const predefinedMatching = await PredefinedProfile.find({
        $or: [
          { name: regex },
          { email: regex },
        ],
      })
        .limit(30)
        .lean();
      const preEmails = predefinedMatching.map((p) => (p.email || "").toLowerCase()).filter(Boolean);
      const registeredFromPre = preEmails.length
        ? await User.find({ email: { $in: preEmails } }).select("email").lean()
        : [];
      const registeredEmails = new Set(registeredFromPre.map((u) => (u.email || "").toLowerCase()));
      for (const pre of predefinedMatching) {
        const emailLower = (pre.email || "").toLowerCase();
        if (emailLower && !registeredEmails.has(emailLower)) {
          predefinedOnly.push({
            ...pre,
            registered: false,
          });
        }
      }
      predefinedOnly = predefinedOnly.slice(0, 20);
    }

    return res.status(200).json({
      success: true,
      teamMembers,
      users,
      predefinedOnly: predefinedOnly || [],
    });
  } catch (error) {
    console.error("searchPeople error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Search failed.",
    });
  }
};

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

/**
 * Get all users (society role only). For Manage Society "Show list".
 * GET /api/v1/auth/all-users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .populate("additionalDetails")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch users.",
    });
  }
};

/**
 * Get all people: users + predefined-only (not registered) + team members. Sorted: users, then predefinedOnly, then members.
 * Society role only. GET /api/v1/auth/all-people
 */
exports.getAllPeople = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .populate("additionalDetails")
      .sort({ createdAt: -1 })
      .lean();
    const userEmails = new Set(users.map((u) => (u.email || "").toLowerCase()).filter(Boolean));

    const allPredefined = await PredefinedProfile.find({}).lean();
    const predefinedOnly = allPredefined.filter((p) => {
      const email = (p.email || "").toLowerCase();
      return email && !userEmails.has(email);
    });

    const teamMembers = [];
    for (const dept of TEAM_DEPARTMENTS) {
      const Model = getTeamMemberModel(dept);
      const members = await Model.find({}).sort({ createdAt: -1 }).lean();
      for (const m of members) {
        teamMembers.push({ type: "teamMember", data: m, department: dept });
      }
    }

    const list = [
      ...users.map((u) => ({ type: "user", data: u })),
      ...predefinedOnly.map((p) => ({ type: "predefinedOnly", data: p })),
      ...teamMembers,
    ];
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error("getAllPeople error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch people.",
    });
  }
};

/**
 * Send signup invite email to a predefined profile (not yet registered).
 * POST /api/v1/auth/send-signup-invite
 * Body: { email }
 */
exports.sendSignupInvite = async (req, res) => {
  try {
    const { email } = req.body;
    const emailNorm = (email || "").trim().toLowerCase();
    if (!emailNorm) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const predefined = await findPredefinedByEmail(emailNorm);
    if (!predefined) {
      return res.status(404).json({ success: false, message: "No predefined profile found for this email." });
    }

    const existingUser = await User.findOne({ email: emailNorm }).lean();
    if (existingUser) {
      return res.status(400).json({ success: false, message: "This person is already registered." });
    }

    const baseUrl =
      process.env.FRONTEND_URL ||
      req.get("origin") ||
      req.get("referer")?.replace(/\/[^/]*$/, "") ||
      "https://gfg-bvcoe.vercel.app";
    const signupLink = `${baseUrl.replace(/\/$/, "")}/signup`;

    const htmlContent = signupInviteTemplate(predefined, signupLink);
    await mailSender(emailNorm, "You're invited to sign up – GFGxBVCOE", htmlContent);

    return res.status(200).json({
      success: true,
      message: "Invite email sent successfully.",
    });
  } catch (error) {
    console.error("sendSignupInvite error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send invite email.",
    });
  }
};

/**
 * Delete own account and linked Profile (additionalDetails).
 * DELETE /api/v1/auth/account or POST /api/v1/auth/delete-account
 */
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }

    const userDoc = await User.findById(userId).select("additionalDetails").lean();
    if (!userDoc) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (userDoc.additionalDetails) {
      await Profile.findByIdAndDelete(userDoc.additionalDetails);
    }
    await User.findByIdAndDelete(userId);

    res.clearCookie("Token", { path: "/" });
    return res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error("deleteAccount error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete account.",
    });
  }
};
