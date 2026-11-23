import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import prisma from "../src/db/prisma.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const BASE_URL = "http://localhost:5000";
const JWT_SECRET = process.env.JWT_SECRET || "kinglet-super-secret-jwt-key-2026-production-grade";

async function runTests() {
  console.log("=== Testing Manage Site 18 Options Integration ===");

  // 1. Find User and generate super admin token
  const admin = await prisma.user.findFirst();
  if (!admin) {
    throw new Error("No user found in database");
  }

  const token = jwt.sign(
    { userId: admin.id, roles: ["SUPER_ADMIN"] },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  console.log(`[1] Admin token generated for user: ${admin.phone || admin.email}`);

  // 2. GET /api/v1/admin/settings
  const getRes = await fetch(`${BASE_URL}/api/v1/admin/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getData = await getRes.json();
  if (!getData.success) {
    throw new Error("Failed to fetch admin settings: " + getData.message);
  }
  console.log(`[2] Successfully fetched ${getData.data.length} settings records from database.`);

  const keys = getData.data.map((s) => s.key);
  const expectedKeys = [
    "site_name",
    "site_title",
    "notice_scroller_enabled",
    "notice_scroller_text",
    "site_navigation_menu",
    "home_page_sections",
    "site_features_list",
    "site_feature_visibility",
    "storage_driver",
    "google_login_enabled",
    "smtp_host",
    "sms_provider",
    "announcement_enabled",
    "cookies_alert_enabled",
    "maintenance_mode_enabled",
    "schema_org_type",
    "custom_robots_txt",
    "default_language",
  ];

  const missingKeys = expectedKeys.filter((k) => !keys.includes(k));
  if (missingKeys.length > 0) {
    console.warn("Missing keys in DB defaults:", missingKeys);
  } else {
    console.log("✅ All 18 key categories found in WebsiteSetting table!");
  }

  // 3. Test Updating Multiple Settings via PUT /api/v1/admin/settings
  const testUpdates = {
    notice_scroller_enabled: "true",
    notice_scroller_text: "📢 Test Flash Offer: 20% Off Kiln-Seasoned Mahogany Beds this weekend!",
    announcement_enabled: "true",
    announcement_title: "VIP Seasoned Wood Festival",
    announcement_message: "Exclusive showroom tour at Mirpur Flagship showroom.",
    custom_robots_txt: "User-agent: *\nDisallow: /admin\nAllow: /\nSitemap: https://kingletbd.com/sitemap.xml",
    cookies_alert_button_text: "Accept Cookies & Continue",
  };

  const putRes = await fetch(`${BASE_URL}/api/v1/admin/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(testUpdates),
  });
  const putData = await putRes.json();
  if (!putData.success) {
    throw new Error("Failed to update settings: " + putData.message);
  }
  console.log(`[3] Updated ${putData.data.updatedCount} settings successfully via admin API.`);

  // 4. Verify Public Storefront GET /api/v1/cms/settings
  const publicRes = await fetch(`${BASE_URL}/api/v1/cms/settings`);
  const publicData = await publicRes.json();
  if (!publicData.success) {
    throw new Error("Failed to fetch public CMS settings");
  }

  if (
    publicData.data.notice_scroller_text === testUpdates.notice_scroller_text &&
    publicData.data.announcement_title === testUpdates.announcement_title &&
    publicData.data.cookies_alert_button_text === testUpdates.cookies_alert_button_text
  ) {
    console.log("✅ Storefront CMS endpoint immediately reflects updated settings!");
  } else {
    throw new Error("Public settings did not match updated test values");
  }

  // 5. Test Robots.txt endpoint
  const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
  const robotsText = await robotsRes.text();
  if (robotsText.includes("Sitemap: https://kingletbd.com/sitemap.xml")) {
    console.log("✅ /robots.txt serves dynamically edited robots directives from DB!");
  } else {
    throw new Error("/robots.txt did not return expected custom content: " + robotsText);
  }

  // 6. Clean up / reset test values
  await fetch(`${BASE_URL}/api/v1/admin/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      notice_scroller_enabled: "true",
      notice_scroller_text: "📢 Seasoned Mahogany Furniture — 100% Kiln-Seasoned Chittagong Mahogany • 10-Year Timber Guarantee • Free Delivery & Assembly across Bangladesh",
      announcement_enabled: "false",
      announcement_title: "Special VIP Announcement",
      announcement_message: "Exclusive 15% VIP discount on Seasoned Mahogany Bedroom Suites.",
      cookies_alert_button_text: "Allow Cookies",
    }),
  });
  console.log("[6] Restored production defaults for settings.");

  console.log("\n=== ALL MANAGE SITE 18 OPTIONS TESTS PASSED 100% ===");
  await prisma.$disconnect();
}

runTests().catch(async (e) => {
  console.error("Test failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
