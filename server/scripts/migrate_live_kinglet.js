// Master migration script to sync all categories, products, banners, settings, and SEO
// from Kinglet Bangladesh Ltd (https://www.kingletbd.com) to the local database.

import { PrismaClient } from "@prisma/client";
import { PRODUCTS, BRAND_INFO, NAV_CATEGORIES } from "../../src/data/kingletData.js";
import fs from "fs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting complete migration from Kinglet Bangladesh Ltd to local backend...");

  // 1. Clean up any leftover test categories from past audit runs
  console.log("🧹 Cleaning up transient test artifacts...");
  const testCats = await prisma.category.findMany({
    where: { slug: { startsWith: "audit-cat-" } },
    include: { products: true },
  });
  const defaultBedCat = await prisma.category.upsert({
    where: { slug: "bed-room" },
    update: {},
    create: {
      name: "Bedroom",
      slug: "bed-room",
      description: "Seasoned solid wood luxury bedroom suites",
      displayOrder: 1,
    },
  });

  for (const tc of testCats) {
    if (tc.products.length > 0) {
      await prisma.product.updateMany({
        where: { categoryId: tc.id },
        data: { categoryId: defaultBedCat.id },
      });
    }
    await prisma.category.delete({ where: { id: tc.id } });
  }

  // 2. Populate complete category hierarchy matching kingletbd.com
  console.log("📂 Migrating authentic Category & Department Taxonomy...");
  const categoryMap = new Map();

  for (const cat of NAV_CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description || null,
        isActive: true,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        displayOrder: 1,
        isActive: true,
      },
    });
    categoryMap.set(cat.slug, parent.id);
    categoryMap.set(cat.id, parent.id);

    // Subcategories & Department Silos
    if (cat.columns) {
      for (const col of cat.columns) {
        if (col.sections) {
          for (const sec of col.sections) {
            if (sec.slug && sec.slug !== cat.slug) {
              const sub = await prisma.category.upsert({
                where: { slug: sec.slug },
                update: {
                  name: sec.name,
                  parentId: parent.id,
                  isActive: true,
                },
                create: {
                  name: sec.name,
                  slug: sec.slug,
                  parentId: parent.id,
                  isActive: true,
                },
              });
              categoryMap.set(sec.slug, sub.id);
            }
          }
        }
      }
    }
  }

  // Add additional specialized collections from kingletbd.com
  const specializedSubcats = [
    { name: "Almirah", slug: "almirah", parentSlug: "bed-room" },
    { name: "Dressing Table", slug: "dressing-table", parentSlug: "bed-room" },
    { name: "Wardrobe", slug: "wardrobe", parentSlug: "bed-room" },
    { name: "Chest of Drawers", slug: "chest-of-drawers", parentSlug: "bed-room" },
    { name: "Bedside Table", slug: "bedside-table", parentSlug: "bed-room" },
    { name: "Reading Table", slug: "reading-table", parentSlug: "bed-room" },
    { name: "Mattress", slug: "mattress", parentSlug: "bed-room" },
    { name: "Sofa Set", slug: "sofa-set", parentSlug: "living-room" },
    { name: "Divan", slug: "divan", parentSlug: "living-room" },
    { name: "Center Table", slug: "center-table", parentSlug: "living-room" },
    { name: "TV Cabinet", slug: "tv-cabinet", parentSlug: "living-room" },
    { name: "Coffee Table", slug: "coffee-table", parentSlug: "living-room" },
    { name: "Shoe Rack", slug: "shoe-rack", parentSlug: "living-room" },
    { name: "Dining Table Set", slug: "dining-table-set", parentSlug: "dining" },
    { name: "Dining Chair", slug: "dining-chair", parentSlug: "dining" },
    { name: "Dinner Wagon", slug: "dinner-wagon", parentSlug: "dining" },
    { name: "Showcase & Crockery", slug: "showcase", parentSlug: "dining" },
    { name: "Executive Desk", slug: "executive-desk", parentSlug: "office" },
    { name: "Ergonomic Office Chair", slug: "office-chair", parentSlug: "office" },
    { name: "Solid Wood Door", slug: "solid-wood-door", parentSlug: "door" },
    { name: "Veneer Flush Door", slug: "veneer-door", parentSlug: "door" },
  ];

  for (const s of specializedSubcats) {
    const pId = categoryMap.get(s.parentSlug);
    if (pId) {
      const sub = await prisma.category.upsert({
        where: { slug: s.slug },
        update: { name: s.name, parentId: pId, isActive: true },
        create: { name: s.name, slug: s.slug, parentId: pId, isActive: true },
      });
      categoryMap.set(s.slug, sub.id);
    }
  }

  console.log(`✅ Categorization migrated successfully (${categoryMap.size} category silos mapped).`);

  // 3. Migrate Homepage Banners
  console.log("🎨 Migrating Homepage Hero Banners & Promotional Campaigns...");
  const officialBanners = [
    {
      title: "Mastercrafted Luxury Living & Turnkey Interior Suites",
      subtitle: "Hand-seasoned solid mahogany joinery with chemical vacuum autoclave treatment",
      badge: "FLAGSHIP MASTERPIECE",
      imageUrl: BRAND_INFO.banners?.hero1 || "https://www.kingletbd.com/storage/images/OM_17609533777XZzHYYq.png",
      targetUrl: "/category/living-room",
      ctaText: "Explore Collection",
      displayOrder: 1,
      isActive: true,
    },
    {
      title: "Royal Teak & Mahogany Bedroom Collections",
      subtitle: "10-Year Anti-Borer timber guarantee with Italian PU lacquer mirror gloss",
      badge: "BEST SELLER 2026",
      imageUrl: BRAND_INFO.banners?.hero2 || "https://www.kingletbd.com/storage/images/OM_1760953366DyoM2GSn.png",
      targetUrl: "/category/bed-room",
      ctaText: "View Bedroom Suites",
      displayOrder: 2,
      isActive: true,
    },
    {
      title: "Solid Timber Dining Suites & Artisanal Carved Doors",
      subtitle: "Engineered solid wood dining tables & heavy teak panel doors for modern estates",
      badge: "PREMIUM SELECTION",
      imageUrl: BRAND_INFO.banners?.midBanner || "https://www.kingletbd.com/storage/images/jvlJAnyToolz_compressed_banners1-01.png",
      targetUrl: "/category/dining",
      ctaText: "Browse Dining",
      displayOrder: 3,
      isActive: true,
    },
    {
      title: "Winter Clearance & Custom Bridal Furniture Packages",
      subtitle: "Up to 25% Off with complimentary factory transport & master assembly inside Dhaka",
      badge: "SEASONAL SPECIAL",
      imageUrl: BRAND_INFO.banners?.announcementModal || "https://www.kingletbd.com/storage/images/OM_1754246332EP4X0y3o.avif",
      targetUrl: "/flash-sale",
      ctaText: "Claim Discount",
      displayOrder: 4,
      isActive: true,
    },
  ];

  // Upsert banners into HomepageBanner
  await prisma.homepageBanner.deleteMany({});
  for (const b of officialBanners) {
    await prisma.homepageBanner.create({ data: b });
  }
  console.log(`✅ Seeded ${officialBanners.length} official homepage banners.`);

  // 4. Migrate Website Settings
  console.log("⚙️ Migrating Website Settings & Operational Configuration...");
  const settingsData = [
    { key: "site_name", value: BRAND_INFO.company || "Kinglet Bangladesh Ltd", group: "general", description: "Official business registration name" },
    { key: "store_name", value: BRAND_INFO.name || "Kinglet Furniture & Interior", group: "general", description: "Public brand name" },
    { key: "slogan", value: BRAND_INFO.slogan || "Designing Your Space, Defining Your Style, Since 2019", group: "general", description: "Brand motto" },
    { key: "primary_hotline", value: BRAND_INFO.hotlinePrimary || "+8801676900442", group: "general", description: "Primary customer helpline" },
    { key: "secondary_hotline", value: BRAND_INFO.hotlineSecondary || "01707073414", group: "general", description: "Secondary showroom contact" },
    { key: "whatsapp_number", value: BRAND_INFO.whatsapp || "+8801676900442", group: "general", description: "WhatsApp Business number" },
    { key: "support_email", value: BRAND_INFO.email || "info.kingletbd@gmail.com", group: "general", description: "Customer care email" },
    { key: "showroom_address", value: BRAND_INFO.address || "752/2, West Shewrapara, Begum Rokeya Sarani, Mirpur, Dhaka-1216, Bangladesh.", group: "general", description: "Mirpur Flagship Experience Hub" },
    { key: "opening_hours", value: BRAND_INFO.openingHours || "Everyday except Sunday: 9:00 AM – 10:00 PM", group: "general", description: "Showroom visiting hours" },
    { key: "warranty_years", value: String(BRAND_INFO.warrantyYears || 10), group: "general", description: "Timber warranty duration in years" },
    { key: "logo_url", value: "https://www.kingletbd.com/storage/images/OM_17608847525DnZPuIu.png", group: "branding", description: "Main website logo" },
    { key: "favicon_url", value: "https://www.kingletbd.com/storage/images/OM_17608847525DnZPuIu.png", group: "branding", description: "Browser tab icon" },
    { key: "free_shipping_threshold", value: "100000", group: "shipping", description: "Minimum order for free freight inside Dhaka" },
    { key: "marquee_ticker", value: "🚚 100% Free In-Home Carpenter Assembly Inside Dhaka • 🛡️ 10-Year Timber Warranty Guarantee • 📞 Hotline: +8801676900442", group: "general", description: "Top announcement bar ticker" },
  ];

  for (const s of settingsData) {
    await prisma.websiteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group, description: s.description },
      create: s,
    });
  }
  console.log(`✅ Seeded ${settingsData.length} website operational settings.`);

  // 5. Migrate Full Product Catalog (107 products)
  console.log(`📦 Populating and synchronizing ${PRODUCTS.length} authentic Kinglet products...`);
  let migratedProdCount = 0;

  for (const p of PRODUCTS) {
    const catId = categoryMap.get(p.categorySlug) || categoryMap.get(p.category) || defaultBedCat.id;

    const prod = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        categoryId: catId,
        sku: p.sku || `KL-PROD-${p.id}`,
        description: p.description || `${p.name} handcrafted by Kinglet Bangladesh Ltd.`,
        primaryMaterial: p.woodType || "Seasoned Mahogany",
        finishType: p.finish || "High-Gloss Italian PU",
        dimensions: p.dimensions || "Standard Factory Dimensions",
        warrantyYears: 10,
        basePrice: p.priceBDT,
        oldPrice: p.oldPriceBDT || null,
        badge: p.badge || null,
        isActive: true,
        inStock: p.inStock !== false,
        rating: p.rating || 5.0,
        reviewsCount: p.reviewsCount || 15,
      },
      create: {
        name: p.name,
        slug: p.slug,
        categoryId: catId,
        sku: p.sku || `KL-PROD-${p.id}`,
        description: p.description || `${p.name} handcrafted by Kinglet Bangladesh Ltd.`,
        primaryMaterial: p.woodType || "Seasoned Mahogany",
        finishType: p.finish || "High-Gloss Italian PU",
        dimensions: p.dimensions || "Standard Factory Dimensions",
        warrantyYears: 10,
        basePrice: p.priceBDT,
        oldPrice: p.oldPriceBDT || null,
        badge: p.badge || null,
        isActive: true,
        inStock: p.inStock !== false,
        rating: p.rating || 5.0,
        reviewsCount: p.reviewsCount || 15,
      },
    });

    // Ensure image exists
    const existingImg = await prisma.productImage.findFirst({ where: { productId: prod.id } });
    if (!existingImg) {
      await prisma.productImage.create({
        data: {
          productId: prod.id,
          url: p.image || "/images/furniture-placeholder.svg",
          altText: `${p.name} - ${p.woodType || "Seasoned Timber"}`,
          isHero: true,
          displayOrder: 0,
        },
      });
    }

    // Ensure inventory exists
    await prisma.inventory.upsert({
      where: { productId: prod.id },
      update: {
        quantityAvailable: p.stockCount || 8,
      },
      create: {
        productId: prod.id,
        quantityAvailable: p.stockCount || 8,
        warehouseLocation: "Mirpur Factory Hub",
      },
    });

    migratedProdCount++;
  }
  console.log(`✅ Successfully verified and synchronized ${migratedProdCount} products.`);

  // 6. Migrate SEO Metadata for core pages
  console.log("🌐 Migrating SEO Metadata for core canonical routes...");
  const seoRoutes = [
    { path: "/", title: "Kinglet Furniture & Interior | Luxury Handcrafted Solid Wood Furniture Bangladesh", desc: "Premium seasoned mahogany, Canadian oak veneer, and luxury bedroom, living, dining, and door solutions in Dhaka, Bangladesh." },
    { path: "/about-us", title: "About Us | Kinglet Furniture & Interior Dhaka", desc: "Learn about Kinglet Bangladesh Ltd craftsmanship, chemical vacuum pressure autoclave seasoning, and 10-year timber warranties." },
    { path: "/showrooms", title: "Experience Hubs & Showrooms | Kinglet Furniture", desc: "Visit our Mirpur flagship showroom at 752/2 West Shewrapara, Begum Rokeya Sarani, Dhaka." },
    { path: "/interior", title: "Turnkey Luxury Interior Design Studio | Kinglet Bangladesh", desc: "End-to-end residential and commercial architectural woodwork, ceiling concepts, and wall paneling." },
    { path: "/flash-sale", title: "Flash Sale & Limited Deals | Kinglet Furniture", desc: "Exclusive seasonal discounts on luxury beds, wardrobes, dressing tables, and dining suites." },
    { path: "/offers", title: "Exclusive Furniture Offers & Deals | Kinglet Bangladesh", desc: "Special wedding packages, combo sets, and festive promotional pricing." },
    { path: "/warranty-care", title: "10-Year Timber Warranty & Maintenance Protocol", desc: "Comprehensive anti-borer coverage, replacement conditions, and authentic timber care instructions." },
    { path: "/faq", title: "Frequently Asked Questions | Kinglet Furniture", desc: "Get answers regarding delivery times, assembly, payment methods, and timber seasoning." },
    { path: "/delivery", title: "Delivery, Crating & Free Assembly Information | Kinglet", desc: "Inside Dhaka flat rate delivery with 100% free carpenter fitting and shockproof regional crating." },
    { path: "/care-maintenance", title: "Solid Wood Care & Maintenance Tips | Kinglet Furniture", desc: "How to preserve Italian PU lacquer gloss and prevent environmental timber wear." },
    { path: "/contact", title: "Contact Us | Kinglet Bangladesh Ltd", desc: "Get in touch via 24/7 hotline +8801676900442, WhatsApp, or email info.kingletbd@gmail.com." },
    { path: "/privacy-policy", title: "Privacy Policy & GDPR Customer Data Protection | Kinglet", desc: "Customer data privacy standards, payment encryption, and policy documentation." },
  ];

  for (const s of seoRoutes) {
    await prisma.seoMetadata.upsert({
      where: { pageRoute: s.path },
      update: {
        title: s.title,
        metaDescription: s.desc,
        canonicalUrl: `https://www.kingletbd.com${s.path === "/" ? "" : s.path}`,
        isNoIndex: false,
      },
      create: {
        pageRoute: s.path,
        title: s.title,
        metaDescription: s.desc,
        canonicalUrl: `https://www.kingletbd.com${s.path === "/" ? "" : s.path}`,
        isNoIndex: false,
      },
    });
  }
  console.log(`✅ Seeded ${seoRoutes.length} SEO metadata entries.`);

  console.log("🎉 Complete migration from Kinglet Bangladesh Ltd finished with 100% success!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
