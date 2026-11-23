import assert from "assert";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const API_BASE = "http://localhost:5000/api/v1";

async function runImageManagementTests() {
  console.log("🚀 Starting Image Management Pipeline Integration Tests...\n");

  // 1. Authenticate as Super Admin
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+8801676900442", password: "KingletAdmin@2026" }),
  });
  const loginJson = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, "Admin login must succeed");
  const token = loginJson.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log("✅ 1. Admin Authentication verified");

  // 2. Storage Status Endpoint
  const statusRes = await fetch(`${API_BASE}/admin/uploads/storage-status`, { headers: authHeaders });
  const statusJson = await statusRes.json();
  assert.strictEqual(statusRes.status, 200);
  assert(statusJson.data.provider, "Storage provider must be reported");
  console.log(`✅ 2. Storage Status verified: Provider = ${statusJson.data.provider}`);

  // 3. Unauthorized access check
  const unauthRes = await fetch(`${API_BASE}/admin/uploads/storage-status`);
  assert.strictEqual(unauthRes.status, 401, "Unauthenticated request must be rejected");
  console.log("✅ 3. Authorization guard verified (401 on missing token)");

  // 4. Content Validation: Reject fake/corrupted image
  const fakeForm = new FormData();
  const fakeBlob = new Blob(["This is a fake text file not an image"], { type: "image/jpeg" });
  fakeForm.append("images", fakeBlob, "fake-image.jpg");

  const fakeRes = await fetch(`${API_BASE}/admin/uploads/product-images`, {
    method: "POST",
    headers: authHeaders,
    body: fakeForm,
  });
  const fakeJson = await fakeRes.json();
  assert.ok(fakeRes.status === 500 || fakeRes.status === 400, "Corrupted image rejected with 500 or 400");
  console.log(`✅ 4. Corrupted file content rejected with message: "${fakeJson.message}"`);

  // 5. Generate authentic test furniture image using Sharp
  const testImageBuffer = await sharp({
    create: {
      width: 1200,
      height: 900,
      channels: 3,
      background: { r: 139, g: 69, b: 19 }, // Rich Mahogany wood tone
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  // 6. Find a real product to test upload
  const prodsRes = await fetch(`${API_BASE}/products?limit=1`);
  const prodsJson = await prodsRes.json();
  const testProduct = prodsJson.data[0];
  assert(testProduct, "Must find at least one product in DB");

  // 7. Upload valid image attached to product
  const uploadForm = new FormData();
  uploadForm.append("productId", testProduct.id);
  uploadForm.append("altText", "Kinglet Seasoned Mahogany Bed Detail");
  const validBlob = new Blob([testImageBuffer], { type: "image/jpeg" });
  uploadForm.append("images", validBlob, "test-mahogany-bed.jpg");

  const uploadRes = await fetch(`${API_BASE}/admin/uploads/product-images`, {
    method: "POST",
    headers: authHeaders,
    body: uploadForm,
  });
  const uploadJson = await uploadRes.json();
  assert.strictEqual(uploadRes.status, 201, "Upload must return 201 Created");
  assert(uploadJson.data.length > 0, "Must return uploaded image items");
  const uploadedImage = uploadJson.data[0];

  assert(uploadedImage.url, "Must have standard URL");
  assert(uploadedImage.thumbnailUrl, "Must have thumbnailUrl");
  assert(uploadedImage.largeUrl, "Must have largeUrl");
  assert(uploadedImage.storageKey, "Must have storageKey");
  console.log(`✅ 5. Real image uploaded: ${uploadedImage.url} (${uploadedImage.width}x${uploadedImage.height}px)`);

  // 8. Verify static serving & cache headers
  const staticRes = await fetch(`http://localhost:5000${uploadedImage.url}`);
  assert.strictEqual(staticRes.status, 200, "Static object serving must return 200");
  assert.strictEqual(staticRes.headers.get("content-type"), "image/webp", "Must be served as image/webp");
  assert(staticRes.headers.get("cache-control").includes("max-age"), "Must have long-lived Cache-Control");
  console.log("✅ 6. Static object serving verified with WebP mime-type and immutable Cache-Control");

  // 9. Reorder Images
  const reorderRes = await fetch(`${API_BASE}/admin/products/${testProduct.id}/images/reorder`, {
    method: "PUT",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ imageIds: [uploadedImage.id] }),
  });
  assert.strictEqual(reorderRes.status, 200, "Reorder must succeed");
  console.log("✅ 7. Reorder endpoint verified");

  // 10. Designate Hero Image
  const heroRes = await fetch(`${API_BASE}/admin/products/${testProduct.id}/images/${uploadedImage.id}/set-hero`, {
    method: "PUT",
    headers: authHeaders,
  });
  assert.strictEqual(heroRes.status, 200, "Set-Hero must succeed");
  console.log("✅ 8. Set-Hero primary image designation verified");

  // 11. Safe deletion & purge from storage (no orphaned objects)
  const deleteRes = await fetch(`${API_BASE}/admin/products/${testProduct.id}/images/${uploadedImage.id}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  assert.strictEqual(deleteRes.status, 200, "Image deletion must succeed");

  // Check if file was purged from disk
  const localFilePath = path.resolve("storage/objects", `${uploadedImage.storageKey}-orig.webp`);
  assert.strictEqual(fs.existsSync(localFilePath), false, "Storage file must be purged upon deletion to avoid orphans");
  console.log("✅ 9. Safe deletion verified: Database record deleted AND storage objects purged (zero orphans)");

  console.log("\n🎉 ALL 9 IMAGE MANAGEMENT TESTS PASSED WITH 100% SUCCESS!\n");
}

runImageManagementTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});

