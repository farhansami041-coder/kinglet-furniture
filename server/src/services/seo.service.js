import fs from "fs";
import path from "path";
import prisma from "../db/prisma.js";

const BASE_URL = process.env.SITE_URL || "https://www.kingletbd.com";

const STATIC_INDEXABLE_PAGES = [
  {
    path: "",
    changefreq: "daily",
    priority: "1.0",
    title: "Kinglet Furniture & Interior | Luxury Handcrafted Wooden Furniture Bangladesh",
    metaDescription: "Discover luxury solid wood furniture in Bangladesh. Seasoned Mahogany, Black Plum Wood & Canadian Oak Veneer. 10-Year Timber Warranty with free home assembly.",
  },
  {
    path: "flash-sale",
    changefreq: "daily",
    priority: "0.9",
    title: "Flash Sale & Limited Offers | Kinglet Furniture Bangladesh",
    metaDescription: "Exclusive limited-time flash sale on premium bedroom sets, sofas, dining tables, and almirahs. Save up to 25% with free delivery and installation in Dhaka.",
  },
  {
    path: "offers",
    changefreq: "weekly",
    priority: "0.85",
    title: "Exclusive Furniture Offers & Deals | Kinglet Furniture",
    metaDescription: "Explore bridal package combos and seasonal deals on royal solid wood bedroom suites, wardrobes, and luxury living room furniture in Bangladesh.",
  },
  {
    path: "interior",
    changefreq: "weekly",
    priority: "0.85",
    title: "Turnkey Luxury Interior Design Studio | Kinglet Bangladesh",
    metaDescription: "Bespoke architectural interior design and custom solid wood cabinetry for luxury apartments, villas, and executive corporate offices in Dhaka.",
  },
  {
    path: "showrooms",
    changefreq: "weekly",
    priority: "0.8",
    title: "Kinglet Furniture Showrooms & Experience Hubs | Dhaka",
    metaDescription: "Visit our flagship experience center at 752/2 West Shewrapara, Mirpur, Dhaka. Touch and feel authentic seasoned timber craftsmanship in person.",
  },
  {
    path: "warranty-care",
    changefreq: "monthly",
    priority: "0.7",
    title: "10-Year Timber Warranty & Maintenance Guide | Kinglet",
    metaDescription: "Complete guide to Kinglet's 10-Year Anti-Borer Guarantee, vacuum pressure kiln-seasoning process, and authentic Italian PU lacquer maintenance.",
  },
  {
    path: "about-us",
    changefreq: "monthly",
    priority: "0.7",
    title: "About Kinglet Furniture & Interior | Timber Craftsmanship",
    metaDescription: "Founded on authentic master craftsmanship, Kinglet specializes in generational solid timber furniture handcrafted by Bangladesh's finest artisans.",
  },
  {
    path: "faq",
    changefreq: "monthly",
    priority: "0.7",
    title: "Frequently Asked Questions | Kinglet Furniture BD",
    metaDescription: "Answers to common questions about wood seasoning, custom sizes, order delivery timelines, payment options, and 10-year timber warranty coverage.",
  },
  {
    path: "delivery",
    changefreq: "monthly",
    priority: "0.7",
    title: "Delivery, Crating & Free Assembly Information | Kinglet",
    metaDescription: "Nationwide safe transport with 3-layer shockproof crating. Free carpenter fitting and assembly inside Dhaka within 24 to 48 business hours.",
  },
  {
    path: "care-maintenance",
    changefreq: "monthly",
    priority: "0.7",
    title: "Solid Wood Care & Maintenance Tips | Kinglet",
    metaDescription: "Professional tips to maintain your solid wood furniture's Italian PU finish, prevent moisture damage, and preserve heirloom luster for decades.",
  },
  {
    path: "privacy-policy",
    changefreq: "yearly",
    priority: "0.5",
    title: "Privacy Policy | Kinglet Bangladesh Ltd",
    metaDescription: "Official privacy policy and customer data protection guidelines for Kinglet Furniture & Interior shoppers and showroom clients in Bangladesh.",
  },
  {
    path: "warranty-terms",
    changefreq: "yearly",
    priority: "0.6",
    title: "Official 10-Year Warranty Terms | Kinglet Bangladesh Ltd",
    metaDescription: "Comprehensive warranty terms, anti-borer inspection terms, structural timber coverage, and replacement conditions for Kinglet furniture.",
  },
  {
    path: "exchange-return",
    changefreq: "monthly",
    priority: "0.6",
    title: "Exchange & Return Policy | Kinglet Furniture",
    metaDescription: "Hassle-free 7-day exchange and return policy for eligible Kinglet furniture items. Quality inspection guarantee and customer satisfaction promise.",
  },
  {
    path: "contact",
    changefreq: "monthly",
    priority: "0.8",
    title: "Contact Us & Helpline | Kinglet Furniture",
    metaDescription: "Get in touch with Kinglet Furniture. Call hotline +8801676900442 or WhatsApp for bespoke orders, showroom visits, and interior consultations.",
  },
];

// Inappropriate private routes that must NEVER be in sitemaps or indexed
const PRIVATE_DISALLOWED_PATHS = [
  "/cart",
  "/checkout",
  "/admin",
  "/account",
  "/login",
  "/register",
  "/track-order",
  "/order-confirmation",
];

function escapeXml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export class SeoService {
  /**
   * 1. Get SEO Metadata for a page route, product ID, or category ID
   */
  async getSeoMetadata({ route, productId, categoryId, blogPostId }) {
    let metadata = null;

    if (productId) {
      metadata = await prisma.seoMetadata.findUnique({ where: { productId } });
    } else if (categoryId) {
      metadata = await prisma.seoMetadata.findUnique({ where: { categoryId } });
    } else if (blogPostId) {
      metadata = await prisma.seoMetadata.findUnique({ where: { blogPostId } });
    } else if (route) {
      const cleanRoute = route.startsWith("/") ? route : `/${route}`;
      metadata = await prisma.seoMetadata.findUnique({ where: { pageRoute: cleanRoute } });
    }

    if (metadata) {
      return metadata;
    }

    // Default Fallbacks from Entity Data
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { images: { take: 1 } },
      });
      if (product) {
        return {
          title: `${product.name} Price in Bangladesh | Kinglet Furniture`,
          metaDescription: `Buy authentic ${product.name} handcrafted from seasoned ${product.primaryMaterial} with Italian PU finish. Price: ৳${product.basePrice.toLocaleString()}. 10-Year Timber Warranty.`,
          canonicalUrl: `${BASE_URL}/product/${product.slug}`,
          ogImage: product.images[0]?.url || `${BASE_URL}/images/furniture-placeholder.svg`,
          isNoIndex: !product.isActive,
        };
      }
    }

    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (cat) {
        return {
          title: cat.metaTitle || `${cat.name} Collection in Bangladesh | Kinglet Furniture`,
          metaDescription: cat.metaDesc || `Explore handcrafted solid wood ${cat.name} made with seasoned Mahogany & Oak Veneer by Kinglet Bangladesh Ltd. Free home assembly in Dhaka.`,
          canonicalUrl: `${BASE_URL}/category/${cat.slug}`,
          ogImage: cat.imageUrl || `${BASE_URL}/images/furniture-placeholder.svg`,
          isNoIndex: !cat.isActive,
        };
      }
    }

    // Static Page Default
    const cleanRoutePath = (route || "").replace(/^\/+/, "");
    const staticMatch = STATIC_INDEXABLE_PAGES.find((p) => p.path === cleanRoutePath);

    return {
      title: staticMatch?.title || "Kinglet Furniture & Interior | Luxury Handcrafted Wooden Furniture Bangladesh",
      metaDescription: "Handcrafted seasoned solid Mahogany, Black Plum Wood & Oak Veneer luxury furniture in Bangladesh. 10-Year Anti-Borer Guarantee & Free White-Glove Installation.",
      canonicalUrl: cleanRoutePath ? `${BASE_URL}/${cleanRoutePath}` : `${BASE_URL}/`,
      ogImage: `${BASE_URL}/images/OM_1753368121t7dN8oFl.jpg`,
      isNoIndex: PRIVATE_DISALLOWED_PATHS.some((p) => route?.startsWith(p)),
    };
  }

  /**
   * 2. Upsert SEO Metadata
   */
  async upsertSeoMetadata(data) {
    const {
      id,
      productId,
      categoryId,
      blogPostId,
      pageRoute,
      title,
      metaDescription,
      keywords,
      ogTitle,
      ogDescription,
      ogImage,
      canonicalUrl,
      isNoIndex,
      isNoFollow,
      structuredData,
    } = data;

    const payload = {
      title,
      metaDescription,
      keywords: keywords || null,
      ogTitle: ogTitle || null,
      ogDescription: ogDescription || null,
      ogImage: ogImage || null,
      canonicalUrl: canonicalUrl || null,
      isNoIndex: Boolean(isNoIndex),
      isNoFollow: Boolean(isNoFollow),
      structuredData: structuredData || null,
    };

    if (id) {
      return await prisma.seoMetadata.update({
        where: { id },
        data: payload,
      });
    }

    if (productId) {
      return await prisma.seoMetadata.upsert({
        where: { productId },
        update: payload,
        create: { ...payload, productId },
      });
    }

    if (categoryId) {
      return await prisma.seoMetadata.upsert({
        where: { categoryId },
        update: payload,
        create: { ...payload, categoryId },
      });
    }

    if (pageRoute) {
      const cleanRoute = pageRoute.startsWith("/") ? pageRoute : `/${pageRoute}`;
      return await prisma.seoMetadata.upsert({
        where: { pageRoute: cleanRoute },
        update: payload,
        create: { ...payload, pageRoute: cleanRoute },
      });
    }

    throw new Error("Target route, productId, or categoryId must be specified for SEO metadata.");
  }

  /**
   * 3. Generate Valid XML Sitemap from Database
   * Filters out inactive, noindex, and private disallowed URLs.
   */
  async generateXmlSitemap() {
    const today = new Date().toISOString().split("T")[0];

    // Fetch active categories with SEO flags
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: { seoMetadata: true },
      orderBy: { displayOrder: "asc" },
    });

    // Fetch active products with SEO flags & hero images
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: { orderBy: { displayOrder: "asc" } },
        seoMetadata: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n\n`;

    // Static Pages
    for (const page of STATIC_INDEXABLE_PAGES) {
      const loc = page.path ? `${BASE_URL}/${page.path}` : `${BASE_URL}/`;
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(loc)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Categories (excluding noindex)
    for (const cat of categories) {
      if (cat.seoMetadata?.isNoIndex) continue;
      const catUrl = cat.seoMetadata?.canonicalUrl || `${BASE_URL}/category/${cat.slug}`;
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(catUrl)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    }

    // Products (excluding noindex)
    for (const prod of products) {
      if (prod.seoMetadata?.isNoIndex) continue;
      const prodUrl = prod.seoMetadata?.canonicalUrl || `${BASE_URL}/product/${prod.slug}`;
      const heroImage = prod.images[0]?.url;

      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(prodUrl)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.85</priority>\n`;

      if (heroImage) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(heroImage)}</image:loc>\n`;
        xml += `      <image:title>${escapeXml(prod.name)}</image:title>\n`;
        xml += `      <image:caption>${escapeXml(
          `${prod.name} - Handcrafted from ${prod.primaryMaterial}. ৳${prod.basePrice.toLocaleString()} BDT. 10-Year Timber Warranty.`
        )}</image:caption>\n`;
        xml += `    </image:image>\n`;
      }

      xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;

    // Also persist to public directory if accessible
    try {
      const publicPath = path.resolve("public/sitemap.xml");
      fs.writeFileSync(publicPath, xml, "utf8");
    } catch {
      // Ignore write error if running in restricted container
    }

    return xml;
  }

  /**
   * 4. Generate Official Google Merchant Center Product Feed (RSS 2.0 / XML)
   */
  async generateGoogleMerchantFeed() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        images: { orderBy: { displayOrder: "asc" } },
        inventory: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>Kinglet Furniture &amp; Interior - Official Product Feed</title>\n`;
    xml += `    <link>${BASE_URL}</link>\n`;
    xml += `    <description>Handcrafted luxury furniture catalog for Google Shopping &amp; Merchant Center</description>\n`;

    for (const prod of products) {
      const prodUrl = `${BASE_URL}/product/${prod.slug}`;
      const imageUrl = prod.images[0]?.url || `${BASE_URL}/images/furniture-placeholder.svg`;
      const isAvailable = (prod.inventory?.quantityAvailable ?? 10) > 0;
      const availabilityStr = isAvailable ? "in_stock" : "out_of_stock";

      xml += `    <item>\n`;
      xml += `      <g:id>${escapeXml(prod.sku)}</g:id>\n`;
      xml += `      <g:title>${escapeXml(prod.name)}</g:title>\n`;
      xml += `      <g:description>${escapeXml(prod.description)}</g:description>\n`;
      xml += `      <g:link>${escapeXml(prodUrl)}</g:link>\n`;
      xml += `      <g:image_link>${escapeXml(imageUrl)}</g:image_link>\n`;
      xml += `      <g:condition>new</g:condition>\n`;
      xml += `      <g:availability>${availabilityStr}</g:availability>\n`;
      xml += `      <g:price>${prod.basePrice.toFixed(2)} BDT</g:price>\n`;
      if (prod.oldPrice && prod.oldPrice > prod.basePrice) {
        xml += `      <g:sale_price>${prod.basePrice.toFixed(2)} BDT</g:sale_price>\n`;
      }
      xml += `      <g:brand>Kinglet Furniture</g:brand>\n`;
      xml += `      <g:google_product_category>Furniture &gt; ${escapeXml(prod.category.name)}</g:google_product_category>\n`;
      xml += `      <g:material>${escapeXml(prod.primaryMaterial)}</g:material>\n`;
      xml += `      <g:identifier_exists>no</g:identifier_exists>\n`;
      xml += `    </item>\n`;
    }

    xml += `  </channel>\n`;
    xml += `</rss>\n`;

    return xml;
  }

  /**
   * 5. Redirects Management: Resolve 301 / 302 Redirection
   */
  async resolveRedirect(sourcePath) {
    if (!sourcePath) return null;
    const clean = sourcePath.split("?")[0].replace(/\/+$/, "") || "/";

    const redirect = await prisma.urlRedirect.findFirst({
      where: {
        sourcePath: clean,
        isActive: true,
      },
    });

    if (redirect) {
      // Async update hit count
      prisma.urlRedirect.update({
        where: { id: redirect.id },
        data: { hitCount: { increment: 1 } },
      }).catch(() => {});
    }

    return redirect;
  }

  /**
   * 6. Create or Update 301/302 Redirect
   */
  async createRedirect({ sourcePath, targetPath, statusCode = 301, notes }) {
    const cleanSource = sourcePath.split("?")[0].replace(/\/+$/, "") || "/";
    const cleanTarget = targetPath.trim();

    if (cleanSource === cleanTarget) {
      throw new Error("Source path cannot be identical to target path (loop protection).");
    }

    return await prisma.urlRedirect.upsert({
      where: { sourcePath: cleanSource },
      update: {
        targetPath: cleanTarget,
        statusCode: Number(statusCode) || 301,
        notes: notes || null,
        isActive: true,
      },
      create: {
        sourcePath: cleanSource,
        targetPath: cleanTarget,
        statusCode: Number(statusCode) || 301,
        notes: notes || null,
        isActive: true,
      },
    });
  }

  /**
   * 7. List All Redirects
   */
  async listRedirects() {
    return await prisma.urlRedirect.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * 8. Delete Redirect
   */
  async deleteRedirect(id) {
    return await prisma.urlRedirect.delete({
      where: { id },
    });
  }

  /**
   * 9. Fetch SEO Overview Matrix for Admin Dashboard
   */
  async getSeoMatrix() {
    const [products, categories, pageMetas, redirectsCount] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        include: { seoMetadata: true, images: { take: 1 } },
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        include: { seoMetadata: true },
        orderBy: { name: "asc" },
      }),
      prisma.seoMetadata.findMany({
        where: { pageRoute: { not: null } },
      }),
      prisma.urlRedirect.count({ where: { isActive: true } }),
    ]);

    const staticPagesWithMeta = STATIC_INDEXABLE_PAGES.map((p) => {
      const pageRoute = p.path ? `/${p.path}` : "/";
      const custom = pageMetas.find((m) => m.pageRoute === pageRoute);
      return {
        type: "PAGE",
        id: p.path || "home",
        name: p.path ? p.path.toUpperCase() : "HOMEPAGE",
        slug: pageRoute,
        title: custom?.title || p.title,
        metaDescription: custom?.metaDescription || p.metaDescription,
        canonicalUrl: custom?.canonicalUrl || (p.path ? `${BASE_URL}/${p.path}` : `${BASE_URL}/`),
        isNoIndex: custom?.isNoIndex ?? false,
        priority: p.priority,
        hasCustomSeo: Boolean(custom),
      };
    });

    const productsWithMeta = products.map((p) => ({
      type: "PRODUCT",
      id: p.id,
      name: p.name,
      slug: `/product/${p.slug}`,
      sku: p.sku,
      price: p.basePrice,
      title: p.seoMetadata?.title || `${p.name} Price in Bangladesh | Kinglet Furniture`,
      metaDescription: p.seoMetadata?.metaDescription || p.description,
      isNoIndex: p.seoMetadata?.isNoIndex ?? false,
      canonicalUrl: p.seoMetadata?.canonicalUrl || `${BASE_URL}/product/${p.slug}`,
      hasCustomSeo: Boolean(p.seoMetadata),
    }));

    const categoriesWithMeta = categories.map((c) => ({
      type: "CATEGORY",
      id: c.id,
      name: c.name,
      slug: `/category/${c.slug}`,
      title: c.seoMetadata?.title || c.metaTitle || `${c.name} Collection | Kinglet Furniture`,
      metaDescription:
        c.seoMetadata?.metaDescription ||
        c.metaDesc ||
        `Explore handcrafted ${c.name} collection at Kinglet Furniture Bangladesh. Seasoned solid timber, luxury Italian PU lacquer finish, and 10-year timber warranty.`,
      isNoIndex: c.seoMetadata?.isNoIndex ?? false,
      canonicalUrl: c.seoMetadata?.canonicalUrl || `${BASE_URL}/category/${c.slug}`,
      hasCustomSeo: Boolean(c.seoMetadata || c.metaTitle),
    }));

    return {
      summary: {
        totalProducts: products.length,
        totalCategories: categories.length,
        totalStaticPages: STATIC_INDEXABLE_PAGES.length,
        totalIndexableUrls:
          STATIC_INDEXABLE_PAGES.length +
          categories.filter((c) => !c.seoMetadata?.isNoIndex).length +
          products.filter((p) => !p.seoMetadata?.isNoIndex).length,
        active301Redirects: redirectsCount,
      },
      staticPages: staticPagesWithMeta,
      products: productsWithMeta,
      categories: categoriesWithMeta,
    };
  }
}

export const seoService = new SeoService();
