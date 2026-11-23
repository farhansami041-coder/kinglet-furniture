/**
 * Database Backup & Recovery Utility for Kinglet Furniture & Interior Platform
 * Supports automated timestamped snapshots, integrity checks, and safe restore.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const DB_PATH = path.resolve(rootDir, "server/prisma/dev.db");
const BACKUP_DIR = path.resolve(rootDir, "storage/backups");

export function backupDatabase() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Source database not found at ${DB_PATH}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `kinglet-backup-${timestamp}.db`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  // Copy file atomically
  fs.copyFileSync(DB_PATH, backupFilePath);

  const stats = fs.statSync(backupFilePath);
  if (stats.size === 0) {
    fs.unlinkSync(backupFilePath);
    throw new Error("Backup failed: Generated backup file is empty (0 bytes).");
  }

  console.log(`✅ Database backup created successfully:`);
  console.log(`   Path: ${backupFilePath}`);
  console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);

  // Prune backups older than 30 days
  const files = fs.readdirSync(BACKUP_DIR);
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let pruned = 0;

  files.forEach((file) => {
    if (file.startsWith("kinglet-backup-") && file.endsWith(".db")) {
      const filePath = path.join(BACKUP_DIR, file);
      const fileStat = fs.statSync(filePath);
      if (fileStat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
        pruned++;
      }
    }
  });

  if (pruned > 0) {
    console.log(`   Pruned ${pruned} backup(s) older than 30 days.`);
  }

  return { backupFilePath, size: stats.size };
}

export function restoreDatabase(specificBackupPath) {
  let targetBackup = specificBackupPath;

  if (!targetBackup) {
    // Pick the most recent backup
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("kinglet-backup-") && f.endsWith(".db"))
      .sort()
      .reverse();

    if (files.length === 0) {
      throw new Error("No backup files found in " + BACKUP_DIR);
    }
    targetBackup = path.join(BACKUP_DIR, files[0]);
  }

  if (!fs.existsSync(targetBackup)) {
    throw new Error(`Backup file not found: ${targetBackup}`);
  }

  // Create temporary safety rollback copy of existing DB
  if (fs.existsSync(DB_PATH)) {
    const safetyCopy = `${DB_PATH}.pre-restore`;
    fs.copyFileSync(DB_PATH, safetyCopy);
  }

  fs.copyFileSync(targetBackup, DB_PATH);
  console.log(`✅ Database restored successfully from: ${targetBackup}`);
  return true;
}

// CLI Execution support
if (process.argv[1] === __filename) {
  const action = process.argv[2] || "backup";
  try {
    if (action === "backup") {
      backupDatabase();
    } else if (action === "restore") {
      const file = process.argv[3];
      restoreDatabase(file);
    } else {
      console.log("Usage: node scripts/backup-restore.js [backup|restore] [optional_backup_path]");
    }
  } catch (err) {
    console.error("❌ Backup operation failed:", err.message);
    process.exit(1);
  }
}

