import { useLocation, useNavigate } from "react-router-dom";
import { useFeatureFlags } from "../context/FeatureFlags.jsx";

function fmt(ms) {
  const total = Math.floor((ms || 0) / 1000);
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function QuizResult() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const data = state || {};
  const { leaderboardEnabled } = useFeatureFlags();

  return (
    <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-white">
      <div className="bg-[#0b1220]/60 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-xl">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-green-300 to-teal-200">Quiz Result</h1>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-200">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm text-gray-400">Team Name</div>
            <div className="font-semibold">{data.teamName}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm text-gray-400">Team Lead</div>
            <div className="font-semibold">{data.teamLead}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm text-gray-400">Team ID</div>
            <div className="font-semibold">{data.teamId}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm text-gray-400">Time Taken</div>
            <div className="font-semibold text-emerald-300">{fmt(data.timeMs)}</div>
          </div>
        </div>
        <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-sm text-gray-400">Score (correct answers)</div>
          <div className="text-2xl font-extrabold text-emerald-400">{data.score}</div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm text-gray-400">Correct Answers (+4)</div>
            <div className="font-semibold text-emerald-300">{data.correctCount}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm text-gray-400">Points (4/-1/0)</div>
            <div className="font-semibold text-emerald-300">{data.points}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm text-gray-400">Wrong Answers (-1)</div>
            <div className="font-semibold text-red-300">{data.wrongCount ?? 0}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm text-gray-400">Unanswered (0)</div>
            <div className="font-semibold text-gray-300">{data.unansweredCount ?? 0}</div>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <button onClick={() => navigate('/')} className="py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full hover:from-green-400 hover:to-emerald-400 transition-all duration-300 shadow-xl hover:shadow-green-500/40">Home</button>
          <button onClick={() => navigate('/team')} className="py-3 px-6 bg-white/10 border border-white/20 text-white font-semibold rounded-full hover:bg-white/15 transition-all">Team</button>
          {leaderboardEnabled && (
            <button onClick={() => navigate('/leaderboard')} className="py-3 px-6 bg-white/10 border border-white/20 text-white font-semibold rounded-full hover:bg-white/15 transition-all">View Leaderboard</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuizResult;


