import express from "express";
import { z } from "zod";
import prisma from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = express.Router();

/**
 * POST /api/v1/coupons/validate
 * Public / Checkout endpoint: Server-side validation with abuse prevention
 */
router.post("/validate", async (req, res, next) => {
  try {
    const schema = z.object({
      code: z.string().min(1, "Coupon code is required"),
      orderTotal: z.number().optional(),
      orderSubtotal: z.number().optional(),
      customerPhone: z.string().optional().nullable(),
      items: z.array(z.object({
        productId: z.string(),
        categoryId: z.string().optional().nullable(),
      })).optional(),
    }).transform((v) => ({
      ...v,
      orderTotal: Number(v.orderTotal ?? v.orderSubtotal ?? 0),
    }));

    const { code, orderTotal, customerPhone, items = [] } = schema.parse(req.body);
    const cleanCode = code.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.isActive) {
      return sendError(res, "Invalid or expired promotional coupon code.", 404);
    }

    const now = new Date();
    if (now < new Date(coupon.startDate)) {
      return sendError(res, `This coupon is not active yet. Begins on ${coupon.startDate.toLocaleDateString()}.`, 400);
    }

    if (now > new Date(coupon.endDate)) {
      return sendError(res, "This promo coupon has expired.", 400);
    }

    // Global Usage Limit Check
    if (coupon.usedCount >= coupon.usageLimit) {
      return sendError(res, "This promo code has reached its maximum global redemption limit.", 400);
    }

    // Minimum Order Threshold Check
    if (orderTotal < coupon.minOrderValue) {
      return sendError(
        res,
        `Minimum order amount / subtotal of ৳${coupon.minOrderValue.toLocaleString()} required for this coupon.`,
        400
      );
    }

    // Customer Abuse Prevention (Per-Customer Redemption Limit)
    if (customerPhone) {
      const cleanedPhone = customerPhone.replace(/[-\s+]/g, "");
      const formatted = cleanedPhone.startsWith("88") ? cleanedPhone.slice(2) : cleanedPhone;

      const userUsagesCount = await prisma.couponUsage.count({
        where: {
          couponId: coupon.id,
          customerPhone: formatted,
        },
      });

      if (userUsagesCount >= coupon.perCustomerLimit) {
        return sendError(
          res,
          `You have already redeemed this promo coupon (${coupon.perCustomerLimit} time limit per customer).`,
          400
        );
      }
    }

    // Product / Category Eligibility Check (if restricted)
    if (coupon.applicableCategoryIds && items.length > 0) {
      const allowedCategories = coupon.applicableCategoryIds.split(",").map((s) => s.trim());
      const hasEligibleItem = items.some((item) => item.categoryId && allowedCategories.includes(item.categoryId));
      if (!hasEligibleItem) {
        return sendError(res, "This coupon is only valid for selected furniture collections.", 400);
      }
    }

    // Rule: Coupons apply ONLY to Fixed Price products. Discounted products are NOT eligible.
    let eligibleOrderTotal = orderTotal;
    if (items && items.length > 0) {
      const productIds = items.map((i) => String(i.productId));
      const dbProducts = await prisma.product.findMany({
        where: {
          OR: [
            { id: { in: productIds } },
            { sku: { in: productIds } },
            { slug: { in: productIds } },
          ],
        },
      });

      if (dbProducts.length > 0) {
        const fixedProducts = dbProducts.filter((p) => !p.oldPrice || p.oldPrice <= p.basePrice);
        const discountedProducts = dbProducts.filter((p) => p.oldPrice && p.oldPrice > p.basePrice);

        // If all matched products are already discounted, reject coupon redemption
        if (fixedProducts.length === 0 && discountedProducts.length > 0) {
          return sendError(
            res,
            "কুপন শুধুমাত্র ফিক্সড প্রাইসের (Regular Price) পণ্যে প্রযোজ্য। ডিসকাউন্ট থাকা পণ্যে কুপন ব্যবহার করা যাবে না।",
            400
          );
        }

        // If mixed, calculate eligible total strictly from Fixed Price items
        if (fixedProducts.length > 0 && discountedProducts.length > 0) {
          let fixedSub = 0;
          for (const item of items) {
            const p = fixedProducts.find(
              (fp) => fp.id === item.productId || fp.sku === item.productId || fp.slug === item.productId
            );
            if (p) {
              const qty = Number(item.quantity || 1);
              fixedSub += p.basePrice * qty;
            }
          }
          if (fixedSub > 0) {
            eligibleOrderTotal = fixedSub;
          }
        }
      }
    }

    // Compute Discount strictly based on eligible fixed price subtotal
    let discount = 0;
    if (coupon.discountType === "PERCENT") {
      discount = Math.round((eligibleOrderTotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      // FLAT_BDT
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, eligibleOrderTotal);
    const newTotal = Math.max(0, orderTotal - discount);

    return sendSuccess(res, {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: discount,
      discountAmountBDT: discount,
      newTotal,
      message: `Coupon "${coupon.code}" applied! You saved ৳${discount.toLocaleString()}`,
    });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// ADMIN COUPON MANAGEMENT (PROTECTED RBAC)
// -------------------------------------------------------------

/**
 * GET /api/v1/admin/coupons
 */
router.get(
  "/admin/coupons",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN", "STORE_MANAGER"]),
  async (req, res, next) => {
    try {
      const coupons = await prisma.coupon.findMany({
        include: {
          _count: { select: { usages: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return sendSuccess(res, coupons);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/admin/coupons
 */
router.post(
  "/admin/coupons",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res, next) => {
    try {
      const schema = z.object({
        code: z.string().min(2, "Coupon code is required").transform((c) => c.toUpperCase()),
        discountType: z.enum(["PERCENT", "PERCENTAGE", "FLAT_BDT", "FIXED"]).transform((t) => (t === "PERCENTAGE" ? "PERCENT" : t === "FIXED" ? "FLAT_BDT" : t)),
        discountValue: z.number().positive("Discount value must be positive"),
        minOrderValue: z.number().optional(),
        minOrderAmountBDT: z.number().optional(),
        maxDiscount: z.number().optional().nullable(),
        maxDiscountBDT: z.number().optional().nullable(),
        startDate: z.string().or(z.date()),
        endDate: z.string().or(z.date()),
        usageLimit: z.number().int().min(1).default(100),
        perCustomerLimit: z.number().int().min(1).default(1),
        applicableCategoryIds: z.string().optional().nullable(),
        applicableProductIds: z.string().optional().nullable(),
        isActive: z.boolean().default(true),
      }).transform((val) => ({
        code: val.code,
        discountType: val.discountType,
        discountValue: val.discountValue,
        minOrderValue: val.minOrderValue ?? val.minOrderAmountBDT ?? 0,
        maxDiscount: val.maxDiscount ?? val.maxDiscountBDT ?? null,
        startDate: val.startDate,
        endDate: val.endDate,
        usageLimit: val.usageLimit,
        perCustomerLimit: val.perCustomerLimit,
        applicableCategoryIds: val.applicableCategoryIds,
        applicableProductIds: val.applicableProductIds,
        isActive: val.isActive,
      }));

      const data = schema.parse(req.body);

      const existing = await prisma.coupon.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        return sendError(res, `Coupon code "${data.code}" already exists.`, 409);
      }

      const created = await prisma.coupon.create({
        data: {
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
      });

      return sendSuccess(res, created, "Coupon created successfully!", 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/v1/admin/coupons/:id
 */
router.put(
  "/admin/coupons/:id",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const schema = z.object({
        code: z.string().min(2).optional().transform((c) => (c ? c.toUpperCase() : undefined)),
        discountType: z.enum(["PERCENT", "FLAT_BDT"]).optional(),
        discountValue: z.number().positive().optional(),
        minOrderValue: z.number().min(0).optional(),
        maxDiscount: z.number().optional().nullable(),
        startDate: z.string().or(z.date()).optional(),
        endDate: z.string().or(z.date()).optional(),
        usageLimit: z.number().int().min(1).optional(),
        perCustomerLimit: z.number().int().min(1).optional(),
        applicableCategoryIds: z.string().optional().nullable(),
        applicableProductIds: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      });

      const data = schema.parse(req.body);

      const updated = await prisma.coupon.update({
        where: { id },
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
      });

      return sendSuccess(res, updated, "Coupon updated successfully!");
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/v1/admin/coupons/:id
 */
router.delete(
  "/admin/coupons/:id",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      await prisma.coupon.delete({ where: { id } });
      return sendSuccess(res, null, "Coupon deleted successfully");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
