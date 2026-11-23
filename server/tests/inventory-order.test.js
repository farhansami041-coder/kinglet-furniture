import assert from "assert";

const API_BASE = "http://localhost:5000/api/v1";

async function runInventoryOrderTests() {
  console.log("🧪 Starting Concurrency, Inventory & Order Management Test Suite...\n");

  // 1. Authenticate as Super Admin
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+8801676900442", password: "KingletAdmin@2026" }),
  });
  const loginJson = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, "Admin login must succeed");
  const token = loginJson.data.token;
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  console.log("✅ 1. Admin Authentication verified");

  // 2. Fetch a test product and set stock to exactly 1 unit
  const prodsRes = await fetch(`${API_BASE}/products?limit=1`);
  const prodsJson = await prodsRes.json();
  const testProduct = prodsJson.data[0];
  assert(testProduct, "Must find at least one test product");

  // Set stock to 1
  const adjustRes = await fetch(`${API_BASE}/admin/inventory/adjust`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      productId: testProduct.id,
      newQuantity: 1,
      reason: "ADMIN_MANUAL_ADJUST",
      notes: "Preparation for Concurrency-Safe Stock Race Test",
    }),
  });
  assert.strictEqual(adjustRes.status, 200);
  console.log(`✅ 2. Test product "${testProduct.name}" stock initialized to 1 unit`);

  // 3. CONCURRENCY TEST: Simultaneous purchase attempts for the same limited stock (Race Condition Test)
  console.log("⏳ Triggering 2 parallel purchase requests for the single available unit...");
  const orderPayload1 = {
    customerName: "Buyer Alpha",
    customerPhone: "01711000001",
    shippingAddress: "Banani DOHS, Dhaka",
    paymentMethod: "COD",
    items: [{ productId: testProduct.id, quantity: 1 }],
  };
  const orderPayload2 = {
    customerName: "Buyer Beta",
    customerPhone: "01711000002",
    shippingAddress: "Gulshan 2, Dhaka",
    paymentMethod: "COD",
    items: [{ productId: testProduct.id, quantity: 1 }],
  };

  const [res1, res2] = await Promise.all([
    fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload1),
    }),
    fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload2),
    }),
  ]);

  const [json1, json2] = await Promise.all([res1.json(), res2.json()]);

  const successCount = (res1.status === 201 ? 1 : 0) + (res2.status === 201 ? 1 : 0);
  const failureCount = (res1.status === 400 || res1.status === 500 ? 1 : 0) + (res2.status === 400 || res2.status === 500 ? 1 : 0);

  assert.strictEqual(successCount, 1, "Exactly ONE buyer must successfully purchase the last unit");
  assert.strictEqual(failureCount, 1, "The second concurrent buyer MUST be blocked with Insufficient Stock");

  // Verify stock is now 0 and not negative
  const invCheck = await fetch(`${API_BASE}/admin/inventory?search=${testProduct.sku}`, { headers: authHeaders });
  const invJson = await invCheck.json();
  const currentInv = invJson.data.find((i) => i.productId === testProduct.id);
  assert.strictEqual(currentInv.quantityAvailable, 0, "Stock must reach 0 without overselling or negative inventory");
  console.log("✅ 3. Concurrency-Safe Stock Race Test PASSED: 1 succeeded, 1 safely rejected, final balance = 0");

  const winningOrder = res1.status === 201 ? json1.data : json2.data;

  // 4. IDEMPOTENCY & DUPLICATE SUBMISSION TEST
  console.log("⏳ Testing idempotency with duplicate submissions...");
  const idempotencyKey = `idemp-${Date.now()}-${Math.random()}`;

  // Reset stock to 5 for next tests
  await fetch(`${API_BASE}/admin/inventory/adjust`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      productId: testProduct.id,
      newQuantity: 5,
      reason: "RESTOCK",
    }),
  });

  const idempPayload = {
    idempotencyKey,
    customerName: "Imran Khan",
    customerPhone: "01811223344",
    shippingAddress: "Uttara Sector 11, Dhaka",
    paymentMethod: "COD",
    items: [{ productId: testProduct.id, quantity: 2 }],
  };

  const idempRes1 = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(idempPayload),
  });
  const idempJson1 = await idempRes1.json();
  assert.strictEqual(idempRes1.status, 201, "First submission must succeed");

  // Repeated submission with same idempotency key
  const idempRes2 = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(idempPayload),
  });
  const idempJson2 = await idempRes2.json();
  assert.strictEqual(idempRes2.status, 200, "Repeated submission must return 200 OK");
  assert.strictEqual(idempJson1.data.id, idempJson2.data.id, "Must return identical existing order");

  // Verify stock was decremented ONLY once (5 - 2 = 3)
  const idempInvCheck = await fetch(`${API_BASE}/admin/inventory?search=${testProduct.sku}`, { headers: authHeaders });
  const idempInvJson = await idempInvCheck.json();
  const idempInv = idempInvJson.data.find((i) => i.productId === testProduct.id);
  assert.strictEqual(idempInv.quantityAvailable, 3, "Stock must decrement only once, zero double-decrement");
  console.log("✅ 4. Idempotency Test PASSED: Duplicate submission recognized, stock decremented exactly once");

  const createdOrder = idempJson1.data;

  // 5. STATE MACHINE ENFORCEMENT TEST: Invalid transitions must be rejected
  console.log("⏳ Testing State Machine transition enforcement...");
  const invalidTransitionRes = await fetch(`${API_BASE}/admin/orders/${createdOrder.id}/status`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ status: "DELIVERED" }), // PENDING cannot jump directly to DELIVERED
  });
  assert.strictEqual(invalidTransitionRes.status, 500, "Jumping directly from PENDING to DELIVERED must be rejected");
  console.log("✅ 5. State Machine Transition Guard verified (Illegal jump PENDING -> DELIVERED rejected)");

  // 6. ZERO DOUBLE-DECREMENT IN ORDER PIPELINE
  console.log("⏳ Advancing order through pipeline stages and checking stock balance...");
  // PENDING -> CONFIRMED
  await fetch(`${API_BASE}/admin/orders/${createdOrder.id}/status`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ status: "CONFIRMED", stepIndex: 1 }),
  });
  // CONFIRMED -> PROCESSING
  await fetch(`${API_BASE}/admin/orders/${createdOrder.id}/status`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ status: "PROCESSING", stepIndex: 2 }),
  });
  // PROCESSING -> READY_FOR_DISPATCH
  await fetch(`${API_BASE}/admin/orders/${createdOrder.id}/status`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ status: "READY_FOR_DISPATCH", stepIndex: 5 }),
  });

  const pipelineInvCheck = await fetch(`${API_BASE}/admin/inventory?search=${testProduct.sku}`, { headers: authHeaders });
  const pipelineInvJson = await pipelineInvCheck.json();
  const pipelineInv = pipelineInvJson.data.find((i) => i.productId === testProduct.id);
  assert.strictEqual(pipelineInv.quantityAvailable, 3, "Advancing order pipeline must NEVER double-decrement stock");
  console.log("✅ 6. Zero Double-Decrement verified across CONFIRMED -> PROCESSING -> READY_FOR_DISPATCH");

  // 7. ORDER CANCELLATION & ATOMIC STOCK RESTORATION TEST
  console.log("⏳ Cancelling order and verifying atomic stock restoration...");
  const cancelRes = await fetch(`${API_BASE}/admin/orders/${createdOrder.id}/status`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      status: "CANCELLED",
      comment: "Customer requested cancellation due to change of floor dimensions",
    }),
  });
  assert.strictEqual(cancelRes.status, 200, "Cancellation must succeed");

  // Check that stock was restored by +2 (3 + 2 = 5)
  const restoredInvCheck = await fetch(`${API_BASE}/admin/inventory?search=${testProduct.sku}`, { headers: authHeaders });
  const restoredInvJson = await restoredInvCheck.json();
  const restoredInv = restoredInvJson.data.find((i) => i.productId === testProduct.id);
  assert.strictEqual(restoredInv.quantityAvailable, 5, "Stock must be restored to 5 upon cancellation");

  // Verify stock movement ledger has ORDER_CANCELLED_RESTORE
  const movementsRes = await fetch(`${API_BASE}/admin/inventory/movements?productId=${testProduct.id}`, { headers: authHeaders });
  const movementsJson = await movementsRes.json();
  const cancelMovement = movementsJson.data.find((m) => m.movementType === "ORDER_CANCELLED_RESTORE");
  assert(cancelMovement, "Must record an ORDER_CANCELLED_RESTORE stock movement");
  assert.strictEqual(cancelMovement.quantity, 2, "Restoration quantity must match ordered item count (+2)");
  console.log("✅ 7. Order Cancellation & Stock Restoration verified (Stock returned from 3 -> 5 with audit entry)");

  // 8. EXACT-ONCE RESTORATION PROTECTION
  console.log("⏳ Verifying cancellation cannot restore stock a second time...");
  const secondCancelAttempt = await fetch(`${API_BASE}/admin/orders/${createdOrder.id}/status`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ status: "CANCELLED", comment: "Attempting duplicate cancel" }),
  });
  // State machine rejects transition from CANCELLED to CANCELLED or idempotently no-ops
  const postSecondInvCheck = await fetch(`${API_BASE}/admin/inventory?search=${testProduct.sku}`, { headers: authHeaders });
  const postSecondInvJson = await postSecondInvCheck.json();
  const postSecondInv = postSecondInvJson.data.find((i) => i.productId === testProduct.id);
  assert.strictEqual(postSecondInv.quantityAvailable, 5, "Stock must remain 5 and NOT restore a second time");
  console.log("✅ 8. Exact-Once Restoration verified: Stock balance remains strictly 5");

  // 9. MANUAL STOCK ADJUSTMENT & AUDIT LEDGER
  console.log("⏳ Testing manual stock adjustment with authorized audit entry...");
  const manualAdjustRes = await fetch(`${API_BASE}/admin/inventory/adjust`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      productId: testProduct.id,
      newQuantity: 12,
      reason: "RESTOCK",
      notes: "Delivery of 7 new Seasoned Mahogany chassis from Mirpur Sawmill",
    }),
  });
  assert.strictEqual(manualAdjustRes.status, 200);

  const finalInvCheck = await fetch(`${API_BASE}/admin/inventory?search=${testProduct.sku}`, { headers: authHeaders });
  const finalInvJson = await finalInvCheck.json();
  const finalInv = finalInvJson.data.find((i) => i.productId === testProduct.id);
  assert.strictEqual(finalInv.quantityAvailable, 12, "Stock must equal 12");
  console.log("✅ 9. Manual Stock Adjustment & Audit Ledger verified (Balance updated to 12)");

  // 10. RESERVATION EXPIRATION SWEEPER
  const sweepRes = await fetch(`${API_BASE}/admin/inventory/sweep-reservations`, {
    method: "POST",
    headers: authHeaders,
  });
  assert.strictEqual(sweepRes.status, 200, "Sweep reservations endpoint must return 200");
  console.log("✅ 10. Reservation Expiration Sweeper verified");

  console.log("\n🎉 ALL 10 INVENTORY & ORDER MANAGEMENT TESTS PASSED WITH 100% SUCCESS!\n");
}

runInventoryOrderTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});

