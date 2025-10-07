import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  teamId: { type: String, index: true, required: true },
  score: { type: Number, required: true },
  timeMs: { type: Number, required: true },
  points: { type: Number, required: false, default: 0 },
  correctCount: { type: Number, required: false, default: 0 },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

SubmissionSchema.index({ teamId: 1, submittedAt: -1 });

export default mongoose.model('Submission', SubmissionSchema);


