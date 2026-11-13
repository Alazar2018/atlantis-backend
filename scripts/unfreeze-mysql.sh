#!/bin/bash

# Unfreeze MySQL Installation
# This fixes the "MySQL has been frozen" error

set -e

echo "🔓 Unfreezing MySQL Installation"
echo "================================="

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
echo "Step 1: Checking FROZEN status..."
if [ -f /etc/mysql/FROZEN ]; then
    echo -e "${YELLOW}⚠️  MySQL is frozen. Reading freeze information...${NC}"
    cat /etc/mysql/FROZEN
    echo ""
fi

echo ""
echo "Step 2: Checking for existing MySQL/MariaDB installations..."
if systemctl list-units --type=service | grep -q mariadb; then
    echo -e "${YELLOW}⚠️  MariaDB service found${NC}"
    systemctl status mariadb --no-pager | head -n 5 || true
fi

if systemctl list-units --type=service | grep -q mysql; then
    echo -e "${YELLOW}⚠️  MySQL service found${NC}"
    systemctl status mysql --no-pager | head -n 5 || true
fi

echo ""
echo "Step 3: Removing freeze file..."
if [ -f /etc/mysql/FROZEN ]; then
    mv /etc/mysql/FROZEN /etc/mysql/FROZEN.backup
    echo -e "${GREEN}✅ Freeze file backed up${NC}"
fi

echo ""
echo "Step 4: Stopping any running MySQL/MariaDB services..."
systemctl stop mysql 2>/dev/null || true
systemctl stop mariadb 2>/dev/null || true

echo ""
echo "Step 5: Checking installed packages..."
dpkg -l | grep -E "(mysql|mariadb)" | grep -E "(server|client)" || echo "No MySQL/MariaDB packages found"

echo ""
echo "Step 6: Reconfiguring MySQL packages..."
dpkg --configure -a

echo ""
echo "Step 7: Starting MySQL..."
systemctl start mysql 2>/dev/null || systemctl start mariadb 2>/dev/null || true

echo ""
echo "Step 8: Enabling MySQL on boot..."
systemctl enable mysql 2>/dev/null || systemctl enable mariadb 2>/dev/null || true

echo ""
echo "Checking service status..."
if systemctl is-active --quiet mysql 2>/dev/null || systemctl is-active --quiet mariadb 2>/dev/null; then
    echo -e "${GREEN}✅ MySQL/MariaDB service is running!${NC}"
    systemctl status mysql --no-pager | head -n 5 || systemctl status mariadb --no-pager | head -n 5
    
    echo ""
    echo "MySQL/MariaDB version:"
    mysql --version || mariadb --version
    
    echo ""
    echo -e "${GREEN}✅ MySQL is now unfrozen and running!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Secure installation: sudo mysql_secure_installation"
    echo "2. Create database: Run scripts/setup-database.sh"
    echo "3. Or login: sudo mysql -u root -p"
else
    echo -e "${YELLOW}⚠️  Service is not running. Trying to start manually...${NC}"
    
    # Try to start mysqld directly
    mysqld_safe --user=mysql &
    sleep 3
    
    if systemctl is-active --quiet mysql 2>/dev/null || systemctl is-active --quiet mariadb 2>/dev/null; then
        echo -e "${GREEN}✅ MySQL/MariaDB started!${NC}"
    else
        echo -e "${YELLOW}⚠️  Manual start may be needed${NC}"
        echo "Try: sudo systemctl start mysql"
    fi
fi

