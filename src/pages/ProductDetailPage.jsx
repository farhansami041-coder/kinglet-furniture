import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Star, ShoppingBag, Heart, MessageCircle, Truck, 
  ShieldCheck, Check, ChevronRight, ChevronDown, CreditCard, Phone, Send, ThumbsUp,
  Ruler, Layers, Zap, ArrowLeftRight, Loader2
} from "lucide-react";
import { PRODUCTS, BRAND_INFO, CUSTOMER_REVIEWS } from "../data/kingletData";
import { productService } from "../utils/productService";
import KingletProductCardImage from "../components/Products/KingletProductCardImage";
import KingletSEO from "../components/Common/KingletSEO";
import NotFoundPage from "./NotFoundPage";
import { EMI_PLANS, BD_BANKS, calculateEmi, getLowestMonthlyEmi } from "../utils/emiCalculator";
import { useContactSettings } from "../utils/siteSettings";

export default function ProductDetailPage({
  onAddToCart,
  onToggleWishlist,
  onToggleCompare,
  wishlistIds = [],
  isWishlisted: isWishlistedProp,
  compareItems = [],
  isCompared: isComparedProp,
  onOpenEmi,
  onOpenCustomSizing,
}) {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Initial local state with fallback
  const initialLocalProduct = PRODUCTS.find((p) => p.slug === slug || String(p.id) === slug);
  const [product, setProduct] = useState(initialLocalProduct);
  const [loading, setLoading] = useState(!initialLocalProduct);
  const contactSettings = useContactSettings();

  useEffect(() => {
    let isMounted = true;
    async function loadLiveProduct() {
      try {
        const live = await productService.getProductBySlugOrId(slug);
        if (isMounted && live) {
          setProduct((prev) => ({
            ...prev,
            ...live,
            priceBDT: live.priceBDT ?? live.basePrice ?? prev?.priceBDT,
            oldPriceBDT: (live.oldPriceBDT !== undefined) ? live.oldPriceBDT : (live.oldPrice !== undefined ? live.oldPrice : null),
            woodType: live.woodType ?? live.primaryMaterial ?? prev?.woodType,
            dimensions: live.dimensions ?? prev?.dimensions,
            finish: live.finish ?? live.finishType ?? prev?.finish,
            hardware: live.hardware ?? prev?.hardware,
            seasoningMethod: live.seasoningMethod ?? prev?.seasoningMethod,
            images: live.images?.length > 0 ? live.images : (live.image ? [live.image] : prev?.images || []),
            image: live.image || live.images?.[0] || prev?.image,
          }));
        }
      } catch (e) {
        console.warn("Could not fetch live product detail:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLiveProduct();
    const handleUpdate = () => loadLiveProduct();
    window.addEventListener("kinglet:products-updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("kinglet:products-updated", handleUpdate);
    };
  }, [slug]);

  // Identify furniture category for contextual labelling
  const productNameLower = (product?.name || "").toLowerCase();
  const productCatLower = (product?.category || "").toLowerCase();
  const productSubLower = (product?.subcategory || "").toLowerCase();

  const isBed =
    productCatLower === "bed-room" &&
    (productNameLower.includes("bed") || productNameLower.includes("khat") || productSubLower.includes("bed"));

  const isAlmirah =
    productNameLower.includes("almirah") ||
    productNameLower.includes("almira") ||
    productNameLower.includes("wardrobe") ||
    productNameLower.includes("almari") ||
    productSubLower.includes("almirah") ||
    productSubLower.includes("wardrobe");

  const fixedWood = product?.woodType || "Seasoned Mahogany";
  const fixedDimension = product?.dimensions || "Standard Factory Dimensions";

  const [prevSlug, setPrevSlug] = useState(slug);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("specs");
  const [addedAnim, setAddedAnim] = useState(false);
  const [wishlistBurst, setWishlistBurst] = useState(false);
  const [compareBurst, setCompareBurst] = useState(false);
  const [wishlistHover, setWishlistHover] = useState(false);
  const [compareHover, setCompareHover] = useState(false);

  // Interactive customer review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ name: "", location: "Dhaka", rating: 5, comment: "" });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [selectedEmiTenure, setSelectedEmiTenure] = useState(12);
  const [isEmiExpanded, setIsEmiExpanded] = useState(false);
  const [dbReviews, setDbReviews] = useState([]);
  const [_reviewsLoading, setReviewsLoading] = useState(false);
  const [localReviews, setLocalReviews] = useState(() => {
    try {
      if (!product) return [];
      const saved = localStorage.getItem(`kinglet_reviews_${product.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch live verified reviews from backend DB
  useEffect(() => {
    if (!product?.id) return;
    let isMounted = true;
    setReviewsLoading(true);
    fetch(`/api/v1/reviews/product/${encodeURIComponent(product.id)}`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && Array.isArray(json.data?.reviews)) {
          setDbReviews(json.data.reviews);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setReviewsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [product?.id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    if (!newReview.name.trim() || !newReview.comment.trim()) {
      setReviewError("Please provide your name and review details.");
      return;
    }

    setReviewSubmitLoading(true);
    try {
      const res = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: String(product.id),
          customerName: newReview.name.trim(),
          authorLocation: newReview.location.trim() || "Dhaka",
          rating: Number(newReview.rating),
          comment: newReview.comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to publish verified review.");
      }

      const createdReview = data.data || {
        id: Date.now(),
        authorName: newReview.name.trim(),
        authorLocation: newReview.location.trim() || "Dhaka",
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        createdAt: new Date().toISOString(),
        isVerifiedBuyer: data.data?.isVerifiedBuyer || false,
      };

      setDbReviews((prev) => [createdReview, ...prev]);
      setReviewSubmitted(true);
      setTimeout(() => {
        setShowReviewForm(false);
        setReviewSubmitted(false);
        setNewReview({ name: "", location: "Dhaka", rating: 5, comment: "" });
      }, 2000);
    } catch (err) {
      console.error("Review submit error:", err);
      setReviewError(err.message || "Failed to submit review.");
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  if (!product) {
    if (loading) {
      return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "#ec2226", fontWeight: "700" }}>Loading Product Details...</div>
        </div>
      );
    }
    return <NotFoundPage />;
  }

  if (prevSlug !== slug) {
    setPrevSlug(slug);
    setActiveImageIndex(0);
    setQuantity(1);
  }

  const priceNum = Number(product.priceBDT ?? product.basePrice ?? 0);
  const oldPriceNum = (product.oldPriceBDT && Number(product.oldPriceBDT) > priceNum)
    ? Number(product.oldPriceBDT)
    : null;
  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const isWishlisted = typeof isWishlistedProp === "function"
    ? isWishlistedProp(product)
    : (Array.isArray(wishlistIds) && wishlistIds.some((wid) => String(wid) === String(product.id)));
  const isCompared = typeof isComparedProp === "function"
    ? isComparedProp(product)
    : (Array.isArray(compareItems) && compareItems.some((ci) => String(ci.id) === String(product.id) || (product.slug && ci.slug === product.slug)));
  const hasDiscount = Boolean(oldPriceNum && oldPriceNum > priceNum);
  const discountPercent = hasDiscount && oldPriceNum > 0
    ? Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100) 
    : 0;

  const handleCopyCoupon = () => {
    if (product.couponCode && navigator.clipboard) {
      navigator.clipboard.writeText(product.couponCode);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2500);
    }
  };

  const emiPerMonth = Math.round(priceNum / 12);

  // Related products
  const relatedProducts = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  // Google 1st Page Product Rich Snippet Schema
  const allReviewsList = [...dbReviews, ...localReviews, ...CUSTOMER_REVIEWS];
  const avgRating = 4.9;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images,
    description: `${product.name} crafted from 100% kiln-seasoned ${product.woodType || "Seasoned Mahogany & German Oak Veneer"}. Dimensions: ${product.dimensions || "Standard"}. High-grade Italian PU lacquer finishing.`,
    sku: product.sku || `KL-${product.id}`,
    mpn: `KL-MPN-${product.id}`,
    brand: {
      "@type": "Brand",
      name: "Kinglet Bangladesh Ltd",
    },
    material: product.woodType || "Seasoned Mahogany",
    offers: {
      "@type": "Offer",
      url: `https://www.kingletbd.com/product/${product.slug || product.id}`,
      priceCurrency: "BDT",
      price: product.priceBDT,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      priceValidUntil: "2027-12-31",
      seller: {
        "@type": "Organization",
        name: "Kinglet Bangladesh Ltd",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "800",
          currency: "BDT",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "BD",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "d",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 4,
            unitCode: "d",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "BD",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 3,
        returnMethod: "https://schema.org/ReturnInStore",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: String(avgRating),
      reviewCount: String(allReviewsList.length),
      bestRating: "5",
      worstRating: "1",
    },
    review: allReviewsList.slice(0, 5).map((rev) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: rev.authorName || rev.name || "Customer",
      },
      datePublished: rev.createdAt ? rev.createdAt.split("T")[0] : "2026-10-15",
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(rev.rating || 5),
        bestRating: "5",
        worstRating: "1",
      },
      reviewBody: rev.comment,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.kingletbd.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.categoryLabel || product.category || "Furniture",
        item: `https://www.kingletbd.com/category/${product.categorySlug || product.category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `https://www.kingletbd.com/product/${product.slug || product.id}`,
      },
    ],
  };

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", paddingBottom: "70px" }}>
      {/* Search Engine Optimization (SEO) & Google Product Schema */}
      <KingletSEO
        title={`${product.name} Price in Bangladesh | Kinglet Furniture`}
        description={`Buy ${product.name} online in Bangladesh. Made from authentic seasoned ${product.woodType || "Mahogany & Oak Veneer"} with Italian PU finishing. Price: ৳${priceNum.toLocaleString()}. 10-Year Timber Guarantee.`}
        keywords={`${product.name}, ${product.name} price in Bangladesh, ${product.category} price in BD, mahogany furniture, black plum wood, canadian oak veneer, german oak veneer, Kinglet Furniture`}
        ogImage={images[0] || product.image}
        ogType="product"
        canonicalUrl={`https://www.kingletbd.com/product/${product.slug || product.id}`}
        schemaJson={[productSchema, breadcrumbSchema]}
      />

      {/* Breadcrumb Bar */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb", padding: "12px 0" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
            <Link to="/" style={{ color: "#374151", textDecoration: "none" }}>Home</Link>
            <ChevronRight size={13} />
            <Link to={`/category/${product.categorySlug || product.category}`} style={{ color: "#374151", textDecoration: "none", textTransform: "capitalize" }}>
              {product.categoryLabel || product.category}
            </Link>
            <ChevronRight size={13} />
            <span style={{ color: "#ec2226", fontWeight: "600" }}>{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "25px" }}>
        {/* Main Product Container */}
        <div className="pdp-container-box" style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          <div className="pdp-hero-grid">
            
            {/* Left: Gallery */}
            <div>
              {/* Primary Image */}
              <div className="pdp-gallery-container" style={{ position: "relative", width: "100%", background: "#f3f4f6", borderRadius: "10px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                <img 
                  src={images[activeImageIndex] || product.image} 
                  alt={`${product.name} - ${product.woodType || "Seasoned Mahogany"}`}
                  width="800"
                  height="800"
                  fetchPriority="high"
                  loading="eager"
                  decoding="sync"
                  style={{ width: "100%", height: "100%", aspectRatio: "1 / 1", objectFit: "cover" }}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/furniture-placeholder.svg"; }}
                />

                {discountPercent > 0 && (
                  <span style={{ position: "absolute", top: "14px", left: "14px", background: "#ec2226", color: "#ffffff", fontSize: "12px", fontWeight: "800", padding: "5px 10px", borderRadius: "6px" }}>
                    {discountPercent}% OFF
                  </span>
                )}

                <span style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(17,24,39,0.85)", color: "#ffffff", fontSize: "11px", fontWeight: "700", padding: "4px 9px", borderRadius: "6px", backdropFilter: "blur(4px)" }}>
                  SKU: {product.sku || `KL-${product.id}`}
                </span>
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div style={{ display: "flex", gap: "10px", marginTop: "14px", overflowX: "auto", scrollbarWidth: "thin", paddingBottom: "4px", WebkitOverflowScrolling: "touch" }}>
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      style={{
                        width: "80px",
                        height: "75px",
                        flexShrink: 0,
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: activeImageIndex === idx ? "2px solid #ec2226" : "1px solid #d1d5db",
                        padding: 0,
                        background: "#f9fafb",
                        cursor: "pointer",
                        opacity: activeImageIndex === idx ? 1 : 0.7,
                      }}
                      aria-label={`${product.name} view ${idx + 1}`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        width="80"
                        height="80"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/furniture-placeholder.svg"; }}
                        style={{ width: "100%", height: "100%", aspectRatio: "1 / 1", objectFit: "cover" }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Assurance Trust Badges (Inspired by HATIL & ISHO) */}
              <div className="pdp-assurance-grid" style={{ marginTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <ShieldCheck size={22} color="#ec2226" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>10-Year Warranty</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Anti-termite & seasoned timber</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <Truck size={22} color="#ec2226" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>Safe Doorstep Delivery</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Fee based on your location</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Product Details & Purchase Form */}
            <div style={{ minWidth: 0, maxWidth: "100%", width: "100%", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "#ec2226", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Kinglet Signature Series
                </span>
                <span style={{ color: "#d1d5db" }}>•</span>
                <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Check size={13} /> In Stock (Mirpur Showroom & Factory Hub)
                </span>
              </div>

              <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#111827", margin: "0 0 8px", lineHeight: "1.25" }}>
                {product.name}
              </h1>

              {/* Model, SKU & Category Tags */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", background: "#f1f5f9", color: "#334155", fontWeight: "700", padding: "3px 8px", borderRadius: "4px" }}>
                  Model / SKU: {product.sku || `KL-${product.id}`}
                </span>
                {product.childCategoryLabel && (
                  <span style={{ fontSize: "12px", background: "#eff6ff", color: "#1d4ed8", fontWeight: "700", padding: "3px 8px", borderRadius: "4px" }}>
                    {product.childCategoryLabel}
                  </span>
                )}
                {product.subcategoryLabel && (
                  <span style={{ fontSize: "12px", background: "#fdf2f8", color: "#9d174d", fontWeight: "700", padding: "3px 8px", borderRadius: "4px" }}>
                    {product.subcategoryLabel}
                  </span>
                )}
              </div>

              {/* Ratings */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ display: "flex", color: "#ec2226" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="#ec2226" />
                  ))}
                </div>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#1f2937" }}>5.0</span>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>({product.reviewsCount || 38} Verified Buyer Reviews)</span>
              </div>

              {/* Pricing & Value Proposition Card */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px 18px",
                  marginBottom: "16px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                }}
              >
                {/* Top: Price Row + Discount Badge + EMI Pill */}
                <div className="pdp-price-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", width: "100%", boxSizing: "border-box" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap", minWidth: 0 }}>
                    <span style={{ fontSize: "clamp(24px, 5.5vw, 30px)", fontWeight: "900", color: "#ec2226", letterSpacing: "-0.5px", lineHeight: 1 }}>
                      ৳{priceNum.toLocaleString()}
                    </span>
                    {hasDiscount && oldPriceNum && (
                      <span style={{ fontSize: "15px", color: "#94a3b8", textDecoration: "line-through", fontWeight: 500 }}>
                        ৳{oldPriceNum.toLocaleString()}
                      </span>
                    )}
                    {hasDiscount && discountPercent > 0 && oldPriceNum && (
                      <span
                        style={{
                          background: "#fef2f2",
                          color: "#b91c1c",
                          border: "1px solid #fecaca",
                          fontSize: "11px",
                          fontWeight: "800",
                          padding: "3px 8px",
                          borderRadius: "20px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        Save ৳{(oldPriceNum - priceNum).toLocaleString()} ({discountPercent}% OFF)
                      </span>
                    )}
                  </div>

                  {/* Quick EMI Pill */}
                  <button
                    type="button"
                    className="pdp-quick-emi-pill"
                    onClick={() => {
                      setIsEmiExpanded((prev) => !prev);
                      setTimeout(() => {
                        const el = document.getElementById("pdp-emi-section");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }, 50);
                    }}
                    style={{
                      background: "linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)",
                      border: "1px solid #fca5a5",
                      borderRadius: "20px",
                      padding: "5px 12px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 3px 8px rgba(236,34,38,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <CreditCard size={13} color="#ec2226" />
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#ec2226" }}>
                      EMI from ৳{getLowestMonthlyEmi(priceNum).toLocaleString()}/mo ↗
                    </span>
                  </button>
                </div>

                {/* Bottom: Inclusive VAT + Delivery Details */}
                <div
                  style={{
                    fontSize: "11.5px",
                    color: "#64748b",
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  <span>✓ All Taxes & VAT Included • Cash on Delivery inside Dhaka</span>
                  <span style={{ color: "#059669", fontWeight: "700" }}>
                    🛡️ 10-Year Timber Warranty
                  </span>
                </div>
              </div>

              {/* Optional Coupon Offer Box - Strictly Fixed Price Only */}
              {!hasDiscount && product.couponCode && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                    border: "1.5px dashed #f59e0b",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    marginBottom: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>🎟️</span>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 800, color: "#92400e" }}>
                        Special Coupon Offer Available!
                      </div>
                      <div style={{ fontSize: "11px", color: "#b45309" }}>
                        Use code <strong style={{ letterSpacing: "0.5px", background: "#fde68a", padding: "1px 5px", borderRadius: "3px" }}>{product.couponCode}</strong> at checkout for additional instant discount.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCoupon}
                    style={{
                      background: copiedCoupon ? "#10b981" : "#d97706",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "background 0.2s",
                    }}
                  >
                    {copiedCoupon ? "✓ Copied!" : "Copy Code"}
                  </button>
                </div>
              )}

              {/* Phase 2: Interactive Bank EMI Installment Facility (Collapsible Inside Button) */}
              {(() => {
                const emiCalc = calculateEmi(priceNum, selectedEmiTenure);
                return (
                  <div
                    id="pdp-emi-section"
                    style={{
                      background: "#ffffff",
                      border: isEmiExpanded ? "1.5px solid #ec2226" : "1.5px solid #e2e8f0",
                      borderRadius: "14px",
                      marginBottom: "20px",
                      boxShadow: isEmiExpanded ? "0 4px 18px rgba(236, 34, 38, 0.08)" : "0 2px 8px rgba(15, 23, 42, 0.03)",
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                      overflow: "hidden",
                      transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    {/* Collapsible Trigger Button / Banner */}
                    <button
                      type="button"
                      className="pdp-emi-trigger-btn"
                      onClick={() => setIsEmiExpanded(!isEmiExpanded)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        background: isEmiExpanded ? "linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)" : "#ffffff",
                        border: "none",
                        borderBottom: isEmiExpanded ? "1px solid #fee2e2" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        textAlign: "left",
                        gap: "8px",
                        boxSizing: "border-box",
                        overflow: "hidden",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isEmiExpanded) e.currentTarget.style.background = "#fbfcfd";
                      }}
                      onMouseLeave={(e) => {
                        if (!isEmiExpanded) e.currentTarget.style.background = "#ffffff";
                      }}
                      aria-expanded={isEmiExpanded}
                      aria-controls="pdp-emi-content"
                    >
                      {/* Left: Icon + Title + Lowest EMI Teaser */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 auto", minWidth: 0, overflow: "hidden" }}>
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "8px",
                            background: "#fee2e2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ec2226",
                            flexShrink: 0,
                          }}
                        >
                          <CreditCard size={16} color="#ec2226" />
                        </div>
                        <div style={{ minWidth: 0, overflow: "hidden" }}>
                          <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", lineHeight: 1.2 }}>
                            <span style={{ whiteSpace: "nowrap" }}>Bank EMI Facility</span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: "800",
                                color: "#ec2226",
                                background: "#fff5f5",
                                border: "1px solid #fecaca",
                                padding: "2px 6px",
                                borderRadius: "10px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              From ৳{getLowestMonthlyEmi(priceNum).toLocaleString()}/mo
                            </span>
                          </div>
                          <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "500", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            ০% ডাউনপেমেন্টে ৩ থেকে ৩৬ মাসের সহজ কিস্তি (১৮+ ব্যাংক)
                          </div>
                        </div>
                      </div>

                      {/* Right: Expand / Collapse Pill Indicator */}
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "750",
                            color: isEmiExpanded ? "#b91c1c" : "#1d4ed8",
                            background: isEmiExpanded ? "#fee2e2" : "#eff6ff",
                            border: isEmiExpanded ? "1px solid #fca5a5" : "1px solid #bfdbfe",
                            padding: "3px 8px",
                            borderRadius: "14px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            whiteSpace: "nowrap",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span>{isEmiExpanded ? "Hide" : "Plans"}</span>
                          <ChevronDown
                            size={13}
                            style={{
                              transform: isEmiExpanded ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}
                          />
                        </span>
                      </div>
                    </button>

                    {/* Collapsible Content: Only Shown When Button is Clicked */}
                    {isEmiExpanded && (
                      <div id="pdp-emi-content" style={{ padding: "16px", animation: "fadeIn 0.2s ease-out" }}>
                        {/* Header Inside Expanded Card */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                          <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#475569" }}>
                            Select Installment Tenure (কিস্তির মেয়াদ নির্বাচন করুন):
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenEmi?.(product)}
                            style={{
                              fontSize: "11px",
                              fontWeight: "750",
                              color: "#1d4ed8",
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              padding: "4px 10px",
                              borderRadius: "16px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#dbeafe";
                              e.currentTarget.style.borderColor = "#93c5fd";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#eff6ff";
                              e.currentTarget.style.borderColor = "#bfdbfe";
                            }}
                          >
                            <span>Calculator & 18 Banks</span>
                            <ChevronRight size={12} />
                          </button>
                        </div>

                        {/* Tenure Selection Grid: Sleek 4 Columns x 2 Rows */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                            gap: "6px",
                            marginBottom: "12px",
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        >
                          {EMI_PLANS.map((plan) => {
                            const isSelected = selectedEmiTenure === plan.tenure;
                            const planCalc = calculateEmi(priceNum, plan.tenure);
                            return (
                              <button
                                key={plan.tenure}
                                type="button"
                                className="pdp-emi-tenure-btn"
                                onClick={() => setSelectedEmiTenure(plan.tenure)}
                                style={{
                                  padding: "8px 4px",
                                  borderRadius: "8px",
                                  border: isSelected ? "2px solid #ec2226" : "1px solid #e2e8f0",
                                  background: isSelected ? "linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)" : "#ffffff",
                                  boxShadow: isSelected ? "0 3px 8px rgba(236, 34, 38, 0.12)" : "0 1px 2px rgba(0,0,0,0.02)",
                                  cursor: "pointer",
                                  textAlign: "center",
                                  position: "relative",
                                  transition: "all 0.15s ease-in-out",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: "2px",
                                  width: "100%",
                                  minWidth: 0,
                                  boxSizing: "border-box",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = "#cbd5e1";
                                    e.currentTarget.style.background = "#f8fafc";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = "#e2e8f0";
                                    e.currentTarget.style.background = "#ffffff";
                                  }
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                                  <span style={{ fontSize: "12px", fontWeight: "800", color: isSelected ? "#ec2226" : "#0f172a", whiteSpace: "nowrap" }}>
                                    {plan.tenure} Mos
                                  </span>
                                </div>
                                <span
                                  style={{
                                    fontSize: "9.5px",
                                    fontWeight: "700",
                                    padding: "1px 5px",
                                    borderRadius: "8px",
                                    background: isSelected ? "#fee2e2" : "#f1f5f9",
                                    color: isSelected ? "#b91c1c" : "#64748b",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {plan.rate}%
                                </span>
                                <div style={{ fontSize: "11px", fontWeight: "800", color: isSelected ? "#ec2226" : "#1e293b", marginTop: "1px", whiteSpace: "nowrap" }}>
                                  ৳{planCalc.monthlyInstallment.toLocaleString()}<span style={{ fontSize: "9px", fontWeight: "600", color: "#64748b" }}>/mo</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Calculation Summary Card */}
                        <div
                          style={{
                            background: "linear-gradient(135deg, #fff5f5 0%, #ffffff 50%, #f8fafc 100%)",
                            border: "1px solid #fecaca",
                            borderRadius: "10px",
                            padding: "12px 14px",
                            marginBottom: "12px",
                            width: "100%",
                            maxWidth: "100%",
                            boxSizing: "border-box",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                            <div>
                              <div style={{ fontSize: "10.5px", fontWeight: "750", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Monthly Installment ({emiCalc.tenure} Months Plan)
                              </div>
                              <div style={{ display: "flex", alignItems: "baseline", gap: "5px", marginTop: "2px" }}>
                                <span style={{ fontSize: "22px", fontWeight: "900", color: "#ec2226", letterSpacing: "-0.5px", lineHeight: 1 }}>
                                  ৳{emiCalc.monthlyInstallment.toLocaleString()}
                                </span>
                                <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>/ month</span>
                              </div>
                            </div>

                            {/* Compact breakdown pills */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", fontSize: "11px" }}>
                              <span style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "3px 8px", borderRadius: "6px", color: "#475569" }}>
                                Base: <strong style={{ color: "#0f172a" }}>৳{emiCalc.baseAmount.toLocaleString()}</strong>
                              </span>
                              <span style={{ background: "#ffffff", border: "1px solid #fecaca", padding: "3px 8px", borderRadius: "6px", color: "#b91c1c" }}>
                                Bank Fee ({emiCalc.rate}%): <strong>+৳{emiCalc.bankCharge.toLocaleString()}</strong>
                              </span>
                              <span style={{ background: "#0f172a", color: "#ffffff", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                                Total: ৳{emiCalc.totalPayable.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div style={{ fontSize: "11px", color: "#059669", fontWeight: "600", marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #fecaca", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span>✓ 0% Downpayment required</span>
                            <span>•</span>
                            <span>Instant processing with 18+ Bank Credit Cards</span>
                          </div>
                        </div>

                        {/* Supported 18+ Partner Bank Logos */}
                        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "10px", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
                          <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span>Supported 18+ Partner Bank Credit Cards:</span>
                            <button
                              type="button"
                              onClick={() => onOpenEmi?.(product)}
                              style={{ background: "none", border: "none", color: "#2563eb", fontSize: "11px", fontWeight: "700", cursor: "pointer", padding: 0 }}
                            >
                              View all 18+ banks ↗
                            </button>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              overflowX: "auto",
                              paddingBottom: "4px",
                              width: "100%",
                              maxWidth: "100%",
                              minWidth: 0,
                              boxSizing: "border-box",
                              scrollbarWidth: "thin",
                            }}
                          >
                            {BD_BANKS.map((b) => (
                              <div
                                key={b.id}
                                title={`${b.name} (Up to ${b.maxMonths} Mos)`}
                                onClick={() => onOpenEmi?.(product)}
                                style={{
                                  background: "#ffffff",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "6px",
                                  padding: "4px 8px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  height: "28px",
                                  minWidth: "56px",
                                  maxWidth: "56px",
                                  flexShrink: 0,
                                  cursor: "pointer",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = "#ec2226";
                                  e.currentTarget.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = "#e2e8f0";
                                  e.currentTarget.style.transform = "translateY(0)";
                                }}
                              >
                                <img
                                  src={b.logo}
                                  alt={b.name}
                                  loading="lazy"
                                  style={{
                                    maxHeight: "18px",
                                    maxWidth: "48px",
                                    width: "auto",
                                    height: "auto",
                                    objectFit: "contain",
                                    display: "block",
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    if (e.currentTarget.parentNode) {
                                      e.currentTarget.parentNode.innerHTML = `<span style="font-size:9.5px;font-weight:800;color:#0f172a">${b.id.toUpperCase()}</span>`;
                                    }
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Fixed Product Specifications (Configured at Product Creation) */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "16px 18px",
                  marginBottom: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: "14px",
                  }}
                >
                  {/* Material / Timber (Fixed) */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: "#fef2f2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Layers size={18} color="#ec2226" />
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Material / Timber
                      </div>
                      <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#111827", marginTop: "2px" }}>
                        {fixedWood}
                      </div>
                    </div>
                  </div>

                  {/* Dimensions / Sizing (Fixed) */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Ruler size={18} color="#2563eb" />
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {isBed ? "Bed Size (Standard)" : isAlmirah ? "Almirah Configuration" : "Dimensions / Sizing"}
                      </div>
                      <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#111827", marginTop: "2px" }}>
                        {fixedDimension}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Luxury Dynamic Purchase Suite */}
              <div style={{ marginTop: "20px", marginBottom: "10px" }}>
                <style>{`
                  @keyframes luxeShimmer {
                    0% { transform: translateX(-120%); }
                    100% { transform: translateX(220%); }
                  }
                  @keyframes radarWave {
                    0% { transform: scale(1); opacity: 0.9; }
                    50% { transform: scale(1.6); opacity: 0; }
                    100% { transform: scale(1); opacity: 0; }
                  }
                  @keyframes heartBeat {
                    0% { transform: scale(1); }
                    14% { transform: scale(1.25); }
                    28% { transform: scale(1); }
                    42% { transform: scale(1.18); }
                    70% { transform: scale(1); }
                  }
                  @keyframes iconBurstRing {
                    0% { transform: scale(0.75); opacity: 0.75; }
                    100% { transform: scale(1.65); opacity: 0; }
                  }
                  @keyframes heartPop {
                    0% { transform: scale(1); }
                    35% { transform: scale(1.38) rotate(-8deg); }
                    65% { transform: scale(0.92) rotate(5deg); }
                    100% { transform: scale(1) rotate(0deg); }
                  }
                  @keyframes arrowSwap {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(1.22); }
                    100% { transform: rotate(180deg) scale(1); }
                  }
                  .pdp-icon-action-wrap {
                    position: relative;
                    overflow: visible;
                    flex-shrink: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                  }
                  .pdp-tooltip-pill {
                    position: absolute;
                    bottom: calc(100% + 9px);
                    left: 50%;
                    transform: translateX(-50%) translateY(4px);
                    background: #0f172a;
                    color: #ffffff;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 5px 9px;
                    border-radius: 7px;
                    white-space: nowrap;
                    pointer-events: none;
                    opacity: 0;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.22);
                    z-index: 30;
                  }
                  .pdp-icon-action-wrap:hover .pdp-tooltip-pill {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                  }
                  .btn-luxe-hover {
                    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    position: relative;
                    overflow: hidden;
                  }
                  .btn-luxe-hover:hover {
                    transform: translateY(-2px);
                  }
                  .btn-luxe-hover:active {
                    transform: translateY(1px) scale(0.98);
                  }
                  .btn-shimmer-bar {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 45%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
                    transform: skewX(-25deg);
                    animation: luxeShimmer 3.5s infinite ease-in-out;
                    pointer-events: none;
                  }
                `}</style>

                {/* DYNAMIC ACTION BUTTONS & PURCHASE CONTROLS */}
                <div className="pdp-actions-container">
                  {/* ROW 1: Quantity Stepper, Dynamic Add to Cart, Dynamic Express Buy Now, Wishlist, Compare */}
                  <div className="pdp-purchase-grid">
                    {/* Posh Stepper */}
                    <div
                      className="pdp-stepper-wrap"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: "#ffffff",
                        border: "1.5px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "3px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        height: "52px",
                        boxSizing: "border-box",
                      }}
                    >
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        style={{
                          width: "34px",
                          height: "100%",
                          background: "#f1f5f9",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "17px",
                          fontWeight: 700,
                          cursor: "pointer",
                          color: "#334155",
                          transition: "all 0.15s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#334155"; }}
                      >
                        −
                      </button>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <span style={{ fontWeight: 800, fontSize: "15.5px", color: "#0f172a", fontFamily: "var(--font-sans, inherit)" }}>
                          {quantity}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity(quantity + 1)}
                        style={{
                          width: "34px",
                          height: "100%",
                          background: "#f1f5f9",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "17px",
                          fontWeight: 700,
                          cursor: "pointer",
                          color: "#334155",
                          transition: "all 0.15s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#334155"; }}
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Cart (Dynamic Hero Button) */}
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart({ ...product, quantity, selectedWood: fixedWood, selectedSize: fixedDimension });
                        setAddedAnim(true);
                        setTimeout(() => setAddedAnim(false), 2200);
                      }}
                      className="btn-luxe-hover pdp-add-to-cart-btn"
                      style={{
                        height: "52px",
                        background: addedAnim
                          ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                          : "linear-gradient(135deg, #ff2e34 0%, #ec2226 55%, #c8161a 100%)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "12px",
                        padding: "0 18px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        boxShadow: addedAnim
                          ? "0 8px 24px -2px rgba(16, 185, 129, 0.55)"
                          : "0 8px 24px -4px rgba(236, 34, 38, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                        boxSizing: "border-box",
                      }}
                      onMouseEnter={(e) => {
                        if (!addedAnim) {
                          e.currentTarget.style.boxShadow = "0 12px 30px -2px rgba(236, 34, 38, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!addedAnim) {
                          e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(236, 34, 38, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
                        }
                      }}
                    >
                      <div className="btn-shimmer-bar" />
                      {addedAnim ? (
                        <>
                          <Check size={20} strokeWidth={3} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }} />
                          <div style={{ textAlign: "left", lineHeight: 1.15 }}>
                            <div style={{ fontSize: "13.5px", fontWeight: 800, letterSpacing: "0.3px", textTransform: "uppercase" }}>
                              Added to Cart!
                            </div>
                            <div style={{ fontSize: "11px", fontWeight: 600, opacity: 0.95 }}>
                              Qty: {quantity} • ৳{(product.priceBDT * quantity).toLocaleString()}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={20} strokeWidth={2.4} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }} />
                          <div style={{ textAlign: "left", lineHeight: 1.1 }}>
                            <div style={{ fontSize: "13.5px", fontWeight: 800, letterSpacing: "0.3px", textTransform: "uppercase" }}>
                              Add to Cart
                            </div>
                            <div style={{ fontSize: "11px", fontWeight: 600, opacity: 0.9 }}>
                              ৳{(product.priceBDT * quantity).toLocaleString()}
                            </div>
                          </div>
                        </>
                      )}
                    </button>

                    {/* Buy Now (Express Direct Checkout) */}
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart({ ...product, quantity, selectedWood: fixedWood, selectedSize: fixedDimension });
                        navigate("/checkout" + (!hasDiscount && product.couponCode ? `?coupon=${encodeURIComponent(product.couponCode)}` : ""));
                      }}
                      className="btn-luxe-hover pdp-buy-now-btn"
                      style={{
                        height: "52px",
                        padding: "0 18px",
                        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 60%, #020617 100%)",
                        color: "#ffffff",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        boxShadow: "0 6px 20px rgba(15, 23, 42, 0.25)",
                        boxSizing: "border-box",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#fbbf24";
                        e.currentTarget.style.boxShadow = "0 10px 25px rgba(251, 191, 36, 0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(15, 23, 42, 0.25)";
                      }}
                    >
                      <Zap size={16} fill="#fbbf24" color="#fbbf24" />
                      <span style={{ fontSize: "13.5px", fontWeight: 800, letterSpacing: "0.2px", whiteSpace: "nowrap" }}>
                        Buy Now
                      </span>
                    </button>

                    {/* Dynamic Wishlist Button */}
                    <div
                      className="pdp-icon-action-wrap pdp-wishlist-wrap"
                      onMouseEnter={() => setWishlistHover(true)}
                      onMouseLeave={() => setWishlistHover(false)}
                    >
                      <span className="pdp-tooltip-pill">
                        {wishlistBurst
                          ? isWishlisted
                            ? "Added to Wishlist ♥"
                            : "Removed from Wishlist"
                          : isWishlisted
                            ? "In Wishlist • Click to remove"
                            : "Save to Wishlist ♥"}
                      </span>

                      {wishlistBurst && (
                        <span
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "12px",
                            border: "2px solid #ec2226",
                            pointerEvents: "none",
                            animation: "iconBurstRing 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                            zIndex: 5,
                          }}
                        />
                      )}

                      {isWishlisted && (
                        <span
                          style={{
                            position: "absolute",
                            top: "-5px",
                            right: "-5px",
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #ec2226 0%, #b91c1c 100%)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid #ffffff",
                            boxShadow: "0 2px 8px rgba(236, 34, 38, 0.35)",
                            pointerEvents: "none",
                            zIndex: 12,
                          }}
                        >
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (onToggleWishlist) onToggleWishlist(product);
                          setWishlistBurst(true);
                          setTimeout(() => setWishlistBurst(false), 900);
                        }}
                        className="btn-luxe-hover pdp-wishlist-btn"
                        aria-label={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                        aria-pressed={isWishlisted}
                        style={{
                          width: "56px",
                          height: "52px",
                          borderRadius: "12px",
                          border: isWishlisted
                            ? "1.5px solid #ec2226"
                            : wishlistHover
                              ? "1.5px solid #fca5a5"
                              : "1.5px solid #e2e8f0",
                          background: isWishlisted
                            ? "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)"
                            : wishlistHover
                              ? "linear-gradient(135deg, #fff5f5 0%, #ffe4e6 100%)"
                              : "#ffffff",
                          color: isWishlisted ? "#dc2626" : wishlistHover ? "#ec2226" : "#475569",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "2px",
                          cursor: "pointer",
                          boxShadow: isWishlisted
                            ? "0 6px 16px rgba(236, 34, 38, 0.22)"
                            : wishlistHover
                              ? "0 4px 12px rgba(236, 34, 38, 0.14)"
                              : "0 2px 8px rgba(0, 0, 0, 0.04)",
                          flexShrink: 0,
                          boxSizing: "border-box",
                          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      >
                        <Heart
                          size={18}
                          fill={isWishlisted ? "#ec2226" : wishlistHover ? "rgba(236, 34, 38, 0.14)" : "none"}
                          strokeWidth={2.4}
                          style={{
                            animation: wishlistBurst
                              ? "heartPop 0.65s ease"
                              : isWishlisted
                                ? "heartBeat 1.4s ease"
                                : "none",
                            transform: wishlistHover && !isWishlisted ? "scale(1.12)" : "scale(1)",
                            transition: "transform 0.2s ease",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "8.5px",
                            fontWeight: 800,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            lineHeight: 1,
                          }}
                        >
                          {wishlistBurst
                            ? isWishlisted
                              ? "SAVED!"
                              : "REMOVED"
                            : isWishlisted
                              ? "SAVED"
                              : "SAVE"}
                        </span>
                      </button>
                    </div>

                    {/* Dynamic Compare Button */}
                    <div
                      className="pdp-icon-action-wrap pdp-compare-wrap"
                      onMouseEnter={() => setCompareHover(true)}
                      onMouseLeave={() => setCompareHover(false)}
                    >
                      <span className="pdp-tooltip-pill">
                        {compareBurst
                          ? isCompared
                            ? `Added (${compareItems.length}/4)`
                            : "Removed from Compare"
                          : isCompared
                            ? `In Comparison (${compareItems.length}/4) • Click to remove`
                            : `Compare (${compareItems.length}/4) • Click to add`}
                      </span>

                      {compareBurst && (
                        <span
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "12px",
                            border: "2px solid #2563eb",
                            pointerEvents: "none",
                            animation: "iconBurstRing 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                            zIndex: 5,
                          }}
                        />
                      )}

                      {compareItems.length > 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: "-5px",
                            right: "-5px",
                            minWidth: "18px",
                            height: "18px",
                            padding: "0 4px",
                            borderRadius: "999px",
                            background: isCompared
                              ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                              : "#0f172a",
                            color: "#ffffff",
                            fontSize: "9.5px",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid #ffffff",
                            boxShadow: isCompared
                              ? "0 2px 8px rgba(37, 99, 235, 0.35)"
                              : "0 2px 6px rgba(15, 23, 42, 0.25)",
                            pointerEvents: "none",
                            zIndex: 12,
                          }}
                        >
                          {compareItems.length}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (onToggleCompare) onToggleCompare(product);
                          setCompareBurst(true);
                          setTimeout(() => setCompareBurst(false), 900);
                        }}
                        className="btn-luxe-hover pdp-compare-btn"
                        aria-label={isCompared ? "Remove from Comparison" : "Add to Comparison"}
                        aria-pressed={isCompared}
                        style={{
                          width: "60px",
                          height: "52px",
                          borderRadius: "12px",
                          border: isCompared
                            ? "1.5px solid #2563eb"
                            : compareHover
                              ? "1.5px solid #93c5fd"
                              : "1.5px solid #e2e8f0",
                          background: isCompared
                            ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
                            : compareHover
                              ? "linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%)"
                              : "#ffffff",
                          color: isCompared ? "#1d4ed8" : compareHover ? "#2563eb" : "#475569",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "2px",
                          cursor: "pointer",
                          boxShadow: isCompared
                            ? "0 6px 16px rgba(37, 99, 235, 0.22)"
                            : compareHover
                              ? "0 4px 12px rgba(37, 99, 235, 0.14)"
                              : "0 2px 8px rgba(0, 0, 0, 0.04)",
                          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                          flexShrink: 0,
                          boxSizing: "border-box",
                        }}
                      >
                        <ArrowLeftRight
                          size={18}
                          strokeWidth={2.4}
                          style={{
                            animation: compareBurst ? "arrowSwap 0.55s ease" : "none",
                            transform: compareHover && !compareBurst ? "scale(1.1)" : "scale(1)",
                            transition: "transform 0.2s ease",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "8.5px",
                            fontWeight: 800,
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                            lineHeight: 1,
                          }}
                        >
                          {compareBurst
                            ? isCompared
                              ? "ADDED!"
                              : "REMOVED"
                            : isCompared
                              ? "ADDED"
                              : "COMPARE"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* ROW 2: Live Showroom Video Cam (WhatsApp Emerald) + Direct Manager Hotline */}
                  <div className="pdp-contact-grid">
                    {/* Live Showroom WhatsApp Video Inspection */}
                    <a
                      href={`https://wa.me/${contactSettings.cleanWhatsapp || "8801898878815"}?text=${encodeURIComponent(
                        `Hello Kinglet Furniture, I want to inspect real showroom photos and live video of: ${product.name}\n` +
                        `• Material: ${fixedWood}\n` +
                        `• Dimensions: ${fixedDimension}\n` +
                        `• Quantity: ${quantity}\n` +
                        `• Price: ৳${(product.priceBDT * quantity).toLocaleString()}\n` +
                        `Please share live factory/showroom view.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-luxe-hover"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        background: "linear-gradient(135deg, #25D366 0%, #1ea952 100%)",
                        color: "#ffffff",
                        height: "48px",
                        borderRadius: "12px",
                        textDecoration: "none",
                        boxShadow: "0 6px 18px rgba(37, 211, 102, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
                        padding: "0 14px",
                        boxSizing: "border-box",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 10px 25px rgba(37, 211, 102, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 6px 18px rgba(37, 211, 102, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)";
                      }}
                    >
                      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span
                          style={{
                            position: "absolute",
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.4)",
                            animation: "radarWave 2s infinite ease-out",
                          }}
                        />
                        <MessageCircle size={18} fill="#ffffff" color="#25D366" />
                      </div>
                      <div style={{ textAlign: "left", lineHeight: 1.15 }}>
                        <div style={{ fontSize: "12.5px", fontWeight: 800, letterSpacing: "0.2px" }}>
                          Ask for Showroom Video
                        </div>
                        <div style={{ fontSize: "10.5px", fontWeight: 600, opacity: 0.9 }}>
                          Live WhatsApp Video & Cam
                        </div>
                      </div>
                    </a>

                    {/* Direct Manager Hotline */}
                    <a
                      href={contactSettings.phoneCallUrl || `tel:${BRAND_INFO.hotlinePrimary}`}
                      className="btn-luxe-hover"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                        color: "#ffffff",
                        height: "48px",
                        borderRadius: "12px",
                        textDecoration: "none",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.25)",
                        padding: "0 14px",
                        boxSizing: "border-box",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
                        e.currentTarget.style.boxShadow = "0 10px 25px rgba(15, 23, 42, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                        e.currentTarget.style.boxShadow = "0 6px 18px rgba(15, 23, 42, 0.25)";
                      }}
                    >
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <Phone size={16} strokeWidth={2.4} />
                        <span
                          style={{
                            position: "absolute",
                            top: "-2px",
                            right: "-2px",
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: "#22c55e",
                            boxShadow: "0 0 6px #22c55e",
                          }}
                        />
                      </div>
                      <div style={{ textAlign: "left", lineHeight: 1.15 }}>
                        <div style={{ fontSize: "12.5px", fontWeight: 800 }}>
                          Call: {contactSettings.phone || BRAND_INFO.hotlinePrimary}
                        </div>
                        <div style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600 }}>
                          Direct Showroom Desk
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Specs, Delivery & Reviews */}
          <div style={{ marginTop: "40px", borderTop: "1px solid #e5e7eb", paddingTop: "25px" }}>
            <div className="pdp-tab-scroller" style={{ marginBottom: "20px" }}>
              {[
                { id: "specs", label: "Product Specifications" },
                { id: "delivery", label: "Delivery & Installation" },
                { id: "reviews", label: `Customer Reviews (${product.reviewsCount || 38})` },
                { id: "care", label: "Warranty & Wood Care" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "15px",
                    fontWeight: "700",
                    color: activeTab === tab.id ? "#ec2226" : "#6b7280",
                    borderBottom: activeTab === tab.id ? "3px solid #ec2226" : "3px solid transparent",
                    padding: "0 4px 12px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div style={{ paddingTop: "20px" }}>
              {activeTab === "specs" && (
                <div className="pdp-specs-grid">
                  <div>
                    <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#111827", marginBottom: "12px" }}>Craftsmanship & Materials</h4>
                    <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "8px 0", color: "#6b7280", width: "40%" }}>Primary Timber</td>
                          <td style={{ padding: "8px 0", fontWeight: "600", color: "#111827" }}>{product.woodType || product.primaryMaterial || "Seasoned Mahogany"}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "8px 0", color: "#6b7280" }}>Finish Type</td>
                          <td style={{ padding: "8px 0", fontWeight: "600", color: "#111827" }}>{product.finish || product.finishType || "High-Gloss Italian PU"}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "8px 0", color: "#6b7280" }}>Model / SKU</td>
                          <td style={{ padding: "8px 0", fontWeight: "600", color: "#111827" }}>{product.sku || (product.id ? `KL-${product.id}` : "KL-126")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "8px 0", color: "#6b7280" }}>Dimensions (L × W × H)</td>
                          <td style={{ padding: "8px 0", fontWeight: "600", color: "#111827" }}>{product.dimensions || "6.5 ft x 6.0 ft (King Size)"}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "8px 0", color: "#6b7280" }}>Hardware</td>
                          <td style={{ padding: "8px 0", fontWeight: "600", color: "#111827" }}>{product.hardware || "Hydraulic Soft-Closing German Fittings"}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "8px 0", color: "#6b7280" }}>Seasoning Method</td>
                          <td style={{ padding: "8px 0", fontWeight: "600", color: "#111827" }}>{product.seasoningMethod || "Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#111827", marginBottom: "12px" }}>Overview & Design Details</h4>
                    <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: "1.6", margin: "0 0 14px" }}>
                      {product.description || "Designed in Bangladesh and crafted according to European durability standards. Built to withstand tropical moisture while providing modern architectural aesthetics."}
                    </p>
                    <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>Need custom architectural modifications?</div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        We accept bespoke adjustments for width, headboard height, and internal shelving layouts.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "delivery" && (
                <div style={{ fontSize: "13px", color: "#4b5563", lineHeight: "1.6" }}>
                  <div className="pdp-specs-grid">
                    <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#ec2226", marginBottom: "8px" }}>Inside Dhaka City</div>
                      <ul style={{ margin: 0, paddingLeft: "18px" }}>
                        <li>Delivery Fee: Based on your location</li>
                        <li>Timeline: Within 24 to 48 Hours</li>
                        <li>Payment: Cash on Delivery or Card on Delivery supported</li>
                      </ul>
                    </div>

                    <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>Outside Dhaka (All 64 Districts)</div>
                      <ul style={{ margin: 0, paddingLeft: "18px" }}>
                        <li>Premium multi-layer protective wrapping for scratch-free safe transit</li>
                        <li>Timeline: 3 to 5 business days via regional hubs</li>
                        <li>Delivery Fee: Based on location / district</li>
                        <li>Phone support & safe logistics tracking provided</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <div>
                  <div className="pdp-reviews-grid" style={{ alignItems: "start" }}>
                    {/* Left: Rating Summary & Write Button */}
                    <div style={{ textAlign: "center", background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "38px", fontWeight: "900", color: "#ec2226", fontFamily: "Outfit, sans-serif" }}>5.0</div>
                      <div style={{ display: "flex", justifyContent: "center", color: "#ec2226", margin: "6px 0 10px" }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={18} fill="#ec2226" />
                        ))}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
                        Based on {38 + localReviews.length} verified buyer reviews
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        style={{
                          width: "100%",
                          background: showReviewForm ? "#0f172a" : "#ec2226",
                          color: "#ffffff",
                          border: "none",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {showReviewForm ? "Cancel Review" : "Write a Review (রিভিউ দিন)"}
                      </button>
                    </div>

                    {/* Right: Write Form or Reviews List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {/* Review Submission Form */}
                      {showReviewForm && (
                        <div
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "10px",
                            padding: "20px",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                          }}
                        >
                          <h4 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", margin: "0 0 14px" }}>
                            Share Your Experience with {product.name}
                          </h4>

                          {reviewSubmitted ? (
                            <div
                              style={{
                                background: "#ecfdf5",
                                color: "#065f46",
                                padding: "14px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: "700",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <Check size={18} /> ধন্যবাদ! আপনার ভেরিফাইড রিভিউটি সফলভাবে প্রকাশিত হয়েছে।
                            </div>
                          ) : (
                            <form onSubmit={handleReviewSubmit}>
                              {reviewError && (
                                <div style={{ padding: "9px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", color: "#991b1b", fontSize: "12px", fontWeight: "600", marginBottom: "12px" }}>
                                  ⚠️ {reviewError}
                                </div>
                              )}
                              <div className="pdp-review-form-row">
                                <div>
                                  <label htmlFor="review-author-name" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                                    Your Full Name *
                                  </label>
                                  <input
                                    id="review-author-name"
                                    name="authorName"
                                    type="text"
                                    required
                                    placeholder="e.g. Mahfuzur Rahman"
                                    value={newReview.name}
                                    onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                                  />
                                </div>
                                <div>
                                  <label htmlFor="review-author-location" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                                    City / Area *
                                  </label>
                                  <input
                                    id="review-author-location"
                                    name="authorLocation"
                                    type="text"
                                    required
                                    placeholder="e.g. Uttara, Dhaka / Chittagong"
                                    value={newReview.location}
                                    onChange={(e) => setNewReview({ ...newReview, location: e.target.value })}
                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                                  />
                                </div>
                              </div>

                              <div style={{ marginBottom: "12px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                                  Your Star Rating
                                </label>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      type="button"
                                      key={star}
                                      onClick={() => setNewReview({ ...newReview, rating: star })}
                                      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                                    >
                                      <Star
                                        size={22}
                                        fill={star <= newReview.rating ? "#ec2226" : "none"}
                                        color={star <= newReview.rating ? "#ec2226" : "#cbd5e1"}
                                      />
                                    </button>
                                  ))}
                                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#ec2226", marginLeft: "6px", alignSelf: "center" }}>
                                    {newReview.rating} out of 5 Stars
                                  </span>
                                </div>
                              </div>

                              <div style={{ marginBottom: "14px" }}>
                                <label htmlFor="review-feedback-comment" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                                  Review & Feedback *
                                </label>
                                <textarea
                                  id="review-feedback-comment"
                                  name="reviewComment"
                                  rows={3}
                                  required
                                  placeholder="Describe the wood quality, polish finish, packaging, and delivery experience..."
                                  value={newReview.comment}
                                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={reviewSubmitLoading}
                                style={{
                                  background: reviewSubmitLoading ? "#64748b" : "#ec2226",
                                  color: "#ffffff",
                                  border: "none",
                                  padding: "9px 20px",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  fontWeight: "700",
                                  cursor: reviewSubmitLoading ? "not-allowed" : "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                {reviewSubmitLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                <span>{reviewSubmitLoading ? "Publishing Verified Review..." : "Submit Verified Review"}</span>
                              </button>
                            </form>
                          )}
                        </div>
                      )}

                      {/* Reviews Feed */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {allReviewsList.map((rev, idx) => {
                          const author = rev.authorName || rev.name || "Customer";
                          const location = rev.authorLocation || rev.location || "Dhaka";
                          const isVerified = rev.isVerifiedBuyer ?? true;
                          const createdDate = rev.createdAt
                            ? new Date(rev.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                            : (rev.date || "Verified");
                          return (
                            <div key={rev.id || idx} style={{ padding: "16px", background: "#ffffff", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <div style={{ fontWeight: "700", fontSize: "13px", color: "#111827" }}>
                                  {author}{" "}
                                  <span style={{ fontSize: "11px", color: isVerified ? "#16a34a" : "#64748b", fontWeight: "normal" }}>
                                    • {isVerified ? "Verified Buyer" : "Customer Review"} ({location})
                                  </span>
                                </div>
                                <span style={{ fontSize: "11px", color: "#9ca3af" }}>{createdDate}</span>
                              </div>
                              <div style={{ display: "flex", color: "#ec2226", marginBottom: "6px" }}>
                                {[...Array(rev.rating || 5)].map((_, i) => (
                                  <Star key={i} size={13} fill="#ec2226" />
                                ))}
                              </div>
                              <p style={{ fontSize: "12.5px", color: "#4b5563", margin: 0, lineHeight: "1.5" }}>
                                {rev.comment}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "care" && (
                <div style={{ fontSize: "13px", color: "#4b5563", lineHeight: "1.6" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#111827", marginBottom: "8px" }}>10-Year Timber Warranty Conditions</h4>
                  <p style={{ margin: "0 0 12px" }}>
                    Kinglet guarantees that all solid wood components are free from borer, termite, and wood-destroying insect infestation for 10 full years from the date of purchase. In the rare event of defects, we provide free component replacement.
                  </p>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#111827", marginBottom: "8px" }}>Routine Wood Care Tips</h4>
                  <ul style={{ margin: 0, paddingLeft: "18px" }}>
                    <li>Wipe with a soft micro-fiber cloth dampened with clean water; avoid abrasive chemical thinners.</li>
                    <li>Avoid direct prolonged exposure to monsoon rain or placing hot boiling pans directly without coasters.</li>
                    <li>For PU lacquer shine maintenance, Kinglet offers complimentary polish service checkups upon request.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products Carousel */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: "40px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#111827", marginBottom: "18px" }}>
              Frequently Paired With This Design
            </h2>
            <div className="kinglet-posh-4x4-grid">
              {relatedProducts.map((p) => (
                <div 
                  key={p.id}
                  style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e5e7eb", overflow: "hidden", display: "flex", flexDirection: "column" }}
                >
                  {/* Strict 1:1 Aspect Ratio Image Container with Smooth 2nd Image Hover Pop-up */}
                  <KingletProductCardImage
                    product={p}
                  />
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                    <div>
                      <h4 style={{ fontSize: "13px", fontWeight: "700", margin: "0 0 6px" }}>
                        <Link to={`/product/${p.slug}`} style={{ color: "#1f2937", textDecoration: "none" }}>{p.name}</Link>
                      </h4>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: "#ec2226" }}>
                        ৳{p.priceBDT.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => onAddToCart(p)}
                      style={{
                        marginTop: "8px",
                        background: "#fff5f5",
                        color: "#ec2226",
                        border: "1px solid #fecaca",
                        padding: "6px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      + Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
