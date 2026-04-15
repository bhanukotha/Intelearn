const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  guardianEmail: { type: String, default: "" },
  guardianPhone: { type: String, default: "" },
  role: { type: String, enum: ["student", "guardian", "admin"], default: "student" },
  isAdmin: { type: Boolean, default: false },   // ← single admin flag
  rating: { type: Number, default: 1000 },
  avatar: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);