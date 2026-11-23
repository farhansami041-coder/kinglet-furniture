import assert from "assert";

const API_BASE = "http://localhost:5000/api/v1";

async function runCartCheckoutPaymentTests() {
  console.log("🧪 Starting Comprehensive Cart, Checkout & Payment Gateway Test Suite...\n");

  const guestSessionId = "guest-test-" + Date.now();
  const sessionHeaders = {
    "Content-Type": "application/json",
    "x-session-id": guestSessionId,
  };

  // -------------------------------------------------------------
  // 1. Fetch available products from catalog
  // -------------------------------------------------------------
  const prodsRes = await fetch(`${API_BASE}/products?limit=2`);
  const prodsJson = await prodsRes.json();
  assert.strictEqual(prodsRes.status, 200, "Catalog must be available");
  assert(prodsJson.data && prodsJson.data.length > 0, "At least one product must exist in database");

  const testProduct = prodsJson.data[0];
  console.log(`✅ 1. Catalog verified. Using test product: "${testProduct.name}" (ID: ${testProduct.id}, SKU: ${testProduct.sku})`);

  // -------------------------------------------------------------
  // 2. Persistent Guest Cart Operations
  // -------------------------------------------------------------
  // A. Get or Create Cart
  const getCartRes = await fetch(`${API_BASE}/cart`, { headers: sessionHeaders });
  const getCartJson = await getCartRes.json();
  assert.strictEqual(getCartRes.status, 200);
  assert(getCartJson.data.cartId, "Cart ID must be returned");
  console.log(`✅ 2A. Guest cart initialized with session: ${guestSessionId}`);

  // B. Add Item to Cart
  const addItemRes = await fetch(`${API_BASE}/cart/items`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({
      productId: testProduct.id,
      quantity: 2,
    }),
  });
  const addItemJson = await addItemRes.json();
  assert.strictEqual(addItemRes.status, 200, `Add item failed: ${addItemJson.message}`);
  console.log(`✅ 2B. Added 2 units of "${testProduct.name}" to cart`);

  // Verify cart item exists
  const cartWithItemRes = await fetch(`${API_BASE}/cart`, { headers: sessionHeaders });
  const cartWithItem = await cartWithItemRes.json();
  const cartItem = cartWithItem.data.items.find((i) => i.productId === testProduct.id);
  assert(cartItem, "Item must exist in cart");
  assert.strictEqual(cartItem.quantity, 2);

  // C. Update Quantity with Stock Validation
  const updateQtyRes = await fetch(`${API_BASE}/cart/items/${cartItem.id}`, {
    method: "PUT",
    headers: sessionHeaders,
    body: JSON.stringify({ quantity: 3 }),
  });
  assert.strictEqual(updateQtyRes.status, 200);
  console.log(`✅ 2C. Updated cart item quantity to 3`);

  // D. Revalidate Cart Stock and Pricing
  const revalRes = await fetch(`${API_BASE}/cart/revalidate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ productId: testProduct.id, quantity: 3 }],
    }),
  });
  const revalJson = await revalRes.json();
  assert.strictEqual(revalRes.status, 200);
  assert.strictEqual(typeof revalJson.data.allValid, "boolean");
  console.log(`✅ 2D. Revalidation endpoint verified (allValid: ${revalJson.data.allValid})`);

  // -------------------------------------------------------------
  // 3. Checkout: Atomic COD Order Placement & Idempotency
  // -------------------------------------------------------------
  const idempotencyKey = "TEST-IDEMP-" + Date.now();
  const orderPayload = {
    idempotencyKey,
    customerName: "Mohammad Tanvir Rahman",
    customerPhone: "01719876543",
    customerEmail: "tanvir.rahman@example.com",
    shippingAddress: "House 42, Road 11, Block D, Mirpur 12",
    division: "Dhaka",
    district: "Dhaka City",
    thana: "Mirpur",
    paymentMethod: "COD",
    shippingCode: "dhaka_flat",
    items: [{ productId: testProduct.id, quantity: 1 }],
  };

  const createOrderRes = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload),
  });
  const createOrderJson = await createOrderRes.json();
  assert.strictEqual(createOrderRes.status, 201, `Order creation failed: ${createOrderJson.message}`);
  const codOrder = createOrderJson.data;

  assert(codOrder.orderNumber.startsWith("KL-ORD-") || codOrder.orderNumber.startsWith("KL-TRK-"), "Must have valid order reference");
  assert.strictEqual(codOrder.orderStatus, "PENDING", "Initial order status must be PENDING");
  assert.strictEqual(codOrder.paymentStatus, "UNPAID", "COD order initial payment status must be UNPAID");
  assert.strictEqual(codOrder.paymentMethod, "COD");
  assert(codOrder.grandTotal > 0, "Grand total must be calculated server-side");
  console.log(`✅ 3A. Cash on Delivery order created: ${codOrder.orderNumber} (Grand Total: ৳${codOrder.grandTotal.toLocaleString()})`);

  // Test Idempotency: Submit same payload with same idempotencyKey
  const dupOrderRes = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload),
  });
  const dupOrderJson = await dupOrderRes.json();
  assert.strictEqual(dupOrderRes.status, 200, "Duplicate submission must return 200 OK");
  assert.strictEqual(dupOrderJson.data.orderNumber, codOrder.orderNumber, "Must return original order");
  console.log(`✅ 3B. Idempotent submission prevented duplicate double-booking`);

  // -------------------------------------------------------------
  // 4. Online Payment Gateway (SSLCommerz / bKash Adapter)
  // -------------------------------------------------------------
  // A. Create an order with Online Payment
  const onlineOrderPayload = {
    idempotencyKey: "ONLINE-IDEMP-" + Date.now(),
    customerName: "Farhana Yasmin",
    customerPhone: "01812345678",
    customerEmail: "farhana.yasmin@example.com",
    shippingAddress: "Apartment 5A, Gulshan Avenue 2",
    division: "Dhaka",
    district: "Dhaka City",
    thana: "Gulshan",
    paymentMethod: "CARD_POS",
    shippingCode: "dhaka_flat",
    items: [{ productId: testProduct.id, quantity: 1 }],
  };

  const createOnlineRes = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(onlineOrderPayload),
  });
  const onlineOrder = (await createOnlineRes.json()).data;
  assert(onlineOrder, "Online order created");
  console.log(`✅ 4A. Online order created: ${onlineOrder.orderNumber}`);

  // B. Initiate Gateway Payment Session
  const initPayRes = await fetch(`${API_BASE}/payments/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: onlineOrder.id }),
  });
  const initPayJson = await initPayRes.json();
  assert.strictEqual(initPayRes.status, 200, "Gateway session initiation must succeed");
  assert(initPayJson.data.gatewayUrl, "Must return gatewayUrl");
  assert(initPayJson.data.sessionKey, "Must return sessionKey");
  console.log(`✅ 4B. Gateway session initiated: ${initPayJson.data.sessionKey}`);

  // C. Server-Side Verification: Valid Payment Callback
  const simValId = "SIM-BKASH-" + Date.now();
  const verifyRes = await fetch(`${API_BASE}/payments/sslcommerz/success`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      val_id: simValId,
      tran_id: onlineOrder.orderNumber,
      amount: onlineOrder.grandTotal.toString(),
      currency: "BDT",
    }).toString(),
    redirect: "manual",
  });
  // Successful verification issues a 303 See Other redirect to /order-confirmation/:orderNumber?payment=success
  assert(
    verifyRes.status === 303 || verifyRes.status === 302,
    `Expected 303 redirect, received status ${verifyRes.status}`
  );
  const locationHeader = verifyRes.headers.get("location");
  assert(locationHeader.includes("payment=success"), "Redirect must indicate payment=success");
  console.log(`✅ 4C. Server-side payment verification processed. Redirected to: ${locationHeader}`);

  // D. Verify Database State: Order is PAID and CONFIRMED
  const statusRes = await fetch(`${API_BASE}/payments/status/${onlineOrder.orderNumber}`);
  const statusJson = await statusRes.json();
  assert.strictEqual(statusRes.status, 200);
  assert.strictEqual(statusJson.data.paymentStatus, "PAID", "Order paymentStatus must be PAID");
  assert.strictEqual(statusJson.data.orderStatus, "CONFIRMED", "Order must transition to CONFIRMED on valid payment");
  assert(statusJson.data.payments.length > 0, "PaymentTransaction record must exist");
  assert.strictEqual(statusJson.data.payments[0].status, "SUCCESS");
  console.log(`✅ 4D. DB verification: Order ${onlineOrder.orderNumber} is PAID & CONFIRMED`);

  // E. Idempotent IPN Webhook: Double processing protection
  const ipnRes = await fetch(`${API_BASE}/payments/sslcommerz/ipn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      val_id: simValId,
      tran_id: onlineOrder.orderNumber,
      amount: onlineOrder.grandTotal,
      status: "VALID",
    }),
  });
  const ipnJson = await ipnRes.json();
  assert.strictEqual(ipnRes.status, 200);
  assert.strictEqual(ipnJson.status, "OK");
  console.log(`✅ 4E. Idempotent IPN webhook handled duplicate event cleanly`);

  // -------------------------------------------------------------
  // 5. Payment Gateway Failure & Cancellation
  // -------------------------------------------------------------
  const failOrderPayload = {
    idempotencyKey: "FAIL-IDEMP-" + Date.now(),
    customerName: "Test Decliner",
    customerPhone: "01999999999",
    shippingAddress: "Banani 11, Dhaka",
    paymentMethod: "CARD_POS",
    items: [{ productId: testProduct.id, quantity: 1 }],
  };
  const failOrderRes = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(failOrderPayload),
  });
  const failOrder = (await failOrderRes.json()).data;

  // Simulate Gateway Declination Callback
  const failCallbackRes = await fetch(`${API_BASE}/payments/sslcommerz/fail`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      tran_id: failOrder.orderNumber,
      error: "Card Declined - Insufficient Funds",
    }).toString(),
    redirect: "manual",
  });
  assert(failCallbackRes.status === 303 || failCallbackRes.status === 302);
  const failLocation = failCallbackRes.headers.get("location");
  assert(failLocation.includes("payment=failed"), "Redirect must indicate payment=failed");

  // Verify failed order was NOT marked as paid
  const checkFailOrderRes = await fetch(`${API_BASE}/payments/status/${failOrder.orderNumber}`);
  const checkFailOrder = (await checkFailOrderRes.json()).data;
  assert.strictEqual(checkFailOrder.paymentStatus, "FAILED", "Declined order must have paymentStatus FAILED");
  assert.notStrictEqual(checkFailOrder.paymentStatus, "PAID", "Declined order must never be marked PAID");
  console.log(`✅ 5. Gateway declination recorded safely. Order paymentStatus: FAILED (Not Paid)`);

  // -------------------------------------------------------------
  // 6. Public Live Tracking Endpoint
  // -------------------------------------------------------------
  const trackRes = await fetch(`${API_BASE}/orders/track/${onlineOrder.orderNumber}`);
  const trackJson = await trackRes.json();
  assert.strictEqual(trackRes.status, 200);
  assert.strictEqual(trackJson.data.orderNumber, onlineOrder.orderNumber);
  assert(trackJson.data.statusHistory.length > 0, "Status history must contain milestones");
  console.log(`✅ 6. Public live tracking confirmed: ${trackJson.data.statusHistory.length} timeline milestones logged`);

  console.log("\n🎉 ALL 12 CART, CHECKOUT & PAYMENT INTEGRATION TESTS PASSED WITH 100% SUCCESS!\n");
}

runCartCheckoutPaymentTests().catch((err) => {
  console.error("\n❌ Test Suite Failed:", err);
  process.exit(1);
});
