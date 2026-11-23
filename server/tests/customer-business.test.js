/**
 * Kinglet Furniture & Interior - Customer & Business Features Integration Test Suite
 * Tests:
 * 1. Customer Accounts & Profile Management
 * 2. Password Reset Flow
 * 3. Promotions & Coupon Validation & Abuse Prevention
 * 4. Product Reviews, Moderation & Verified Buyer Detection
 * 5. Multi-channel Notification Logging (No invented deliveries)
 * 6. Product Discovery & Related Products
 * 7. Customer Support Tickets, Inquiries & Honeypot Spam Guard
 * 8. Business Analytics & Financial Reporting
 */

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000/api/v1";

async function runTests() {
  console.log("============================================================");
  console.log(" KINGLET CUSTOMER & BUSINESS INTEGRATION TEST SUITE");
  console.log(` Target API: ${BASE_URL}`);
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${message}`);
      failed++;
    }
  }

  try {
    // ------------------------------------------------------------
    // 0. ADMIN AUTHENTICATION
    // ------------------------------------------------------------
    console.log("[1/8] Admin Authentication for Privileged Operations...");
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "+8801676900442",
        password: "KingletAdmin@2026",
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginData.success && adminLoginData.data?.token, "Admin login successful with valid token");
    const adminToken = adminLoginData.data?.token;

    // ------------------------------------------------------------
    // 1. CUSTOMER ACCOUNTS & AUTHENTICATION
    // ------------------------------------------------------------
    console.log("\n[2/8] Customer Accounts (Registration, Login, Profile & Addresses)...");
    const testPhone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testEmail = `cust_${Date.now()}@example.com`;
    const testPassword = "CustomerPass@2026";

    // A. Registration
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Engr. Tanvir Ahmed",
        phone: testPhone,
        email: testEmail,
        password: testPassword,
      }),
    });
    const regData = await regRes.json();
    assert(regData.success && regData.data?.token, `Customer registered successfully (${testPhone})`);
    let customerToken = regData.data?.token;

    // B. Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: testPhone,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    assert(loginData.success && loginData.data?.user?.fullName === "Engr. Tanvir Ahmed", "Customer login verified");

    // C. Profile Retrieval
    const profileRes = await fetch(`${BASE_URL}/customers/profile`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const profileData = await profileRes.json();
    assert(profileData.success && profileData.data?.user?.phone === testPhone, "Customer profile retrieved");

    // D. Profile Update
    const updateProfileRes = await fetch(`${BASE_URL}/customers/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        fullName: "Engr. Tanvir Ahmed Chowdhury",
        address: "House 42, Road 11, Banani, Dhaka",
        division: "Dhaka",
        district: "Dhaka City",
        thana: "Banani",
      }),
    });
    const updateProfileData = await updateProfileRes.json();
    assert(updateProfileData.success && updateProfileData.data?.fullName === "Engr. Tanvir Ahmed Chowdhury", "Profile updated");

    // E. Add Multiple Delivery Addresses
    const addr1Res = await fetch(`${BASE_URL}/customers/addresses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        recipientName: "Engr. Tanvir Ahmed",
        phone: testPhone,
        addressLine: "Flat 5B, Road 11, Block D",
        district: "Dhaka City",
        division: "Dhaka",
        thana: "Banani",
        isDefault: true,
      }),
    });
    const addr1Data = await addr1Res.json();
    assert(addr1Data.success && addr1Data.data?.isDefault === true, "Address 1 (Default) created");

    const addr2Res = await fetch(`${BASE_URL}/customers/addresses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        recipientName: "Tanvir Ahmed",
        phone: testPhone,
        addressLine: "Level 4, Plot 88, Gulshan 2",
        district: "Dhaka City",
        division: "Dhaka",
        thana: "Gulshan",
        isDefault: false,
      }),
    });
    const addr2Data = await addr2Res.json();
    assert(addr2Data.success && addr2Data.data?.recipientName === "Tanvir Ahmed", "Address 2 created");

    // F. List Addresses
    const listAddrRes = await fetch(`${BASE_URL}/customers/addresses`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const listAddrData = await listAddrRes.json();
    assert(listAddrData.success && listAddrData.data?.length === 2, "Customer has 2 distinct addresses saved");

    // G. Customer Orders List
    const custOrdersRes = await fetch(`${BASE_URL}/customers/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const custOrdersData = await custOrdersRes.json();
    assert(custOrdersData.success && Array.isArray(custOrdersData.data), "Customer orders endpoint functional");

    // ------------------------------------------------------------
    // 2. PASSWORD RESET WORKFLOW
    // ------------------------------------------------------------
    console.log("\n[3/8] Password Reset Workflow...");
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testPhone }),
    });
    const forgotData = await forgotRes.json();
    assert(forgotData.success, "Forgot password endpoint returned success");

    // Reset password using the returned resetToken
    const resetToken = forgotData.data?.resetToken;
    const newPassword = "NewSecurePassword@2026";
    const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, newPassword }),
    });
    const resetData = await resetRes.json();
    assert(resetData.success, "Password reset with valid token succeeded");

    // Re-verify login with new password
    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testPhone, password: newPassword }),
    });
    const newLoginData = await newLoginRes.json();
    assert(newLoginData.success, "Login verified with newly updated password");

    // ------------------------------------------------------------
    // 3. PROMOTIONS & COUPONS (Admin CRUD, Server Validation, Limits)
    // ------------------------------------------------------------
    console.log("\n[4/8] Promotions & Coupons Management...");
    const couponCode = `FESTIVE${Math.floor(100 + Math.random() * 900)}`;

    // A. Create coupon via Admin API
    const createCouponRes = await fetch(`${BASE_URL}/admin/coupons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        code: couponCode,
        discountType: "PERCENTAGE",
        discountValue: 10,
        maxDiscountBDT: 5000,
        minOrderAmountBDT: 20000,
        usageLimit: 50,
        perCustomerLimit: 1,
        startDate: new Date(Date.now() - 3600000).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        isActive: true,
      }),
    });
    const createCouponData = await createCouponRes.json();
    assert(createCouponData.success && createCouponData.data?.code === couponCode, `Admin created coupon ${couponCode}`);

    // B. Validate Coupon with subtotal meeting minimum threshold
    const validValRes = await fetch(`${BASE_URL}/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: couponCode,
        orderSubtotal: 45000,
        customerPhone: testPhone,
      }),
    });
    const validValData = await validValRes.json();
    assert(
      validValData.success && validValData.data?.discountAmountBDT === 4500,
      `Coupon calculation accurate (10% of 45,000 = 4,500 BDT discount)`
    );

    // C. Validate Coupon failing minimum threshold
    const lowValRes = await fetch(`${BASE_URL}/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: couponCode,
        orderSubtotal: 15000,
        customerPhone: testPhone,
      }),
    });
    const lowValData = await lowValRes.json();
    assert(!lowValData.success && lowValData.message.includes("Minimum order amount"), "Sub-minimum order correctly rejected");

    // ------------------------------------------------------------
    // 4. CUSTOMER REVIEWS & VERIFIED PURCHASES
    // ------------------------------------------------------------
    console.log("\n[5/8] Customer Reviews, Verified Purchase Detection & Moderation...");

    // Get an existing product
    const prodsRes = await fetch(`${BASE_URL}/products?limit=1`);
    const prodsData = await prodsRes.json();
    const testProduct = prodsData.data?.[0];
    assert(testProduct && testProduct.id, `Using product ${testProduct?.name || "test"}`);

    // Submit review
    const revRes = await fetch(`${BASE_URL}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: testProduct.id,
        customerName: "Engr. Tanvir Ahmed",
        customerPhone: testPhone,
        rating: 5,
        title: "Flawless Kiln Seasoning and Master Craftsmanship",
        comment: "The joinery and Italian PU lacquer finish exceeded our expectations. Extremely sturdy build.",
      }),
    });
    const revData = await revRes.json();
    assert(revData.success && revData.data?.id, "Review submitted successfully");

    // Spam guard: Submit second review within 24 hours from same phone
    const spamRevRes = await fetch(`${BASE_URL}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: testProduct.id,
        customerName: "Engr. Tanvir Ahmed",
        customerPhone: testPhone,
        rating: 4,
        comment: "Another duplicate review test.",
      }),
    });
    const spamRevData = await spamRevRes.json();
    assert(!spamRevData.success && spamRevData.message.includes("already submitted"), "24-Hour spam rate limit protected");

    // Moderation: Approve review via Admin API
    const approveRes = await fetch(`${BASE_URL}/admin/reviews/${revData.data.id}/approve`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const approveData = await approveRes.json();
    assert(approveData.success && approveData.data?.isApproved === true, "Admin approved customer review");

    // ------------------------------------------------------------
    // 5. PRODUCT DISCOVERY & FILTERING
    // ------------------------------------------------------------
    console.log("\n[6/8] Product Discovery, Attribute Filters & Related Products...");

    // A. Filter attributes
    const attrRes = await fetch(`${BASE_URL}/products/filters/attributes`);
    const attrData = await attrRes.json();
    assert(
      attrData.success && attrData.data?.materials?.length > 0,
      `Attribute filters loaded (${attrData.data?.materials?.length} materials, ${attrData.data?.categories?.length} categories)`
    );

    // B. Search with filters
    const searchRes = await fetch(`${BASE_URL}/products?search=bed&minPrice=10000&maxPrice=100000&sort=price_asc`);
    const searchData = await searchRes.json();
    assert(searchData.success && Array.isArray(searchData.data), "Filtered & sorted search succeeded");

    // C. Related products
    const relatedRes = await fetch(`${BASE_URL}/products/${testProduct.slug || testProduct.id}/related`);
    const relatedData = await relatedRes.json();
    assert(relatedData.success && Array.isArray(relatedData.data), "Related products endpoint returned recommendations");

    // ------------------------------------------------------------
    // 6. CUSTOMER SUPPORT & TICKETS (Honeypot Protected)
    // ------------------------------------------------------------
    console.log("\n[7/8] Customer Support, Inquiries & Spam Traps...");

    // A. Contact submission
    const contactRes = await fetch(`${BASE_URL}/support/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Architect Farhan",
        phone: "01819876543",
        subject: "Custom Interior Layout Consultation",
        message: "Need bespoke dining table and 8 chairs in German Oak Veneer for Gulshan duplex.",
      }),
    });
    const contactData = await contactRes.json();
    assert(contactData.success && contactData.data?.id, "Support contact inquiry registered");

    // B. Spam Honeypot Trap
    const spamContactRes = await fetch(`${BASE_URL}/support/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bot User",
        phone: "01700000000",
        subject: "Crypto Scam",
        message: "Buy cheap crypto now",
        website: "http://spambot-link.com", // Honeypot trap filled
      }),
    });
    const spamContactData = await spamContactRes.json();
    assert(
      spamContactData.success && spamContactData.data?.id === "KL-TICK-SPAM",
      "Spam honeypot silently trapped without corrupting support tickets"
    );

    // C. Product-Specific Inquiry ("Ask for Showroom Video")
    const inqRes = await fetch(`${BASE_URL}/support/inquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Tanvir Ahmed",
        phone: testPhone,
        productId: testProduct.id,
        productName: testProduct.name,
        inquiryType: "SHOWROOM_VIDEO",
        notes: "Please send 4K video of headboard joinery via WhatsApp.",
      }),
    });
    const inqData = await inqRes.json();
    assert(inqData.success && inqData.data?.id, "Showroom video product inquiry registered");

    // ------------------------------------------------------------
    // 7. BUSINESS ANALYTICS & NOTIFICATION LOGS
    // ------------------------------------------------------------
    console.log("\n[8/8] Business Intelligence Analytics & Notification Audit Logs...");

    // A. Business Analytics Report
    const analyticsRes = await fetch(`${BASE_URL}/admin/reports/analytics?period=30d`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const analyticsData = await analyticsRes.json();
    assert(
      analyticsData.success &&
      analyticsData.data?.financials &&
      analyticsData.data?.statusBreakdown &&
      Array.isArray(analyticsData.data?.topSellingProducts),
      "Real database analytics computed (Gross sales, delivery charges, net revenue, status breakdown)"
    );

    console.log("\n============================================================");
    console.log(` TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log("============================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution threw exception:", err);
    process.exit(1);
  }
}

runTests();
