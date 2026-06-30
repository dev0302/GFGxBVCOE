const RecruitmentForm = require("../models/RecruitmentForm");
const RecruitmentSubmission = require("../models/RecruitmentSubmission");
const { imageUpload, deleteImageByUrl } = require("../config/cloudinary");
const { generateEditToken } = require("../models/RecruitmentSubmission");
const { logActivity } = require("../utils/activityLog");

const SOCIETY_ROLES = ["ADMIN", "Chairperson", "Vice-Chairperson"];

function isAuthorized(user) {
  if (!user) return false;
  return SOCIETY_ROLES.includes(user.accountType) || user.dashboardAccess?.includes("Faculty Incharge");
}

function randomImageName() {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

// Default Quick Template fields
const DEFAULT_FIELDS = [
  { id: "first_name", label: "First Name", type: "text", required: true },
  { id: "last_name", label: "Last Name (Optional)", type: "text", required: false },
  { id: "phone_number", label: "Phone No", type: "number", required: true },
  { id: "email_id", label: "Email ID", type: "text", required: true },
  { id: "photo", label: "Photo", type: "text", required: true }, // custom cropped photo value
];

// Helper to generate a short unique form ID
function generateFormId() {
  return `form_${Math.random().toString(36).slice(2, 10)}`;
}

// 1. Create form
exports.createForm = async (req, res) => {
  try {
    if (!isAuthorized(req.user)) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    const { title, description, fields } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Form title is required." });
    }

    const formId = generateFormId();
    const finalFields = (fields && fields.length > 0) ? fields : DEFAULT_FIELDS;

    const newForm = await RecruitmentForm.create({
      formId,
      title: title.trim(),
      description: description || "",
      fields: finalFields,
      createdBy: req.user.id,
    });

    await logActivity(req.user.id, "recruitment_form_create", "recruitment", { formId, title }, newForm._id.toString(), "RecruitmentForm");

    return res.status(201).json({
      success: true,
      message: "Form generated successfully.",
      data: newForm,
    });
  } catch (error) {
    console.error("createForm error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get list of all forms (admin only)
exports.getForms = async (req, res) => {
  try {
    if (!isAuthorized(req.user)) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }
    const forms = await RecruitmentForm.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: forms });
  } catch (error) {
    console.error("getForms error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get form details (public)
exports.getFormById = async (req, res) => {
  try {
    const { formId } = req.params;
    const form = await RecruitmentForm.findOne({ formId });
    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found." });
    }
    return res.status(200).json({ success: true, data: form });
  } catch (error) {
    console.error("getFormById error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update form status/fields
exports.updateForm = async (req, res) => {
  try {
    if (!isAuthorized(req.user)) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }
    const { formId } = req.params;
    const { title, description, fields, status } = req.body;

    const form = await RecruitmentForm.findOne({ formId });
    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found." });
    }

    if (title !== undefined) form.title = title.trim();
    if (description !== undefined) form.description = description;
    if (fields !== undefined) form.fields = fields;
    if (status !== undefined) form.status = status;

    await form.save();
    await logActivity(req.user.id, "recruitment_form_update", "recruitment", { formId }, form._id.toString(), "RecruitmentForm");

    return res.status(200).json({
      success: true,
      message: "Form updated successfully.",
      data: form,
    });
  } catch (error) {
    console.error("updateForm error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delete form and its submissions
exports.deleteForm = async (req, res) => {
  try {
    if (!isAuthorized(req.user)) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }
    const { formId } = req.params;
    const form = await RecruitmentForm.findOne({ formId });
    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found." });
    }

    // Delete all submissions first
    const submissions = await RecruitmentSubmission.find({ formId });
    for (const sub of submissions) {
      if (sub.photo && sub.photo.includes("cloudinary.com")) {
        await deleteImageByUrl(sub.photo).catch(() => {});
      }
    }
    await RecruitmentSubmission.deleteMany({ formId });

    // Delete the form itself
    await RecruitmentForm.deleteOne({ formId });

    await logActivity(req.user.id, "recruitment_form_delete", "recruitment", { formId, title: form.title }, form._id.toString(), "RecruitmentForm");

    return res.status(200).json({
      success: true,
      message: "Form and all its responses deleted successfully.",
    });
  } catch (error) {
    console.error("deleteForm error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Submit form (public)
exports.submitForm = async (req, res) => {
  try {
    const { formId, email, answers, photo, override } = req.body;
    if (!formId || !email || !answers) {
      return res.status(400).json({ success: false, message: "Missing required submission fields." });
    }

    const form = await RecruitmentForm.findOne({ formId });
    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found." });
    }

    if (form.status === "PAUSED") {
      return res.status(403).json({ success: false, message: "Responses for this form are currently paused by the administrator." });
    }
    if (form.status === "SUSPENDED") {
      return res.status(403).json({ success: false, message: "This form's link sharing has been suspended." });
    }

    const emailNorm = email.trim().toLowerCase();

    // Check duplicate
    const existing = await RecruitmentSubmission.findOne({ formId, email: emailNorm });
    if (existing) {
      if (override === true) {
        // Delete old submission and old photo from Cloudinary
        if (existing.photo && existing.photo.includes("cloudinary.com")) {
          await deleteImageByUrl(existing.photo).catch(() => {});
        }
        await RecruitmentSubmission.deleteOne({ _id: existing._id });
      } else {
        return res.status(409).json({
          success: false,
          duplicate: true,
          message: "This form has already been submitted with this email. Do you want to resubmit? Your previous response will be removed.",
        });
      }
    }

    const editToken = generateEditToken();
    const submission = await RecruitmentSubmission.create({
      formId,
      email: emailNorm,
      editToken,
      answers,
      photo: photo || "",
    });

    return res.status(201).json({
      success: true,
      message: "Form response submitted successfully.",
      data: {
        editToken,
        submission,
      },
    });
  } catch (error) {
    console.error("submitForm error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Get submission by edit token (public)
exports.getSubmissionByEditToken = async (req, res) => {
  try {
    const { editToken } = req.params;
    const submission = await RecruitmentSubmission.findOne({ editToken });
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found or invalid token." });
    }

    const form = await RecruitmentForm.findOne({ formId: submission.formId });
    return res.status(200).json({
      success: true,
      data: {
        submission,
        form,
      },
    });
  } catch (error) {
    console.error("getSubmissionByEditToken error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Update submission by edit token (public)
exports.updateSubmissionByEditToken = async (req, res) => {
  try {
    const { editToken } = req.params;
    const { answers, photo } = req.body;

    const submission = await RecruitmentSubmission.findOne({ editToken });
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found or invalid token." });
    }

    const form = await RecruitmentForm.findOne({ formId: submission.formId });
    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found." });
    }
    if (form.status === "PAUSED") {
      return res.status(403).json({ success: false, message: "Updates for this form are paused." });
    }
    if (form.status === "SUSPENDED") {
      return res.status(403).json({ success: false, message: "This form sharing is suspended." });
    }

    if (answers !== undefined) submission.answers = answers;
    if (photo !== undefined) {
      if (submission.photo && submission.photo !== photo && submission.photo.includes("cloudinary.com")) {
        await deleteImageByUrl(submission.photo).catch(() => {});
      }
      submission.photo = photo;
    }

    await submission.save();

    return res.status(200).json({
      success: true,
      message: "Your submission has been updated successfully.",
      data: submission,
    });
  } catch (error) {
    console.error("updateSubmissionByEditToken error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Get all submissions for a form (admin only)
exports.getSubmissionsForForm = async (req, res) => {
  try {
    if (!isAuthorized(req.user)) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }
    const { formId } = req.params;
    const submissions = await RecruitmentSubmission.find({ formId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    console.error("getSubmissionsForForm error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Public photo upload to Cloudinary for form applicants
exports.uploadSubmissionPhoto = async (req, res) => {
  try {
    if (!req.files?.photo) {
      return res.status(400).json({ success: false, message: "No photo file provided." });
    }
    const file = req.files.photo;
    const result = await imageUpload(file, "recruitmentPhotos", 85, randomImageName());
    return res.status(200).json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    console.error("uploadSubmissionPhoto error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
