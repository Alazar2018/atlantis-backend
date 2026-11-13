# Quick Deployment Guide

Follow these steps to deploy your backend:

## 1. Ensure .env is Configured

```bash
cd /var/www/backend
nano .env
```

Make sure these are set:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `FRONTEND_URL` (your frontend domain)
- `PORT=5000`
- `SMTP_*` variables (for email notifications)

## 2. Install PM2 (if not installed)

```bash
sudo npm install -g pm2
```

## 3. Deploy with PM2

**Option A: Use the deployment script**
```bash
cd /var/www/backend
chmod +x scripts/deploy.sh
bash scripts/deploy.sh
```

**Option B: Manual deployment**
```bash
cd /var/www/backend

# Install production dependencies
npm install --production

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs (usually something like: sudo env PATH=... pm2 startup systemd)
```

## 4. Verify Deployment

```bash
# Check status
pm2 status

# Check logs
pm2 logs atlantis-backend

# Test the API (should return JSON)
curl http://localhost:5000/api/public/categories
```

## 5. Setup Nginx Reverse Proxy (Optional but Recommended)

If you have a domain name, set up Nginx:

```bash
# Install Nginx
sudo apt install nginx -y

# Copy configuration
sudo cp .nginx-example.conf /etc/nginx/sites-available/atlantis-backend

# Edit configuration
sudo nano /etc/nginx/sites-available/atlantis-backend
# Update: server_name, proxy_pass if needed

# Enable site
sudo ln -s /etc/nginx/sites-available/atlantis-backend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Setup SSL with Certbot (Optional but Recommended)

```bash
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d your-backend-domain.com
```

## Troubleshooting

### Check PM2 logs
```bash
pm2 logs atlantis-backend --lines 50
```

### Restart application
```bash
pm2 restart atlantis-backend
```

### Check if port is in use
```bash
sudo lsof -i :5000
```

### Check MySQL connection
```bash
mysql -u atlantis_user -p atlantis_leather
```

### View system logs
```bash
sudo journalctl -u mysql -n 50
sudo journalctl -xe | grep pm2
```

