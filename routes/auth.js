const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('not-a-real-staff-password', 10);
const loginAttempts = new Map();

function clientAddress(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim().slice(0, 80);
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function tooManyAttempts(address) {
  const now = Date.now();
  const recent = (loginAttempts.get(address) || []).filter((time) => now - time < 15 * 60 * 1000);
  loginAttempts.set(address, recent);
  return recent.length >= 8;
}

function recordAttempt(address) {
  const recent = loginAttempts.get(address) || [];
  recent.push(Date.now());
  loginAttempts.set(address, recent);
}

function staffEmail(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 255) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
  return email;
}

function staffPassword(value) {
  if (typeof value !== 'string') return '';
  if (value.length < 1 || value.length > 72) return '';
  return value;
}

// Login
router.post('/login', async (req, res) => {
  try {
    const address = clientAddress(req);
    if (tooManyAttempts(address)) {
      return res.status(429).json({ error: 'Too many sign-in attempts. Try again later.' });
    }

    const email = staffEmail(req.body?.email);
    const password = staffPassword(req.body?.password);

    if (!email || !password) {
      recordAttempt(address);
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Values stay in placeholders, so they cannot change the query.
    const [admins] = await pool.query('SELECT * FROM admins WHERE email = ? LIMIT 1', [email]);
    const admin = admins[0];
    const isValidPassword = await bcrypt.compare(password, admin ? admin.password : DUMMY_PASSWORD_HASH);

    if (!admin || !isValidPassword) {
      recordAttempt(address);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    loginAttempts.delete(address);

    // Generate JWT access token (short-lived)
    const accessToken = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role || 'admin',
        type: 'access'
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      { expiresIn: '15m' } // 15 minutes
    );

    // Generate JWT refresh token (long-lived)
    const refreshToken = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        type: 'refresh'
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // 7 days
    );

    // Store refresh token in database
    await pool.query(
      'UPDATE admins SET refresh_token = ? WHERE id = ?',
      [refreshToken, admin.id]
    );

    // Set HTTP-only cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return access token in response body (stored in localStorage)
    res.json({
      success: true,
      message: 'Login successful',
      token: accessToken, // This will be stored in localStorage
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role || 'admin'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check authentication status
router.get('/check', async (req, res) => {
  try {
    // Try to get token from cookie first
    let token = req.cookies?.authToken;
    
    // If not in cookie, try Authorization header
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    }

    if (!token) {
      return res.json({ authenticated: false });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
      
      // Check if admin still exists
      const [admins] = await pool.query('SELECT id, email, name, role FROM admins WHERE id = ?', [decoded.id]);

      if (admins.length === 0) {
        return res.json({ authenticated: false });
      }

      res.json({
        authenticated: true,
        user: admins[0]
      });
    } catch (error) {
      // Token invalid or expired
      return res.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    res.json({ authenticated: false });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not provided' });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
      );
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Check if refresh token exists in database
    const [admins] = await pool.query(
      'SELECT * FROM admins WHERE id = ? AND refresh_token = ?',
      [decoded.id, refreshToken]
    );

    if (admins.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const admin = admins[0];

    // Generate new access token
    const accessToken = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role || 'admin',
        type: 'access'
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      { expiresIn: '15m' } // 15 minutes
    );

    res.json({
      success: true,
      token: accessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Clear refresh token from database
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
        );
        await pool.query(
          'UPDATE admins SET refresh_token = NULL WHERE id = ?',
          [decoded.id]
        );
      } catch (error) {
        // Token might be expired, but still clear cookie
        console.error('Error clearing refresh token:', error);
      }
    }

    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

