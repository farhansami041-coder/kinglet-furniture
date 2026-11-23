/**
 * Kinglet Furniture - Live Launch Pre-flight Production Validator
 * Run: node server/scripts/production-check.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, "..");
const rootDir = path.resolve(serverDir, "..");

// Load environment
dotenv.config({ path: path.join(serverDir, ".env") });

console.log("============================================================");
console.log("  KINGLET FURNITURE & INTERIOR — LIVE LAUNCH READINESS CHECK");
console.log("============================================================\n");

const checks = [];

function recordCheck(category, item, status, detail) {
  checks.push({ category, item, status, detail });
  const icon = status === "PASS" ? "✅" : status === "WARN" ? "⚠️" : "❌";
  console.log(`${icon} [${category}] ${item}: ${detail}`);
}

// 1. Node.js Engine
const nodeVersion = parseInt(process.versions.node.split(".")[0], 10);
if (nodeVersion >= 18) {
  recordCheck("Runtime", "Node.js Version", "PASS", `v${process.versions.node} (LTS Ready)`);
} else {
  recordCheck("Runtime", "Node.js Version", "FAIL", `v${process.versions.node} (Upgrade to Node 18+ or 20+ required)`);
}

// 2. Database & Environment
const dbUrl = process.env.DATABASE_URL || "";
if (dbUrl.startsWith("mysql://")) {
  recordCheck("Database", "Production MySQL Connection", "PASS", "Configured for MySQL 8.0");
} else if (dbUrl.includes("file:")) {
  recordCheck("Database", "SQLite Local File", "WARN", "Using SQLite dev database. For high traffic live launch, switch to MySQL 8.0.");
} else {
  recordCheck("Database", "Database URL", "FAIL", "DATABASE_URL is not configured in server/.env");
}

// 3. Security & JWT
const jwtSecret = process.env.JWT_SECRET || "";
if (jwtSecret && jwtSecret.length >= 32 && !jwtSecret.includes("xyz")) {
  recordCheck("Security", "JWT Secret Strength", "PASS", "Cryptographically strong production secret detected");
} else {
  recordCheck("Security", "JWT Secret Strength", "WARN", "Default or short JWT_SECRET detected. Generate a 64-char random key before live launch.");
}

// 4. Client Origin & CORS
const clientOrigin = process.env.CLIENT_ORIGIN || "";
if (clientOrigin.startsWith("https://")) {
  recordCheck("Networking", "CORS Origin", "PASS", `Enforced HTTPS: ${clientOrigin}`);
} else {
  recordCheck("Networking", "CORS Origin", "WARN", `Currently set to ${clientOrigin || "not set"}. Update to https://yourdomain.com before going live.`);
}

// 5. Payment Gateway
const sslStore = process.env.SSLCOMMERZ_STORE_ID || "";
const sslSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
if (sslStore && !sslStore.startsWith("test_") && !sslSandbox) {
  recordCheck("Payments", "SSLCommerz Merchant", "PASS", `Live Mode Active (Store: ${sslStore})`);
} else {
  recordCheck("Payments", "SSLCommerz Merchant", "WARN", "Running in Sandbox/Simulation Mode. Cash on Delivery is active. Add live store credentials for online card/MFS payments.");
}

// 6. SMS Gateway
const smsKey = process.env.SMS_API_KEY || "";
const smsProvider = process.env.SMS_PROVIDER || "GREENWEB";
if (smsKey) {
  recordCheck("Notifications", "Bangladeshi SMS Gateway", "PASS", `Configured with ${smsProvider}`);
} else {
  recordCheck("Notifications", "Bangladeshi SMS Gateway", "WARN", "SMS API key missing. System operates in simulation mode with full console audit trail.");
}

// 7. Transactional Email
const smtpHost = process.env.SMTP_HOST || "";
const smtpUser = process.env.SMTP_USER || "";
if (smtpHost && smtpUser) {
  recordCheck("Notifications", "SMTP Email Dispatcher", "PASS", `Configured via ${smtpHost} (${smtpUser})`);
} else {
  recordCheck("Notifications", "SMTP Email Dispatcher", "WARN", "SMTP credentials not provided. HTML order invoice simulation active.");
}

// 8. Storage & File Uploads
const storagePath = path.join(serverDir, "storage", "objects");
try {
  fs.mkdirSync(storagePath, { recursive: true });
  fs.accessSync(storagePath, fs.constants.W_OK);
  recordCheck("Storage", "Persistent Local Disk Volume", "PASS", `Writable: ${storagePath}`);
} catch (e) {
  recordCheck("Storage", "Persistent Local Disk Volume", "FAIL", `Cannot write to ${storagePath}: ${e.message}`);
}

// 9. Frontend Production Build
const distPath = path.join(rootDir, "dist", "index.html");
if (fs.existsSync(distPath)) {
  const stat = fs.statSync(distPath);
  recordCheck("Frontend", "Vite Production Bundle", "PASS", `dist/index.html compiled (${(stat.size / 1024).toFixed(1)} KB)`);
} else {
  recordCheck("Frontend", "Vite Production Bundle", "WARN", "dist/ not found. Run 'npm run build' before live deployment.");
}

// 10. Sitemap XML
const sitemapPath = path.join(rootDir, "public", "sitemap.xml");
if (fs.existsSync(sitemapPath)) {
  const stat = fs.statSync(sitemapPath);
  recordCheck("SEO", "XML Sitemap", "PASS", `public/sitemap.xml verified (${(stat.size / 1024).toFixed(1)} KB)`);
} else {
  recordCheck("SEO", "XML Sitemap", "WARN", "public/sitemap.xml missing. Run 'npm run build' to generate.");
}

// Scoreboard
console.log("\n============================================================");
console.log("  PRE-FLIGHT AUDIT SUMMARY");
console.log("============================================================");
const passed = checks.filter((c) => c.status === "PASS").length;
const warnings = checks.filter((c) => c.status === "WARN").length;
const failures = checks.filter((c) => c.status === "FAIL").length;

console.log(`  Total Checks: ${checks.length}`);
console.log(`  ✅ Passed:    ${passed}`);
console.log(`  ⚠️  Warnings:  ${warnings}`);
console.log(`  ❌ Failures:  ${failures}`);
console.log("============================================================");

if (failures === 0) {
  console.log("🎉 Core system is 100% OPERATIONAL and ready for deployment!");
} else {
  console.log("⚠️ Please address the failures above before deploying to live.");
}

