import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import helmet from "helmet";
import compression from "compression";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import imageRoutes from "./routes/image.routes.js";
import cmsRoutes from "./routes/cms.routes.js";
import supportRoutes from "./routes/support.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import seoRoutes from "./routes/seo.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import reportRoutes from "./routes/report.routes.js";
import courierRoutes from "./routes/courier.routes.js";
import systemRoutes from "./routes/system.routes.js";
import { seoService } from "./services/seo.service.js";

import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import {
  generalApiLimiter,
  authRateLimiter,
  checkoutRateLimiter,
  supportRateLimiter,
  reviewRateLimiter,
} from "./middleware/rateLimiter.js";

const app = express();

// Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

// Gzip / Deflate Compression for High Throughput
app.use(compression());

// Security & Utility Middleware
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  "https://kingletbd.com",
  "https://www.kingletbd.com",
  "http://localhost:5174",
  "http://localhost:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some((o) => origin.startsWith(o))) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Global API rate limiting
app.use("/api", generalApiLimiter);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Persistent Object Storage Static Asset Serving with 1-Year Cache
app.use(
  "/storage/objects",
  express.static(path.resolve("storage/objects"), {
    maxAge: "365d",
    immutable: true,
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Kinglet Furniture Platform API",
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Root Welcome & Navigation Page
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Kinglet Furniture API & Platform</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 50px 20px; text-align: center; }
    .card { max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 14px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid #334155; }
    h1 { color: #f8fafc; margin: 8px 0 12px; font-size: 24px; font-weight: 800; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
    .btn-group { display: flex; flex-direction: column; gap: 10px; }
    .btn { display: block; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; transition: all 0.2s; }
    .btn-primary { background: #ec2226; color: #fff; }
    .btn-primary:hover { background: #d71e22; }
    .btn-secondary { background: #334155; color: #f1f5f9; }
    .btn-secondary:hover { background: #475569; }
    .status { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: #22c55e; margin-bottom: 8px; }
    .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; }
  </style>
</head>
<body>
  <div class="card">
    <div class="status"><span class="dot"></span> Kinglet Backend API is Online (Port 5000)</div>
    <h1>Kinglet Furniture Platform</h1>
    <p>Backend API server is running smoothly on port 5000. Click below to view the storefront website or explore API endpoints:</p>
    <div class="btn-group">
      <a class="btn btn-primary" href="http://localhost:5174/">🛍️ Open Website Storefront (Port 5174)</a>
      <a class="btn btn-secondary" href="http://localhost:5174/admin">⚙️ Open Admin Dashboard</a>
      <a class="btn btn-secondary" href="/health">📡 API Health Status (/health)</a>
      <a class="btn btn-secondary" href="/api/v1/products">📦 Products API (/api/v1/products)</a>
    </div>
  </div>
</body>
</html>`);
});

// Dynamic 301 / 302 Redirection Middleware for Permanently Changed URLs
app.use(async (req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/") && !req.path.startsWith("/storage/")) {
    try {
      const redirect = await seoService.resolveRedirect(req.path);
      if (redirect) {
        return res.redirect(redirect.statusCode || 301, redirect.targetPath);
      }
    } catch {
      // Continue without interruption
    }
  }
  next();
});

// API Routes
app.use("/", seoRoutes); // Mounts /sitemap.xml
app.use("/api/v1/seo", seoRoutes);
app.use("/api/v1", seoRoutes); // Mounts /api/v1/admin/seo/...
app.use("/api/v1/auth", authRateLimiter, authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", checkoutRateLimiter, orderRoutes);
app.use("/api/v1/admin/uploads", imageRoutes);
app.use("/api/v1/admin", imageRoutes); // Handles /api/v1/admin/products/:productId/images/...
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/cms", cmsRoutes);
app.use("/api/v1/support", supportRateLimiter, supportRoutes);
app.use("/api/v1/reviews", reviewRateLimiter, reviewRoutes);
app.use("/api/v1", reviewRoutes); // Mounts /api/v1/admin/reviews
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1", couponRoutes); // Mounts /api/v1/admin/coupons
app.use("/api/v1/admin/reports", reportRoutes);
app.use("/api/v1/courier", courierRoutes);
app.use("/api/v1", courierRoutes); // Mounts /api/v1/admin/courier/...
app.use("/api/v1/system", systemRoutes);

// Catch-all 404 and global error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

