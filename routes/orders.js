const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { notifyLowStock } = require('../utils/lowStock');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { filter, status } = req.query;

    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (filter === 'pending') {
      query += ' AND confirmed = false AND paid = false';
    } else if (filter === 'confirmed') {
      query += ' AND confirmed = true AND paid = false';
    } else if (filter === 'paid') {
      query += ' AND paid = true AND shipped = false';
    } else if (filter === 'shipped') {
      query += ' AND shipped = true';
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [orders] = await pool.query(query, params);

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await pool.query(
          'SELECT * FROM order_items WHERE order_id = ?',
          [order.id]
        );

        return {
          id: `order_${order.id}`,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          customerAddress: order.customer_address,
          items: items.map(item => ({
            id: item.product_id?.toString() || 'unknown',
            name: item.product_name,
            price: parseFloat(item.product_price),
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            image: item.image_url
          })),
          total: parseFloat(order.total),
          status: order.status,
          confirmed: order.confirmed,
          paid: order.paid,
          shipped: order.shipped === 1 || order.shipped === true,
          createdAt: order.created_at.toISOString(),
          notes: order.notes || ''
        };
      })
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const orderId = req.params.id.replace('order_', '');

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];
    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );

    res.json({
      id: `order_${order.id}`,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      customerAddress: order.customer_address,
      items: items.map(item => ({
        id: item.product_id?.toString() || 'unknown',
        name: item.product_name,
        price: parseFloat(item.product_price),
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image_url
      })),
      total: parseFloat(order.total),
      status: order.status,
      confirmed: order.confirmed,
      paid: order.paid,
      shipped: order.shipped === 1 || order.shipped === true,
      createdAt: order.created_at.toISOString(),
      notes: order.notes || ''
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create order (from cart)
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items,
      total,
      notes
    } = req.body;

    if (!customerName || !customerEmail || !customerPhone || !customerAddress || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get or create customer
    let customerId = null;
    const [existingCustomers] = await pool.query(
      'SELECT id FROM customers WHERE email = ?',
      [customerEmail]
    );

    if (existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
      // Update customer info
      await pool.query(
        'UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?',
        [customerName, customerPhone, customerAddress, customerId]
      );
    } else {
      const [customerResult] = await pool.query(
        'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
        [customerName, customerEmail, customerPhone, customerAddress]
      );
      customerId = customerResult.insertId;
    }

    // Create order
    const [orderResult] = await pool.query(
      `INSERT INTO orders 
       (customer_id, customer_name, customer_email, customer_phone, customer_address, total, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [customerId, customerName, customerEmail, customerPhone, customerAddress, total, notes || null]
    );

    const orderId = orderResult.insertId;

    // Create order items
    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items 
         (order_id, product_id, product_name, product_price, quantity, size, color, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.id || null,
          item.name,
          item.price,
          item.quantity,
          item.size || null,
          item.color || null,
          item.image || null
        ]
      );
    }

    res.status(201).json({
      id: `order_${orderId}`,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Confirm order (reserve stock)
router.patch('/:id/confirm', async (req, res) => {
  try {
    const orderId = req.params.id.replace('order_', '');

    await pool.query('BEGIN');

    // Update order
    await pool.query(
      'UPDATE orders SET confirmed = true, status = ? WHERE id = ?',
      ['confirmed', orderId]
    );

    // Reserve stock (decrease stock for each item)
    const [items] = await pool.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [orderId]
    );

    for (const item of items) {
      if (item.product_id) {
        const [current] = await pool.query('SELECT stock FROM products WHERE id = ?', [item.product_id]);
        const previous = current[0] ? Number(current[0].stock) : 0;
        const next = Math.max(0, previous - Number(item.quantity));
        await pool.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
        await notifyLowStock(item.product_id, previous, next);
      }
    }

    await pool.query('COMMIT');

    res.json({ success: true, message: 'Order confirmed and stock reserved' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Confirm order error:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

// Mark order as paid (finalize stock reduction)
router.patch('/:id/paid', async (req, res) => {
  try {
    const orderId = req.params.id.replace('order_', '');

    await pool.query(
      'UPDATE orders SET paid = true, status = ? WHERE id = ?',
      ['paid', orderId]
    );

    res.json({ success: true, message: 'Order marked as paid' });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ error: 'Failed to mark order as paid' });
  }
});

router.patch('/:id/ship', async (req, res) => {
  try {
    const orderId = req.params.id.replace('order_', '');
    const [orders] = await pool.query('SELECT confirmed FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });
    if (!orders[0].confirmed) {
      return res.status(400).json({ error: 'Confirm the order before handing it over' });
    }
    await pool.query('UPDATE orders SET shipped = true, status = ? WHERE id = ?', ['shipped', orderId]);
    res.json({ success: true, message: 'Order marked as handed over' });
  } catch (error) {
    console.error('Ship order error:', error);
    res.status(500).json({ error: 'Failed to mark the order as handed over' });
  }
});

router.patch('/:id/notes', async (req, res) => {
  try {
    const orderId = req.params.id.replace('order_', '');
    const notes = typeof req.body.notes === 'string' ? req.body.notes : '';
    const [result] = await pool.query('UPDATE orders SET notes = ? WHERE id = ?', [notes, orderId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, notes });
  } catch (error) {
    console.error('Order notes error:', error);
    res.status(500).json({ error: 'Failed to save the note' });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const orderId = req.params.id.replace('order_', '');
    const { status } = req.body;

    if (!['pending', 'confirmed', 'paid', 'shipped', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;

