import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Team from './models/Team.js';
import Submission from './models/Submission.js';
import { QUESTIONS } from './questions.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({ origin: (process.env.CORS_ORIGIN?.split(',')) || ['http://localhost:5173'] }));

mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB || 'gfgquiz' });

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/auth/team/verify', async (req, res) => {
  const { teamId } = req.body || {};
  if (!teamId) return res.status(400).json({ error: 'teamId required' });
  const team = await Team.findOne({ teamId }).lean();
  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json({ teamId: team.teamId, teamName: team.teamName, teamLead: team.teamLead });
});

app.get('/api/quiz/questions', (req, res) => {
  res.json({ questions: QUESTIONS.map(q => ({ id: q.id, question: q.question, options: q.options })) });
});

function computeScore(serverQuestions, answers) {
  let score = 0;
  for (let i = 0; i < serverQuestions.length; i++) {
    if (answers?.[i] === serverQuestions[i].answerIndex) score++;
  }
  return score;
}

function computePoints(serverQuestions, answers, perCorrect = 4) {
  let correct = 0;
  for (let i = 0; i < serverQuestions.length; i++) {
    if (answers?.[i] === serverQuestions[i].answerIndex) correct++;
  }
  return { points: correct * perCorrect, correctCount: correct };
}

app.post('/api/quiz/submit', async (req, res) => {
  const { teamId, answers, timeMs } = req.body || {};
  if (!teamId || !Array.isArray(answers) || typeof timeMs !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const team = await Team.findOne({ teamId }).lean();
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const score = computeScore(QUESTIONS, answers);
  const { points, correctCount } = computePoints(QUESTIONS, answers);
  await Submission.create({ teamId, score, timeMs, points, correctCount });

  res.json({ score, timeMs, teamId, teamName: team.teamName, teamLead: team.teamLead, points, correctCount });
});

app.get('/api/leaderboard', async (req, res) => {
  const latest = await Submission.aggregate([
    { $sort: { score: -1, timeMs: 1, submittedAt: 1 } },
    { $group: { _id: '$teamId', teamId: { $first: '$teamId' }, score: { $first: '$score' }, timeMs: { $first: '$timeMs' } } },
    { $sort: { score: -1, timeMs: 1 } },
    { $limit: 200 }
  ]);

  const teamIds = latest.map(r => r.teamId);
  const teams = await Team.find({ teamId: { $in: teamIds } }).lean();
  const teamMap = new Map(teams.map(t => [t.teamId, t]));

  const entries = latest.map((r, idx) => ({
    rank: idx + 1,
    teamId: r.teamId,
    teamName: teamMap.get(r.teamId)?.teamName || '',
    teamLead: teamMap.get(r.teamId)?.teamLead || '',
    score: r.score,
    timeMs: r.timeMs
  }));

  res.json({ entries });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API running on ${port}`));


