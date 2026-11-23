import express from "express";
import { z } from "zod";
import { seoService } from "../services/seo.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// -------------------------------------------------------------
// PUBLIC SEO ENDPOINTS
// -------------------------------------------------------------

/**
 * GET /sitemap.xml (or /api/v1/seo/sitemap.xml)
 * Dynamically generated, valid XML Sitemap with image extensions
 */
router.get("/sitemap.xml", async (req, res, next) => {
  try {
    const xml = await seoService.generateXmlSitemap();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=7200");
    return res.send(xml);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /robots.txt
 */
router.get("/robots.txt", async (req, res) => {
  res.type("text/plain");
  res.setHeader("Cache-Control", "public, max-age=3600");
  try {
    const custom = await prisma.websiteSetting.findUnique({ where: { key: "custom_robots_txt" } });
    if (custom && custom.value && custom.value.trim().length > 10) {
      return res.send(custom.value);
    }
  } catch {}

  return res.send(`# Kinglet Bangladesh Ltd - Production Robots.txt for Search Engine Crawlers
# Official Canonical Domain: https://www.kingletbd.com/

User-agent: *
Allow: /
Allow: /category/
Allow: /product/
Allow: /flash-sale
Allow: /offers
Allow: /interior
Allow: /showrooms
Allow: /warranty-care
Allow: /faq
Allow: /about-us
Allow: /privacy-policy
Allow: /warranty-terms
Allow: /exchange-return
Allow: /delivery
Allow: /care-maintenance
Allow: /contact

# Private User Sessions, Cart & Checkout (Disallow indexing)
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /cart
Disallow: /checkout
Disallow: /order-confirmation
Disallow: /order-confirmation/
Disallow: /account
Disallow: /login
Disallow: /register
Disallow: /track-order

# Internal parameter filters & search queries to avoid duplicate content
Disallow: /*?search=*
Disallow: /*&search=*

# XML Sitemap
Sitemap: https://www.kingletbd.com/sitemap.xml
`);
});

/**
 * GET /api/v1/seo/google-merchant-feed.xml
 * Official Google Merchant Center Product Feed (RSS 2.0 / XML)
 */
router.get("/google-merchant-feed.xml", async (req, res, next) => {
  try {
    const xml = await seoService.generateGoogleMerchantFeed();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=3600");
    return res.send(xml);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/seo/metadata
 * Public lookup for page / product / category SEO metadata
 */
router.get("/metadata", async (req, res, next) => {
  try {
    const { route, productId, categoryId, blogPostId } = req.query;
    const metadata = await seoService.getSeoMetadata({
      route: route ? String(route) : undefined,
      productId: productId ? String(productId) : undefined,
      categoryId: categoryId ? String(categoryId) : undefined,
      blogPostId: blogPostId ? String(blogPostId) : undefined,
    });

    return sendSuccess(res, metadata);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/seo/redirects/resolve
 * Public resolver to detect 301 / 302 redirects
 */
router.get("/redirects/resolve", async (req, res, next) => {
  try {
    const { path: reqPath } = req.query;
    if (!reqPath) return sendError(res, "Query parameter 'path' is required", 400);

    const redirect = await seoService.resolveRedirect(String(reqPath));
    if (!redirect) {
      return sendSuccess(res, { hasRedirect: false });
    }

    return sendSuccess(res, {
      hasRedirect: true,
      targetPath: redirect.targetPath,
      statusCode: redirect.statusCode,
    });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// ADMIN SEO MANAGEMENT ENDPOINTS (PROTECTED RBAC)
// -------------------------------------------------------------

/**
 * GET /api/v1/admin/seo/matrix
 */
router.get(
  "/admin/seo/matrix",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res, next) => {
    try {
      const matrix = await seoService.getSeoMatrix();
      return sendSuccess(res, matrix);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST & PUT /api/v1/admin/seo/metadata
 */
const handleUpsertSeo = async (req, res, next) => {
  try {
    const schema = z.object({
      id: z.string().optional().nullable(),
      productId: z.string().optional().nullable(),
      categoryId: z.string().optional().nullable(),
      pageRoute: z.string().optional().nullable(),
      title: z.string().min(2, "Title is required"),
      metaDescription: z.string().min(5, "Meta description is required"),
      keywords: z.string().optional().nullable(),
      ogTitle: z.string().optional().nullable(),
      ogDescription: z.string().optional().nullable(),
      ogImage: z.string().optional().nullable(),
      canonicalUrl: z.string().optional().nullable(),
      isNoIndex: z.boolean().default(false),
      isNoFollow: z.boolean().default(false),
      structuredData: z.string().optional().nullable(),
    });

    const data = schema.parse(req.body);
    const saved = await seoService.upsertSeoMetadata(data);
    return sendSuccess(res, saved, "SEO metadata saved successfully!");
  } catch (err) {
    next(err);
  }
};

router.post(
  ["/admin/seo/metadata", "/metadata"],
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  handleUpsertSeo
);

router.put(
  ["/admin/seo/metadata", "/metadata"],
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  handleUpsertSeo
);

/**
 * POST /api/v1/admin/seo/sitemap/regenerate
 */
router.post(
  "/admin/seo/sitemap/regenerate",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res, next) => {
    try {
      const xml = await seoService.generateXmlSitemap();
      return sendSuccess(
        res,
        { generatedAt: new Date().toISOString(), sizeBytes: Buffer.byteLength(xml, "utf8") },
        "Sitemap regenerated successfully and written to public/sitemap.xml!"
      );
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/admin/seo/redirects
 */
router.get(
  "/admin/seo/redirects",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res, next) => {
    try {
      const redirects = await seoService.listRedirects();
      return sendSuccess(res, redirects);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/admin/seo/redirects
 */
router.post(
  "/admin/seo/redirects",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res, next) => {
    try {
      const redirectSchema = z.object({
        sourcePath: z.string().min(1, "Source path is required"),
        targetPath: z.string().min(1, "Target path is required"),
        statusCode: z.number().int().default(301),
        notes: z.string().optional().nullable(),
      });

      const data = redirectSchema.parse(req.body);
      const created = await seoService.createRedirect(data);
      return sendSuccess(res, created, "301 Redirect created successfully!");
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/v1/admin/seo/redirects/:id
 */
router.delete(
  "/admin/seo/redirects/:id",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      await seoService.deleteRedirect(id);
      return sendSuccess(res, null, "Redirect deleted successfully");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
