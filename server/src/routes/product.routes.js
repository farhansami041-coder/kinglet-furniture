import express from "express";
import prisma from "../db/prisma.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/response.js";
import cache from "../utils/cache.js";

const router = express.Router();

/**
 * GET /api/v1/products
 * Multi-faceted filtering, searching, sorting & pagination
 */
router.get("/", async (req, res, next) => {
  try {
    const cacheKey = `products:query:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
      return sendPaginated(res, cached.formatted, cached.total, cached.page, cached.limit);
    }

    const {
      category,
      sub,
      subcategory,
      wood,
      minPrice,
      maxPrice,
      inStock,
      minRating,
      search,
      isOffer,
      isNewArrival,
      isShowroomClassic,
      placement,
      sort = "featured",
      page = 1,
      limit = 250,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit) || 250;

    // Build Prisma where filter
    const where = {
      isActive: true,
    };

    // Category filter with slug variants & hierarchy
    if (category && category !== "all") {
      const cleanSlug = category.trim().toLowerCase();
      const slugVariants = [cleanSlug];
      if (cleanSlug === "bedroom") slugVariants.push("bed-room");
      if (cleanSlug === "bed-room") slugVariants.push("bedroom");
      if (cleanSlug === "living-room") slugVariants.push("livingroom", "living");
      if (cleanSlug === "livingroom") slugVariants.push("living-room", "living");
      if (cleanSlug === "kids-room") slugVariants.push("kidsroom", "kids");
      if (cleanSlug === "kidsroom") slugVariants.push("kids-room", "kids");

      where.OR = [
        { category: { slug: { in: slugVariants } } },
        { category: { parent: { slug: { in: slugVariants } } } },
        { category: { parent: { parent: { slug: { in: slugVariants } } } } },
        { category: { name: { contains: cleanSlug } } },
      ];
    }

    const subFilter = sub || subcategory;
    if (subFilter && subFilter !== "all") {
      const cleanSub = subFilter.trim().toLowerCase();
      const subSlug = cleanSub.replace(/\s+/g, "-");
      const subVariants = Array.from(new Set([cleanSub, subSlug]));
      if (cleanSub === "bed") subVariants.push("bed");
      if (cleanSub === "dressing-table" || cleanSub === "dressing table") subVariants.push("dressing-table", "dressing table");
      if (cleanSub === "almirah") subVariants.push("almirah", "almira");
      if (cleanSub === "sofa-set" || cleanSub === "sofa set" || cleanSub === "sofa") subVariants.push("sofa-set", "sofa set", "sofa");
      if (cleanSub === "center-table" || cleanSub === "center table") subVariants.push("center-table", "center table");
      if (cleanSub === "dining-table-set" || cleanSub === "dining table set") subVariants.push("dining-table-set", "dining table set");

      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { category: { slug: { in: subVariants } } },
            { category: { name: { in: subVariants } } },
            { category: { parent: { slug: { in: subVariants } } } },
            { category: { parent: { name: { in: subVariants } } } },
          ],
        },
      ];
    }

    const childFilter = req.query.child || req.query.childCategory;
    if (childFilter && childFilter !== "all") {
      const cleanChild = childFilter.trim().toLowerCase();
      const childSlug = cleanChild.replace(/\s+/g, "-");
      const childVariants = Array.from(new Set([cleanChild, childSlug]));

      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { category: { slug: { in: childVariants } } },
            { category: { name: { in: childVariants } } },
          ],
        },
      ];
    }

    // Material filter (Kinglet's 5 authentic materials)
    if (wood && wood !== "all") {
      const woodQuery = String(wood).toLowerCase();
      if (woodQuery === "mahogany") {
        where.primaryMaterial = { contains: "Mahogany" };
      } else if (woodQuery === "black-plum") {
        where.primaryMaterial = { contains: "Black Plum" };
      } else if (woodQuery === "canadian-oak") {
        where.primaryMaterial = { contains: "Canadian Oak" };
      } else if (woodQuery === "german-oak") {
        where.primaryMaterial = { contains: "German Oak" };
      } else if (woodQuery === "engineered") {
        where.primaryMaterial = { contains: "Engineering" };
      }
    }

    // Price range
    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = Number(minPrice);
      if (maxPrice) where.basePrice.lte = Number(maxPrice);
    }

    // Stock availability
    if (inStock === "true") {
      where.inStock = true;
    }

    // Minimum rating
    if (minRating) {
      where.rating = { gte: Number(minRating) };
    }

    // Placement filtering (New Arrival, Offer / Flash Sale, Showroom Classic)
    if (isOffer === "true" || placement === "offer") {
      where.isOffer = true;
    }
    if (isNewArrival === "true" || placement === "new_arrival") {
      where.isNewArrival = true;
    }
    if (isShowroomClassic === "true" || placement === "showroom_classic") {
      where.isShowroomClassic = true;
    }

    // Full-text search on name, description & material
    if (search && search.trim()) {
      const q = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
            { primaryMaterial: { contains: q } },
            { sku: { contains: q } },
          ],
        },
      ];
    }

    // Sorting
    let orderBy = {};
    if (sort === "price-asc") {
      orderBy = { basePrice: "asc" };
    } else if (sort === "price-desc") {
      orderBy = { basePrice: "desc" };
    } else if (sort === "rating") {
      orderBy = { rating: "desc" };
    } else if (sort === "newest") {
      orderBy = { createdAt: "desc" };
    } else {
      // "featured" default: order by isFeatured desc, then rating desc
      orderBy = [{ isFeatured: "desc" }, { rating: "desc" }];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
              parent: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  parentId: true,
                  parent: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          },
          images: {
            orderBy: { displayOrder: "asc" },
            take: 10,
          },
          inventory: {
            select: { quantityAvailable: true },
          },
        },
      }),
    ]);

    // Format products for frontend consumption
    const formatted = products.map((p) => {
      const cat = p.category;
      let mainCat = cat;
      let subCat = null;
      let childCat = null;

      if (cat?.parent?.parent) {
        // Level 3 child category (e.g. King Size Bed)
        mainCat = cat.parent.parent;
        subCat = cat.parent;
        childCat = cat;
      } else if (cat?.parent) {
        // Level 2 subcategory (e.g. Bed)
        mainCat = cat.parent;
        subCat = cat;
        childCat = null;
      } else if (cat) {
        // Level 1 root category (e.g. Bedroom)
        mainCat = cat;
        subCat = null;
        childCat = null;
      }

      const mainCatSlug = mainCat?.slug || "general";
      const mainCatName = mainCat?.name || "General";
      const subCatSlug = subCat?.slug || null;
      const subCatName = subCat?.name || null;
      const childCatSlug = childCat?.slug || null;
      const childCatName = childCat?.name || null;

      const safeImages = (p.images && p.images.length > 0)
        ? p.images.map((img) => img.url)
        : (p.image ? [p.image] : ["/images/furniture-placeholder.svg"]);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        category: mainCatSlug,
        categorySlug: mainCatSlug,
        categoryLabel: mainCatName,
        subcategory: subCatSlug,
        subcategorySlug: subCatSlug,
        subcategoryLabel: subCatName,
        childCategory: childCatSlug,
        childCategorySlug: childCatSlug,
        childCategoryLabel: childCatName,
        categoryId: p.categoryId,
        priceBDT: p.basePrice,
        basePrice: p.basePrice,
        oldPriceBDT: p.oldPrice,
        oldPrice: p.oldPrice,
        woodType: p.primaryMaterial,
        primaryMaterial: p.primaryMaterial,
        finish: p.finishType,
        finishType: p.finishType,
        dimensions: p.dimensions,
        hardware: p.hardware || "Hydraulic Soft-Closing German Fittings",
        seasoningMethod: p.seasoningMethod || "Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)",
        badge: p.badge,
        couponCode: p.couponCode || null,
        isOffer: Boolean(p.isOffer),
        isNewArrival: Boolean(p.isNewArrival),
        isShowroomClassic: Boolean(p.isShowroomClassic),
        isFeatured: Boolean(p.isFeatured),
        inStock: p.inStock && (p.inventory?.quantityAvailable ?? 1) > 0,
        stockCount: p.inventory?.quantityAvailable || 0,
        rating: p.rating || 5,
        reviewsCount: p.reviewsCount || 16,
        image: safeImages[0],
        images: safeImages,
        description: p.description,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    cache.set(cacheKey, { formatted, total, page: Number(page), limit: Number(limit) }, 60);
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    return sendPaginated(res, formatted, total, page, limit);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/products/featured
 */
router.get("/featured", async (req, res, next) => {
  try {
    const cacheKey = "products:featured:8";
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
      return sendSuccess(res, cached);
    }

    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 8,
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { displayOrder: "asc" }, take: 2 },
      },
    });

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category.slug,
      categoryLabel: p.category.name,
      priceBDT: p.basePrice,
      oldPriceBDT: p.oldPrice,
      woodType: p.primaryMaterial,
      dimensions: p.dimensions,
      image: p.images[0]?.url || "/images/furniture-placeholder.svg",
      images: p.images.map((img) => img.url),
      badge: p.badge,
      rating: p.rating,
      reviewsCount: p.reviewsCount,
    }));

    cache.set(cacheKey, formatted, 60);
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    return sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/products/:slug
 */
router.get("/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const cacheKey = `products:single:${slug}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
      return sendSuccess(res, cached);
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug: slug }, { id: slug }],
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
                parent: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
        images: { orderBy: { displayOrder: "asc" } },
        variants: { where: { isActive: true } },
        inventory: true,
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        seoMetadata: true,
      },
    });

    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    // Find related products in same category
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 4,
      include: {
        category: { select: { name: true, slug: true } },
        images: { take: 1 },
      },
    });

    const cat = product.category;
    let mainCat = cat;
    let subCat = null;
    let childCat = null;

    if (cat?.parent?.parent) {
      mainCat = cat.parent.parent;
      subCat = cat.parent;
      childCat = cat;
    } else if (cat?.parent) {
      mainCat = cat.parent;
      subCat = cat;
      childCat = null;
    } else if (cat) {
      mainCat = cat;
      subCat = null;
      childCat = null;
    }

    const mainCatSlug = mainCat?.slug || "general";
    const mainCatName = mainCat?.name || "General";
    const subCatSlug = subCat?.slug || null;
    const subCatName = subCat?.name || null;
    const childCatSlug = childCat?.slug || null;
    const childCatName = childCat?.name || null;

    const safeImages = (product.images && product.images.length > 0)
      ? product.images.map((img) => img.url)
      : (product.image ? [product.image] : ["/images/furniture-placeholder.svg"]);

    const formatted = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      category: mainCatSlug,
      categorySlug: mainCatSlug,
      categoryLabel: mainCatName,
      subcategory: subCatSlug,
      subcategorySlug: subCatSlug,
      subcategoryLabel: subCatName,
      childCategory: childCatSlug,
      childCategorySlug: childCatSlug,
      childCategoryLabel: childCatName,
      categoryId: product.categoryId,
      basePrice: product.basePrice,
      priceBDT: product.basePrice,
      oldPrice: product.oldPrice,
      oldPriceBDT: product.oldPrice,
      woodType: product.primaryMaterial,
      primaryMaterial: product.primaryMaterial,
      finish: product.finishType,
      finishType: product.finishType,
      dimensions: product.dimensions,
      hardware: product.hardware || "Hydraulic Soft-Closing German Fittings",
      seasoningMethod: product.seasoningMethod || "Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)",
      warranty: `${product.warrantyYears || 10} Years Anti-Borer & Termite Guarantee`,
      badge: product.badge,
      couponCode: product.couponCode || null,
      isOffer: Boolean(product.isOffer),
      isNewArrival: Boolean(product.isNewArrival),
      isShowroomClassic: Boolean(product.isShowroomClassic),
      isFeatured: Boolean(product.isFeatured),
      inStock: product.inStock && (product.inventory?.quantityAvailable ?? 1) > 0,
      stockCount: product.inventory?.quantityAvailable || 0,
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      image: safeImages[0],
      images: safeImages,
      description: product.description,
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.variantName,
        price: v.finalPrice,
        inStock: v.stockQuantity > 0,
      })),
      reviews: product.reviews.map((r) => ({
        id: r.id,
        name: r.authorName,
        location: r.authorLocation,
        rating: r.rating,
        comment: r.comment,
        isVerified: r.isVerifiedBuyer,
        date: r.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      })),
      relatedProducts: related.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        category: r.category.slug,
        priceBDT: r.basePrice,
        oldPriceBDT: r.oldPrice,
        image: r.images[0]?.url || "/images/furniture-placeholder.svg",
      })),
    };

    cache.set(cacheKey, formatted, 60);
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    return sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/products/filters/attributes
 * Returns available filter parameters (materials, price bounds, availability)
 */
router.get("/filters/attributes", async (req, res, next) => {
  try {
    const cached = cache.get("filters:attributes");
    if (cached) {
      return sendSuccess(res, cached);
    }

    const [priceRange, distinctMaterials, categories] = await Promise.all([
      prisma.product.aggregate({
        where: { isActive: true },
        _min: { basePrice: true },
        _max: { basePrice: true },
        _count: { id: true },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { primaryMaterial: true },
        distinct: ["primaryMaterial"],
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
      }),
    ]);

    const result = {
      price: {
        min: priceRange._min.basePrice || 0,
        max: priceRange._max.basePrice || 100000,
        totalProducts: priceRange._count.id || 0,
      },
      materials: distinctMaterials.map((m) => m.primaryMaterial),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: c._count.products,
      })),
    };

    cache.set("filters:attributes", result, 300);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/products/:idOrSlug/related
 */
router.get("/:idOrSlug/related", async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
          { sku: idOrSlug },
          { sku: { endsWith: `-${idOrSlug}` } },
        ],
      },
    });

    if (!product) return sendError(res, "Product not found", 404);

    const related = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        isActive: true,
        OR: [
          { categoryId: product.categoryId },
          { primaryMaterial: product.primaryMaterial },
        ],
      },
      take: 6,
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { displayOrder: "asc" }, take: 1 },
      },
    });

    const formatted = related.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      category: r.category.slug,
      categoryLabel: r.category.name,
      woodType: r.primaryMaterial,
      priceBDT: r.basePrice,
      oldPriceBDT: r.oldPrice,
      image: r.images[0]?.url || "/images/furniture-placeholder.svg",
    }));

    cache.set(cacheKey, formatted, 60);
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    return sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
});

export default router;

