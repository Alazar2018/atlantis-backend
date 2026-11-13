# Fix MySQL Frozen Installation

Your MySQL installation is frozen because there's likely an existing MariaDB or older MySQL installation. Here's how to fix it:

## Quick Fix (Run This Now)

```bash
# 1. Check what's installed
sudo systemctl status mariadb
sudo systemctl status mysql

# 2. Stop services
sudo systemctl stop mariadb 2>/dev/null || true
sudo systemctl stop mysql 2>/dev/null || true

# 3. Remove freeze file
sudo mv /etc/mysql/FROZEN /etc/mysql/FROZEN.backup

# 4. Reconfigure packages
sudo dpkg --configure -a

# 5. Start MySQL
sudo systemctl start mysql || sudo systemctl start mariadb

# 6. Check if it's working
sudo systemctl status mysql || sudo systemctl status mariadb
mysql --version
```

## OR Use the Unfreeze Script

```bash
cd /var/www/backend
chmod +x scripts/unfreeze-mysql.sh
sudo bash scripts/unfreeze-mysql.sh
```

## If MariaDB is Already Installed

If you see MariaDB is already running, you can use it! MariaDB is 100% compatible with MySQL:

```bash
# Check MariaDB status
sudo systemctl status mariadb

# If running, you can use it directly
sudo mysql -u root -p

# Create database (works the same as MySQL)
CREATE DATABASE atlantis_leather CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'atlantis_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON atlantis_leather.* TO 'atlantis_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Complete Removal and Fresh Install (Last Resort)

If you want to completely remove everything and start fresh:

```bash
# Stop services
sudo systemctl stop mysql mariadb 2>/dev/null

# Remove all MySQL/MariaDB packages
sudo apt remove --purge mysql-server* mariadb-server* mysql-client* mariadb-client* mysql-common mariadb-common -y
sudo apt autoremove -y

# Remove data directories (WARNING: This deletes all data!)
sudo rm -rf /var/lib/mysql
sudo rm -rf /etc/mysql

# Remove freeze file
sudo rm -rf /etc/mysql/FROZEN

# Clean package cache
sudo apt autoclean
sudo apt update

# Fresh install
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
```

## After Unfreezing

Once MySQL/MariaDB is running:

1. **Secure installation:**
   ```bash
   sudo mysql_secure_installation
   ```

2. **Create database:**
   ```bash
   cd /var/www/backend
   chmod +x scripts/setup-database.sh
   bash scripts/setup-database.sh
   ```

3. **Test connection:**
   ```bash
   mysql -u atlantis_user -p atlantis_leather
   ```

