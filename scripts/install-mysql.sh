#!/bin/bash

# MySQL Installation Script for Ubuntu/Debian VPS
# Run this script on your VPS server as root or with sudo

set -e  # Exit on error

echo "🗄️  MySQL Installation Script for Atlantic Leather Backend"
echo "=========================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  This script should be run with sudo${NC}"
    echo "Usage: sudo bash install-mysql.sh"
    exit 1
fi

# Update package list
echo ""
echo "📦 Updating package list..."
apt update

# Install MySQL Server
echo ""
echo "📥 Installing MySQL Server..."

# First, try to fix any broken dependencies
apt install -f -y

# Try installing MySQL
if ! apt install -y mysql-server; then
    echo -e "${YELLOW}⚠️  Standard installation failed. Trying alternative methods...${NC}"
    echo ""
    echo "Running dependency fix script..."
    bash $(dirname "$0")/fix-mysql-dependencies.sh
    exit $?
fi

# Check if MySQL is frozen
if [ -f /etc/mysql/FROZEN ]; then
    echo ""
    echo -e "${YELLOW}⚠️  MySQL installation is frozen!${NC}"
    echo "Running unfreeze script..."
    bash $(dirname "$0")/unfreeze-mysql.sh
    # Continue with the script even if unfreeze has issues
fi

# Start MySQL service
echo ""
echo "🚀 Starting MySQL service..."

# Try to start MySQL or MariaDB
if systemctl start mysql 2>/dev/null; then
    systemctl enable mysql
    SERVICE_NAME="mysql"
elif systemctl start mariadb 2>/dev/null; then
    systemctl enable mariadb
    SERVICE_NAME="mariadb"
else
    echo -e "${YELLOW}⚠️  Could not start service automatically. Checking status...${NC}"
    # Try to unfreeze and reconfigure
    bash $(dirname "$0")/unfreeze-mysql.sh
    SERVICE_NAME="mysql"
fi

# Check MySQL status
echo ""
echo "✅ MySQL/MariaDB Status:"
if [ "$SERVICE_NAME" = "mysql" ]; then
    systemctl status mysql --no-pager | head -n 5 || true
elif [ "$SERVICE_NAME" = "mariadb" ]; then
    systemctl status mariadb --no-pager | head -n 5 || true
fi

# Secure MySQL installation
echo ""
echo "🔒 Securing MySQL installation..."
echo "You will be prompted to:"
echo "  1. Set root password"
echo "  2. Remove anonymous users (Yes)"
echo "  3. Disallow root login remotely (Yes)"
echo "  4. Remove test database (Yes)"
echo "  5. Reload privilege tables (Yes)"
echo ""
read -p "Press Enter to continue with MySQL secure installation..."
mysql_secure_installation

# Get MySQL version
MYSQL_VERSION=$(mysql --version)
echo ""
echo -e "${GREEN}✅ MySQL installed successfully!${NC}"
echo "Version: $MYSQL_VERSION"

# Create database and user
echo ""
echo "📝 Would you like to create the Atlantic Leather database and user? (y/n)"
read -p "> " CREATE_DB

if [ "$CREATE_DB" = "y" ] || [ "$CREATE_DB" = "Y" ]; then
    echo ""
    echo "Enter MySQL root password:"
    read -s ROOT_PASS
    
    echo ""
    echo "Enter a password for the 'atlantis_user' database user:"
    read -s DB_PASS
    
    # Create database and user
    mysql -u root -p"$ROOT_PASS" <<EOF
CREATE DATABASE IF NOT EXISTS atlantis_leather CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'atlantis_user'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON atlantis_leather.* TO 'atlantis_user'@'localhost';
FLUSH PRIVILEGES;
SHOW DATABASES;
EOF
    
    echo ""
    echo -e "${GREEN}✅ Database and user created successfully!${NC}"
    echo ""
    echo "Add these to your .env file:"
    echo "DB_HOST=localhost"
    echo "DB_USER=atlantis_user"
    echo "DB_PASSWORD=$DB_PASS"
    echo "DB_NAME=atlantis_leather"
else
    echo ""
    echo "To create the database manually, run:"
    echo "  sudo mysql -u root -p"
    echo ""
    echo "Then execute:"
    echo "  CREATE DATABASE atlantis_leather CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo "  CREATE USER 'atlantis_user'@'localhost' IDENTIFIED BY 'your_password';"
    echo "  GRANT ALL PRIVILEGES ON atlantis_leather.* TO 'atlantis_user'@'localhost';"
    echo "  FLUSH PRIVILEGES;"
fi

echo ""
echo -e "${GREEN}✅ MySQL installation complete!${NC}"
echo ""
echo "Useful MySQL commands:"
echo "  sudo systemctl status mysql    # Check MySQL status"
echo "  sudo systemctl restart mysql    # Restart MySQL"
echo "  sudo mysql -u root -p           # Login as root"
echo "  mysql -u atlantis_user -p      # Login as atlantis_user"

