// middleware/authMiddleware.js
const jwt      = require("jsonwebtoken");
const mongoose = require("mongoose");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided. Please login." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id:      decoded.id,
      _id:     new mongoose.Types.ObjectId(decoded.id),
      role:    decoded.role,
      isAdmin: decoded.isAdmin || false
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token. Please login again." });
  }
};

// Extra middleware: only allow admins
module.exports.adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
};