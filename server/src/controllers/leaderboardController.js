const Contest = require("../models/Contest");
const Leaderboard = require("../models/Leaderboard");
const moment = require("moment-timezone");

exports.generateWeeklyLeaderboard = async () => {
  const week = moment().tz("Asia/Kolkata").format("YYYY-[W]WW");

  const contests = await Contest.find({
    contestType: "weekly",
    status: "completed"
  }).sort({ score: -1 });

  let rank = 1;
  for (const contest of contests) {
    const existing = await Leaderboard.findOne({ contestId: contest._id });
    if (!existing) {
      await Leaderboard.create({
        userId: contest.userId,
        contestId: contest._id,
        score: contest.score,
        rank,
        week
      });
      rank++;
    }
  }
  console.log("✅ Weekly leaderboard generated");
};

exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    const week = moment().tz("Asia/Kolkata").format("YYYY-[W]WW");
    const leaderboard = await Leaderboard.find({ week })
      .populate("userId", "name email rating")
      .sort({ rank: 1 })
      .limit(50);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};