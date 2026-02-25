import { useCallback, useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { getJamTheWebTeams, getJamTheWebTeamsPublic, submitJamTheWebScores } from "../services/api";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const JUDGES = ["Dev", "Siddhant", "Gaurav"];

export default function JamTheWeb() {
  const { user, loading: authLoading } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortedByScore, setSortedByScore] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(null); // { team }

  const isViewOnly = !user;

  const fetchTeams = useCallback(() => {
    const fetcher = isViewOnly ? getJamTheWebTeamsPublic : getJamTheWebTeams;
    fetcher("id")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        const withTotals = data.map((t) => ({
          ...t,
          totalScore:
            t.totalScore != null
              ? t.totalScore
              : (t.judges?.Dev?.score || 0) +
                (t.judges?.Siddhant?.score || 0) +
                (t.judges?.Gaurav?.score || 0),
        }));
        setTeams(withTotals);
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load Jam the Web data");
        setTeams([]);
      })
      .finally(() => setLoading(false));
  }, [isViewOnly]);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    fetchTeams();
  }, [authLoading, isViewOnly, fetchTeams]);

  const handleScoreChange = (teamId, judgeName, value) => {
    if (isViewOnly) return;
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
    if (isViewOnly) return;
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
    if (isViewOnly || !teams.length) return;
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
          t.totalScore != null
            ? t.totalScore
            : (t.judges?.Dev?.score || 0) +
              (t.judges?.Siddhant?.score || 0) +
              (t.judges?.Gaurav?.score || 0),
      }));
      setTeams(withTotals);
      setSortedByScore(true);
      setFeedbackModal(null);
      toast.success("Scores saved");
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
    <div className="min-h-screen darkthemebg pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Jam the Web — Results</h1>
            <p className="mt-1 text-gray-400">
              {isViewOnly
                ? "View scores and feedback. Sign in to edit."
                : "Enter scores from Dev, Siddhant and Gaurav."}
            </p>
          </div>
          {!isViewOnly && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSortedByScore((v) => !v)}
                className="px-4 py-2 text-sm font-medium text-gray-200 bg-slate-700/80 border border-slate-600 rounded-lg hover:bg-slate-600/80"
              >
                {sortedByScore ? "By team ID" : "By score"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || loading || !teams.length}
                className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? <Spinner className="size-4" /> : null}
                {submitting ? "Submitting…" : "Submit scores"}
              </button>
            </div>
          )}
          {isViewOnly && (
            <button
              type="button"
              onClick={() => setSortedByScore((v) => !v)}
              className="px-4 py-2 text-sm font-medium text-gray-200 bg-slate-700/80 border border-slate-600 rounded-lg hover:bg-slate-600/80 w-fit"
            >
              {sortedByScore ? "By team ID" : "By score"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner className="size-8 text-green-400" />
          </div>
        ) : !teams.length ? (
          <div className="text-center py-16 text-gray-400">No teams found.</div>
        ) : (
          <div className="bg-slate-800/60 rounded-lg border border-slate-600/50 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-600/50">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">#</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Team</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Lead</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Keywords</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase min-w-[200px]">Links</th>
                    {JUDGES.map((j) => (
                      <th key={j} className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">{j}</th>
                    ))}
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600/40">
                  {sortedTeams.map((team, idx) => (
                    <tr key={team._id || team.team_id || idx} className={idx % 2 === 0 ? "bg-slate-800/40" : "bg-slate-700/30"}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {team.team_id ?? idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{team.team_name}</div>
                        <div className="text-sm text-gray-400">{team.email}</div>
                        {team.phone && <div className="text-xs text-gray-500">{team.phone}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{team.lead_name}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(team.keywords || []).map((kw) => (
                            <span key={kw} className="px-2 py-0.5 rounded bg-slate-600/60 text-xs text-gray-300">
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/20 text-green-300 text-sm font-medium hover:bg-green-500/30 transition-colors border border-green-500/40"
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-600/60 text-gray-300 text-sm font-medium hover:bg-slate-500/60 transition-colors border border-slate-500/50"
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
                            <div className="space-y-1.5">
                              {isViewOnly ? (
                                <span className="block text-sm font-medium text-white">{val !== "" ? val : "—"}</span>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  className="w-14 px-2 py-1.5 text-sm text-white bg-slate-700 border border-slate-600 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  value={val}
                                  onChange={(e) => handleScoreChange(team._id, judge, e.target.value)}
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => setFeedbackModal(team)}
                                className={`text-sm font-medium ${feedback ? "text-green-400 hover:text-green-300" : "text-gray-500 hover:text-gray-400"}`}
                              >
                                {feedback ? "View feedback" : isViewOnly ? "No feedback" : "Add feedback"}
                              </button>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 text-sm font-semibold text-white">
                        {team.totalScore || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isViewOnly && teams.length > 0 && (
          <p className="mt-4 text-sm text-gray-500">You can edit and re-submit anytime.</p>
        )}

        {isViewOnly && teams.length > 0 && (
          <p className="mt-4 text-sm text-gray-500">Sign in to edit scores and feedback.</p>
        )}
      </div>

      {/* Feedback Modal */}
      {feedbackModal && (() => {
        const team = teams.find((t) => t._id === feedbackModal._id) || feedbackModal;
        return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setFeedbackModal(null)}
        >
          <div
            className="bg-slate-800 rounded-xl shadow-xl border border-slate-600 max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-600 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Feedback — {team.team_name}</h3>
              <button
                type="button"
                onClick={() => setFeedbackModal(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-slate-700 hover:text-white"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-6">
              {JUDGES.map((judge) => {
                const val = team.judges?.[judge]?.score ?? "";
                const feedback = team.judges?.[judge]?.feedback ?? "";
                return (
                  <div key={judge} className="rounded-lg border border-slate-600 p-4 space-y-2 bg-slate-700/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{judge}</span>
                      <span className="text-sm font-medium text-gray-400">{val !== "" ? val : "—"}</span>
                    </div>
                    {isViewOnly ? (
                      <p className="text-sm text-gray-400 whitespace-pre-wrap min-h-[2rem]">
                        {feedback || "No feedback given."}
                      </p>
                    ) : (
                      <textarea
                        className="w-full px-3 py-2 text-sm text-white bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none min-h-[80px] placeholder:text-gray-500"
                        placeholder="Add feedback…"
                        value={feedback}
                        onChange={(e) => handleFeedbackChange(team._id, judge, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-slate-600 flex justify-end gap-2">
              {!isViewOnly && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Save & close"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setFeedbackModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                {isViewOnly ? "Close" : "Close without saving"}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
