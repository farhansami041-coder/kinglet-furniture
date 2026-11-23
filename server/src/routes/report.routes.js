import express from "express";
import prisma from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(["SUPER_ADMIN", "ADMIN", "STORE_MANAGER"]));

/**
 * GET /api/v1/admin/reports/analytics
 * Comprehensive business intelligence & executive reporting from real database ledgers
 */
router.get("/analytics", async (req, res, next) => {
  try {
    const { range = "30d", startDate, endDate } = req.query;

    // 1. Calculate Date Bounds
    const now = new Date();
    let fromDate = new Date();

    if (range === "today") {
      fromDate.setHours(0, 0, 0, 0);
    } else if (range === "7d") {
      fromDate.setDate(now.getDate() - 7);
    } else if (range === "30d") {
      fromDate.setDate(now.getDate() - 30);
    } else if (range === "90d") {
      fromDate.setDate(now.getDate() - 90);
    } else if (range === "year") {
      fromDate.setFullYear(now.getFullYear() - 1);
    } else if (range === "custom" && startDate) {
      fromDate = new Date(startDate);
    } else {
      fromDate.setDate(now.getDate() - 30);
    }

    const toDate = endDate ? new Date(endDate) : now;

    // 2. Orders In Range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: { items: true, payments: true },
      orderBy: { createdAt: "desc" },
    });

    // 3. Sales & Revenue Calculations
    let grossSales = 0;
    let totalDiscounts = 0;
    let totalDeliveryFees = 0;
    let totalRefunds = 0;
    let completedDeliveredRevenue = 0;

    const statusBreakdown = {
      PENDING: { count: 0, totalAmount: 0 },
      CONFIRMED: { count: 0, totalAmount: 0 },
      PROCESSING: { count: 0, totalAmount: 0 },
      READY_FOR_DISPATCH: { count: 0, totalAmount: 0 },
      SHIPPED: { count: 0, totalAmount: 0 },
      DELIVERED: { count: 0, totalAmount: 0 },
      CANCELLED: { count: 0, totalAmount: 0 },
      REFUNDED: { count: 0, totalAmount: 0 },
    };

    orders.forEach((o) => {
      grossSales += o.subtotal;
      totalDiscounts += o.discountAmount || 0;
      totalDeliveryFees += o.deliveryFee || 0;
      totalRefunds += o.refundAmount || 0;

      if (o.orderStatus === "DELIVERED") {
        completedDeliveredRevenue += o.grandTotal;
      }

      if (statusBreakdown[o.orderStatus]) {
        statusBreakdown[o.orderStatus].count += 1;
        statusBreakdown[o.orderStatus].totalAmount += o.grandTotal;
      }
    });

    const netRevenue = grossSales + totalDeliveryFees - totalDiscounts - totalRefunds;

    // 4. Daily Sales Timeline in Range
    const timelineMap = {};
    orders.forEach((o) => {
      const dateKey = o.createdAt.toISOString().split("T")[0];
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = { date: dateKey, ordersCount: 0, salesAmount: 0 };
      }
      timelineMap[dateKey].ordersCount += 1;
      timelineMap[dateKey].salesAmount += o.grandTotal;
    });
    const salesTimeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // 5. Best-Selling Products from Real Line Items
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: fromDate, lte: toDate },
          orderStatus: { notIn: ["CANCELLED"] },
        },
      },
    });

    const productSalesMap = {};
    orderItems.forEach((item) => {
      const key = item.productId;
      if (!productSalesMap[key]) {
        productSalesMap[key] = {
          productId: item.productId,
          productName: item.productName,
          sku: item.productSku,
          woodType: item.woodType,
          unitsSold: 0,
          totalRevenue: 0,
        };
      }
      productSalesMap[key].unitsSold += item.quantity;
      productSalesMap[key].totalRevenue += item.totalPrice;
    });

    const bestSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 10);

    // 6. Live Inventory Alerts (Low Stock <= 3, Out of Stock == 0)
    const inventoryAlerts = await prisma.inventory.findMany({
      where: {
        quantityAvailable: { lte: 3 },
      },
      include: {
        product: { select: { id: true, name: true, sku: true, primaryMaterial: true } },
      },
      orderBy: { quantityAvailable: "asc" },
      take: 15,
    });

    const lowStockItems = inventoryAlerts.map((inv) => ({
      productId: inv.productId,
      name: inv.product.name,
      sku: inv.product.sku,
      material: inv.product.primaryMaterial,
      availableStock: inv.quantityAvailable,
      reservedStock: inv.quantityReserved,
      status: inv.quantityAvailable === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
    }));

    // 7. Coupon Usage Summary
    const couponUsages = await prisma.couponUsage.findMany({
      where: {
        usedAt: { gte: fromDate, lte: toDate },
      },
      include: {
        coupon: { select: { code: true, discountType: true, discountValue: true } },
      },
    });

    const couponMap = {};
    couponUsages.forEach((u) => {
      const code = u.coupon.code;
      if (!couponMap[code]) {
        couponMap[code] = {
          code,
          type: u.coupon.discountType,
          redemptionsCount: 0,
          totalDiscountGiven: 0,
        };
      }
      couponMap[code].redemptionsCount += 1;
      couponMap[code].totalDiscountGiven += u.discount;
    });
    const couponReport = Object.values(couponMap);

    return sendSuccess(res, {
      dateRange: {
        range,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      financialSummary: {
        grossSales,
        totalDeliveryFees,
        totalDiscounts,
        totalRefunds,
        netRevenue,
        completedDeliveredRevenue,
        totalOrdersCount: orders.length,
        averageOrderValue: orders.length > 0 ? Math.round(netRevenue / orders.length) : 0,
      },
      financials: {
        grossSales,
        totalDeliveryFees,
        totalDiscounts,
        totalRefunds,
        netRevenue,
        completedDeliveredRevenue,
        totalOrdersCount: orders.length,
        averageOrderValue: orders.length > 0 ? Math.round(netRevenue / orders.length) : 0,
      },
      statusBreakdown,
      salesTimeline,
      bestSellingProducts,
      topSellingProducts: bestSellingProducts,
      inventoryAlerts: {
        totalLowStockCount: lowStockItems.filter((i) => i.status === "LOW_STOCK").length,
        totalOutOfStockCount: lowStockItems.filter((i) => i.status === "OUT_OF_STOCK").length,
        items: lowStockItems,
      },
      couponReport,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
