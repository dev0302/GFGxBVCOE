const path = require("path");
const fs = require("fs");
const LeadershipDraftSession = require("../models/LeadershipDraftSession");
const User = require("../models/User");
const { buildPeopleList } = require("../controllers/leadershipTransitionController");
const {
  getActiveDraftSession,
  addPromotionToDraft,
  addEndSessionToDraft,
  removeChangeFromDraft,
  finalizeDraft,
  addApproval,
  removeApproval,
  discardDraft,
  applyDraftChanges,
  serializeSessionForClient,
  serializeApprovalStatus,
  upsertCollaborator,
} = require("../services/leadershipDraftService");
const { getUserApprovalInfo, resolveUserRoleLabel } = require("../utils/leadershipApproval");
const { REPORTS_DIR } = require("../utils/leadershipReportPdf");

async function buildUserCollaboratorInfo(userId) {
  const user = await User.findById(userId).populate("additionalDetails").lean();
  if (!user) return null;
  const approvalInfo = getUserApprovalInfo(user);
  return {
    userId: String(user._id),
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
    image: user.image || "",
    role: approvalInfo.role || resolveUserRoleLabel(user),
    department: approvalInfo.department || "",
  };
}

exports.getActiveDraft = async (req, res) => {
  try {
    const session = await getActiveDraftSession();
    const approvalStatus = session
      ? serializeApprovalStatus(session.approvals)
      : null;

    return res.status(200).json({
      success: true,
      data: session ? serializeSessionForClient(session) : null,
      approvalStatus,
    });
  } catch (error) {
    console.error("getActiveDraft error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.queuePromotion = async (req, res) => {
  try {
    const { personType, personId, sourceDepartment, targetPositionId } = req.body;
    if (!personType || !personId || !targetPositionId) {
      return res.status(400).json({
        success: false,
        message: "personType, personId, and targetPositionId are required.",
      });
    }

    const session = await addPromotionToDraft(req.user, {
      personType,
      personId,
      sourceDepartment,
      targetPositionId,
    });

    const data = await buildPeopleList();

    return res.status(200).json({
      success: true,
      message: "Promotion queued in draft session.",
      data,
      draft: serializeSessionForClient(session),
    });
  } catch (error) {
    console.error("queuePromotion error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.queueEndSession = async (req, res) => {
  try {
    const { personType, personId, sourceDepartment } = req.body;
    if (!personType || !personId) {
      return res.status(400).json({
        success: false,
        message: "personType and personId are required.",
      });
    }

    const session = await addEndSessionToDraft(req.user, {
      personType,
      personId,
      sourceDepartment,
    });

    const data = await buildPeopleList();

    return res.status(200).json({
      success: true,
      message: "Session end queued in draft session.",
      data,
      draft: serializeSessionForClient(session),
    });
  } catch (error) {
    console.error("queueEndSession error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.removeDraftChange = async (req, res) => {
  try {
    const { changeId } = req.params;
    const session = await removeChangeFromDraft(req.user, changeId);

    return res.status(200).json({
      success: true,
      message: "Change removed from draft.",
      draft: session ? serializeSessionForClient(session) : null,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.finalizeDraft = async (req, res) => {
  try {
    const session = await finalizeDraft(req.user);
    return res.status(200).json({
      success: true,
      message: "Draft session moved to approval.",
      draft: serializeSessionForClient(session),
      approvalStatus: serializeApprovalStatus(session.approvals),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.approveDraft = async (req, res) => {
  try {
    const { session, approvalStatus } = await addApproval(req.user);
    return res.status(200).json({
      success: true,
      message: approvalStatus.complete
        ? "All required approvals received."
        : "Approval recorded.",
      draft: serializeSessionForClient(session),
      approvalStatus,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.revokeApproval = async (req, res) => {
  try {
    const session = await removeApproval(req.user);
    return res.status(200).json({
      success: true,
      message: "Approval revoked.",
      draft: serializeSessionForClient(session),
      approvalStatus: serializeApprovalStatus(session.approvals),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.discardDraft = async (req, res) => {
  try {
    await discardDraft(req.user, req.body?.reason || "Draft discarded by user.");
    return res.status(200).json({
      success: true,
      message: "Draft session discarded.",
      draft: null,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.applyDraft = async (req, res) => {
  try {
    const { session, emailResults, serialized } = await applyDraftChanges(req.user, req);
    const data = await buildPeopleList();

    return res.status(200).json({
      success: true,
      message: "Leadership changes applied successfully.",
      data,
      draft: serialized,
      emailResults,
      reportDownloadUrl: `/api/v1/leadership-transition/draft/report/${session.sessionId}`,
    });
  } catch (error) {
    console.error("applyDraft error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await LeadershipDraftSession.findOne({ sessionId, status: "APPLIED" });
    if (!session?.reportPdfPath) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    const filepath = path.resolve(session.reportPdfPath);
    if (!filepath.startsWith(path.resolve(REPORTS_DIR)) || !fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: "Report file missing." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${session.sessionId}-report.pdf"`
    );
    return res.sendFile(filepath);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAppliedSessions = async (_req, res) => {
  try {
    const sessions = await LeadershipDraftSession.find({ status: "APPLIED" })
      .sort({ appliedAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      data: sessions.map((s) => ({
        sessionId: s.sessionId,
        createdByName: s.createdByName,
        appliedByName: s.appliedByName,
        appliedAt: s.appliedAt,
        changeCount: (s.pendingChanges || []).length,
        approvals: s.approvals || [],
        reportPdfPath: s.reportPdfPath || "",
        documentHash: s.documentHash || "",
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.registerCollaborator = async (req, res) => {
  try {
    const info = await buildUserCollaboratorInfo(req.user.id);
    if (!info) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const session = await getActiveDraftSession();
    if (session && session.status === "DRAFT") {
      upsertCollaborator(session, info);
      await session.save();
    }

    return res.status(200).json({ success: true, collaborator: info });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
