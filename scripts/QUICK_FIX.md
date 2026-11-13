# Quick Fix for MySQL Installation Error

Run these commands on your VPS server in order:

## Step 1: Fix Broken Dependencies
```bash
sudo apt update
sudo apt install -f -y
sudo apt autoremove -y
```

## Step 2: Remove Conflicting Packages
```bash
# Check what's installed
dpkg -l | grep -i mysql
dpkg -l | grep -i mariadb

# Remove any existing MySQL/MariaDB packages
sudo apt remove --purge mysql-server* mariadb-server* mysql-common mariadb-common mysql-client* mariadb-client* -y
sudo apt autoremove -y
sudo apt autoclean
```

## Step 3: Try Installing Again
```bash
sudo apt update
sudo apt install mysql-server-8.0 -y
```

## OR Install MariaDB Instead (Recommended if MySQL keeps failing)

MariaDB is 100% compatible with MySQL and works perfectly:

```bash
sudo apt update
sudo apt install mariadb-server mariadb-client -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
sudo mysql_secure_installation
```

After installation, you can use MariaDB exactly like MySQL - all commands are the same!

## After Installation: Create Database

```bash
sudo mysql -u root -p
```

Then run:
```sql
CREATE DATABASE atlantis_leather CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'atlantis_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON atlantis_leather.* TO 'atlantis_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

