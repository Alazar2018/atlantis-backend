const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all customers
router.get('/', async (req, res) => {
  try {
    const { filter } = req.query;

    let query = `
      SELECT 
        c.*,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.paid = true THEN o.total ELSE 0 END), 0) as total_spent,
        MAX(o.created_at) as last_order_date,
        (SUM(CASE WHEN o.paid = true THEN 1 ELSE 0 END) > 0) as has_paid
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (filter === 'ordered') {
      query += ' AND o.id IS NOT NULL';
    } else if (filter === 'paid') {
      query += ' AND o.paid = true';
    }

    query += ' GROUP BY c.id ORDER BY c.created_at DESC';

    const [customers] = await pool.query(query, params);

    res.json(
      customers.map(customer => ({
        id: customer.id.toString(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        orderCount: customer.order_count || 0,
        totalSpent: parseFloat(customer.total_spent) || 0,
        lastOrderDate: customer.last_order_date
          ? customer.last_order_date.toISOString()
          : null,
        hasPaid: customer.has_paid === 1 || customer.has_paid === true
      }))
    );
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const [customers] = await pool.query('SELECT * FROM customers WHERE id = ?', [
      req.params.id
    ]);

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customers[0];
    res.json({
      id: customer.id.toString(),
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

module.exports = router;

