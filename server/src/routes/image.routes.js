import express from "express";
import multer from "multer";
import prisma from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { storageService } from "../services/storage.service.js";
import { imageProcessor } from "../services/imageProcessor.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = express.Router();

// Memory storage for multer - directly stream to Sharp buffer without disk leaks
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit per file
    files: 10, // Up to 10 files in a single batch
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type "${file.mimetype}". Allowed types: JPEG, PNG, WebP, AVIF.`));
    }
  },
});

// Enforce admin permissions for all image management routes
router.use(requireAuth, requireRole(["SUPER_ADMIN", "STORE_MANAGER"]));

/**
 * GET /api/v1/admin/uploads/storage-status
 * Report whether uploads are running on Cloud S3/R2 or Local Persistent Storage
 */
router.get("/storage-status", (req, res) => {
  return sendSuccess(res, storageService.getStatus());
});

/**
 * POST /api/v1/admin/uploads and /api/v1/admin/uploads/banner
 * Handles single image uploads (JPG, PNG, WebP) for hero banners, sliders, and site assets
 */
const handleGeneralUpload = async (req, res, next) => {
  try {
    let file = req.file;
    if (!file && req.files) {
      if (Array.isArray(req.files) && req.files.length > 0) {
        file = req.files[0];
      } else if (typeof req.files === "object") {
        const firstKey = Object.keys(req.files)[0];
        if (firstKey && req.files[firstKey].length > 0) {
          file = req.files[firstKey][0];
        }
      }
    }

    if (!file) {
      return sendError(res, "Please select an image file (JPG, PNG, WebP) to upload.", 400);
    }

    const folder = req.body.folder || "banners";
    const altText = req.body.altText || req.body.title || "Homepage Hero Banner";

    const processed = await imageProcessor.processAndUpload({
      buffer: file.buffer,
      productId: folder,
      originalName: file.originalname,
      altText,
    });

    return sendSuccess(
      res,
      {
        url: processed.largeUrl || processed.originalUrl || processed.url,
        originalUrl: processed.originalUrl,
        largeUrl: processed.largeUrl,
        mediumUrl: processed.mediumUrl,
        smallUrl: processed.smallUrl,
        thumbnailUrl: processed.thumbnailUrl,
        storageKey: processed.storageKey,
        width: processed.width,
        height: processed.height,
        fileName: file.originalname,
        fileSize: file.size,
      },
      "Image uploaded and optimized successfully!",
      201
    );
  } catch (err) {
    next(err);
  }
};

router.post("/banner", upload.any(), handleGeneralUpload);
router.post("/", upload.any(), handleGeneralUpload);

/**
 * POST /api/v1/admin/uploads/product-images
 * Upload, validate magic bytes, generate 4 responsive WebP variants, and persist
 */
router.post("/product-images", upload.array("images", 10), async (req, res, next) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return sendError(res, "Please select at least one image file to upload.", 400);
    }

    const { productId, altText } = req.body;

    let targetProduct = null;
    let existingImagesCount = 0;

    if (productId && productId !== "draft") {
      targetProduct = await prisma.product.findUnique({
        where: { id: productId },
        include: { images: true },
      });
      if (!targetProduct) {
        return sendError(res, `Product with ID ${productId} not found.`, 404);
      }
      existingImagesCount = targetProduct.images.length;
    }

    const results = [];

    // Process each image sequentially to maintain exact order
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate & Process Sharp Responsive Pipeline
      const processed = await imageProcessor.processAndUpload({
        buffer: file.buffer,
        productId: productId || "draft",
        originalName: file.originalname,
        altText: altText || `${targetProduct ? targetProduct.name : "Kinglet Furniture"} - View ${existingImagesCount + i + 1}`,
      });

      // If tied to an existing product in DB, persist record
      if (targetProduct) {
        const hasHero = targetProduct.images.some((img) => img.isHero);
        const shouldBeHero = !hasHero && i === 0;

        const dbImage = await prisma.productImage.create({
          data: {
            productId: targetProduct.id,
            url: processed.url,
            thumbnailUrl: processed.thumbnailUrl,
            smallUrl: processed.smallUrl,
            mediumUrl: processed.mediumUrl,
            largeUrl: processed.largeUrl,
            storageKey: processed.storageKey,
            width: processed.width,
            height: processed.height,
            fileSize: processed.fileSize,
            mimeType: processed.mimeType,
            altText: processed.altText,
            displayOrder: existingImagesCount + i,
            isHero: shouldBeHero,
          },
        });

        results.push(dbImage);
      } else {
        // Returned for draft product form (client will attach upon product creation)
        results.push({
          ...processed,
          displayOrder: i,
          isHero: i === 0,
        });
      }
    }

    // Audit log if attached to a product
    if (targetProduct) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "PRODUCT_IMAGES_UPLOADED",
          module: "products",
          targetId: targetProduct.id,
          diffJson: JSON.stringify({ uploadedCount: results.length }),
        },
      });
    }

    return sendSuccess(
      res,
      results,
      `Successfully processed and stored ${results.length} image(s) with high-fidelity WebP variants.`,
      201
    );
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/admin/products/:productId/images/reorder
 * Reorder gallery images
 */
router.put("/products/:productId/images/reorder", async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { imageIds } = req.body; // Array of image IDs in desired order

    if (!imageIds || !Array.isArray(imageIds)) {
      return sendError(res, "Array of image IDs is required.", 400);
    }

    await prisma.$transaction(
      imageIds.map((id, index) =>
        prisma.productImage.update({
          where: { id, productId },
          data: { displayOrder: index },
        })
      )
    );

    return sendSuccess(res, null, "Image gallery reordered successfully!");
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/admin/products/:productId/images/:imageId/set-hero
 * Designate primary hero image
 */
router.put("/products/:productId/images/:imageId/set-hero", async (req, res, next) => {
  try {
    const { productId, imageId } = req.params;

    await prisma.$transaction([
      prisma.productImage.updateMany({
        where: { productId },
        data: { isHero: false },
      }),
      prisma.productImage.update({
        where: { id: imageId, productId },
        data: { isHero: true },
      }),
    ]);

    return sendSuccess(res, null, "Primary hero image updated successfully!");
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/admin/products/:productId/images/:imageId
 * Update alt text or display properties
 */
router.put("/products/:productId/images/:imageId", async (req, res, next) => {
  try {
    const { productId, imageId } = req.params;
    const { altText, displayOrder } = req.body;

    const updated = await prisma.productImage.update({
      where: { id: imageId, productId },
      data: {
        altText: altText !== undefined ? altText : undefined,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
      },
    });

    return sendSuccess(res, updated, "Image metadata updated successfully!");
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/admin/products/:productId/images/:imageId
 * Safe deletion: Deletes database record AND purges all 5 storage objects
 */
router.delete("/products/:productId/images/:imageId", async (req, res, next) => {
  try {
    const { productId, imageId } = req.params;

    const image = await prisma.productImage.findUnique({
      where: { id: imageId, productId },
    });

    if (!image) {
      return sendError(res, "Image not found.", 404);
    }

    // 1. Purge all responsive variants from storage to prevent orphaned objects
    if (image.storageKey) {
      await imageProcessor.deleteImageVariants(image.storageKey);
    }

    // 2. Delete database record
    await prisma.productImage.delete({
      where: { id: imageId },
    });

    // 3. If deleted image was hero, promote remaining image
    if (image.isHero) {
      const remaining = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { displayOrder: "asc" },
      });
      if (remaining) {
        await prisma.productImage.update({
          where: { id: remaining.id },
          data: { isHero: true },
        });
      }
    }

    return sendSuccess(res, null, "Image and all responsive storage variants safely deleted.");
  } catch (err) {
    next(err);
  }
});

export default router;

