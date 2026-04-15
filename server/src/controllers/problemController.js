const Problem = require("../models/Problem");

exports.addProblem = async (req, res) => {
  try {
    const problem = await Problem.create(req.body);
    res.status(201).json(problem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json(problem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProblem = async (req, res) => {
  try {
    await Problem.findByIdAndDelete(req.params.id);
    res.json({ message: "Problem deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProblems = async (req, res) => {
  try {
    const { difficulty, tag, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (difficulty) filter.difficulty = difficulty;
    if (tag) filter.tags = tag;
    if (search) filter.title = { $regex: search, $options: "i" };

    const problems = await Problem.find(filter, "title difficulty tags totalSubmissions acceptedSubmissions")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Problem.countDocuments(filter);

    res.json({ problems, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    res.json({
      _id: problem._id,
      title: problem.title,
      description: problem.description,
      inputFormat: problem.inputFormat || "",
      outputFormat: problem.outputFormat || "",
      difficulty: problem.difficulty,
      tags: problem.tags,
      sampleTestCases: problem.sampleTestCases,
      hiddenTestCases: problem.hiddenTestCases,
      constraints: problem.constraints,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
      totalSubmissions: problem.totalSubmissions,
      acceptedSubmissions: problem.acceptedSubmissions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};