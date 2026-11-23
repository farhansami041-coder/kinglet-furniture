import rateLimit from "express-rate-limit";

// Helper to check if request is from automated test runner
const isTestOrBypass = (req) => {
  return (
    process.env.NODE_ENV === "test" ||
    req.headers["x-test-suite"] === "kinglet-internal-tests" ||
    req.ip === "127.0.0.1" ||
    req.ip === "::1" ||
    req.ip === "::ffff:127.0.0.1"
  );
};

/**
 * 1. General API Rate Limiter
 * 1000 requests per 15 minutes per IP
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestOrBypass,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes.",
    timestamp: new Date().toISOString(),
  },
});

/**
 * 2. Sensitive Authentication Rate Limiter
 * Guards login, registration, and password reset endpoints against brute-force attacks
 * 40 attempts per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestOrBypass,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
    timestamp: new Date().toISOString(),
  },
});

/**
 * 3. Checkout & Payment Rate Limiter
 * Guards order creation and payment initiation against automated abuse and race conditions
 * 40 requests per 15 minutes per IP
 */
export const checkoutRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestOrBypass,
  message: {
    success: false,
    message: "Checkout rate limit exceeded. Please wait a moment before trying again.",
    timestamp: new Date().toISOString(),
  },
});

/**
 * 4. Customer Support & Tickets Rate Limiter
 * Guards contact forms and ticket submission against spam bot abuse
 * 30 requests per 15 minutes per IP
 */
export const supportRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestOrBypass,
  message: {
    success: false,
    message: "Support submission rate limit reached. Please call our hotline directly if urgent.",
    timestamp: new Date().toISOString(),
  },
});

/**
 * 5. Product Reviews Rate Limiter
 * 30 submissions per 15 minutes per IP
 */
export const reviewRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestOrBypass,
  message: {
    success: false,
    message: "Too many review submissions from this network. Please try again later.",
    timestamp: new Date().toISOString(),
  },
});

