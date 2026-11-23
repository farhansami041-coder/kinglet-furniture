import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PRODUCTS, NAV_CATEGORIES } from "../src/data/kingletData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.resolve(rootDir, "public");

const BASE_URL = "https://www.kingletbd.com";

const staticPages = [
  { path: "", changefreq: "daily", priority: "1.0" },
  { path: "flash-sale", changefreq: "daily", priority: "0.9" },
  { path: "offers", changefreq: "weekly", priority: "0.8" },
  { path: "interior", changefreq: "weekly", priority: "0.85" },
  { path: "showrooms", changefreq: "weekly", priority: "0.8" },
  { path: "warranty-care", changefreq: "monthly", priority: "0.7" },
  { path: "faq", changefreq: "monthly", priority: "0.7" },
  { path: "about-us", changefreq: "monthly", priority: "0.7" },
  { path: "privacy-policy", changefreq: "yearly", priority: "0.5" },
  { path: "warranty-terms", changefreq: "yearly", priority: "0.6" },
  { path: "exchange-return", changefreq: "monthly", priority: "0.6" },
  { path: "delivery", changefreq: "monthly", priority: "0.7" },
  { path: "care-maintenance", changefreq: "monthly", priority: "0.7" },
  { path: "contact", changefreq: "monthly", priority: "0.8" },
];

function escapeXml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateSitemap() {
  const today = new Date().toISOString().split("T")[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n\n`;

  // Static Pages
  staticPages.forEach((p) => {
    const loc = p.path ? `${BASE_URL}/${p.path}` : `${BASE_URL}/`;
    xml += `  <url>\n`;
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
    xml += `    <priority>${p.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  // Nav Categories & Subcategories
  NAV_CATEGORIES.forEach((cat) => {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/category/${cat.slug}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;

    if (cat.subcategories) {
      cat.subcategories.forEach((sub) => {
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/category/${cat.slug}/${sub.slug}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.85</priority>\n`;
        xml += `  </url>\n`;
      });
    }
  });

  // Products
  PRODUCTS.forEach((prod) => {
    const slug = prod.slug || prod.id;
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/product/${slug}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    if (prod.image) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(prod.image)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(prod.name)}</image:title>\n`;
      xml += `      <image:caption>${escapeXml(
        `${prod.name} - Handcrafted from ${prod.woodType || "Seasoned Mahogany & German Oak Veneer"}. Price: BDT ${prod.priceBDT}. 10-Year Timber Warranty.`
      )}</image:caption>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  });

  xml += `</urlset>\n`;

  const sitemapPath = path.join(publicDir, "sitemap.xml");
  fs.writeFileSync(sitemapPath, xml, "utf8");
  console.log(`Successfully generated sitemap at ${sitemapPath} with ${PRODUCTS.length} products and categories.`);
}

generateSitemap();
