const express = require("express");
const {
  getMyTeamMembers,
  getDepartmentRoster,
  getDepartments,
  addMember,
  updateMember,
  deleteMember,
  getDeletedTeamMembers,
  restoreTeamMember,
  restoreAllDeletedTeamMembers,
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
const { auth, requireTeamManagement } = require("../middlewares/AuthZ");

const router = express.Router();

// Public: validate and submit by invite link (no auth)
router.get("/join/:token", validateTeamInviteLink);
router.post("/join/:token/upload-photo", uploadTeamPhotoByInviteLink);
router.post("/join/:token", addMemberByInviteLink);

router.post("/year-promotion/apply", auth, requireTeamManagement, applyNextSession);
router.get("/year-promotion/history", auth, getYearPromotionHistory);
router.post("/year-promotion/:id/revert", auth, requireTeamManagement, revertYearPromotion);

router.get("/departments", auth, getDepartments);
router.get("/roster", auth, getDepartmentRoster);
router.get("/members", auth, getMyTeamMembers);
router.get("/members/deleted", auth, requireTeamManagement, getDeletedTeamMembers);
router.post("/members/deleted/restore-all", auth, requireTeamManagement, restoreAllDeletedTeamMembers);
router.post("/members", auth, requireTeamManagement, addMember);
router.post("/upload-photo", auth, requireTeamManagement, uploadTeamPhoto);
router.get("/invite-link", auth, requireTeamManagement, getActiveInviteLink);
router.post("/invite-link", auth, requireTeamManagement, createInviteLink);
router.delete("/invite-link/:token", auth, requireTeamManagement, suspendTeamInviteLink);
router.put("/members/:id", auth, requireTeamManagement, updateMember);
router.post("/members/:id/restore", auth, requireTeamManagement, restoreTeamMember);
router.delete("/members/:id", auth, requireTeamManagement, deleteMember);
router.post("/members/upload-excel", auth, requireTeamManagement, uploadExcel);
router.get("/template", auth, requireTeamManagement, downloadTemplate);

module.exports = router;
