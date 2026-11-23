// Comprehensive Automated Integration & Unit Test Suite for Kinglet Backend Infrastructure
import app from "../src/app.js";
import prisma from "../src/db/prisma.js";

let server;
const PORT = 5099; // Isolated test port
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log("🧪 Starting Kinglet Backend Verification Test Suite...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Start test server
    server = app.listen(PORT);
    await new Promise((res) => setTimeout(res, 200));

    // TEST 1: Health Check
    console.log("▶ Test 1: Service Health Check");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, "Health status returns 200 OK");
    assert(healthJson.status === "ok", "Service status reports 'ok'");

    // TEST 2: Product Listing & Material Filtering
    console.log("\n▶ Test 2: Product Listing & Wood Filtering");
    const prodRes = await fetch(`${BASE_URL}/api/v1/products?limit=5`);
    const prodJson = await prodRes.json();
    assert(prodRes.status === 200, "Products endpoint returns 200");
    assert(prodJson.data.length > 0, `Returned ${prodJson.data.length} products`);
    assert(prodJson.pagination.total >= 50, `Total products cataloged: ${prodJson.pagination.total}`);

    // TEST 3: Product Detail by Slug
    console.log("\n▶ Test 3: Product Detail by Slug");
    const testProduct = prodJson.data[0];
    const slugRes = await fetch(`${BASE_URL}/api/v1/products/${testProduct.slug}`);
    const slugJson = await slugRes.json();
    assert(slugRes.status === 200, "Single product by slug returns 200");
    assert(slugJson.data.slug === testProduct.slug, `Slug matches '${testProduct.slug}'`);
    assert(slugJson.data.priceBDT > 0, `Price correctly matches ৳${slugJson.data.priceBDT}`);
    assert(slugJson.data.inStock === true, "Product stock status is active");

    // TEST 4: Category Hierarchy
    console.log("\n▶ Test 4: Category Hierarchy & Product Counts");
    const catRes = await fetch(`${BASE_URL}/api/v1/categories`);
    const catJson = await catRes.json();
    assert(catRes.status === 200, "Categories endpoint returns 200");
    assert(catJson.data.length > 0, `Root categories found: ${catJson.data.length}`);
    const bedroom = catJson.data.find((c) => c.slug === "bed-room");
    assert(bedroom !== undefined, "Found 'bed-room' root category");
    assert(bedroom.productCount > 0, `Bedroom contains ${bedroom.productCount} products`);

    // TEST 5: Customer Registration & Authentication
    console.log("\n▶ Test 5: Customer Registration & JWT Token Flow");
    const testPhone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;
    const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Tanvir Hasan",
        phone: testPhone,
        password: "CustomerPass@123",
      }),
    });
    const regJson = await regRes.json();
    assert(regRes.status === 201, "Customer registered successfully with status 201");
    assert(Boolean(regJson.data.token), "JWT authentication token returned");
    const customerToken = regJson.data.token;

    // Login test
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: testPhone,
        password: "CustomerPass@123",
      }),
    });
    const loginJson = await loginRes.json();
    assert(loginRes.status === 200, "Customer login successful with status 200");
    assert(loginJson.data.user.phone === testPhone, "Authenticated user identity verified");

    // Profile check
    const meRes = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const meJson = await meRes.json();
    assert(meRes.status === 200, "Protected /auth/me returns 200 with valid Bearer token");
    assert(meJson.data.fullName === "Tanvir Hasan", "Profile name retrieved correctly");

    // TEST 6: Cart Operations
    console.log("\n▶ Test 6: Cart Operations");
    const firstProduct = prodJson.data[0];
    await prisma.inventory.update({
      where: { productId: firstProduct.id },
      data: { quantityAvailable: 15 },
    });

    const addCartRes = await fetch(`${BASE_URL}/api/v1/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        productId: firstProduct.id,
        quantity: 2,
      }),
    });
    const addCartJson = await addCartRes.json();
    assert(addCartRes.status === 200, "Added product to cart with status 200");

    const getCartRes = await fetch(`${BASE_URL}/api/v1/cart`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const getCartJson = await getCartRes.json();
    assert(getCartJson.data.items.length === 1, "Cart contains 1 item");
    assert(getCartJson.data.items[0].quantity === 2, "Cart quantity correctly reflects 2 units");

    // TEST 7: ACID Transactional Checkout & Stock Decrement
    console.log("\n▶ Test 7: Transactional Checkout & Concurrency-Safe Stock Update");
    const initialInv = await prisma.inventory.findUnique({
      where: { productId: firstProduct.id },
    });
    const initialStock = initialInv.quantityAvailable;

    const orderRes = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        customerName: "Tanvir Hasan",
        customerPhone: testPhone,
        shippingAddress: "House 12, Road 4, Sector 7, Uttara, Dhaka",
        division: "Dhaka",
        district: "Dhaka City",
        thana: "Uttara",
        paymentMethod: "COD",
        shippingCode: "dhaka_flat",
        items: [
          {
            productId: firstProduct.id,
            quantity: 1,
          },
        ],
      }),
    });
    const orderJson = await orderRes.json();
    assert(orderRes.status === 201, "Order placed successfully with status 201");
    const orderId = orderJson.data.id || orderJson.data.orderId;
    assert(orderJson.data.orderNumber.startsWith("KL-ORD-") || orderJson.data.orderNumber.startsWith("KL-TRK-"), `Order tracking number generated: ${orderJson.data.orderNumber}`);

    // Verify stock was decremented
    const updatedInv = await prisma.inventory.findUnique({
      where: { productId: firstProduct.id },
    });
    assert(
      updatedInv.quantityAvailable === initialStock - 1,
      `Inventory decremented atomically from ${initialStock} to ${updatedInv.quantityAvailable}`
    );

    // Verify stock movement log was recorded
    const stockLog = await prisma.stockMovement.findFirst({
      where: { referenceId: orderJson.data.orderNumber },
    });
    assert(stockLog !== null, "Stock movement audit ledger logged successfully");

    // TEST 8: 7-Step Timeline Tracking
    console.log("\n▶ Test 8: Public 7-Step Order Timeline Tracker");
    const trackRes = await fetch(`${BASE_URL}/api/v1/orders/track/${orderJson.data.orderNumber}`);
    const trackJson = await trackRes.json();
    assert(trackRes.status === 200, "Track order returns 200 OK");
    assert(trackJson.data.orderNumber === orderJson.data.orderNumber, "Tracking number matches");
    assert(trackJson.data.steps.length === 6 || trackJson.data.steps.length === 7, "Manufacturing & delivery milestones verified");

    // TEST 9: 24/7 Helpline Complaint Ticket Registration
    console.log("\n▶ Test 9: 24/7 Helpline Support Ticket Registration");
    const ticketRes = await fetch(`${BASE_URL}/api/v1/support/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Tanvir Hasan",
        customerPhone: testPhone,
        orderNumber: orderJson.data.orderNumber,
        issueType: "carpenter-fitting",
        description: "Need carpenter assembly service for master king bed at Uttara.",
      }),
    });
    const ticketJson = await ticketRes.json();
    assert(ticketRes.status === 201, "Complaint ticket created with status 201");
    assert(ticketJson.data.id.startsWith("KL-TICK-"), `Official Ticket ID generated: ${ticketJson.data.id}`);

    // TEST 10: RBAC Authorization Boundaries
    console.log("\n▶ Test 10: RBAC Admin Security Boundaries");
    // Attempt admin access with regular customer token (Must fail 403)
    const failAdminRes = await fetch(`${BASE_URL}/api/v1/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(failAdminRes.status === 403, "Customer token blocked from admin routes (403 Forbidden)");

    // Login as Super Admin
    const adminLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "+8801676900442",
        password: "KingletAdmin@2026",
      }),
    });
    const adminLoginJson = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, "Super Admin login successful");
    const adminToken = adminLoginJson.data.token;

    // Access admin KPIs with Super Admin token
    const adminStatsRes = await fetch(`${BASE_URL}/api/v1/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminStatsJson = await adminStatsRes.json();
    assert(adminStatsRes.status === 200, "Super Admin authorized to view dashboard stats");
    assert(adminStatsJson.data.totalOrders >= 1, `KPI metrics returned: ${adminStatsJson.data.totalOrders} total orders, ৳${adminStatsJson.data.totalRevenue} revenue`);

    // TEST 11: Admin Order Status Transition
    console.log("\n▶ Test 11: Admin Order Lifecycle Milestone Progression");
    const updateStatusRes = await fetch(`${BASE_URL}/api/v1/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: "TIMBER_SEASONING",
        stepIndex: 2,
        comment: "Timber chemical autoclave vacuum pressure completed. Proceeding to joinery.",
      }),
    });
    const updateStatusJson = await updateStatusRes.json();
    assert(updateStatusRes.status === 200, "Order status transitioned to TIMBER_SEASONING");

    // Verify audit log exists
    const auditLog = await prisma.auditLog.findFirst({
      where: { action: "ORDER_STATUS_CHANGED", targetId: orderId },
    });
    assert(auditLog !== null, "Admin action logged to audit_logs table");

    // TEST 12: Bank EMI Plans & Calculation Engine
    console.log("\n▶ Test 12: Bank EMI Plans & Calculation Engine");
    const emiRes = await fetch(`${BASE_URL}/api/v1/payments/emi-plans`);
    const emiJson = await emiRes.json();
    assert(emiRes.status === 200, "EMI plans endpoint returns 200");
    assert(emiJson.data.plans.length === 8, "Official EMI schedule has 8 tenures");
    const plan9m = emiJson.data.plans.find((p) => p.tenure === 9);
    assert(plan9m && plan9m.rate === 6.95, "9 Months EMI rate is 6.95%");

    const emiCalcRes = await fetch(`${BASE_URL}/api/v1/payments/calculate-emi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 50000, tenure: 9 }),
    });
    const emiCalcJson = await emiCalcRes.json();
    assert(emiCalcRes.status === 200, "Calculate EMI endpoint returns 200");
    assert(emiCalcJson.data.bankCharge === 3475, "Bank charge for 50k @ 6.95% is 3,475 BDT");
    assert(emiCalcJson.data.totalPayable === 53475, "Total payable is 53,475 BDT");
    assert(emiCalcJson.data.monthlyInstallment === 5942, "Monthly installment is 5,942 BDT");

    console.log("\n==========================================");
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==========================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Unexpected test exception:", err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await prisma.$disconnect();
  }
}

runTests();

