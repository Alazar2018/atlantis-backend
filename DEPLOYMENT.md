# Atlantic Leather Backend - Deployment Guide

This guide will help you deploy the Atlantic Leather backend API to a VPS server.

## Prerequisites

1. **VPS Server** with:
   - Ubuntu 20.04+ or similar Linux distribution
   - Root or sudo access
   - At least 1GB RAM, 2GB+ recommended

2. **Software Requirements:**
   - Node.js 18.x or higher
   - MySQL 8.0 or higher
   - PM2 (Process Manager)
   - Git
   - Nginx (optional, for reverse proxy)

## Step 1: Server Setup

### Connect to your VPS
```bash
ssh root@your-server-ip
```

### Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v18.x or higher
```

### Install MySQL

**Option A: Using the automated script (Recommended)**
```bash
cd /var/www/atlantis-backend
chmod +x scripts/install-mysql.sh
sudo bash scripts/install-mysql.sh
```

**Option B: Manual installation**
```bash
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation
```

For detailed MySQL setup, see `MYSQL_INSTALL.md`

### Install PM2 globally
```bash
sudo npm install -g pm2
```

### Install Git
```bash
sudo apt install git -y
```

## Step 2: Clone and Setup Project

### Create application directory
```bash
mkdir -p /var/www
cd /var/www
```

### Clone your repository (if using Git)
```bash
git clone your-repository-url atlantis-backend
cd atlantis-backend/atlantis-backend
```

**OR** upload your backend files via FTP/SFTP to `/var/www/atlantis-backend`

### Install dependencies
```bash
npm install --production
```

## Step 3: Database Setup

### Create database and user
```bash
sudo mysql -u root -p
```

In MySQL prompt:
```sql
CREATE DATABASE atlantis_leather CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'atlantis_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON atlantis_leather.* TO 'atlantis_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Run migrations
```bash
npm run migrate
```

## Step 4: Environment Configuration

### Create .env file
```bash
nano .env
```

Add your production configuration:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=atlantis_user
DB_PASSWORD=your_strong_password
DB_NAME=atlantis_leather

# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# JWT Configuration (IMPORTANT: Change these!)
JWT_SECRET=your-very-secure-random-secret-key-here
JWT_REFRESH_SECRET=your-very-secure-random-refresh-secret-key-here
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Public API Key
NEXT_PUBLIC_API_KEY=your-secure-public-api-key-here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin Default Credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_DEFAULT_PASSWORD=change-this-password
```

**Generate secure secrets:**
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Set file permissions
```bash
chmod 600 .env
```

## Step 5: Create Logs Directory

```bash
mkdir -p logs
```

## Step 6: Start with PM2

### Start the application
```bash
pm2 start ecosystem.config.js --env production
```

### Save PM2 configuration
```bash
pm2 save
```

### Setup PM2 to start on boot
```bash
pm2 startup
# Run the command that PM2 outputs
```

### Useful PM2 commands
```bash
pm2 status              # Check status
pm2 logs                # View logs
pm2 logs atlantis-backend  # View specific app logs
pm2 restart atlantis-backend  # Restart app
pm2 stop atlantis-backend    # Stop app
pm2 delete atlantis-backend  # Remove from PM2
pm2 monit               # Monitor resources
```

## Step 7: Setup Nginx Reverse Proxy (Recommended)

### Install Nginx
```bash
sudo apt install nginx -y
```

### Create Nginx configuration
```bash
sudo nano /etc/nginx/sites-available/atlantis-backend
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.your-domain.com;  # Change to your domain

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/atlantis-backend /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 8: Setup SSL Certificate (Recommended)

### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Get SSL certificate
```bash
sudo certbot --nginx -d api.your-domain.com
```

Follow the prompts. Certbot will automatically configure Nginx for HTTPS.

## Step 9: Firewall Configuration

### Allow necessary ports
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Step 10: Verify Deployment

### Test the API
```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{"status":"ok","message":"Atlantic Leather API is running"}
```

### Test from external
```bash
curl https://api.your-domain.com/api/health
```

## Troubleshooting

### Check application logs
```bash
pm2 logs atlantis-backend
tail -f logs/pm2-error.log
```

### Check Nginx logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check MySQL status
```bash
sudo systemctl status mysql
```

### Restart services
```bash
pm2 restart atlantis-backend
sudo systemctl restart nginx
sudo systemctl restart mysql
```

## Updating the Application

```bash
cd /var/www/atlantis-backend
git pull  # If using Git
# OR upload new files via SFTP
npm install --production
pm2 restart atlantis-backend
```

## Security Checklist

- [ ] Changed default JWT secrets
- [ ] Changed default admin password
- [ ] Database user has strong password
- [ ] .env file has correct permissions (600)
- [ ] Firewall is configured
- [ ] SSL certificate is installed
- [ ] Nginx is configured correctly
- [ ] PM2 is set to auto-restart
- [ ] Regular backups are configured

## Backup Strategy

### Database Backup
```bash
# Create backup script
sudo nano /usr/local/bin/backup-db.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/atlantis"
mkdir -p $BACKUP_DIR
mysqldump -u atlantis_user -p'your_password' atlantis_leather > $BACKUP_DIR/db_backup_$DATE.sql
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-db.sh
```

### Setup automated backup (cron)
```bash
sudo crontab -e
```

Add (runs daily at 2 AM):
```
0 2 * * * /usr/local/bin/backup-db.sh
```

## Monitoring

### Check PM2 status
```bash
pm2 status
pm2 monit
```

### System resources
```bash
htop
df -h  # Disk space
free -h  # Memory
```

## Support

For issues, check:
1. PM2 logs: `pm2 logs atlantis-backend`
2. Nginx logs: `/var/log/nginx/error.log`
3. Application logs: `logs/pm2-error.log`

