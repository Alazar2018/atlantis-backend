const pool = require('../config/database');
const crypto = require('crypto');

/**
 * Middleware to authenticate public API requests using API key
 * Expects: X-API-Key header with public key
 * Returns: Sets req.apiKey if valid
 */
const authenticatePublicKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required. Please provide X-API-Key header.' });
    }

    // Find API key in database
    const [keys] = await pool.query(
      'SELECT * FROM api_keys WHERE public_key = ? AND is_active = true',
      [apiKey]
    );

    if (keys.length === 0) {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }

    // Attach API key info to request
    req.apiKey = keys[0];
    next();
  } catch (error) {
    console.error('Public API authentication error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Generate a new API key pair
 * Returns: { publicKey, privateKey }
 */
const generateApiKeyPair = () => {
  const publicKey = crypto.randomBytes(32).toString('hex');
  const privateKey = crypto.randomBytes(64).toString('hex');
  return { publicKey, privateKey };
};

module.exports = {
  authenticatePublicKey,
  generateApiKeyPair,
};

