import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Github,
  LoaderCircle,
  RefreshCw,
  Trophy,
} from "lucide-react";
import {
  getOSContributorLeaderboard,
  syncOSContributor,
} from "../../services/api";

const medalStyles = {
  1: "border-amber-300/50 bg-amber-300/10 text-amber-200",
  2: "border-slate-300/40 bg-slate-300/10 text-slate-200",
  3: "border-orange-400/40 bg-orange-400/10 text-orange-200",
};

function OpenSourceLeaderboard() {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getStoredGithubName = () => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("gfg_open_source_contributor") || "null",
        )?.github_name || ""
      );
    } catch {
      return "";
    }
  };

  const loadLeaderboard = () => {
    setLoading(true);
    setError("");
    let active = true;
    const storedGithubName = getStoredGithubName();
    const syncPromise = storedGithubName
      ? syncOSContributor(storedGithubName)
      : Promise.resolve();
    syncPromise
      .then(() => getOSContributorLeaderboard())
      .then((data) => {
        if (active) setContributors(data);
      })
      .catch((requestError) => {
        if (active)
          setError(requestError.message || "Failed to load leaderboard");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => loadLeaderboard(), []);

  return (
    <div className="min-h-screen bg-[#242435] px-5 pb-20 pt-24 text-[#f8f4e9] sm:px-8 lg:px-12">
      <main className="mx-auto max-w-[1210px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/open-source"
            className="inline-flex items-center gap-2 text-sm text-[#a9a8bc] transition hover:text-white"
          >
            <ArrowLeft size={17} /> Back to projects
          </Link>
          <div className="flex items-center gap-3 text-sm text-emerald-300">
            <Trophy size={17} /> Open Source Program
            <button
              type="button"
              onClick={loadLeaderboard}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#10101a] px-3 py-2 text-xs text-[#d0ced8] transition hover:border-emerald-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <header className="mt-12 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-400/80">
            Contributor rankings
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#fffaf0] sm:text-5xl">
            Open Source Leaderboard
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#a9a8bc] sm:text-base">
            Contributors are ranked by points, then merged advanced,
            intermediate, and beginner contributions.
          </p>
        </header>

        <section className="mt-10 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#1b1b2a]/80 shadow-2xl shadow-black/20 backdrop-blur-xl">
          {loading && (
            <div className="flex items-center justify-center gap-3 px-6 py-20 text-[#a9a8bc]">
              <LoaderCircle size={18} className="animate-spin" /> Loading
              contributors...
            </div>
          )}
          {!loading && error && (
            <p className="px-6 py-20 text-center text-red-300">{error}</p>
          )}
          {!loading && !error && contributors.length === 0 && (
            <p className="px-6 py-20 text-center text-[#a9a8bc]">
              No connected contributors yet.
            </p>
          )}
          {!loading && !error && contributors.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-white/[0.08] bg-[#151522] text-xs uppercase tracking-wider text-[#77768b]">
                  <tr>
                    <th className="px-5 py-4">Rank</th>
                    <th className="px-5 py-4">Contributor</th>
                    <th className="px-5 py-4">Points</th>
                    <th className="px-5 py-4">Advanced</th>
                    <th className="px-5 py-4">Intermediate</th>
                    <th className="px-5 py-4">Beginner</th>
                  </tr>
                </thead>
                <tbody>
                  {contributors.map((contributor) => {
                    const counts = contributor.total_contributions || {};
                    return (
                      <tr
                        key={contributor.github_name}
                        className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-5">
                          <span
                            className={`inline-grid h-9 w-9 place-items-center rounded-full border text-sm font-bold ${medalStyles[contributor.rank] || "border-white/10 bg-white/[0.04] text-[#b8b6c7]"}`}
                          >
                            {contributor.rank}
                          </span>
                        </td>
                        <td className="px-5 py-5">
                          <a
                            href={
                              contributor.github_profile_url ||
                              `https://github.com/${contributor.github_name}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 font-semibold text-[#fffaf0] hover:text-emerald-300"
                          >
                            {contributor.github_avatar_url ? (
                              <img
                                src={contributor.github_avatar_url}
                                alt=""
                                className="h-8 w-8 rounded-full border border-emerald-300/30 object-cover"
                              />
                            ) : (
                              <span className="grid h-8 w-8 place-items-center rounded-full border border-emerald-300/30 bg-emerald-400/10">
                                <Github
                                  size={16}
                                  className="text-emerald-400"
                                />
                              </span>
                            )}
                            {contributor.github_name}
                          </a>
                        </td>
                        <td className="px-5 py-5 font-bold text-emerald-300">
                          {contributor.points || 0}
                        </td>
                        <td className="px-5 py-5 text-[#f0c98d]">
                          {counts.advanced || 0}
                        </td>
                        <td className="px-5 py-5 text-[#b8d7ef]">
                          {counts.intermediate || 0}
                        </td>
                        <td className="px-5 py-5 text-[#b9d9bc]">
                          {counts.beginner || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default OpenSourceLeaderboard;
