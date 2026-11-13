const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { notifyLowStock } = require('../utils/lowStock');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get stock overview
router.get('/overview', async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        SUM(stock) as total_stock,
        COUNT(*) as total_products,
        SUM(CASE WHEN stock < 10 AND stock > 0 THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM products
    `);

    res.json({
      totalStock: parseInt(stats[0].total_stock) || 0,
      totalProducts: parseInt(stats[0].total_products) || 0,
      lowStockCount: parseInt(stats[0].low_stock_count) || 0,
      outOfStockCount: parseInt(stats[0].out_of_stock_count) || 0
    });
  } catch (error) {
    console.error('Get stock overview error:', error);
    res.status(500).json({ error: 'Failed to fetch stock overview' });
  }
});

// Get all products with stock info
router.get('/products', async (req, res) => {
  try {
    const { filter } = req.query;

    let query = `
      SELECT p.id, p.name, p.stock, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;

    if (filter === 'low') {
      query += ' AND p.stock < 10 AND p.stock > 0';
    } else if (filter === 'out') {
      query += ' AND p.stock = 0';
    }

    query += ' ORDER BY p.stock ASC, p.name ASC';

    const [products] = await pool.query(query);

    res.json(
      products.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category_name || 'Uncategorized',
        stock: product.stock
      }))
    );
  } catch (error) {
    console.error('Get stock products error:', error);
    res.status(500).json({ error: 'Failed to fetch stock products' });
  }
});

// Update product stock
router.patch('/products/:id', async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({ error: 'Valid stock value is required' });
    }

    const [current] = await pool.query('SELECT stock FROM products WHERE id = ?', [req.params.id]);
    const previous = current[0] ? Number(current[0].stock) : Number(stock);

    await pool.query('UPDATE products SET stock = ? WHERE id = ?', [
      stock,
      req.params.id
    ]);

    await notifyLowStock(req.params.id, previous, Number(stock));

    res.json({ success: true, message: 'Stock updated successfully' });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

module.exports = router;

