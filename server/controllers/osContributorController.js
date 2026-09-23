const OSContributor = require("../models/OSContributor");

const normalizeGithubName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const createOrUpdateContributor = async (req, res) => {
  const github_name = normalizeGithubName(req.body?.github_name);
  const points = req.body?.points;
  const total_contributions = req.body?.total_contributions;

  if (!/^[a-z\d](?:[a-z\d-]{0,37})$/i.test(github_name)) {
    return res.status(400).json({
      success: false,
      message: "A valid GitHub username is required.",
    });
  }

  if (
    points === undefined ||
    points === null ||
    points === "" ||
    !Number.isFinite(Number(points)) ||
    Number(points) < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "A non-negative points value is required.",
    });
  }

  if (
    !total_contributions ||
    Array.isArray(total_contributions) ||
    typeof total_contributions !== "object"
  ) {
    return res.status(400).json({
      success: false,
      message: "total_contributions must be an object.",
    });
  }

  const contributionFields = [
    "beginner",
    "intermediate",
    "capstone",
    "advanced",
    "total",
  ];
  for (const field of contributionFields) {
    if (
      total_contributions[field] !== undefined &&
      (!Number.isInteger(Number(total_contributions[field])) ||
        Number(total_contributions[field]) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: `total_contributions.${field} must be a non-negative integer.`,
      });
    }
  }

  if (total_contributions.total === undefined) {
    return res.status(400).json({
      success: false,
      message: "total_contributions.total is required.",
    });
  }

  const insertOnlyFields = {};
  for (const field of [
    "github_avatar_url",
    "email_id",
    "contact",
  ]) {
    if (req.body?.[field] !== undefined)
      insertOnlyFields[field] = req.body[field];
  }

  try {
    const contributor = await OSContributor.findOneAndUpdate(
      { github_name },
      {
        $set: {
          points: Number(points),
          "total_contributions.total": Number(total_contributions.total),
        },
        $setOnInsert: {
          github_name,
          ...insertOnlyFields,
          ...(total_contributions.beginner !== undefined && {
            "total_contributions.beginner": Number(
              total_contributions.beginner,
            ),
          }),
          ...(total_contributions.intermediate !== undefined && {
            "total_contributions.intermediate": Number(
              total_contributions.intermediate,
            ),
          }),
          ...(total_contributions.capstone !== undefined && {
            "total_contributions.capstone": Number(
              total_contributions.capstone,
            ),
          }),
          ...(total_contributions.advanced !== undefined && {
            "total_contributions.advanced": Number(
              total_contributions.advanced,
            ),
          }),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Contributor created or points updated successfully.",
      data: contributor,
    });
  } catch (error) {
    console.error("Create or update open source contributor error:", error);
    if (error.name === "ValidationError" || error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Invalid contributor details.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Could not create or update contributor.",
    });
  }
};

const getContributor = async (req, res) => {
  const contributor = await OSContributor.findOne({
    github_name: normalizeGithubName(req.params.githubName),
  }).lean();
  if (!contributor) {
    return res
      .status(404)
      .json({ success: false, message: "Contributor not found." });
  }
  return res.status(200).json({ success: true, data: contributor });
};

const getContributorLeaderboard = async (req, res) => {
  try {
    const storedContributors = await OSContributor.find({
      github_name: { $exists: true, $ne: "" },
    }).lean();
    const contributors = storedContributors;
    contributors.sort(
      (left, right) =>
        (right.points || 0) - (left.points || 0) ||
        left.github_name.localeCompare(right.github_name),
    );
    return res.status(200).json({
      success: true,
      data: contributors.map((contributor, index) => ({
        github_name: contributor.github_name,
        github_avatar_url: contributor.github_avatar_url,
        points: contributor.points,
        total_contributions: contributor.total_contributions,
        last_synced_at: contributor.last_synced_at,
        rank: index + 1,
      })),
    });
  } catch (error) {
    console.error("Fetch open source contributor leaderboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load contributor leaderboard.",
    });
  }
};

module.exports = {
  createOrUpdateContributor,
  getContributor,
  getContributorLeaderboard,
};
