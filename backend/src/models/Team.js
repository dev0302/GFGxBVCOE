import mongoose from 'mongoose';

mongoose.connect(process., {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ Connection error:", err));


const TeamSchema = new mongoose.Schema({
  teamId: { type: String, unique: true, index: true },
  teamName: String,
  teamLead: String,
  score: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Team', TeamSchema);

