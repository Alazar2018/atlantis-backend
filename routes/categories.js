const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories ORDER BY name ASC'
    );

    res.json(categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      image: cat.image_url
    })));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [req.params.id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = categories[0];
    res.json({
      id: category.id,
      name: category.name,
      description: category.description,
      image: category.image_url
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create category
router.post(
  '/',
  [body('name').notEmpty().withMessage('Category name is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, image_url } = req.body;

      const [result] = await pool.query(
        'INSERT INTO categories (name, description, image_url) VALUES (?, ?, ?)',
        [name, description || null, image_url || null]
      );

      const [newCategory] = await pool.query(
        'SELECT * FROM categories WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({
        id: newCategory[0].id,
        name: newCategory[0].name,
        description: newCategory[0].description,
        image: newCategory[0].image_url
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Category name already exists' });
      }
      console.error('Create category error:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
);

// Update category
router.put(
  '/:id',
  [body('name').notEmpty().withMessage('Category name is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, image_url } = req.body;

      await pool.query(
        'UPDATE categories SET name = ?, description = ?, image_url = ? WHERE id = ?',
        [name, description || null, image_url || null, req.params.id]
      );

      const [updated] = await pool.query(
        'SELECT * FROM categories WHERE id = ?',
        [req.params.id]
      );

      if (updated.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const category = updated[0];
      res.json({
        id: category.id,
        name: category.name,
        description: category.description,
        image: category.image_url
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Category name already exists' });
      }
      console.error('Update category error:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  }
);

// Delete category
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    // Check if category is used by any products
    const [products] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [req.params.id]
    );

    if (products[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete category. It is being used by products.'
      });
    }

    const [result] = await pool.query(
      'DELETE FROM categories WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;

