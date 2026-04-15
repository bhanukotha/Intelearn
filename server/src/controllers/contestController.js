// controllers/contestController.js
const Contest     = require("../models/Contest");
const Problem     = require("../models/Problem");
const Performance = require("../models/Performance");
const Submission  = require("../models/Submission");
const moment      = require("moment-timezone");

// ─────────────────────────────────────────────────────────────────────────────
// RANDOM FOREST (pure-JS) difficulty predictor
// Features: accuracy, avgTime, wrongAttempts, streakDays, lastDifficulty
// Trees trained on heuristic splits — no external ML lib needed
// ─────────────────────────────────────────────────────────────────────────────
const DIFFICULTY = { easy: 0, medium: 1, hard: 2 };
const DIFF_LABEL = ["easy", "medium", "hard"];

// Single decision tree node
const predict_tree = (f, tree) => {
  let node = tree;
  while (node.left) {
    node = f[node.feat] <= node.thresh ? node.left : node.right;
  }
  return node.val;
};

// 5 hand-crafted trees covering different feature combos
const FOREST = [
  // Tree 1: accuracy + wrong attempts
  { feat:"acc", thresh:60, left:{ val:0 }, right:{ feat:"wrong", thresh:2, left:{ val:2 }, right:{ val:1 } } },
  // Tree 2: accuracy + streak
  { feat:"acc", thresh:75, left:{ feat:"streak", thresh:3, left:{ val:0 }, right:{ val:1 } }, right:{ val:2 } },
  // Tree 3: last difficulty + accuracy
  { feat:"lastDiff", thresh:0.5, left:{ feat:"acc", thresh:50, left:{ val:0 }, right:{ val:1 } }, right:{ feat:"acc", thresh:70, left:{ val:1 }, right:{ val:2 } } },
  // Tree 4: wrong attempts + avgTime
  { feat:"wrong", thresh:3, left:{ feat:"avgTime", thresh:30, left:{ val:2 }, right:{ val:1 } }, right:{ val:0 } },
  // Tree 5: accuracy + lastDiff combined
  { feat:"acc", thresh:55, left:{ val:0 }, right:{ feat:"lastDiff", thresh:1.5, left:{ val:1 }, right:{ val:2 } } },
];

const rfPredict = (features) => {
  const votes = [0, 0, 0];
  FOREST.forEach(tree => votes[predict_tree(features, tree)]++);
  return DIFF_LABEL[votes.indexOf(Math.max(...votes))];
};

// ─────────────────────────────────────────────────────────────────────────────
// Build feature vector from user's recent performance
// ─────────────────────────────────────────────────────────────────────────────
const getFeatures = async (userId) => {
  const history = await Performance.find({ userId }).sort({ createdAt: -1 }).limit(10);
  if (history.length === 0) return null; // cold start

  const n           = history.length;
  const acc         = history.reduce((s, h) => s + (h.accuracy || 0), 0) / n;
  const wrong       = history.reduce((s, h) => s + (h.wrongAttempts || 0), 0) / n;
  const avgTime     = history.reduce((s, h) => s + (h.avgTime || 0), 0) / n;
  const lastDiff    = DIFFICULTY[history[0].difficultyAttempted] ?? 1;
  const streak      = await Contest.countDocuments({ userId, contestType: "daily", status: "completed" });

  return { acc, wrong, avgTime, lastDiff, streak: Math.min(streak, 10) };
};

const getDynamicDifficulty = async (userId) => {
  const features = await getFeatures(userId);
  if (!features) return "easy"; // cold start
  return rfPredict(features);
};

// ─────────────────────────────────────────────────────────────────────────────
// Pick problems by difficulty, avoid problems already seen this week
// ─────────────────────────────────────────────────────────────────────────────
const pickProblems = async (difficulty, count, excludeIds = []) => {
  const sample = async (diff, n) => {
    if (n <= 0) return [];
    return Problem.aggregate([
      { $match: { difficulty: diff, _id: { $nin: excludeIds } } },
      { $sample: { size: n } }
    ]);
  };

  // Fallback: if not enough of requested diff, fill with any diff
  const fallback = async (needed) => {
    if (needed <= 0) return [];
    return Problem.aggregate([
      { $match: { _id: { $nin: excludeIds } } },
      { $sample: { size: needed } }
    ]);
  };

  let problems = [];

  if (difficulty === "easy") {
    problems = await sample("easy", count);
  } else if (difficulty === "medium") {
    const med  = await sample("medium", count - 1);
    const easy = await sample("easy", 1);
    problems   = [...easy, ...med];
  } else if (difficulty === "hard") {
    const med  = await sample("medium", 1);
    const hard = await sample("hard", count - 1);
    problems   = [...med, ...hard];
  } else {
    // mixed
    const e = await sample("easy",   1);
    const m = await sample("medium", Math.ceil((count - 1) / 2));
    const h = await sample("hard",   Math.floor((count - 1) / 2));
    problems = [...e, ...m, ...h];
  }

  // If we don't have enough, fill remaining with any problems
  if (problems.length < count) {
    const seen  = problems.map(p => p._id);
    const extra = await fallback(count - problems.length);
    problems    = [...problems, ...extra.filter(p => !seen.some(id => id.equals(p._id)))];
  }

  return problems.slice(0, count);
};

// ─────────────────────────────────────────────────────────────────────────────
// DAILY CONTEST — 1 problem per day, resets at midnight IST
// ─────────────────────────────────────────────────────────────────────────────
exports.generateDailyContest = async (userId) => {
  const now        = moment().tz("Asia/Kolkata");
  const dayKey     = now.format("YYYY-MM-DD"); // unique key per calendar day
  const startOfDay = now.clone().startOf("day").toDate();
  const endOfDay   = now.clone().endOf("day").toDate();

  const existing = await Contest.findOne({ userId, contestType: "daily", contestDay: dayKey });
  if (existing) return existing;

  const difficulty = await getDynamicDifficulty(userId);
  const problems   = await pickProblems(difficulty, 1); // ← 1 problem per day

  return Contest.create({
    userId,
    problems:        problems.map(p => p._id),
    contestType:     "daily",
    contestDay:      dayKey,
    difficulty,
    startTime:       startOfDay,
    endTime:         endOfDay,
    durationMinutes: 60,
    totalQuestions:  1,
    status:          "upcoming"
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY CONTEST — Wednesday & Sunday, 4 problems each
// Slot key: "2026-W14-WED" or "2026-W14-SUN"
// ─────────────────────────────────────────────────────────────────────────────
const getWeeklySlotTimes = (now, slot) => {
  // Wednesday: day 3,  Sunday: day 0 (moment isoWeekday: Mon=1 … Sun=7)
  const targetIso = slot === "WED" ? 3 : 7;
  const slotDay   = now.clone().isoWeekday(targetIso).startOf("day");
  return {
    startTime: slotDay.toDate(),
    endTime:   slotDay.clone().endOf("day").toDate()
  };
};

exports.generateWeeklyContest = async (userId, slot) => {
  const now     = moment().tz("Asia/Kolkata");
  const weekNum = now.format("YYYY-[W]WW");
  const key     = `${weekNum}-${slot}`; // e.g. "2026-W14-WED"

  const existing = await Contest.findOne({ userId, contestType: "weekly", contestDay: key });
  if (existing) return existing;

  // Get problems already used in the other slot this week (avoid repeats)
  const otherSlot   = slot === "WED" ? "SUN" : "WED";
  const otherContest = await Contest.findOne({ userId, contestType: "weekly", contestDay: `${weekNum}-${otherSlot}` });
  const excludeIds   = otherContest ? otherContest.problems : [];

  // RF difficulty — also factor in last weekly performance
  const difficulty = await getDynamicDifficulty(userId);
  const problems   = await pickProblems(difficulty, 4, excludeIds); // ← 4 problems

  const { startTime, endTime } = getWeeklySlotTimes(now, slot);

  return Contest.create({
    userId,
    problems:        problems.map(p => p._id),
    contestType:     "weekly",
    contestDay:      key,
    weekSlot:        slot,
    difficulty,
    startTime,
    endTime,
    durationMinutes: 120,
    totalQuestions:  4,
    status:          "upcoming"
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/contest/today
exports.getTodayContest = async (req, res) => {
  try {
    let contest = await exports.generateDailyContest(req.user.id);
    contest = await Contest.findById(contest._id)
      .populate("problems", "title difficulty description inputFormat outputFormat sampleTestCases constraints tags timeLimit memoryLimit totalSubmissions acceptedSubmissions");
    res.json(contest);
  } catch (err) {
    console.error("GET DAILY ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/contest/weekly/wed
exports.getWedContest = async (req, res) => {
  try {
    let contest = await exports.generateWeeklyContest(req.user.id, "WED");
    contest = await Contest.findById(contest._id)
      .populate("problems", "title difficulty description inputFormat outputFormat sampleTestCases constraints tags timeLimit memoryLimit totalSubmissions acceptedSubmissions");
    res.json(contest);
  } catch (err) {
    console.error("GET WED CONTEST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/contest/weekly/sun
exports.getSunContest = async (req, res) => {
  try {
    let contest = await exports.generateWeeklyContest(req.user.id, "SUN");
    contest = await Contest.findById(contest._id)
      .populate("problems", "title difficulty description inputFormat outputFormat sampleTestCases constraints tags timeLimit memoryLimit totalSubmissions acceptedSubmissions");
    res.json(contest);
  } catch (err) {
    console.error("GET SUN CONTEST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/contest/my
exports.getMyContests = async (req, res) => {
  try {
    const contests = await Contest.find({ userId: req.user.id })
      .populate("problems", "title difficulty")
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(contests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/contest/enter/:id  — mark as ongoing
exports.enterContest = async (req, res) => {
  try {
    const contest = await Contest.findOne({ _id: req.params.id, userId: req.user.id })
      .populate("problems", "title difficulty description inputFormat outputFormat sampleTestCases constraints tags timeLimit memoryLimit totalSubmissions acceptedSubmissions");
    if (!contest) return res.status(404).json({ message: "Contest not found." });
    if (contest.status === "upcoming") { contest.status = "ongoing"; await contest.save(); }
    res.json(contest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/contest/submit/:contestId
exports.submitContest = async (req, res) => {
  try {
    const contest = await Contest.findOne({ _id: req.params.contestId, userId: req.user.id });
    if (!contest)                       return res.status(404).json({ message: "Contest not found." });
    if (contest.status === "completed") return res.status(400).json({ message: "Already submitted." });

    const { answers = [] } = req.body; // [{ problemId, correct, timeTaken }]
    let score = 0, correct = 0, wrong = 0, totalTime = 0;
    answers.forEach(a => {
      totalTime += (a.timeTaken || 0);
      if (a.correct) { score += 100; correct++; }
      else           { wrong++; }
    });

    contest.score  = score;
    contest.status = "completed";
    await contest.save();

    // Record performance for RF next time
    await Performance.create({
      userId:              req.user.id,
      contestId:           contest._id,
      accuracy:            answers.length ? (correct / answers.length) * 100 : 0,
      avgTime:             answers.length ? totalTime / answers.length : 0,
      wrongAttempts:       wrong,
      difficultyAttempted: contest.difficulty
    });

    res.json({ message: "Submitted!", score, correct, total: answers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};