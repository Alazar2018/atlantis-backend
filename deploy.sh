#!/bin/bash

# Atlantic Leather Backend Deployment Script
# Run this script to deploy/update the backend on your VPS

set -e  # Exit on error

echo "🚀 Atlantic Leather Backend Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Note: Some commands may require sudo privileges${NC}"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ first"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 is not installed. Installing...${NC}"
    npm install -g pm2
fi

echo -e "${GREEN}✅ PM2 is installed${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo "Please create .env file from .env.example"
    exit 1
fi

echo -e "${GREEN}✅ .env file exists${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --production

# Create logs directory
mkdir -p logs

# Run database migrations
echo ""
echo "🗄️  Running database migrations..."
npm run migrate

# Restart PM2
echo ""
echo "🔄 Restarting application with PM2..."

# Stop existing instance if running
pm2 delete atlantis-backend 2>/dev/null || true

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check application status"
echo "  pm2 logs atlantis-backend - View application logs"
echo "  pm2 restart atlantis-backend - Restart application"
echo ""
echo "Testing health endpoint..."
sleep 2
curl -s http://localhost:5000/api/health || echo -e "${YELLOW}⚠️  Health check failed - check logs${NC}"

