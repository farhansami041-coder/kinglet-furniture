import express from "express";
import prisma from "../db/prisma.js";
import { sendSuccess, sendError } from "../utils/response.js";
import cache from "../utils/cache.js";

const router = express.Router();

/**
 * GET /api/v1/categories
 * Returns all active categories with product counts and hierarchical subcategories
 */
router.get("/", async (req, res, next) => {
  try {
    const cached = cache.get("categories:root:all:v3");
    if (cached) {
      return sendSuccess(res, cached);
    }

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null, // Root categories
      },
      orderBy: { displayOrder: "asc" },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          include: {
            subcategories: {
              where: { isActive: true },
              orderBy: { displayOrder: "asc" },
              include: {
                _count: {
                  select: { products: { where: { isActive: true } } },
                },
              },
            },
            _count: {
              select: { products: { where: { isActive: true } } },
            },
          },
        },
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    const formatted = categories.map((c) => {
      let rootTotal = c._count?.products || 0;
      const subcategories = c.subcategories.map((sub) => {
        let subTotal = sub._count?.products || 0;
        const children = (sub.subcategories || []).map((ch) => {
          const chCount = ch._count?.products || 0;
          subTotal += chCount;
          return {
            id: ch.id,
            name: ch.name,
            slug: ch.slug,
            productCount: chCount,
          };
        });
        rootTotal += subTotal;
        return {
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          productCount: subTotal,
          children,
        };
      });

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        productCount: rootTotal,
        subcategories,
      };
    });

    cache.set("categories:root:all:v3", formatted, 300);
    return sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/categories/:slug
 */
router.get("/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        subcategories: {
          include: {
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return sendError(res, "Category not found", 404);
    }

    return sendSuccess(res, category);
  } catch (err) {
    next(err);
  }
});

export default router;

