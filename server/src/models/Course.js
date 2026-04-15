const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  title: String,
  content: String,
  videoUrl: String,
  order: Number
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String, default: "" },
  difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  tags: [String],
  lessons: [lessonSchema],
  totalDuration: { type: Number, default: 0 }, // minutes
  enrolledCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);