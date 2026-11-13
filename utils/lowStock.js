const pool = require("../config/database");
const { sendLowStockEmail } = require("./email");

async function notifyLowStock(productId, previousStock, nextStock) {
  try {
    const [admins] = await pool.query(
      "SELECT low_stock_threshold, order_email, email FROM admins ORDER BY id ASC LIMIT 1"
    );
    const threshold = Number(admins[0]?.low_stock_threshold) || 10;
    const to = admins[0]?.order_email || admins[0]?.email;
    if (!to || previousStock < threshold || nextStock >= threshold) return;

    const [products] = await pool.query("SELECT name FROM products WHERE id = ?", [productId]);
    await sendLowStockEmail(to, products[0]?.name || "A product", nextStock, threshold);
  } catch (error) {
    console.error("Low stock alert error:", error);
  }
}

module.exports = { notifyLowStock };
