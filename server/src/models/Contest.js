const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  problems:    [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],
  contestType: { type: String, enum: ["daily", "weekly"], default: "daily" },
  contestDay:  { type: String }, // "2026-04-02" for daily, "2026-W14-WED" or "2026-W14-SUN" for weekly
  weekSlot:    { type: String, enum: ["WED", "SUN", ""], default: "" }, // which weekly slot
  difficulty:  { type: String, enum: ["easy", "medium", "hard", "mixed"], required: true },
  startTime:   { type: Date, required: true },
  endTime:     { type: Date, required: true },
  durationMinutes: { type: Number, default: 60 },
  totalQuestions:  { type: Number, default: 1 },
  score:       { type: Number, default: 0 },
  status:      { type: String, enum: ["upcoming", "ongoing", "completed", "missed"], default: "upcoming" }
}, { timestamps: true });

module.exports = mongoose.model("Contest", contestSchema);