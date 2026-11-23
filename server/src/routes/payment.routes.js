import express from "express";
import { z } from "zod";
import prisma from "../db/prisma.js";
import { paymentService } from "../services/payment.service.js";
import { settingsService } from "../services/settings.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/v1/payments/config
 * Public dynamic checkout & payment configuration (no hardcoded advance or merchant numbers)
 */
router.get("/config", async (req, res, next) => {
  try {
    const config = await settingsService.getPaymentPublicConfig();
    return sendSuccess(res, config);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/payments/emi-plans
 * Public endpoint to fetch full bank EMI schedule & interest rates
 */
router.get("/emi-plans", async (req, res, next) => {
  try {
    const emiConfig = await settingsService.getEmiConfig();
    return sendSuccess(res, emiConfig, "EMI plans retrieved successfully");
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/payments/calculate-emi
 * Server-side calculation endpoint for EMI breakdown
 */
router.post("/calculate-emi", async (req, res, next) => {
  try {
    const { amount, tenure } = req.body;
    const result = await settingsService.calculateEmi(amount, tenure);
    return sendSuccess(res, result, "EMI calculated successfully");
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/payments/initiate
 * Initiate a payment gateway session for an order
 */
router.post("/initiate", optionalAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      orderId: z.string().min(1, "Order ID is required"),
    });

    const { orderId } = schema.parse(req.body);
    const clientOrigin = req.headers.origin || process.env.CLIENT_ORIGIN || "http://localhost:5174";
    const reqHost = req.get("host");

    const session = await paymentService.initiatePayment({
      orderId,
      clientOrigin,
      reqHost,
    });

    return sendSuccess(res, session, "Payment session initiated successfully");
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/payments/sslcommerz/success
 * Browser return callback from SSLCommerz on successful payment
 */
router.post("/sslcommerz/success", async (req, res, next) => {
  try {
    const payload = req.body || {};
    const val_id = payload.val_id || req.query.val_id;
    const tran_id = payload.tran_id || req.query.tran_id;
    const frontend = req.query.frontend || process.env.CLIENT_ORIGIN || "http://localhost:5174";

    const result = await paymentService.verifyPayment({
      val_id,
      tran_id,
      rawPayload: payload,
    });

    const orderNumber = result.order?.orderNumber || tran_id;
    const purpose = result.order?.paymentMethod === "COD" ? "cod_advance" : "full";
    const redirectUrl = `${frontend}/order-confirmation/${encodeURIComponent(orderNumber)}?payment=success&purpose=${encodeURIComponent(purpose)}&tran_id=${encodeURIComponent(tran_id || "")}`;
    return res.redirect(303, redirectUrl);
  } catch (err) {
    console.error("Payment success callback error:", err);
    const frontend = req.query.frontend || process.env.CLIENT_ORIGIN || "http://localhost:5174";
    const tran_id = req.body?.tran_id || req.query?.tran_id || "error";
    return res.redirect(303, `${frontend}/order-confirmation/${encodeURIComponent(tran_id)}?payment=failed&error=${encodeURIComponent(err.message)}`);
  }
});

/**
 * POST /api/v1/payments/sslcommerz/fail
 * Browser return callback from SSLCommerz on failed payment
 */
router.post("/sslcommerz/fail", async (req, res, next) => {
  try {
    const payload = req.body || {};
    const tran_id = payload.tran_id || req.query.tran_id;
    const frontend = req.query.frontend || process.env.CLIENT_ORIGIN || "http://localhost:5174";

    if (tran_id) {
      await paymentService.handlePaymentFailure(tran_id, payload.error || "Payment failed at gateway", payload);
    }

    const redirectUrl = `${frontend}/order-confirmation/${encodeURIComponent(tran_id || "")}?payment=failed`;
    return res.redirect(303, redirectUrl);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/payments/sslcommerz/cancel
 * Browser return callback from SSLCommerz on cancelled payment
 */
router.post("/sslcommerz/cancel", async (req, res, next) => {
  try {
    const payload = req.body || {};
    const tran_id = payload.tran_id || req.query.tran_id;
    const frontend = req.query.frontend || process.env.CLIENT_ORIGIN || "http://localhost:5174";

    if (tran_id) {
      await paymentService.handlePaymentCancel(tran_id, payload);
    }

    const redirectUrl = `${frontend}/order-confirmation/${encodeURIComponent(tran_id || "")}?payment=cancelled`;
    return res.redirect(303, redirectUrl);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/payments/sslcommerz/ipn
 * Idempotent Instant Payment Notification (IPN) webhook called server-to-server
 */
router.post("/sslcommerz/ipn", async (req, res, next) => {
  try {
    const payload = req.body || {};
    const outcome = await paymentService.handleIpnWebhook(payload);
    return res.status(200).json({ status: "OK", outcome });
  } catch (err) {
    console.error("IPN webhook handler error:", err);
    return res.status(400).json({ status: "ERROR", message: err.message });
  }
});

/**
 * POST /api/v1/payments/verify
 * Explicit server-side payment verification endpoint
 */
router.post("/verify", optionalAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      val_id: z.string().min(1),
      tran_id: z.string().min(1),
    });
    const { val_id, tran_id } = schema.parse(req.body);
    const result = await paymentService.verifyPayment({ val_id, tran_id, rawPayload: req.body });
    if (!result.success) {
      return sendError(res, result.reason || "Payment validation failed", 400);
    }
    return sendSuccess(res, result, "Payment verified successfully");
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/payments/submit-transaction
 * Submit manual bKash / Bank / Nagad / EMI TrxID for admin verification
 */
router.post("/submit-transaction", optionalAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      orderNumber: z.string().optional(),
      orderId: z.string().optional(),
      channel: z.string().min(2).default("BKASH"),
      trxId: z.string().min(4, "Transaction ID must be at least 4 characters"),
      senderAccount: z.string().optional(),
      purpose: z.string().optional(),
      emiTenure: z.string().optional(),
      amount: z.number().positive().optional(),
    });
    const parsed = schema.parse(req.body);
    if (!parsed.orderNumber && !parsed.orderId) {
      return sendError(res, "orderNumber or orderId is required", 400);
    }
    const result = await paymentService.submitManualTransaction(parsed);
    return sendSuccess(
      res,
      result,
      "Transaction reference submitted and is awaiting admin verification.",
      201
    );
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/payments/status/:orderNumber
 * Public endpoint to fetch verified payment status
 */
router.get("/status/:orderNumber", async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber }, { invoiceCode: orderNumber }],
      },
      select: {
        orderNumber: true,
        invoiceCode: true,
        orderStatus: true,
        paymentStatus: true,
        paymentMethod: true,
        grandTotal: true,
        advanceAmount: true,
        dueAmount: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    return sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/payments/simulate-sandbox-checkout
 * Responsive Sandbox Checkout simulator for development, QA, and testing
 */
router.get("/simulate-sandbox-checkout", (req, res) => {
  const { sessionkey, orderNumber, amount, orderTotal, purpose, frontend } = req.query;
  const targetFrontend = frontend || process.env.CLIENT_ORIGIN || "http://localhost:5174";
  const isCodAdvance = purpose === "cod_advance";
  const payableNum = Number(amount || 0);
  const totalNum = Number(orderTotal || payableNum);
  const dueOnDelivery = Math.max(0, totalNum - payableNum);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kinglet Furniture - SSLCommerz Sandbox Payment Gateway</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f1f5f9;
      margin: 0;
      padding: 30px 15px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 480px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .header {
      background: #111827;
      color: #ffffff;
      padding: 24px;
      text-align: center;
    }
    .badge {
      display: inline-block;
      background: #ec2226;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .header h2 {
      margin: 4px 0;
      font-size: 20px;
    }
    .header p {
      margin: 0;
      font-size: 13px;
      color: #9ca3af;
    }
    .content {
      padding: 24px;
    }
    .bill-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .bill-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      margin-bottom: 8px;
      color: #475569;
    }
    .bill-row:last-child {
      margin-bottom: 0;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-weight: 800;
      color: #0f172a;
      font-size: 16px;
    }
    .pay-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 14px;
      margin-bottom: 12px;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-bkash {
      background: #e2136e;
      color: #ffffff;
    }
    .btn-bkash:hover { background: #c20f5c; }
    .btn-card {
      background: #1d4ed8;
      color: #ffffff;
    }
    .btn-card:hover { background: #1e40af; }
    .btn-fail {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .btn-fail:hover { background: #fecaca; }
    .btn-cancel {
      background: #f1f5f9;
      color: #475569;
    }
    .btn-cancel:hover { background: #e2e8f0; }
    .disclaimer {
      text-align: center;
      font-size: 12px;
      color: #64748b;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">Official Gateway Sandbox</span>
      <h2>Kinglet Furniture & Interior</h2>
      <p>SSLCommerz / MFS Secure Payment Aggregator</p>
    </div>
    <div class="content">
      <div class="bill-box">
        <div class="bill-row">
          <span>Order Reference:</span>
          <strong>${orderNumber || "KL-ORD-XXXX"}</strong>
        </div>
        <div class="bill-row">
          <span>Payment Mode:</span>
          <strong>${isCodAdvance ? `COD Security Advance (৳${payableNum.toLocaleString()})` : "Full Online Settlement"}</strong>
        </div>
        ${isCodAdvance ? `
        <div class="bill-row">
          <span>Total Order Amount:</span>
          <span>৳${totalNum.toLocaleString()}</span>
        </div>
        <div class="bill-row">
          <span>Remaining Due on Delivery:</span>
          <strong style="color: #0f172a;">৳${dueOnDelivery.toLocaleString()}</strong>
        </div>
        ` : ""}
        <div class="bill-row">
          <span>Payable Now (${isCodAdvance ? "Security Money" : "Full"}):</span>
          <span style="color: #ec2226;">৳${payableNum.toLocaleString()}</span>
        </div>
      </div>

      <p style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 12px;">Select bKash or Bank Card to Pay ৳${payableNum.toLocaleString()}:</p>

      <!-- Success Option 1: bKash Direct -->
      <form method="POST" action="/api/v1/payments/sslcommerz/success?frontend=${encodeURIComponent(targetFrontend)}">
        <input type="hidden" name="tran_id" value="${orderNumber}" />
        <input type="hidden" name="val_id" value="SIM-BKASH-${Date.now()}" />
        <input type="hidden" name="amount" value="${payableNum}" />
        <input type="hidden" name="card_type" value="BKASH-MFS" />
        <button type="submit" class="pay-btn btn-bkash">
          Pay ৳${payableNum.toLocaleString()} with bKash (Simulation)
        </button>
      </form>

      <!-- Success Option 2: Visa/Mastercard/Amex / Bank -->
      <form method="POST" action="/api/v1/payments/sslcommerz/success?frontend=${encodeURIComponent(targetFrontend)}">
        <input type="hidden" name="tran_id" value="${orderNumber}" />
        <input type="hidden" name="val_id" value="SIM-BANK-${Date.now()}" />
        <input type="hidden" name="amount" value="${payableNum}" />
        <input type="hidden" name="card_type" value="VISA-CREDIT" />
        <button type="submit" class="pay-btn btn-card">
          Pay ৳${payableNum.toLocaleString()} via Bank / Card (Simulation)
        </button>
      </form>

      <!-- Test Option 3: Fail Payment -->
      <form method="POST" action="/api/v1/payments/sslcommerz/fail?frontend=${encodeURIComponent(targetFrontend)}">
        <input type="hidden" name="tran_id" value="${orderNumber}" />
        <input type="hidden" name="error" value="Declined by card issuer / Insufficient funds" />
        <button type="submit" class="pay-btn btn-fail">
          Simulate Payment Failure
        </button>
      </form>

      <!-- Test Option 4: Cancel Payment -->
      <form method="POST" action="/api/v1/payments/sslcommerz/cancel?frontend=${encodeURIComponent(targetFrontend)}">
        <input type="hidden" name="tran_id" value="${orderNumber}" />
        <button type="submit" class="pay-btn btn-cancel">
          Cancel & Return to Kinglet
        </button>
      </form>

      <div class="disclaimer">
        🔒 SSL 256-bit Encrypted. Never transmits card numbers or CVVs to backend servers.
      </div>
    </div>
  </div>
</body>
</html>`;

  res.send(html);
});

/**
 * GET /api/v1/payments/:orderNumber
 * Alias to fetch payment details & transactions for an order
 */
router.get("/:orderNumber", async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber }, { invoiceCode: orderNumber }, { id: orderNumber }],
      },
      select: {
        id: true,
        orderNumber: true,
        invoiceCode: true,
        orderStatus: true,
        paymentStatus: true,
        paymentMethod: true,
        grandTotal: true,
        advanceAmount: true,
        dueAmount: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!order) return sendError(res, "Order not found", 404);
    return sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
});

export default router;
