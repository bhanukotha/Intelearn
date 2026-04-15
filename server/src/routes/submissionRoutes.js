const router = require("express").Router();
const auth   = require("../middleware/authMiddleware");
const { submitSolution, getMySubmissions } = require("../controllers/submissionController");

router.post("/submit", auth, submitSolution);
router.get("/my",      auth, getMySubmissions);

module.exports = router;