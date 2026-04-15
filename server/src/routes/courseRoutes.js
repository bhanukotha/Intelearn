const router = require("express").Router();
const auth   = require("../middleware/authMiddleware");
const Course = require("../models/Course");

router.get("/", auth, async (req, res) => {
  const courses = await Course.find({}).sort({ enrolledCount: -1 });
  res.json(courses);
});
router.post("/", auth, async (req, res) => {
  const course = await Course.create(req.body);
  res.status(201).json(course);
});

module.exports = router;