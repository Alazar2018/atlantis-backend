# Quick Deployment Guide

## Quick Start (5 minutes)

### 1. On your VPS server, run:

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs mysql-server git

# Install PM2
sudo npm install -g pm2

# Clone or upload your backend to /var/www/atlantis-backend
cd /var/www/atlantis-backend

# Install dependencies
npm install --production

# Setup database (create database and user first in MySQL)
npm run migrate

# Create .env file with your production settings
nano .env  # Copy from env.example.template

# Make deployment script executable and run
chmod +x deploy.sh
./deploy.sh
```

### 2. Setup Nginx (Optional but recommended)

```bash
sudo apt install nginx
sudo cp .nginx-example.conf /etc/nginx/sites-available/atlantis-backend
sudo nano /etc/nginx/sites-available/atlantis-backend  # Edit domain
sudo ln -s /etc/nginx/sites-available/atlantis-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Setup SSL (Optional)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

## Environment Variables

Make sure your `.env` file has all these variables set:

```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=atlantis_leather
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
JWT_SECRET=generate-secure-random-string
JWT_REFRESH_SECRET=generate-secure-random-string
NEXT_PUBLIC_API_KEY=generate-secure-random-string
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## PM2 Commands

```bash
pm2 status                    # Check status
pm2 logs atlantis-backend    # View logs
pm2 restart atlantis-backend  # Restart
pm2 stop atlantis-backend     # Stop
pm2 monit                     # Monitor
```

## Testing

```bash
curl http://localhost:5000/api/health
```

Should return: `{"status":"ok","message":"Atlantic Leather API is running"}`

## Troubleshooting

- Check logs: `pm2 logs atlantis-backend`
- Check database connection in `.env`
- Verify port 5000 is not blocked
- Check MySQL is running: `sudo systemctl status mysql`

