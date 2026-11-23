#!/usr/bin/env bash
# ============================================================
# KINGLET FURNITURE & INTERIOR - PRODUCTION SERVER INITIAL SETUP
# Target OS: Ubuntu 22.04 / 24.04 LTS
# Run: chmod +x setup-server.sh && sudo ./setup-server.sh
# ============================================================

set -e

echo "🚀 [1/7] Updating Ubuntu packages..."
sudo apt update && sudo apt upgrade -y

echo "📦 [2/7] Installing Essential Build Tools, Git, Curl, Unzip..."
sudo apt install -y curl wget git unzip build-essential software-properties-common ufw

echo "⚡ [3/7] Installing Node.js LTS (v20.x) & PM2 Process Manager..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

echo "🗄️ [4/7] Installing MySQL 8.0 Server..."
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql

echo "🌐 [5/7] Installing Nginx Web Server & Certbot for Free SSL..."
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
sudo systemctl start nginx

echo "🛡️ [6/7] Configuring UFW Firewall (SSH, HTTP, HTTPS)..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "📁 [7/7] Creating Web Directory Structure at /var/www/kinglet..."
sudo mkdir -p /var/www/kinglet
sudo chown -R $USER:$USER /var/www/kinglet

echo "============================================================"
echo "✅ Production Server Foundation Successfully Initialized!"
echo "Node.js Version: $(node -v)"
echo "NPM Version:     $(npm -v)"
echo "PM2 Version:     $(pm2 -v)"
echo "Nginx Version:   $(nginx -v 2>&1)"
echo "MySQL Status:    $(sudo systemctl is-active mysql)"
echo "============================================================"
echo "Next step: Clone repository into /var/www/kinglet and run deploy.sh"

