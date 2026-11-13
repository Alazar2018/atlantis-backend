const pool = require("../config/database");

async function addColumn(connection, sql) {
  try {
    await connection.query(sql);
    console.log(sql);
  } catch (error) {
    if (!/Duplicate column/i.test(error.message)) {
      console.warn(error.message);
    }
  }
}

async function main() {
  const connection = await pool.getConnection();
  try {
    await addColumn(connection, "ALTER TABLE admins ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'admin'");
    await connection.query("UPDATE admins SET role = 'admin' WHERE role IS NULL OR role = ''");

    await addColumn(connection, "ALTER TABLE products ADD COLUMN sizes TEXT NULL");
    await addColumn(connection, "ALTER TABLE products ADD COLUMN hides TEXT NULL");

    await addColumn(connection, "ALTER TABLE orders ADD COLUMN shipped BOOLEAN NOT NULL DEFAULT false");
    try {
      await connection.query(
        "ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'confirmed', 'paid', 'shipped', 'cancelled') DEFAULT 'pending'"
      );
      console.log("orders.status includes shipped");
    } catch (error) {
      console.warn(error.message);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("messages table ready");
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
