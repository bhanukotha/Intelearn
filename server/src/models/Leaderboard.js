const mongoose = require("mongoose");

const leaderboardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: "Contest" },
  score: { type: Number, default: 0 },
  rank: { type: Number },
  week: { type: String } // e.g. "2025-W02"
}, { timestamps: true });

module.exports = mongoose.model("Leaderboard", leaderboardSchema);