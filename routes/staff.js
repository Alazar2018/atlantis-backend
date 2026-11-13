const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roles");

const router = express.Router();
router.use(authenticateToken);
router.use(requireAdmin);

router.get("/", async (req, res) => {
  try {
    const [staff] = await pool.query(
      "SELECT id, email, name, role, created_at FROM admins ORDER BY id ASC"
    );
    res.json(staff);
  } catch (error) {
    console.error("List staff error:", error);
    res.status(500).json({ error: "Failed to load staff" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: "Email and a password of at least 6 characters are required" });
    }
    const [existing] = await pool.query("SELECT id FROM admins WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "That email already has a desk login" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO admins (email, password, name, role) VALUES (?, ?, ?, 'maker')",
      [email, hashed, name || "Maker"]
    );
    res.status(201).json({ id: result.insertId, email, name: name || "Maker", role: "maker" });
  } catch (error) {
    console.error("Create staff error:", error);
    res.status(500).json({ error: "Failed to create the maker login" });
  }
});

module.exports = router;
