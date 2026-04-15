const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema({
  input:    { type: String, required: true },
  output:   { type: String, required: true },
  isHidden: { type: Boolean, default: false }
});

const problemSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  description:     { type: String, required: true },
  inputFormat:     { type: String, default: "" },
  outputFormat:    { type: String, default: "" },
  difficulty:      { type: String, enum: ["easy", "medium", "hard"], required: true },
  tags:            [{ type: String }],
  sampleTestCases: [testCaseSchema],
  hiddenTestCases: [testCaseSchema],
  constraints:     { type: String, default: "" },
  timeLimit:       { type: Number, default: 2 },
  memoryLimit:     { type: Number, default: 256 },
  totalSubmissions:    { type: Number, default: 0 },
  acceptedSubmissions: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Problem", problemSchema);