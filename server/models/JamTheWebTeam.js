const mongoose = require("mongoose");

const judgeSchema = new mongoose.Schema(
  {
    score: { type: Number, default: 0 },
    feedback: { type: String, default: "" },
  },
  { _id: false }
);

const jamTheWebTeamSchema = new mongoose.Schema(
  {
    team_id: { type: Number },
    team_name: { type: String },
    lead_name: { type: String },
    keywords: [{ type: String }],
    timestamp: { type: String },
    email: { type: String },
    phone: { type: String },
    live_url: { type: String },
    repo_url: { type: String },
    judges: {
      Dev: { type: judgeSchema, default: () => ({}) },
      Siddhant: { type: judgeSchema, default: () => ({}) },
      Gaurav: { type: judgeSchema, default: () => ({}) },
    },
    totalScore: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: "jamthewebdata",
  }
);

jamTheWebTeamSchema.methods.recalculateTotal = function recalculateTotal() {
  const dev = this.judges?.Dev?.score || 0;
  const siddhant = this.judges?.Siddhant?.score || 0;
  const gaurav = this.judges?.Gaurav?.score || 0;
  this.totalScore = dev + siddhant + gaurav;
};

jamTheWebTeamSchema.pre("save", function handlePreSave(next) {
  this.recalculateTotal();
  next();
});

module.exports = mongoose.model("JamTheWebTeam", jamTheWebTeamSchema);

