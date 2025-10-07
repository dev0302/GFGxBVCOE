import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  teamId: { type: String, unique: true, index: true },
  teamName: String,
  teamLead: String,
  score: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Team', TeamSchema);

