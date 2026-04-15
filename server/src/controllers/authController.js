const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const User   = require("../models/User");

exports.register = async (req, res) => {
  try {
    const { name, email, password, guardianEmail, guardianPhone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(400).json({ message: "User already exists with this email" });

    const hashed = await bcrypt.hash(password, 12);
    await User.create({
      name,
      email:         email.toLowerCase(),
      password:      hashed,
      guardianEmail: guardianEmail || "",
      guardianPhone: guardianPhone || "",
      role:          "student",
      isAdmin:       false
    });
    return res.status(201).json({ message: "Signup successful! Please login." });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error during registration" });
  }
};

exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase(), role: "student" });
    if (!user)
      return res.status(400).json({ message: "No student account found with this email" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Incorrect password" });

    const isAdmin = user.isAdmin === true;

    const token = jwt.sign(
      { id: user._id, role: user.role, isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ isAdmin is returned here so frontend stores it
    return res.json({
      token,
      role:    user.role,
      name:    user.name,
      email:   user.email,
      id:      user._id,
      isAdmin
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error during login" });
  }
};

exports.loginGuardian = async (req, res) => {
  try {
    const { guardianId, password } = req.body;
    if (!guardianId || !password)
      return res.status(400).json({ message: "Guardian ID and password are required" });

    const user = await User.findOne({
      $or: [
        { guardianEmail: guardianId.toLowerCase() },
        { guardianPhone: guardianId }
      ]
    });
    if (!user)
      return res.status(400).json({ message: "No account found with this guardian email/phone" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign(
      { id: user._id, role: "guardian", isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.json({ token, role: "guardian", name: user.name, email: user.email, id: user._id, isAdmin: false });
  } catch (err) {
    console.error("GUARDIAN LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.makeAdmin = async (req, res) => {
  try {
    const { email, secret } = req.body;
    if (secret !== process.env.ADMIN_SECRET)
      return res.status(403).json({ message: "Invalid secret" });

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { isAdmin: true } },
      { new: true }
    );
    if (!user)
      return res.status(404).json({ message: "User not found" });

    return res.json({ message: `${user.name} is now admin`, email: user.email, isAdmin: user.isAdmin });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};