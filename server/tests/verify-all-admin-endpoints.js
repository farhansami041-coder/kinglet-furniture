import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import prisma from "../src/db/prisma.js";

dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });

const BASE_URL = "http://localhost:5000";
const JWT_SECRET = process.env.JWT_SECRET || "kinglet-super-secret-jwt-key-2026-production-grade";

async function runAudit() {
  console.log("================================================================================");
  console.log("  VERIFYING ALL ADMIN PORTAL BACKEND ENDPOINTS & FLOWS");
  console.log("================================================================================\n");

  // 1. Get or create Super Admin User
  let admin = await prisma.user.findFirst({
    where: { roles: { some: { role: { name: "SUPER_ADMIN" } } } },
    include: { roles: { include: { role: true } } }
  });

  if (!admin) {
    console.log("Super admin not found, querying any admin...");
    admin = await prisma.user.findFirst();
  }

  const token = jwt.sign(
    {
      userId: admin.id,
      phone: admin.phone,
      roles: ["SUPER_ADMIN", "ADMIN", "STORE_MANAGER"],
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const results = [];

  async function checkEndpoint(name, path, method = "GET", body = null) {
    try {
      const opts = { method, headers: authHeaders };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${BASE_URL}${path}`, opts);
      const json = await res.json().catch(() => ({}));
      const isOk = res.ok && json.success !== false;
      results.push({ name, path, method, status: res.status, ok: isOk, msg: json.message || "" });
      console.log(`[${isOk ? "PASS" : "FAIL"}] ${name.padEnd(20)} | ${method.padEnd(6)} ${path.padEnd(38)} | Status: ${res.status}`);
      return json;
    } catch (err) {
      results.push({ name, path, method, status: 500, ok: false, msg: err.message });
      console.log(`[FAIL] ${name.padEnd(20)} | ${method.padEnd(6)} ${path.padEnd(38)} | Error: ${err.message}`);
      return null;
    }
  }

  // 1. Dashboard Stats
  await checkEndpoint("Dashboard Stats", "/api/v1/admin/dashboard/stats");

  // 2. All Orders
  const ordersData = await checkEndpoint("All Orders", "/api/v1/admin/orders");
  const testOrder = ordersData?.data?.orders?.[0] || ordersData?.data?.[0];

  // 3. Order Status Update
  if (testOrder) {
    await checkEndpoint(
      "Order Status",
      `/api/v1/admin/orders/${testOrder.id}/status`,
      "PUT",
      { status: testOrder.orderStatus || "PROCESSING", notes: "Audit status verification" }
    );

    // 4. Verify Payment (TrxID)
    await checkEndpoint(
      "Verify Payment",
      `/api/v1/admin/orders/${testOrder.id}/payment`,
      "PATCH",
      { paymentStatus: "PARTIAL", notes: "COD advance verified" }
    );

    // 5. Dispatch Tracking
    await checkEndpoint(
      "Dispatch Tracking",
      `/api/v1/admin/orders/${testOrder.id}/tracking`,
      "POST",
      { courierName: "Kinglet White-Glove Fleet", trackingNumber: "KL-TRK-AUDIT-99", notes: "Crated & Dispatched" }
    );
  } else {
    console.log("No orders available to test order status/payment/tracking, skipping single order endpoints.");
  }

  // 6. Manage Products
  const productsData = await checkEndpoint("Manage Products", "/api/v1/admin/products");

  // 7. Manage Inventory
  await checkEndpoint("Manage Inventory", "/api/v1/admin/inventory");
  await checkEndpoint("Stock Movements", "/api/v1/admin/inventory/movements");

  // 8. Categories
  await checkEndpoint("Categories", "/api/v1/admin/categories");

  // 9. Coupons
  await checkEndpoint("Coupons", "/api/v1/admin/coupons");

  // 10. Lead Tickets
  const ticketsData = await checkEndpoint("Lead Tickets", "/api/v1/admin/tickets");
  const testTicket = ticketsData?.data?.[0];
  if (testTicket) {
    await checkEndpoint(
      "Update Ticket",
      `/api/v1/admin/tickets/${testTicket.id}/status`,
      "PUT",
      { status: "RESOLVED" }
    );
  }

  // 11. SEO Studio Sitemap
  await checkEndpoint("SEO Matrix", "/api/v1/admin/seo/matrix");
  await checkEndpoint("Sitemap Regen", "/api/v1/admin/seo/sitemap/regenerate", "POST");

  // 12. Audit Logs
  await checkEndpoint("Audit Logs", "/api/v1/admin/audit-logs");

  // 13. Transactions
  await checkEndpoint("Transactions", "/api/v1/admin/transactions");

  // 14. Customers
  await checkEndpoint("Customers List", "/api/v1/admin/customers");

  // 15. Settings
  await checkEndpoint("Settings", "/api/v1/admin/settings");

  console.log("\n================================================================================");
  const total = results.length;
  const passed = results.filter(r => r.ok).length;
  console.log(`TOTAL ENDPOINTS TESTED: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log("================================================================================\n");

  await prisma.$disconnect();
}

runAudit();

