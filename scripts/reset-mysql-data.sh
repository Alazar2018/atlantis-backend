#!/bin/bash

# Reset MySQL Data Directory
# This removes old MariaDB/MySQL files and creates a fresh MySQL 8.0 installation

set -e

echo "🔄 Resetting MySQL Data Directory"
echo "==================================="

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
echo -e "${YELLOW}⚠️  WARNING: This will remove all existing MySQL data!${NC}"
echo "This is safe if you haven't created any databases yet."
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Stopping MySQL service..."
systemctl stop mysql 2>/dev/null || true
sleep 2

echo ""
echo "Step 2: Backing up existing data directory..."
if [ -d /var/lib/mysql ] && [ "$(ls -A /var/lib/mysql 2>/dev/null)" ]; then
    BACKUP_DIR="/var/lib/mysql.backup.$(date +%Y%m%d_%H%M%S)"
    mv /var/lib/mysql "$BACKUP_DIR"
    echo -e "${GREEN}✅ Backed up to: $BACKUP_DIR${NC}"
else
    echo "No existing data to backup"
fi

echo ""
echo "Step 3: Creating fresh MySQL data directory..."
mkdir -p /var/lib/mysql
chown mysql:mysql /var/lib/mysql
chmod 750 /var/lib/mysql

echo ""
echo "Step 4: Initializing MySQL with fresh data..."
mysqld --initialize-insecure --user=mysql --datadir=/var/lib/mysql

echo ""
echo "Step 5: Starting MySQL service..."
systemctl start mysql

sleep 3

if systemctl is-active --quiet mysql; then
    echo -e "${GREEN}✅ MySQL is running!${NC}"
    systemctl enable mysql
    
    echo ""
    echo "MySQL status:"
    systemctl status mysql --no-pager | head -n 10
    
    echo ""
    echo -e "${GREEN}✅ MySQL successfully initialized!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Secure installation: sudo mysql_secure_installation"
    echo "2. Login (no password needed yet): sudo mysql -u root"
    echo "3. Create database: Run scripts/setup-database.sh"
else
    echo -e "${RED}❌ MySQL failed to start${NC}"
    echo "Checking error log:"
    tail -n 30 /var/log/mysql/error.log 2>/dev/null || tail -n 30 /var/lib/mysql/*.err 2>/dev/null || echo "No error log found"
    exit 1
fi

