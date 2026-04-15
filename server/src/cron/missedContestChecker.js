const cron = require("node-cron");
const moment = require("moment-timezone");
const Contest = require("../models/Contest");
const { notifyGuardian } = require("../utils/guardianNotifier");

// Wednesday 9:35 PM & Sunday 10:35 AM IST
cron.schedule(
  "35 21 * * 3,0",
  async () => {
    const now = moment().tz("Asia/Kolkata");

    const missedContests = await Contest.find({
      endTime: { $lt: now.toDate() },
      status: "upcoming"
    }).populate("userId");

    for (const contest of missedContests) {
      contest.status = "missed";
      await contest.save();

      await notifyGuardian(contest.userId, contest.contestDay);
    }

    console.log("Missed contest check completed");
  },
  { timezone: "Asia/Kolkata" }
);
