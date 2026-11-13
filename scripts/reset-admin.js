#!/usr/bin/env node

/**
 * Reset Admin Password Script
 * 
 * Usage: node scripts/reset-admin.js [email] [new-password]
 * 
 * If email is not provided, it will list all admins.
 * If password is not provided, it will prompt for it.
 */

require('dotenv').config();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function resetAdmin() {
  try {
    // Get email from command line or prompt
    let email = process.argv[2];
    let newPassword = process.argv[3];

    // List all admins if no email provided
    if (!email) {
      console.log('\n📋 Current Admin Accounts:\n');
      const [admins] = await pool.query('SELECT id, email, name, created_at FROM admins ORDER BY id');
      
      if (admins.length === 0) {
        console.log('❌ No admin accounts found.');
        console.log('\n💡 To create a new admin account, run:');
        console.log('   node scripts/create-admin.js your-email@example.com your-password');
        rl.close();
        process.exit(0);
      }

      admins.forEach((admin, index) => {
        console.log(`  ${index + 1}. ID: ${admin.id}`);
        console.log(`     Email: ${admin.email}`);
        console.log(`     Name: ${admin.name || 'N/A'}`);
        console.log(`     Created: ${admin.created_at}`);
        console.log('');
      });

      email = await question('\n📧 Enter the email of the admin to reset: ');
      if (!email || email.trim() === '') {
        console.log('❌ Email is required.');
        rl.close();
        process.exit(1);
      }
    }

    // Check if admin exists
    const [admins] = await pool.query('SELECT id, email, name FROM admins WHERE email = ?', [email]);
    
    if (admins.length === 0) {
      console.log(`\n❌ Admin with email "${email}" not found.`);
      console.log('\n💡 Available admins:');
      const [allAdmins] = await pool.query('SELECT email FROM admins');
      allAdmins.forEach(admin => console.log(`   - ${admin.email}`));
      rl.close();
      process.exit(1);
    }

    const admin = admins[0];
    console.log(`\n✅ Found admin: ${admin.email} (${admin.name || 'No name'})`);

    // Get new password
    if (!newPassword) {
      newPassword = await question('\n🔐 Enter new password: ');
      if (!newPassword || newPassword.trim() === '') {
        console.log('❌ Password is required.');
        rl.close();
        process.exit(1);
      }

      const confirmPassword = await question('🔐 Confirm new password: ');
      if (newPassword !== confirmPassword) {
        console.log('❌ Passwords do not match.');
        rl.close();
        process.exit(1);
      }
    }

    // Hash the new password
    console.log('\n🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the admin password
    await pool.query(
      'UPDATE admins SET password = ?, updated_at = NOW() WHERE email = ?',
      [hashedPassword, email]
    );

    console.log(`\n✅ Password reset successfully for ${email}`);
    console.log('\n📝 You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('\n⚠️  Please change this password after logging in!');

  } catch (error) {
    console.error('\n❌ Error resetting password:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

resetAdmin();

