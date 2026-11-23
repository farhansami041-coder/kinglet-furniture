import express from "express";
import { z } from "zod";
import { courierService } from "../services/courier.service.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = express.Router();

const dispatchSchema = z.object({
  orderId: z.string().uuid("Valid Order ID required"),
  codAmount: z.number().nonnegative().optional(),
  note: z.string().max(250).optional(),
});

/**
 * POST /api/v1/admin/courier/dispatch
 * 1-Click Dispatch Order via Steadfast Courier
 */
router.post(
  "/admin/courier/dispatch",
  requireAuth,
  requireRole(["SUPER_ADMIN", "STORE_MANAGER", "SALES_REP"]),
  async (req, res, next) => {
    try {
      const data = dispatchSchema.parse(req.body);
      const result = await courierService.createConsignment(data);
      return sendSuccess(res, result, "Consignment successfully created with courier.", 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/courier/balance
 * Check merchant courier balance
 */
router.get(
  "/admin/courier/balance",
  requireAuth,
  requireRole(["SUPER_ADMIN", "STORE_MANAGER"]),
  async (req, res, next) => {
    try {
      const balance = await courierService.getBalance();
      return sendSuccess(res, balance, "Courier balance retrieved.");
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/courier/track/:trackingCode
 * Public tracking for customer and order timeline
 */
router.get("/track/:trackingCode", async (req, res, next) => {
  try {
    const { trackingCode } = req.params;
    const status = await courierService.getTrackingStatus(trackingCode);
    return sendSuccess(res, status, "Tracking status fetched.");
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/courier/webhook/steadfast
 * Inbound automated webhook from Courier Gateway
 */
router.post("/webhook/steadfast", async (req, res, next) => {
  try {
    const result = await courierService.handleWebhook(req.body);
    return res.status(200).json({ status: 200, ...result });
  } catch (err) {
    console.error("[CourierWebhook:Error]", err.message);
    return res.status(500).json({ status: 500, error: err.message });
  }
});

export default router;

