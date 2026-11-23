import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import { sendError } from "../utils/response.js";

const JWT_SECRET = process.env.JWT_SECRET || "kinglet_super_secure_jwt_secret_token_key_2026_xyz";

/**
 * Extracts and verifies JWT from Bearer Authorization header
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Authentication required. Please log in.", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return sendError(res, "User account is suspended or no longer exists.", 401);
    }

    req.user = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles.map((r) => r.role.name),
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return sendError(res, "Session expired. Please log in again.", 401);
    }
    return sendError(res, "Invalid authentication token.", 401);
  }
}

/**
 * Optional Auth: Attaches user if token is present, continues as guest if not
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { roles: { include: { role: true } } },
      });
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          phone: user.phone,
          email: user.email,
          fullName: user.fullName,
          roles: user.roles.map((r) => r.role.name),
        };
      }
    }
  } catch {
    // Continue as guest
  }
  next();
}

/**
 * RBAC: Restrict to specific role(s)
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return sendError(res, "Access forbidden. Insufficient administrative privileges.", 403);
    }

    next();
  };
}

