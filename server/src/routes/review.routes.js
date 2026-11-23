import express from "express";
import { z } from "zod";
import prisma from "../db/prisma.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = express.Router();

const reviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  authorName: z.string().optional(),
  customerName: z.string().optional(),
  authorLocation: z.string().default("Dhaka"),
  customerPhone: z.string().optional().nullable(),
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating cannot exceed 5"),
  comment: z.string().min(5, "Review comment must be at least 5 characters").max(1000, "Review comment too long"),
  title: z.string().optional().nullable(),
}).transform((val) => ({
  productId: val.productId,
  authorName: (val.authorName || val.customerName || "Valued Customer").trim(),
  authorLocation: val.authorLocation,
  customerPhone: val.customerPhone,
  rating: val.rating,
  comment: val.comment,
  title: val.title,
}));

/**
 * POST /api/v1/reviews
 * Customer review submission with verified purchase detection & spam prevention
 */
router.post("/", optionalAuth, async (req, res, next) => {
  try {
    const data = reviewSchema.parse(req.body);

    // Flexible Product Lookup (ID, SKU, or slug)
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: data.productId },
          { sku: data.productId },
          { slug: data.productId },
          { sku: { endsWith: `-${data.productId}` } },
        ],
      },
    });

    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    const resolvedProductId = product.id;
    const phone = data.customerPhone || req.user?.phone;
    const cleanPhone = phone ? phone.replace(/[-\s+]/g, "").replace(/^88/, "") : null;

    // 1. Spam Prevention: Prevent duplicate reviews for the same product within 24h
    if (cleanPhone || req.user?.id) {
      const existingRecent = await prisma.productReview.findFirst({
        where: {
          productId: resolvedProductId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          OR: [
            ...(req.user?.id ? [{ userId: req.user.id }] : []),
            ...(cleanPhone ? [{ customerPhone: cleanPhone }] : []),
          ],
        },
      });

      if (existingRecent) {
        return sendError(res, "You have already submitted a review for this furniture model recently.", 429);
      }
    }

    // 2. Real Verified Purchase Check based on Database Order History
    let isVerifiedBuyer = false;
    if (cleanPhone || req.user?.id) {
      const matchingOrder = await prisma.order.findFirst({
        where: {
          OR: [
            ...(cleanPhone ? [{ customerPhone: cleanPhone }] : []),
            ...(req.user?.id ? [{ customer: { userId: req.user.id } }] : []),
          ],
          items: {
            some: { productId: resolvedProductId },
          },
          orderStatus: {
            in: ["CONFIRMED", "PROCESSING", "READY_FOR_DISPATCH", "SHIPPED", "DELIVERED"],
          },
        },
      });

      if (matchingOrder) {
        isVerifiedBuyer = true;
      }
    }

    const review = await prisma.productReview.create({
      data: {
        productId: resolvedProductId,
        userId: req.user?.id || null,
        authorName: data.authorName,
        authorLocation: data.authorLocation,
        customerPhone: cleanPhone,
        rating: data.rating,
        comment: data.comment,
        isVerifiedBuyer,
        isApproved: true, // Approved by default unless flagged
      },
    });

    // Recalculate average product rating and review count
    const agg = await prisma.productReview.aggregate({
      where: { productId: resolvedProductId, isApproved: true },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.product.update({
      where: { id: resolvedProductId },
      data: {
        rating: Math.round((agg._avg.rating || 5) * 10) / 10,
        reviewsCount: agg._count.id,
      },
    });

    return sendSuccess(
      res,
      review,
      isVerifiedBuyer
        ? "Thank you! Your verified buyer review has been published."
        : "Thank you for your feedback! Your review has been published.",
      201
    );
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/reviews/product/:productId
 * Public endpoint: Returns approved reviews and star breakdown
 */
router.get("/product/:productId", async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: productId },
          { sku: productId },
          { slug: productId },
          { sku: { endsWith: `-${productId}` } },
        ],
      },
      select: { id: true, name: true, rating: true, reviewsCount: true },
    });

    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    const reviews = await prisma.productReview.findMany({
      where: { productId: product.id, isApproved: true },
      orderBy: [
        { isVerifiedBuyer: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Compute star breakdown
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, r.rating));
      breakdown[star] = (breakdown[star] || 0) + 1;
    });

    return sendSuccess(res, {
      product: {
        id: product.id,
        name: product.name,
        averageRating: product.rating,
        totalReviews: reviews.length,
      },
      breakdown,
      reviews: reviews.map((r) => ({
        id: r.id,
        author: r.authorName,
        location: r.authorLocation,
        rating: r.rating,
        comment: r.comment,
        isVerifiedBuyer: r.isVerifiedBuyer,
        date: r.createdAt.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// ADMIN REVIEW MODERATION (PROTECTED RBAC)
// -------------------------------------------------------------

/**
 * GET /api/v1/admin/reviews
 */
router.get(
  "/admin/reviews",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN", "STORE_MANAGER"]),
  async (req, res, next) => {
    try {
      const { approved, search } = req.query;

      const whereClause = {
        ...(approved !== undefined ? { isApproved: approved === "true" } : {}),
        ...(search
          ? {
              OR: [
                { authorName: { contains: String(search) } },
                { comment: { contains: String(search) } },
                { product: { name: { contains: String(search) } } },
              ],
            }
          : {}),
      };

      const reviews = await prisma.productReview.findMany({
        where: whereClause,
        include: {
          product: {
            select: { id: true, name: true, sku: true, primaryMaterial: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return sendSuccess(res, reviews);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/v1/admin/reviews/:id/approve
 */
router.put(
  ["/admin/reviews/:id/approve", "/:id/approve"],
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await prisma.productReview.update({
        where: { id },
        data: { isApproved: true },
      });

      // Recalculate
      const agg = await prisma.productReview.aggregate({
        where: { productId: updated.productId, isApproved: true },
        _avg: { rating: true },
        _count: { id: true },
      });

      await prisma.product.update({
        where: { id: updated.productId },
        data: {
          rating: Math.round((agg._avg.rating || 5) * 10) / 10,
          reviewsCount: agg._count.id,
        },
      });

      return sendSuccess(res, updated, "Review approved successfully!");
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/v1/admin/reviews/:id/status
 */
router.put(
  ["/admin/reviews/:id/status", "/:id/status"],
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isApproved } = req.body;

      if (typeof isApproved !== "boolean") {
        return sendError(res, "Field 'isApproved' must be a boolean", 400);
      }

      const updated = await prisma.productReview.update({
        where: { id },
        data: { isApproved },
      });

      // Recalculate product rating
      const agg = await prisma.productReview.aggregate({
        where: { productId: updated.productId, isApproved: true },
        _avg: { rating: true },
        _count: { id: true },
      });

      await prisma.product.update({
        where: { id: updated.productId },
        data: {
          rating: Math.round((agg._avg.rating || 5) * 10) / 10,
          reviewsCount: agg._count.id,
        },
      });

      return sendSuccess(res, updated, `Review ${isApproved ? "approved" : "rejected"} successfully!`);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/v1/admin/reviews/:id
 */
router.delete(
  "/admin/reviews/:id",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const review = await prisma.productReview.findUnique({ where: { id } });
      if (!review) return sendError(res, "Review not found", 404);

      await prisma.productReview.delete({ where: { id } });

      // Recalculate
      const agg = await prisma.productReview.aggregate({
        where: { productId: review.productId, isApproved: true },
        _avg: { rating: true },
        _count: { id: true },
      });

      await prisma.product.update({
        where: { id: review.productId },
        data: {
          rating: Math.round((agg._avg.rating || 5) * 10) / 10,
          reviewsCount: agg._count.id,
        },
      });

      return sendSuccess(res, null, "Review deleted successfully");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
