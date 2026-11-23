import express from "express";
import prisma from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { settingsService } from "../services/settings.service.js";

const router = express.Router();

/**
 * GET /api/v1/cms/settings
 */
router.get("/settings", async (req, res, next) => {
  try {
    await settingsService.ensureDefaults();
    const settings = await prisma.websiteSetting.findMany();
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return sendSuccess(res, settingsMap);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/cms/contact
 * Fast public endpoint for contact hotline & WhatsApp
 */
router.get("/contact", async (req, res, next) => {
  try {
    const contactConfig = await settingsService.getContactConfig();
    return sendSuccess(res, contactConfig);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/cms/settings
 */
router.put("/settings", requireAuth, requireRole(["SUPER_ADMIN"]), async (req, res, next) => {
  try {
    const { key, value, group, description } = req.body;
    if (!key) return sendError(res, "Setting key is required", 400);

    const setting = await prisma.websiteSetting.upsert({
      where: { key },
      update: { value, description: description ?? undefined },
      create: { key, value, group: group || "general", description },
    });

    return sendSuccess(res, setting, "Setting saved successfully!");
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/cms/banners
 */
router.get("/banners", async (req, res, next) => {
  try {
    const banners = await prisma.homepageBanner.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });
    return sendSuccess(res, banners);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/cms/seo
 */
router.get("/seo", async (req, res, next) => {
  try {
    const { route } = req.query;
    if (!route) return sendError(res, "Route parameter required", 400);

    const seo = await prisma.seoMetadata.findUnique({
      where: { pageRoute: String(route) },
    });

    if (!seo) {
      return sendSuccess(res, {
        title: "Kinglet Furniture & Interior | Luxury Handcrafted Wooden Furniture Bangladesh",
        metaDescription: "Handcrafted seasoned solid Mahogany, Black Plum Wood & Oak Veneer luxury furniture in Bangladesh. 10-Year Anti-Borer Guarantee.",
      });
    }

    return sendSuccess(res, seo);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/cms/pages
 */
router.get("/pages", async (req, res, next) => {
  try {
    await settingsService.ensureDefaults();
    const setting = await prisma.websiteSetting.findUnique({ where: { key: "website_policy_pages" } });
    let pages = [];
    if (setting?.value) {
      try {
        pages = JSON.parse(setting.value);
      } catch {}
    }
    return sendSuccess(res, pages);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/cms/pages/:slug
 */
router.get("/pages/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    await settingsService.ensureDefaults();
    const setting = await prisma.websiteSetting.findUnique({ where: { key: "website_policy_pages" } });
    let pages = [];
    if (setting?.value) {
      try {
        pages = JSON.parse(setting.value);
      } catch {}
    }
    const cleanSlug = slug.toLowerCase().replace(/^\//, "");
    const page = pages.find(
      (p) =>
        p.id?.toLowerCase() === cleanSlug ||
        p.slug?.toLowerCase() === cleanSlug ||
        p.path?.toLowerCase().replace(/^\//, "") === cleanSlug
    );
    if (!page) return sendError(res, "Page not found", 404);
    return sendSuccess(res, page);
  } catch (err) {
    next(err);
  }
});

export default router;

