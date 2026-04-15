const cron = require("node-cron");
const { generateWeeklyLeaderboard } = require("../controllers/leaderboardController");

// Sunday 10:40 AM IST
cron.schedule(
  "40 10 * * 0",
  async () => {
    await generateWeeklyLeaderboard();
  },
  { timezone: "Asia/Kolkata" }
);
