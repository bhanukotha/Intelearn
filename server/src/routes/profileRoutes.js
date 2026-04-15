const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

router.get("/me", authMiddleware, profileController.getMyProfileStats);

module.exports = router;