import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  teamId: { type: String, unique: true, index: true },
  teamName: String,
  teamLead: String
}, { timestamps: true });

export default mongoose.model('Team', TeamSchema);


