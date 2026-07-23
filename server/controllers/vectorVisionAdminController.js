const Member = require("../models/Member");

exports.getPendingMembers = async (_req, res) => {
  try {
    const members = await Member.find({ processed: false })
      .select("name email rollNumber imageUrls enrolledAt")
      .sort({ enrolledAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: members, pendingCount: members.length });
  } catch (error) {
    console.error("getPendingMembers error:", error);
    return res.status(500).json({ success: false, message: "Could not load pending registrations." });
  }
};

exports.triggerIngestion = async (req, res) => {
  const token = process.env.GITHUB_ACTIONS_TOKEN;
  const repository = process.env.GITHUB_ACTIONS_REPOSITORY;
  const eventType = process.env.GITHUB_DISPATCH_EVENT || "trigger_batch_ingestion";

  if (!token || !repository) {
    return res.status(503).json({
      success: false,
      message: "The ingestion pipeline is not configured on this server.",
    });
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: eventType,
          client_payload: {
            source: "gfg-bvcoe-vectorvision-admin",
            requested_by: String(req.user?.id || ""),
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("GitHub repository dispatch failed:", response.status, await response.text());
      return res.status(502).json({ success: false, message: "GitHub Actions did not accept the ingestion request." });
    }

    return res.status(202).json({ success: true, message: "Ingestion pipeline triggered." });
  } catch (error) {
    console.error("triggerIngestion error:", error);
    return res.status(502).json({ success: false, message: "Could not reach GitHub Actions." });
  }
};
