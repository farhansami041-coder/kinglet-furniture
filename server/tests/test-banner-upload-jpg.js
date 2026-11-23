import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import sharp from "sharp";
import prisma from "../src/db/prisma.js";

dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });

const BASE_URL = "http://localhost:5000";
const JWT_SECRET = process.env.JWT_SECRET || "kinglet-super-secret-jwt-key-2026-production-grade";

async function testJpgUpload() {
  console.log("🚀 Testing Direct JPG Banner Image Upload...\n");

  const admin = await prisma.user.findFirst();
  if (!admin) throw new Error("No admin user found in database!");
  const token = jwt.sign({ userId: admin.id, roles: ["SUPER_ADMIN"] }, JWT_SECRET);

  // 1. Create a sample valid JPEG buffer using Sharp
  console.log("1️⃣ Generating sample valid JPG image buffer (1200x600 px)...");
  const sampleJpgBuffer = await sharp({
    create: {
      width: 1200,
      height: 600,
      channels: 3,
      background: { r: 185, g: 28, b: 28 }, // Kinglet red background
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  console.log(`✅ Generated JPG buffer size: ${sampleJpgBuffer.length} bytes`);

  // 2. Upload via multipart/form-data to POST /api/v1/admin/uploads/banner
  console.log("\n2️⃣ Uploading JPG via POST /api/v1/admin/uploads/banner...");
  const formData = new FormData();
  const blob = new Blob([sampleJpgBuffer], { type: "image/jpeg" });
  formData.append("image", blob, "test-hero-banner.jpg");
  formData.append("folder", "banners");
  formData.append("title", "Winter Clearance Test Banner");

  const uploadRes = await fetch(`${BASE_URL}/api/v1/admin/uploads/banner`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const uploadJson = await uploadRes.json();
  if (!uploadJson.success) {
    throw new Error("Upload failed: " + JSON.stringify(uploadJson));
  }

  console.log("✅ Upload succeeded! Response data:");
  console.log("   - URL:", uploadJson.data.url);
  console.log("   - Large URL:", uploadJson.data.largeUrl);
  console.log("   - Thumbnail URL:", uploadJson.data.thumbnailUrl);
  console.log("   - Dimensions:", `${uploadJson.data.width}x${uploadJson.data.height}`);

  if (!uploadJson.data.url.startsWith("/storage/objects/")) {
    throw new Error(`Unexpected URL format: ${uploadJson.data.url}`);
  }

  // 3. Verify the static file is accessible and served by Express
  console.log("\n3️⃣ Verifying static accessibility of uploaded image...");
  const fileRes = await fetch(`${BASE_URL}${uploadJson.data.url}`);
  if (fileRes.status !== 200) {
    throw new Error(`Static file returned HTTP ${fileRes.status}`);
  }
  const contentType = fileRes.headers.get("content-type");
  const contentLength = fileRes.headers.get("content-length");
  console.log(`✅ File is accessible! HTTP 200, Content-Type: ${contentType}, Size: ${contentLength} bytes`);

  // 4. Test updating a banner with this new uploaded URL
  console.log("\n4️⃣ Testing saving this uploaded JPG URL to homepage banner in database...");
  const banners = await prisma.homepageBanner.findMany({ orderBy: { displayOrder: "asc" } });
  if (banners.length > 0) {
    const targetBanner = banners[0];
    const updateRes = await fetch(`${BASE_URL}/api/v1/admin/banners/${targetBanner.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: targetBanner.title,
        subtitle: targetBanner.subtitle,
        badge: targetBanner.badge,
        imageUrl: uploadJson.data.url,
        targetUrl: targetBanner.targetUrl,
        ctaText: targetBanner.ctaText,
        displayOrder: targetBanner.displayOrder,
      }),
    });
    const updateJson = await updateRes.json();
    if (!updateJson.success) throw new Error("Failed to update banner: " + JSON.stringify(updateJson));
    console.log(`✅ Banner ${targetBanner.id} successfully updated with uploaded image URL!`);

    // Verify public endpoint serves this image
    const cmsBanners = await (await fetch(`${BASE_URL}/api/v1/cms/banners`)).json();
    const updatedPublic = cmsBanners.data.find((b) => b.id === targetBanner.id);
    if (updatedPublic?.imageUrl !== uploadJson.data.url) {
      throw new Error("Public CMS banners did not reflect new image URL!");
    }
    console.log("✅ Public CMS banners confirmed serving uploaded image URL!");

    // Restore original
    await fetch(`${BASE_URL}/api/v1/admin/banners/${targetBanner.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: targetBanner.title,
        subtitle: targetBanner.subtitle,
        badge: targetBanner.badge,
        imageUrl: targetBanner.imageUrl,
        targetUrl: targetBanner.targetUrl,
        ctaText: targetBanner.ctaText,
        displayOrder: targetBanner.displayOrder,
      }),
    });
    console.log("✅ Original banner image restored.");
  }

  console.log("\n🎉 DIRECT JPG BANNER UPLOAD TEST PASSED WITH 100% SUCCESS!");
  await prisma.$disconnect();
}

testJpgUpload().catch(async (err) => {
  console.error("❌ Test failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
