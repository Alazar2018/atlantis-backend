# MySQL Installation Troubleshooting

If you encounter dependency errors when installing MySQL, try these solutions:

## Quick Fix Commands

### 1. Fix Broken Dependencies (Try This First)
```bash
sudo apt update
sudo apt install -f -y
sudo apt autoremove -y
sudo apt clean
```

### 2. Remove Conflicting Packages
```bash
# Check for existing MySQL/MariaDB
dpkg -l | grep -i mysql
dpkg -l | grep -i mariadb

# Remove if found
sudo apt remove --purge mysql-server* mariadb-server* mysql-common mariadb-common -y
sudo apt autoremove -y
sudo apt autoclean
```

### 3. Install Specific MySQL Version
```bash
sudo apt update
sudo apt install mysql-server-8.0 -y
```

### 4. Use Fix Script
```bash
cd /var/www/atlantis-backend
chmod +x scripts/fix-mysql-dependencies.sh
sudo bash scripts/fix-mysql-dependencies.sh
```

## Alternative: Install MariaDB (MySQL-Compatible)

If MySQL installation continues to fail, MariaDB is a drop-in replacement:

```bash
sudo apt update
sudo apt install mariadb-server mariadb-client -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

MariaDB is compatible with MySQL and will work with this application. You can use all the same commands (`mysql`, `mysqldump`, etc.)

## Common Errors and Solutions

### Error: "mysql-server-8.0 but it is not going to be installed"

**Solution 1: Fix package dependencies**
```bash
sudo apt update
sudo apt install -f -y
sudo dpkg --configure -a
sudo apt install mysql-server-8.0 -y
```

**Solution 2: Remove and reinstall**
```bash
sudo apt remove mysql-server mysql-server-8.0 mysql-common -y
sudo apt autoremove -y
sudo apt update
sudo apt install mysql-server -y
```

### Error: "held broken packages"

**Solution:**
```bash
sudo apt update
sudo apt --fix-broken install
sudo apt install mysql-server -y
```

### Error: "Package mysql-server has no installation candidate"

**Solution: Add MySQL repository**
```bash
cd /tmp
wget https://dev.mysql.com/get/mysql-apt-config_0.8.24-1_all.deb
sudo dpkg -i mysql-apt-config_0.8.24-1_all.deb
# Select MySQL 8.0 and OK
sudo apt update
sudo apt install mysql-server -y
```

## Manual Database Setup (After MySQL is Installed)

If MySQL installation succeeds but you need to create the database manually:

```bash
sudo mysql -u root -p
```

In MySQL prompt:
```sql
CREATE DATABASE atlantis_leather CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'atlantis_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON atlantis_leather.* TO 'atlantis_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Verify Installation

After installation, verify:
```bash
# Check MySQL version
mysql --version

# Check service status
sudo systemctl status mysql

# Test connection
sudo mysql -u root -p
```

## Still Having Issues?

1. Check system logs: `sudo journalctl -xe`
2. Check MySQL logs: `sudo tail -f /var/log/mysql/error.log`
3. Try installing MariaDB instead (it's compatible)
4. Check your Ubuntu version: `lsb_release -a`

