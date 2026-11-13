# MySQL Installation Guide for VPS

This guide will help you install and configure MySQL on your VPS server for the Atlantic Leather backend.

## Method 1: Automated Installation Script

### Upload and run the installation script:

```bash
# On your VPS server
cd /var/www/atlantis-backend
chmod +x scripts/install-mysql.sh
sudo bash scripts/install-mysql.sh
```

The script will:
- Install MySQL Server
- Secure MySQL installation
- Optionally create database and user
- Show you what to add to your .env file

## Method 2: Manual Installation

### Step 1: Install MySQL

```bash
# Update package list
sudo apt update

# Install MySQL Server
sudo apt install mysql-server -y

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Check status
sudo systemctl status mysql
```

### Step 2: Secure MySQL Installation

```bash
sudo mysql_secure_installation
```

You'll be prompted to:
1. **Set root password** - Choose a strong password
2. **Remove anonymous users?** - Answer `Y`
3. **Disallow root login remotely?** - Answer `Y` (unless you need remote root access)
4. **Remove test database?** - Answer `Y`
5. **Reload privilege tables?** - Answer `Y`

### Step 3: Create Database and User

Login to MySQL:
```bash
sudo mysql -u root -p
```

Run these commands:
```sql
-- Create database
CREATE DATABASE atlantis_leather CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'atlantis_user'@'localhost' IDENTIFIED BY 'your_strong_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON atlantis_leather.* TO 'atlantis_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
SELECT user, host FROM mysql.user;

-- Exit
EXIT;
```

### Step 4: Test Connection

```bash
mysql -u atlantis_user -p atlantis_leather
```

Enter your password. If successful, you'll see the MySQL prompt.

## Method 3: Using Setup Script (After MySQL is Installed)

If MySQL is already installed and you just need to create the database:

```bash
cd /var/www/atlantis-backend
chmod +x scripts/setup-database.sh
bash scripts/setup-database.sh
```

## Configure Your .env File

After creating the database, add these to your `.env` file:

```env
DB_HOST=localhost
DB_USER=atlantis_user
DB_PASSWORD=your_strong_password_here
DB_NAME=atlantis_leather
DB_PORT=3306
```

## Verify Installation

### Check MySQL version
```bash
mysql --version
```

### Check MySQL service status
```bash
sudo systemctl status mysql
```

### Test connection from backend
```bash
cd /var/www/atlantis-backend
node -e "require('./config/database.js')"
```

Should output: `✅ Database connected successfully`

## Common MySQL Commands

```bash
# Start MySQL
sudo systemctl start mysql

# Stop MySQL
sudo systemctl stop mysql

# Restart MySQL
sudo systemctl restart mysql

# Check status
sudo systemctl status mysql

# Login as root
sudo mysql -u root -p

# Login as database user
mysql -u atlantis_user -p atlantis_leather

# Backup database
mysqldump -u atlantis_user -p atlantis_leather > backup.sql

# Restore database
mysql -u atlantis_user -p atlantis_leather < backup.sql
```

## Troubleshooting

### MySQL won't start
```bash
# Check logs
sudo journalctl -u mysql.service
sudo tail -f /var/log/mysql/error.log
```

### Can't connect to MySQL
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Check if port 3306 is listening
sudo netstat -tlnp | grep 3306
```

### Permission denied errors
- Make sure user has correct privileges: `GRANT ALL PRIVILEGES ON atlantis_leather.* TO 'atlantis_user'@'localhost';`
- Don't forget: `FLUSH PRIVILEGES;`

### Reset MySQL root password (if forgotten)
```bash
sudo systemctl stop mysql
sudo mysqld_safe --skip-grant-tables &
mysql -u root
# Then in MySQL:
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
exit;
sudo systemctl restart mysql
```

## Security Best Practices

1. ✅ Use strong passwords for root and database users
2. ✅ Don't allow root login remotely
3. ✅ Only grant necessary privileges to application user
4. ✅ Regularly backup your database
5. ✅ Keep MySQL updated: `sudo apt update && sudo apt upgrade mysql-server`

## Next Steps

After MySQL is installed and database is created:

1. Update your `.env` file with database credentials
2. Run migrations: `npm run migrate`
3. Start your backend: `pm2 start ecosystem.config.js --env production`

