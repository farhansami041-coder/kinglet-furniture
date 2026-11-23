#!/usr/bin/env bash
# ============================================================
# KINGLET FURNITURE - ZERO-DOWNTIME PRODUCTION DEPLOYMENT
# Usage: ./deploy.sh
# ============================================================

set -e

PROJECT_DIR="/var/www/kinglet"
cd "$PROJECT_DIR"

echo "🔄 [1/6] Pulling latest updates from Git repository..."
git pull origin main

echo "📦 [2/6] Installing backend production dependencies..."
cd "$PROJECT_DIR/server"
npm ci --omit=dev

echo "🗄️ [3/6] Synchronizing Database Schema with Prisma..."
npx prisma generate
npx prisma db push --skip-generate

echo "🎨 [4/6] Installing frontend dependencies & building production bundle..."
cd "$PROJECT_DIR"
npm ci
npm run build

echo "⚡ [5/6] Zero-Downtime Reloading PM2 Node.js Cluster..."
pm2 reload ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production
pm2 save

echo "🌐 [6/6] Reloading Nginx Configuration..."
sudo nginx -t && sudo systemctl reload nginx

echo "============================================================"
echo "🎉 Kinglet Furniture Live Deployment Completed Successfully!"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"
pm2 status kinglet-api

