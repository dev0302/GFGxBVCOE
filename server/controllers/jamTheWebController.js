const JamTheWebTeam = require("../models/JamTheWebTeam");
const JamTheWebConfig = require("../models/JamTheWebConfig");

exports.getResultsDeclared = async (req, res) => {
  try {
    const doc = await JamTheWebConfig.findOne().lean();
    return res.status(200).json({ success: true, declared: !!doc?.resultsDeclared });
  } catch (error) {
    console.error("getResultsDeclared error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.declareResults = async (req, res) => {
  try {
    await JamTheWebConfig.findOneAndUpdate({}, { resultsDeclared: true }, { upsert: true, new: true });
    return res.status(200).json({ success: true, declared: true, message: "Results declared." });
  } catch (error) {
    console.error("declareResults error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getJamTeams = async (req, res) => {
  try {
    const sortBy = req.query.sort;
    let sort = { team_id: 1 };
    if (sortBy === "score") {
      sort = { totalScore: -1, team_name: 1 };
    }
    const teams = await JamTheWebTeam.find({}).sort(sort).lean();
    return res.status(200).json({ success: true, data: teams });
  } catch (error) {
    console.error("getJamTeams error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitJamScores = async (req, res) => {
  try {
    const { teams } = req.body || {};
    if (!Array.isArray(teams)) {
      return res.status(400).json({
        success: false,
        message: "Teams array is required.",
      });
    }

    const judgeNames = ["Dev", "Siddhant", "Gaurav"];

    const updatePromises = teams.map(async (incoming) => {
      const { _id, team_id, judges } = incoming || {};
      if (!_id && team_id == null) return null;

      const query = _id ? { _id } : { team_id };
      const doc = await JamTheWebTeam.findOne(query);
      if (!doc) return null;

      if (judges && typeof judges === "object") {
        doc.judges = doc.judges || {};
        for (const name of judgeNames) {
          const incomingJudge = judges[name];
          if (!incomingJudge) continue;

          const normalized = {
            score:
              typeof incomingJudge.score === "number"
                ? incomingJudge.score
                : Number(incomingJudge.score || 0),
            feedback:
              typeof incomingJudge.feedback === "string"
                ? incomingJudge.feedback
                : "",
          };

          if (!doc.judges[name]) doc.judges[name] = {};
          if (!Number.isNaN(normalized.score)) {
            doc.judges[name].score = normalized.score;
          }
          if (normalized.feedback !== undefined) {
            doc.judges[name].feedback = normalized.feedback;
          }
        }
      }

      doc.recalculateTotal();
      return doc.save();
    });

    await Promise.all(updatePromises);

    const sorted = await JamTheWebTeam.find({})
      .sort({ totalScore: -1, team_name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Scores saved successfully.",
      data: sorted,
    });
  } catch (error) {
    console.error("submitJamScores error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

