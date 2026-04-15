const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Student signup
router.post("/register", authController.register);

// Student login
router.post("/login/student", authController.loginStudent);

// Guardian login
router.post("/login/guardian", authController.loginGuardian);

// One-time admin elevation (POST with { email, secret })
router.post("/make-admin", authController.makeAdmin);

module.exports = router;