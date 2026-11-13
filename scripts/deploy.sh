#!/bin/bash

# Atlantic Leather Backend Deployment Script
# Deploys the backend application using PM2

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🚀 Atlantic Leather Backend Deployment"
echo "======================================"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo ""
echo "Step 1: Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing globally...${NC}"
    sudo npm install -g pm2
fi
PM2_VERSION=$(pm2 --version)
echo -e "${GREEN}✅ PM2: v$PM2_VERSION${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env file from env.example.template"
    exit 1
fi
echo -e "${GREEN}✅ .env file exists${NC}"

# Check if MySQL is running
if ! systemctl is-active --quiet mysql && ! systemctl is-active --quiet mariadb; then
    echo -e "${YELLOW}⚠️  MySQL/MariaDB is not running${NC}"
    echo "Starting MySQL..."
    sudo systemctl start mysql || sudo systemctl start mariadb || true
fi
echo -e "${GREEN}✅ Database service is running${NC}"

echo ""
echo "Step 2: Installing production dependencies..."
npm install --production

echo ""
echo "Step 3: Creating logs directory..."
mkdir -p logs

echo ""
echo "Step 4: Stopping existing PM2 process (if any)..."
pm2 delete atlantis-backend 2>/dev/null || true
pm2 kill 2>/dev/null || true

echo ""
echo "Step 5: Starting application with PM2..."
pm2 start ecosystem.config.js --env production

echo ""
echo "Step 6: Saving PM2 process list..."
pm2 save

echo ""
echo "Step 7: Checking application status..."
sleep 2
pm2 status

echo ""
echo "Step 8: Viewing logs (last 20 lines)..."
echo "=========================="
pm2 logs atlantis-backend --lines 20 --nostream

echo ""
echo "=========================="
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check application status"
echo "  pm2 logs atlantis-backend - View logs"
echo "  pm2 restart atlantis-backend - Restart application"
echo "  pm2 stop atlantis-backend - Stop application"
echo ""
echo "Setup PM2 to start on boot:"
echo "  pm2 startup"
echo "  (Follow the instructions shown)"

