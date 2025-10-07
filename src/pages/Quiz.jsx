import { useEffect, useMemo, useRef, useState } from "react";
import { QUIZ_META } from "../data/quizQuestions";
import { getQuestions, submitQuiz, verifyTeam } from "../services/api";
import { useNavigate } from "react-router-dom";

function Quiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState('verify'); // verify | confirm | quiz | result
  const [teamId, setTeamId] = useState("");
  const [team, setTeam] = useState(null); // { teamId, teamName, teamLead }
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (step !== 'quiz') return;
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 250);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [step]);

  const fmt = (ms) => {
    const total = Math.floor(ms / 1000);
    const mm = String(Math.floor(total / 60)).padStart(2, "0");
    const ss = String(total % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const handleSelect = (qIndex, optionIndex) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optionIndex;
      return next;
    });
  };

  const computeScore = () => {
    let s = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].answerIndex) s += 1;
    }
    return s;
  };

  const handleSubmit = async () => {
    if (!teamId || !team?.teamId) return alert("Please verify your team first");
    const unanswered = answers.some((a) => a === null);
    if (unanswered && !confirm("Some questions are unanswered. Submit anyway?")) return;

    setSubmitting(true);
    try {
      const result = await submitQuiz({ teamId, answers, timeMs: elapsedMs });
      setScore(result.score);
      if (intervalRef.current) clearInterval(intervalRef.current);
      navigate('/quiz/result', { state: result });
    } catch (e) {
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!teamId) return alert('Enter Team ID');
    try {
      const t = await verifyTeam(teamId);
      setTeam(t);
      setStep('confirm');
    } catch (e) {
      alert('Team not found. Please re-enter.');
    }
  };

  const startQuiz = async () => {
    try {
      const { questions: qs } = await getQuestions();
      setQuestions(qs);
      setAnswers(Array(qs.length).fill(null));
      setElapsedMs(0);
      setStep('quiz');
    } catch (e) {
      alert('Failed to load questions');
    }
  };

  return (
    <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-white">
      {step === 'verify' && (
        <div className="mb-8 bg-[#0b1220]/60 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-xl">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-emerald-300 to-green-400">Verify Team</h1>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input value={teamId} onChange={(e) => setTeamId(e.target.value)} placeholder="Enter Team ID" className="sm:col-span-2 bg-[#1f2937] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <button onClick={handleVerify} className="py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg">Verify</button>
          </div>
        </div>
      )}

      {step === 'confirm' && team && (
        <div className="mb-8 bg-[#0b1220]/60 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-bold">Confirm Team Details</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><div className="text-sm text-gray-400">Team ID</div><div className="font-semibold">{team.teamId}</div></div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><div className="text-sm text-gray-400">Team Name</div><div className="font-semibold">{team.teamName}</div></div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><div className="text-sm text-gray-400">Team Lead</div><div className="font-semibold">{team.teamLead}</div></div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep('verify')} className="py-3 px-6 bg-white/10 border border-white/20 rounded-lg">Re-enter</button>
            <button onClick={startQuiz} className="py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg">Start Quiz</button>
          </div>
        </div>
      )}
      {step === 'quiz' && (
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-emerald-300 to-green-400">
          {QUIZ_META.quizTitle}
        </h1>
        <p className="text-gray-300 mt-2">{QUIZ_META.instructions}</p>
        <div className="mt-2 flex items-center gap-4 text-gray-300">
          <p className="text-gray-400">Team: <span className="font-semibold">{team?.teamName}</span> • Lead: <span className="font-semibold">{team?.teamLead}</span> • ID: {team?.teamId}</p>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Time: {fmt(elapsedMs)}</span>
          </div>
        </div>
      </div>
      )}

      {/* Removed redundant inputs with undefined state to prevent runtime error */}

      {step === 'quiz' && (
      <div className="space-y-6">
        {questions.map((q, qIndex) => (
          <div key={q.id} className="bg-[#111827] border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">Q{qIndex + 1}. {q.question}</h2>
              <span className="text-xs text-gray-400">{qIndex + 1}/{questions.length}</span>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.options.map((opt, optIndex) => {
                const selected = answers[qIndex] === optIndex;
                return (
                  <button
                    key={optIndex}
                    onClick={() => handleSelect(qIndex, optIndex)}
                    className={`text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                      selected
                        ? "bg-emerald-600/20 border-emerald-500 text-emerald-200"
                        : "bg-[#0b1220] border-gray-800 hover:border-gray-600"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      )}

      {step === 'quiz' && (
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full hover:from-green-400 hover:to-emerald-400 transition-all duration-300 shadow-xl hover:shadow-green-500/40"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Quiz;


