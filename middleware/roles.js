const pool = require("../config/database");

async function requireAdmin(req, res, next) {
  try {
    const [rows] = await pool.query("SELECT role FROM admins WHERE id = ?", [req.user?.id]);
    const role = rows[0]?.role || "admin";
    if (role !== "admin") {
      return res.status(403).json({ error: "Only an admin can do that." });
    }
    next();
  } catch (error) {
    console.error("Role check error:", error);
    res.status(500).json({ error: "Could not check this account." });
  }
}

module.exports = { requireAdmin };
