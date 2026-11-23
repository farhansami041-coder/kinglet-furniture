import React, { useState } from "react";
import { Link } from "react-router-dom";

/**
 * KingletProductCardImage
 * - Strict 1:1 Aspect Ratio container ("SOB PRODUCT ER IMAGE SIZE HOBE 1:1 RATIO TE")
 * - Initial 1st Image display ("PROTHOM E JE 1ST IMAGE TA DEYA THAKBE SETA SHOW KORBE")
 * - Smooth, slow 2nd Image pop-up on hover ("JOKHON CURSOR PRODUCT ER IMAGE ER UPOR JABE TOKHON SLOWLY AND SMOOTHLY OI SAME PRODUCT ER JE 2ND IMAGE ACHE SETA POP UP KORBE")
 */
export default function KingletProductCardImage({
  product,
  badges,
  quickActions,
  isCardHovered = false,
  className = "",
  style = {},
  priority = false,
}) {
  const [localHover, setLocalHover] = useState(false);
  const hovered = isCardHovered || localHover;

  const firstImage = (product.images && product.images[0]) || product.image;
  const secondImage =
    product.images && product.images.length > 1 && product.images[1] !== firstImage
      ? product.images[1]
      : null;

  return (
    <div
      className={`kinglet-card-image-box ${className}`}
      onMouseEnter={() => setLocalHover(true)}
      onMouseLeave={() => setLocalHover(false)}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1", // Strict 1:1 Square Ratio
        background: "#f8fafc",
        overflow: "hidden",
        display: "block",
        padding: "0", // Zero padding - image completely fills container
        borderRadius: "14px 14px 0 0",
        ...style,
      }}
    >
      <Link
        to={`/product/${product.slug}`}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          position: "relative",
          textDecoration: "none",
          overflow: "hidden",
        }}
      >
        {/* 1st Primary Image (Shown Initially, Full Bleed 1:1) */}
        <img
          src={firstImage}
          alt={product.name}
          width="600"
          height="600"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding={priority ? "sync" : "async"}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/images/furniture-placeholder.svg";
          }}
          style={{
            width: "100%",
            height: "100%",
            aspectRatio: "1 / 1",
            objectFit: "cover",
            objectPosition: "center",
            opacity: hovered && secondImage ? 0 : 1,
            transform: hovered && !secondImage ? "scale(1.06)" : hovered ? "scale(0.98)" : "scale(1.0)",
            transition:
              "opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
            display: "block",
          }}
        />

        {/* 2nd Secondary Image (Slowly and Smoothly Pops Up on Cursor Hover) */}
        {secondImage && (
          <img
            src={secondImage}
            alt={`${product.name} - Alternate View`}
            width="600"
            height="600"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              aspectRatio: "1 / 1",
              objectFit: "cover",
              objectPosition: "center",
              opacity: hovered ? 1 : 0,
              transform: hovered ? "scale(1.06)" : "scale(0.97)",
              transition:
                "opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
              pointerEvents: "none",
            }}
          />
        )}
      </Link>

      {/* Floating Badges (e.g. 15% OFF, NEW 2026) */}
      {badges && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          {badges}
        </div>
      )}

      {/* Floating Quick Action Buttons (Wishlist, QuickView, Compare) */}
      {quickActions && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            zIndex: 2,
          }}
        >
          {quickActions}
        </div>
      )}
    </div>
  );
}
