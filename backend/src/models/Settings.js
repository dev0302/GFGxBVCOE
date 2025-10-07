import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, index: true, required: true },
  leaderboardEnabled: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Settings', SettingsSchema);


