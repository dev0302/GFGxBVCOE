const OSProject = require("../models/OSProject");
const User = require("../models/User");
const {
  userCanReviewBlog,
  userCanDeleteOSProject,
} = require("../utils/leadershipAccess");

const normalizeUrl = (value) => {
  const trimmedValue = String(value || "").trim();
  if (!trimmedValue) return "";
  return /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;
};

const normalizeRepository = (value) =>
  String(value || "")
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/\/$/, "");

// Projects added before the maintainer fields were standardized used `admin*`.
// Keep those existing records usable by the current frontend without requiring a
// data migration before the list can be displayed.
const serializeProject = (project) => ({
  ...project,
  stacks: Array.isArray(project.stacks) ? project.stacks : [],
  maintainer: project.maintainer || project.admin || "",
  maintainerEmail: project.maintainerEmail || project.adminEmail || "",
  maintainerLinkedIn:
    project.maintainerLinkedIn || project.adminLinkedIn || "",
  maintainerGithub: project.maintainerGithub || project.adminGithub || "",
});

const getProjectPayload = (body = {}) => {
  const payload = {};
  const stringFields = [
    "name",
    "description",
    "category",
    "difficultyLevel",
    "maintainer",
    "maintainerEmail",
  ];

  stringFields.forEach((field) => {
    if (body[field] !== undefined) payload[field] = body[field];
  });
  if (body.repository !== undefined) {
    payload.repository = normalizeRepository(body.repository);
  }
  if (body.stacks !== undefined) {
    payload.stacks = Array.isArray(body.stacks)
      ? body.stacks
      : String(body.stacks || "")
          .split(",")
          .map((stack) => stack.trim())
          .filter(Boolean);
  }
  if (body.maintainerLinkedIn !== undefined) {
    payload.maintainerLinkedIn = normalizeUrl(body.maintainerLinkedIn);
  }
  if (body.maintainerGithub !== undefined) {
    payload.maintainerGithub = normalizeUrl(body.maintainerGithub);
  }
  if (body.isPublished !== undefined) {
    payload.isPublished =
      body.isPublished === true || body.isPublished === "true";
  }
  return payload;
};

const requireProjectManager = async (req, res) => {
  const allowed = await userCanReviewBlog(req.user?.id);
  if (!allowed) {
    res.status(403).json({
      success: false,
      message: "Access denied. Requires a Lead, Head, or society core role.",
    });
    return false;
  }
  return true;
};

const requireProjectDeletionAccess = async (req, res) => {
  const allowed = await userCanDeleteOSProject(req.user?.id);
  if (!allowed) {
    res.status(403).json({
      success: false,
      message:
        "Access denied. Requires a Lead, Vice-Chairperson, Chairperson, or Faculty Incharge role.",
    });
    return false;
  }
  return true;
};

const handleControllerError = (res, error, action) => {
  console.error(`${action} open source project error:`, error);
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Invalid project details.",
      errors: Object.values(error.errors).map((item) => item.message),
    });
  }
  return res.status(500).json({
    success: false,
    message: `Failed to ${action} open source project.`,
  });
};

const createOSProject = async (req, res) => {
  try {
    if (!(await requireProjectManager(req, res))) return;

    const project = await OSProject.create({
      ...getProjectPayload(req.body),
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Open source project created successfully.",
      data: project,
    });
  } catch (error) {
    return handleControllerError(res, error, "create");
  }
};

const getOSProjects = async (req, res) => {
  try {
    const query = { isPublished: true };
    if (req.query.manage === "1") {
      if (!req.user || !(await requireProjectManager(req, res))) return;
      delete query.isPublished;
    }
    if (req.query.category) query.category = req.query.category;

    const projects = await OSProject.find(query).sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      success: true,
      data: projects.map(serializeProject),
    });
  } catch (error) {
    return handleControllerError(res, error, "fetch");
  }
};

const getOSProject = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.query.manage === "1") {
      if (!req.user || !(await requireProjectManager(req, res))) return;
    } else {
      query.isPublished = true;
    }
    const project = await OSProject.findOne(query).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Open source project not found.",
      });
    }
    return res.status(200).json({ success: true, data: serializeProject(project) });
  } catch (error) {
    return handleControllerError(res, error, "fetch");
  }
};

const updateOSProject = async (req, res) => {
  try {
    if (!(await requireProjectManager(req, res))) return;

    const updates = getProjectPayload(req.body);
    const project = await OSProject.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Open source project not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Open source project updated successfully.",
      data: project,
    });
  } catch (error) {
    return handleControllerError(res, error, "update");
  }
};

const deleteOSProject = async (req, res) => {
  try {
    const project = await OSProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Open source project not found.",
      });
    }

    const userId = req.user?.id;
    const isUploader =
      project.createdBy && String(project.createdBy) === String(userId);

    const user = await User.findById(userId).lean();
    const coreRoles = [
      "ADMIN",
      "Chairperson",
      "Vice-Chairperson",
      "Treasurer",
      "Faculty Incharge",
    ];
    const hasCore =
      user && coreRoles.includes(String(user.accountType || "").trim());

    if (!isUploader && !hasCore) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only the project uploader or society core members can delete this project.",
      });
    }

    await OSProject.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Open source project deleted successfully.",
    });
  } catch (error) {
    return handleControllerError(res, error, "delete");
  }
};

module.exports = {
  createOSProject,
  getOSProjects,
  getOSProject,
  updateOSProject,
  deleteOSProject,
};
