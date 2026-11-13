const nodemailer = require('nodemailer');

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

/**
 * Send order confirmation email to customer
 */
async function sendOrderConfirmationEmail(customerEmail, customerName, orderId, orderItems, total) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️  SMTP credentials not configured. Email not sent.');
      return false;
    }

    const itemsList = orderItems.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${item.product_name}</strong><br>
          <small>Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'} | Quantity: ${item.quantity}</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ETB ${(item.product_price * item.quantity).toLocaleString()}
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #941b1f; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .total { font-size: 18px; font-weight: bold; color: #941b1f; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Atlantic Leather</h1>
              <p>Order Confirmation</p>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>Thank you for your order! We have received your order <strong>#${orderId}</strong> and will process it shortly.</p>
              
              <h3>Order Summary</h3>
              <table>
                ${itemsList}
                <tr>
                  <td style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 10px; text-align: right;" class="total">ETB ${total.toLocaleString()}</td>
                </tr>
              </table>
              
              <p>Your order status is currently <strong>Pending</strong>. We will confirm your order and contact you soon.</p>
              <p>If you have any questions, please don't hesitate to contact us.</p>
              <p>Best regards,<br>Atlantic Leather Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Atlantic Leather. All rights reserved.</p>
              <p>Tatek Industry Zone, Sheger City | +251 963 666646</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Atlantic Leather" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `Order Confirmation - Order #${orderId}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent to ${customerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error);
    return false;
  }
}

/**
 * Send order notification email to admin
 */
async function sendOrderNotificationEmail(adminEmail, orderId, customerName, customerEmail, customerPhone, customerAddress, orderItems, total) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️  SMTP credentials not configured. Email not sent.');
      return false;
    }

    if (!adminEmail) {
      console.warn('⚠️  Admin order email not configured. Skipping notification.');
      return false;
    }

    const itemsList = orderItems.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${item.product_name}</strong><br>
          <small>Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'} | Quantity: ${item.quantity}</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ETB ${(item.product_price * item.quantity).toLocaleString()}
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #941b1f; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .total { font-size: 18px; font-weight: bold; color: #941b1f; }
            .customer-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Order Received</h1>
            </div>
            <div class="content">
              <div class="alert">
                <strong>⚠️ New Order Notification</strong><br>
                A new order has been placed and requires your attention.
              </div>
              
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> #${orderId}</p>
              <p><strong>Status:</strong> Pending</p>
              
              <h3>Customer Information</h3>
              <div class="customer-info">
                <p><strong>Name:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${customerEmail}</p>
                <p><strong>Phone:</strong> ${customerPhone}</p>
                <p><strong>Address:</strong> ${customerAddress}</p>
              </div>
              
              <h3>Order Items</h3>
              <table>
                ${itemsList}
                <tr>
                  <td style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 10px; text-align: right;" class="total">ETB ${total.toLocaleString()}</td>
                </tr>
              </table>
              
              <p><strong>Action Required:</strong> Please review and confirm this order in the admin panel.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Atlantic Leather Orders" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `New Order #${orderId} - ${customerName}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Order notification email sent to admin: ${adminEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending order notification email:', error);
    return false;
  }
}

async function sendLowStockEmail(adminEmail, productName, stock, threshold) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn(`Low stock: ${productName} has ${stock} left. Email not sent because SMTP is not configured.`);
      return false;
    }

    await transporter.sendMail({
      from: `"Atlantic Leather" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `Low stock: ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #161616;">
          <h1 style="color: #941A20;">Low stock</h1>
          <p><strong>${productName}</strong> now has ${stock} left. The desk warns under ${threshold}.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Low stock email error:", error);
    return false;
  }
}

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderNotificationEmail,
  sendLowStockEmail,
};

