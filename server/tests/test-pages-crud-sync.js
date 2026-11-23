import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import prisma from "../src/db/prisma.js";

dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });

const BASE_URL = "http://localhost:5000";
const JWT_SECRET = process.env.JWT_SECRET || "kinglet-super-secret-jwt-key-2026-production-grade";

async function runPagesTest() {
  console.log("🚀 Running Policy Pages CRUD & Storefront Dynamic Sync Verification...\n");

  const admin = await prisma.user.findFirst();
  if (!admin) throw new Error("No admin user found in database!");
  const token = jwt.sign({ userId: admin.id, roles: ["SUPER_ADMIN"] }, JWT_SECRET);

  // 1. Verify GET /api/v1/cms/pages
  console.log("1️⃣ Fetching public policy pages: GET /api/v1/cms/pages...");
  const publicRes = await fetch(`${BASE_URL}/api/v1/cms/pages`);
  const publicJson = await publicRes.json();
  if (!publicJson.success) throw new Error("Failed to fetch public pages: " + JSON.stringify(publicJson));
  console.log(`✅ Received ${publicJson.data.length} policy pages.`);
  if (publicJson.data.length < 7) {
    throw new Error(`Expected at least 7 pages, got ${publicJson.data.length}`);
  }

  const expectedPages = [
    "faq",
    "about-us",
    "privacy-policy",
    "warranty-terms",
    "exchange-return",
    "delivery",
    "care-maintenance",
  ];
  for (const exp of expectedPages) {
    const found = publicJson.data.find((p) => p.id === exp || p.slug === exp);
    if (!found) throw new Error(`Missing expected page: ${exp}`);
    console.log(`   - Verified page: ${found.title} (${found.path})`);
  }

  // 2. Verify single slug fetch: GET /api/v1/cms/pages/warranty-terms
  console.log("\n2️⃣ Fetching single slug: GET /api/v1/cms/pages/warranty-terms...");
  const singleRes = await fetch(`${BASE_URL}/api/v1/cms/pages/warranty-terms`);
  const singleJson = await singleRes.json();
  if (!singleJson.success || !singleJson.data) throw new Error("Failed to fetch warranty-terms page");
  console.log(`✅ Single page response: "${singleJson.data.title}"`);

  // 3. Admin update: PUT /api/v1/admin/pages/warranty-terms
  console.log("\n3️⃣ Testing Admin Page Content Update: PUT /api/v1/admin/pages/warranty-terms...");
  const originalTitle = singleJson.data.title;
  const originalContent = singleJson.data.content;
  const testTitle = `Warranty & Service Terms (Updated Test ${Date.now()})`;
  const testContent = `${originalContent}\n\n• Test Clause: 24/7 Priority Emergency Support across Dhaka.`;

  const putRes = await fetch(`${BASE_URL}/api/v1/admin/pages/warranty-terms`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: testTitle,
      subtitle: singleJson.data.subtitle,
      summary: singleJson.data.summary,
      content: testContent,
      metaTitle: `${testTitle} | Kinglet Bangladesh`,
      metaDescription: "Test meta description for warranty and service terms.",
    }),
  });
  const putJson = await putRes.json();
  if (!putJson.success) throw new Error("Failed to update page in admin: " + JSON.stringify(putJson));
  console.log(`✅ Admin PUT succeeded: "${putJson.data.title}"`);

  // 4. Verify storefront reflected update immediately
  console.log("\n4️⃣ Verifying Storefront public GET /api/v1/cms/pages/warranty-terms has updated content...");
  const verifyRes = await fetch(`${BASE_URL}/api/v1/cms/pages/warranty-terms`);
  const verifyJson = await verifyRes.json();
  if (verifyJson.data.title !== testTitle) {
    throw new Error(`Storefront did not reflect updated title! Got: "${verifyJson.data.title}"`);
  }
  if (!verifyJson.data.content.includes("24/7 Priority Emergency Support across Dhaka")) {
    throw new Error("Storefront did not reflect updated content!");
  }
  console.log("✅ Storefront successfully served updated title and content without manual refresh!");

  // 5. Restore original data
  console.log("\n5️⃣ Restoring original page content...");
  await fetch(`${BASE_URL}/api/v1/admin/pages/warranty-terms`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: originalTitle,
      subtitle: singleJson.data.subtitle,
      summary: singleJson.data.summary,
      content: originalContent,
      metaTitle: singleJson.data.metaTitle,
      metaDescription: singleJson.data.metaDescription,
    }),
  });
  console.log("✅ Original data restored successfully.");

  console.log("\n🎉 ALL POLICY PAGE TESTS PASSED WITH 100% SUCCESS!");
  await prisma.$disconnect();
}

runPagesTest().catch(async (err) => {
  console.error("❌ Test failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});

