import { useEffect, useMemo, useState } from "react";
import { QUIZ_META } from "../data/quizQuestions";
import { getLeaderboard } from "../services/api";

function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    getLeaderboard()
      .then(({ entries }) => setEntries(entries || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return entries;
    const q = query.toLowerCase();
    return entries.filter(
      (e) =>
        e.teamId.toLowerCase().includes(q) ||
        e.teamName.toLowerCase().includes(q) ||
        e.teamLead.toLowerCase().includes(q)
    );
  }, [entries, query]);

  const scoreMax = QUIZ_META?.totalQuestions ?? 15;
  const fmt = (ms) => {
    const total = Math.floor((ms || 0) / 1000);
    const mm = String(Math.floor(total / 60)).padStart(2, "0");
    const ss = String(total % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const medalFor = (rank) => {
    if (rank === 1) return { label: "Gold", cls: "from-amber-400 to-yellow-300" };
    if (rank === 2) return { label: "Silver", cls: "from-zinc-300 to-slate-200" };
    if (rank === 3) return { label: "Bronze", cls: "from-amber-700 to-orange-500" };
    return null;
  };

  return (
    <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-white">
      <div className="relative mb-8">
        <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-emerald-500/30 via-teal-400/20 to-green-500/30 -z-10 rounded-3xl" />
        <div className="bg-[#0b1220]/60 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-xl shadow-2xl shadow-emerald-900/20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-green-300 to-teal-200">Leaderboard</span>
              </h1>
              <p className="text-gray-300 mt-2">Top scores for the Tech Quiz • out of {scoreMax}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search team, ID or lead..."
                  className="bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 w-72"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔎</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-800 bg-[#0b1220]/60 backdrop-blur-xl">
        <div className="relative">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          <table className="min-w-full">
            <thead className="bg-[#0b1220]">
              <tr>
                <th className="px-6 py-4 text-left text-gray-300">Rank</th>
                <th className="px-6 py-4 text-left text-gray-300">Team</th>
                <th className="px-6 py-4 text-left text-gray-300">Team Lead</th>
                <th className="px-6 py-4 text-left text-gray-300">Score</th>
                <th className="px-6 py-4 text-left text-gray-300">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-gray-800">
                    <td className="px-6 py-5">
                      <div className="h-6 w-10 bg-gray-800/70 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 w-64 bg-gray-800/70 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 w-40 bg-gray-800/70 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 w-24 bg-gray-800/70 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 w-20 bg-gray-800/70 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-gray-400" colSpan={4}>No matching entries.</td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const medal = medalFor(row.rank);
                  const pct = Math.round((row.score / scoreMax) * 100);
                  return (
                    <tr key={row.rank} className="border-t border-gray-800 group hover:bg-[#0f172a]/60 transition-colors">
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full grid place-items-center bg-gradient-to-br ${medal ? medal.cls : "from-slate-700 to-slate-600"} text-[#0b1220] font-extrabold shadow-inner`}>{row.rank}</div>
                          {medal && (
                            <span className="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded-full border border-white/10">
                              {medal.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/30 grid place-items-center text-emerald-300 font-semibold">
                            {row.teamName?.slice(0,1) || row.teamId?.slice(0,1)}
                          </div>
                          <div>
                            <div className="font-semibold">{row.teamName}</div>
                            <div className="text-xs text-gray-400">{row.teamId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-gray-200">{row.teamLead}</span>
                        </span>
                      </td>
                  <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="text-emerald-400 font-semibold min-w-[64px]">{row.score}/{scoreMax}</div>
                          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                  <td className="px-6 py-4 text-gray-300">{fmt(row.timeMs)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 bg-[#0b1220]/60 border border-gray-800">
              <div className="h-6 w-24 bg-gray-800/70 rounded animate-pulse" />
              <div className="mt-3 h-5 w-40 bg-gray-800/70 rounded animate-pulse" />
              <div className="mt-2 h-5 w-28 bg-gray-800/70 rounded animate-pulse" />
              <div className="mt-4 h-2 w-full bg-gray-800/70 rounded animate-pulse" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-gray-400">No matching entries.</div>
        ) : (
          filtered.map((row) => {
            const medal = medalFor(row.rank);
            const pct = Math.round((row.score / scoreMax) * 100);
            return (
              <div key={row.rank} className="rounded-2xl p-4 bg-[#0b1220]/60 border border-gray-800 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full grid place-items-center bg-gradient-to-br ${medal ? medal.cls : "from-slate-700 to-slate-600"} text-[#0b1220] font-bold`}>{row.rank}</div>
                    <div>
                      <div className="font-semibold">{row.teamName}</div>
                      <div className="text-xs text-gray-400">{row.teamId}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-semibold">{row.score}/{scoreMax}</div>
                    <div className="text-xs text-gray-400">{fmt(row.timeMs)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {row.teamLead}
                </div>
                <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Leaderboard;


