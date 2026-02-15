require("dotenv").config();
const jwt = require("jsonwebtoken");

exports.auth = async (req, res, next) => {
  try {
    const token = req.cookies.Token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Missing token.",
      });
    }

    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decode;
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
        error: err.message,
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error while verifying token.",
      error: err.message,
    });
  }
};

const SOCIETY_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson"];

exports.isAdmin = (req, res, next) => {
  try {
    if (req.user.accountType !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin only.",
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Admin check failed.",
      error: err.message,
    });
  }
};

/** Dashboard (signup config): Faculty Incharge, Chairperson, Vice-Chairperson */
exports.canAccessDashboard = (req, res, next) => {
  try {
    if (!SOCIETY_ROLES.includes(req.user?.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Dashboard access is limited to Faculty Incharge, Chairperson and Vice-Chairperson.",
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Access check failed.",
      error: err.message,
    });
  }
};
