import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Heart,
  ShoppingBag,
  ShieldCheck,
  Truck,
  MessageCircle,
  Star,
  CreditCard,
  Sparkles,
  Flame,
  Zap,
  PhoneCall,
  Video,
  ArrowLeftRight,
} from "lucide-react";
import { BRAND_INFO } from "../../data/kingletData";
import { calculateEmi } from "../../utils/emiCalculator";
import { useContactSettings } from "../../utils/siteSettings";

export default function KingletProductModal({
  product,
  onClose,
  currency = "BDT",
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  onToggleCompare,
  isCompared = false,
  onOpenEmi,
  _onOpenCustomSizing,
}) {
  const navigate = useNavigate();
  const contactSettings = useContactSettings();
  const [prevProduct, setPrevProduct] = useState(product);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Identify furniture category for sizing & configuration
  const fixedDimensions = product?.dimensions || "Standard Factory Dimensions";
  const [selectedSize, setSelectedSize] = useState(fixedDimensions);

  // Synchronously adjust state when product changes without cascading renders
  if (prevProduct !== product) {
    setPrevProduct(product);
    setActiveImageIndex(0);
    setQuantity(1);
    setSelectedSize(product?.dimensions || "Standard Factory Dimensions");
  }

  // Lock body & html scroll while modal is open (with scrollbar width compensation)
  useEffect(() => {
    if (product) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      return () => {
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = "";
      };
    }
  }, [product]);

  if (!product) return null;

  // Resolve multiple gallery images
  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

  const currentImage = galleryImages[activeImageIndex] || product.image;

  const priceNum = Number(product.priceBDT ?? product.basePrice ?? 0);
  const oldPriceNum = (product.oldPriceBDT && Number(product.oldPriceBDT) > priceNum)
    ? Number(product.oldPriceBDT)
    : null;

  const displayPrice =
    currency === "USD"
      ? `$${Math.round(priceNum / 122).toLocaleString()}`
      : `৳${priceNum.toLocaleString()}`;

  const hasDiscount = Boolean(oldPriceNum && oldPriceNum > priceNum);
  const oldDisplayPrice =
    hasDiscount && oldPriceNum
      ? (currency === "USD"
        ? `$${Math.round(oldPriceNum / 122).toLocaleString()}`
        : `৳${oldPriceNum.toLocaleString()}`)
      : null;

  const discountPercent = hasDiscount && oldPriceNum > 0
    ? Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100)
    : 0;

  const emi12m = calculateEmi(priceNum, 12);

  const handleCopyCoupon = () => {
    if (product.couponCode && navigator.clipboard) {
      navigator.clipboard.writeText(product.couponCode);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2500);
    }
  };

  const productFinish = product?.finish || product?.finishType || "Factory Standard Finish";

  const whatsappMessage = encodeURIComponent(
    `Hello Kinglet Furniture, I want to order the "${product.name}" (${product.woodType}) priced at ${displayPrice}. Please confirm stock availability and delivery schedule.`
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.2s ease-out",
        overscrollBehavior: "contain",
      }}
      onClick={onClose}
    >
      <div
        className="custom-modal-scroll"
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          maxWidth: "960px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          overscrollBehavior: "contain",
          position: "relative",
          boxShadow: "0 25px 70px -15px rgba(15, 23, 42, 0.25)",
          border: "1px solid #e2e8f0",
          animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Modern Circular Close Button */}
        <button
          onClick={onClose}
          aria-label="Close product view"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            color: "#64748b",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
            transition: "all 0.2s ease",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fee2e2";
            e.currentTarget.style.color = "#ec2226";
            e.currentTarget.style.borderColor = "#fecaca";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.color = "#64748b";
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        <div
          className="quick-view-modal-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "32px",
            padding: "32px",
          }}
        >
          {/* ============================================================
              LEFT: Interactive Gallery & Guarantees
              ============================================================ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Primary Main Image Canvas (Strict 1:1 or 4:3 Ratio) */}
            <div
              style={{
                borderRadius: "14px",
                overflow: "hidden",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                position: "relative",
                aspectRatio: "1 / 1",
                boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
              }}
            >
              <img
                src={currentImage}
                alt={product.name}
                width="500"
                height="500"
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/images/furniture-placeholder.svg";
                }}
              />

              {/* Floating Badges */}
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  zIndex: 2,
                }}
              >
                {discountPercent > 0 && (
                  <span
                    style={{
                      background: "linear-gradient(135deg, #ff3b30 0%, #ec2226 100%)",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: "800",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      boxShadow: "0 2px 10px rgba(236, 34, 38, 0.4)",
                    }}
                  >
                    <Flame size={12} fill="#ffffff" />
                    <span>{discountPercent}% OFF</span>
                  </span>
                )}

                {product.badge && (
                  <span
                    style={{
                      background: "#0f172a",
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: "800",
                      padding: "4px 9px",
                      borderRadius: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {product.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Interactive Thumbnail Gallery Selector */}
            {galleryImages.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  overflowX: "auto",
                  paddingBottom: "4px",
                }}
              >
                {galleryImages.map((img, idx) => {
                  const isActive = activeImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "8px",
                        border: isActive ? "2px solid #ec2226" : "1.5px solid #e2e8f0",
                        padding: "2px",
                        background: "#ffffff",
                        cursor: "pointer",
                        overflow: "hidden",
                        flexShrink: 0,
                        transform: isActive ? "scale(1.05)" : "scale(1)",
                        boxShadow: isActive ? "0 4px 12px rgba(236, 34, 38, 0.25)" : "none",
                        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    >
                      <img
                        src={img}
                        alt={`Thumb ${idx + 1}`}
                        width="60"
                        height="60"
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          aspectRatio: "1 / 1",
                          objectFit: "cover",
                          borderRadius: "6px",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick Trust & Assurance Guarantee Box */}
            <div
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <ShieldCheck size={18} color="#ec2226" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0f172a" }}>
                    {product.warranty || "10 Years Timber Warranty"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                    Vacuum kiln-dried timber with 100% termite & borer anti-infestation guarantee.
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px dashed #e2e8f0",
                  paddingTop: "10px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <Truck size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0f172a" }}>
                    Nationwide Safe Delivery
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                    Carefully packaged and safely delivered to your home anywhere in Bangladesh.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              RIGHT: Product Details, Customization & Actions
              ============================================================ */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              {/* Top Category Tag Pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "#ec2226",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "8px",
                  background: "#fef2f2",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid #fee2e2",
                }}
              >
                <Sparkles size={11} color="#ec2226" />
                <span>
                  {product.categoryLabel || "Solid Wood Collection"} • {product.woodType || "Seasoned Timber"}
                </span>
              </div>

              {/* Product Title */}
              <h2
                style={{
                  fontSize: "26px",
                  fontWeight: "900",
                  color: "#0f172a",
                  lineHeight: "1.25",
                  letterSpacing: "-0.5px",
                  margin: "0 0 10px",
                }}
              >
                {product.name}
              </h2>

              {/* Customer Rating & Reviews */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", gap: "2px" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      color="#f59e0b"
                      fill="#f59e0b"
                    />
                  ))}
                </div>
                <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "600" }}>
                  {product.rating || 5}.0 ({product.reviewsCount || 38} verified buyer reviews)
                </span>
              </div>

              {/* Price & In-Stock Status Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                  padding: "12px 16px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                  <span style={{ fontSize: "28px", fontWeight: "900", color: "#ec2226" }}>
                    {displayPrice}
                  </span>
                  {oldDisplayPrice && (
                    <span
                      style={{
                        fontSize: "16px",
                        color: "#94a3b8",
                        textDecoration: "line-through",
                        fontWeight: "500",
                      }}
                    >
                      {oldDisplayPrice}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {/* In Stock Badge */}
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: "700",
                      color: "#166534",
                      background: "#dcfce7",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "1px solid #bbf7d0",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#16a34a",
                      }}
                    />
                    In Stock & Factory Ready
                  </span>

                  {/* 0% EMI Badge */}
                  <button
                    type="button"
                    onClick={() => onOpenEmi && onOpenEmi(product)}
                    title="Calculate monthly installment"
                    style={{
                      fontSize: "11.5px",
                      fontWeight: "700",
                      color: "#ec2226",
                      background: "#fff5f5",
                      border: "1px solid rgba(236, 34, 38, 0.25)",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#ec2226";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff5f5";
                      e.currentTarget.style.color = "#ec2226";
                    }}
                  >
                    <CreditCard size={12} />
                    <span>EMI: ৳{emi12m.monthlyInstallment.toLocaleString()}/mo</span>
                  </button>
                </div>
              </div>

              {/* Attached Coupon Offer Pill - Strictly Fixed Price Only */}
              {!hasDiscount && product.couponCode && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                    border: "1.5px dashed #f59e0b",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🎟️</span>
                    <span style={{ fontSize: "11.5px", color: "#92400e" }}>
                      Coupon Offer: Use code <strong style={{ background: "#fde68a", padding: "1px 4px", borderRadius: "3px" }}>{product.couponCode}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCoupon}
                    style={{
                      background: copiedCoupon ? "#10b981" : "#d97706",
                      color: "#ffffff",
                      border: "none",
                      padding: "4px 10px",
                      borderRadius: "5px",
                      fontSize: "10.5px",
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                  >
                    {copiedCoupon ? "✓ Copied!" : "Copy Code"}
                  </button>
                </div>
              )}

              {/* Description */}
              <p
                style={{
                  color: "#475569",
                  fontSize: "13.5px",
                  lineHeight: "1.65",
                  margin: "0 0 18px",
                }}
              >
                {product.description}
              </p>


              {/* Dimensions & Specifications Card */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontSize: "12.5px",
                }}
              >
                <div>
                  <span style={{ color: "#64748b", fontWeight: "500" }}>Dimensions: </span>
                  <strong style={{ color: "#0f172a", fontWeight: "700" }}>
                    {product.dimensions || "Standard Metric Sizing"}
                  </strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontWeight: "500" }}>Timber Chassis: </span>
                  <strong style={{ color: "#0f172a", fontWeight: "700" }}>
                    {product.woodType || "Seasoned Mahogany & Mahogany"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Luxury Dynamic Purchase Action Suite */}
            <div style={{ marginTop: "12px", marginBottom: "8px" }}>
              <style>{`
                @keyframes modalShimmer {
                  0% { transform: translateX(-120%); }
                  100% { transform: translateX(220%); }
                }
                @keyframes modalRadarPing {
                  0% { transform: scale(1); opacity: 0.9; }
                  50% { transform: scale(1.6); opacity: 0; }
                  100% { transform: scale(1); opacity: 0; }
                }
                @keyframes modalHeartBeat {
                  0% { transform: scale(1); }
                  14% { transform: scale(1.25); }
                  28% { transform: scale(1); }
                  42% { transform: scale(1.18); }
                  70% { transform: scale(1); }
                }
                .btn-modal-luxe {
                  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
                  position: relative;
                  overflow: hidden;
                }
                .btn-modal-luxe:hover {
                  transform: translateY(-2px);
                }
                .btn-modal-luxe:active {
                  transform: translateY(1px) scale(0.98);
                }
                .modal-shimmer-sheen {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 45%;
                  height: 100%;
                  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
                  transform: skewX(-25deg);
                  animation: modalShimmer 3.5s infinite ease-in-out;
                  pointer-events: none;
                }
              `}</style>

              {/* ROW 1: Quantity Stepper, Add to Cart (Hero Button), Buy Now, Wishlist */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto auto",
                  gap: "8px",
                  alignItems: "stretch",
                  marginBottom: "10px",
                }}
              >
                {/* Stepper */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "2px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    height: "46px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={{
                      width: "32px",
                      height: "100%",
                      background: "#f1f5f9",
                      border: "none",
                      borderRadius: "7px",
                      fontSize: "16px",
                      fontWeight: 700,
                      cursor: "pointer",
                      color: "#334155",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      width: "34px",
                      textAlign: "center",
                      fontWeight: 800,
                      fontSize: "15px",
                      color: "#0f172a",
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    style={{
                      width: "32px",
                      height: "100%",
                      background: "#f1f5f9",
                      border: "none",
                      borderRadius: "7px",
                      fontSize: "16px",
                      fontWeight: 700,
                      cursor: "pointer",
                      color: "#334155",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart (Hero Button) */}
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart({ ...product, selectedFinish: productFinish, selectedSize, quantity });
                    onClose();
                  }}
                  className="btn-modal-luxe"
                  style={{
                    height: "46px",
                    background: "linear-gradient(135deg, #ff2e34 0%, #ec2226 55%, #c8161a 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "0 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 6px 20px -3px rgba(236, 34, 38, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                  }}
                >
                  <div className="modal-shimmer-sheen" />
                  <ShoppingBag size={18} strokeWidth={2.4} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }} />
                  <div style={{ textAlign: "left", lineHeight: 1.1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "0.2px", textTransform: "uppercase" }}>
                      Add to Cart
                    </div>
                    <div style={{ fontSize: "10.5px", fontWeight: 600, opacity: 0.9 }}>
                      ৳{(product.priceBDT * quantity).toLocaleString()}
                    </div>
                  </div>
                </button>

                {/* Buy Now (Express) */}
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart({ ...product, selectedFinish: productFinish, selectedSize, quantity });
                    onClose();
                    navigate("/checkout");
                  }}
                  className="btn-modal-luxe"
                  style={{
                    height: "46px",
                    padding: "0 14px",
                    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 60%, #020617 100%)",
                    color: "#ffffff",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.25)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#fbbf24";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(251, 191, 36, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(15, 23, 42, 0.25)";
                  }}
                >
                  <Zap size={15} fill="#fbbf24" color="#fbbf24" />
                  <span style={{ fontSize: "12.5px", fontWeight: 800 }}>Buy Now</span>
                </button>

                {/* Wishlist */}
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product)}
                  className="btn-modal-luxe"
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "10px",
                    border: isWishlisted ? "1.5px solid #ec2226" : "1.5px solid #e2e8f0",
                    background: isWishlisted ? "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)" : "#ffffff",
                    color: isWishlisted ? "#ec2226" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: isWishlisted ? "0 4px 14px rgba(236,34,38,0.25)" : "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                  title={isWishlisted ? "Saved in Wishlist" : "Save to Wishlist"}
                >
                  <Heart
                    size={18}
                    fill={isWishlisted ? "#ec2226" : "none"}
                    strokeWidth={2.4}
                    style={{
                      animation: isWishlisted ? "modalHeartBeat 1.2s ease" : "none",
                    }}
                  />
                </button>

                {/* Compare */}
                <button
                  type="button"
                  onClick={() => onToggleCompare && onToggleCompare(product)}
                  className="btn-modal-luxe"
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "10px",
                    border: isCompared ? "1.5px solid #2563eb" : "1.5px solid #e2e8f0",
                    background: isCompared ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" : "#ffffff",
                    color: isCompared ? "#2563eb" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: isCompared ? "0 4px 14px rgba(37,99,235,0.25)" : "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                  title={isCompared ? "In Comparison (Click to remove)" : "Compare with Other Furniture"}
                >
                  <ArrowLeftRight size={18} strokeWidth={2.4} />
                </button>
              </div>

              {/* ROW 2: Live Showroom WhatsApp Video Inspection + Call Hotline */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                <a
                  href={`https://wa.me/${contactSettings.cleanWhatsapp || BRAND_INFO.whatsapp}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-modal-luxe"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: "linear-gradient(135deg, #25D366 0%, #1ea952 100%)",
                    color: "#ffffff",
                    height: "42px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
                    padding: "0 10px",
                  }}
                >
                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span
                      style={{
                        position: "absolute",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.4)",
                        animation: "modalRadarPing 2s infinite cubic-bezier(0, 0, 0.2, 1)",
                        pointerEvents: "none",
                      }}
                    />
                    <Video size={16} color="#ffffff" strokeWidth={2.4} />
                  </div>
                  <div style={{ textAlign: "left", lineHeight: 1.1 }}>
                    <div style={{ fontSize: "11.5px", fontWeight: 800 }}>Showroom Video</div>
                    <div style={{ fontSize: "9.5px", opacity: 0.9 }}>Live WhatsApp Cam</div>
                  </div>
                </a>

                <a
                  href={contactSettings.phoneCallUrl || `tel:${BRAND_INFO.phone}`}
                  className="btn-modal-luxe"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                    color: "#ffffff",
                    height: "42px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.2)",
                    padding: "0 10px",
                  }}
                >
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <PhoneCall size={15} color="#38bdf8" strokeWidth={2.4} />
                    <span
                      style={{
                        position: "absolute",
                        top: "-2px",
                        right: "-2px",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#22c55e",
                      }}
                    />
                  </div>
                  <div style={{ textAlign: "left", lineHeight: 1.1 }}>
                    <div style={{ fontSize: "11.5px", fontWeight: 800 }}>{contactSettings.phone || BRAND_INFO.phone}</div>
                    <div style={{ fontSize: "9.5px", color: "#94a3b8" }}>Manager Desk</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
