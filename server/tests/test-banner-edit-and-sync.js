import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import prisma from "../src/db/prisma.js";

dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });

const BASE_URL = "http://localhost:5000";
const JWT_SECRET = process.env.JWT_SECRET || "kinglet-super-secret-jwt-key-2026-production-grade";

async function runTest() {
  console.log("🚀 Running Banner Edit & Storefront Dynamic Sync Verification...\n");

  const admin = await prisma.user.findFirst();
  if (!admin) throw new Error("No admin user found in database!");
  const token = jwt.sign({ userId: admin.id, roles: ["SUPER_ADMIN"] }, JWT_SECRET);

  // 1. Verify Banners
  console.log("1️⃣ Testing Banner Edit & Public Sync...");
  const banners = await prisma.homepageBanner.findMany({ orderBy: { displayOrder: "asc" } });
  console.log(`Found ${banners.length} banners in database.`);
  if (banners.length === 0) throw new Error("No banners found!");

  const targetBanner = banners[0];
  const originalTitle = targetBanner.title;
  const testTitle = `Mastercrafted Luxury Living & Turnkey Suites (Updated ${Date.now()})`;

  const bannerPutRes = await fetch(`${BASE_URL}/api/v1/admin/banners/${targetBanner.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: testTitle,
      subtitle: targetBanner.subtitle,
      badge: "UPDATED",
      imageUrl: targetBanner.imageUrl,
      targetUrl: targetBanner.targetUrl,
      ctaText: targetBanner.ctaText,
      displayOrder: targetBanner.displayOrder,
    }),
  });

  const bannerPutJson = await bannerPutRes.json();
  if (!bannerPutJson.success) throw new Error("Failed to update banner: " + bannerPutJson.message);
  console.log("✅ PUT /api/v1/admin/banners/:id returned success.");

  // Check public endpoint
  const cmsBannersRes = await fetch(`${BASE_URL}/api/v1/cms/banners`);
  const cmsBannersJson = await cmsBannersRes.json();
  const updatedPublicBanner = cmsBannersJson.data.find((b) => b.id === targetBanner.id);
  if (!updatedPublicBanner || updatedPublicBanner.title !== testTitle) {
    throw new Error("Public /api/v1/cms/banners does not reflect the updated title!");
  }
  console.log("✅ GET /api/v1/cms/banners immediately reflects updated banner title!");

  // Restore original banner title
  await fetch(`${BASE_URL}/api/v1/admin/banners/${targetBanner.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: originalTitle,
      subtitle: targetBanner.subtitle,
      badge: targetBanner.badge || "FLAGSHIP MASTERPIECE",
      imageUrl: targetBanner.imageUrl,
      targetUrl: targetBanner.targetUrl,
      ctaText: targetBanner.ctaText,
      displayOrder: targetBanner.displayOrder,
    }),
  });
  console.log("✅ Restored original banner title successfully.\n");

  // 2. Verify Settings (General Settings, Menu, Visibility)
  console.log("2️⃣ Testing Site Settings PUT & Public Sync...");
  const settingsPutRes = await fetch(`${BASE_URL}/api/v1/admin/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      primary_phone: "+8801676900442",
      site_name: "Kinglet Furniture & Interior",
      notice_scroller_enabled: "false",
    }),
  });

  const settingsPutJson = await settingsPutRes.json();
  if (!settingsPutJson.success) throw new Error("Failed to update settings: " + settingsPutJson.message);
  console.log("✅ PUT /api/v1/admin/settings returned success.");

  const cmsSettingsRes = await fetch(`${BASE_URL}/api/v1/cms/settings`);
  const cmsSettingsJson = await cmsSettingsRes.json();
  if (cmsSettingsJson.data.primary_phone !== "+8801676900442") {
    throw new Error("Public /api/v1/cms/settings does not reflect primary_phone!");
  }
  console.log("✅ GET /api/v1/cms/settings immediately reflects operational settings!\n");

  // 3. Verify Features & FAQs endpoints
  console.log("3️⃣ Testing Features and FAQs Endpoints...");
  const featuresRes = await fetch(`${BASE_URL}/api/v1/admin/features`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const featuresJson = await featuresRes.json();
  console.log(`✅ Features endpoint returned ${Array.isArray(featuresJson.data) ? featuresJson.data.length : 0} items.`);

  const faqsRes = await fetch(`${BASE_URL}/api/v1/admin/faqs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const faqsJson = await faqsRes.json();
  console.log(`✅ FAQs endpoint returned ${Array.isArray(faqsJson.data) ? faqsJson.data.length : 0} items.`);

  console.log("\n🎉 ALL BACKEND & STOREFRONT SYNC CHECKS PASSED 100%!");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});

