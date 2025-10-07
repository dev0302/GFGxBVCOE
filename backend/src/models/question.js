import mongoose from 'mongoose'
const quizSchema = new mongoose.Schema({
  description: String,
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Quiz', quizSchema);