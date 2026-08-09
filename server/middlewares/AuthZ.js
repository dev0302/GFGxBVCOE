require("dotenv").config();
const jwt = require("jsonwebtoken");
const { userCanAccessLeadershipTransition } = require("../utils/leadershipAccess");
const { checkAndFinalizeExpiredSession } = require("../utils/tenureSession");

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

    // Department-member accounts are stored in their department collection,
    // not in `users`, so the user-tenure lookup does not apply to them.
    if (req.user.isDepartmentMember) return next();

    const tenureStatus = await checkAndFinalizeExpiredSession(req.user.id);
    if (tenureStatus.expired) {
      const isProduction = process.env.NODE_ENV === "production";
      res.clearCookie("Token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
      });
      return res.status(401).json({
        success: false,
        message: "Your session has ended. Thank you for your contributions to GFG BVCOE.",
        code: "TENURE_SESSION_EXPIRED",
      });
    }

    if (tenureStatus.tenureEndedAt) {
      req.tenureEnded = true;
      req.sessionExpiresAt = tenureStatus.sessionExpiresAt;
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

/** Set req.user if valid token present; do not reject if missing (for optional logging). */
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.Token || req.headers.authorization?.split(" ")[1];
    if (!token) return next();
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decode;
    } catch (_) { /* invalid or expired – leave req.user unset */ }
    next();
  } catch (err) {
    next();
  }
};

const SOCIETY_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson", "Treasurer"];

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

/** Leadership Transition: society roles + users on the allowed list */
exports.canAccessLeadershipTransition = async (req, res, next) => {
  try {
    if (req.tenureEnded) {
      return res.status(403).json({
        success: false,
        message: "Your tenure has ended. Platform access is limited until your session expires.",
      });
    }
    const allowed = await userCanAccessLeadershipTransition(
      req.user?.id,
      req.user?.accountType
    );
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Leadership Transition access is not granted for your account.",
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

/** Dashboard (signup config): society core roles. */
exports.canAccessDashboard = (req, res, next) => {
  try {
    if (req.tenureEnded) {
      return res.status(403).json({
        success: false,
        message: "Your tenure has ended. Dashboard access is no longer available.",
      });
    }
    const accountType = String(req.user?.accountType || '').trim();
    if (!SOCIETY_ROLES.includes(accountType)) {
      return res.status(403).json({
        success: false,
        message: "Dashboard access is limited to society core roles.",
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

/** Department members may view their team but cannot mutate its roster. */
exports.requireTeamManagement = (req, res, next) => {
  if (req.user?.isDepartmentMember) {
    return res.status(403).json({ success: false, message: "Department members have view-only team access." });
  }
  next();
};

/** Settings are available only to accounts stored in the users collection. */
exports.requireRegisteredUser = (req, res, next) => {
  if (req.user?.isDepartmentMember) {
    return res.status(403).json({ success: false, message: "Settings are not available for department-member accounts." });
  }
  next();
};

/**
 * Broadcast notifications — only society core roles (Chairperson, Vice-Chairperson,
 * Treasurer, ADMIN) can send society-wide or all-members broadcasts.
 */
exports.requireSocietyRole = (req, res, next) => {
  if (req.user?.isDepartmentMember) {
    return res.status(403).json({ success: false, message: "Action not permitted for department-member accounts." });
  }
  const allowed = ["ADMIN", "Chairperson", "Vice-Chairperson", "Treasurer"];
  if (!allowed.includes(String(req.user?.accountType || "").trim())) {
    return res.status(403).json({ success: false, message: "This action is restricted to society core roles." });
  }
  next();
};
