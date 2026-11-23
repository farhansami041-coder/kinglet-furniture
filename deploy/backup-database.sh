#!/usr/bin/env bash
# ============================================================
# KINGLET FURNITURE - AUTOMATED DAILY MYSQL DATABASE BACKUP
# Usage: ./backup-database.sh
# Cron (Runs daily at 3:00 AM):
# 0 3 * * * /var/www/kinglet/deploy/backup-database.sh >> /var/log/kinglet-backup.log 2>&1
# ============================================================

set -e

BACKUP_DIR="/var/backups/kinglet_mysql"
DB_NAME="kinglet_production"
DB_USER="root"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/kinglet_db_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "💾 Starting MySQL Backup for [$DB_NAME] at $(date)..."
mysqldump --single-transaction --quick --lock-tables=false -u "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "✅ Backup successfully created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Retention Policy: Automatically delete backups older than 30 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -exec rm {} \;
echo "🧹 Old backups pruned (Retaining 30 days of archives)."

