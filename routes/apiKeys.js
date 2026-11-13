const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { generateApiKeyPair } = require('../middleware/publicAuth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all API keys
router.get('/', async (req, res) => {
  try {
    const [keys] = await pool.query(
      'SELECT id, name, public_key, is_active, created_at, updated_at FROM api_keys ORDER BY created_at DESC'
    );
    res.json(keys);
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Create new API key
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('API key name is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name } = req.body;
      const { publicKey, privateKey } = generateApiKeyPair();

      // Hash private key before storing (optional - for extra security)
      const [result] = await pool.query(
        'INSERT INTO api_keys (name, public_key, private_key) VALUES (?, ?, ?)',
        [name, publicKey, privateKey]
      );

      res.status(201).json({
        success: true,
        message: 'API key created successfully',
        apiKey: {
          id: result.insertId,
          name,
          publicKey,
          privateKey, // Only shown once - user should save this
          isActive: true
        }
      });
    } catch (error) {
      console.error('Create API key error:', error);
      res.status(500).json({ error: 'Failed to create API key' });
    }
  }
);

// Toggle API key status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const [keys] = await pool.query('SELECT is_active FROM api_keys WHERE id = ?', [req.params.id]);

    if (keys.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const newStatus = !keys[0].is_active;

    await pool.query('UPDATE api_keys SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);

    res.json({
      success: true,
      message: `API key ${newStatus ? 'activated' : 'deactivated'}`,
      isActive: newStatus
    });
  } catch (error) {
    console.error('Toggle API key error:', error);
    res.status(500).json({ error: 'Failed to toggle API key' });
  }
});

// Delete API key
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM api_keys WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ success: true, message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

module.exports = router;

