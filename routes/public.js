const express = require('express');
const pool = require('../config/database');
const { authenticatePublicKey } = require('../middleware/publicAuth');
const { sendOrderConfirmationEmail, sendOrderNotificationEmail } = require('../utils/email');

const router = express.Router();

// Apply public API authentication to all routes
router.use(authenticatePublicKey);

// Get all categories (public)
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT id, name, description, image_url, created_at FROM categories ORDER BY name ASC'
    );
    res.json(categories);
  } catch (error) {
    console.error('Get public categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get featured products (public) - MUST be before /products/:id route
router.get('/products/featured', async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.intro_image,
        p.images,
        p.is_on_sale,
        p.sale_price,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_published = 1 AND p.is_featured = 1
      ORDER BY p.created_at DESC
      LIMIT 12`
    );

    const formattedProducts = products.map(product => {
      let parsedImages = [];
      if (product.images) {
        try {
          parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        } catch (e) {
          parsedImages = [];
        }
      }

      return {
        id: product.id.toString(),
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
        isOnSale: product.is_on_sale === 1 || product.is_on_sale === true,
        stock: product.stock,
        introImage: product.intro_image,
        images: parsedImages,
        category: product.category_name || 'Uncategorized'
      };
    });

    // Return empty array if no products found (not an error)
    res.json(formattedProducts || []);
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// Get all products (public - published only)
router.get('/products', async (req, res) => {
  try {
    const { category, search, featured } = req.query;

    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.intro_image,
        p.images,
        p.is_featured,
        p.is_on_sale,
        p.sale_price,
        c.id as category_id,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_published = 1
    `;
    const params = [];

    if (category) {
      const value = String(category);
      if (/^\d+$/.test(value)) {
        query += ' AND p.category_id = ?';
        params.push(value);
      } else {
        query += ' AND c.name = ?';
        params.push(value);
      }
    }

    if (featured === 'true') {
      query += ' AND p.is_featured = 1';
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY p.created_at DESC';

    const [products] = await pool.query(query, params);

    // Parse JSON images field and format response
    const formattedProducts = products.map(product => {
      let parsedImages = [];
      if (product.images) {
        try {
          parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        } catch (e) {
          parsedImages = [];
        }
      }

      return {
        id: product.id.toString(),
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
        isOnSale: product.is_on_sale === 1 || product.is_on_sale === true,
        stock: product.stock,
        introImage: product.intro_image,
        images: parsedImages,
        isFeatured: product.is_featured === 1 || product.is_featured === true,
        category: {
          id: product.category_id,
          name: product.category_name || 'Uncategorized'
        }
      };
    });

    res.json(formattedProducts);
  } catch (error) {
    console.error('Get public products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product (public - published only)
router.get('/products/:id', async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT 
        p.*,
        c.id as category_id,
        c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.is_published = 1`,
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];

    // Safely parse images
    let parsedImages = [];
    if (product.images) {
      try {
        parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      } catch (e) {
        parsedImages = [];
      }
    }

    res.json({
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
      isOnSale: product.is_on_sale === 1 || product.is_on_sale === true,
      stock: product.stock,
      introImage: product.intro_image,
      images: parsedImages,
      isFeatured: product.is_featured === 1 || product.is_featured === true,
      category: {
        id: product.category_id,
        name: product.category_name || 'Uncategorized'
      },
      sizes: (() => {
        try {
          const parsed = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })(),
      hides: (() => {
        try {
          const parsed = typeof product.hides === 'string' ? JSON.parse(product.hides) : product.hides;
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })()
    });
  } catch (error) {
    console.error('Get public product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/messages', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and a message are required' });
    }
    await pool.query(
      'INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [String(name).slice(0, 255), String(email).slice(0, 255), String(subject || '').slice(0, 255), String(message)]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Save message error:', error);
    res.status(500).json({ error: 'The note could not be saved' });
  }
});

// Create order (public)
router.post('/orders', async (req, res) => {
  try {
    const { customer, items, notes } = req.body;

    if (!customer || !customer.name || !customer.email || !customer.phone || !customer.address) {
      return res.status(400).json({ error: 'Customer information is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    // Calculate total
    let total = 0;
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: 'Invalid order item' });
      }

      // Get product price
      const [products] = await pool.query(
        'SELECT price, sale_price, is_on_sale, stock FROM products WHERE id = ? AND is_published = 1',
        [item.product_id]
      );

      if (products.length === 0) {
        return res.status(400).json({ error: `Product ${item.product_id} not found` });
      }

      const product = products[0];
      const itemPrice = (product.is_on_sale && product.sale_price) ? parseFloat(product.sale_price) : parseFloat(product.price);
      
      if (item.quantity > product.stock) {
        return res.status(400).json({ error: `Insufficient stock for product ${item.product_id}` });
      }

      total += itemPrice * item.quantity;
    }

    // Create customer if doesn't exist, or get existing
    let customerId;
    const [existingCustomers] = await pool.query(
      'SELECT id FROM customers WHERE email = ?',
      [customer.email]
    );

    if (existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
      // Update customer info
      await pool.query(
        'UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?',
        [customer.name, customer.phone, customer.address, customerId]
      );
    } else {
      // Create new customer
      const [customerResult] = await pool.query(
        'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
        [customer.name, customer.email, customer.phone, customer.address]
      );
      customerId = customerResult.insertId;
    }

    // Get product details for order items
    const orderItemsData = [];
    for (const item of items) {
      const [products] = await pool.query(
        'SELECT name, price, sale_price, is_on_sale, intro_image FROM products WHERE id = ?',
        [item.product_id]
      );
      
      if (products.length > 0) {
        const product = products[0];
        const itemPrice = (product.is_on_sale && product.sale_price) 
          ? parseFloat(product.sale_price) 
          : parseFloat(product.price);
        
        orderItemsData.push({
          product_id: item.product_id,
          product_name: product.name,
          product_price: itemPrice,
          quantity: item.quantity,
          size: item.size || null,
          color: item.color || null,
          image_url: product.intro_image || null,
        });
      }
    }

    // Create order with customer details
    const [orderResult] = await pool.query(
      `INSERT INTO orders 
       (customer_id, customer_name, customer_email, customer_phone, customer_address, total, status, confirmed, paid, notes) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending', false, false, ?)`,
      [customerId, customer.name, customer.email, customer.phone, customer.address, total, typeof notes === "string" ? notes.slice(0, 2000) : ""]
    );

    const orderId = orderResult.insertId;

    // Create order items
    for (const item of orderItemsData) {
      await pool.query(
        `INSERT INTO order_items 
         (order_id, product_id, product_name, product_price, quantity, size, color, image_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.product_name,
          item.product_price,
          item.quantity,
          item.size,
          item.color,
          item.image_url,
        ]
      );
    }

    // Send email notifications (non-blocking)
    try {
      // Send confirmation email to customer
      sendOrderConfirmationEmail(
        customer.email,
        customer.name,
        orderId,
        orderItemsData,
        total
      ).catch(err => console.error('Error sending customer email:', err));

      // Get admin order email from database
      const [admins] = await pool.query(
        'SELECT order_email FROM admins WHERE order_email IS NOT NULL AND order_email != "" LIMIT 1'
      );
      
      if (admins.length > 0 && admins[0].order_email) {
        // Send notification email to admin
        sendOrderNotificationEmail(
          admins[0].order_email,
          orderId,
          customer.name,
          customer.email,
          customer.phone,
          customer.address,
          orderItemsData,
          total
        ).catch(err => console.error('Error sending admin email:', err));
      } else {
        console.warn('⚠️  No admin order email configured. Admin notification not sent.');
      }
    } catch (emailError) {
      // Don't fail the order if email fails
      console.error('Email sending error (order still created):', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: orderId,
        total,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Create public order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;

