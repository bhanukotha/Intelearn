// controllers/profileController.js
const Submission = require("../models/Submission");
const Contest    = require("../models/Contest");
const User       = require("../models/User");
const mongoose   = require("mongoose");

exports.getMyProfileStats = async (req, res) => {
  try {
    // BUG FIX #1: req.user._id was undefined; must cast to ObjectId for aggregates
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Unique problems solved (AC only)
    const solvedProblems = await Submission.aggregate([
      { $match: { userId, verdict: "AC" } },
      { $group: { _id: "$problemId" } }
    ]);

    // Language-wise AC count
    const languageStats = await Submission.aggregate([
      { $match: { userId, verdict: "AC" } },
      { $group: { _id: "$language", count: { $sum: 1 } } },
      { $sort:  { count: -1 } }
    ]);

    // Verdict breakdown chart
    const verdictStats = await Submission.aggregate([
      { $match: { userId } },
      { $group: { _id: "$verdict", count: { $sum: 1 } } }
    ]);

    // Total submissions
    const totalSubmissions = await Submission.countDocuments({ userId: req.user.id });

    // Last 10 submissions with problem info
    const recentSubmissions = await Submission.find({ userId: req.user.id })
      .populate("problemId", "title difficulty")
      .sort({ createdAt: -1 })
      .limit(10);

    // Completed contests
    const contestsParticipated = await Contest.countDocuments({
      userId: req.user.id,
      status: "completed"
    });

    // Daily streak – count of completed daily contests in last 30
    const dailyStreak = await Contest.countDocuments({
      userId:      req.user.id,
      contestType: "daily",
      status:      "completed"
    });

    // User rating + global rank
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const higherRated = await User.countDocuments({ rating: { $gt: user.rating } });
    const rank        = higherRated + 1;

    return res.json({
      name:               user.name,
      email:              user.email,
      rating:             user.rating,
      rank,
      problemsSolved:     solvedProblems.length,
      totalSubmissions,
      contestsParticipated,
      dailyStreak,
      languageStats,
      verdictStats,
      recentSubmissions
    });
  } catch (err) {
    console.error("PROFILE STATS ERROR:", err);
    res.status(500).json({ message: "Error fetching profile stats." });
  }
};