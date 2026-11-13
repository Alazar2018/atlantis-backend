#!/bin/bash

# Fix MySQL Installation Dependencies
# This script resolves common dependency issues when installing MySQL

set -e

echo "🔧 Fixing MySQL Installation Dependencies"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ This script must be run with sudo${NC}"
    exit 1
fi

echo ""
echo "Step 1: Checking for existing MySQL/MariaDB installations..."
if systemctl is-active --quiet mysql 2>/dev/null || systemctl is-active --quiet mariadb 2>/dev/null; then
    echo -e "${YELLOW}⚠️  MySQL/MariaDB service is already running${NC}"
    echo "Checking version..."
    mysql --version 2>/dev/null || mariadb --version 2>/dev/null
    echo -e "${GREEN}MySQL/MariaDB is already installed and running!${NC}"
    echo "You can skip installation and use the setup-database.sh script instead."
    exit 0
fi

echo ""
echo "Step 2: Cleaning package cache..."
apt clean
apt autoclean
apt autoremove -y

echo ""
echo "Step 3: Updating package lists..."
apt update

echo ""
echo "Step 4: Checking for conflicting packages..."
# Check for MariaDB
if dpkg -l | grep -q mariadb-server; then
    echo -e "${YELLOW}⚠️  MariaDB is installed. Removing it first...${NC}"
    systemctl stop mariadb 2>/dev/null || true
    apt remove --purge mariadb-server mariadb-common -y
    apt autoremove -y
fi

# Check for old MySQL packages
if dpkg -l | grep -q mysql-server; then
    echo -e "${YELLOW}⚠️  Old MySQL packages found. Removing them...${NC}"
    apt remove --purge mysql-server* mysql-common -y
    apt autoremove -y
fi

echo ""
echo "Step 5: Fixing broken dependencies..."
apt install -f -y

echo ""
echo "Step 6: Installing MySQL Server..."
apt install mysql-server -y

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ MySQL installed successfully!${NC}"
    
    # Start and enable MySQL
    systemctl start mysql
    systemctl enable mysql
    
    echo ""
    echo "MySQL version:"
    mysql --version
    
    echo ""
    echo "MySQL service status:"
    systemctl status mysql --no-pager | head -n 5
    
    echo ""
    echo -e "${GREEN}Next step: Run mysql_secure_installation${NC}"
    echo "Command: sudo mysql_secure_installation"
else
    echo ""
    echo -e "${RED}❌ Installation failed. Trying alternative method...${NC}"
    
    echo ""
    echo "Trying to install from MySQL APT repository..."
    
    # Download MySQL APT repository
    cd /tmp
    wget https://dev.mysql.com/get/mysql-apt-config_0.8.24-1_all.deb
    
    # Install MySQL APT repository
    dpkg -i mysql-apt-config_0.8.24-1_all.deb || true
    
    # Update packages
    apt update
    
    # Try installing MySQL again
    apt install mysql-server -y
    
    if [ $? -eq 0 ]; then
        systemctl start mysql
        systemctl enable mysql
        echo -e "${GREEN}✅ MySQL installed successfully using MySQL repository!${NC}"
    else
        echo -e "${RED}❌ Installation still failed.${NC}"
        echo ""
        echo "Try manual installation:"
        echo "1. sudo apt update && sudo apt upgrade"
        echo "2. sudo apt install mysql-server-8.0"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✅ MySQL installation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Secure MySQL: sudo mysql_secure_installation"
echo "2. Create database: Run scripts/setup-database.sh"
echo "3. Or use: sudo mysql -u root -p"

