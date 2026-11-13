const pool = require('../config/database');

async function fixOrderItemsImage() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ Connected to database');

    // Fix order_items table image_url column to LONGTEXT
    console.log('🔧 Altering order_items.image_url column to LONGTEXT...');
    try {
      await connection.query('ALTER TABLE order_items MODIFY COLUMN image_url LONGTEXT');
      console.log('✅ order_items.image_url updated');
    } catch (error) {
      console.error('⚠️  Error updating order_items.image_url:', error.message);
    }

    console.log('\n✅ Order items image column migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    if (connection) connection.release();
  }
}

fixOrderItemsImage();

