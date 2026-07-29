const express = require("express");
const {
  getMyTeamMembers,
  getDepartmentRoster,
  getDepartments,
  addMember,
  updateMember,
  deleteMember,
  uploadExcel,
  downloadTemplate,
  createInviteLink,
  getActiveInviteLink,
  suspendTeamInviteLink,
  validateTeamInviteLink,
  uploadTeamPhotoByInviteLink,
  addMemberByInviteLink,
  uploadTeamPhoto,
} = require("../controllers/teamController");
const {
  applyNextSession,
  getYearPromotionHistory,
  revertYearPromotion,
} = require("../controllers/yearPromotionController");
const { auth } = require("../middlewares/AuthZ");

const router = express.Router();

// Public: validate and submit by invite link (no auth)
router.get("/join/:token", validateTeamInviteLink);
router.post("/join/:token/upload-photo", uploadTeamPhotoByInviteLink);
router.post("/join/:token", addMemberByInviteLink);

router.post("/year-promotion/apply", auth, applyNextSession);
router.get("/year-promotion/history", auth, getYearPromotionHistory);
router.post("/year-promotion/:id/revert", auth, revertYearPromotion);

router.get("/departments", auth, getDepartments);
router.get("/roster", auth, getDepartmentRoster);
router.get("/members", auth, getMyTeamMembers);
router.post("/members", auth, addMember);
router.post("/upload-photo", auth, uploadTeamPhoto);
router.get("/invite-link", auth, getActiveInviteLink);
router.post("/invite-link", auth, createInviteLink);
router.delete("/invite-link/:token", auth, suspendTeamInviteLink);
router.put("/members/:id", auth, updateMember);
router.delete("/members/:id", auth, deleteMember);
router.post("/members/upload-excel", auth, uploadExcel);
router.get("/template", auth, downloadTemplate);

module.exports = router;
