const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
const app = express();
app.use(cors({ origin: "http://localhost:3000", methods: ["GET","POST","PUT","DELETE"], allowedHeaders: ["Content-Type","Authorization"] }));
app.use(express.json({ limit: "2mb" }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) return res.status(400).json({ message: "Invalid JSON body" });
  next(err);
});
const authRoutes          = require("./routes/authRoutes");
const userRoutes          = require("./routes/userRoutes");
const problemRoutes       = require("./routes/problemRoutes");
const contestRoutes       = require("./routes/contestRoutes");
const compilerRoutes      = require("./routes/compilerRoutes");
const submissionRoutes    = require("./routes/submissionRoutes");
const profileRoutes       = require("./routes/profileRoutes");
const courseRoutes        = require("./routes/courseRoutes");
const leaderboardRoutes   = require("./routes/leaderboardRoutes");
const chatRoutes          = require("./routes/chatRoutes");
const weeklyContestRoutes = require("./routes/weeklyContestRoutes");
const discussionRoutes    = require("./routes/discussionRoutes");

app.use("/api/auth",           authRoutes);
app.use("/api/users",          userRoutes);
app.use("/api/problems",       problemRoutes);
app.use("/api/contest",        contestRoutes);
app.use("/api/compiler",       compilerRoutes);
app.use("/api/submissions",    submissionRoutes);
app.use("/api/profile",        profileRoutes);
app.use("/api/courses",        courseRoutes);
app.use("/api/leaderboard",    leaderboardRoutes);
app.use("/api/chat",           chatRoutes);
app.use("/api/weekly-contest", weeklyContestRoutes);
app.use("/api/discuss",        discussionRoutes);

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/intelearn")
  .then(() => {
    console.log("✅ MongoDB connected");
    require("./schedulers/contestScheduler");
    require("./schedulers/leaderboardScheduler");
    require("./schedulers/missedContestChecker");
  })
  .catch(err => console.error("❌ Mongo error:", err));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ message: "Internal server error" }); });
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));