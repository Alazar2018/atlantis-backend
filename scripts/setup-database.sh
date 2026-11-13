#!/bin/bash

# Setup Database Script
# Creates database and user for Atlantic Leather backend

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🗄️  Atlantic Leather Database Setup"
echo "===================================="

# Prompt for database details
read -p "Enter MySQL root password (or press Enter if no password): " ROOT_PASSWORD
read -p "Enter desired database name (default: atlantis_leather): " DB_NAME
DB_NAME=${DB_NAME:-atlantis_leather}

read -p "Enter desired MySQL username (default: atlantis_user): " DB_USER
DB_USER=${DB_USER:-atlantis_user}

read -s -p "Enter desired MySQL password for ${DB_USER}: " DB_PASSWORD
echo ""
read -s -p "Confirm MySQL password for ${DB_USER}: " DB_PASSWORD_CONFIRM
echo ""

if [ "$DB_PASSWORD" != "$DB_PASSWORD_CONFIRM" ]; then
    echo -e "${RED}❌ Passwords do not match. Exiting.${NC}"
    exit 1
fi

echo ""
echo "Creating database and user..."

# Build MySQL command
if [ -z "$ROOT_PASSWORD" ]; then
    MYSQL_CMD="sudo mysql -u root"
else
    MYSQL_CMD="sudo mysql -u root -p${ROOT_PASSWORD}"
fi

# Create database and user
$MYSQL_CMD <<EOF
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database and user created successfully!' AS Status;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Database and user created successfully!${NC}"
    echo ""
    echo "Database configuration:"
    echo "  Database Name: ${DB_NAME}"
    echo "  Username: ${DB_USER}"
    echo "  Password: ${DB_PASSWORD}"
    echo ""
    echo -e "${YELLOW}Add these to your .env file:${NC}"
    echo "DB_HOST=localhost"
    echo "DB_USER=${DB_USER}"
    echo "DB_PASSWORD=${DB_PASSWORD}"
    echo "DB_NAME=${DB_NAME}"
    echo ""
    echo "Next step: Run 'npm run migrate' to create tables"
else
    echo -e "${RED}❌ Failed to create database/user${NC}"
    exit 1
fi
