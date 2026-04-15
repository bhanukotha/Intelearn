const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const ctrl    = require("../controllers/contestController");

router.get( "/today",             auth, ctrl.getTodayContest);
router.get( "/weekly/wed",        auth, ctrl.getWedContest);
router.get( "/weekly/sun",        auth, ctrl.getSunContest);
router.get( "/my",                auth, ctrl.getMyContests);
router.put( "/enter/:id",         auth, ctrl.enterContest);
router.post("/submit/:contestId", auth, ctrl.submitContest);

module.exports = router;