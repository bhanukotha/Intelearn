// routes/weeklyContestRoutes.js
const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const ctrl    = require("../controllers/weeklyContestController");

router.get("/friday/generate", auth, ctrl.generateFridayContest);
router.get("/sunday/generate",  auth, ctrl.generateSundayContest);
router.post("/friday/submit",   auth, ctrl.submitFridayContest);
router.get("/history",          auth, ctrl.getWeeklyHistory);

module.exports = router;