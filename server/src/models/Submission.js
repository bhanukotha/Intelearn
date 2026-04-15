const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: "Contest", default: null },
  language: { type: String, required: true },
  languageId: { type: Number },
  code: { type: String, required: true },
  verdict: {
    type: String,
    enum: ["AC", "WA", "TLE", "RE", "CE", "Pending"],
    default: "Pending"
  },
  timeTaken: { type: Number, default: 0 } // seconds
}, { timestamps: true });

module.exports = mongoose.model("Submission", submissionSchema);