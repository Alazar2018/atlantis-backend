#!/bin/bash

# Quick MySQL Fix - Run this on your VPS

echo "🔧 Quick MySQL Fix"
echo "=================="

# Remove MariaDB completely
echo "Removing MariaDB..."
sudo apt remove --purge mariadb-server-10.3 mariadb-server mariadb-client mariadb-common -y
sudo apt autoremove -y

# Remove freeze
echo "Removing freeze..."
sudo rm -f /etc/mysql/FROZEN

# Check error log
echo "Checking error log..."
sudo tail -n 20 /var/lib/mysql/atlantis.err 2>/dev/null || echo "No error log found"

# Reconfigure
echo "Reconfiguring MySQL..."
sudo dpkg --configure -a

# Initialize MySQL if needed
echo "Checking MySQL initialization..."
if [ ! -d /var/lib/mysql/mysql ]; then
    echo "Initializing MySQL data directory..."
    sudo mysqld --initialize-insecure --user=mysql --datadir=/var/lib/mysql
fi

# Start MySQL
echo "Starting MySQL..."
sudo systemctl daemon-reload
sudo systemctl start mysql

sleep 2

# Check status
if sudo systemctl is-active --quiet mysql; then
    echo "✅ MySQL is running!"
    sudo systemctl status mysql --no-pager | head -n 5
else
    echo "❌ MySQL not running. Error log:"
    sudo tail -n 30 /var/log/mysql/error.log 2>/dev/null || sudo tail -n 30 /var/lib/mysql/*.err
fi

