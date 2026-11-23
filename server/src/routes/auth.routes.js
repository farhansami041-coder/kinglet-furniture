import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { notificationService } from "../services/notification.service.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "kinglet_super_secure_jwt_secret_token_key_2026_xyz";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Validation Schemas
const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().regex(/^01[3-9]\d{8}$/, "Please enter a valid 11-digit Bangladeshi mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

const loginSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/v1/auth/register
 */
router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (existingUser) {
      return sendError(res, "An account with this phone number or email already exists.", 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Get customer role
    const customerRole = await prisma.role.findUnique({
      where: { name: "CUSTOMER" },
    });

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        passwordHash,
        roles: customerRole
          ? {
              create: {
                roleId: customerRole.id,
              },
            }
          : undefined,
        customer: {
          create: {
            fullName: data.fullName,
            phone: data.phone,
            email: data.email || null,
          },
        },
      },
      include: {
        roles: { include: { role: true } },
        customer: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, phone: user.phone, roles: user.roles.map((r) => r.role.name) },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          roles: user.roles.map((r) => r.role.name),
          role: user.roles[0]?.role.name || "CUSTOMER",
        },
      },
      "Account registered successfully!",
      201
    );
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/login
 */
router.post("/login", async (req, res, next) => {
  try {
    const { phone, password } = loginSchema.parse(req.body);
    const cleanPhone = phone.trim().replace(/[-\s]/g, "");

    // Normalize phone variants for Bangladeshi numbers: 01XXXXXXXXX <-> +8801XXXXXXXXX
    const phoneVariants = [cleanPhone];
    if (cleanPhone.startsWith("+880")) {
      phoneVariants.push("0" + cleanPhone.slice(4));
      phoneVariants.push(cleanPhone.slice(3));
    } else if (cleanPhone.startsWith("880")) {
      phoneVariants.push("0" + cleanPhone.slice(3));
      phoneVariants.push("+" + cleanPhone);
    } else if (cleanPhone.startsWith("01")) {
      phoneVariants.push("+88" + cleanPhone);
      phoneVariants.push("88" + cleanPhone);
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...phoneVariants.map((p) => ({ phone: p })),
          { email: cleanPhone },
        ],
      },
      include: {
        roles: { include: { role: true } },
        customer: true,
      },
    });

    if (!user) {
      return sendError(res, "Invalid phone number or password.", 401);
    }

    if (!user.isActive) {
      return sendError(res, "Your account has been deactivated. Please contact support.", 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, "Invalid phone number or password.", 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      { userId: user.id, phone: user.phone, roles: user.roles.map((r) => r.role.name) },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          roles: user.roles.map((r) => r.role.name),
          role: user.roles[0]?.role.name || "CUSTOMER",
        },
      },
      "Logged in successfully!"
    );
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/me
 */
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        roles: { include: { role: true } },
        customer: {
          include: {
            addresses: true,
          },
        },
      },
    });

    if (!user) {
      return sendError(res, "User not found.", 404);
    }

    return sendSuccess(res, {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      roles: user.roles.map((r) => r.role.name),
      role: user.roles[0]?.role.name || "CUSTOMER",
      customer: user.customer,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/auth/profile
 */
router.put("/profile", requireAuth, async (req, res, next) => {
  try {
    const { fullName, email } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName: fullName || undefined,
        email: email || undefined,
        customer: {
          update: {
            fullName: fullName || undefined,
            email: email || undefined,
          },
        },
      },
      include: {
        roles: { include: { role: true } },
        customer: true,
      },
    });

    return sendSuccess(
      res,
      {
        id: updated.id,
        fullName: updated.fullName,
        phone: updated.phone,
        email: updated.email,
        roles: updated.roles.map((r) => r.role.name),
      },
      "Profile updated successfully!"
    );
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/addresses
 */
router.post("/addresses", requireAuth, async (req, res, next) => {
  try {
    const { recipientName, phone, division, district, thana, streetAddress, isDefault } = req.body;

    let customer = await prisma.customer.findUnique({
      where: { userId: req.user.id },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId: req.user.id,
          fullName: req.user.fullName,
          phone: req.user.phone,
        },
      });
    }

    if (isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: customer.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        recipientName: recipientName || req.user.fullName,
        phone: phone || req.user.phone,
        division: division || "Dhaka",
        district: district || "Dhaka City",
        thana: thana || "Mirpur",
        streetAddress: streetAddress || "",
        isDefault: Boolean(isDefault),
      },
    });

    return sendSuccess(res, address, "Delivery address added!", 201);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/forgot-password
 * Initiates password reset by issuing secure token and dispatching notification
 */
router.post("/forgot-password", async (req, res, next) => {
  try {
    const schema = z.object({
      phone: z.string().optional(),
      phoneOrEmail: z.string().optional(),
    }).refine((d) => d.phone || d.phoneOrEmail, "Phone number or email is required");

    const parsed = schema.parse(req.body);
    const inputVal = (parsed.phone || parsed.phoneOrEmail).trim();
    const cleaned = inputVal.replace(/[-\s+]/g, "");
    const formatted = cleaned.startsWith("88") ? cleaned.slice(2) : cleaned;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: formatted },
          { email: inputVal },
        ],
      },
    });

    if (!user) {
      // Do not reveal user existence, return friendly success
      return sendSuccess(res, null, "If an account matches those details, password reset instructions have been dispatched.");
    }

    // Generate 6-digit cryptographic reset token
    const resetToken = crypto.randomInt(100000, 999999).toString();
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiresAt,
      },
    });

    await notificationService.notifyPasswordReset({ user, resetToken });

    return sendSuccess(
      res,
      {
        phone: user.phone,
        // In development/test mode, expose resetToken for instant verification
        ...(process.env.NODE_ENV !== "production" ? { resetToken } : {}),
      },
      "Password reset code dispatched successfully!"
    );
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/reset-password
 * Completes password reset with token verification and bcrypt hashing
 */
router.post("/reset-password", async (req, res, next) => {
  try {
    const schema = z.object({
      phone: z.string().optional(),
      token: z.string().min(4, "Reset token is required"),
      newPassword: z.string().min(6, "New password must be at least 6 characters"),
    });

    const { phone, token, newPassword } = schema.parse(req.body);

    const whereClause = {
      resetToken: token.trim(),
      resetTokenExpiresAt: { gte: new Date() },
    };

    if (phone) {
      const cleaned = phone.replace(/[-\s+]/g, "");
      const formatted = cleaned.startsWith("88") ? cleaned.slice(2) : cleaned;
      whereClause.OR = [
        { phone: formatted },
        { email: phone },
      ];
    }

    const user = await prisma.user.findFirst({
      where: whereClause,
    });

    if (!user) {
      return sendError(res, "Invalid or expired password reset token.", 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    return sendSuccess(res, null, "Password reset successfully! You can now log in with your new password.");
  } catch (err) {
    next(err);
  }
});

export default router;

