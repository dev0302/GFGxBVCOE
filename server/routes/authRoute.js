const express = require("express");
const {
  sendOTP,
  signup,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  me,
  logout,
  updateProfile,
  updateAvatar,
  enrichProfile,
  searchPeople,
  getAllUsers,
  getAllPeople,
  sendSignupInvite,
  deleteAccount,
} = require("../controllers/authController");
const {
  getAllSignupConfigs,
  addEmail,
  removeEmail,
} = require("../controllers/signupConfigController");
const { auth, isAdmin, canAccessDashboard } = require("../middlewares/AuthZ");

const router = express.Router();

router.post("/sendotp", sendOTP);
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/changepassword", auth, changePassword);
router.get("/me", auth, me);
router.get("/search-people", auth, searchPeople);
router.get("/all-users", auth, canAccessDashboard, getAllUsers);
router.get("/all-people", auth, canAccessDashboard, getAllPeople);
router.post("/send-signup-invite", auth, sendSignupInvite);
router.delete("/account", auth, deleteAccount);
router.get("/enrich-profile", auth, enrichProfile);
router.put("/profile", auth, updateProfile);
router.post("/profile/avatar", auth, updateAvatar);

router.get("/signup-config", auth, canAccessDashboard, getAllSignupConfigs);
router.post("/signup-config/add", auth, canAccessDashboard, addEmail);
router.post("/signup-config/remove", auth, canAccessDashboard, removeEmail);

module.exports = router;
