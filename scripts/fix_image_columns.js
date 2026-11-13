/**
 * Migration script to fix image column sizes
 * Changes VARCHAR columns to LONGTEXT to support base64-encoded images
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixImageColumns() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'atlantic_leather',
    });

    console.log('✅ Connected to database');

    // Fix products table
    console.log('🔧 Altering products.intro_image column to LONGTEXT...');
    try {
      await connection.query('ALTER TABLE products MODIFY COLUMN intro_image LONGTEXT');
      console.log('✅ products.intro_image updated');
    } catch (error) {
      console.error('⚠️  Error updating products.intro_image:', error.message);
    }

    console.log('🔧 Altering products.images column to LONGTEXT...');
    try {
      await connection.query('ALTER TABLE products MODIFY COLUMN images LONGTEXT');
      console.log('✅ products.images updated');
    } catch (error) {
      console.error('⚠️  Error updating products.images:', error.message);
    }

    // Fix admins table
    console.log('🔧 Altering admins.profile_image column to LONGTEXT...');
    try {
      await connection.query('ALTER TABLE admins MODIFY COLUMN profile_image LONGTEXT');
      console.log('✅ admins.profile_image updated');
    } catch (error) {
      console.error('⚠️  Error updating admins.profile_image:', error.message);
    }

    // Fix categories table image_url column
    console.log('🔧 Altering categories.image_url column to LONGTEXT...');
    try {
      await connection.query('ALTER TABLE categories MODIFY COLUMN image_url LONGTEXT');
      console.log('✅ categories.image_url updated');
    } catch (error) {
      console.error('⚠️  Error updating categories.image_url:', error.message);
    }

    console.log('\n✅ Image column migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Run migration
fixImageColumns();

