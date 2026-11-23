import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";

// Determine if valid cloud S3/R2 credentials are provided
const isCloudStorage = Boolean(
  process.env.S3_BUCKET &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
);

let s3Client = null;
if (isCloudStorage) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined, // Supports Cloudflare R2 / MinIO / GCS
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

// Local Persistent Object Storage Directory (persisted, not temporary)
const LOCAL_STORAGE_ROOT = path.resolve(process.cwd(), "storage/objects");

// Ensure base storage directory exists
if (!fs.existsSync(LOCAL_STORAGE_ROOT)) {
  fs.mkdirSync(LOCAL_STORAGE_ROOT, { recursive: true });
}

export const storageService = {
  isCloud() {
    return isCloudStorage;
  },

  getStatus() {
    return {
      provider: isCloudStorage ? "cloud_s3_compatible" : "persistent_local_object_store",
      bucket: process.env.S3_BUCKET || null,
      region: process.env.AWS_REGION || (isCloudStorage ? "auto" : "local"),
      endpoint: process.env.S3_ENDPOINT || null,
      localStoragePath: LOCAL_STORAGE_ROOT,
      maxFileSizeBytes: 15 * 1024 * 1024, // 15MB
      allowedFormats: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    };
  },

  /**
   * Upload buffer to Object Storage (S3 / R2 or Local Persistent Store)
   */
  async uploadObject(key, buffer, contentType = "image/webp") {
    // Sanitize storage key
    const sanitizedKey = key.replace(/\\/g, "/").replace(/^\/+/, "");

    if (isCloudStorage && s3Client) {
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: sanitizedKey,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      });

      await s3Client.send(command);

      const publicBase = process.env.S3_PUBLIC_BASE_URL
        ? process.env.S3_PUBLIC_BASE_URL.replace(/\/+$/, "")
        : `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`;

      return `${publicBase}/${sanitizedKey}`;
    }

    // Local Persistent Object Storage Driver
    const targetFilePath = path.join(LOCAL_STORAGE_ROOT, sanitizedKey);
    const targetDir = path.dirname(targetFilePath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    await fs.promises.writeFile(targetFilePath, buffer);

    // Return URL served via static route
    return `/storage/objects/${sanitizedKey}`;
  },

  /**
   * Delete single object from storage
   */
  async deleteObject(key) {
    if (!key) return;
    const sanitizedKey = key.replace(/\\/g, "/").replace(/^\/+/, "");

    if (isCloudStorage && s3Client) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: sanitizedKey,
          })
        );
      } catch (err) {
        console.warn(`[StorageService] Failed to delete remote object: ${sanitizedKey}`, err.message);
      }
      return;
    }

    // Local Persistent File Deletion
    const targetFilePath = path.join(LOCAL_STORAGE_ROOT, sanitizedKey);
    if (fs.existsSync(targetFilePath)) {
      try {
        await fs.promises.unlink(targetFilePath);
      } catch (err) {
        console.warn(`[StorageService] Failed to delete local object: ${targetFilePath}`, err.message);
      }
    }
  },

  /**
   * Batch delete multiple objects (e.g. all responsive variants for an image)
   */
  async deleteObjects(keys) {
    if (!keys || !Array.isArray(keys) || keys.length === 0) return;

    if (isCloudStorage && s3Client) {
      try {
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: process.env.S3_BUCKET,
            Delete: {
              Objects: keys.map((k) => ({ Key: k.replace(/\\/g, "/").replace(/^\/+/, "") })),
            },
          })
        );
      } catch (err) {
        console.warn("[StorageService] Failed to batch delete remote objects", err.message);
      }
      return;
    }

    // Local batch deletion
    await Promise.all(keys.map((k) => this.deleteObject(k)));
  },
};

