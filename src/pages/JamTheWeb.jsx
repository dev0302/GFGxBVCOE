import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getJamTheWebTeams, submitJamTheWebScores, isSocietyRole } from "../services/api";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const JUDGES = ["Dev", "Siddhant", "Gaurav"];

export default function JamTheWeb() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortedByScore, setSortedByScore] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isSocietyRole(user.accountType)) {
      navigate("/", { replace: true });
      return;
    }
    getJamTheWebTeams()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        const withTotals = data.map((t) => ({
          ...t,
          totalScore:
            (t.totalScore != null
              ? t.totalScore
              : (t.judges?.Dev?.score || 0) +
                (t.judges?.Siddhant?.score || 0) +
                (t.judges?.Gaurav?.score || 0)),
        }));
        setTeams(withTotals);
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load Jam the Web data");
        setTeams([]);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const handleScoreChange = (teamId, judgeName, value) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team._id !== teamId) return team;
        const score = value === "" ? "" : Number(value);
        const judges = {
          ...(team.judges || {}),
          [judgeName]: {
            ...(team.judges?.[judgeName] || {}),
            score: Number.isNaN(score) ? 0 : score,
          },
        };
        const total =
          (judges.Dev?.score || 0) +
          (judges.Siddhant?.score || 0) +
          (judges.Gaurav?.score || 0);
        return { ...team, judges, totalScore: total };
      })
    );
  };

  const handleFeedbackChange = (teamId, judgeName, value) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team._id !== teamId) return team;
        const judges = {
          ...(team.judges || {}),
          [judgeName]: {
            ...(team.judges?.[judgeName] || {}),
            feedback: value,
          },
        };
        return { ...team, judges };
      })
    );
  };

  const handleSubmit = async () => {
    if (!teams.length) return;
    setSubmitting(true);
    try {
      const payload = teams.map((t) => ({
        _id: t._id,
        team_id: t.team_id,
        judges: JUDGES.reduce((acc, name) => {
          const j = t.judges?.[name] || {};
          acc[name] = {
            score: typeof j.score === "number" ? j.score : Number(j.score || 0),
            feedback: j.feedback || "",
          };
          return acc;
        }, {}),
      }));
      const res = await submitJamTheWebScores(payload);
      const data = Array.isArray(res.data) ? res.data : [];
      const withTotals = data.map((t) => ({
        ...t,
        totalScore:
          (t.totalScore != null
            ? t.totalScore
            : (t.judges?.Dev?.score || 0) +
              (t.judges?.Siddhant?.score || 0) +
              (t.judges?.Gaurav?.score || 0)),
      }));
      setTeams(withTotals);
      setSortedByScore(true);
      toast.success("Scores saved and teams sorted by total score");
    } catch (err) {
      toast.error(err.message || "Failed to submit scores");
    } finally {
      setSubmitting(false);
    }
  };

  const sortedTeams = useMemo(() => {
    if (!sortedByScore) {
      return [...teams].sort((a, b) => (a.team_id || 0) - (b.team_id || 0));
    }
    return [...teams].sort((a, b) => {
      if ((b.totalScore || 0) !== (a.totalScore || 0)) {
        return (b.totalScore || 0) - (a.totalScore || 0);
      }
      return (a.team_id || 0) - (b.team_id || 0);
    });
  }, [teams, sortedByScore]);

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Jam the Web — Results</h1>
            <p className="mt-1 text-gray-600">
              Enter scores from Dev, Siddhant and Gaurav.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSortedByScore((v) => !v)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortedByScore ? "By team ID" : "By score"}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || loading || !teams.length}
              className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? <Spinner className="size-4" /> : null}
              {submitting ? "Submitting…" : "Submit scores"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner className="size-8 text-green-600" />
          </div>
        ) : !teams.length ? (
          <div className="text-center py-16 text-gray-500">No teams found.</div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Keywords</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">Links</th>
                    {JUDGES.map((j) => (
                      <th key={j} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">{j}</th>
                    ))}
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedTeams.map((team, idx) => (
                    <tr key={team._id || team.team_id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {team.team_id ?? idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{team.team_name}</div>
                        <div className="text-sm text-gray-500">{team.email}</div>
                        {team.phone && <div className="text-xs text-gray-400">{team.phone}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{team.lead_name}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(team.keywords || []).map((kw) => (
                            <span key={kw} className="px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-600">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="flex flex-wrap gap-2">
                          {team.live_url && (
                            <a
                              href={team.live_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-100 text-green-800 text-sm font-medium hover:bg-green-200 transition-colors border border-green-200 hover:border-green-300"
                            >
                              <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Open project
                            </a>
                          )}
                          {team.repo_url && (
                            <a
                              href={team.repo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-200 hover:border-gray-300"
                            >
                              <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                              View code
                            </a>
                          )}
                        </div>
                      </td>
                      {JUDGES.map((judge) => {
                        const val = team.judges?.[judge]?.score ?? "";
                        const feedback = team.judges?.[judge]?.feedback ?? "";
                        return (
                          <td key={judge} className="px-6 py-4">
                            <div className="space-y-2">
                              <input
                                type="number"
                                min="0"
                                className="w-14 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                value={val}
                                onChange={(e) => handleScoreChange(team._id, judge, e.target.value)}
                              />
                              <textarea
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none min-h-[52px] placeholder:text-gray-400"
                                placeholder="Feedback"
                                value={feedback}
                                onChange={(e) => handleFeedbackChange(team._id, judge, e.target.value)}
                              />
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {team.totalScore || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {teams.length > 0 && (
          <p className="mt-4 text-sm text-gray-500">You can edit and re-submit anytime.</p>
        )}
      </div>
    </div>
  );
}

