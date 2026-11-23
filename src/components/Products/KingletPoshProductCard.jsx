import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, ShoppingBag, MessageCircle, CreditCard, Flame, Check } from "lucide-react";
import KingletProductCardImage from "./KingletProductCardImage";
import { BRAND_INFO } from "../../data/kingletData";
import { calculateEmi } from "../../utils/emiCalculator";

/**
 * KingletPoshProductCard
 * Ultra-dynamic, minimal luxury product card:
 * - Architectural 14px radius with crisp micro-border & reactive hover lift
 * - 1:1 square canvas with smooth secondary image crossfade
 * - Floating glassmorphic badges & heartbeat wishlist button
 * - Clean timber spec pill & interactive wood finish swatches
 * - Bold clamped typography with silky ruby hover transition
 * - Dynamic 0% EMI calculator pill
 * - Tactile action suite: Frosted Quick View, WhatsApp with live green radar dot, and Quick Add with instant checkmark feedback
 */
export default function KingletPoshProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  onOpenEmi,
  _onOpenCustomSizing,
  isWishlisted = false,
  className = "",
  style = {},
}) {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const priceNum = Number(product.priceBDT ?? product.basePrice ?? 0);
  const oldPriceNum = (product.oldPriceBDT && Number(product.oldPriceBDT) > priceNum)
    ? Number(product.oldPriceBDT)
    : null;
  const hasDiscount = Boolean(oldPriceNum && oldPriceNum > priceNum);
  const discountPercent = hasDiscount && oldPriceNum > 0
    ? Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100)
    : 0;

  const emi12m = calculateEmi(priceNum, 12);

  const cleanWhatsappNumber = (BRAND_INFO?.whatsapp || "+880 1898-878815").replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(
    `Hello Kinglet Furniture, I am interested in ordering: "${product.name}" (৳${priceNum.toLocaleString()}). Please confirm stock and delivery details.`
  );

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (onAddToCart) onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);
  };

  return (
    <div
      className={`kinglet-posh-card ${className}`}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
      style={{
        background: "#ffffff",
        borderRadius: "14px",
        border: isCardHovered ? "1px solid rgba(236, 34, 38, 0.35)" : "1px solid #eef2f6",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxShadow: isCardHovered
          ? "0 20px 35px -10px rgba(15, 23, 42, 0.12), 0 4px 14px -2px rgba(236, 34, 38, 0.08)"
          : "0 2px 10px rgba(15, 23, 42, 0.04)",
        transform: isCardHovered ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease",
        userSelect: "none",
        WebkitUserSelect: "none",
        caretColor: "transparent",
        ...style,
      }}
    >
      <style>{`
        @keyframes cardHeartBeat {
          0% { transform: scale(1); }
          15% { transform: scale(1.25); }
          30% { transform: scale(1); }
          45% { transform: scale(1.18); }
          70% { transform: scale(1); }
        }
        @keyframes liveRadarDot {
          0% { transform: scale(1); opacity: 0.9; }
          60% { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        .kinglet-card-action-btn {
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .kinglet-card-action-btn:hover {
          transform: translateY(-2px);
        }
        .kinglet-card-action-btn:active {
          transform: translateY(0) scale(0.96);
        }
      `}</style>

      {/* 1:1 Square Image Canvas with Smooth 2nd Image Hover Pop-up */}
      <KingletProductCardImage
        product={product}
        isCardHovered={isCardHovered}
        badges={
          <>
            {discountPercent > 0 && (
              <span
                style={{
                  background: "linear-gradient(135deg, #ff2e34 0%, #ec2226 100%)",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: "800",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: "0 4px 12px rgba(236, 34, 38, 0.35)",
                  letterSpacing: "0.2px",
                }}
              >
                <Flame size={11} fill="#ffffff" />
                <span>{discountPercent}% OFF</span>
              </span>
            )}
            {product.badge && (
              <span
                style={{
                  background: "rgba(15, 23, 42, 0.88)",
                  backdropFilter: "blur(8px)",
                  color: "#ffffff",
                  fontSize: "9.5px",
                  fontWeight: "800",
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                {product.badge}
              </span>
            )}
          </>
        }
        quickActions={
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleWishlist?.(product);
            }}
            title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: isWishlisted ? "#ec2226" : "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(8px)",
              color: isWishlisted ? "#ffffff" : "#475569",
              border: isWishlisted ? "1.5px solid #ec2226" : "1px solid rgba(226, 232, 240, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: isWishlisted
                ? "0 4px 14px rgba(236, 34, 38, 0.35)"
                : "0 4px 12px rgba(0,0,0,0.08)",
              transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: isWishlisted ? "scale(1.05)" : "scale(1)",
            }}
            onMouseEnter={(e) => {
              if (!isWishlisted) {
                e.currentTarget.style.background = "#ec2226";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "#ec2226";
                e.currentTarget.style.transform = "scale(1.12)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isWishlisted) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.92)";
                e.currentTarget.style.color = "#475569";
                e.currentTarget.style.borderColor = "rgba(226, 232, 240, 0.8)";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
          >
            <Heart
              size={15}
              fill={isWishlisted ? "#ffffff" : "none"}
              strokeWidth={2.4}
              style={{
                animation: isWishlisted ? "cardHeartBeat 1.2s ease" : "none",
              }}
            />
          </button>
        }
      />

      {/* Card Content & Action Footer */}
      <div
        style={{
          padding: "13px 14px 14px",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "space-between",
          background: "#ffffff",
        }}
      >
        <div>
          {/* Top Line: Timber Specification */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "5px",
            }}
          >
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: "700",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#ec2226" }} />
              {product.woodType ? product.woodType.split("&")[0].trim() : "Seasoned Mahogany"}
            </span>
          </div>

          {/* Product Name (Bold, Posh Typography with 2-line clamp) */}
          <h3
            style={{
              fontSize: "14.5px",
              fontWeight: "800",
              margin: "0 0 8px",
              lineHeight: "1.3",
              letterSpacing: "-0.2px",
              minHeight: "38px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            <Link
              to={`/product/${product.slug}`}
              style={{
                color: "#0f172a",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ec2226")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#0f172a")}
            >
              {product.name}
            </Link>
          </h3>

          {/* Pricing Row & 0% EMI in Compact Dynamic Alignment */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "6px",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", userSelect: "none", caretColor: "transparent" }}>
              <span style={{ fontSize: "17.5px", fontWeight: "900", color: "#ec2226", letterSpacing: "-0.3px", userSelect: "none", caretColor: "transparent" }}>
                ৳{priceNum.toLocaleString()}
              </span>
              {hasDiscount && oldPriceNum && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    textDecoration: "line-through",
                    fontWeight: "500",
                    userSelect: "none",
                    caretColor: "transparent",
                  }}
                >
                  ৳{oldPriceNum.toLocaleString()}
                </span>
              )}
            </div>

            {/* 0% Interest EMI Badge (Clickable - Opens EMI Calculator) */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onOpenEmi?.(product);
              }}
              title="Click to calculate monthly installment"
              className="kinglet-card-action-btn card-emi-btn"
              style={{
                background: "#fff1f2",
                border: "1px solid rgba(236, 34, 38, 0.25)",
                borderRadius: "6px",
                padding: "3px 8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "10.5px",
                fontWeight: "700",
                color: "#ec2226",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(236, 34, 38, 0.08)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ec2226";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "#ec2226";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff1f2";
                e.currentTarget.style.color = "#ec2226";
                e.currentTarget.style.borderColor = "rgba(236, 34, 38, 0.25)";
              }}
            >
              <CreditCard size={11} />
              <span>EMI: ৳{emi12m.monthlyInstallment.toLocaleString()}/mo</span>
            </button>
          </div>
        </div>

        {/* Bottom Action Footer Row (Quick View / WhatsApp / Quick Add) */}
        <div
          className="card-action-footer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            paddingTop: "10px",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          {/* Quick View Button */}
          <button
            onClick={() => onQuickView && onQuickView(product)}
            title="Quick View Details"
            className="kinglet-card-action-btn card-action-quickview"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "9px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#0f172a";
              e.currentTarget.style.borderColor = "#0f172a";
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.boxShadow = "0 6px 14px rgba(15, 23, 42, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.color = "#334155";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Eye size={16} />
          </button>

          {/* Instant WhatsApp Order / Enquiry Button with Live Pulsing Dot */}
          <a
            href={`https://wa.me/${cleanWhatsappNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            title="Chat on WhatsApp to order"
            className="kinglet-card-action-btn card-action-whatsapp"
            style={{
              flex: 1,
              height: "38px",
              borderRadius: "9px",
              background: "#f0fdf4",
              border: "1.5px solid #22c55e",
              color: "#15803d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: "800",
              textDecoration: "none",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #25D366 0%, #1ea952 100%)";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.boxShadow = "0 6px 18px rgba(37, 211, 102, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f0fdf4";
              e.currentTarget.style.borderColor = "#22c55e";
              e.currentTarget.style.color = "#15803d";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <MessageCircle size={15} strokeWidth={2.2} />
              <span
                style={{
                  position: "absolute",
                  top: "-3px",
                  right: "-4px",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 6px #22c55e",
                }}
              />
            </div>
            <span>WhatsApp</span>
          </a>

          {/* Quick Add to Cart Button (With Dynamic Click Confirmation Feedback) */}
          <button
            onClick={handleQuickAdd}
            title={isAdded ? "Added to Cart!" : "Quick Add to Cart"}
            className="kinglet-card-action-btn card-action-quickadd"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "9px",
              background: isAdded ? "#16a34a" : "#f1f5f9",
              border: "none",
              color: isAdded ? "#ffffff" : "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: isAdded ? "0 4px 14px rgba(22, 163, 74, 0.4)" : "none",
              transform: isAdded ? "scale(1.08)" : "scale(1)",
            }}
            onMouseEnter={(e) => {
              if (!isAdded) {
                e.currentTarget.style.background = "linear-gradient(135deg, #ff2e34 0%, #ec2226 100%)";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(236, 34, 38, 0.45)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isAdded) {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.color = "#0f172a";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {isAdded ? (
              <Check size={17} strokeWidth={2.8} />
            ) : (
              <ShoppingBag size={16} strokeWidth={2.2} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
