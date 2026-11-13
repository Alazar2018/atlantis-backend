const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get admin profile
router.get('/', async (req, res) => {
  try {
    const [admins] = await pool.query(
      'SELECT id, email, name, low_stock_threshold, order_email, profile_image, created_at FROM admins WHERE id = ?',
      [req.user.id]
    );

    if (admins.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(admins[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update admin profile
router.put(
  '/',
  [
    body('name').optional().isLength({ min: 1 }).withMessage('Name must not be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('currentPassword').optional(),
    body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be a non-negative integer'),
    body('orderEmail').optional({ values: 'falsy' }).isEmail().withMessage('Valid order email is required'),
    body('profileImage').optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        email,
        currentPassword,
        newPassword,
        lowStockThreshold,
        orderEmail,
        profileImage,
      } = req.body;

      // Get current admin
      const [admins] = await pool.query('SELECT * FROM admins WHERE id = ?', [req.user.id]);
      if (admins.length === 0) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      const admin = admins[0];

      // Update fields
      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }

      if (email !== undefined && email !== admin.email) {
        // Check if email is already taken
        const [existing] = await pool.query('SELECT id FROM admins WHERE email = ? AND id != ?', [email, req.user.id]);
        if (existing.length > 0) {
          return res.status(400).json({ error: 'Email already in use' });
        }
        updates.push('email = ?');
        values.push(email);
      }

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to change password' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updates.push('password = ?');
        values.push(hashedPassword);
      }

      if (lowStockThreshold !== undefined) {
        updates.push('low_stock_threshold = ?');
        values.push(lowStockThreshold);
      }

      if (orderEmail !== undefined) {
        updates.push('order_email = ?');
        values.push(orderEmail || null);
      }

      if (profileImage !== undefined && !String(profileImage).startsWith('blob:')) {
        updates.push('profile_image = ?');
        values.push(profileImage || null);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(req.user.id);

      await pool.query(
        `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      // Get updated admin
      const [updated] = await pool.query(
        'SELECT id, email, name, low_stock_threshold, order_email, profile_image, created_at FROM admins WHERE id = ?',
        [req.user.id]
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        admin: updated[0],
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

module.exports = router;

