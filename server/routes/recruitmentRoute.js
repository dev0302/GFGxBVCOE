const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/AuthZ");
const {
  createForm,
  getForms,
  getFormById,
  updateForm,
  deleteForm,
  submitForm,
  getSubmissionByEditToken,
  updateSubmissionByEditToken,
  getSubmissionsForForm,
  uploadSubmissionPhoto,
} = require("../controllers/recruitmentController");

// Admin / Chapter Management endpoints
router.post("/forms", auth, createForm);
router.get("/forms", auth, getForms);
router.put("/forms/:formId", auth, updateForm);
router.delete("/forms/:formId", auth, deleteForm);
router.get("/submissions/form/:formId", auth, getSubmissionsForForm);

// Public form submission endpoints
router.get("/forms/public/:formId", getFormById);
router.post("/submissions", submitForm);
router.get("/submissions/edit/:editToken", getSubmissionByEditToken);
router.put("/submissions/edit/:editToken", updateSubmissionByEditToken);
router.post("/submissions/upload-photo", uploadSubmissionPhoto);

module.exports = router;
