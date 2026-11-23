import express from "express";
import { z } from "zod";
import prisma from "../db/prisma.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { orderInventoryService, STATUS_STEP_MAP } from "../services/orderInventory.service.js";
import { settingsService } from "../services/settings.service.js";

const router = express.Router();

const STEPS = [
  { id: 1, name: "Order Placed", desc: "Your order has been placed & recorded in our system" },
  { id: 2, name: "Order Confirmed", desc: "Order & advance payment verified and confirmed" },
  {
    id: 3,
    name: "Factory Received the Order",
    desc: "Factory has received your order — product preparation takes 3–20 days",
  },
  { id: 4, name: "Order is Ready", desc: "Product is crafted, quality checked & ready for delivery" },
  { id: 5, name: "Order is Out for Delivery", desc: "Your order is out for delivery to your address" },
  { id: 6, name: "Order Delivered to Customer's Address", desc: "Delivered & handed over at your delivery address" },
];

const STATUS_LABELS = {
  PENDING: "Order Placed",
  AWAITING_PAYMENT: "Awaiting Customer Payment",
  PAYMENT_VERIFICATION: "Payment Submitted • Awaiting Verification",
  CONFIRMED: "Order Confirmed",
  PROCESSING: "Factory Received the Order (3–20 Days Crafting)",
  PREPARING: "Factory Received the Order (Crafting in Progress)",
  TIMBER_SEASONING: "Factory Received the Order",
  JOINERY: "Factory Received the Order",
  POLISHING: "Factory Received the Order",
  PU_POLISHING: "Factory Received the Order",
  QUALITY_AUDIT: "Order is Ready",
  READY_FOR_DISPATCH: "Order is Ready",
  DISPATCHED: "Order is Out for Delivery",
  SHIPPED: "Order is Out for Delivery",
  OUT_FOR_DELIVERY: "Order is Out for Delivery",
  DELIVERED: "Delivered to Customer's Address",
  CANCELLED: "Order Cancelled",
  ON_HOLD: "Order On Hold",
  FAILED: "Order Failed / Rejected",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

function normPhoneTail(phone) {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

function buildTrackingPayload(order, codAdvanceConfigBdt, { unmaskPhone = false } = {}) {
  const isCancelled = order.orderStatus === "CANCELLED";
  const isFailed = order.orderStatus === "FAILED";
  const isOnHold = order.orderStatus === "ON_HOLD";
  const isStopped = isCancelled || isFailed;
  const latestHistory = order.statusHistory?.[order.statusHistory.length - 1];
  const mappedStep = STATUS_STEP_MAP[order.orderStatus];
  const rawStep =
    mappedStep !== undefined
      ? mappedStep
      : Number(latestHistory?.stepIndex) || 1;
  const currentStepIndex = isStopped ? 0 : Math.min(STEPS.length, Math.max(1, rawStep));

  const successfulPaidSum = (order.payments || [])
    .filter((p) => p.status === "SUCCESS" || p.status === "PAID" || p.status === "CONFIRMED")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const advancePaid =
    Number(order.advanceAmount || 0) > 0
      ? Number(order.advanceAmount)
      : order.paymentStatus === "PAID"
      ? Number(order.grandTotal)
      : successfulPaidSum > 0
      ? successfulPaidSum
      : order.paymentStatus === "PARTIAL" && order.paymentMethod === "COD"
      ? Math.min(codAdvanceConfigBdt, Number(order.grandTotal))
      : 0;
  const codAdvanceRequired =
    order.paymentMethod === "COD" ? Math.min(codAdvanceConfigBdt, Number(order.grandTotal)) : 0;
  const remainingDue =
    order.dueAmount !== null && order.dueAmount !== undefined && Number(order.advanceAmount || 0) > 0
      ? Number(order.dueAmount)
      : order.paymentStatus === "PAID"
      ? 0
      : Math.max(0, Number(order.grandTotal) - advancePaid);

  const awaitingVerificationTx = (order.payments || []).find(
    (p) => p.status === "AWAITING_VERIFICATION"
  );

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    invoiceCode: order.invoiceCode,
    customerName: order.customerName,
    customerPhone: unmaskPhone
      ? order.customerPhone
      : order.customerPhone.replace(/(\d{3})\d{5}(\d{3})/, "$1*****$2"),
    customerEmail: unmaskPhone ? (order.customerEmail || null) : undefined,
    shippingAddress: unmaskPhone
      ? (order.shippingAddress || "Showroom Pickup / Standard Delivery")
      : (order.deliveryLocation || (order.thana ? `${order.thana}, ${order.district}` : "Showroom Pickup / Standard Delivery")),
    division: order.division,
    district: order.district,
    thana: order.thana,
    deliveryLocation: order.deliveryLocation || `${order.thana}, ${order.district}`,
    fullAddress: unmaskPhone
      ? `${order.shippingAddress || ""}${order.thana ? `, ${order.thana}` : ""}${order.district ? `, ${order.district}` : ""}${order.division ? `, ${order.division}` : ""}`.trim().replace(/^,\s*/, "")
      : `${order.thana ? `${order.thana}, ` : ""}${order.district || ""}${order.division ? `, ${order.division}` : ""}`.trim().replace(/^,\s*/, ""),
    date: order.createdAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    orderStatus: order.orderStatus,
    statusLabel: STATUS_LABELS[order.orderStatus] || order.orderStatus.replace(/_/g, " "),
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    discountAmount: order.discountAmount,
    grandTotal: order.grandTotal,
    advancePaid,
    advanceAmount: advancePaid,
    codAdvanceRequired,
    remainingDue,
    dueAmount: remainingDue,
    courierName: order.courierName || null,
    trackingNumber: order.trackingNumber || null,
    trackingUrl: order.trackingUrl || null,
    estimatedDeliveryDate: order.estimatedDeliveryDate || null,
    deliveredAt: order.deliveredAt || null,
    notes: order.notes || null,
    currentStepIndex,
    isCancelled,
    isFailed,
    isOnHold,
    holdReason: order.holdReason || null,
    rejectedReason: order.rejectedReason || null,
    cancellationReason: order.cancellationReason,
    cancellationDate: order.cancellationDate,
    awaitingVerificationTx: awaitingVerificationTx
      ? {
          id: awaitingVerificationTx.id,
          channel: awaitingVerificationTx.paymentChannel || awaitingVerificationTx.gateway,
          manualTrxId: awaitingVerificationTx.manualTrxId,
          amount: awaitingVerificationTx.amount,
          createdAt: awaitingVerificationTx.createdAt,
        }
      : null,
    payments: (order.payments || []).map((p) => ({
      id: p.id,
      gateway: p.gateway,
      paymentChannel: p.paymentChannel,
      purpose: p.purpose,
      manualTrxId: p.manualTrxId,
      transactionRef: p.transactionRef,
      amount: p.amount,
      status: p.status,
      rejectionReason: p.rejectionReason,
      verifiedAt: p.verifiedAt,
      createdAt: p.createdAt,
    })),
    statusHistory: (order.statusHistory || []).map((h) => ({
      id: h.id,
      previousStatus: h.previousStatus,
      status: h.status,
      stepIndex: h.stepIndex,
      comment: h.comment,
      createdAt: h.createdAt,
    })),
    steps: STEPS.map((s) => {
      const matchingLog = [...(order.statusHistory || [])]
        .reverse()
        .find((h) => (STATUS_STEP_MAP[h.status] ?? Number(h.stepIndex)) === s.id);
      const effectiveTimestamp = matchingLog?.createdAt || (s.id === 1 ? order.createdAt : null);
      return {
        ...s,
        title: s.name,
        completed: isStopped ? false : s.id < currentStepIndex || (s.id === STEPS.length && order.orderStatus === "DELIVERED"),
        current: isStopped ? false : s.id === currentStepIndex && order.orderStatus !== "DELIVERED",
        date: effectiveTimestamp
          ? new Date(effectiveTimestamp).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : isCancelled
          ? "Cancelled"
          : isFailed
          ? "Failed"
          : s.id <= currentStepIndex
          ? "Completed"
          : "Pending",
        note: matchingLog?.comment || null,
      };
    }),
    items: (order.items || []).map((i) => {
      let fallbackImg = i.productImage || "/images/furniture-placeholder.svg";
      if (!i.productImage && Array.isArray(i.product?.images) && i.product.images.length > 0) {
        const primary = i.product.images.find((img) => img.isHero) || i.product.images[0];
        fallbackImg = primary.thumbnailUrl || primary.url || fallbackImg;
      }

      return {
        id: i.id,
        productId: i.productId,
        name: i.productName,
        sku: i.productSku,
        woodType: i.woodType,
        dimensions: i.dimensions,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.totalPrice,
        image: fallbackImg,
        slug: i.product?.slug || null,
      };
    }),
  };
}

const checkoutSchema = z.object({
  idempotencyKey: z.string().optional().nullable(),
  customerName: z.string().min(2, "Customer name is required"),
  customerPhone: z.string().regex(/^01[3-9]\d{8}$/, "Valid 11-digit Bangladeshi mobile number required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  shippingAddress: z.string().min(5, "Full street address required"),
  division: z.string().default("Dhaka"),
  district: z.string().default("Dhaka City"),
  thana: z.string().default("Mirpur"),
  deliveryLocation: z.string().optional().nullable(),
  paymentMethod: z.enum(["COD", "BKASH", "NAGAD", "CARD_POS", "BANK_EMI"]),
  shippingCode: z.string().default("based_on_location"),
  couponCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  manualTransaction: z
    .object({
      channel: z.string().optional(),
      trxId: z.string().optional(),
      senderAccount: z.string().optional(),
      purpose: z.string().optional(),
      emiTenure: z.string().optional(),
    })
    .optional()
    .nullable(),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional().nullable(),
      quantity: z.number().int().min(1),
    })
  ).min(1, "At least one item is required in order"),
});

/**
 * GET /api/v1/orders/shipping-methods
 * Public storefront endpoint to get active shipping methods for checkout & delivery
 */
router.get("/shipping-methods", async (req, res, next) => {
  try {
    const methods = await prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: { baseRate: "asc" },
    });
    return sendSuccess(res, methods);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/orders
 * Atomic, ACID-compliant checkout with server calculations, stock deduction, and idempotency
 */
router.post("/", optionalAuth, async (req, res, next) => {
  try {
    const data = checkoutSchema.parse(req.body);
    const headerIdempotencyKey = req.headers["idempotency-key"];
    const idempotencyKey = data.idempotencyKey || headerIdempotencyKey;

    // Customer Profile association (Registered User or Guest)
    let customerId = null;
    if (req.user) {
      const cust = await prisma.customer.findUnique({ where: { userId: req.user.id } });
      if (cust) customerId = cust.id;
    } else {
      let guestCust = await prisma.customer.findUnique({
        where: { phone: data.customerPhone },
      });
      if (!guestCust) {
        guestCust = await prisma.customer.create({
          data: {
            fullName: data.customerName,
            phone: data.customerPhone,
            email: data.customerEmail || null,
          },
        });
      }
      customerId = guestCust.id;
    }

    const { order, isDuplicate } = await orderInventoryService.createOrder({
      ...data,
      idempotencyKey,
      customerId,
    });

    return sendSuccess(
      res,
      order,
      isDuplicate ? "Order already processed (idempotent submission)." : "Order placed successfully!",
      isDuplicate ? 200 : 201
    );
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/orders/track/:code
 * Public 7-step timeline tracking with flexible query (Order Number, Invoice Code, Phone)
 */
router.get("/track/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const cleanCode = (code || "").trim();

    if (!cleanCode) {
      return sendError(res, "Please provide an order number, tracking code, or registered phone number.", 400);
    }

    const phoneDigits = cleanCode.replace(/[^0-9]/g, "");
    const orConditions = [
      { orderNumber: cleanCode },
      { invoiceCode: cleanCode },
      { customerPhone: cleanCode },
    ];

    if (phoneDigits.length >= 10) {
      const normalizedBD = phoneDigits.startsWith("880") ? phoneDigits.slice(2) : phoneDigits.startsWith("0") ? phoneDigits : "0" + phoneDigits;
      orConditions.push({ customerPhone: normalizedBD });
      orConditions.push({ customerPhone: { contains: phoneDigits.slice(-10) } });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: orConditions,
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                slug: true,
                sku: true,
                images: {
                  select: {
                    url: true,
                    thumbnailUrl: true,
                    isHero: true,
                  },
                },
              },
            },
          },
        },
        statusHistory: { orderBy: { createdAt: "asc" } },
        payments: true,
      },
    });

    if (!order) {
      return sendError(res, "No order found matching the provided tracking number, invoice code, or phone number.", 404);
    }

    // Always serve fresh real-time milestone updates
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    const codAdvanceConfigBdt = await settingsService.getCodSecurityAdvanceBdt();
    return sendSuccess(res, buildTrackingPayload(order, codAdvanceConfigBdt));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/orders/guest-lookup
 * Secure guest order lookup requiring BOTH exact Order Number/Invoice AND verified phone number
 */
router.post("/guest-lookup", async (req, res, next) => {
  try {
    const { orderNumber, phone } = req.body || {};
    const cleanNum = String(orderNumber || "").trim();
    const cleanPhoneTail = normPhoneTail(phone);

    if (!cleanNum || cleanPhoneTail.length < 8) {
      return sendError(res, "Both Order Number and verified Mobile Number are required.", 400);
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: cleanNum }, { invoiceCode: cleanNum }],
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                slug: true,
                images: { select: { url: true, thumbnailUrl: true, isHero: true } },
              },
            },
          },
        },
        statusHistory: { orderBy: { createdAt: "asc" } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!order || normPhoneTail(order.customerPhone) !== cleanPhoneTail) {
      return sendError(res, "No order matched that Order ID and Mobile Number combination.", 404);
    }

    const codAdvanceConfigBdt = await settingsService.getCodSecurityAdvanceBdt();
    return sendSuccess(res, buildTrackingPayload(order, codAdvanceConfigBdt, { unmaskPhone: true }));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/orders/my-orders
 * Customer Order History with search, status, date filter, and pagination
 */
router.get("/my-orders", requireAuth, async (req, res, next) => {
  try {
    const { search, status, dateFrom, dateTo, page, limit = 15 } = req.query;
    const phoneTail = normPhoneTail(req.user.phone);
    const where = {
      OR: [
        { customer: { userId: req.user.id } },
        ...(phoneTail ? [{ customerPhone: { contains: phoneTail } }] : [{ customerPhone: req.user.phone }]),
      ],
    };

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { orderNumber: { contains: q } },
            { invoiceCode: { contains: q } },
          ],
        },
      ];
    }

    if (status && status !== "ALL") {
      where.AND = [...(where.AND || []), { orderStatus: String(status) }];
    }

    if (dateFrom || dateTo) {
      const dateCond = {};
      if (dateFrom) dateCond.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        dateCond.lte = end;
      }
      where.AND = [...(where.AND || []), { createdAt: dateCond }];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const takeNum = Math.min(50, Math.max(1, Number(limit) || 15));
    const skipNum = (pageNum - 1) * takeNum;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...(page ? { skip: skipNum, take: takeNum } : {}),
        include: {
          items: {
            include: {
              product: {
                select: {
                  slug: true,
                  images: { select: { url: true, thumbnailUrl: true, isHero: true } },
                },
              },
            },
          },
          statusHistory: { orderBy: { createdAt: "asc" } },
          payments: { orderBy: { createdAt: "desc" } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const formatted = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      invoiceCode: o.invoiceCode,
      createdAt: o.createdAt,
      date: o.createdAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      grandTotal: o.grandTotal,
      advanceAmount: o.advanceAmount,
      dueAmount: o.dueAmount,
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      courierName: o.courierName,
      trackingNumber: o.trackingNumber,
      estimatedDeliveryDate: o.estimatedDeliveryDate,
      deliveredAt: o.deliveredAt,
      deliveryAddress: `${o.shippingAddress}, ${o.thana}, ${o.district}`,
      itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
      items: o.items.map((i) => {
        const heroImg = i.product?.images?.find((img) => img.isHero) || i.product?.images?.[0];
        return {
          id: i.id,
          name: i.productName,
          sku: i.productSku,
          quantity: i.quantity,
          price: i.unitPrice,
          total: i.totalPrice,
          image: i.productImage || heroImg?.thumbnailUrl || heroImg?.url || "/images/furniture-placeholder.svg",
          slug: i.product?.slug || null,
        };
      }),
      statusHistory: o.statusHistory,
    }));

    if (page) {
      return res.status(200).json({
        success: true,
        message: "Success",
        data: formatted,
        pagination: {
          total,
          page: pageNum,
          limit: takeNum,
          totalPages: Math.ceil(total / takeNum) || 1,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/orders/:orderId/tracking
 * Real-time tracking by Order ID or Order Number
 */
router.get("/:orderId/tracking", optionalAuth, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }, { invoiceCode: orderId }],
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                slug: true,
                images: { select: { url: true, thumbnailUrl: true, isHero: true } },
              },
            },
          },
        },
        statusHistory: { orderBy: { createdAt: "asc" } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!order) return sendError(res, "Order not found", 404);
    const codAdvanceConfigBdt = await settingsService.getCodSecurityAdvanceBdt();
    return sendSuccess(res, buildTrackingPayload(order, codAdvanceConfigBdt));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/orders/:orderId/cancel
 * Customer self-cancellation for eligible early-stage orders
 */
router.post("/:orderId/cancel", optionalAuth, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason, phone } = req.body || {};

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
    });
    if (!order) return sendError(res, "Order not found", 404);

    let customerId = null;
    if (req.user) {
      const cust = await prisma.customer.findUnique({ where: { userId: req.user.id } });
      if (cust) customerId = cust.id;
    }

    const updated = await orderInventoryService.cancelOrderByCustomer({
      orderId: order.id,
      customerId,
      phone: phone || req.user?.phone,
      reason,
    });

    return sendSuccess(res, updated, "Order cancelled successfully.");
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/orders/:orderId
 * Authorized order detail retrieval (requires owning customer auth, admin role, or verified ?phone=)
 */
router.get("/:orderId", optionalAuth, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const queryPhone = req.query.phone;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }, { invoiceCode: orderId }],
      },
      include: {
        customer: { select: { userId: true } },
        items: {
          include: {
            product: {
              select: {
                slug: true,
                images: { select: { url: true, thumbnailUrl: true, isHero: true } },
              },
            },
          },
        },
        statusHistory: { orderBy: { createdAt: "asc" } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!order) return sendError(res, "Order not found", 404);

    const isAdmin = req.user && ["SUPER_ADMIN", "STORE_MANAGER"].includes(req.user.role);
    const isOwnerByUser = req.user && order.customer?.userId === req.user.id;
    const isOwnerByUserPhone = req.user && normPhoneTail(req.user.phone) && normPhoneTail(req.user.phone) === normPhoneTail(order.customerPhone);
    const isOwnerByQueryPhone = queryPhone && normPhoneTail(queryPhone) && normPhoneTail(queryPhone) === normPhoneTail(order.customerPhone);

    if (!isAdmin && !isOwnerByUser && !isOwnerByUserPhone && !isOwnerByQueryPhone) {
      return sendError(
        res,
        req.user ? "Forbidden: You are not authorized to access this order." : "Authentication or phone verification required to view order details.",
        req.user ? 403 : 401
      );
    }

    const codAdvanceConfigBdt = await settingsService.getCodSecurityAdvanceBdt();
    return sendSuccess(res, buildTrackingPayload(order, codAdvanceConfigBdt, { unmaskPhone: true }));
  } catch (err) {
    next(err);
  }
});

export default router;

