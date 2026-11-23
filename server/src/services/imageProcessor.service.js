import crypto from "crypto";
import sharp from "sharp";
import { storageService } from "./storage.service.js";

const ALLOWED_FORMATS = ["jpeg", "jpg", "png", "webp", "avif"];

export const imageProcessor = {
  /**
   * Validate image content and extract metadata using sharp
   */
  async validateImageContent(buffer) {
    if (!buffer || buffer.length === 0) {
      throw new Error("Empty image payload received.");
    }

    try {
      const metadata = await sharp(buffer).metadata();

      if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format.toLowerCase())) {
        throw new Error(
          `Unsupported image format: "${metadata.format}". Supported formats are JPEG, PNG, WebP, and AVIF.`
        );
      }

      if (!metadata.width || !metadata.height) {
        throw new Error("Unable to determine image dimensions.");
      }

      if (metadata.width < 100 || metadata.height < 100) {
        throw new Error(`Image resolution too low (${metadata.width}x${metadata.height}px). Minimum 100x100px required.`);
      }

      return metadata;
    } catch (err) {
      if (err.message.startsWith("Unsupported") || err.message.startsWith("Image resolution")) {
        throw err;
      }
      throw new Error("Corrupted or invalid image file content. Magic bytes verification failed.");
    }
  },

  /**
   * Generate safe unique storage key prefix
   */
  generateStorageKey(productId = "draft", originalName = "furniture.jpg") {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(6).toString("hex");
    const sanitizedName = originalName
      .toLowerCase()
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9_-]+/g, "-")
      .slice(0, 30);

    return `products/${productId}/${timestamp}-${randomHex}-${sanitizedName}`;
  },

  /**
   * Process and generate optimized responsive variants preserving furniture details
   */
  async processAndUpload({ buffer, productId = "draft", originalName = "furniture.jpg", altText = "" }) {
    // 1. Verify content
    const metadata = await this.validateImageContent(buffer);

    // 2. Generate safe unique key prefix
    const baseKey = this.generateStorageKey(productId, originalName);

    // 3. Sharp pipeline configurations (Retaining color accuracy & timber grain texture)
    const baseSharp = sharp(buffer, { failOn: "error" }).rotate(); // Auto-rotates based on EXIF orientation

    // Variant 1: Original High-Fidelity Master (Max 2048px, Quality 88, 4:4:4 chroma subsampling)
    const originalBuffer = await baseSharp
      .clone()
      .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88, effort: 6, chromaSubsampling: "4:4:4" })
      .toBuffer();

    // Variant 2: Large Showcase / Zoom (1400px wide)
    const largeBuffer = await baseSharp
      .clone()
      .resize({ width: 1400, withoutEnlargement: true })
      .webp({ quality: 85, effort: 5 })
      .toBuffer();

    // Variant 3: Medium Catalog / Detail (800px wide)
    const mediumBuffer = await baseSharp
      .clone()
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 85, effort: 5 })
      .toBuffer();

    // Variant 4: Small Mobile (480px wide)
    const smallBuffer = await baseSharp
      .clone()
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();

    // Variant 5: Square Thumbnail (320x320 cover)
    const thumbBuffer = await baseSharp
      .clone()
      .resize({ width: 320, height: 320, fit: "cover", position: "centre" })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();

    // 4. Construct variant storage keys
    const originalKey = `${baseKey}-orig.webp`;
    const largeKey = `${baseKey}-1400w.webp`;
    const mediumKey = `${baseKey}-800w.webp`;
    const smallKey = `${baseKey}-480w.webp`;
    const thumbKey = `${baseKey}-thumb.webp`;

    // 5. Upload all variants to Object Storage in parallel
    const [originalUrl, largeUrl, mediumUrl, smallUrl, thumbnailUrl] = await Promise.all([
      storageService.uploadObject(originalKey, originalBuffer, "image/webp"),
      storageService.uploadObject(largeKey, largeBuffer, "image/webp"),
      storageService.uploadObject(mediumKey, mediumBuffer, "image/webp"),
      storageService.uploadObject(smallKey, smallBuffer, "image/webp"),
      storageService.uploadObject(thumbKey, thumbBuffer, "image/webp"),
    ]);

    return {
      url: mediumUrl, // Default standard catalog URL
      originalUrl,
      largeUrl,
      mediumUrl,
      smallUrl,
      thumbnailUrl,
      width: metadata.width,
      height: metadata.height,
      fileSize: originalBuffer.length,
      mimeType: "image/webp",
      altText: altText || originalName.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " "),
      storageKey: baseKey,
      variantKeys: [originalKey, largeKey, mediumKey, smallKey, thumbKey],
    };
  },

  /**
   * Delete all responsive variant objects associated with a base storageKey
   */
  async deleteImageVariants(baseKey) {
    if (!baseKey) return;
    const keys = [
      `${baseKey}-orig.webp`,
      `${baseKey}-1400w.webp`,
      `${baseKey}-800w.webp`,
      `${baseKey}-480w.webp`,
      `${baseKey}-thumb.webp`,
    ];
    await storageService.deleteObjects(keys);
  },
};

