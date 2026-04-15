// models/Discussion.js
const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content:   { type: String, required: true },
  upvotes:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

const discussionSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title:     { type: String, required: true },
  content:   { type: String, required: true },
  category:  { type: String, enum: ["General","DSA","Career","Contest","Interview","Courses","Feedback","Jobs"], default: "General" },
  tags:      [{ type: String }],
  upvotes:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  views:     { type: Number, default: 0 },
  replies:   [replySchema],
  isPinned:  { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Discussion", discussionSchema);