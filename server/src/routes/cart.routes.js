import express from "express";
import { z } from "zod";
import prisma from "../db/prisma.js";
import { optionalAuth } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = express.Router();

// Helper to get or create cart
async function getOrCreateCart(req) {
  const sessionId = req.headers["x-session-id"] || req.query.sessionId || "guest-" + Date.now();
  let customerId = null;

  if (req.user) {
    const customer = await prisma.customer.findUnique({ where: { userId: req.user.id } });
    if (customer) customerId = customer.id;
  }

  let cart = await prisma.cart.findFirst({
    where: {
      OR: [
        ...(customerId ? [{ customerId }] : []),
        { sessionId },
      ],
    },
    include: {
      items: {
        include: {
          product: {
            include: { images: { take: 1 }, inventory: true },
          },
          variant: true,
        },
      },
    },
  });

  if (!cart) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 day cart expiration

    cart = await prisma.cart.create({
      data: {
        customerId,
        sessionId,
        expiresAt,
      },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1 }, inventory: true } },
            variant: true,
          },
        },
      },
    });
  }

  return { cart, sessionId };
}

/**
 * GET /api/v1/cart
 */
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { cart, sessionId } = await getOrCreateCart(req);

    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      slug: item.product.slug,
      woodType: item.product.primaryMaterial,
      dimensions: item.variant?.variantName || item.product.dimensions,
      priceBDT: item.variant?.finalPrice || item.product.basePrice,
      quantity: item.quantity,
      image: item.product.images[0]?.url || "/images/furniture-placeholder.svg",
      inStock: (item.product.inventory?.quantityAvailable ?? 1) >= item.quantity,
      availableStock: item.product.inventory?.quantityAvailable ?? 0,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.priceBDT * item.quantity, 0);

    return sendSuccess(res, {
      cartId: cart.id,
      sessionId,
      items,
      subtotal,
      totalQuantity: items.reduce((acc, i) => acc + i.quantity, 0),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/cart/items
 */
router.post("/items", optionalAuth, async (req, res, next) => {
  try {
    const itemSchema = z.object({
      productId: z.string().min(1, "Product ID is required"),
      variantId: z.string().optional().nullable(),
      quantity: z.number().int().min(1).default(1),
    });

    const { productId, variantId, quantity } = itemSchema.parse(req.body);
    const { cart } = await getOrCreateCart(req);

    // Verify product & inventory (by ID, SKU, or slug)
    const product = await prisma.product.findFirst({
      where: {
        isActive: true,
        OR: [
          { id: productId },
          { sku: productId },
          { slug: productId },
          { sku: { endsWith: `-${productId}` } },
        ],
      },
      include: { inventory: true },
    });

    if (!product) {
      return sendError(res, "Product not available", 404);
    }

    const availableStock = product.inventory?.quantityAvailable ?? 10;
    if (availableStock < quantity) {
      return sendError(res, `Only ${availableStock} unit(s) available in stock.`, 400);
    }

    const unitPrice = product.basePrice;
    const resolvedProductId = product.id;

    // Check if item already exists in cart
    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: resolvedProductId,
        variantId: variantId || null,
      },
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (availableStock < newQty) {
        return sendError(res, `Maximum stock limit (${availableStock}) reached for this item.`, 400);
      }
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: resolvedProductId,
          variantId: variantId || null,
          quantity,
          unitPrice,
        },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1 }, inventory: true } },
            variant: true,
          },
        },
      },
    });

    const items = (updatedCart?.items || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      slug: item.product.slug,
      sku: item.product.sku,
      image: item.product.images[0]?.url || "/images/furniture-placeholder.svg",
      priceBDT: item.unitPrice,
      quantity: item.quantity,
      totalPrice: item.unitPrice * item.quantity,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.priceBDT * item.quantity, 0);

    return sendSuccess(
      res,
      {
        cartId: cart.id,
        items,
        subtotal,
        totalQuantity: items.reduce((acc, i) => acc + i.quantity, 0),
      },
      "Item added to cart successfully!"
    );
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/cart/items/:id
 * Update quantity of a cart item with stock validation
 */
router.put("/items/:id", optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateSchema = z.object({
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
    });

    const { quantity } = updateSchema.parse(req.body);

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        product: { include: { inventory: true } },
      },
    });

    if (!cartItem) {
      return sendError(res, "Cart item not found", 404);
    }

    const availableStock = cartItem.product?.inventory?.quantityAvailable ?? 10;
    if (quantity > availableStock) {
      return sendError(
        res,
        `Cannot set quantity to ${quantity}. Only ${availableStock} unit(s) available in stock.`,
        400
      );
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cartItem.cartId },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1 }, inventory: true } },
            variant: true,
          },
        },
      },
    });

    const items = (updatedCart?.items || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      slug: item.product.slug,
      sku: item.product.sku,
      image: item.product.images[0]?.url || "/images/furniture-placeholder.svg",
      priceBDT: item.unitPrice,
      quantity: item.quantity,
      totalPrice: item.unitPrice * item.quantity,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.priceBDT * item.quantity, 0);

    return sendSuccess(
      res,
      {
        ...updated,
        items,
        subtotal,
        totalQuantity: items.reduce((acc, i) => acc + i.quantity, 0),
      },
      "Cart item quantity updated successfully"
    );
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/cart/revalidate
 * Validate product availability, pricing and current stock before checkout
 */
router.post("/revalidate", optionalAuth, async (req, res, next) => {
  try {
    let items = req.body?.items;
    if (!items || !Array.isArray(items) || items.length === 0) {
      const { cart } = await getOrCreateCart(req);
      items = cart.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      }));
    }

    const productIdentifiers = items.map((i) => String(i.productId));
    const dbProducts = await prisma.product.findMany({
      where: {
        OR: [
          { id: { in: productIdentifiers } },
          { sku: { in: productIdentifiers } },
          { slug: { in: productIdentifiers } },
          ...productIdentifiers.map((id) => ({ sku: { endsWith: `-${id}` } })),
        ],
      },
      include: { inventory: true, variants: true, images: { take: 1 } },
    });

    const validationResults = items.map((item) => {
      const prod = dbProducts.find(
        (p) =>
          p.id === String(item.productId) ||
          p.sku === String(item.productId) ||
          p.slug === String(item.productId) ||
          p.sku.endsWith(`-${item.productId}`)
      );
      if (!prod || !prod.isActive) {
        return {
          productId: item.productId,
          valid: false,
          reason: "Product is no longer available or has been discontinued.",
        };
      }

      let currentPrice = prod.basePrice;
      let variantName = null;
      if (item.variantId) {
        const variant = prod.variants.find((v) => v.id === item.variantId);
        if (variant) {
          currentPrice = variant.finalPrice || prod.basePrice;
          variantName = variant.variantName;
        }
      }

      const availableStock = prod.inventory?.quantityAvailable ?? 0;
      const hasStock = availableStock >= item.quantity;

      return {
        productId: item.productId,
        variantId: item.variantId || null,
        name: prod.name,
        slug: prod.slug,
        woodType: prod.primaryMaterial,
        dimensions: variantName || prod.dimensions,
        priceBDT: currentPrice,
        image: prod.images[0]?.url || "/images/furniture-placeholder.svg",
        requestedQuantity: item.quantity,
        availableStock,
        valid: hasStock,
        reason: hasStock
          ? "Available"
          : availableStock === 0
          ? "Out of stock"
          : `Only ${availableStock} unit(s) available in stock.`,
      };
    });

    const allValid = validationResults.every((r) => r.valid);
    const subtotal = validationResults
      .filter((r) => r.valid)
      .reduce((sum, item) => sum + item.priceBDT * item.requestedQuantity, 0);

    return sendSuccess(res, {
      allValid,
      items: validationResults,
      subtotal,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/cart/items/:id
 */
router.delete("/items/:id", optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.cartItem.delete({
      where: { id },
    });
    return sendSuccess(res, null, "Item removed from cart");
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/cart
 */
router.delete("/", optionalAuth, async (req, res, next) => {
  try {
    const { cart } = await getOrCreateCart(req);
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    return sendSuccess(res, null, "Cart cleared successfully");
  } catch (err) {
    next(err);
  }
});

export default router;

