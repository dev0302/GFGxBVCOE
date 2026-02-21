const SignupConfig = require("../models/SignupConfig");
const { logActivity } = require("../utils/activityLog");

const ALL_DEPARTMENTS = [
  "ADMIN",
  "Chairperson",
  "Vice-Chairperson",
  "Social Media and Promotion",
  "Technical",
  "Event Management",
  "Public Relation and Outreach",
  "Design",
  "Content and Documentation",
  "Photography and Videography",
  "Sponsorship and Marketing",
];

exports.getAllSignupConfigs = async (req, res) => {
  try {
    const configsFromDb = await SignupConfig.find({}).sort({ department: 1 });
    const byDept = new Map(configsFromDb.map((c) => [c.department, c.allowedEmails || []]));
    const data = ALL_DEPARTMENTS.map((department) => ({
      department,
      allowedEmails: byDept.get(department) || [],
    }));
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getAllSignupConfigs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch signup config.",
      error: error.message,
    });
  }
};

exports.addEmail = async (req, res) => {
  try {
    const { department, email } = req.body;
    const deptTrim = department ? department.trim() : "";
    if (!deptTrim || !email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department and email are required.",
      });
    }
    if (!ALL_DEPARTMENTS.includes(deptTrim)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department.",
      });
    }
    const emailNorm = email.trim().toLowerCase();
    let config = await SignupConfig.findOne({ department: deptTrim });
    if (!config) {
      config = await SignupConfig.create({ department: deptTrim, allowedEmails: [] });
    }
    if (config.allowedEmails.includes(emailNorm)) {
      return res.status(400).json({
        success: false,
        message: "Email already in list.",
      });
    }
    config.allowedEmails.push(emailNorm);
    await config.save();
    if (req.user?.id) {
      await logActivity(req.user.id, "signup_config_add", "signup_config", { department: deptTrim, email: emailNorm }, "", "SignupConfig");
    }
    return res.status(200).json({
      success: true,
      message: "Email added.",
      data: config,
    });
  } catch (error) {
    console.error("addEmail error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add email.",
    });
  }
};

exports.removeEmail = async (req, res) => {
  try {
    const { department, email } = req.body;
    const deptTrim = department ? department.trim() : "";
    if (!deptTrim || !email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department and email are required.",
      });
    }
    const emailNorm = email.trim().toLowerCase();
    const config = await SignupConfig.findOne({ department: deptTrim });
    if (!config) {
      return res.status(200).json({
        success: true,
        message: "Email removed.",
        data: { department: deptTrim, allowedEmails: [] },
      });
    }
    config.allowedEmails = config.allowedEmails.filter((e) => e !== emailNorm);
    await config.save();
    if (req.user?.id) {
      await logActivity(req.user.id, "signup_config_remove", "signup_config", { department: deptTrim, email: emailNorm }, "", "SignupConfig");
    }
    return res.status(200).json({
      success: true,
      message: "Email removed.",
      data: config,
    });
  } catch (error) {
    console.error("removeEmail error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove email.",
    });
  }
};
