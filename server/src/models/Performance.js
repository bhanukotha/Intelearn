const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: "Contest" },
  accuracy: { type: Number, default: 0 },
  avgTime: { type: Number, default: 0 },
  wrongAttempts: { type: Number, default: 0 },
  difficultyAttempted: { type: String, default: "mixed" }
}, { timestamps: true });

module.exports = mongoose.model("Performance", performanceSchema);