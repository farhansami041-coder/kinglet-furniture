import express from "express";
import { z } from "zod";
import prisma from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = express.Router();

/**
 * 1. General Contact Us Form Submission
 * Protected against spam via honeypot and Bangladeshi phone verification
 */
router.post("/contact", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      phone: z.string().regex(/^01[3-9]\d{8}$/, "Valid 11-digit Bangladeshi mobile number required"),
      email: z.string().email("Invalid email").optional().or(z.literal("")),
      subject: z.string().min(3, "Subject required"),
      message: z.string().min(10, "Message must be at least 10 characters"),
      website: z.string().optional(), // Honeypot field (bots fill it, humans don't)
    });

    const data = schema.parse(req.body);

    // Honeypot spam trap
    if (data.website && data.website.trim().length > 0) {
      // Silently return success to fool spam bots without inserting garbage in DB
      return sendSuccess(res, { id: "KL-TICK-SPAM" }, "Thank you for contacting us.");
    }

    const ticketId = `KL-TICK-${Math.floor(100000 + Math.random() * 900000)}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        id: ticketId,
        customerName: data.name,
        customerPhone: data.phone,
        customerEmail: data.email || null,
        source: "CONTACT_PAGE",
        issueType: "general-inquiry",
        description: `[Subject: ${data.subject}] ${data.message}`,
        status: "OPEN",
      },
    });

    return sendSuccess(
      res,
      ticket,
      "Thank you! Your message has been received. Our concierge team will reach out shortly.",
      201
    );
  } catch (err) {
    next(err);
  }
});

/**
 * 2. Product-Specific Inquiry Form ("Ask for Showroom Video" / Custom Sizing)
 */
router.post("/inquiry", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2, "Name required"),
      phone: z.string().regex(/^01[3-9]\d{8}$/, "Valid 11-digit Bangladeshi phone required"),
      productId: z.string().min(1, "Product ID required"),
      productName: z.string().optional(),
      inquiryType: z.enum(["SHOWROOM_VIDEO", "CUSTOM_DIMENSIONS", "WOOD_SAMPLE", "BULK_INTERIOR"]),
      notes: z.string().optional().nullable(),
      website: z.string().optional(), // Honeypot
    });

    const data = schema.parse(req.body);

    if (data.website && data.website.trim().length > 0) {
      return sendSuccess(res, null, "Inquiry received.");
    }

    const ticketId = `KL-INQ-${Math.floor(100000 + Math.random() * 900000)}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        id: ticketId,
        customerName: data.name,
        customerPhone: data.phone,
        productId: data.productId,
        source: "PRODUCT_INQUIRY",
        issueType: data.inquiryType,
        description: `Inquiry for ${data.productName || data.productId}. Type: ${data.inquiryType}. Notes: ${data.notes || "Requested showroom video / details via WhatsApp."}`,
        status: "OPEN",
      },
    });

    return sendSuccess(
      res,
      ticket,
      "Inquiry submitted! Our showroom manager will WhatsApp the authentic 4K video & details within 15 minutes.",
      201
    );
  } catch (err) {
    next(err);
  }
});

/**
 * 2b. Turnkey 3D Interior Design & Architecture Consultation Inquiry
 */
router.post("/interior-inquiry", async (req, res, next) => {
  try {
    const schema = z.object({
      fullName: z.string().min(2, "Full Name is required").optional(),
      name: z.string().min(2).optional(),
      phone: z.string().regex(/^01[3-9]\d{8}$/, "Valid 11-digit Bangladeshi mobile number required"),
      email: z.string().email("Invalid email").optional().or(z.literal("")),
      spaceType: z.string().default("residential"),
      budget: z.string().default("5-10-lakh"),
      propertyArea: z.string().optional().nullable(),
      message: z.string().optional().nullable(),
      website: z.string().optional(), // Honeypot
    });

    const data = schema.parse(req.body);

    if (data.website && data.website.trim().length > 0) {
      return sendSuccess(res, { id: "KL-INT-SPAM" }, "Consultation request received.");
    }

    const customerName = (data.fullName || data.name || "Interior Client").trim();
    const ticketId = `KL-INT-${Math.floor(100000 + Math.random() * 900000)}`;

    const details = [
      `[Space Type: ${data.spaceType.toUpperCase()}]`,
      `[Budget Range: ${data.budget}]`,
      data.propertyArea ? `[Floor Area: ${data.propertyArea}]` : null,
      data.message ? `Notes: ${data.message}` : null,
    ].filter(Boolean).join(" | ");

    const ticket = await prisma.supportTicket.create({
      data: {
        id: ticketId,
        customerName,
        customerPhone: data.phone,
        customerEmail: data.email || null,
        source: "INTERIOR_PAGE",
        issueType: "INTERIOR_CONSULTATION",
        description: details || "Turnkey 3D Interior Consultation Request",
        status: "OPEN",
      },
    });

    return sendSuccess(
      res,
      {
        id: ticket.id,
        ticketId: ticket.id,
        name: ticket.customerName,
        phone: ticket.customerPhone,
        spaceType: data.spaceType,
        budget: data.budget,
        createdAt: ticket.createdAt,
      },
      "ধন্যবাদ! আপনার ইন্টেরিয়র কনসালটেশন রিকোয়েস্ট গৃহীত হয়েছে। আমাদের চিফ আর্কিটেক্ট দ্রুত যোগাযোগ করবেন।",
      201
    );
  } catch (err) {
    next(err);
  }
});

/**
 * 2c. VIP Showroom Visit & Appointment Booking
 */
router.post("/showroom-booking", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2, "Name is required").optional(),
      fullName: z.string().min(2).optional(),
      phone: z.string().regex(/^01[3-9]\d{8}$/, "Valid 11-digit Bangladeshi mobile number required"),
      email: z.string().email("Invalid email").optional().or(z.literal("")),
      showroomLocation: z.string().default("Mirpur Central Experience Hub"),
      visitingDate: z.string().min(1, "Visiting date is required"),
      visitingTime: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      website: z.string().optional(), // Honeypot
    });

    const data = schema.parse(req.body);

    if (data.website && data.website.trim().length > 0) {
      return sendSuccess(res, { id: "KL-SHW-SPAM" }, "Appointment received.");
    }

    const customerName = (data.name || data.fullName || "VIP Customer").trim();
    const ticketId = `KL-SHW-${Math.floor(100000 + Math.random() * 900000)}`;

    const details = [
      `[Showroom: ${data.showroomLocation}]`,
      `[Visiting Date: ${data.visitingDate}]`,
      data.visitingTime ? `[Time: ${data.visitingTime}]` : null,
      data.notes ? `Notes: ${data.notes}` : null,
    ].filter(Boolean).join(" | ");

    const ticket = await prisma.supportTicket.create({
      data: {
        id: ticketId,
        customerName,
        customerPhone: data.phone,
        customerEmail: data.email || null,
        source: "SHOWROOM_PAGE",
        issueType: "SHOWROOM_VIP_VISIT",
        description: details,
        status: "OPEN",
      },
    });

    return sendSuccess(
      res,
      {
        id: ticket.id,
        bookingCode: ticket.id,
        name: ticket.customerName,
        phone: ticket.customerPhone,
        showroom: data.showroomLocation,
        date: data.visitingDate,
        createdAt: ticket.createdAt,
      },
      "ধন্যবাদ! আপনার শোরুম ভিজিট অ্যাপয়েন্টমেন্ট কনফার্ম হয়েছে। শোরুম ম্যানেজার আপনাকে কল করে স্বাগত জানাবেন।",
      201
    );
  } catch (err) {
    next(err);
  }
});

/**
 * 2d. Public Newsletter Subscription
 */
router.post("/newsletter", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendError(res, "Please provide a valid email address.", 400);
    }
    const setting = await prisma.websiteSetting.findUnique({ where: { key: "newsletter_subscribers" } });
    let subs = setting ? JSON.parse(setting.value) : [];
    if (!subs.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
      subs.push({
        id: `SUB-${Date.now()}`,
        email: email.toLowerCase().trim(),
        subscribedAt: new Date().toISOString(),
      });
      await prisma.websiteSetting.upsert({
        where: { key: "newsletter_subscribers" },
        update: { value: JSON.stringify(subs) },
        create: {
          key: "newsletter_subscribers",
          value: JSON.stringify(subs),
          category: "marketing",
          description: "Subscribed newsletter email addresses",
        },
      });
    }
    return sendSuccess(res, { email }, "ধন্যবাদ! কিংলেটের ভিআইপি নিউজলেটারে সাবস্ক্রিপশন সম্পন্ন হয়েছে।");
  } catch (err) {
    next(err);
  }
});

/**
 * 3. 24/7 Helpline Support Ticket Registration
 */
router.post("/tickets", async (req, res, next) => {
  try {
    const ticketSchema = z.object({
      customerName: z.string().min(2),
      customerPhone: z.string().min(11),
      orderNumber: z.string().optional().nullable(),
      issueType: z.string(),
      description: z.string().min(5),
    });

    const data = ticketSchema.parse(req.body);
    const ticketId = `KL-TICK-${Math.floor(100000 + Math.random() * 900000)}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        id: ticketId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        orderNumber: data.orderNumber || null,
        source: "HELPLINE",
        issueType: data.issueType,
        description: data.description,
        status: "OPEN",
      },
    });

    return sendSuccess(
      res,
      ticket,
      "Complaint ticket registered! Our factory quality manager will contact you within 24 hours.",
      201
    );
  } catch (err) {
    next(err);
  }
});

/**
 * 4. GET /api/v1/support/tickets/:id
 */
router.get("/tickets/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) return sendError(res, "Ticket not found", 404);
    return sendSuccess(res, ticket);
  } catch (err) {
    next(err);
  }
});

/**
 * 5. GET /api/v1/admin/support/tickets
 */
router.get(
  "/admin/tickets",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN", "STORE_MANAGER"]),
  async (req, res, next) => {
    try {
      const tickets = await prisma.supportTicket.findMany({
        orderBy: { createdAt: "desc" },
      });
      return sendSuccess(res, tickets);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 6. PUT /api/v1/admin/support/tickets/:id
 */
router.put(
  "/admin/tickets/:id",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, resolutionNotes, assignedTo } = req.body;

      const updated = await prisma.supportTicket.update({
        where: { id },
        data: {
          status: status || undefined,
          resolutionNotes: resolutionNotes !== undefined ? resolutionNotes : undefined,
          assignedTo: assignedTo !== undefined ? assignedTo : undefined,
        },
      });

      return sendSuccess(res, updated, "Ticket updated successfully!");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
