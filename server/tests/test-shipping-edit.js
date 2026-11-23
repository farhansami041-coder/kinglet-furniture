import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import prisma from "../src/db/prisma.js";

dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });

const BASE_URL = "http://localhost:5000";
const JWT_SECRET = process.env.JWT_SECRET || "kinglet-super-secret-jwt-key-2026-production-grade";

async function testShippingEditAndDisplay() {
  console.log("🚀 Testing Shipping Method Edit & Storefront Display Integration...");

  const admin = await prisma.user.findFirst();
  const token = jwt.sign({ userId: admin.id, roles: ["SUPER_ADMIN"] }, JWT_SECRET);

  // 1. Fetch current methods
  const listRes = await fetch(`${BASE_URL}/api/v1/admin/shipping-methods`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listJson = await listRes.json();
  const targetMethod = listJson.data.find(m => m.code === "outside_dhaka_crate");

  if (!targetMethod) {
    throw new Error("Target shipping method 'outside_dhaka_crate' not found!");
  }

  const originalTitle = targetMethod.title;
  const originalRate = targetMethod.baseRate;
  console.log(`Original Method: "${originalTitle}" | Rate: ৳${originalRate}`);

  // 2. Perform Edit via PUT /api/v1/admin/shipping-methods/:id
  const updatedTitle = "Outside Dhaka Express Transport (All 64 Districts)";
  const updatedRate = 2200;
  const updatedDesc = "Heavy-duty shockproof wooden crate shipping with door-to-door tracking";

  console.log(`Updating via PUT /api/v1/admin/shipping-methods/${targetMethod.id}...`);
  const editRes = await fetch(`${BASE_URL}/api/v1/admin/shipping-methods/${targetMethod.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: updatedTitle,
      baseRate: updatedRate,
      description: updatedDesc,
      freeAssembly: false,
      isActive: true
    })
  });
  const editJson = await editRes.json();
  if (!editJson.success) throw new Error("Failed to edit shipping method: " + editJson.message);
  console.log("✓ Success: Shipping method updated in backend MySQL database!");

  // 3. Verify public storefront endpoint GET /api/v1/orders/shipping-methods
  console.log("Verifying public storefront endpoint GET /api/v1/orders/shipping-methods...");
  const publicRes = await fetch(`${BASE_URL}/api/v1/orders/shipping-methods`);
  const publicJson = await publicRes.json();
  const publicMethod = publicJson.data.find(m => m.id === targetMethod.id);

  if (!publicMethod || publicMethod.title !== updatedTitle || publicMethod.baseRate !== updatedRate) {
    throw new Error(`Storefront did not reflect edited shipping method! Got: ${JSON.stringify(publicMethod)}`);
  }
  console.log(`✓ Storefront verified: Title="${publicMethod.title}" | Rate=৳${publicMethod.baseRate}`);

  // 4. Restore original values so test doesn't permanently overwrite
  await fetch(`${BASE_URL}/api/v1/admin/shipping-methods/${targetMethod.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: originalTitle,
      baseRate: originalRate,
      description: targetMethod.description,
      freeAssembly: targetMethod.freeAssembly,
      isActive: targetMethod.isActive
    })
  });
  console.log("✓ Restored initial shipping method values.");
  console.log("\n🎉 ALL TESTS PASSED: Edit option works and edits immediately reflect on website!");

  await prisma.$disconnect();
}

testShippingEditAndDisplay().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});

