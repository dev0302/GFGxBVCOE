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
  suspendTeamInviteLink,
  validateTeamInviteLink,
  uploadTeamPhotoByInviteLink,
  addMemberByInviteLink,
  uploadTeamPhoto,
} = require("../controllers/teamController");
const { auth } = require("../middlewares/AuthZ");

const router = express.Router();

// Public: validate and submit by invite link (no auth)
router.get("/join/:token", validateTeamInviteLink);
router.post("/join/:token/upload-photo", uploadTeamPhotoByInviteLink);
router.post("/join/:token", addMemberByInviteLink);

router.get("/departments", auth, getDepartments);
router.get("/roster", auth, getDepartmentRoster);
router.get("/members", auth, getMyTeamMembers);
router.post("/members", auth, addMember);
router.post("/upload-photo", auth, uploadTeamPhoto);
router.post("/invite-link", auth, createInviteLink);
router.delete("/invite-link/:token", auth, suspendTeamInviteLink);
router.put("/members/:id", auth, updateMember);
router.delete("/members/:id", auth, deleteMember);
router.post("/members/upload-excel", auth, uploadExcel);
router.get("/template", auth, downloadTemplate);

module.exports = router;
