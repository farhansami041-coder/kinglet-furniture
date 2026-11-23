import assert from "node:assert/strict";

const BASE_URL = "http://localhost:5000";

async function runTests() {
  console.log("🚀 Starting Phase 1 & Phase 2 Automated Test Suite...\n");

  // Test 1: Interior 3D Design Consultation Inquiry
  console.log("▶ 1. Testing Interior 3D Design Consultation (/api/v1/support/interior-inquiry)...");
  const intRes = await fetch(`${BASE_URL}/api/v1/support/interior-inquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Engr. Tanvir Ahmed",
      phone: "01788990011",
      spaceType: "residential",
      budget: "10-20-lakh",
      propertyArea: "2200 sqft",
      message: "Bashundhara R/A luxury flat interior",
    }),
  });
  const intJson = await intRes.json();
  assert.equal(intRes.status, 201, "Expected 201 Created for interior inquiry");
  assert.equal(intJson.success, true);
  assert.ok(intJson.data?.ticketId?.startsWith("KL-INT-"), "Ticket ID should start with KL-INT-");
  console.log(`   ✓ Success! Created interior ticket: ${intJson.data.ticketId}\n`);

  // Test 2: Showroom VIP Appointment Booking
  console.log("▶ 2. Testing Showroom VIP Booking (/api/v1/support/showroom-booking)...");
  const shwRes = await fetch(`${BASE_URL}/api/v1/support/showroom-booking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Mrs. Nasrin Sultana",
      phone: "01811223344",
      showroomLocation: "Kinglet Flagship Showroom & Experience Center, Mirpur",
      visitingDate: "2026-11-20",
      visitingTime: "afternoon",
      notes: "Interested in dining set demonstration",
    }),
  });
  const shwJson = await shwRes.json();
  assert.equal(shwRes.status, 201, "Expected 201 Created for showroom booking");
  assert.equal(shwJson.success, true);
  assert.ok(shwJson.data?.bookingCode?.startsWith("KL-SHW-"), "Booking Code should start with KL-SHW-");
  console.log(`   ✓ Success! Created showroom booking: ${shwJson.data.bookingCode}\n`);

  // Test 3: Custom Dimensions Inquiry
  console.log("▶ 3. Testing Custom Dimensions Inquiry (/api/v1/support/inquiry)...");
  const inqRes = await fetch(`${BASE_URL}/api/v1/support/inquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Custom Bed Buyer",
      phone: "01999887766",
      productId: "1",
      productName: "Grain Craft Bed",
      inquiryType: "CUSTOM_DIMENSIONS",
      notes: "Dimensions: 6.5ft x 6ft King Size. Warm Mahogany Satin finish.",
    }),
  });
  const inqJson = await inqRes.json();
  assert.equal(inqRes.status, 201);
  assert.equal(inqJson.success, true);
  assert.ok(inqJson.data?.id?.startsWith("KL-INQ-"));
  console.log(`   ✓ Success! Created custom inquiry: ${inqJson.data.id}\n`);

  // Test 4: Customer Review Submission & Fetch
  console.log("▶ 4. Testing Product Review Submission & Fetch (/api/v1/reviews)...");
  const prodListRes = await fetch(`${BASE_URL}/api/v1/products?limit=1`);
  const prodListJson = await prodListRes.json();
  const testProduct = prodListJson.data?.[0];
  const targetProdId = testProduct?.id || "05aad66c-979c-4d9b-9f1c-c8ede40fe67b";

  const revRes = await fetch(`${BASE_URL}/api/v1/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: targetProdId,
      customerName: "Dr. Kazi Rafiq",
      authorLocation: "Gulshan 2, Dhaka",
      rating: 5,
      comment: "Outstanding craftsmanship and seasoning quality. The mahogany grain and Italian PU polish are top tier.",
    }),
  });
  const revJson = await revRes.json();
  assert.equal(revJson.success, true, "Review submission should succeed");
  console.log(`   ✓ Success! Published review ID: ${revJson.data?.id}`);

  const getRevRes = await fetch(`${BASE_URL}/api/v1/reviews/product/${targetProdId}`);
  const getRevJson = await getRevRes.json();
  assert.equal(getRevJson.success, true);
  assert.ok(Array.isArray(getRevJson.data?.reviews));
  console.log(`   ✓ Success! Retrieved ${getRevJson.data.reviews.length} approved reviews for product ${targetProdId}\n`);

  // Test 5: Customer Cloud Wishlist Sync
  console.log("▶ 5. Testing Customer Wishlist Sync (/api/v1/customers/wishlist)...");
  const jwt = await import("jsonwebtoken");
  const testToken = jwt.default.sign(
    { userId: "0842cfee-1ac4-4bdb-8283-37ca821a8b68", phone: "+8801676900442", roles: ["CUSTOMER"] },
    "kinglet_super_secure_jwt_secret_token_key_2026_xyz",
    { expiresIn: "1d" }
  );

  const syncRes = await fetch(`${BASE_URL}/api/v1/customers/wishlist/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${testToken}`,
    },
    body: JSON.stringify({
      wishlistItems: [{ id: targetProdId, name: "Nordic Luxury Modular Sofa", priceBDT: 148000 }],
    }),
  });
  const syncJson = await syncRes.json();
  assert.equal(syncJson.success, true);
  console.log("   ✓ Success! Cloud wishlist synchronized with customer account in MySQL.");

  const fetchWishRes = await fetch(`${BASE_URL}/api/v1/customers/wishlist`, {
    headers: { Authorization: `Bearer ${testToken}` },
  });
  const fetchWishJson = await fetchWishRes.json();
  assert.equal(fetchWishJson.success, true);
  assert.ok(fetchWishJson.data?.wishlist?.length > 0);
  console.log(`   ✓ Success! Verified ${fetchWishJson.data.wishlist.length} saved pieces from cloud database.\n`);

  console.log("🎉 ALL PHASE 1 & PHASE 2 AUTOMATED INTEGRATION TESTS PASSED 100%!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
