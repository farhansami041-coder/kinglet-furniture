import { ZodError } from "zod";
import { sendError } from "../utils/response.js";

export function errorHandler(err, req, res, next) {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return sendError(res, "Validation failed", 422, formattedErrors);
  }

  // Handle Prisma unique constraint violations (P2002)
  if (err.code === "P2002") {
    const target = err.meta?.target ? err.meta.target.join(", ") : "field";
    return sendError(res, `A record with this ${target} already exists.`, 409);
  }

  // Handle Prisma record not found (P2025)
  if (err.code === "P2025") {
    return sendError(res, "The requested record was not found.", 404);
  }

  // Generic fallback
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (process.env.NODE_ENV === "development") {
    console.error("❌ API Error:", err);
  }

  return sendError(
    res,
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "An unexpected internal server error occurred."
      : message,
    statusCode
  );
}

export function notFoundHandler(req, res) {
  return sendError(res, `Endpoint not found: ${req.method} ${req.originalUrl}`, 404);
}

