#!/bin/bash

# Manual MySQL Installation (Alternative Method)
# Use this if the automated installation fails

set -e

echo "🗄️  Manual MySQL Installation"
echo "============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ This script must be run with sudo${NC}"
    exit 1
fi

echo ""
echo "This script will try alternative methods to install MySQL..."
echo ""

# Method 1: Install specific MySQL version
echo "Method 1: Installing mysql-server-8.0 directly..."
apt update
apt install mysql-server-8.0 -y

if [ $? -eq 0 ]; then
    systemctl start mysql
    systemctl enable mysql
    echo -e "${GREEN}✅ MySQL installed successfully!${NC}"
    mysql --version
    exit 0
fi

# Method 2: Use MySQL official repository
echo ""
echo "Method 2: Installing from MySQL official repository..."

cd /tmp

# Download MySQL APT repository config
wget https://dev.mysql.com/get/mysql-apt-config_0.8.24-1_all.deb

# Install repository
DEBIAN_FRONTEND=noninteractive dpkg -i mysql-apt-config_0.8.24-1_all.deb || true

# Update
apt update

# Install MySQL
DEBIAN_FRONTEND=noninteractive apt install mysql-server -y

if [ $? -eq 0 ]; then
    systemctl start mysql
    systemctl enable mysql
    echo -e "${GREEN}✅ MySQL installed successfully!${NC}"
    mysql --version
    exit 0
fi

# Method 3: Install MariaDB as alternative
echo ""
echo "Method 3: Installing MariaDB (MySQL-compatible alternative)..."

apt install mariadb-server mariadb-client -y

if [ $? -eq 0 ]; then
    systemctl start mariadb
    systemctl enable mariadb
    echo -e "${GREEN}✅ MariaDB installed successfully (MySQL-compatible)!${NC}"
    echo ""
    echo "Note: MariaDB is compatible with MySQL and will work with this application."
    echo "You can use 'mysql' command to connect: mysql -u root -p"
    mariadb --version
    exit 0
fi

echo -e "${RED}❌ All installation methods failed.${NC}"
echo ""
echo "Please try manual installation:"
echo "1. Check for conflicts: dpkg -l | grep -i mysql"
echo "2. Remove conflicts: sudo apt remove --purge mysql* mariadb*"
echo "3. Clean: sudo apt autoremove && sudo apt autoclean"
echo "4. Try again: sudo apt update && sudo apt install mysql-server"

