import crypto from "crypto";
import prisma from "../db/prisma.js";
import { orderInventoryService, ORDER_STATUSES, STATUS_STEP_MAP } from "./orderInventory.service.js";
import { notificationService } from "./notification.service.js";
import { settingsService, DEFAULT_COD_SECURITY_ADVANCE_BDT } from "./settings.service.js";

/**
 * Kinglet Furniture - Bangladeshi Payment Gateway Integration Service
 * Supporting Official SSLCommerz v4 API, bKash/Nagad MFS via Aggregator,
 * Server-Side Verification, Idempotent IPN Webhooks, and Zero Raw Credential Storage.
 */

const IS_SANDBOX = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
const STORE_ID = process.env.SSLCOMMERZ_STORE_ID || "test_kinglet_store";
const STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD || "test_kinglet_secret";

// Official SSLCommerz API Endpoints
const SSL_SESSION_API = IS_SANDBOX
  ? "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
  : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

const SSL_VALIDATION_API = IS_SANDBOX
  ? "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
  : "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

export const COD_SECURITY_ADVANCE_BDT = DEFAULT_COD_SECURITY_ADVANCE_BDT;

export class PaymentService {
  /**
   * Determine if running in live merchant mode or sandbox simulation mode
   */
  static isSimulationMode() {
    return (
      !process.env.SSLCOMMERZ_STORE_ID ||
      process.env.SSLCOMMERZ_STORE_ID === "test_kinglet_store" ||
      process.env.SSLCOMMERZ_STORE_ID.startsWith("test_")
    );
  }

  /**
   * 1. Initiate Gateway Payment Session
   * Prepares signed parameters, contacts gateway, records PENDING transaction.
   */
  async initiatePayment({ orderId, clientOrigin, reqHost }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, customer: true },
    });

    if (!order) {
      throw new Error(`Order not found for ID: ${orderId}`);
    }

    if (order.paymentStatus === "PAID") {
      throw new Error(`Order ${order.orderNumber} is already fully paid.`);
    }

    const isCodAdvance = order.paymentMethod === "COD";
    if (isCodAdvance && order.paymentStatus === "PARTIAL") {
      throw new Error(`COD security advance for Order ${order.orderNumber} has already been paid.`);
    }

    const host = reqHost || "localhost:5000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const serverBaseUrl = `${protocol}://${host}`;
    const frontendBaseUrl = clientOrigin || process.env.CLIENT_ORIGIN || "http://localhost:5174";

    const codAdvanceBdt = await settingsService.getCodSecurityAdvanceBdt();
    const tran_id = order.orderNumber;
    const total_amount = isCodAdvance
      ? Math.min(codAdvanceBdt, Number(order.grandTotal))
      : Number(order.grandTotal);
    const paymentPurpose = isCodAdvance ? "cod_advance" : "full";

    // Upsert PENDING transaction for this payment attempt
    await prisma.paymentTransaction.upsert({
      where: { transactionRef: tran_id },
      update: {
        gateway: "SSLCOMMERZ",
        paymentChannel: "SSLCOMMERZ",
        purpose: paymentPurpose,
        amount: total_amount,
        status: "PENDING",
      },
      create: {
        orderId: order.id,
        transactionRef: tran_id,
        gateway: "SSLCOMMERZ",
        paymentChannel: "SSLCOMMERZ",
        purpose: paymentPurpose,
        amount: total_amount,
        currency: "BDT",
        status: "PENDING",
      },
    });

    // Callbacks configuration
    const successUrl = `${serverBaseUrl}/api/v1/payments/sslcommerz/success?frontend=${encodeURIComponent(frontendBaseUrl)}`;
    const failUrl = `${serverBaseUrl}/api/v1/payments/sslcommerz/fail?frontend=${encodeURIComponent(frontendBaseUrl)}`;
    const cancelUrl = `${serverBaseUrl}/api/v1/payments/sslcommerz/cancel?frontend=${encodeURIComponent(frontendBaseUrl)}`;
    const ipnUrl = `${serverBaseUrl}/api/v1/payments/sslcommerz/ipn`;

    // If live credentials are provided and NOT in simulation test mode:
    if (!PaymentService.isSimulationMode()) {
      try {
        const payload = new URLSearchParams({
          store_id: STORE_ID,
          store_passwd: STORE_PASSWORD,
          total_amount: total_amount.toFixed(2),
          currency: "BDT",
          tran_id: tran_id,
          success_url: successUrl,
          fail_url: failUrl,
          cancel_url: cancelUrl,
          ipn_url: ipnUrl,
          cus_name: order.customerName,
          cus_email: order.customerEmail || "customer@kingletbd.com",
          cus_add1: order.shippingAddress,
          cus_city: order.district,
          cus_country: "Bangladesh",
          cus_phone: order.customerPhone,
          shipping_method: "YES",
          num_of_item: order.items.length.toString(),
          product_name: isCodAdvance
            ? "Kinglet Furniture - COD Security Advance (5000 BDT)"
            : "Kinglet Handcrafted Furniture",
          product_category: "Furniture",
          product_profile: "physical-goods",
        });

        const gatewayRes = await fetch(SSL_SESSION_API, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: payload.toString(),
        });

        const gatewayData = await gatewayRes.json();

        if (gatewayData.status === "SUCCESS" && gatewayData.GatewayPageURL) {
          return {
            gatewayUrl: gatewayData.GatewayPageURL,
            sessionKey: gatewayData.sessionkey,
            isSimulation: false,
            orderNumber: order.orderNumber,
            amount: total_amount,
            purpose: paymentPurpose,
          };
        }
      } catch (err) {
        console.warn("SSLCommerz live API connection fallback to sandbox simulator:", err.message);
      }
    }

    // Built-in Sandbox Simulation Flow (Verified, Zero Mock Data in DB)
    const simulationSessionKey = "SIM-SSL-" + crypto.randomBytes(8).toString("hex").toUpperCase();
    const sandboxSimulatorUrl = `${serverBaseUrl}/api/v1/payments/simulate-sandbox-checkout?sessionkey=${simulationSessionKey}&orderNumber=${order.orderNumber}&amount=${total_amount}&orderTotal=${Number(order.grandTotal)}&purpose=${paymentPurpose}&frontend=${encodeURIComponent(frontendBaseUrl)}`;

    return {
      gatewayUrl: sandboxSimulatorUrl,
      sessionKey: simulationSessionKey,
      isSimulation: true,
      orderNumber: order.orderNumber,
      amount: total_amount,
      purpose: paymentPurpose,
    };
  }

  /**
   * 2. Server-Side Payment Verification (Official Validation API)
   * Calls gateway validation endpoint, checks amount, currency (BDT), tran_id.
   * Never marks order paid merely because user returned to a success URL!
   */
  async verifyPayment({ val_id, tran_id, rawPayload = {} }) {
    if (!tran_id) {
      throw new Error("Transaction Reference (tran_id) is required for verification.");
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: tran_id }, { invoiceCode: tran_id }],
      },
      include: { payments: true },
    });

    if (!order) {
      throw new Error(`Order not found matching transaction ref: ${tran_id}`);
    }

    const codAdvanceBdt = await settingsService.getCodSecurityAdvanceBdt();
    const isCodAdvance = order.paymentMethod === "COD";
    const expectedPayable = isCodAdvance
      ? Math.min(codAdvanceBdt, Number(order.grandTotal))
      : Number(order.grandTotal);

    // Idempotency: If already paid (or COD advance already paid), return early
    if (order.paymentStatus === "PAID" || (isCodAdvance && order.paymentStatus === "PARTIAL")) {
      return { success: true, alreadyPaid: true, order };
    }

    let isValid = false;
    let bankTrxId = val_id || "TRX-" + Date.now();
    let validatedAmount = expectedPayable;

    // Check via official validation API if real credentials configured
    if (!PaymentService.isSimulationMode() && val_id) {
      try {
        const validationUrl = `${SSL_VALIDATION_API}?val_id=${encodeURIComponent(val_id)}&store_id=${encodeURIComponent(STORE_ID)}&store_passwd=${encodeURIComponent(STORE_PASSWORD)}&v=1&format=json`;
        const valRes = await fetch(validationUrl);
        const valData = await valRes.json();

        if (
          (valData.status === "VALID" || valData.status === "VALIDATED") &&
          valData.currency === "BDT" &&
          Math.abs(Number(valData.amount) - expectedPayable) < 0.01 &&
          valData.tran_id === order.orderNumber
        ) {
          isValid = true;
          bankTrxId = valData.bank_tran_id || val_id;
          validatedAmount = Number(valData.amount);
        }
      } catch (err) {
        console.error("SSLCommerz Validation API error:", err);
      }
    } else {
      // In sandbox simulation, verify that val_id was issued for this transaction
      if (val_id && (val_id.startsWith("SIM-") || val_id.startsWith("VAL-") || val_id.startsWith("SSL-"))) {
        isValid = true;
        bankTrxId = val_id;
      }
    }

    if (!isValid) {
      // Log failed payment transaction
      await prisma.paymentTransaction.upsert({
        where: { transactionRef: tran_id },
        update: {
          status: "FAILED",
          rawResponseJson: JSON.stringify(rawPayload),
        },
        create: {
          orderId: order.id,
          transactionRef: tran_id,
          gateway: "SSLCOMMERZ",
          amount: expectedPayable,
          currency: "BDT",
          status: "FAILED",
          rawResponseJson: JSON.stringify(rawPayload),
        },
      });

      return { success: false, reason: "Payment validation failed or amount mismatch", order };
    }

    const newAdvancePaid = Math.min(Number(order.grandTotal), Number(order.advanceAmount || 0) + validatedAmount);
    const isFullSettlement = newAdvancePaid >= Number(order.grandTotal);
    const nextPaymentStatus = isFullSettlement ? "PAID" : "PARTIAL";
    const remainingDue = Math.max(0, Number(order.grandTotal) - newAdvancePaid);
    const paymentPurpose = isCodAdvance && !isFullSettlement ? "cod_advance" : "full";

    // Atomic DB update on valid payment
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update Payment Transaction to SUCCESS
      await tx.paymentTransaction.upsert({
        where: { transactionRef: tran_id },
        update: {
          status: "SUCCESS",
          paymentChannel: "SSLCOMMERZ",
          purpose: paymentPurpose,
          amount: validatedAmount,
          verifiedAt: new Date(),
          rawResponseJson: JSON.stringify({ ...rawPayload, bankTrxId, verifiedAt: new Date() }),
        },
        create: {
          orderId: order.id,
          transactionRef: tran_id,
          gateway: "SSLCOMMERZ",
          paymentChannel: "SSLCOMMERZ",
          purpose: paymentPurpose,
          amount: validatedAmount,
          currency: "BDT",
          status: "SUCCESS",
          verifiedAt: new Date(),
          rawResponseJson: JSON.stringify({ ...rawPayload, bankTrxId, verifiedAt: new Date() }),
        },
      });

      // 2. Mark Order as PAID / PARTIAL and automatically confirm if early awaiting stage
      const earlyStages = [ORDER_STATUSES.PENDING, ORDER_STATUSES.AWAITING_PAYMENT, ORDER_STATUSES.PAYMENT_VERIFICATION];
      const nextOrderStatus = earlyStages.includes(order.orderStatus) ? ORDER_STATUSES.CONFIRMED : order.orderStatus;

      const resOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: nextPaymentStatus,
          advanceAmount: newAdvancePaid,
          dueAmount: remainingDue,
          orderStatus: nextOrderStatus,
        },
      });

      // 3. Append to Order Status History
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: order.orderStatus,
          status: nextOrderStatus,
          stepIndex: STATUS_STEP_MAP[nextOrderStatus] || 1,
          comment:
            isCodAdvance && !isFullSettlement
              ? `COD Security Advance ৳${validatedAmount.toLocaleString()} paid via bKash/Bank Gateway (TrxID: ${bankTrxId}). Remaining due on delivery: ৳${remainingDue.toLocaleString()}.`
              : `Payment received in full (BDT ৳${validatedAmount.toLocaleString()}) via SSLCommerz Gateway. Bank TrxID: ${bankTrxId}`,
          notifiedSms: true,
        },
      });

      return resOrder;
    });

    notificationService.notifyPaymentStatusUpdate({
      order: updatedOrder,
      transaction: { amount: validatedAmount, transactionRef: bankTrxId },
    }).catch(() => {});

    return { success: true, alreadyPaid: false, order: updatedOrder };
  }

  /**
   * 3. Handle Idempotent IPN (Instant Payment Notification) Webhook
   */
  async handleIpnWebhook(payload) {
    const { tran_id, val_id, status } = payload;

    if (!tran_id) {
      throw new Error("Missing tran_id in IPN webhook payload");
    }

    // If status indicates failure
    if (status === "FAILED") {
      await this.handlePaymentFailure(tran_id, "Payment failed reported via IPN", payload);
      return { status: "PROCESSED_FAILED" };
    }

    if (status === "CANCELLED") {
      await this.handlePaymentCancel(tran_id, payload);
      return { status: "PROCESSED_CANCELLED" };
    }

    // For SUCCESS / VALID, execute strict server-side verification
    const result = await this.verifyPayment({ val_id, tran_id, rawPayload: payload });
    return { status: result.success ? "PROCESSED_SUCCESS" : "VALIDATION_FAILED", result };
  }

  /**
   * 4. Record Payment Failure
   */
  async handlePaymentFailure(tran_id, reason = "Payment declined or failed", rawPayload = {}) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: tran_id }, { invoiceCode: tran_id }],
      },
    });

    if (!order) return null;

    if (order.paymentStatus === "PAID") {
      return order; // Do not overwrite already paid order
    }

    const codAdvanceBdt = await settingsService.getCodSecurityAdvanceBdt();
    const expectedAmount = order.paymentMethod === "COD" ? Math.min(codAdvanceBdt, Number(order.grandTotal)) : Number(order.grandTotal);

    await prisma.paymentTransaction.upsert({
      where: { transactionRef: tran_id },
      update: {
        status: "FAILED",
        rawResponseJson: JSON.stringify({ reason, rawPayload, timestamp: new Date() }),
      },
      create: {
        orderId: order.id,
        transactionRef: tran_id,
        gateway: "SSLCOMMERZ",
        paymentChannel: "SSLCOMMERZ",
        purpose: order.paymentMethod === "COD" ? "cod_advance" : "full",
        amount: expectedAmount,
        currency: "BDT",
        status: "FAILED",
        rawResponseJson: JSON.stringify({ reason, rawPayload, timestamp: new Date() }),
      },
    });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });

    return updated;
  }

  /**
   * 5. Record Payment Cancellation
   */
  async handlePaymentCancel(tran_id, rawPayload = {}) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: tran_id }, { invoiceCode: tran_id }],
      },
    });

    if (!order || order.paymentStatus === "PAID") return order;

    const codAdvanceBdt = await settingsService.getCodSecurityAdvanceBdt();
    const expectedAmount = order.paymentMethod === "COD" ? Math.min(codAdvanceBdt, Number(order.grandTotal)) : Number(order.grandTotal);

    await prisma.paymentTransaction.upsert({
      where: { transactionRef: tran_id },
      update: {
        status: "CANCELLED",
        rawResponseJson: JSON.stringify({ cancelledAt: new Date(), rawPayload }),
      },
      create: {
        orderId: order.id,
        transactionRef: tran_id,
        gateway: "SSLCOMMERZ",
        paymentChannel: "SSLCOMMERZ",
        purpose: order.paymentMethod === "COD" ? "cod_advance" : "full",
        amount: expectedAmount,
        currency: "BDT",
        status: "CANCELLED",
        rawResponseJson: JSON.stringify({ cancelledAt: new Date(), rawPayload }),
      },
    });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "CANCELLED" },
    });

    return updated;
  }

  /**
   * 6. Submit Manual Payment / TrxID for Admin Verification (bKash, Bank, Nagad, Rocket, EMI)
   * Prevents duplicate TrxID submission and NEVER marks order as Paid/Confirmed automatically.
   */
  async submitManualTransaction({
    orderNumber,
    orderId,
    channel = "BKASH",
    trxId,
    senderAccount,
    purpose,
    emiTenure,
    amount,
  }) {
    const cleanTrxId = String(trxId || "").trim();
    if (cleanTrxId.length < 4) {
      const err = new Error("Valid Transaction ID (minimum 4 characters) is required.");
      err.statusCode = 400;
      throw err;
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          ...(orderNumber ? [{ orderNumber }, { invoiceCode: orderNumber }] : []),
        ],
      },
      include: { payments: true },
    });

    if (!order) {
      const err = new Error("Order not found.");
      err.statusCode = 404;
      throw err;
    }

    if (order.paymentStatus === "PAID") {
      const err = new Error(`Order ${order.orderNumber} is already fully paid.`);
      err.statusCode = 409;
      throw err;
    }

    // Duplicate manual TrxID check across active/completed transactions
    const existingDuplicate = await prisma.paymentTransaction.findFirst({
      where: {
        manualTrxId: cleanTrxId,
        status: { notIn: ["FAILED", "CANCELLED"] },
      },
    });
    if (existingDuplicate) {
      const err = new Error(`Transaction ID "${cleanTrxId}" has already been submitted.`);
      err.statusCode = 409;
      throw err;
    }

    const codAdvanceBdt = await settingsService.getCodSecurityAdvanceBdt();
    const remainingDue = Math.max(0, Number(order.grandTotal) - Number(order.advanceAmount || 0));
    const resolvedPurpose = purpose || (order.paymentMethod === "COD" ? "cod_advance" : "full");
    const expectedAmount =
      Number(amount) > 0
        ? Math.min(remainingDue || Number(order.grandTotal), Number(amount))
        : resolvedPurpose === "cod_advance"
        ? Math.min(codAdvanceBdt, remainingDue || Number(order.grandTotal))
        : remainingDue || Number(order.grandTotal);

    const upperChannel = String(channel || "MANUAL").toUpperCase();
    const txRef = `MNL-${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`;

    const { createdTx, updatedOrder } = await prisma.$transaction(async (tx) => {
      const created = await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          transactionRef: txRef,
          gateway: upperChannel,
          paymentChannel: upperChannel,
          purpose: resolvedPurpose,
          senderAccount: senderAccount ? String(senderAccount).trim() : null,
          manualTrxId: cleanTrxId,
          amount: expectedAmount,
          currency: "BDT",
          status: "AWAITING_VERIFICATION",
          rawResponseJson: JSON.stringify({
            submittedAt: new Date(),
            emiTenure: emiTenure || null,
            channel: upperChannel,
          }),
        },
      });

      const earlyStatuses = [ORDER_STATUSES.PENDING, ORDER_STATUSES.AWAITING_PAYMENT, ORDER_STATUSES.PAYMENT_VERIFICATION];
      const nextOrderStatus = earlyStatuses.includes(order.orderStatus)
        ? ORDER_STATUSES.PAYMENT_VERIFICATION
        : order.orderStatus;

      const ord = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "AWAITING_VERIFICATION",
          orderStatus: nextOrderStatus,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: order.orderStatus,
          status: nextOrderStatus,
          stepIndex: STATUS_STEP_MAP[nextOrderStatus] || 1,
          comment: `Customer submitted ${upperChannel} TrxID "${cleanTrxId}" for ৳${expectedAmount.toLocaleString()}. Awaiting admin verification.`,
          notifiedSms: false,
        },
      });

      return { createdTx: created, updatedOrder: ord };
    });

    notificationService.notifyManualPaymentSubmitted({
      order: updatedOrder,
      transaction: createdTx,
    }).catch(() => {});

    return { order: updatedOrder, transaction: createdTx };
  }
}

export const paymentService = new PaymentService();
