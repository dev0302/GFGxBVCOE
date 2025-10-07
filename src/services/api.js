const BASE = import.meta.env.VITE_API_BASE_URL;

export async function verifyTeam(teamId) {
  const res = await fetch(`${BASE}/api/auth/team/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId })
  });
  if (!res.ok) throw new Error('Team not found');
  return res.json();
}

export async function getQuestions() {
  const res = await fetch(`${BASE}/api/quiz/questions`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json(); // { questions }
}

export async function submitQuiz({ teamId, answers, timeMs }) {
  const res = await fetch(`${BASE}/api/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId, answers, timeMs })
  });
  if (!res.ok) throw new Error('Submit failed');
  return res.json(); // { score, timeMs, teamId, teamName, teamLead }
}

export async function getLeaderboard() {
  const res = await fetch(`${BASE}/api/leaderboard`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json(); // { entries }
}


