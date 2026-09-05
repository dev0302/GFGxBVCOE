const crypto = require("crypto");
const OSContributor = require("../models/OSContributor");
const OSProject = require("../models/OSProject");

const getOAuthRedirectUri = () =>
  process.env.GITHUB_OAUTH_REDIRECT_URI ||
  "http://localhost:8080/api/v1/open-source/contributors/github/callback";

const createOAuthState = () => {
  const value = `${Date.now()}.${crypto.randomBytes(24).toString("hex")}`;
  const signature = crypto
    .createHmac("sha256", process.env.JWT_SECRET || "open-source-github")
    .update(value)
    .digest("hex");
  return `${value}.${signature}`;
};

const validOAuthState = (state) => {
  const [timestamp, nonce, signature] = String(state || "").split(".");
  if (!timestamp || !nonce || !signature) return false;
  if (Date.now() - Number(timestamp) > 10 * 60 * 1000) return false;
  const expected = crypto
    .createHmac("sha256", process.env.JWT_SECRET || "open-source-github")
    .update(`${timestamp}.${nonce}`)
    .digest("hex");
  return (
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  );
};

const startGithubOAuth = (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: "GitHub login is missing server OAuth credentials.",
    });
  }
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: getOAuthRedirectUri(),
    scope: "read:user",
    state: createOAuthState(),
  });
  return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
};

const githubOAuthCallback = async (req, res) => {
  const frontendOrigin = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  ).replace(/\/$/, "");
  const sendResult = (payload) =>
    res.type("html").send(`<!doctype html><script>
    window.opener && window.opener.postMessage(${JSON.stringify({ type: "GFG_GITHUB_RESULT", ...payload })}, ${JSON.stringify(frontendOrigin)});
    window.close();
  </script>`);

  try {
    if (!validOAuthState(req.query.state)) {
      return sendResult({
        success: false,
        message: "Invalid or expired GitHub login request.",
      });
    }
    if (req.query.error) {
      return sendResult({
        success: false,
        message: "GitHub login was cancelled.",
      });
    }

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: req.query.code,
          redirect_uri: getOAuthRedirectUri(),
        }),
      },
    );
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(
        tokenData.error_description || "GitHub token exchange failed.",
      );
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "GFG-BVCOE-open-source-program",
      },
    });
    const githubUser = await userResponse.json();
    if (!userResponse.ok || !githubUser.login) {
      throw new Error("GitHub username could not be read.");
    }

    const github_name = normalizeGithubName(githubUser.login);
    const contributionData = await getGithubContributions(
      github_name,
      tokenData.access_token,
    );
    const contributor = await OSContributor.findOneAndUpdate(
      { github_name },
      {
        $set: {
          github_name,
          ...contributionData,
          last_synced_at: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return sendResult({
      success: true,
      github_name: contributor.github_name,
      github_profile_url: contributor.github_profile_url,
      github_avatar_url: contributor.github_avatar_url,
      total_contributions: contributor.total_contributions,
      points: contributor.points,
      repository_results: contributionData.repository_results,
    });
  } catch (error) {
    console.error("GitHub OAuth error:", error.message);
    return sendResult({
      success: false,
      message: "Could not complete GitHub login.",
    });
  }
};

const POINTS_BY_DIFFICULTY = {
  beginner: 1,
  intermediate: 3,
  advanced: 5,
};

const normalizeGithubName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeGithubRepository = (value) => {
  const repository = String(value || "")
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/$/, "")
    .toLowerCase();
  return /^[\w.-]+\/[\w.-]+$/.test(repository) ? repository : null;
};

const githubRequest = async (path, accessToken = null) => {
  const baseHeaders = {
    Accept: "application/vnd.github+json",
    "User-Agent": "GFG-BVCOE-open-source-program",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const headers = accessToken
    ? { ...baseHeaders, Authorization: `Bearer ${accessToken}` }
    : baseHeaders;
  let response = await fetch(`https://api.github.com${path}`, { headers });

  // A stale server token should not prevent public GitHub data from refreshing.
  if ((response.status === 401 || response.status === 403) && accessToken) {
    response = await fetch(`https://api.github.com${path}`, {
      headers: baseHeaders,
    });
  }
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(
      errorBody.message || `GitHub API returned ${response.status}.`,
    );
    error.status = response.status;
    throw error;
  }
  return response.json();
};

const getMergedPullRequestCount = async (
  repository,
  githubName,
  accessToken,
) => {
  const pulls = await githubRequest(
    `/repos/${repository}/pulls?state=closed&per_page=100`,
    accessToken,
  );
  return pulls.filter(
    (pullRequest) =>
      pullRequest.merged_at &&
      normalizeGithubName(pullRequest.user?.login) === githubName,
  ).length;
};

const getGithubContributions = async (githubName, accessToken = null) => {
  const githubUser = await githubRequest(
    `/users/${encodeURIComponent(githubName)}`,
    accessToken,
  );
  const projects = await OSProject.find({ isPublished: true })
    .select("repository difficultyLevel")
    .lean();

  const repositories = new Map();
  projects.forEach((project) => {
    const repository = normalizeGithubRepository(project.repository);
    if (repository && !repositories.has(repository)) {
      repositories.set(repository, project.difficultyLevel);
    }
  });

  const totalContributions = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
    total: 0,
  };
  const repositoryResults = [];

  for (const [repository, difficulty] of repositories) {
    const category = POINTS_BY_DIFFICULTY[difficulty] ? difficulty : "beginner";
    const count = await getMergedPullRequestCount(
      repository,
      githubName,
      accessToken,
    );
    repositoryResults.push({ repository, difficulty: category, count });
    totalContributions[category] += count;
    totalContributions.total += count;
  }

  return {
    github_profile_url:
      githubUser.html_url || `https://github.com/${githubName}`,
    github_avatar_url: githubUser.avatar_url || "",
    total_contributions: totalContributions,
    points:
      totalContributions.beginner * POINTS_BY_DIFFICULTY.beginner +
      totalContributions.intermediate * POINTS_BY_DIFFICULTY.intermediate +
      totalContributions.advanced * POINTS_BY_DIFFICULTY.advanced,
    repository_results: repositoryResults,
  };
};

const connectContributor = async (req, res) => {
  try {
    const github_name = normalizeGithubName(
      req.body?.github_name || req.body?.githubName,
    );
    if (!/^[a-z\d](?:[a-z\d-]{0,37})$/i.test(github_name)) {
      return res.status(400).json({
        success: false,
        message: "A valid GitHub username is required.",
      });
    }

    const contributionData = await getGithubContributions(github_name);
    const update = {
      github_name,
      ...contributionData,
      last_synced_at: new Date(),
    };
    if (req.body?.email_id !== undefined) update.email_id = req.body.email_id;
    if (req.body?.emailId !== undefined) update.email_id = req.body.emailId;
    if (req.body?.contact !== undefined) update.contact = req.body.contact;
    if (req.user?.id && !req.user.isDepartmentMember)
      update.user_id = req.user.id;

    const contributor = await OSContributor.findOneAndUpdate(
      { github_name },
      { $set: update },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return res.status(200).json({
      success: true,
      message: "GitHub account connected successfully.",
      data: contributor,
    });
  } catch (error) {
    console.error("Connect open source contributor error:", error);
    if (error.status === 404) {
      return res
        .status(404)
        .json({ success: false, message: "GitHub user not found." });
    }
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid contributor details." });
    }
    return res.status(502).json({
      success: false,
      message: "Could not sync contributions from GitHub.",
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

const syncContributorByGithubName = async (githubName) => {
  const github_name = normalizeGithubName(githubName);
  if (!/^[a-z\d](?:[a-z\d-]{0,37})$/i.test(github_name)) {
    throw new Error("Invalid GitHub username.");
  }
  const contributionData = await getGithubContributions(github_name);
  return OSContributor.findOneAndUpdate(
    { github_name },
    {
      $set: {
        github_name,
        ...contributionData,
        last_synced_at: new Date(),
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();
};

const refreshContributorScore = async (contributor) => {
  return syncContributorByGithubName(contributor.github_name);
};

const syncContributor = async (req, res) => {
  try {
    const contributor = await syncContributorByGithubName(
      req.params.githubName,
    );
    return res.status(200).json({ success: true, data: contributor });
  } catch (error) {
    console.error("Sync open source contributor error:", error.message);
    return res.status(502).json({
      success: false,
      message: error.message || "Could not sync GitHub contributions.",
    });
  }
};

const getContributorLeaderboard = async (req, res) => {
  try {
    let syncError = null;
    if (req.query.github_name) {
      try {
        await syncContributorByGithubName(req.query.github_name);
      } catch (error) {
        syncError = error.message;
        console.error("Sync requested contributor failed:", error.message);
      }
    }
    const storedContributors = await OSContributor.find({
      github_name: { $exists: true, $ne: "" },
    }).lean();

    const refreshedContributors = await Promise.all(
      storedContributors.map(async (contributor) => {
        try {
          return await refreshContributorScore(contributor);
        } catch (error) {
          console.error(
            `Refresh contribution score failed for ${contributor.github_name}:`,
            error.message,
          );
          return contributor;
        }
      }),
    );

    const contributors = refreshedContributors
      .sort((left, right) => {
        const leftCounts = left.total_contributions || {};
        const rightCounts = right.total_contributions || {};
        return (
          (right.points || 0) - (left.points || 0) ||
          (rightCounts.advanced || 0) - (leftCounts.advanced || 0) ||
          (rightCounts.intermediate || 0) - (leftCounts.intermediate || 0) ||
          (rightCounts.beginner || 0) - (leftCounts.beginner || 0) ||
          left.github_name.localeCompare(right.github_name)
        );
      })
      .map((contributor) => ({
        github_name: contributor.github_name,
        github_profile_url: contributor.github_profile_url,
        github_avatar_url: contributor.github_avatar_url,
        points: contributor.points,
        total_contributions: contributor.total_contributions,
        last_synced_at: contributor.last_synced_at,
      }));

    return res.status(200).json({
      success: true,
      syncError,
      data: contributors.map((contributor, index) => ({
        ...contributor,
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
  connectContributor,
  getContributor,
  syncContributor,
  getContributorLeaderboard,
  startGithubOAuth,
  githubOAuthCallback,
};
