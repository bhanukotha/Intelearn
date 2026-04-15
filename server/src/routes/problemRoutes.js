const express = require("express");
const router = express.Router();
const problemController = require("../controllers/problemController");
const auth = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/authMiddleware");

// Public (authenticated) routes
router.get("/",    auth, problemController.getProblems);
router.get("/:id", auth, problemController.getProblemById);

// Admin-only routes
router.post("/add",      auth, adminOnly, problemController.addProblem);
router.put("/:id",       auth, adminOnly, problemController.updateProblem);
router.delete("/:id",    auth, adminOnly, problemController.deleteProblem);

module.exports = router;