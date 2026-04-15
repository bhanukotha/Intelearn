// controllers/submissionController.js

const Problem    = require("../models/Problem");
const Submission = require("../models/Submission");
const axios      = require("axios");

// ─────────────────────────────────────────────────────────────
// Normalize + Split into lines
// ─────────────────────────────────────────────────────────────
const normalizeLines = (str) =>
  (str || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .split("\n")
    .map(line => line.trim());

// ─────────────────────────────────────────────────────────────
// Compare output line-by-line
// ─────────────────────────────────────────────────────────────
const compareOutput = (actual, expected) => {
  const out1 = normalizeLines(actual);
  const out2 = normalizeLines(expected);

  if (out1.length !== out2.length) return false;

  for (let i = 0; i < out1.length; i++) {
    if (out1[i] !== out2[i]) return false;
  }

  return true;
};

// ─────────────────────────────────────────────────────────────
// Judge0 Status Mapping
// ─────────────────────────────────────────────────────────────
const getVerdictFromStatus = (statusId) => {
  if (statusId === 3) return "AC";
  if (statusId === 4) return "WA";
  if (statusId === 5) return "TLE";
  if (statusId === 6) return "CE";
  if (statusId >= 7 && statusId <= 12) return "RE";
  return "WA";
};

// ─────────────────────────────────────────────────────────────
// SUBMIT SOLUTION
// ─────────────────────────────────────────────────────────────
exports.submitSolution = async (req, res) => {
  try {
    const { problemId, code, language, languageId } = req.body;

    if (!problemId || !code || !language) {
      return res.status(400).json({
        message: "problemId, code and language are required."
      });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found." });
    }

    // Create submission (Pending)
    const submission = await Submission.create({
      userId: req.user.id,
      problemId,
      language,
      languageId: languageId || parseInt(language),
      code,
      verdict: "Pending"
    });

    // Choose hidden test cases if available
    const testCases =
      problem.hiddenTestCases?.length > 0
        ? problem.hiddenTestCases
        : problem.sampleTestCases;

    if (!testCases || testCases.length === 0) {
      submission.verdict = "WA";
      await submission.save();

      await Problem.findByIdAndUpdate(problemId, {
        $inc: { totalSubmissions: 1 }
      });

      return res.json({
        verdict: "WA",
        passed: 0,
        total: 0,
        submissionId: submission._id,
        message: "No test cases found."
      });
    }

    let finalVerdict = "AC";
    let passedCount  = 0;

    for (const tc of testCases) {
      let statusId;
      let actualOutput = "";
      let judgeError   = "";

      try {
        const response = await axios.post(
          `${process.env.JUDGE0_URL}/submissions`,
          {
            language_id: languageId || parseInt(language),
            source_code: code,
            stdin: tc.input || ""
          },
          {
            params: { wait: "true", base64_encoded: "false" },
            headers: {
              "Content-Type": "application/json",
              "X-RapidAPI-Key": process.env.JUDGE0_KEY,
              "X-RapidAPI-Host":
                process.env.JUDGE0_HOST || "judge0-ce.p.rapidapi.com"
            },
            timeout: 25000
          }
        );

        statusId = response.data.status?.id;
        actualOutput = response.data.stdout ?? "";
        judgeError =
          response.data.stderr ||
          response.data.compile_output ||
          "";

        // 🔍 DEBUG LOGS
        console.log("──────────────");
        console.log("INPUT:", JSON.stringify(tc.input));
        console.log("EXPECTED:", JSON.stringify(tc.output));
        console.log("GOT:", JSON.stringify(actualOutput));
        console.log("STATUS ID:", statusId);
        console.log("──────────────");

      } catch (err) {
        console.error("Judge0 Request Failed:", err.message);
        finalVerdict = "RE";
        break;
      }

      // ── Handle errors ──
      if (statusId === 6) {
        finalVerdict = "CE";
        break;
      }

      if (statusId === 5) {
        finalVerdict = "TLE";
        break;
      }

      if (statusId >= 7 && statusId <= 12) {
        finalVerdict = "RE";
        break;
      }

      // ── Compare outputs ──
      if (statusId === 3 || statusId === 4 || statusId === 1 || statusId === 2) {
        const isCorrect = compareOutput(actualOutput, tc.output);

        if (isCorrect) {
          passedCount++;
        } else {
          console.log("❌ WA DETECTED");
          finalVerdict = "WA";
          break;
        }
      } else {
        finalVerdict = "WA";
        break;
      }
    }

    // ── Update stats ──
    await Problem.findByIdAndUpdate(problemId, {
      $inc: {
        totalSubmissions: 1,
        acceptedSubmissions: finalVerdict === "AC" ? 1 : 0
      }
    });

    // ── Save verdict ──
    submission.verdict = finalVerdict;
    await submission.save();

    return res.json({
      verdict: finalVerdict,
      passed: passedCount,
      total: testCases.length,
      submissionId: submission._id
    });

  } catch (err) {
    console.error("SUBMIT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET USER SUBMISSIONS
// ─────────────────────────────────────────────────────────────
exports.getMySubmissions = async (req, res) => {
  try {
    const filter = { userId: req.user.id };

    if (req.query.problemId) {
      filter.problemId = req.query.problemId;
    }

    const submissions = await Submission.find(filter)
      .populate("problemId", "title difficulty")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};