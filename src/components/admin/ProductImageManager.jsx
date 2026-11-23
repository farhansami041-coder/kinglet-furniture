import React, { useState, useRef, useEffect } from "react";
import { adminAuthService } from "../../utils/adminAuthService";

export default function ProductImageManager({
  productId,
  images = [],
  onChange,
  disabled = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [storageStatus, setStorageStatus] = useState(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [showExternalInput, setShowExternalInput] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch storage configuration status
  useEffect(() => {
    adminAuthService
      .fetch("/api/v1/admin/uploads/storage-status")
      .then((res) => setStorageStatus(res.data))
      .catch(() => {});
  }, []);

  // Standardize items into array of rich objects
  // Strictly enforce that only position #1 (index 0) is the Primary Hero displayed on catalog cards
  const normalizedImages = images.map((item, idx) => {
    if (typeof item === "string") {
      return {
        id: `legacy-${idx}`,
        url: item,
        thumbnailUrl: item,
        smallUrl: item,
        mediumUrl: item,
        largeUrl: item,
        altText: `Furniture view ${idx + 1}`,
        displayOrder: idx,
        isHero: idx === 0,
      };
    }
    return {
      ...item,
      id: item.id || `img-${idx}`,
      url: item.url || item.mediumUrl || item.originalUrl,
      thumbnailUrl: item.thumbnailUrl || item.url,
      displayOrder: item.displayOrder !== undefined ? item.displayOrder : idx,
      isHero: idx === 0,
    };
  });

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate client-side limits
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    for (const f of files) {
      if (!allowed.includes(f.type)) {
        setUploadError(`File "${f.name}" has invalid format (${f.type}). Only JPEG, PNG, WebP, and AVIF are supported.`);
        return;
      }
      if (f.size > 15 * 1024 * 1024) {
        setUploadError(`File "${f.name}" exceeds the maximum allowed size of 15MB.`);
        return;
      }
    }

    setUploading(true);
    setUploadProgress(20);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    if (productId && productId !== "draft") {
      formData.append("productId", productId);
    }
    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const token = adminAuthService.getToken();
      setUploadProgress(50);

      const res = await fetch("/api/v1/admin/uploads/product-images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      setUploadProgress(85);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to upload images.");
      }

      setUploadProgress(100);
      setUploadSuccess(`Uploaded ${files.length} image(s) with high-fidelity WebP responsive variants.`);
      setTimeout(() => setUploadSuccess(null), 4000);

      // Append newly uploaded images to state
      const newItems = json.data || [];
      const updated = [...normalizedImages, ...newItems];

      // Ensure first image is hero if none selected
      if (!updated.some((i) => i.isHero) && updated.length > 0) {
        updated[0].isHero = true;
      }

      onChange(updated);
    } catch (err) {
      setUploadError(err.message || "Error uploading files. Please retry.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddExternalUrl = (e) => {
    e.preventDefault();
    if (!externalUrl.trim()) return;

    const newItem = {
      id: `ext-${Date.now()}`,
      url: externalUrl.trim(),
      thumbnailUrl: externalUrl.trim(),
      altText: "Furniture view",
      displayOrder: normalizedImages.length,
      isHero: normalizedImages.length === 0,
    };

    onChange([...normalizedImages, newItem]);
    setExternalUrl("");
    setShowExternalInput(false);
  };

  const handleMakeFirst = (index) => {
    if (index === 0 || index >= normalizedImages.length) return;

    // Move the selected image to index 0 (Primary Hero)
    const copy = [...normalizedImages];
    const [targetItem] = copy.splice(index, 1);
    copy.unshift(targetItem);

    // Re-index display orders & guarantee only position #1 is Hero
    const reordered = copy.map((img, i) => ({
      ...img,
      displayOrder: i,
      isHero: i === 0,
    }));

    onChange(reordered);
  };

  const handleSetHero = (index) => {
    handleMakeFirst(index);
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= normalizedImages.length) return;

    const updated = [...normalizedImages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Update display orders
    updated.forEach((img, i) => {
      img.displayOrder = i;
    });

    onChange(updated);

    // If editing product with DB IDs, persist reorder
    if (productId && productId !== "draft") {
      const validDbIds = updated.map((i) => i.id).filter((id) => !id.startsWith("legacy") && !id.startsWith("ext"));
      if (validDbIds.length === updated.length) {
        try {
          await adminAuthService.fetch(`/api/v1/admin/products/${productId}/images/reorder`, {
            method: "PUT",
            body: JSON.stringify({ imageIds: validDbIds }),
          });
        } catch {}
      }
    }
  };

  const handleRemove = async (index) => {
    const target = normalizedImages[index];

    if (!window.confirm("Remove this image from product gallery?")) return;

    // If persisted in DB, call delete API to purge DB record & storage objects
    if (productId && productId !== "draft" && target.id && !target.id.startsWith("legacy") && !target.id.startsWith("ext")) {
      try {
        await adminAuthService.fetch(`/api/v1/admin/products/${productId}/images/${target.id}`, {
          method: "DELETE",
        });
      } catch (err) {
        alert(err.message || "Failed to delete image.");
        return;
      }
    }

    const updated = normalizedImages.filter((_, idx) => idx !== index);

    // If deleted image was hero, make first image hero
    if (target.isHero && updated.length > 0) {
      updated[0].isHero = true;
    }

    onChange(updated);
  };

  const handleAltTextChange = (index, newAlt) => {
    const updated = normalizedImages.map((img, idx) =>
      idx === index ? { ...img, altText: newAlt } : img
    );
    onChange(updated);
  };

  return (
    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
      {/* Header & Storage Status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>
            Product Image Gallery ({normalizedImages.length} images)
          </label>
          <span style={{ fontSize: "11px", color: "#64748b" }}>
            First image is the Primary Hero displayed on catalog cards. Drag/Move to reorder.
          </span>
        </div>

        {storageStatus && (
          <span
            style={{
              fontSize: "11px",
              padding: "3px 8px",
              borderRadius: "12px",
              fontWeight: 600,
              background: storageStatus.provider === "cloud_s3_compatible" ? "#ecfdf5" : "#eff6ff",
              color: storageStatus.provider === "cloud_s3_compatible" ? "#059669" : "#2563eb",
              border: `1px solid ${storageStatus.provider === "cloud_s3_compatible" ? "#a7f3d0" : "#bfdbfe"}`,
            }}
            title={storageStatus.provider === "cloud_s3_compatible" ? `Cloud Object Storage (${storageStatus.bucket})` : "Persistent Object Store"}
          >
            ● {storageStatus.provider === "cloud_s3_compatible" ? "Cloud S3/R2" : "Local Persistent Object Store"}
          </span>
        )}
      </div>

      {/* Upload Alerts */}
      {uploadError && (
        <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", color: "#dc2626", fontSize: "12px", marginBottom: "12px" }}>
          ⚠️ {uploadError}
        </div>
      )}

      {uploadSuccess && (
        <div style={{ padding: "8px 12px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "6px", color: "#059669", fontSize: "12px", marginBottom: "12px" }}>
          ✅ {uploadSuccess}
        </div>
      )}

      {/* Upload Progress Bar */}
      {uploading && (
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#475569", marginBottom: "4px" }}>
            <span>Validating magic bytes & generating responsive WebP variants...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${uploadProgress}%`, height: "100%", background: "#ef4444", transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}

      {/* Gallery Cards Grid */}
      {normalizedImages.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          {normalizedImages.map((img, idx) => (
            <div
              key={img.id}
              style={{
                background: "#ffffff",
                borderRadius: "8px",
                border: idx === 0 ? "2px solid #ec2226" : "1px solid #cbd5e1",
                padding: "8px",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                boxShadow: idx === 0 ? "0 4px 12px rgba(236, 34, 38, 0.15)" : "0 1px 3px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
              }}
            >
              {/* Image Preview Container */}
              <div style={{ width: "100%", height: "120px", borderRadius: "6px", overflow: "hidden", background: "#f1f5f9", position: "relative" }}>
                <img
                  src={img.thumbnailUrl || img.url}
                  alt={img.altText || "Product"}
                  width="180"
                  height="120"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/furniture-placeholder.svg";
                  }}
                  style={{ width: "100%", height: "100%", aspectRatio: "180 / 120", objectFit: "cover" }}
                />

                {/* Primary Hero Badge (#1) or "⭐ Show First" Quick Action Button */}
                {idx === 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      top: "6px",
                      left: "6px",
                      background: "linear-gradient(135deg, #ff2e34 0%, #ec2226 100%)",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: 800,
                      padding: "3px 7px",
                      borderRadius: "4px",
                      letterSpacing: "0.5px",
                      boxShadow: "0 2px 6px rgba(236, 34, 38, 0.4)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    PRIMARY HERO
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMakeFirst(idx)}
                    disabled={disabled}
                    title="Click to show this image first on the storefront"
                    style={{
                      position: "absolute",
                      top: "6px",
                      left: "6px",
                      background: "rgba(15, 23, 42, 0.85)",
                      backdropFilter: "blur(6px)",
                      color: "#ffffff",
                      fontSize: "9.5px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#ec2226";
                      e.currentTarget.style.borderColor = "#ec2226";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.85)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                    }}
                  >
                    <span>⭐ Show First</span>
                  </button>
                )}

                {/* Order Badge */}
                <span
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    right: "6px",
                    background: "rgba(15,23,42,0.8)",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  #{idx + 1}
                </span>
              </div>

              {/* Alt Text Input */}
              <input
                type="text"
                placeholder="Alt description..."
                value={img.altText || ""}
                onChange={(e) => handleAltTextChange(idx, e.target.value)}
                disabled={disabled}
                style={{
                  width: "100%",
                  marginTop: "6px",
                  padding: "4px 6px",
                  fontSize: "11px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />

              {/* Controls Toolbar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "6px", borderTop: "1px solid #f1f5f9" }}>
                {/* Reorder Buttons */}
                <div style={{ display: "flex", gap: "2px" }}>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0 || disabled}
                    title="Move Left"
                    style={{ padding: "3px 6px", fontSize: "11px", border: "1px solid #cbd5e1", borderRadius: "3px", background: "#fff", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.35 : 1 }}
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === normalizedImages.length - 1 || disabled}
                    title="Move Right"
                    style={{ padding: "3px 6px", fontSize: "11px", border: "1px solid #cbd5e1", borderRadius: "3px", background: "#fff", cursor: idx === normalizedImages.length - 1 ? "not-allowed" : "pointer", opacity: idx === normalizedImages.length - 1 ? 0.35 : 1 }}
                  >
                    ▶
                  </button>
                </div>

                {/* Show First button (if not first) or Main badge, plus Delete */}
                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMakeFirst(idx)}
                      disabled={disabled}
                      title="Show this image first on the website"
                      style={{
                        padding: "3px 8px",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        border: "1px solid #93c5fd",
                        borderRadius: "4px",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#dbeafe";
                        e.currentTarget.style.borderColor = "#60a5fa";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#eff6ff";
                        e.currentTarget.style.borderColor = "#93c5fd";
                      }}
                    >
                      ⭐ Show First
                    </button>
                  )}
                  {idx === 0 && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#15803d",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        padding: "2px 6px",
                        borderRadius: "3px",
                      }}
                    >
                      ✓ Main
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    disabled={disabled}
                    title="Delete Image"
                    style={{ padding: "3px 6px", fontSize: "11px", border: "1px solid #fecaca", borderRadius: "3px", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Drop Zone & Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFilesSelected}
          style={{ display: "none" }}
          disabled={uploading || disabled}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          style={{
            padding: "8px 16px",
            background: "#0f172a",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: uploading || disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>📁</span>
          <span>{uploading ? "Uploading..." : "Upload Multiple Images (JPEG, PNG, WebP, AVIF)"}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowExternalInput(!showExternalInput)}
          disabled={disabled}
          style={{
            padding: "8px 12px",
            background: "#ffffff",
            color: "#475569",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showExternalInput ? "✕ Close URL Input" : "🔗 Paste Image URL"}
        </button>
      </div>

      {/* External URL Input Form */}
      {showExternalInput && (
        <form onSubmit={handleAddExternalUrl} style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
          <input
            type="url"
            placeholder="https://images.unsplash.com/photo-..."
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            style={{
              flexGrow: 1,
              padding: "6px 10px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "12px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "6px 12px",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}

