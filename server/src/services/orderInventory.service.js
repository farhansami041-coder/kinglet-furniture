import crypto from "crypto";
import prisma from "../db/prisma.js";
import { notificationService } from "./notification.service.js";
import { settingsService } from "./settings.service.js";

export const ORDER_STATUSES = {
  PENDING: "PENDING",
  AWAITING_PAYMENT: "AWAITING_PAYMENT",
  PAYMENT_VERIFICATION: "PAYMENT_VERIFICATION",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  PREPARING: "PREPARING",
  TIMBER_SEASONING: "TIMBER_SEASONING",
  JOINERY: "JOINERY",
  PU_POLISHING: "PU_POLISHING",
  QUALITY_AUDIT: "QUALITY_AUDIT",
  READY_FOR_DISPATCH: "READY_FOR_DISPATCH",
  SHIPPED: "SHIPPED",
  DISPATCHED: "DISPATCHED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  ON_HOLD: "ON_HOLD",
  FAILED: "FAILED",
  RETURNED: "RETURNED",
  REFUNDED: "REFUNDED",
};

export const PAYMENT_STATUSES = [
  "UNPAID",
  "PENDING",
  "AWAITING_VERIFICATION",
  "PARTIAL",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
];

// Factory Sub-stages mapped under PROCESSING
export const FACTORY_PROCESSING_STAGES = [
  "TIMBER_SEASONING",
  "JOINERY",
  "PU_POLISHING",
  "QUALITY_AUDIT",
  "PREPARING",
];

// Active pipeline stages (admin can advance or adjust steps cleanly)
const ACTIVE_PIPELINE_STAGES = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PAYMENT_VERIFICATION",
  "CONFIRMED",
  "PROCESSING",
  "PREPARING",
  ...FACTORY_PROCESSING_STAGES,
  "READY_FOR_DISPATCH",
  "SHIPPED",
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "ON_HOLD",
  "FAILED",
  "CANCELLED",
];

// Status-to-step map shared across pipeline & 6-stage customer tracking timeline
export const STATUS_STEP_MAP = {
  PENDING: 1,
  AWAITING_PAYMENT: 1,
  PAYMENT_VERIFICATION: 1,
  ON_HOLD: 1,
  CONFIRMED: 2,
  PROCESSING: 3,
  PREPARING: 3,
  TIMBER_SEASONING: 3,
  JOINERY: 3,
  POLISHING: 3,
  PU_POLISHING: 3,
  QUALITY_AUDIT: 4,
  READY_FOR_DISPATCH: 4,
  SHIPPED: 5,
  DISPATCHED: 5,
  OUT_FOR_DELIVERY: 5,
  DELIVERED: 6,
  FAILED: 0,
  CANCELLED: 0,
};

// Finite State Machine for Order Transitions (strict sequential by default; Admin UI can pass allowOverride/allowReopen)
export const VALID_STATUS_TRANSITIONS = {
  PENDING: ["AWAITING_PAYMENT", "PAYMENT_VERIFICATION", "CONFIRMED", "PROCESSING", ...FACTORY_PROCESSING_STAGES, "ON_HOLD", "FAILED", "CANCELLED"],
  AWAITING_PAYMENT: ["PAYMENT_VERIFICATION", "CONFIRMED", "PROCESSING", "ON_HOLD", "FAILED", "CANCELLED"],
  PAYMENT_VERIFICATION: ["CONFIRMED", "PROCESSING", "AWAITING_PAYMENT", "ON_HOLD", "FAILED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "PREPARING", ...FACTORY_PROCESSING_STAGES, "READY_FOR_DISPATCH", "ON_HOLD", "CANCELLED"],
  PROCESSING: ["PREPARING", "READY_FOR_DISPATCH", "DISPATCHED", "SHIPPED", "OUT_FOR_DELIVERY", ...FACTORY_PROCESSING_STAGES, "ON_HOLD", "CANCELLED"],
  PREPARING: ["READY_FOR_DISPATCH", "SHIPPED", "DISPATCHED", "ON_HOLD", "CANCELLED"],
  TIMBER_SEASONING: ["JOINERY", "PROCESSING", "PREPARING", "READY_FOR_DISPATCH", "ON_HOLD", "CANCELLED"],
  JOINERY: ["PU_POLISHING", "PROCESSING", "PREPARING", "READY_FOR_DISPATCH", "ON_HOLD", "CANCELLED"],
  PU_POLISHING: ["QUALITY_AUDIT", "PROCESSING", "PREPARING", "READY_FOR_DISPATCH", "ON_HOLD", "CANCELLED"],
  QUALITY_AUDIT: ["READY_FOR_DISPATCH", "DISPATCHED", "SHIPPED", "OUT_FOR_DELIVERY", "PROCESSING", "ON_HOLD", "CANCELLED"],
  READY_FOR_DISPATCH: ["SHIPPED", "DISPATCHED", "OUT_FOR_DELIVERY", "ON_HOLD", "CANCELLED"],
  DISPATCHED: ["OUT_FOR_DELIVERY", "DELIVERED", "RETURNED", "FAILED", "ON_HOLD", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED", "RETURNED", "FAILED", "ON_HOLD", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED", "RETURNED", "ON_HOLD", "CANCELLED"],
  DELIVERED: ["RETURNED", "REFUNDED"],
  ON_HOLD: ["PENDING", "AWAITING_PAYMENT", "PAYMENT_VERIFICATION", "CONFIRMED", "PROCESSING", "PREPARING", "READY_FOR_DISPATCH", "SHIPPED", "CANCELLED", "FAILED"],
  FAILED: ["PENDING", "AWAITING_PAYMENT", "CANCELLED"],
  RETURNED: ["REFUNDED"],
  CANCELLED: [], // Terminal unless explicitly reopened by admin with allowReopen
  REFUNDED: [],  // Terminal State
};

export const orderInventoryService = {
  /**
   * Generate secure unique order reference (KL-ORD-XXXXXX)
   */
  generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `KL-ORD-${timestamp}-${rand}`;
  },

  /**
   * Generate official unique tax invoice code (KL-INV-XXXXXX)
   */
  generateInvoiceCode() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
    return `KL-INV-${timestamp}-${rand}`;
  },

  /**
   * Verify if a requested status transition is allowed by the State Machine
   */
  isValidTransition(currentStatus, targetStatus) {
    if (currentStatus === targetStatus) return true;
    const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  },

  /**
   * Atomic, Concurrency-Safe Order Creation with Idempotency & Stock Deductions
   */
  async createOrder({
    idempotencyKey,
    customerId,
    customerName,
    customerPhone,
    customerEmail,
    shippingAddress,
    division = "Dhaka",
    district = "Dhaka City",
    thana = "Mirpur",
    paymentMethod = "COD",
    shippingCode = "based_on_location",
    couponCode,
    notes,
    manualTransaction, // optional { channel, trxId, senderAccount, purpose, emiTenure }
    items, // array of { productId, variantId, quantity }
  }) {
    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { items: true, statusHistory: true },
      });
      if (existing) {
        return { order: existing, isDuplicate: true };
      }
    }

    // 2. Debounce Check: Prevent accidental duplicate clicks within 15 seconds
    const recentDuplicate = await prisma.order.findFirst({
      where: {
        customerPhone,
        createdAt: { gte: new Date(Date.now() - 15000) },
      },
    });
    if (recentDuplicate && !idempotencyKey) {
      return { order: recentDuplicate, isDuplicate: true };
    }

    // 3. Fetch Shipping Method Rate from DB (Never trust client fee)
    let deliveryFee = 0;
    const shippingMethod = await prisma.shippingMethod.findUnique({
      where: { code: shippingCode },
    });
    if (shippingMethod) {
      deliveryFee = shippingMethod.baseRate;
    } else if (shippingCode === "dhaka_flat") {
      deliveryFee = 500;
    } else if (shippingCode === "outside_dhaka_crate") {
      deliveryFee = 2500;
    }

    // 4. Fetch Products & Variants from DB (Never trust client unit prices)
    const productIdentifiers = items.map((i) => String(i.productId));
    const dbProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { id: { in: productIdentifiers } },
          { sku: { in: productIdentifiers } },
          { slug: { in: productIdentifiers } },
          ...productIdentifiers.map((id) => ({ sku: { endsWith: `-${id}` } })),
        ],
      },
      include: {
        inventory: true,
        variants: true,
        images: { orderBy: { displayOrder: "asc" } },
      },
    });

    // 5. Pre-calculate line items, verify stock availability, and build snapshots
    let subtotal = 0;
    const preparedItems = [];

    for (const item of items) {
      const prod = dbProducts.find(
        (p) =>
          p.id === String(item.productId) ||
          p.sku === String(item.productId) ||
          p.slug === String(item.productId) ||
          p.sku.endsWith(`-${item.productId}`)
      );
      if (!prod) throw new Error(`Product not found or inactive: ${item.productId}`);

      let unitPrice = prod.basePrice;
      let variantName = null;
      let sku = prod.sku;
      let availableStock = prod.inventory?.quantityAvailable ?? 0;

      // Variant lookup if specified
      let variant = null;
      if (item.variantId) {
        variant = prod.variants.find((v) => v.id === item.variantId);
        if (!variant) throw new Error(`Selected variant not found for ${prod.name}`);
        unitPrice = variant.finalPrice;
        variantName = variant.variantName;
        sku = variant.sku;
        availableStock = variant.stockQuantity;
      }

      // Check stock availability
      if (availableStock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${prod.name}${variantName ? ` (${variantName})` : ""}". Only ${availableStock} unit(s) available in factory hub.`
        );
      }

      const heroImage =
        (prod.images || []).find((img) => img.isHero) || (prod.images || [])[0] || null;
      const productImageSnapshot = heroImage?.thumbnailUrl || heroImage?.url || null;

      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      preparedItems.push({
        productId: prod.id,
        variantId: variant ? variant.id : null,
        productSku: sku,
        productName: prod.name,
        productImage: productImageSnapshot,
        variantName,
        woodType: prod.primaryMaterial,
        dimensions: prod.dimensions,
        unitPrice,
        discount: 0,
        quantity: item.quantity,
        totalPrice: lineTotal,
      });
    }

    // 6. Recalculate Coupon Discount on Server (Coupons apply ONLY to Fixed Price products)
    let discountAmount = 0;
    let validCoupon = null;

    if (couponCode && couponCode.trim()) {
      const code = couponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({ where: { code } });

      // Determine eligible subtotal from Fixed Price items only (products with no oldPrice or oldPrice <= basePrice)
      const eligibleFixedSubtotal = preparedItems.reduce((acc, it) => {
        const prod = dbProducts.find((p) => p.id === it.productId);
        const isFixed = !prod || !prod.oldPrice || prod.oldPrice <= prod.basePrice;
        return isFixed ? acc + it.totalPrice : acc;
      }, 0);

      const couponExpiry = coupon?.expiresAt || coupon?.endDate;
      const isNotExpired = couponExpiry ? new Date(couponExpiry) > new Date() : true;
      const minThreshold = coupon?.minOrderAmount || coupon?.minOrderValue || 0;
      const maxUsage = coupon?.maxUsageCount || coupon?.usageLimit || Infinity;

      if (coupon && coupon.isActive && isNotExpired && eligibleFixedSubtotal > 0) {
        if (coupon.usedCount < maxUsage && subtotal >= minThreshold) {
          validCoupon = coupon;
          if (coupon.discountType === "PERCENTAGE" || coupon.discountType === "PERCENT") {
            discountAmount = Math.min(
              (eligibleFixedSubtotal * coupon.discountValue) / 100,
              coupon.maxDiscountAmount || coupon.maxDiscount || Infinity
            );
          } else {
            discountAmount = Math.min(coupon.discountValue, eligibleFixedSubtotal);
          }
        }
      }
    }

    const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);
    const codAdvanceConfigBdt = await settingsService.getCodSecurityAdvanceBdt();
    const expectedAdvanceRequirement =
      paymentMethod === "COD" ? Math.min(codAdvanceConfigBdt, grandTotal) : grandTotal;
    const deliveryLocation = [thana, district, division].filter(Boolean).join(", ");
    const hasManualTrx = Boolean(manualTransaction?.trxId && String(manualTransaction.trxId).trim());

    // Prevent duplicate manual transaction ID across non-rejected transactions
    if (hasManualTrx) {
      const cleanManualTrx = String(manualTransaction.trxId).trim();
      const dupTrx = await prisma.paymentTransaction.findFirst({
        where: {
          OR: [{ transactionRef: cleanManualTrx }, { manualTrxId: cleanManualTrx }],
          status: { notIn: ["REJECTED", "FAILED", "CANCELLED"] },
        },
      });
      if (dupTrx) {
        throw new Error(`Duplicate Transaction ID "${cleanManualTrx}" is already linked to another order.`);
      }
    }

    const initialOrderStatus = hasManualTrx
      ? ORDER_STATUSES.PAYMENT_VERIFICATION
      : ORDER_STATUSES.PENDING;
    const initialPaymentStatus = hasManualTrx
      ? "AWAITING_VERIFICATION"
      : paymentMethod === "COD"
      ? "UNPAID"
      : "PENDING";

    const orderNumber = this.generateOrderNumber();
    const invoiceCode = this.generateInvoiceCode();

    // 7. Execute ACID Transaction: Insert Order, Decrement Stock, Record Movement & Timeline
    const createdOrder = await prisma.$transaction(async (tx) => {
      const paymentCreates = hasManualTrx
        ? {
            transactionRef: String(manualTransaction.trxId).trim(),
            manualTrxId: String(manualTransaction.trxId).trim(),
            gateway: manualTransaction.channel || (paymentMethod === "COD" ? "BKASH_BANK" : paymentMethod),
            paymentChannel: manualTransaction.channel || paymentMethod,
            purpose: paymentMethod === "COD" ? "cod_advance" : "manual_trx",
            senderAccount: manualTransaction.senderAccount || null,
            amount: expectedAdvanceRequirement,
            status: "AWAITING_VERIFICATION",
            rawResponseJson: JSON.stringify({
              submittedAt: new Date(),
              emiTenure: manualTransaction.emiTenure || null,
            }),
          }
        : {
            transactionRef: `TRX-${orderNumber}`,
            gateway: paymentMethod,
            paymentChannel: paymentMethod,
            purpose: paymentMethod === "COD" ? "cod_advance" : paymentMethod === "BANK_EMI" ? "emi" : "full",
            amount: expectedAdvanceRequirement,
            status: paymentMethod === "COD" ? "UNPAID" : "PENDING",
            rawResponseJson: manualTransaction?.emiTenure
              ? JSON.stringify({
                  submittedAt: new Date(),
                  emiTenure: manualTransaction.emiTenure,
                })
              : null,
          };

      const finalNotes = [
        notes,
        manualTransaction?.emiTenure && !notes?.includes("EMI")
          ? `Selected Plan: ${manualTransaction.emiTenure}`
          : null,
      ]
        .filter(Boolean)
        .join(" | ") || null;

      // Create Order Record
      const ord = await tx.order.create({
        data: {
          idempotencyKey: idempotencyKey || null,
          orderNumber,
          invoiceCode,
          customerId: customerId || null,
          shippingMethodId: shippingMethod?.id || null,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          shippingAddress,
          division,
          district,
          thana,
          deliveryLocation,
          subtotal,
          discountAmount,
          deliveryFee,
          grandTotal,
          advanceAmount: 0,
          dueAmount: grandTotal,
          couponCode: validCoupon ? validCoupon.code : null,
          orderStatus: initialOrderStatus,
          paymentStatus: initialPaymentStatus,
          paymentMethod,
          notes: finalNotes,
          items: {
            create: preparedItems,
          },
          statusHistory: {
            create: {
              previousStatus: null,
              status: initialOrderStatus,
              stepIndex: 1,
              comment: hasManualTrx
                ? `Order placed with manual ${paymentCreates.paymentChannel} TrxID (${paymentCreates.manualTrxId}). Awaiting admin verification.`
                : "Order registered and production materials allocated.",
              notifiedSms: true,
            },
          },
          payments: {
            create: paymentCreates,
          },
        },
        include: {
          items: true,
          statusHistory: true,
          payments: true,
        },
      });

      // Concurrency-Safe Live Stock Verification & Atomic Decrements
      for (const item of preparedItems) {
        if (item.variantId) {
          const vUpdate = await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              stockQuantity: { gte: item.quantity },
            },
            data: {
              stockQuantity: { decrement: item.quantity },
            },
          });
          if (vUpdate.count === 0) {
            throw new Error(`Insufficient variant stock for ${item.productName} (${item.variantName}). Stock was claimed by another customer.`);
          }
        }

        const inv = await tx.inventory.findUnique({
          where: { productId: item.productId },
        });

        if (!inv) {
          throw new Error(`Inventory record not found for "${item.productName}".`);
        }

        // Atomic row-level lock decrement: Only decrements if available stock is >= required quantity
        const invUpdate = await tx.inventory.updateMany({
          where: {
            id: inv.id,
            quantityAvailable: { gte: item.quantity },
          },
          data: {
            quantityAvailable: { decrement: item.quantity },
            quantityReserved: { increment: item.quantity },
          },
        });

        if (invUpdate.count === 0) {
          throw new Error(`Insufficient stock for "${item.productName}". Only ${inv.quantityAvailable} available or claimed by a simultaneous buyer.`);
        }

        const newBalance = Math.max(0, inv.quantityAvailable - item.quantity);

        await tx.stockMovement.create({
          data: {
            inventoryId: inv.id,
            variantId: item.variantId,
            movementType: "ORDER_RESERVED",
            quantity: -item.quantity,
            balanceAfter: newBalance,
            referenceId: ord.orderNumber,
            notes: `Order placed: ${ord.orderNumber}`,
            performedBy: customerId || "CUSTOMER_CHECKOUT",
          },
        });
      }

      // Update coupon usage
      if (validCoupon) {
        await tx.coupon.update({
          where: { id: validCoupon.id },
          data: { usedCount: { increment: 1 } },
        });
        await tx.couponUsage.create({
          data: {
            couponId: validCoupon.id,
            orderId: ord.id,
            discount: discountAmount,
          },
        });
      }

      return ord;
    });

    // Async Notification Dispatch (Never blocks checkout transaction)
    notificationService.notifyOrderConfirmation({ order: createdOrder }).catch(() => {});

    const awaitingManualTx = (createdOrder.payments || []).find((p) => p.status === "AWAITING_VERIFICATION");
    if (awaitingManualTx) {
      notificationService.notifyManualPaymentSubmitted({
        order: createdOrder,
        transaction: awaitingManualTx,
      }).catch(() => {});
    }

    // Low Stock Alerter: Check if any purchased item stock reached <= 3
    for (const item of createdOrder.items) {
      prisma.inventory.findUnique({
        where: { productId: item.productId },
        include: { product: true },
      }).then((inv) => {
        if (inv && inv.quantityAvailable <= 3) {
          notificationService.notifyLowStockAlert({ product: inv.product, currentStock: inv.quantityAvailable });
        }
      }).catch(() => {});
    }

    return { order: createdOrder, isDuplicate: false };
  },

  /**
   * Shared transactional helper to restore or re-allocate stock for an order's line items.
   */
  async _adjustOrderStock(tx, order, { direction, movementType, notes, performedByUserId }) {
    const sign = direction === "restore" ? 1 : -1;

    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: sign * item.quantity } },
        });
      }

      const inv = await tx.inventory.findUnique({
        where: { productId: item.productId },
      });

      if (inv) {
        const nextBalance = Math.max(0, inv.quantityAvailable + sign * item.quantity);
        await tx.inventory.update({
          where: { id: inv.id },
          data: {
            quantityAvailable: nextBalance,
            quantityReserved: Math.max(0, inv.quantityReserved - sign * item.quantity),
          },
        });

        await tx.stockMovement.create({
          data: {
            inventoryId: inv.id,
            variantId: item.variantId,
            movementType,
            quantity: item.quantity,
            balanceAfter: nextBalance,
            referenceId: order.orderNumber,
            notes,
            performedBy: performedByUserId || "SYSTEM",
          },
        });
      }
    }
  },

  /**
   * Concurrency-Safe Order Status Transition with Zero Double-Decrement
   */
  async updateOrderStatus({
    orderId,
    newStatus,
    comment,
    stepIndex,
    performedByUserId,
    allowReopen = false,
    allowOverride = false,
  }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    const isReopeningCancelled =
      allowReopen &&
      order.orderStatus === ORDER_STATUSES.CANCELLED &&
      newStatus !== ORDER_STATUSES.CANCELLED &&
      ACTIVE_PIPELINE_STAGES.includes(newStatus);

    const isAdminPipelineOverride =
      allowOverride &&
      order.orderStatus !== ORDER_STATUSES.CANCELLED &&
      order.orderStatus !== ORDER_STATUSES.REFUNDED &&
      ACTIVE_PIPELINE_STAGES.includes(newStatus);

    // 1. Verify Status Transition via State Machine
    if (!isReopeningCancelled && !isAdminPipelineOverride && !this.isValidTransition(order.orderStatus, newStatus)) {
      throw new Error(
        `Invalid status transition from "${order.orderStatus}" to "${newStatus}".`
      );
    }

    const resolvedStepIndex = Number(stepIndex) || STATUS_STEP_MAP[newStatus] || 1;
    const isCancelOrFail = newStatus === ORDER_STATUSES.CANCELLED || newStatus === ORDER_STATUSES.FAILED;

    const result = await prisma.$transaction(async (tx) => {
      // 2. If moving to CANCELLED/FAILED and stock has NOT been restored, restore atomically
      const shouldRestoreStock = isCancelOrFail && !order.stockRestored;
      const shouldReallocateStock = isReopeningCancelled && order.stockRestored;

      if (shouldRestoreStock) {
        await this._adjustOrderStock(tx, order, {
          direction: "restore",
          movementType: "ORDER_CANCELLED_RESTORE",
          notes: `Stock restored upon order ${newStatus.toLowerCase()}: ${comment || `Order ${newStatus.toLowerCase()}`}`,
          performedByUserId,
        });
      } else if (shouldReallocateStock) {
        await this._adjustOrderStock(tx, order, {
          direction: "allocate",
          movementType: "ORDER_REOPENED_ALLOCATE",
          notes: `Stock re-allocated on admin order reopen to ${newStatus}`,
          performedByUserId,
        });
      }

      const isCodDelivered = newStatus === ORDER_STATUSES.DELIVERED && order.paymentMethod === "COD";

      // 3. Update Order Record
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: newStatus,
          stockRestored: shouldRestoreStock ? true : shouldReallocateStock ? false : order.stockRestored,
          cancellationReason:
            newStatus === ORDER_STATUSES.CANCELLED
              ? comment || "Cancelled by admin"
              : isReopeningCancelled
              ? null
              : undefined,
          cancellationDate:
            newStatus === ORDER_STATUSES.CANCELLED
              ? new Date()
              : isReopeningCancelled
              ? null
              : undefined,
          holdReason: newStatus === ORDER_STATUSES.ON_HOLD ? comment || "Placed on hold by admin" : undefined,
          rejectedReason: newStatus === ORDER_STATUSES.FAILED ? comment || "Order rejected / failed" : undefined,
          deliveredAt: newStatus === ORDER_STATUSES.DELIVERED ? new Date() : undefined,
          paymentStatus: isCodDelivered ? "PAID" : undefined,
          advanceAmount: isCodDelivered ? order.grandTotal : undefined,
          dueAmount: isCodDelivered ? 0 : undefined,
        },
      });

      // 4. Record Status Timeline History
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          previousStatus: order.orderStatus,
          status: newStatus,
          stepIndex: resolvedStepIndex,
          comment: comment || `Status transitioned to ${newStatus}`,
          notifiedSms: true,
          updatedById: performedByUserId || null,
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: performedByUserId || "SYSTEM",
          action: "ORDER_STATUS_CHANGED",
          module: "orders",
          targetId: orderId,
          diffJson: JSON.stringify({
            from: order.orderStatus,
            to: newStatus,
            stockRestored: shouldRestoreStock,
            reopened: isReopeningCancelled,
          }),
        },
      });

      return updatedOrder;
    });

    notificationService.notifyOrderStatusChange({ order: result, newStatus, comment }).catch(() => {});
    return result;
  },

  /**
   * Customer Self-Cancellation for Early-Stage Orders
   */
  async cancelOrderByCustomer({ orderId, customerId, phone, reason }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found.");

    const norm = (v) => String(v || "").replace(/\D/g, "").slice(-10);
    const ownsByCustomerId = customerId && order.customerId && order.customerId === customerId;
    const ownsByPhone = phone && norm(phone) && norm(phone) === norm(order.customerPhone);
    if (!ownsByCustomerId && !ownsByPhone) {
      const err = new Error("Forbidden: You do not own this order.");
      err.statusCode = 403;
      throw err;
    }

    const cancellableStatuses = [
      ORDER_STATUSES.PENDING,
      ORDER_STATUSES.AWAITING_PAYMENT,
      ORDER_STATUSES.PAYMENT_VERIFICATION,
      ORDER_STATUSES.ON_HOLD,
    ];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      const err = new Error(
        `Order cannot be cancelled by customer while in "${order.orderStatus}" status. Please contact support.`
      );
      err.statusCode = 409;
      throw err;
    }

    const updated = await this.updateOrderStatus({
      orderId: order.id,
      newStatus: ORDER_STATUSES.CANCELLED,
      comment: reason ? `Cancelled by customer: ${reason}` : "Cancelled by customer",
      performedByUserId: customerId || "CUSTOMER",
    });

    notificationService.notifyAdmin({
      event: "ORDER_CANCELLED_BY_CUSTOMER",
      title: `Order Cancelled: ${order.orderNumber}`,
      body: `${order.customerName} (${order.customerPhone}) cancelled order ${order.orderNumber}. Reason: ${reason || "Not specified"}`,
      orderId: order.id,
      referenceId: order.orderNumber,
    }).catch(() => {});

    return updated;
  },

  /**
   * Admin Payment Verification / Payment Status Management
   */
  async updateOrderPayment({
    orderId,
    action = "SET_PAYMENT_STATUS", // APPROVE_TRANSACTION | REJECT_TRANSACTION | SET_PAYMENT_STATUS
    paymentStatus,
    transactionId,
    rejectionReason,
    paidAmount,
    performedByUserId,
  }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    if (!order) throw new Error("Order not found.");

    const result = await prisma.$transaction(async (tx) => {
      let targetTx = null;
      if (transactionId) {
        targetTx = order.payments.find((p) => p.id === transactionId);
        if (!targetTx) throw new Error("Payment transaction not found on this order.");
      } else if (action === "APPROVE_TRANSACTION" || action === "REJECT_TRANSACTION") {
        targetTx = order.payments.find((p) => p.status === "AWAITING_VERIFICATION" || p.status === "PENDING");
        if (!targetTx) throw new Error("No pending or awaiting-verification transaction found.");
      }

      if (action === "APPROVE_TRANSACTION" && targetTx) {
        await tx.paymentTransaction.update({
          where: { id: targetTx.id },
          data: {
            status: "PAID",
            verifiedById: performedByUserId || null,
            verifiedAt: new Date(),
            rejectionReason: null,
          },
        });
      } else if (action === "REJECT_TRANSACTION" && targetTx) {
        await tx.paymentTransaction.update({
          where: { id: targetTx.id },
          data: {
            status: "FAILED",
            verifiedById: performedByUserId || null,
            verifiedAt: new Date(),
            rejectionReason: rejectionReason || "Transaction ID or amount could not be verified.",
          },
        });
      }

      // Recalculate total paid from all PAID/CONFIRMED transactions
      const refreshedTxs = await tx.paymentTransaction.findMany({ where: { orderId } });
      let confirmedPaid = refreshedTxs
        .filter((t) => t.status === "PAID" || t.status === "CONFIRMED" || t.status === "SUCCESS")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      if (paidAmount !== undefined && paidAmount !== null && action === "SET_PAYMENT_STATUS") {
        confirmedPaid = Math.max(0, Number(paidAmount));
      } else if (action === "SET_PAYMENT_STATUS" && paymentStatus === "PAID") {
        confirmedPaid = Number(order.grandTotal);
      } else if (action === "SET_PAYMENT_STATUS" && paymentStatus === "UNPAID") {
        confirmedPaid = 0;
      }

      const cappedPaid = Math.min(Number(order.grandTotal), Math.max(0, confirmedPaid));
      const nextDue = Math.max(0, Number(order.grandTotal) - cappedPaid);

      let resolvedPayStatus = paymentStatus;
      if (!resolvedPayStatus) {
        if (action === "REJECT_TRANSACTION") {
          const hasAnyAwaiting = refreshedTxs.some((t) => t.status === "AWAITING_VERIFICATION");
          resolvedPayStatus =
            cappedPaid >= Number(order.grandTotal)
              ? "PAID"
              : cappedPaid > 0
              ? "PARTIAL"
              : hasAnyAwaiting
              ? "AWAITING_VERIFICATION"
              : "FAILED";
        } else {
          if (cappedPaid >= Number(order.grandTotal) && Number(order.grandTotal) > 0) {
            resolvedPayStatus = "PAID";
          } else if (cappedPaid > 0) {
            resolvedPayStatus = "PARTIAL";
          } else {
            resolvedPayStatus = refreshedTxs.some((t) => t.status === "AWAITING_VERIFICATION")
              ? "AWAITING_VERIFICATION"
              : "PENDING";
          }
        }
      }

      // Automatic order status alignment on verification/rejection (only for early awaiting states)
      let nextOrderStatus = order.orderStatus;
      let statusComment = null;
      if (
        (resolvedPayStatus === "PARTIAL" || resolvedPayStatus === "PAID") &&
        [ORDER_STATUSES.PENDING, ORDER_STATUSES.AWAITING_PAYMENT, ORDER_STATUSES.PAYMENT_VERIFICATION].includes(
          order.orderStatus
        )
      ) {
        nextOrderStatus = ORDER_STATUSES.CONFIRMED;
        statusComment =
          action === "APPROVE_TRANSACTION" && targetTx
            ? `Payment transaction ${targetTx.manualTrxId || targetTx.transactionId || ""} verified (৳${Number(targetTx.amount).toLocaleString()}). Order Confirmed.`
            : `Payment verified (${resolvedPayStatus}). Order Confirmed.`;
      } else if (
        action === "REJECT_TRANSACTION" &&
        order.orderStatus === ORDER_STATUSES.PAYMENT_VERIFICATION
      ) {
        nextOrderStatus = ORDER_STATUSES.AWAITING_PAYMENT;
        statusComment = `Payment verification rejected: ${rejectionReason || "Invalid TrxID"}. Awaiting valid payment.`;
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: resolvedPayStatus,
          advanceAmount: cappedPaid,
          dueAmount: nextDue,
          orderStatus: nextOrderStatus,
        },
        include: { payments: true, items: true },
      });

      if (nextOrderStatus !== order.orderStatus || statusComment) {
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            previousStatus: order.orderStatus,
            status: nextOrderStatus,
            stepIndex: STATUS_STEP_MAP[nextOrderStatus] || 1,
            comment: statusComment || `Payment status updated to ${resolvedPayStatus}`,
            notifiedSms: true,
            updatedById: performedByUserId || null,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: performedByUserId || "SYSTEM",
          action: `PAYMENT_${action}`,
          module: "orders",
          targetId: orderId,
          diffJson: JSON.stringify({
            action,
            transactionId: targetTx?.id || null,
            paymentStatus: resolvedPayStatus,
            advanceAmount: cappedPaid,
            dueAmount: nextDue,
            rejectionReason: rejectionReason || null,
          }),
        },
      });

      return updatedOrder;
    });

    if (result.paymentStatus === "PAID" || result.paymentStatus === "PARTIAL") {
      notificationService.notifyPaymentStatusUpdate({
        order: result,
        transaction: { amount: result.advanceAmount, transactionRef: result.orderNumber },
        event: "PAYMENT_RECEIVED",
        customMessage: `Kinglet Payment: BDT ৳${Number(result.advanceAmount || 0).toLocaleString()} verified for Order ${result.orderNumber}. Remaining due: BDT ৳${Number(result.dueAmount || 0).toLocaleString()}.`,
      }).catch(() => {});
    } else if (action === "REJECT_TRANSACTION") {
      notificationService.notifyPaymentStatusUpdate({
        order: result,
        transaction: { amount: 0, transactionRef: result.orderNumber },
        event: "PAYMENT_REJECTED",
        customMessage: `Kinglet Payment Notice: Submitted transaction for Order ${result.orderNumber} could not be verified (${rejectionReason || "Invalid TrxID"}). Please resubmit a valid transaction.`,
      }).catch(() => {});
    }

    return result;
  },

  /**
   * Admin Update Courier & Tracking Details
   */
  async updateOrderTracking({
    orderId,
    courierName,
    trackingNumber,
    trackingUrl,
    estimatedDeliveryDate,
    deliveryLocation,
    newStatus,
    comment,
    performedByUserId,
  }) {
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) throw new Error("Order not found.");

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        courierName: courierName !== undefined ? courierName : existing.courierName,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : existing.trackingNumber,
        trackingUrl: trackingUrl !== undefined ? trackingUrl : existing.trackingUrl,
        estimatedDeliveryDate:
          estimatedDeliveryDate !== undefined
            ? estimatedDeliveryDate
              ? new Date(estimatedDeliveryDate)
              : null
            : existing.estimatedDeliveryDate,
        deliveryLocation: deliveryLocation !== undefined ? deliveryLocation : existing.deliveryLocation,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: performedByUserId || "SYSTEM",
        action: "ORDER_TRACKING_UPDATED",
        module: "orders",
        targetId: orderId,
        diffJson: JSON.stringify({
          courierName: updated.courierName,
          trackingNumber: updated.trackingNumber,
          estimatedDeliveryDate: updated.estimatedDeliveryDate,
        }),
      },
    });

    if (newStatus && newStatus !== existing.orderStatus) {
      return await this.updateOrderStatus({
        orderId,
        newStatus,
        comment: comment || `Shipment updated (${updated.courierName || "Courier"}: ${updated.trackingNumber || "N/A"})`,
        performedByUserId,
        allowOverride: true,
      });
    }

    return updated;
  },

  /**
   * Admin Add Internal Note
   */
  async addInternalNote({ orderId, note, performedByUserId }) {
    if (!note || !String(note).trim()) throw new Error("Note content is required.");
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) throw new Error("Order not found.");

    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    const entry = `[${stamp}] ${String(note).trim()}`;
    const merged = existing.internalNotes ? `${existing.internalNotes}\n${entry}` : entry;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { internalNotes: merged },
    });

    await prisma.auditLog.create({
      data: {
        userId: performedByUserId || "SYSTEM",
        action: "ORDER_INTERNAL_NOTE_ADDED",
        module: "orders",
        targetId: orderId,
        diffJson: JSON.stringify({ note: entry }),
      },
    });

    return updated;
  },

  /**
   * Permanently delete one or more orders cleanly with stock restoration for unfulfilled active orders.
   */
  async deleteOrders({ orderIds, performedByUserId }) {
    const uniqueIds = [...new Set((orderIds || []).filter(Boolean))];
    if (uniqueIds.length === 0) {
      throw new Error("No order IDs provided for deletion.");
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: uniqueIds } },
      include: { items: true },
    });

    if (orders.length === 0) {
      throw new Error("Matching order(s) not found.");
    }

    await prisma.$transaction(async (tx) => {
      for (const order of orders) {
        const isTerminalFulfilled = ["CANCELLED", "DELIVERED", "RETURNED", "REFUNDED", "FAILED"].includes(order.orderStatus);
        if (!order.stockRestored && !isTerminalFulfilled) {
          await this._adjustOrderStock(tx, order, {
            direction: "restore",
            movementType: "ORDER_DELETED_RESTORE",
            notes: `Stock restored upon permanent deletion of order ${order.orderNumber}`,
            performedByUserId,
          });
        }
      }

      const foundIds = orders.map((o) => o.id);
      await tx.couponUsage.deleteMany({ where: { orderId: { in: foundIds } } });
      await tx.refundRecord.deleteMany({ where: { orderId: { in: foundIds } } });
      await tx.notificationLog.deleteMany({ where: { orderId: { in: foundIds } } });
      await tx.paymentTransaction.deleteMany({ where: { orderId: { in: foundIds } } });
      await tx.orderStatusHistory.deleteMany({ where: { orderId: { in: foundIds } } });
      await tx.orderItem.deleteMany({ where: { orderId: { in: foundIds } } });
      await tx.order.deleteMany({ where: { id: { in: foundIds } } });

      await tx.auditLog.create({
        data: {
          userId: performedByUserId || "SYSTEM",
          action: "ORDERS_DELETED",
          module: "orders",
          targetId: foundIds.length === 1 ? foundIds[0] : `BULK_${foundIds.length}`,
          diffJson: JSON.stringify({
            deletedCount: orders.length,
            orderIds: foundIds,
            orderNumbers: orders.map((o) => o.orderNumber),
          }),
        },
      });
    }, { timeout: 15000 });

    return {
      deletedCount: orders.length,
      deletedOrderNumbers: orders.map((o) => o.orderNumber),
    };
  },

  /**
   * Process Order Refund with RefundRecord & Ledger Tracking
   */
  async processOrderRefund({
    orderId,
    refundAmount,
    reason,
    refundMethod = "MANUAL_BANK_MFS",
    restoreStock = false,
    performedByUserId,
  }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new Error("Order not found.");

    const amountToRefund = Math.min(
      Number(order.grandTotal),
      Math.max(0, Number(refundAmount) || Number(order.advanceAmount) || Number(order.grandTotal))
    );
    const totalRefundedSoFar = Number(order.refundAmount || 0) + amountToRefund;
    const paidBasis = Number(order.advanceAmount) > 0 ? Number(order.advanceAmount) : Number(order.grandTotal);
    const isFullRefund = totalRefundedSoFar >= paidBasis;

    const refundResult = await prisma.$transaction(async (tx) => {
      // Restore stock if returned and not yet restored
      if (restoreStock && !order.stockRestored) {
        await this._adjustOrderStock(tx, order, {
          direction: "restore",
          movementType: "ORDER_CANCELLED_RESTORE",
          notes: `Restored from returned/refunded order: ${reason}`,
          performedByUserId: performedByUserId || "ADMIN_REFUND",
        });
      }

      const refundRecord = await tx.refundRecord.create({
        data: {
          orderId,
          amount: amountToRefund,
          reason: reason || "Admin processed refund",
          refundMethod,
          status: "COMPLETED",
          processedById: performedByUserId || null,
        },
      });

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: isFullRefund ? ORDER_STATUSES.REFUNDED : order.orderStatus,
          paymentStatus: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
          refundAmount: totalRefundedSoFar,
          stockRestored: restoreStock ? true : order.stockRestored,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          previousStatus: order.orderStatus,
          status: isFullRefund ? ORDER_STATUSES.REFUNDED : order.orderStatus,
          stepIndex: 8,
          comment: `Refund processed: ৳${amountToRefund.toLocaleString()} (${refundMethod}). Reason: ${reason}`,
          notifiedSms: true,
          updatedById: performedByUserId || null,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: performedByUserId || "SYSTEM",
          action: "ORDER_REFUNDED",
          module: "orders",
          targetId: orderId,
          diffJson: JSON.stringify({
            refundRecordId: refundRecord.id,
            amountToRefund,
            totalRefundedSoFar,
            refundMethod,
            reason,
            restoreStock,
          }),
        },
      });

      return updated;
    });

    notificationService.notifyRefundUpdate({ order: refundResult, refundAmount: amountToRefund, reason }).catch(() => {});
    return refundResult;
  },

  /**
   * Manual Stock Adjustment with Full Audit Trail
   */
  async adjustStock({
    productId,
    newQuantity,
    reason = "ADMIN_MANUAL_ADJUST", // RESTOCK, ADMIN_MANUAL_ADJUST, DAMAGE_WRITE_OFF
    notes,
    performedByUserId,
  }) {
    const inv = await prisma.inventory.findUnique({
      where: { productId },
      include: { product: true },
    });

    if (!inv) throw new Error("Inventory record not found for this product.");

    const diff = Number(newQuantity) - inv.quantityAvailable;
    if (diff === 0) return inv;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.inventory.update({
        where: { id: inv.id },
        data: {
          quantityAvailable: Number(newQuantity),
        },
      });

      // Update product inStock boolean
      await tx.product.update({
        where: { id: productId },
        data: { inStock: Number(newQuantity) > 0 },
      });

      await tx.stockMovement.create({
        data: {
          inventoryId: inv.id,
          movementType: reason,
          quantity: diff,
          balanceAfter: Number(newQuantity),
          notes: notes || `Manual stock update by admin (${diff > 0 ? `+${diff}` : diff})`,
          performedBy: performedByUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: performedByUserId,
          action: "INVENTORY_ADJUSTED",
          module: "inventory",
          targetId: inv.id,
          diffJson: JSON.stringify({
            product: inv.product.name,
            oldQuantity: inv.quantityAvailable,
            newQuantity: Number(newQuantity),
            reason,
          }),
        },
      });

      return updated;
    });

    if (Number(newQuantity) <= 3) {
      notificationService.notifyLowStockAlert({ product: inv.product, quantityAvailable: Number(newQuantity) }).catch(() => {});
    }

    return result;
  },

  /**
   * Sweep and Expire Abandoned Reservations
   */
  async sweepExpiredReservations(expiryMinutes = 60) {
    const cutoff = new Date(Date.now() - expiryMinutes * 60 * 1000);
    const expiredCarts = await prisma.cart.findMany({
      where: { expiresAt: { lte: cutoff } },
      include: { items: true },
    });

    let sweptCount = 0;
    for (const cart of expiredCarts) {
      await prisma.cart.delete({ where: { id: cart.id } });
      sweptCount++;
    }
    return { sweptCarts: sweptCount };
  },
};
