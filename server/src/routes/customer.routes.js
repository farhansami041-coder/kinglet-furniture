import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = express.Router();

// All customer routes require authentication
router.use(requireAuth);

/**
 * Helper to get or create Customer record for authenticated User
 */
async function getOrCreateCustomer(user) {
  let customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { userId: user.id },
        { phone: user.phone },
      ],
    },
    include: { addresses: true },
  });

  if (customer) {
    if (!customer.userId) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { userId: user.id },
        include: { addresses: true },
      });
    }
  } else {
    customer = await prisma.customer.create({
      data: {
        userId: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
      },
      include: { addresses: true },
    });
  }

  return customer;
}

/**
 * GET /api/v1/customers/profile
 * Returns authenticated user profile, linked customer record, order count, total spent
 */
router.get("/profile", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        phone: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    const customer = await getOrCreateCustomer(req.user);

    // Compute live order statistics
    const orderStats = await prisma.order.aggregate({
      where: {
        OR: [{ customerId: customer.id }, { customerPhone: user.phone }],
      },
      _count: { id: true },
      _sum: { grandTotal: true },
    });

    return sendSuccess(res, {
      user,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        totalOrders: orderStats._count.id || 0,
        totalSpent: orderStats._sum.grandTotal || 0,
        addressCount: customer.addresses.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/customers/profile
 * Updates customer profile information
 */
router.put("/profile", async (req, res, next) => {
  try {
    const profileSchema = z.object({
      fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
      email: z.string().email("Invalid email format").optional().or(z.literal("")),
      avatarUrl: z.string().url("Invalid image URL").optional().nullable(),
      address: z.string().optional().nullable(),
      division: z.string().optional().nullable(),
      district: z.string().optional().nullable(),
      thana: z.string().optional().nullable(),
    });

    const data = profileSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(data.fullName ? { fullName: data.fullName } : {}),
        ...(data.email !== undefined ? { email: data.email || null } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl || null } : {}),
      },
      select: {
        id: true,
        phone: true,
        email: true,
        fullName: true,
        avatarUrl: true,
      },
    });

    // Sync Customer model safely without duplicate phone key error
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { userId: req.user.id },
          { phone: updatedUser.phone },
        ],
      },
    });

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          userId: req.user.id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          userId: req.user.id,
          fullName: updatedUser.fullName,
          phone: updatedUser.phone,
          email: updatedUser.email,
        },
      });
    }

    // If address info provided, add or update default customer address
    if (data.address && data.address.trim()) {
      const existingAddr = await prisma.customerAddress.findFirst({
        where: { customerId: customer.id, isDefault: true },
      });

      if (existingAddr) {
        await prisma.customerAddress.update({
          where: { id: existingAddr.id },
          data: {
            streetAddress: data.address.trim(),
            division: data.division || existingAddr.division,
            district: data.district || existingAddr.district,
            thana: data.thana || existingAddr.thana,
          },
        });
      } else {
        await prisma.customerAddress.create({
          data: {
            customerId: customer.id,
            recipientName: updatedUser.fullName,
            phone: updatedUser.phone,
            division: data.division || "Dhaka",
            district: data.district || "Dhaka City",
            thana: data.thana || "Mirpur",
            streetAddress: data.address.trim(),
            isDefault: true,
          },
        });
      }
    }

    return sendSuccess(res, updatedUser, "Profile updated successfully!");
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/customers/change-password
 * Account Security Control: Updates password after verifying current password
 */
router.put("/change-password", async (req, res, next) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z.string().min(6, "New password must be at least 6 characters"),
    });

    const { currentPassword, newPassword } = schema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return sendError(res, "Incorrect current password", 400);
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Record Security Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_CHANGED",
        module: "users",
        targetId: user.id,
        ipAddress: req.ip || null,
        userAgent: req.get("user-agent") || null,
      },
    });

    return sendSuccess(res, null, "Password updated successfully!");
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/customers/addresses
 * Multiple delivery addresses book
 */
router.get("/addresses", async (req, res, next) => {
  try {
    const customer = await getOrCreateCustomer(req.user);
    const addresses = await prisma.customerAddress.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return sendSuccess(res, addresses);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/customers/addresses
 * Add a new delivery address to customer address book
 */
router.post("/addresses", async (req, res, next) => {
  try {
    const addressSchema = z.object({
      recipientName: z.string().min(2, "Recipient name is required"),
      phone: z.string().regex(/^01[3-9]\d{8}$/, "Valid 11-digit Bangladeshi mobile number required"),
      division: z.string().default("Dhaka"),
      district: z.string().default("Dhaka City"),
      thana: z.string().min(2, "Thana is required"),
      streetAddress: z.string().optional(),
      addressLine: z.string().optional(),
      postalCode: z.string().optional().nullable(),
      isDefault: z.boolean().default(false),
    }).transform((val) => ({
      recipientName: val.recipientName,
      phone: val.phone,
      division: val.division,
      district: val.district,
      thana: val.thana,
      streetAddress: val.streetAddress || val.addressLine || "Dhaka, Bangladesh",
      postalCode: val.postalCode,
      isDefault: val.isDefault,
    }));

    const data = addressSchema.parse(req.body);
    const customer = await getOrCreateCustomer(req.user);

    // If marked default, unset any previous defaults
    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: customer.id },
        data: { isDefault: false },
      });
    } else {
      // If first address, auto-set as default
      const existingCount = await prisma.customerAddress.count({
        where: { customerId: customer.id },
      });
      if (existingCount === 0) {
        data.isDefault = true;
      }
    }

    const created = await prisma.customerAddress.create({
      data: {
        ...data,
        customerId: customer.id,
      },
    });

    return sendSuccess(res, created, "Delivery address added successfully!", 201);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/customers/addresses/:id
 */
router.put("/addresses/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await getOrCreateCustomer(req.user);

    const existing = await prisma.customerAddress.findFirst({
      where: { id, customerId: customer.id },
    });

    if (!existing) {
      return sendError(res, "Address not found", 404);
    }

    const addressSchema = z.object({
      recipientName: z.string().min(2).optional(),
      phone: z.string().regex(/^01[3-9]\d{8}$/).optional(),
      division: z.string().optional(),
      district: z.string().optional(),
      thana: z.string().optional(),
      streetAddress: z.string().min(5).optional(),
      postalCode: z.string().optional().nullable(),
      isDefault: z.boolean().optional(),
    });

    const data = addressSchema.parse(req.body);

    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: customer.id, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.customerAddress.update({
      where: { id },
      data,
    });

    return sendSuccess(res, updated, "Address updated successfully!");
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/customers/addresses/:id
 */
router.delete("/addresses/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await getOrCreateCustomer(req.user);

    const existing = await prisma.customerAddress.findFirst({
      where: { id, customerId: customer.id },
    });

    if (!existing) {
      return sendError(res, "Address not found", 404);
    }

    await prisma.customerAddress.delete({ where: { id } });
    return sendSuccess(res, null, "Address removed successfully");
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/customers/orders
 * Customer real order history with line items and status tracking
 */
router.get("/orders", async (req, res, next) => {
  try {
    const customer = await getOrCreateCustomer(req.user);

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          { customerPhone: req.user.phone },
        ],
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
      orderBy: { createdAt: "desc" },
    });

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      invoiceCode: o.invoiceCode,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      discountAmount: o.discountAmount,
      grandTotal: o.grandTotal,
      advanceAmount: o.advanceAmount,
      dueAmount: o.dueAmount,
      courierName: o.courierName,
      trackingNumber: o.trackingNumber,
      trackingUrl: o.trackingUrl,
      estimatedDeliveryDate: o.estimatedDeliveryDate,
      deliveredAt: o.deliveredAt,
      cancellationReason: o.cancellationReason,
      recipientName: o.customerName,
      phone: o.customerPhone,
      deliveryAddress: `${o.shippingAddress}, ${o.thana}, ${o.district}`,
      itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
      items: o.items.map((i) => {
        const heroImg = i.product?.images?.find((img) => img.isHero) || i.product?.images?.[0];
        return {
          id: i.id,
          productId: i.productId,
          name: i.productName,
          sku: i.productSku,
          woodType: i.woodType,
          dimensions: i.dimensions,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          image: i.productImage || heroImg?.thumbnailUrl || heroImg?.url || "/images/furniture-placeholder.svg",
          slug: i.product?.slug || null,
        };
      }),
      payments: (o.payments || []).map((p) => ({
        id: p.id,
        gateway: p.gateway,
        paymentChannel: p.paymentChannel,
        purpose: p.purpose,
        manualTrxId: p.manualTrxId,
        amount: p.amount,
        status: p.status,
        rejectionReason: p.rejectionReason,
        createdAt: p.createdAt,
      })),
      statusHistory: o.statusHistory,
    }));

    return sendSuccess(res, formattedOrders);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/customers/notifications
 * Fetch customer-specific DB notifications
 */
router.get("/notifications", async (req, res, next) => {
  try {
    const cleanDigits = String(req.user.phone || "").replace(/\D/g, "").slice(-10);
    const logs = await prisma.notificationLog.findMany({
      where: {
        audience: "CUSTOMER",
        ...(cleanDigits ? { recipient: { contains: cleanDigits } } : { recipient: req.user.phone }),
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    const unreadCount = logs.filter((l) => !l.isRead).length;
    return sendSuccess(res, { notifications: logs, unreadCount });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/customers/notifications/read
 */
router.patch("/notifications/read", async (req, res, next) => {
  try {
    const cleanDigits = String(req.user.phone || "").replace(/\D/g, "").slice(-10);
    const { id } = req.body || {};
    await prisma.notificationLog.updateMany({
      where: {
        audience: "CUSTOMER",
        ...(id ? { id } : {}),
        ...(cleanDigits ? { recipient: { contains: cleanDigits } } : { recipient: req.user.phone }),
      },
      data: { isRead: true },
    });
    return sendSuccess(res, { markedRead: true });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/customers/wishlist
 * Retrieve authenticated customer's cloud-persisted wishlist
 */
router.get("/wishlist", async (req, res, next) => {
  try {
    const customer = await getOrCreateCustomer(req.user);
    const items = customer.wishlistJson ? JSON.parse(customer.wishlistJson) : [];
    return sendSuccess(res, { wishlist: Array.isArray(items) ? items : [] });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/customers/wishlist/sync
 * Sync / merge cloud wishlist with client-side additions
 */
router.post("/wishlist/sync", async (req, res, next) => {
  try {
    const customer = await getOrCreateCustomer(req.user);
    const { wishlistItems = [] } = req.body;

    const existing = customer.wishlistJson ? JSON.parse(customer.wishlistJson) : [];
    const existingList = Array.isArray(existing) ? existing : [];

    // Merge without duplicates by product ID or slug
    const map = new Map();
    existingList.forEach((item) => {
      const key = String(item.id || item.slug);
      map.set(key, item);
    });
    (Array.isArray(wishlistItems) ? wishlistItems : []).forEach((item) => {
      if (item) {
        const key = String(item.id || item.slug);
        map.set(key, item);
      }
    });

    const merged = Array.from(map.values());

    await prisma.customer.update({
      where: { id: customer.id },
      data: { wishlistJson: JSON.stringify(merged) },
    });

    return sendSuccess(res, { wishlist: merged }, "Wishlist synchronized with your Kinglet account.");
  } catch (err) {
    next(err);
  }
});

export default router;
