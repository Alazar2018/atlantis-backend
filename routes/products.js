const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function storeList(value) {
  const list = parseList(value);
  return list.length ? JSON.stringify(list) : null;
}

function withChoices(product, images) {
  return {
    ...product,
    images,
    sizes: parseList(product.sizes),
    hides: parseList(product.hides),
    isPublished: product.is_published,
    isFeatured: product.is_featured,
    isOnSale: product.is_on_sale,
    salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
    introImage: product.intro_image,
  };
}

// Get all products
router.get('/', async (req, res) => {
  try {
    const { filter, category, search } = req.query;

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (filter === 'published') {
      query += ' AND p.is_published = true';
    } else if (filter === 'unpublished') {
      query += ' AND p.is_published = false';
    } else if (filter === 'featured') {
      query += ' AND p.is_featured = true';
    }

    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY p.created_at DESC';

    const [products] = await pool.query(query, params);

    // Parse JSON images field
    const formattedProducts = products.map(product => {
      // Safely parse images
      let parsedImages = [];
      if (product.images) {
        try {
          parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        } catch (e) {
          parsedImages = [];
        }
      }

      return {
        ...product,
        images: parsedImages,
        isPublished: product.is_published,
        isFeatured: product.is_featured,
        isOnSale: product.is_on_sale,
        salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
        introImage: product.intro_image,
        category: product.category_name || 'Uncategorized'
      };
    });

    res.json(formattedProducts);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
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
      ...withChoices(product, parsedImages),
      category: product.category_name
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('stock').isInt({ min: 0 }).withMessage('Valid stock is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        description,
        price,
        category_id,
        stock,
        intro_image,
        images,
        is_published,
        is_featured,
        is_on_sale,
        sale_price,
        sizes,
        hides
      } = req.body;

      // Handle images - can be array, string, or already JSON string
      let imagesJson = JSON.stringify([]);
      if (images) {
        if (Array.isArray(images)) {
          imagesJson = JSON.stringify(images);
        } else if (typeof images === 'string') {
          // Try to parse if it's a JSON string, otherwise treat as single image
          try {
            JSON.parse(images);
            imagesJson = images; // Already valid JSON
          } catch (e) {
            // It's a single image URL string, wrap in array
            imagesJson = JSON.stringify([images]);
          }
        }
      }

      const [result] = await pool.query(
        `INSERT INTO products 
         (name, description, price, category_id, stock, intro_image, images, is_published, is_featured, is_on_sale, sale_price, sizes, hides)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          description || '',
          price,
          category_id || null,
          stock || 0,
          intro_image || null,
          imagesJson,
          is_published || false,
          is_featured || false,
          is_on_sale || false,
          sale_price || null,
          storeList(sizes),
          storeList(hides)
        ]
      );

      const [newProduct] = await pool.query(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.id = ?`,
        [result.insertId]
      );

      const product = newProduct[0];
      
      // Safely parse images
      let parsedImages = [];
      if (product.images) {
        try {
          parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        } catch (e) {
          parsedImages = [];
        }
      }

      res.status(201).json(withChoices(product, parsedImages));
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// Update product
router.put(
  '/:id',
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        description,
        price,
        category_id,
        stock,
        intro_image,
        images,
        is_published,
        is_featured,
        is_on_sale,
        sale_price,
        sizes,
        hides
      } = req.body;

      // Handle images - can be array, string, or already JSON string
      let imagesJson = JSON.stringify([]);
      if (images) {
        if (Array.isArray(images)) {
          imagesJson = JSON.stringify(images);
        } else if (typeof images === 'string') {
          // Try to parse if it's a JSON string, otherwise treat as single image
          try {
            JSON.parse(images);
            imagesJson = images; // Already valid JSON
          } catch (e) {
            // It's a single image URL string, wrap in array
            imagesJson = JSON.stringify([images]);
          }
        }
      }

      await pool.query(
        `UPDATE products 
         SET name = ?, description = ?, price = ?, category_id = ?, stock = ?, 
             intro_image = ?, images = ?, is_published = ?, is_featured = ?, is_on_sale = ?, sale_price = ?,
             sizes = ?, hides = ?
         WHERE id = ?`,
        [
          name,
          description || '',
          price,
          category_id || null,
          stock || 0,
          intro_image || null,
          imagesJson,
          is_published || false,
          is_featured || false,
          is_on_sale || false,
          sale_price || null,
          storeList(sizes),
          storeList(hides),
          req.params.id
        ]
      );

      const [updated] = await pool.query(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.id = ?`,
        [req.params.id]
      );

      if (updated.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const product = updated[0];
      
      // Safely parse images
      let parsedImages = [];
      if (product.images) {
        try {
          parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        } catch (e) {
          parsedImages = [];
        }
      }

      res.json(withChoices(product, parsedImages));
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

// Delete product
router.post('/:id/duplicate', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const source = rows[0];
    const [result] = await pool.query(
      `INSERT INTO products
        (name, description, price, category_id, stock, intro_image, images, is_published, is_featured, is_on_sale, sale_price, sizes, hides)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)`,
      [
        `Copy of ${source.name}`,
        source.description,
        source.price,
        source.category_id,
        source.stock,
        source.intro_image,
        source.images,
        source.is_on_sale,
        source.sale_price,
        source.sizes,
        source.hides,
      ]
    );
    res.status(201).json({ id: result.insertId, name: `Copy of ${source.name}` });
  } catch (error) {
    console.error('Duplicate product error:', error);
    res.status(500).json({ error: 'Failed to duplicate the product' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Toggle published status
router.patch('/:id/publish', async (req, res) => {
  try {
    const { is_published } = req.body;
    await pool.query('UPDATE products SET is_published = ? WHERE id = ?', [
      is_published,
      req.params.id
    ]);

    res.json({ success: true, message: 'Product status updated' });
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({ error: 'Failed to update product status' });
  }
});

// Toggle featured status
router.patch('/:id/feature', async (req, res) => {
  try {
    const { is_featured } = req.body;
    await pool.query('UPDATE products SET is_featured = ? WHERE id = ?', [
      is_featured,
      req.params.id
    ]);

    res.json({ success: true, message: 'Product featured status updated' });
  } catch (error) {
    console.error('Toggle feature error:', error);
    res.status(500).json({ error: 'Failed to update product featured status' });
  }
});

module.exports = router;

