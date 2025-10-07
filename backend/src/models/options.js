import mongoose from 'mongoose';
import Question from './question.js';
const optionSchema = new mongoose.Schema({
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  option_text: { type: String, required: true },
  is_correct: { type: Boolean, default: false }
});

export default mongoose.model('Option', optionSchema);