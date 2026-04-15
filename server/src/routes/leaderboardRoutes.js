const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const leaderboardController = require("../controllers/leaderboardController");

router.get(
  "/weekly",
  authMiddleware,
  leaderboardController.getWeeklyLeaderboard
);

module.exports = router;
