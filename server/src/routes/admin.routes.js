import express from "express";
import { z } from "zod";
import prisma from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/response.js";
import { orderInventoryService, ORDER_STATUSES } from "../services/orderInventory.service.js";
import { settingsService } from "../services/settings.service.js";
import { notificationService } from "../services/notification.service.js";
import cache from "../utils/cache.js";

const router = express.Router();

// Enforce admin privileges
router.use(requireAuth, requireRole(["SUPER_ADMIN", "STORE_MANAGER", "DISPATCH_OFFICER"]));

// -------------------------------------------------------------
// 1. ADVANCED REAL-TIME BUSINESS KPI METRICS & SALES TRENDS
// -------------------------------------------------------------
router.get("/dashboard/stats", async (req, res, next) => {
  try {
    const { range = "30d" } = req.query; // 7d, 30d, all

    let startDate = new Date();
    if (range === "7d") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === "30d") {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate = new Date(0); // All time
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      newOrdersToday,
      pendingOrders,
      awaitingPaymentOrders,
      paymentVerificationOrders,
      confirmedOrders,
      processingOrders,
      preparingOrders,
      readyForDispatchOrders,
      shippedOrders,
      outForDeliveryOrders,
      deliveredOrders,
      cancelledOrders,
      onHoldOrders,
      failedOrders,
      pendingPaymentsCount,
      totalActiveProducts,
      lowStockProducts,
      outOfStockProducts,
      recentOrders,
      allValidOrders,
      topOrderedItems,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { orderStatus: "PENDING" } }),
      prisma.order.count({ where: { orderStatus: "AWAITING_PAYMENT" } }),
      prisma.order.count({ where: { orderStatus: "PAYMENT_VERIFICATION" } }),
      prisma.order.count({ where: { orderStatus: "CONFIRMED" } }),
      prisma.order.count({
        where: {
          orderStatus: { in: ["PROCESSING", "TIMBER_SEASONING", "JOINERY", "PU_POLISHING", "QUALITY_AUDIT"] },
        },
      }),
      prisma.order.count({ where: { orderStatus: "PREPARING" } }),
      prisma.order.count({ where: { orderStatus: "READY_FOR_DISPATCH" } }),
      prisma.order.count({ where: { orderStatus: { in: ["SHIPPED", "DISPATCHED"] } } }),
      prisma.order.count({ where: { orderStatus: "OUT_FOR_DELIVERY" } }),
      prisma.order.count({ where: { orderStatus: "DELIVERED" } }),
      prisma.order.count({ where: { orderStatus: "CANCELLED" } }),
      prisma.order.count({ where: { orderStatus: "ON_HOLD" } }),
      prisma.order.count({ where: { orderStatus: "FAILED" } }),
      prisma.order.count({
        where: {
          paymentStatus: { in: ["UNPAID", "PENDING", "AWAITING_VERIFICATION", "PARTIAL"] },
          orderStatus: { notIn: ["CANCELLED", "FAILED", "REFUNDED"] },
        },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.inventory.count({ where: { quantityAvailable: { gt: 0, lte: 2 } } }),
      prisma.inventory.count({ where: { quantityAvailable: { lte: 0 } } }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          subtotal: true,
          discountAmount: true,
          deliveryFee: true,
          grandTotal: true,
          advanceAmount: true,
          dueAmount: true,
          paymentStatus: true,
          orderStatus: true,
          createdAt: true,
        },
      }),
      prisma.orderItem.groupBy({
        by: ["productName"],
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    // Financial breakdown:
    let grossSales = 0;
    let discounts = 0;
    let deliveryCharges = 0;
    let netRevenue = 0;
    let refunds = 0;
    let outstandingPayments = 0;
    let collectedPayments = 0;

    allValidOrders.forEach((o) => {
      if (o.orderStatus === "CANCELLED" || o.orderStatus === "FAILED") {
        refunds += o.grandTotal;
      } else {
        const paid = o.paymentStatus === "PAID" ? Number(o.grandTotal) : Number(o.advanceAmount || 0);
        const due = o.paymentStatus === "PAID" ? 0 : Math.max(0, Number(o.dueAmount ?? (o.grandTotal - paid)));
        collectedPayments += paid;
        outstandingPayments += due;

        if (o.orderStatus !== "PENDING") {
          grossSales += o.subtotal;
          discounts += o.discountAmount;
          deliveryCharges += o.deliveryFee;
          netRevenue += o.grandTotal;
        }
      }
    });

    // Sales trend aggregation by day
    const trendMap = {};
    allValidOrders.forEach((o) => {
      if (o.orderStatus !== "CANCELLED" && o.orderStatus !== "FAILED") {
        const day = o.createdAt.toISOString().slice(0, 10);
        trendMap[day] = (trendMap[day] || 0) + o.grandTotal;
      }
    });

    const salesTrend = Object.keys(trendMap)
      .sort()
      .map((date) => ({
        date,
        amount: trendMap[date],
      }));

    return sendSuccess(res, {
      totalOrders,
      totalRevenue: netRevenue,
      totalRevenueBDT: netRevenue,
      newOrdersToday,
      pendingPaymentsCount,
      ordersByStatus: {
        pending: pendingOrders,
        awaitingPayment: awaitingPaymentOrders,
        paymentVerification: paymentVerificationOrders,
        confirmed: confirmedOrders,
        processing: processingOrders,
        preparing: preparingOrders,
        readyForDispatch: readyForDispatchOrders,
        shipped: shippedOrders,
        outForDelivery: outForDeliveryOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        onHold: onHoldOrders,
        failed: failedOrders,
      },
      inventoryOverview: {
        activeProducts: totalActiveProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
      financials: {
        grossSales,
        discounts,
        deliveryCharges,
        refunds,
        netRevenue,
        collectedPayments,
        outstandingPayments,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        itemsCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
        grandTotal: o.grandTotal,
        advanceAmount: o.advanceAmount,
        dueAmount: o.dueAmount,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        date: o.createdAt.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      })),
      bestSellers: topOrderedItems.map((item) => ({
        name: item.productName,
        totalSold: item._sum.quantity || 0,
        totalRevenue: item._sum.totalPrice || 0,
      })),
      salesTrend,
    });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 2. PRODUCT MANAGEMENT (CRUD, BULK ACTIONS, ATTRIBUTES)
// -------------------------------------------------------------

/**
 * GET /api/v1/admin/products
 */
router.get("/products", async (req, res, next) => {
  try {
    const { category, wood, stock, status, search, placement, page = 1, limit = 15 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};

    if (status === "ACTIVE") {
      where.isActive = true;
    } else if (status === "ARCHIVED") {
      where.isActive = false;
    }

    if (placement === "OFFER" || placement === "offer") {
      where.isOffer = true;
    } else if (placement === "NEW_ARRIVAL" || placement === "new_arrival") {
      where.isNewArrival = true;
    } else if (placement === "SHOWROOM_CLASSIC" || placement === "showroom_classic") {
      where.isShowroomClassic = true;
    } else if (placement === "FEATURED" || placement === "featured") {
      where.isFeatured = true;
    }

    if (category && category !== "ALL") {
      const catTrim = category.trim();
      where.OR = [
        { categoryId: catTrim },
        { category: { slug: catTrim } },
        { category: { parent: { slug: catTrim } } },
        { category: { parent: { parent: { slug: catTrim } } } },
      ];
    }

    if (wood && wood !== "ALL") {
      where.primaryMaterial = { contains: wood };
    }

    if (stock === "LOW") {
      where.inventory = { quantityAvailable: { gt: 0, lte: 2 } };
    } else if (stock === "OUT") {
      where.inventory = { quantityAvailable: { lte: 0 } };
    } else if (stock === "IN") {
      where.inventory = { quantityAvailable: { gt: 2 } };
    }

    if (search && search.trim()) {
      const q = search.trim();
      const searchConditions = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { primaryMaterial: { contains: q } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
              parent: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  parentId: true,
                  parent: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          },
          images: { orderBy: { displayOrder: "asc" } },
          inventory: true,
          variants: true,
          _count: { select: { orderItems: true } },
        },
      }),
    ]);

    const formatted = products.map((p) => {
      const cat = p.category;
      const pathParts = [];
      if (cat?.parent?.parent) pathParts.push(cat.parent.parent.name);
      if (cat?.parent) pathParts.push(cat.parent.name);
      if (cat?.name) pathParts.push(cat.name);
      const categoryPath = pathParts.join(" > ") || cat?.name || "General";

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        category: p.category.name,
        categoryId: p.category.id,
        categorySlug: p.category.slug,
        categoryPath,
        priceBDT: p.basePrice,
      oldPriceBDT: p.oldPrice,
      woodType: p.primaryMaterial,
      primaryMaterial: p.primaryMaterial,
      finish: p.finishType,
      finishType: p.finishType,
      dimensions: p.dimensions,
      hardware: p.hardware || "Hydraulic Soft-Closing German Fittings",
      seasoningMethod: p.seasoningMethod || "Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)",
      badge: p.badge,
      couponCode: p.couponCode || null,
      isOffer: Boolean(p.isOffer),
      isNewArrival: Boolean(p.isNewArrival),
      isShowroomClassic: Boolean(p.isShowroomClassic),
      isFeatured: Boolean(p.isFeatured),
      isActive: p.isActive,
      inStock: p.inStock,
      hasOrders: p._count.orderItems > 0,
      stockCount: p.inventory?.quantityAvailable ?? 0,
      image: p.images[0]?.url || "/images/furniture-placeholder.svg",
      images: p.images.map((img) => img.url),
      imageObjects: p.images.map((img) => ({
        id: img.id,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl || img.url,
        smallUrl: img.smallUrl || img.url,
        mediumUrl: img.mediumUrl || img.url,
        largeUrl: img.largeUrl || img.url,
        altText: img.altText,
        isHero: img.isHero,
        displayOrder: img.displayOrder,
        storageKey: img.storageKey,
      })),
      description: p.description,
      variantsCount: p.variants.length,
      rating: p.rating,
      reviewsCount: p.reviewsCount,
      createdAt: p.createdAt.toISOString().slice(0, 10),
    };
  });

    return sendPaginated(res, formatted, total, page, limit);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/products/:id
 */
router.get("/products/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { displayOrder: "asc" } },
        inventory: true,
        variants: true,
        priceHistory: { orderBy: { effectiveAt: "desc" } },
      },
    });

    if (!product) return sendError(res, "Product not found", 404);

    return sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/products
 */
router.post("/products", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2, "Product name is required"),
      slug: z.string().optional().nullable(),
      sku: z.string().optional().nullable(),
      categoryId: z.string().min(1, "Category is required"),
      description: z.string().optional().default("Handcrafted premium timber furniture by Kinglet master artisans."),
      primaryMaterial: z.string().optional().default("Seasoned Mahogany"),
      finishType: z.string().optional().default("High-Gloss Italian PU"),
      dimensions: z.string().optional().default("6.5 ft x 6.0 ft"),
      hardware: z.string().optional().default("Hydraulic Soft-Closing German Fittings"),
      seasoningMethod: z.string().optional().default("Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)"),
      basePrice: z.number().positive("Base price must be positive"),
      oldPrice: z.number().optional().nullable(),
      badge: z.string().optional().nullable(),
      couponCode: z.string().optional().nullable(),
      isOffer: z.boolean().optional().default(false),
      isNewArrival: z.boolean().optional().default(false),
      isShowroomClassic: z.boolean().optional().default(false),
      isFeatured: z.boolean().optional().default(false),
      initialStock: z.number().int().optional().default(5),
      images: z.array(z.union([z.string(), z.record(z.any())])).default([]),
      variants: z.array(
        z.object({
          variantName: z.string(),
          sku: z.string(),
          finalPrice: z.number(),
          stockQuantity: z.number().int().default(5),
        })
      ).optional().default([]),
    });

    const data = schema.parse(req.body);

    // Auto-generate and deduplicate slug
    let cleanSlug = (data.slug || data.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!cleanSlug) cleanSlug = `prod-${Date.now()}`;
    const existingSlug = await prisma.product.findUnique({ where: { slug: cleanSlug } });
    if (existingSlug) {
      cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
    }

    // Auto-generate and deduplicate SKU
    let cleanSku = (data.sku || `KL-${Math.floor(100 + Math.random() * 900)}`).trim();
    const existingSku = await prisma.product.findUnique({ where: { sku: cleanSku } });
    if (existingSku) {
      cleanSku = `${cleanSku}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Verify Category exists, fallback if needed
    let categoryId = data.categoryId;
    const catExists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!catExists) {
      const fallbackCat = await prisma.category.findFirst();
      if (fallbackCat) categoryId = fallbackCat.id;
    }

    // Sanitize images
    const rawImages = (data.images || []).filter((item) => {
      if (typeof item === "string") return item.trim().length > 0;
      if (typeof item === "object" && item !== null) return Boolean(item.url || item.mediumUrl || item.originalUrl);
      return false;
    });
    const safeImages = rawImages.length > 0 ? rawImages : ["/images/furniture-placeholder.svg"];

    const created = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          name: data.name.trim(),
          slug: cleanSlug,
          sku: cleanSku,
          categoryId,
          description: data.description,
          primaryMaterial: data.primaryMaterial,
          finishType: data.finishType,
          dimensions: data.dimensions,
          hardware: data.hardware || "Hydraulic Soft-Closing German Fittings",
          seasoningMethod: data.seasoningMethod || "Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)",
          basePrice: data.basePrice,
          oldPrice: data.oldPrice || null,
          badge: data.badge || null,
          couponCode: data.couponCode ? data.couponCode.trim() : null,
          isOffer: Boolean(data.isOffer),
          isNewArrival: Boolean(data.isNewArrival),
          isShowroomClassic: Boolean(data.isShowroomClassic),
          isFeatured: Boolean(data.isFeatured),
          images: {
            create: safeImages.map((item, i) => {
              if (typeof item === "object" && item !== null) {
                return {
                  url: item.url || item.mediumUrl || item.originalUrl || "/images/furniture-placeholder.svg",
                  thumbnailUrl: item.thumbnailUrl || null,
                  smallUrl: item.smallUrl || null,
                  mediumUrl: item.mediumUrl || null,
                  largeUrl: item.largeUrl || null,
                  storageKey: item.storageKey || null,
                  width: item.width ? Number(item.width) : null,
                  height: item.height ? Number(item.height) : null,
                  fileSize: item.fileSize ? Number(item.fileSize) : null,
                  mimeType: item.mimeType || "image/webp",
                  altText: item.altText || `${data.name} - ${data.primaryMaterial}`,
                  displayOrder: item.displayOrder !== undefined ? Number(item.displayOrder) : i,
                  isHero: i === 0,
                };
              }
              return {
                url: item,
                altText: `${data.name} - ${data.primaryMaterial}`,
                displayOrder: i,
                isHero: i === 0,
              };
            }),
          },
          inventory: {
            create: {
              quantityAvailable: data.initialStock,
              warehouseLocation: "Mirpur Factory Hub",
            },
          },
          variants: {
            create: data.variants.map((v) => ({
              variantName: v.variantName,
              sku: v.sku,
              finalPrice: v.finalPrice,
              stockQuantity: v.stockQuantity,
            })),
          },
        },
        include: {
          images: true,
          inventory: true,
          variants: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: "PRODUCT_CREATED",
          module: "products",
          targetId: prod.id,
          diffJson: JSON.stringify({ name: prod.name, sku: prod.sku, basePrice: prod.basePrice }),
        },
      });

      return prod;
    });

    cache.invalidatePrefix("filters");
    cache.invalidatePrefix("categories");
    cache.invalidatePrefix("products");

    return sendSuccess(res, created, "Product created successfully!", 201);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/admin/products/:id
 */
router.put("/products/:id", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      sku,
      categoryId,
      basePrice,
      oldPrice,
      dimensions,
      primaryMaterial,
      finishType,
      hardware,
      seasoningMethod,
      inStock,
      isActive,
      badge,
      couponCode,
      isOffer,
      isNewArrival,
      isShowroomClassic,
      isFeatured,
      description,
      stockCount,
      images,
    } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { inventory: true },
    });
    if (!existing) return sendError(res, "Product not found", 404);

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update Product Details
      const prod = await tx.product.update({
        where: { id },
        data: {
          name: name ?? undefined,
          slug: slug ?? undefined,
          sku: sku ?? undefined,
          categoryId: categoryId ?? undefined,
          basePrice: basePrice !== undefined ? Number(basePrice) : undefined,
          oldPrice: oldPrice !== undefined ? (oldPrice ? Number(oldPrice) : null) : undefined,
          dimensions: dimensions ?? undefined,
          primaryMaterial: primaryMaterial ?? undefined,
          finishType: finishType ?? undefined,
          hardware: hardware !== undefined ? hardware : undefined,
          seasoningMethod: seasoningMethod !== undefined ? seasoningMethod : undefined,
          inStock: inStock !== undefined ? Boolean(inStock) : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
          badge: badge !== undefined ? badge : undefined,
          couponCode: couponCode !== undefined ? (couponCode ? couponCode.trim() : null) : undefined,
          isOffer: isOffer !== undefined ? Boolean(isOffer) : undefined,
          isNewArrival: isNewArrival !== undefined ? Boolean(isNewArrival) : undefined,
          isShowroomClassic: isShowroomClassic !== undefined ? Boolean(isShowroomClassic) : undefined,
          isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
          description: description ?? undefined,
        },
      });

      // 2. Track Price Changes
      if (basePrice !== undefined && Number(basePrice) !== existing.basePrice) {
        await tx.productPriceHistory.create({
          data: {
            productId: id,
            oldPrice: existing.basePrice,
            newPrice: Number(basePrice),
            reason: "Admin catalog price update",
            changedBy: req.user.id,
          },
        });
      }

      // 3. Update Inventory Stock if provided
      if (stockCount !== undefined && existing.inventory) {
        const newStock = Number(stockCount);
        if (newStock !== existing.inventory.quantityAvailable) {
          await tx.inventory.update({
            where: { id: existing.inventory.id },
            data: { quantityAvailable: newStock },
          });

          await tx.stockMovement.create({
            data: {
              inventoryId: existing.inventory.id,
              movementType: newStock > existing.inventory.quantityAvailable ? "RESTOCK" : "ADMIN_MANUAL_ADJUST",
              quantity: newStock - existing.inventory.quantityAvailable,
              balanceAfter: newStock,
              notes: "Manual adjustment via Product Editor",
              performedBy: req.user.id,
            },
          });
        }
      }

      // 4. Update Images if provided
      if (images && Array.isArray(images)) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        for (let i = 0; i < images.length; i++) {
          const item = images[i];
          if (typeof item === "object" && item !== null) {
            await tx.productImage.create({
              data: {
                productId: id,
                url: item.url || item.mediumUrl || item.originalUrl,
                thumbnailUrl: item.thumbnailUrl || null,
                smallUrl: item.smallUrl || null,
                mediumUrl: item.mediumUrl || null,
                largeUrl: item.largeUrl || null,
                storageKey: item.storageKey || null,
                width: item.width ? Number(item.width) : null,
                height: item.height ? Number(item.height) : null,
                fileSize: item.fileSize ? Number(item.fileSize) : null,
                mimeType: item.mimeType || "image/webp",
                altText: item.altText || `${prod.name} - ${prod.primaryMaterial}`,
                displayOrder: item.displayOrder !== undefined ? Number(item.displayOrder) : i,
                isHero: i === 0,
              },
            });
          } else {
            await tx.productImage.create({
              data: {
                productId: id,
                url: item,
                altText: `${prod.name} - ${prod.primaryMaterial}`,
                displayOrder: i,
                isHero: i === 0,
              },
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: "PRODUCT_UPDATED",
          module: "products",
          targetId: id,
          diffJson: JSON.stringify({ beforePrice: existing.basePrice, afterPrice: prod.basePrice }),
        },
      });

      return prod;
    });

    cache.invalidatePrefix("filters");
    cache.invalidatePrefix("categories");

    return sendSuccess(res, updated, "Product updated successfully!");
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/admin/products/:id/toggle-placement
 * Quick 1-click toggle for storefront placements (isOffer, isNewArrival, isShowroomClassic)
 */
router.patch("/products/:id/toggle-placement", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { field } = req.body;
    const allowedFields = ["isOffer", "isNewArrival", "isShowroomClassic", "isFeatured"];

    if (!allowedFields.includes(field)) {
      return sendError(res, `Invalid placement field: ${field}. Must be one of: ${allowedFields.join(", ")}`, 400);
    }

    const current = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, [field]: true },
    });

    if (!current) {
      return sendError(res, "Product not found", 404);
    }

    const nextValue = !current[field];
    const updated = await prisma.product.update({
      where: { id },
      data: { [field]: nextValue },
      select: {
        id: true,
        name: true,
        isOffer: true,
        isNewArrival: true,
        isShowroomClassic: true,
        isFeatured: true,
      },
    });

    cache.invalidatePrefix("products");
    cache.invalidatePrefix("filters");

    return sendSuccess(res, updated, `Successfully toggled ${field} to ${nextValue}`);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/admin/products/:id
 * Safeguarded Deletion or Archive
 */
router.delete("/products/:id", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent = "false" } = req.query;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!product) return sendError(res, "Product not found", 404);

    // If product has 0 historical orders OR admin explicitly requests permanent purge:
    if (product.orderItems.length === 0 || permanent === "true") {
      await prisma.$transaction(async (tx) => {
        await tx.cartItem.deleteMany({ where: { productId: id } });
        await tx.productReview.deleteMany({ where: { productId: id } });
        await tx.productPriceHistory.deleteMany({ where: { productId: id } });
        await tx.productAttributeValue.deleteMany({ where: { productId: id } });
        await tx.productVariant.deleteMany({ where: { productId: id } });
        await tx.inventory.deleteMany({ where: { productId: id } });
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.seoMetadata.deleteMany({ where: { productId: id } });
        await tx.auditLog.deleteMany({ where: { targetId: id } });
        if (product.orderItems.length > 0) {
          await tx.orderItem.deleteMany({ where: { productId: id } });
        }
        await tx.product.delete({ where: { id } });
      });

      cache.invalidatePrefix("filters");
      cache.invalidatePrefix("categories");
      cache.invalidatePrefix("products");

      return sendSuccess(res, null, `Product "${product.name}" deleted permanently.`);
    }

    // Soft delete / archive for historical order preservation
    await prisma.product.update({
      where: { id },
      data: { isActive: false, inStock: false },
    });

    cache.invalidatePrefix("filters");
    cache.invalidatePrefix("categories");
    cache.invalidatePrefix("products");

    return sendSuccess(res, null, `Product "${product.name}" has customer order history and was moved to Archive.`);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/products/bulk
 * Bulk status toggle or deletion
 */
router.post("/products/bulk", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { productIds, action } = req.body; // action: 'activate' | 'deactivate' | 'delete'
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return sendError(res, "Please select at least one product.", 400);
    }

    if (action === "activate") {
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { isActive: true },
      });
      cache.invalidatePrefix("products");
      return sendSuccess(res, null, `Activated ${productIds.length} products.`);
    } else if (action === "deactivate") {
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { isActive: false },
      });
      cache.invalidatePrefix("products");
      return sendSuccess(res, null, `Deactivated ${productIds.length} products.`);
    } else if (action === "delete") {
      let deletedCount = 0;
      let archivedCount = 0;
      for (const pId of productIds) {
        const prod = await prisma.product.findUnique({
          where: { id: pId },
          include: { orderItems: true },
        });
        if (prod) {
          if (prod.orderItems.length === 0) {
            await prisma.$transaction(async (tx) => {
              await tx.cartItem.deleteMany({ where: { productId: pId } });
              await tx.productReview.deleteMany({ where: { productId: pId } });
              await tx.productPriceHistory.deleteMany({ where: { productId: pId } });
              await tx.productAttributeValue.deleteMany({ where: { productId: pId } });
              await tx.productVariant.deleteMany({ where: { productId: pId } });
              await tx.inventory.deleteMany({ where: { productId: pId } });
              await tx.productImage.deleteMany({ where: { productId: pId } });
              await tx.seoMetadata.deleteMany({ where: { productId: pId } });
              await tx.auditLog.deleteMany({ where: { targetId: pId } });
              await tx.product.delete({ where: { id: pId } });
            });
            deletedCount++;
          } else {
            await prisma.product.update({
              where: { id: pId },
              data: { isActive: false, inStock: false },
            });
            archivedCount++;
          }
        }
      }
      cache.invalidatePrefix("filters");
      cache.invalidatePrefix("categories");
      cache.invalidatePrefix("products");
      return sendSuccess(res, null, `Processed bulk deletion: ${deletedCount} deleted permanently, ${archivedCount} archived.`);
    }

    return sendError(res, "Invalid bulk action requested.", 400);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 3. CATEGORY MANAGEMENT (CRUD)
// -------------------------------------------------------------

/**
 * GET /api/v1/admin/categories
 */
router.get("/categories", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
            parent: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: { select: { products: true } },
      },
    });

    const formatted = categories.map((c) => {
      const isLevel3 = Boolean(c.parent?.parentId);
      const isLevel2 = Boolean(c.parentId && !c.parent?.parentId);
      const isLevel1 = !c.parentId;

      const rootParent = isLevel3 ? c.parent.parent : (isLevel2 ? c.parent : null);
      const directParent = c.parent || null;

      const pathParts = [];
      if (rootParent) pathParts.push(rootParent.name);
      if (isLevel3 && directParent) pathParts.push(directParent.name);
      pathParts.push(c.name);
      const categoryPath = pathParts.join(" > ");

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        parentId: c.parentId,
        parentName: directParent?.name || "Root Category",
        rootParentId: rootParent?.id || (isLevel1 ? c.id : null),
        rootParentName: rootParent?.name || (isLevel1 ? c.name : null),
        subParentId: isLevel3 ? directParent?.id : null,
        subParentName: isLevel3 ? directParent?.name : null,
        level: isLevel1 ? 1 : (isLevel2 ? 2 : 3),
        categoryPath,
        displayOrder: c.displayOrder,
        isActive: c.isActive,
        productsCount: c._count.products,
        metaTitle: c.metaTitle,
        metaDesc: c.metaDesc,
      };
    });

    return sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/categories
 */
router.post("/categories", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { name, slug, description, parentId, displayOrder, isActive, metaTitle, metaDesc } = req.body;
    if (!name || !name.trim()) return sendError(res, "Category name is required", 400);

    let cleanSlug = (slug || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!cleanSlug) cleanSlug = `cat-${Date.now()}`;

    // Auto deduplicate slug if needed
    const existing = await prisma.category.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        description: description || null,
        parentId: parentId || null,
        displayOrder: Number(displayOrder) || 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        metaTitle: metaTitle || null,
        metaDesc: metaDesc || null,
      },
    });

    cache.invalidatePrefix("categories");
    cache.invalidatePrefix("filters");
    cache.invalidatePrefix("products");
    return sendSuccess(res, category, "Category created successfully!", 201);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/admin/categories/:id
 */
router.put("/categories/:id", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, parentId, displayOrder, isActive, metaTitle, metaDesc } = req.body;

    let cleanSlug = undefined;
    if (slug) {
      cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const existing = await prisma.category.findUnique({ where: { slug: cleanSlug } });
      if (existing && existing.id !== id) {
        cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        slug: cleanSlug,
        description: description !== undefined ? description : undefined,
        parentId: parentId !== undefined ? (parentId || null) : undefined,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        metaTitle: metaTitle !== undefined ? metaTitle : undefined,
        metaDesc: metaDesc !== undefined ? metaDesc : undefined,
      },
    });

    cache.invalidatePrefix("categories");
    cache.invalidatePrefix("filters");
    cache.invalidatePrefix("products");
    return sendSuccess(res, updated, "Category updated successfully!");
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/admin/categories/:id
 */
router.delete("/categories/:id", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { force = "false", reassignTo } = req.query;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true, name: true, _count: { select: { orderItems: true } } },
        },
        subcategories: true,
      },
    });

    if (!category) return sendError(res, "Category not found", 404);

    if (category.subcategories.length > 0) {
      if (force === "true") {
        await prisma.category.updateMany({
          where: { parentId: id },
          data: { parentId: null },
        });
      } else {
        return sendError(res, `Cannot delete category: Contains ${category.subcategories.length} subcategories. Please reassign or delete them first.`, 400);
      }
    }

    if (category.products.length > 0) {
      if (force === "true" || reassignTo) {
        let targetCategoryId = reassignTo;
        if (!targetCategoryId) {
          const fallback = await prisma.category.findFirst({
            where: { id: { not: id }, parentId: null },
          });
          targetCategoryId = fallback?.id;
        }

        if (targetCategoryId) {
          await prisma.product.updateMany({
            where: { categoryId: id },
            data: { categoryId: targetCategoryId },
          });
        } else {
          for (const prod of category.products) {
            if (prod._count.orderItems === 0) {
              await prisma.$transaction(async (tx) => {
                await tx.cartItem.deleteMany({ where: { productId: prod.id } });
                await tx.productReview.deleteMany({ where: { productId: prod.id } });
                await tx.productPriceHistory.deleteMany({ where: { productId: prod.id } });
                await tx.productAttributeValue.deleteMany({ where: { productId: prod.id } });
                await tx.productVariant.deleteMany({ where: { productId: prod.id } });
                await tx.inventory.deleteMany({ where: { productId: prod.id } });
                await tx.productImage.deleteMany({ where: { productId: prod.id } });
                await tx.seoMetadata.deleteMany({ where: { productId: prod.id } });
                await tx.auditLog.deleteMany({ where: { targetId: prod.id } });
                await tx.product.delete({ where: { id: prod.id } });
              });
            }
          }
        }
      } else {
        const prodNames = category.products.slice(0, 3).map((p) => `"${p.name}"`).join(", ");
        const more = category.products.length > 3 ? ` and ${category.products.length - 3} more` : "";
        return sendError(
          res,
          `Cannot delete: Category contains ${category.products.length} assigned product(s) (${prodNames}${more}). Reassign them first or confirm Force Delete.`,
          400
        );
      }
    }

    await prisma.category.delete({ where: { id } });
    cache.invalidatePrefix("categories");
    cache.invalidatePrefix("filters");
    cache.invalidatePrefix("products");
    return sendSuccess(res, null, `Category "${category.name}" deleted successfully.`);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 4. ORDER MANAGEMENT (LIST, DETAILS, INVOICE, STATUS TRANSITION)
// -------------------------------------------------------------

/**
 * GET /api/v1/admin/orders
 * Paginated orders with status, payment and search filters
 */
router.get("/orders", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 15));
    const skip = (page - 1) * limit;
    const { status, paymentStatus, search } = req.query;

    const where = {};
    if (status && status !== "ALL") {
      where.orderStatus = status;
    }
    if (paymentStatus && paymentStatus !== "ALL") {
      where.paymentStatus = paymentStatus;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { orderNumber: { contains: q } },
        { invoiceCode: { contains: q } },
        { customerName: { contains: q } },
        { customerPhone: { contains: q } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          statusHistory: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          payments: true,
        },
      }),
    ]);

    return sendPaginated(res, orders, total, page, limit);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/orders/:id
 */
router.get("/orders/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
          include: { updatedBy: { select: { fullName: true } } },
        },
        payments: { orderBy: { createdAt: "desc" } },
        refunds: { orderBy: { createdAt: "desc" } },
        customer: true,
      },
    });

    if (!order) return sendError(res, "Order not found", 404);

    return sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT | PATCH /api/v1/admin/orders/:id/status
 */
const handleStatusUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comment, stepIndex, allowReopen, allowOverride } = req.body;

    const updated = await orderInventoryService.updateOrderStatus({
      orderId: id,
      newStatus: status,
      comment,
      stepIndex,
      allowReopen: Boolean(allowReopen),
      allowOverride: Boolean(allowOverride),
      performedByUserId: req.user.id,
    });

    return sendSuccess(res, updated, `Order status transitioned to ${status}!`);
  } catch (err) {
    next(err);
  }
};
router.put("/orders/:id/status", handleStatusUpdate);
router.patch("/orders/:id/status", handleStatusUpdate);

/**
 * PATCH | PUT /api/v1/admin/orders/:id/payment
 * Verify or reject manual payment TrxID, or set payment status directly
 */
const handlePaymentUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, paymentStatus, transactionId, rejectionReason, paidAmount } = req.body || {};

    const updated = await orderInventoryService.updateOrderPayment({
      orderId: id,
      action: action || (paymentStatus ? "SET_PAYMENT_STATUS" : "APPROVE_TRANSACTION"),
      paymentStatus,
      transactionId,
      rejectionReason,
      paidAmount,
      performedByUserId: req.user.id,
    });

    return sendSuccess(res, updated, "Payment status updated successfully!");
  } catch (err) {
    next(err);
  }
};
router.patch("/orders/:id/payment", handlePaymentUpdate);
router.put("/orders/:id/payment", handlePaymentUpdate);

/**
 * POST | PUT | PATCH /api/v1/admin/orders/:id/tracking
 * Update courier assignment, tracking number/URL, estimated delivery, & optionally transition status
 */
const handleTrackingUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      courierName,
      trackingNumber,
      trackingUrl,
      estimatedDeliveryDate,
      deliveryLocation,
      newStatus,
      comment,
    } = req.body || {};

    const updated = await orderInventoryService.updateOrderTracking({
      orderId: id,
      courierName,
      trackingNumber,
      trackingUrl,
      estimatedDeliveryDate,
      deliveryLocation,
      newStatus,
      comment,
      performedByUserId: req.user.id,
    });

    return sendSuccess(res, updated, "Shipment & tracking details saved!");
  } catch (err) {
    next(err);
  }
};
router.post("/orders/:id/tracking", handleTrackingUpdate);
router.put("/orders/:id/tracking", handleTrackingUpdate);
router.patch("/orders/:id/tracking", handleTrackingUpdate);

/**
 * POST /api/v1/admin/orders/:id/notes
 * Append internal staff note to order
 */
router.post("/orders/:id/notes", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body || {};
    const updated = await orderInventoryService.addInternalNote({
      orderId: id,
      note,
      performedByUserId: req.user.id,
    });
    return sendSuccess(res, updated, "Internal note added.");
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/orders/bulk-delete
 * Permanently delete selected orders cleanly
 */
router.post("/orders/bulk-delete", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { orderIds } = req.body;
    const result = await orderInventoryService.deleteOrders({
      orderIds,
      performedByUserId: req.user.id,
    });
    return sendSuccess(res, result, `Deleted ${result.deletedCount} order(s) permanently.`);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/admin/orders/:id
 * Permanently delete a single order
 */
router.delete("/orders/:id", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await orderInventoryService.deleteOrders({
      orderIds: [id],
      performedByUserId: req.user.id,
    });
    return sendSuccess(res, result, "Order deleted permanently.");
  } catch (err) {
    next(err);
  }
});

/**
 * PUT/POST /api/v1/admin/orders/:id/cancel
 * Cancel order & restore inventory with audit ledger
 */
router.put(["/orders/:id/cancel", "/orders/:id/cancel-order"], requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const updated = await orderInventoryService.updateOrderStatus({
      orderId: id,
      newStatus: "CANCELLED",
      comment: reason || "Cancelled by admin",
      performedByUserId: req.user.id,
    });

    return sendSuccess(res, updated, "Order cancelled and stock restored successfully!");
  } catch (err) {
    next(err);
  }
});

router.post(["/orders/:id/cancel", "/orders/:id/cancel-order"], requireRole(["SUPER_ADMIN", "ADMIN", "STAFF"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const updated = await orderInventoryService.updateOrderStatus({
      orderId: id,
      newStatus: "CANCELLED",
      comment: reason || "Cancelled by admin",
      performedByUserId: req.user.id,
    });

    return sendSuccess(res, updated, "Order cancelled and stock restored successfully!");
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/orders/:id/refund
 * Process refund & optional stock restoration
 */
router.post("/orders/:id/refund", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { refundAmount, reason, refundMethod, restoreStock } = req.body;

    const updated = await orderInventoryService.processOrderRefund({
      orderId: id,
      refundAmount: Number(refundAmount),
      reason: reason || "Customer requested refund",
      refundMethod: refundMethod || "MANUAL_BANK_MFS",
      restoreStock: Boolean(restoreStock),
      performedByUserId: req.user.id,
    });

    return sendSuccess(res, updated, "Refund processed and ledgers updated successfully!");
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 4B. INVENTORY AUDIT, MOVEMENTS & MANUAL ADJUSTMENTS
// -------------------------------------------------------------

/**
 * GET /api/v1/admin/inventory
 * Real-time stock status with variant breakdown, low-stock & out-of-stock alerts
 */
router.get("/inventory", async (req, res, next) => {
  try {
    const { search, alertOnly } = req.query;

    const where = {};
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { sku: { contains: search.trim() } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        inventory: true,
        variants: true,
        category: { select: { name: true } },
      },
    });

    const formatted = products.map((p) => {
      const avail = p.inventory?.quantityAvailable ?? 0;
      const reserved = p.inventory?.quantityReserved ?? 0;
      const threshold = p.inventory?.lowStockThreshold ?? 2;
      const isLow = avail > 0 && avail <= threshold;
      const isOut = avail <= 0;

      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category.name,
        woodType: p.primaryMaterial,
        quantityAvailable: avail,
        quantityReserved: reserved,
        lowStockThreshold: threshold,
        warehouseLocation: p.inventory?.warehouseLocation || "Mirpur Factory Hub",
        isLowStock: isLow,
        isOutOfStock: isOut,
        stockStatus: isOut ? "OUT_OF_STOCK" : isLow ? "LOW_STOCK" : "OPTIMAL",
        variants: p.variants.map((v) => ({
          variantId: v.id,
          sku: v.sku,
          name: v.variantName,
          stockQuantity: v.stockQuantity,
          reservedStock: v.reservedStock,
        })),
        updatedAt: p.inventory?.updatedAt,
      };
    });

    const filtered = alertOnly === "true"
      ? formatted.filter((item) => item.isLowStock || item.isOutOfStock)
      : formatted;

    return sendSuccess(res, filtered);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/inventory/adjust
 * Manual stock adjustment with audit trail and stock movement record
 */
router.post("/inventory/adjust", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { productId, newQuantity, reason, notes } = req.body;
    if (!productId || newQuantity === undefined) {
      return sendError(res, "Product ID and newQuantity are required.", 400);
    }

    const updated = await orderInventoryService.adjustStock({
      productId,
      newQuantity: Number(newQuantity),
      reason: reason || "ADMIN_MANUAL_ADJUST",
      notes,
      performedByUserId: req.user.id,
    });

    return sendSuccess(res, updated, "Stock adjusted and movement ledger logged successfully!");
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/inventory/movements
 * Full audit log of all stock movements with timestamps and authorized users
 */
router.get("/inventory/movements", async (req, res, next) => {
  try {
    const { productId, limit = 50 } = req.query;

    const where = {};
    if (productId) {
      where.inventory = { productId };
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: {
        inventory: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    const formatted = movements.map((m) => ({
      id: m.id,
      productName: m.inventory?.product?.name || "Product",
      sku: m.inventory?.product?.sku || "SKU",
      movementType: m.movementType,
      quantity: m.quantity,
      balanceAfter: m.balanceAfter,
      referenceId: m.referenceId,
      notes: m.notes,
      performedBy: m.performedBy,
      createdAt: m.createdAt.toISOString(),
      formattedDate: m.createdAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    return sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/inventory/sweep-reservations
 * Sweep abandoned checkout sessions & restore stock
 */
router.post("/inventory/sweep-reservations", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const result = await orderInventoryService.sweepExpiredReservations();
    return sendSuccess(res, result, "Expired cart reservations swept successfully.");
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 5. HOMEPAGE BANNERS & CMS
// -------------------------------------------------------------

router.get("/banners", async (req, res, next) => {
  try {
    const banners = await prisma.homepageBanner.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return sendSuccess(res, banners);
  } catch (err) {
    next(err);
  }
});

router.post("/banners", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { title, subtitle, badge, imageUrl, targetUrl, ctaText, displayOrder, isActive } = req.body;
    if (!title || !imageUrl) return sendError(res, "Banner title and image URL are required", 400);

    const banner = await prisma.homepageBanner.create({
      data: {
        title,
        subtitle: subtitle || null,
        badge: badge || null,
        imageUrl,
        targetUrl: targetUrl || "/category/bed-room",
        ctaText: ctaText || "Explore Collection",
        displayOrder: Number(displayOrder) || 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return sendSuccess(res, banner, "Banner added successfully!", 201);
  } catch (err) {
    next(err);
  }
});

router.put("/banners/:id", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, subtitle, badge, imageUrl, targetUrl, ctaText, displayOrder, isActive } = req.body;

    const updated = await prisma.homepageBanner.update({
      where: { id },
      data: {
        title: title ?? undefined,
        subtitle: subtitle !== undefined ? subtitle : undefined,
        badge: badge !== undefined ? badge : undefined,
        imageUrl: imageUrl ?? undefined,
        targetUrl: targetUrl !== undefined ? targetUrl : undefined,
        ctaText: ctaText !== undefined ? ctaText : undefined,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return sendSuccess(res, updated, "Banner updated successfully!");
  } catch (err) {
    next(err);
  }
});

router.delete("/banners/:id", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.homepageBanner.delete({ where: { id } });
    return sendSuccess(res, null, "Banner deleted successfully!");
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 6. WEBSITE SETTINGS & AUDIT LOGS
// -------------------------------------------------------------

router.get("/settings", async (req, res, next) => {
  try {
    await settingsService.ensureDefaults();
    const settings = await prisma.websiteSetting.findMany({
      orderBy: { group: "asc" },
    });
    return sendSuccess(res, settings);
  } catch (err) {
    next(err);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const { limit = 30, unreadOnly } = req.query;
    const notifications = await notificationService.getLogs({
      audience: "ADMIN",
      unreadOnly: unreadOnly === "true",
      limit: Number(limit) || 30,
    });
    const unreadCount = await prisma.notificationLog.count({
      where: { audience: "ADMIN", isRead: false },
    });
    return sendSuccess(res, { notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

router.patch("/notifications/read", async (req, res, next) => {
  try {
    const { id } = req.body || {};
    await prisma.notificationLog.updateMany({
      where: {
        audience: "ADMIN",
        ...(id ? { id } : {}),
      },
      data: { isRead: true },
    });
    return sendSuccess(res, { markedRead: true });
  } catch (err) {
    next(err);
  }
});

router.put("/settings", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const raw = req.body.settings !== undefined ? req.body.settings : req.body;
    const entries = [];

    if (Array.isArray(raw)) {
      raw.forEach((item) => {
        if (item && item.key) {
          entries.push({
            key: item.key,
            value: typeof item.value === "object" ? JSON.stringify(item.value) : String(item.value ?? ""),
            group: item.group,
            description: item.description,
          });
        }
      });
    } else if (typeof raw === "object" && raw !== null) {
      Object.entries(raw).forEach(([k, v]) => {
        entries.push({
          key: k,
          value: typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
        });
      });
    }

    if (entries.length === 0) {
      return sendError(res, "No settings provided to update", 400);
    }

    for (const item of entries) {
      await prisma.websiteSetting.upsert({
        where: { key: item.key },
        update: {
          value: item.value,
          group: item.group ?? undefined,
          description: item.description ?? undefined,
        },
        create: {
          key: item.key,
          value: item.value,
          group: item.group || "general",
          description: item.description || null,
        },
      });
    }

    return sendSuccess(res, { updatedCount: entries.length }, "Settings updated successfully!");
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/settings/emi
 * Admin endpoint to inspect current Bank EMI configuration
 */
router.get("/settings/emi", async (req, res, next) => {
  try {
    const emiConfig = await settingsService.getEmiConfig();
    return sendSuccess(res, emiConfig, "EMI settings retrieved");
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/admin/settings/emi
 * Admin endpoint to update Bank EMI tenures and interest rates
 */
router.put("/settings/emi", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const { tenures, plans } = req.body;
    const updated = await settingsService.updateEmiSettings({ tenures, plans });
    return sendSuccess(res, updated, "Bank EMI configuration synced successfully!");
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/settings/contact
 * Admin endpoint to inspect current hotline phone & WhatsApp numbers
 */
router.get("/settings/contact", async (req, res, next) => {
  try {
    const contactConfig = await settingsService.getContactConfig();
    return sendSuccess(res, contactConfig, "Contact settings retrieved successfully");
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/admin/settings/contact
 * Admin endpoint to update hotline phone & WhatsApp numbers
 */
router.put("/settings/contact", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const { primary_phone, whatsapp_number, footer_phone } = req.body;
    const updated = await settingsService.updateContactSettings({
      primary_phone,
      whatsapp_number,
      footer_phone,
    });
    return sendSuccess(res, updated, "Contact phone & WhatsApp numbers updated successfully!");
  } catch (err) {
    next(err);
  }
});

router.get("/audit-logs", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true, phone: true } } },
    });
    return sendSuccess(res, logs);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 7. SUPPLEMENTARY ENTERPRISE MANAGEMENT ENDPOINTS
// -------------------------------------------------------------

// Transactions List
router.get("/transactions", async (req, res, next) => {
  try {
    const transactions = await prisma.paymentTransaction.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            grandTotal: true,
            orderStatus: true,
          },
        },
      },
    });
    return sendSuccess(res, transactions);
  } catch (err) {
    next(err);
  }
});

// Customers List
router.get("/customers", async (req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: { id: true, orderNumber: true, grandTotal: true, createdAt: true },
          take: 5,
        },
      },
    });
    return sendSuccess(res, customers);
  } catch (err) {
    next(err);
  }
});

// Support Tickets / Complaints List
router.get("/tickets", async (req, res, next) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(res, tickets);
  } catch (err) {
    next(err);
  }
});

// Shipping Methods
router.get("/shipping-methods", async (req, res, next) => {
  try {
    const methods = await prisma.shippingMethod.findMany({
      orderBy: { baseRate: "asc" },
    });
    return sendSuccess(res, methods);
  } catch (err) {
    next(err);
  }
});

// Shipping Methods CRUD
router.post("/shipping-methods", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const { code, title, description, baseRate, freeAssembly, isActive } = req.body;
    if (!code || !title) return sendError(res, "Code and title required", 400);

    const method = await prisma.shippingMethod.create({
      data: {
        code,
        title,
        description: description || "",
        baseRate: Number(baseRate) || 0,
        freeAssembly: Boolean(freeAssembly),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });
    return sendSuccess(res, method, "Shipping method created!", 201);
  } catch (err) {
    next(err);
  }
});

router.put("/shipping-methods/:id", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, baseRate, freeAssembly, isActive } = req.body;
    const updated = await prisma.shippingMethod.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        baseRate: baseRate !== undefined ? Number(baseRate) : undefined,
        freeAssembly: freeAssembly !== undefined ? Boolean(freeAssembly) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });
    return sendSuccess(res, updated, "Shipping method updated!");
  } catch (err) {
    next(err);
  }
});

router.delete("/shipping-methods/:id", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.shippingMethod.delete({ where: { id } });
    return sendSuccess(res, null, "Shipping method removed!");
  } catch (err) {
    next(err);
  }
});

// Catalog Attributes CRUD
router.get("/attributes", async (req, res, next) => {
  try {
    const attributes = await prisma.attribute.findMany({
      include: { values: { orderBy: { displayOrder: "asc" } } },
      orderBy: { name: "asc" },
    });
    return sendSuccess(res, attributes);
  } catch (err) {
    next(err);
  }
});

router.post("/attributes", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return sendError(res, "Name and code required", 400);
    const attr = await prisma.attribute.create({
      data: { name, code },
    });
    return sendSuccess(res, attr, "Attribute created!", 201);
  } catch (err) {
    next(err);
  }
});

router.post("/attributes/:id/values", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { value, code, displayOrder } = req.body;
    if (!value || !code) return sendError(res, "Value and code required", 400);
    const val = await prisma.attributeValue.create({
      data: {
        attributeId: id,
        value,
        code,
        displayOrder: Number(displayOrder) || 0,
      },
    });
    return sendSuccess(res, val, "Attribute value added!", 201);
  } catch (err) {
    next(err);
  }
});

router.delete("/attributes/values/:valueId", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const { valueId } = req.params;
    await prisma.attributeValue.delete({ where: { id: valueId } });
    return sendSuccess(res, null, "Attribute value removed!");
  } catch (err) {
    next(err);
  }
});

// Support Tickets Status Update
router.put("/tickets/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: status || undefined,
        resolutionNotes: resolutionNotes || undefined,
      },
    });
    return sendSuccess(res, ticket, "Ticket status updated!");
  } catch (err) {
    next(err);
  }
});

// Blog Posts Management
router.get("/blogs", async (req, res, next) => {
  try {
    const posts = await prisma.blogPost.findMany({
      include: { category: true, author: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(res, posts);
  } catch (err) {
    next(err);
  }
});

router.post("/blogs", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { title, slug, excerpt, content, coverImage, categoryId } = req.body;
    if (!title || !content) return sendError(res, "Title and content are required", 400);

    let catId = categoryId;
    if (!catId) {
      const firstCat = await prisma.blogCategory.findFirst();
      catId = firstCat ? firstCat.id : null;
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        excerpt: excerpt || title,
        content,
        coverImage: coverImage || "https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=800&q=80",
        categoryId: catId,
        authorId: req.user.id,
        isPublished: true,
      },
    });
    return sendSuccess(res, post, "Blog article published successfully!", 201);
  } catch (err) {
    next(err);
  }
});

router.delete("/blogs/:id", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.blogPost.delete({ where: { id } });
    return sendSuccess(res, null, "Blog article deleted!");
  } catch (err) {
    next(err);
  }
});

// Website FAQs (Stored in website_faqs setting)
router.get("/faqs", async (req, res, next) => {
  try {
    const setting = await prisma.websiteSetting.findUnique({ where: { key: "website_faqs" } });
    const faqs = setting ? JSON.parse(setting.value) : [];
    return sendSuccess(res, faqs);
  } catch (err) {
    next(err);
  }
});

router.post("/faqs", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { faqs } = req.body;
    if (!Array.isArray(faqs)) return sendError(res, "FAQs array required", 400);
    await prisma.websiteSetting.upsert({
      where: { key: "website_faqs" },
      update: { value: JSON.stringify(faqs) },
      create: { key: "website_faqs", group: "cms", description: "Website FAQs list", value: JSON.stringify(faqs) },
    });
    return sendSuccess(res, faqs, "FAQs updated successfully!");
  } catch (err) {
    next(err);
  }
});

// Website Features (Stored in website_features setting)
router.get("/features", async (req, res, next) => {
  try {
    const setting = await prisma.websiteSetting.findUnique({ where: { key: "website_features" } });
    const features = setting ? JSON.parse(setting.value) : [];
    return sendSuccess(res, features);
  } catch (err) {
    next(err);
  }
});

router.post("/features", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { features } = req.body;
    if (!Array.isArray(features)) return sendError(res, "Features array required", 400);
    await prisma.websiteSetting.upsert({
      where: { key: "website_features" },
      update: { value: JSON.stringify(features) },
      create: { key: "website_features", group: "cms", description: "Website Features list", value: JSON.stringify(features) },
    });
    return sendSuccess(res, features, "Features updated successfully!");
  } catch (err) {
    next(err);
  }
});

// Newsletter Subscribers
router.get("/subscribers", async (req, res, next) => {
  try {
    const setting = await prisma.websiteSetting.findUnique({ where: { key: "newsletter_subscribers" } });
    const subs = setting ? JSON.parse(setting.value) : [];
    return sendSuccess(res, subs);
  } catch (err) {
    next(err);
  }
});

router.delete("/subscribers/:id", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const setting = await prisma.websiteSetting.findUnique({ where: { key: "newsletter_subscribers" } });
    let subs = setting ? JSON.parse(setting.value) : [];
    subs = subs.filter((s) => s.id !== id);
    await prisma.websiteSetting.update({
      where: { key: "newsletter_subscribers" },
      data: { value: JSON.stringify(subs) },
    });
    return sendSuccess(res, subs, "Subscriber removed!");
  } catch (err) {
    next(err);
  }
});

// Website Policy & Content Pages (Stored in website_policy_pages setting)
router.get("/pages", async (req, res, next) => {
  try {
    await settingsService.ensureDefaults();
    const setting = await prisma.websiteSetting.findUnique({ where: { key: "website_policy_pages" } });
    let pages = [];
    if (setting?.value) {
      try {
        pages = JSON.parse(setting.value);
      } catch {}
    }
    return sendSuccess(res, pages);
  } catch (err) {
    next(err);
  }
});

router.post("/pages", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { pages } = req.body;
    if (!Array.isArray(pages)) return sendError(res, "Pages array required", 400);
    await prisma.websiteSetting.upsert({
      where: { key: "website_policy_pages" },
      update: { value: JSON.stringify(pages) },
      create: { key: "website_policy_pages", group: "cms", description: "Website Policy and Info Pages", value: JSON.stringify(pages) },
    });
    return sendSuccess(res, pages, "Policy pages updated successfully!");
  } catch (err) {
    next(err);
  }
});

router.put("/pages/:id", requireRole(["SUPER_ADMIN", "STORE_MANAGER"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const pageUpdate = req.body;
    await settingsService.ensureDefaults();
    const setting = await prisma.websiteSetting.findUnique({ where: { key: "website_policy_pages" } });
    let pages = setting?.value ? JSON.parse(setting.value) : [];
    const index = pages.findIndex((p) => p.id === id || p.slug === id);
    if (index !== -1) {
      pages[index] = {
        ...pages[index],
        ...pageUpdate,
        updatedAt: new Date().toISOString(),
      };
    } else {
      pages.push({
        id,
        slug: id,
        ...pageUpdate,
        updatedAt: new Date().toISOString(),
      });
    }
    await prisma.websiteSetting.upsert({
      where: { key: "website_policy_pages" },
      update: { value: JSON.stringify(pages) },
      create: { key: "website_policy_pages", group: "cms", description: "Website Policy and Info Pages", value: JSON.stringify(pages) },
    });
    return sendSuccess(res, index !== -1 ? pages[index] : pages[pages.length - 1], "Page updated successfully!");
  } catch (err) {
    next(err);
  }
});

// System Backup Snapshot Export
router.get("/backup/export", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const [products, categories, orders, settings, banners, shipping, coupons, users] = await Promise.all([
      prisma.product.findMany({ take: 200 }),
      prisma.category.findMany(),
      prisma.order.findMany({ take: 200, include: { items: true } }),
      prisma.websiteSetting.findMany(),
      prisma.homepageBanner.findMany(),
      prisma.shippingMethod.findMany(),
      prisma.coupon.findMany(),
      prisma.user.findMany({ select: { id: true, fullName: true, phone: true, email: true, createdAt: true } }),
    ]);

    const backupSnapshot = {
      backupDate: new Date().toISOString(),
      platform: "Kinglet Furniture & Interior Management Suite",
      version: "2.0.0",
      stats: {
        products: products.length,
        categories: categories.length,
        orders: orders.length,
        settings: settings.length,
        banners: banners.length,
        shipping: shipping.length,
        coupons: coupons.length,
        users: users.length,
      },
      data: {
        products,
        categories,
        orders,
        settings,
        banners,
        shipping,
        coupons,
        users,
      },
    };

    res.setHeader("Content-Disposition", `attachment; filename="kinglet_backup_${Date.now()}.json"`);
    res.setHeader("Content-Type", "application/json");
    return res.send(JSON.stringify(backupSnapshot, null, 2));
  } catch (err) {
    next(err);
  }
});

// System Users (Staff / Admins)
router.get("/users", requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
});

export default router;
