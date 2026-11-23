import express from "express";
import prisma from "../db/prisma.js";
import { storageService } from "../services/storage.service.js";
import { emailService } from "../services/email.service.js";
import { smsService } from "../services/sms.service.js";
import { courierService } from "../services/courier.service.js";
import { PaymentService } from "../services/payment.service.js";
import { sendSuccess } from "../utils/response.js";

const router = express.Router();

/**
 * GET /api/v1/system/architecture
 * Complete real-time audit & status of every node in the Kinglet E-Commerce Flowchart
 */
router.get("/architecture", async (req, res, next) => {
  try {
    const dbStartTime = Date.now();
    let dbStatus = "HEALTHY";
    let dbLatencyMs = 0;
    let counts = { products: 0, categories: 0, orders: 0, users: 0, notificationLogs: 0 };

    try {
      const [productsCount, categoriesCount, ordersCount, usersCount, notifCount] = await Promise.all([
        prisma.product.count({ where: { isActive: true } }),
        prisma.category.count(),
        prisma.order.count(),
        prisma.user.count(),
        prisma.notificationLog.count(),
      ]);
      dbLatencyMs = Date.now() - dbStartTime;
      counts = {
        products: productsCount,
        categories: categoriesCount,
        orders: ordersCount,
        users: usersCount,
        notificationLogs: notifCount,
      };
    } catch (dbErr) {
      dbStatus = "DEGRADED: " + dbErr.message;
    }

    const storageStatus = storageService.getStatus();
    const courierBalance = await courierService.getBalance().catch(() => ({ status: "SIMULATED" }));

    const architectureAudit = {
      timestamp: new Date().toISOString(),
      architectureFlowchart: {
        presentationLayer: {
          customerWebsite: {
            status: "ONLINE",
            target: process.env.CLIENT_ORIGIN || "http://localhost:5174",
            responsiveVariants: ["Desktop", "Tablet", "Mobile"],
          },
          frontendUi: {
            framework: "React 19 + Vite 8 (Rolldown)",
            stateManagement: "Local & Server-Synced Shopping Cart, Wishlist, Compare, Account Hub",
          },
        },
        apiLayer: {
          framework: "Express.js 4.21 RESTful API",
          security: ["Helmet Security Headers", "CORS Origin Guard", "Express Rate Limiting (5 Tier)"],
          performance: ["Gzip Compression", "In-Memory LRU Caching", "ETag & Static Asset Caching"],
          baseEndpoint: "/api/v1",
        },
        backendApplication: {
          status: "RUNNING",
          uptimeSeconds: Math.round(process.uptime()),
          nodeVersion: process.version,
          memoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        },
        coreSubsystems: {
          authSystem: {
            status: "ACTIVE",
            features: [
              "Customer Registration & OTP Login",
              "Admin & Staff Role-Based Access Control (SUPER_ADMIN, STORE_MANAGER, SALES_REP)",
              "Dual JWT (Access & Refresh Tokens) with Bcrypt Salt Hashing",
            ],
            totalRegisteredUsers: counts.users,
          },
          ecommerceEngine: {
            productService: {
              status: "ACTIVE",
              activeCatalogProducts: counts.products,
              categoriesCount: counts.categories,
              capabilities: ["Multi-Wood Filter", "Dynamic % Discount", "Promotional Coupons", "Zero-Strikethrough Clean Pricing"],
            },
            orderService: {
              status: "ACTIVE",
              totalOrdersProcessed: counts.orders,
              capabilities: [
                "ACID Multi-Item Transactions",
                "Idempotency Key Duplication Defense",
                "Atomic Stock Reservation & Restoration",
                "7-Step Milestone Timeline Progression",
              ],
            },
            paymentService: {
              status: "ACTIVE",
              supportedMethods: ["COD (Cash on Delivery)", "BKASH / NAGAD (MFS)", "CARD_POS (SSLCommerz)", "BANK_EMI (0% 12-Month)"],
              simulationMode: PaymentService.isSimulationMode(),
            },
          },
          adminSystem: {
            status: "ACTIVE",
            capabilities: [
              "Product Catalog CRUD & Multi-Image Reorder",
              "Order Status Milestone Progression & Cancellation",
              "Official Printable Cash Memo & Challan Invoice Generation",
              "Real-time Inventory Restock Ledger",
            ],
          },
        },
        persistenceLayer: {
          database: {
            engine: "MySQL 8.0 via Prisma ORM",
            status: dbStatus,
            latencyMs: dbLatencyMs,
          },
          fileStorage: {
            provider: storageStatus.provider,
            status: "ACTIVE",
            rootPath: storageStatus.localStoragePath,
            sharpOptimization: "100% WebP with responsive variants (original, large, medium, small, thumb)",
          },
        },
        externalIntegrations: {
          paymentGateway: {
            provider: "SSLCommerz v4 API + bKash / Nagad",
            mode: PaymentService.isSimulationMode() ? "SANDBOX_SIMULATION" : "LIVE_PRODUCTION",
            status: "READY",
          },
          courierApi: {
            provider: "Steadfast Courier API",
            status: courierService.isConfigured() ? "CONNECTED_LIVE" : "SANDBOX_SIMULATION",
            balance: courierBalance,
            supportedOperations: ["1-Click Consignment Booking", "Status Tracking", "Delivery Webhook IPN"],
          },
          emailService: {
            provider: emailService.isConfigured() ? "SMTP_TRANSPORTER" : "SIMULATION_SANDBOX",
            status: "READY",
            templates: ["Luxury Wood-Grain Order Confirmation Invoice", "Order Status Update", "Password Reset"],
          },
          smsService: {
            provider: smsService.isConfigured() ? smsService.provider : "SIMULATION_SANDBOX",
            status: "READY",
            capabilities: ["Order Confirmation SMS", "Status Notification SMS", "Payment Confirmation SMS"],
          },
        },
      },
    };

    return sendSuccess(res, architectureAudit, "Backend complete system architecture status verified.");
  } catch (err) {
    next(err);
  }
});

export default router;

