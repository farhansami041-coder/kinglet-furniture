// Seed script to populate database with authentic Kinglet data, roles, products, and settings
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PRODUCTS, BRAND_INFO, NAV_CATEGORIES } from "../../src/data/kingletData.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Kinglet database seeding...");

  // 1. Roles & Permissions
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: {
      name: "SUPER_ADMIN",
      description: "Full platform control across financial ledgers, catalog, users, and settings",
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: "STORE_MANAGER" },
    update: {},
    create: {
      name: "STORE_MANAGER",
      description: "Manage catalog, stock levels, orders, and content",
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: "CUSTOMER" },
    update: {},
    create: {
      name: "CUSTOMER",
      description: "Standard registered furniture buyer",
    },
  });

  // 2. Default Admin User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("KingletAdmin@2026", salt);

  const adminUser = await prisma.user.upsert({
    where: { phone: BRAND_INFO.hotlinePrimary },
    update: {},
    create: {
      phone: BRAND_INFO.hotlinePrimary,
      email: BRAND_INFO.email,
      fullName: "Farhan",
      passwordHash: passwordHash,
      isActive: true,
      isVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: superAdminRole.id,
    },
  });

  console.log(`👤 Admin user seeded: ${adminUser.phone} / KingletAdmin@2026`);

  // 3. Shipping Methods
  const shippingMethods = [
    {
      code: "dhaka_flat",
      title: "Inside Dhaka City Express (24-48 Hours)",
      description: "Flat fee inside Dhaka with 100% Free Carpenter Fitting & Assembly",
      baseRate: 500,
      freeAssembly: true,
    },
    {
      code: "outside_dhaka_crate",
      title: "Outside Dhaka Transport (3-5 Days)",
      description: "Dedicated transport with 3-layer shockproof wooden crating",
      baseRate: 2500,
      freeAssembly: false,
    },
    {
      code: "showroom_pickup",
      title: "Mirpur Flagship Showroom Self-Pickup",
      description: "Collect directly from 752/2 West Shewrapara, Mirpur",
      baseRate: 0,
      freeAssembly: false,
    },
  ];

  for (const sm of shippingMethods) {
    await prisma.shippingMethod.upsert({
      where: { code: sm.code },
      update: sm,
      create: sm,
    });
  }

  // 4. Categories & Subcategories
  const categoryMap = new Map();
  for (const cat of NAV_CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description || null,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        displayOrder: 1,
      },
    });
    categoryMap.set(cat.slug, parent.id);
    categoryMap.set(cat.id, parent.id);

    // Seed child sections
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
                },
                create: {
                  name: sec.name,
                  slug: sec.slug,
                  parentId: parent.id,
                },
              });
              categoryMap.set(sec.slug, sub.id);
            }
          }
        }
      }
    }
  }

  // Fallback for default categories
  const fallbackCat = await prisma.category.upsert({
    where: { slug: "bed-room" },
    update: {},
    create: {
      name: "Bedroom",
      slug: "bed-room",
      description: "Seasoned solid wood luxury bedroom suites",
    },
  });

  // 5. Products, Variants & Inventory
  console.log(`📦 Seeding ${PRODUCTS.length} authentic products...`);
  for (const p of PRODUCTS) {
    const catId = categoryMap.get(p.categorySlug) || categoryMap.get(p.category) || fallbackCat.id;

    const product = await prisma.product.upsert({
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
        inStock: p.inStock !== false,
        rating: p.rating || 5.0,
        reviewsCount: p.reviewsCount || 15,
      },
    });

    // Seed Images
    const imgs = p.images && p.images.length > 0 ? p.images : [p.image];
    for (let i = 0; i < imgs.length; i++) {
      const imgUrl = imgs[i];
      if (imgUrl) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: imgUrl,
            altText: `${p.name} - ${p.woodType || "Authentic Wood"}`,
            displayOrder: i,
            isHero: i === 0,
          },
        });
      }
    }

    // Seed Inventory
    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        quantityAvailable: 8,
        quantityReserved: 0,
        lowStockThreshold: 2,
        warehouseLocation: "Mirpur Factory & Showroom Hub",
      },
    });

    // Seed Standard Variants if Bed or Almirah
    const pName = p.name.toLowerCase();
    if (pName.includes("bed") || (p.subcategory && p.subcategory.includes("bed"))) {
      await prisma.productVariant.upsert({
        where: { sku: `${product.sku}-KING` },
        update: {},
        create: {
          productId: product.id,
          sku: `${product.sku}-KING`,
          variantName: "King Size (6.5 ft x 6.0 ft)",
          priceAdjustment: 0,
          finalPrice: product.basePrice,
          stockQuantity: 5,
        },
      });

      await prisma.productVariant.upsert({
        where: { sku: `${product.sku}-QUEEN` },
        update: {},
        create: {
          productId: product.id,
          sku: `${product.sku}-QUEEN`,
          variantName: "Queen Size (6.5 ft x 5.0 ft)",
          priceAdjustment: -3000,
          finalPrice: Math.max(1000, product.basePrice - 3000),
          stockQuantity: 3,
        },
      });
    }
  }

  // 6. Coupons
  const couponsToSeed = [
    {
      code: "KINGLET10",
      discountType: "PERCENT",
      discountValue: 10,
      minOrderValue: 20000,
      maxDiscount: 5000,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      usageLimit: 1000,
      isActive: true,
    },
    {
      code: "KINGLET15",
      discountType: "PERCENT",
      discountValue: 15,
      minOrderValue: 50000,
      maxDiscount: 10000,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      usageLimit: 500,
      isActive: true,
    },
    {
      code: "KINGLET2026",
      discountType: "FLAT_BDT",
      discountValue: 2000,
      minOrderValue: 40000,
      maxDiscount: null,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      usageLimit: 500,
      isActive: true,
    },
    {
      code: "EIDSPECIAL",
      discountType: "PERCENT",
      discountValue: 10,
      minOrderValue: 30000,
      maxDiscount: 10000,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      usageLimit: 1000,
      isActive: true,
    },
  ];

  for (const c of couponsToSeed) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }

  // 7. Homepage CMS Banners
  const bannersToSeed = [
    {
      title: "Timeless Craftsmanship, Built for Generations",
      subtitle: "Kiln-dried timber with 10-year anti-borer guarantee and nationwide safe delivery across Bangladesh.",
      badge: "Official Kinglet Flagship 2026",
      imageUrl: BRAND_INFO.banners?.hero1 || "/images/banners/hero-1.jpg",
      targetUrl: "/category/all",
      ctaText: "Explore All Collections",
      displayOrder: 1,
      isActive: true,
    },
    {
      title: "The Royal Bridal Bedroom Suites",
      subtitle: "Harmonious king beds, 4-door almirahs, and vanities bundled at exclusive package savings up to ৳25,000.",
      badge: "Master Bridal Bedroom",
      imageUrl: BRAND_INFO.banners?.hero2 || "/images/banners/hero-2.jpg",
      targetUrl: "/offers",
      ctaText: "View Bridal Packages",
      displayOrder: 2,
      isActive: true,
    },
  ];

  for (const b of bannersToSeed) {
    const existing = await prisma.homepageBanner.findFirst({ where: { title: b.title } });
    if (!existing) {
      await prisma.homepageBanner.create({ data: b });
    }
  }

  // 8. Website Settings
  const settings = [
    { key: "site_name", value: "Kinglet Furniture & Interior", group: "general" },
    { key: "primary_hotline", value: BRAND_INFO.hotlinePrimary, group: "general" },
    { key: "whatsapp_number", value: BRAND_INFO.whatsapp, group: "general" },
    { key: "showroom_address", value: BRAND_INFO.address, group: "general" },
    { key: "free_shipping_threshold", value: "100000", group: "shipping" },
    { key: "marquee_announcement", value: "EID & FESTIVE PREVIEW: Enjoy up to 20% savings on Seasoned Mahogany, Black Plum Wood & Oak suites.", group: "general" },
  ];

  for (const s of settings) {
    await prisma.websiteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

