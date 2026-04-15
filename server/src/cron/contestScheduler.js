const cron = require("node-cron");
const User = require("../models/User");
const { generateDailyContest, generateWeeklyContest } = require("../controllers/contestController");

// Every day at midnight IST — generate daily contest for all students
cron.schedule("0 0 * * *", async () => {
  try {
    const users = await User.find({ role: "student" });
    for (const u of users) await generateDailyContest(u._id).catch(console.error);
    console.log(`✅ Daily contests generated for ${users.length} students`);
  } catch (e) { console.error("Daily scheduler error:", e); }
}, { timezone: "Asia/Kolkata" });

// Wednesday midnight IST — generate Wednesday weekly contest
cron.schedule("0 0 * * 3", async () => {
  try {
    const users = await User.find({ role: "student" });
    for (const u of users) await generateWeeklyContest(u._id, "WED").catch(console.error);
    console.log(`✅ Wednesday contests generated for ${users.length} students`);
  } catch (e) { console.error("Wednesday scheduler error:", e); }
}, { timezone: "Asia/Kolkata" });

// Sunday midnight IST — generate Sunday weekly contest
cron.schedule("0 0 * * 0", async () => {
  try {
    const users = await User.find({ role: "student" });
    for (const u of users) await generateWeeklyContest(u._id, "SUN").catch(console.error);
    console.log(`✅ Sunday contests generated for ${users.length} students`);
  } catch (e) { console.error("Sunday scheduler error:", e); }
}, { timezone: "Asia/Kolkata" });