#!/usr/bin/env node

/**
 * List All Admin Accounts
 * 
 * Usage: node scripts/list-admins.js
 */

require('dotenv').config();
const pool = require('../config/database');

async function listAdmins() {
  try {
    console.log('\n📋 Admin Accounts:\n');
    const [admins] = await pool.query(
      'SELECT id, email, name, order_email, created_at FROM admins ORDER BY id'
    );
    
    if (admins.length === 0) {
      console.log('❌ No admin accounts found.');
      console.log('\n💡 To create a new admin account, run:');
      console.log('   node scripts/create-admin.js your-email@example.com your-password');
      process.exit(0);
    }

    admins.forEach((admin, index) => {
      console.log(`  ${index + 1}. ID: ${admin.id}`);
      console.log(`     Email: ${admin.email}`);
      console.log(`     Name: ${admin.name || 'N/A'}`);
      console.log(`     Order Email: ${admin.order_email || 'N/A'}`);
      console.log(`     Created: ${admin.created_at}`);
      console.log('');
    });

    console.log('\n💡 To reset a password, run:');
    console.log('   node scripts/reset-admin.js <email> <new-password>');

  } catch (error) {
    console.error('\n❌ Error listing admins:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

listAdmins();

