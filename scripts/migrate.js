const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const createTables = async () => {
  try {
    const connection = await pool.getConnection();

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'atlantis_leather'}`);
    await connection.query(`USE ${process.env.DB_NAME || 'atlantis_leather'}`);

    // Categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        image_url LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category_id INT,
        stock INT DEFAULT 0,
        intro_image LONGTEXT,
        images LONGTEXT,
        is_published BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        is_on_sale BOOLEAN DEFAULT false,
        sale_price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // Add sale fields if they don't exist (for existing databases)
    try {
      await connection.query('ALTER TABLE products ADD COLUMN is_on_sale BOOLEAN DEFAULT false');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('Note: Could not add is_on_sale column (might already exist)');
      }
    }
    try {
      await connection.query('ALTER TABLE products ADD COLUMN sale_price DECIMAL(10, 2)');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('Note: Could not add sale_price column (might already exist)');
      }
    }

    // API Keys table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        public_key VARCHAR(255) NOT NULL UNIQUE,
        private_key VARCHAR(500) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Admins table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        refresh_token VARCHAR(500),
        low_stock_threshold INT DEFAULT 10,
        order_email VARCHAR(255),
        profile_image LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add new columns if they don't exist (for existing databases)
    const newColumns = [
      { name: 'refresh_token', type: 'VARCHAR(500)' },
      { name: 'low_stock_threshold', type: 'INT DEFAULT 10' },
      { name: 'order_email', type: 'VARCHAR(255)' },
      { name: 'profile_image', type: 'VARCHAR(500)' }
    ];

    for (const column of newColumns) {
      try {
        await connection.query(`ALTER TABLE admins ADD COLUMN ${column.name} ${column.type}`);
      } catch (error) {
        if (!error.message.includes('Duplicate column name')) {
          console.warn(`Note: Could not add ${column.name} column (might already exist)`);
        }
      }
    }

    // Customers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_email (email)
      )
    `);

    // Orders table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        customer_address TEXT NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'confirmed', 'paid', 'cancelled') DEFAULT 'pending',
        confirmed BOOLEAN DEFAULT false,
        paid BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        INDEX idx_status (status),
        INDEX idx_confirmed (confirmed),
        INDEX idx_paid (paid)
      )
    `);

    // Order items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT,
        product_name VARCHAR(255) NOT NULL,
        product_price DECIMAL(10, 2) NOT NULL,
        quantity INT NOT NULL,
        size VARCHAR(50),
        color VARCHAR(50),
        image_url LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ All tables created successfully');

    // Create default admin if it doesn't exist
    const bcrypt = require('bcryptjs');
    const [admins] = await connection.query('SELECT * FROM admins WHERE email = ?', [
      process.env.ADMIN_EMAIL || 'admin@atlanticleather.com'
    ]);

    if (admins.length === 0 && process.env.ADMIN_DEFAULT_PASSWORD) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD, 10);
      await connection.query(
        'INSERT INTO admins (email, password, name) VALUES (?, ?, ?)',
        [
          process.env.ADMIN_EMAIL || 'admin@atlanticleather.com',
          hashedPassword,
          'Admin'
        ]
      );
      console.log('✅ Default admin user created');
      console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@atlanticleather.com'}`);
    }

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

createTables();

