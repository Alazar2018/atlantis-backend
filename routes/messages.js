const express = require("express");
const pool = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
router.use(authenticateToken);

router.get("/", async (req, res) => {
  try {
    const [messages] = await pool.query(
      "SELECT id, name, email, subject, message, is_read, created_at FROM messages ORDER BY created_at DESC"
    );
    res.json(messages);
  } catch (error) {
    console.error("List messages error:", error);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    await pool.query("UPDATE messages SET is_read = true WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Read message error:", error);
    res.status(500).json({ error: "Failed to update the message" });
  }
});

module.exports = router;
