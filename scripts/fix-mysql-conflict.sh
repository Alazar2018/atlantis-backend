#!/bin/bash

# Fix MySQL/MariaDB Conflict
# Removes conflicting MariaDB and configures MySQL properly

set -e

echo "🔧 Fixing MySQL/MariaDB Conflict"
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
echo "Step 1: Checking MySQL error log..."
if [ -f /var/lib/mysql/atlantis.err ]; then
    echo "Recent errors:"
    tail -n 20 /var/lib/mysql/atlantis.err
    echo ""
fi

echo ""
echo "Step 2: Completely removing MariaDB..."
# Remove MariaDB completely
apt remove --purge mariadb-server-10.3 mariadb-server mariadb-client mariadb-common -y 2>/dev/null || true
apt autoremove -y

echo ""
echo "Step 3: Removing freeze file..."
rm -f /etc/mysql/FROZEN

echo ""
echo "Step 4: Cleaning MySQL data directory (if corrupted)..."
# Backup existing data first
if [ -d /var/lib/mysql ] && [ "$(ls -A /var/lib/mysql)" ]; then
    echo -e "${YELLOW}⚠️  MySQL data directory exists. Checking if it's valid...${NC}"
    
    # Check if MySQL can start with existing data
    mysqld_safe --user=mysql --skip-grant-tables --skip-networking &
    sleep 3
    
    if ! pgrep mysqld > /dev/null; then
        echo -e "${YELLOW}⚠️  Existing data appears corrupted. Will reset...${NC}"
        echo "Backing up to /var/lib/mysql.backup..."
        mv /var/lib/mysql /var/lib/mysql.backup
        mkdir -p /var/lib/mysql
        chown mysql:mysql /var/lib/mysql
    else
        pkill mysqld
        echo -e "${GREEN}✅ Existing data appears valid${NC}"
    fi
fi

echo ""
echo "Step 5: Reconfiguring MySQL..."
dpkg --configure -a

echo ""
echo "Step 6: Reinstalling MySQL server..."
apt install --reinstall mysql-server-8.0 -y

echo ""
echo "Step 7: Starting MySQL service..."
systemctl daemon-reload
systemctl start mysql

sleep 2

if systemctl is-active --quiet mysql; then
    echo -e "${GREEN}✅ MySQL is running!${NC}"
    systemctl enable mysql
    systemctl status mysql --no-pager | head -n 10
else
    echo -e "${YELLOW}⚠️  Service didn't start. Checking logs...${NC}"
    journalctl -u mysql.service -n 20 --no-pager
    echo ""
    echo "Trying manual initialization..."
    
    # Initialize MySQL data directory
    mysqld --initialize-insecure --user=mysql --datadir=/var/lib/mysql
    
    # Start again
    systemctl start mysql
    
    if systemctl is-active --quiet mysql; then
        echo -e "${GREEN}✅ MySQL started after initialization!${NC}"
    else
        echo -e "${RED}❌ Still not starting. Check error log:${NC}"
        tail -n 30 /var/log/mysql/error.log 2>/dev/null || tail -n 30 /var/lib/mysql/*.err
    fi
fi

echo ""
echo "MySQL version:"
mysql --version || echo "MySQL command not available yet"

