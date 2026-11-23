import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Clock,
  Copy,
  Check,
  ShieldCheck,
  Truck,
  Heart,
  Eye,
  ArrowLeftRight,
  ShoppingBag,
  MessageCircle,
  Star,
  Search,
  Tag,
  Percent,
  CheckCircle2,
  Gift,
  RotateCcw,
  CreditCard,
} from "lucide-react";
import { PRODUCTS, BRAND_INFO } from "../data/kingletData";
import { productService } from "../utils/productService";
import KingletProductCardImage from "../components/Products/KingletProductCardImage";
import KingletSEO from "../components/Common/KingletSEO";

const ALL_CATEGORY_TABS = [
  { id: "all", label: "All Flash Deals", icon: "🔥" },
  { id: "living-room", label: "Living Sofas", icon: "🛋️" },
  { id: "bedroom", label: "Bedroom Suites", icon: "🛏️" },
  { id: "dining", label: "Dining Sets", icon: "🍽️" },
  { id: "almirah", label: "Wardrobes & Almirahs", icon: "🚪" },
  { id: "dressing-table", label: "Dressing Vanity", icon: "🪞" },
  { id: "table", label: "Center Tables", icon: "☕" },
  { id: "door", label: "Wooden Doors", icon: "🚪" },
  { id: "kitchen", label: "Kitchen", icon: "🍳" },
  { id: "kids-room", label: "Kids & Study", icon: "🧸" },
  { id: "office", label: "Office & Desks", icon: "💼" },
  { id: "interior", label: "Turnkey Interior", icon: "✨" },
];

export default function FlashSalePage({
  onAddToCart,
  onToggleWishlist,
  onToggleCompare,
  wishlistIds = [],
  onQuickView,
  onOpenEmi,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [discountFilter, setDiscountFilter] = useState("all"); // "all" | "15plus" | "12to14" | "under12"
  const [sortBy, setSortBy] = useState("savings-high"); // "savings-high" | "discount-high" | "price-low" | "price-high" | "rating"
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Live Countdown Timer (48-Hour Deal)
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 38,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return { days: 2, hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText("KINGLET15");
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const [liveCatalog, setLiveCatalog] = useState(() => PRODUCTS.filter((p) => Boolean(p.isOffer)));

  useEffect(() => {
    let isMounted = true;
    const fetchLiveProducts = () => {
      productService.getProducts({ limit: 250 }).then((res) => {
        if (isMounted && res.products && res.products.length > 0) {
          setLiveCatalog(res.products);
          setIsLoading(false);
        }
      }).catch(() => {
        if (isMounted) setIsLoading(false);
      });
    };

    fetchLiveProducts();

    const handleUpdate = () => fetchLiveProducts();
    window.addEventListener("kinglet:products-updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("kinglet:products-updated", handleUpdate);
    };
  }, []);

  // STRICT ADMIN CONTROL: ONLY products marked as isOffer in backend are shown on this page
  const flashSaleProducts = useMemo(() => {
    return liveCatalog
      .filter((p) => Boolean(p.isOffer))
      .map((p) => {
        const hasDiscount = p.oldPriceBDT && Number(p.oldPriceBDT) > Number(p.priceBDT);
        const savingsBDT = hasDiscount ? Number(p.oldPriceBDT) - Number(p.priceBDT) : 0;
        const discountPercent = (hasDiscount && Number(p.oldPriceBDT) > 0)
          ? Math.round((savingsBDT / Number(p.oldPriceBDT)) * 100)
          : 0;
        return {
          ...p,
          hasDiscount,
          savingsBDT,
          discountPercent,
        };
      });
  }, [liveCatalog]);

  // Dynamic category tabs based only on current offer products
  const categoryTabs = useMemo(() => {
    return ALL_CATEGORY_TABS.filter((tab) => {
      if (tab.id === "all") return true;
      return flashSaleProducts.some((p) => {
        const cat = (p.category || "").toLowerCase();
        const sub = (p.subcategory || "").toLowerCase();
        const tabId = tab.id.toLowerCase();
        if (tabId === "living-room") return cat === "living-room" || sub.includes("sofa");
        if (tabId === "bedroom") return cat === "bedroom" || sub.includes("bed") || sub.includes("mattress");
        if (tabId === "dining") return cat === "dining" || sub.includes("dining");
        if (tabId === "almirah") return sub.includes("almirah") || sub.includes("wardrobe") || (p.name && p.name.toLowerCase().includes("almirah"));
        if (tabId === "dressing-table") return sub.includes("dressing") || (p.name && p.name.toLowerCase().includes("dressing"));
        return cat === tabId || sub === tabId;
      });
    });
  }, [flashSaleProducts]);

  // Filter and sort the flash sale products
  const filteredProducts = useMemo(() => {
    let list = [...flashSaleProducts];

    // Category Filter
    if (selectedCategory !== "all") {
      const sel = selectedCategory.toLowerCase();
      list = list.filter((p) => {
        const cat = (p.category || "").toLowerCase();
        const sub = (p.subcategory || "").toLowerCase();
        if (sel === "living-room") {
          return cat === "living-room" || sub.includes("sofa");
        }
        if (sel === "bedroom") {
          return cat === "bedroom" || sub.includes("bed") || sub.includes("mattress") || sub.includes("bedside-table");
        }
        if (sel === "dining") {
          return cat === "dining" || sub.includes("dining");
        }
        if (sel === "almirah") {
          return (
            sub.includes("almirah") ||
            sub.includes("wardrobe") ||
            (p.name && (p.name.toLowerCase().includes("almirah") || p.name.toLowerCase().includes("almira") || p.name.toLowerCase().includes("wardrobe")))
          );
        }
        if (sel === "dressing-table") {
          return (
            sub.includes("dressing") ||
            (p.name && (p.name.toLowerCase().includes("dressing") || p.name.toLowerCase().includes("vanity")))
          );
        }
        if (sel === "table") {
          return cat === "table" || sub.includes("table");
        }
        return cat === sel || sub === sel;
      });
    }

    // Discount Range Filter
    if (discountFilter === "15plus") {
      list = list.filter((p) => p.discountPercent >= 15);
    } else if (discountFilter === "12to14") {
      list = list.filter((p) => p.discountPercent >= 12 && p.discountPercent <= 14);
    } else if (discountFilter === "under12") {
      list = list.filter((p) => p.discountPercent < 12);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.woodType?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.subcategoryLabel?.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "savings-high") return b.savingsBDT - a.savingsBDT;
      if (sortBy === "discount-high") return b.discountPercent - a.discountPercent;
      if (sortBy === "price-low") return a.priceBDT - b.priceBDT;
      if (sortBy === "price-high") return b.priceBDT - a.priceBDT;
      if (sortBy === "rating") return (b.rating || 5) - (a.rating || 5);
      return 0;
    });

    return list;
  }, [flashSaleProducts, selectedCategory, discountFilter, searchQuery, sortBy]);

  // Total savings across the catalog
  const _totalMaxSavings = useMemo(() => {
    return flashSaleProducts.reduce((acc, p) => acc + p.savingsBDT, 0);
  }, [flashSaleProducts]);

  return (
    <div className="flash-sale-page" style={{ background: "#ffffff", minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Search Engine Optimization (SEO) Metadata */}
      <KingletSEO
        title="Winter Furniture Flash Sale 15% OFF | Seasoned Mahogany Deals in Bangladesh | Kinglet"
        description="Save up to 15% on handcrafted solid Seasoned Mahogany bedroom suites, luxury L-shaped sofas, dining sets & almiras. Limited stock winter offer with 10-Year Timber Guarantee & nationwide delivery."
        keywords="Furniture Flash Sale BD, furniture offer in Bangladesh, furniture discount, seasoned mahogany bed price, sofa set discount Dhaka, Kinglet furniture offer"
        canonicalUrl="https://www.kingletbd.com/flash-sale"
      />

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(236, 34, 38, 0.4); }
          50% { box-shadow: 0 0 28px rgba(236, 34, 38, 0.7); }
        }
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* 1. Flash Sale Campaign Hero Header */}
      <section
        style={{
          background: "linear-gradient(135deg, #0b0f19 0%, #1e1b2e 50%, #110e1a 100%)",
          color: "#ffffff",
          padding: "115px 0 55px",
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid rgba(236, 34, 38, 0.2)",
        }}
      >
        {/* Ambient Glow Orbs */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "10%",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(236,34,38,0.25) 0%, transparent 70%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "5%",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ maxWidth: "1400px", position: "relative", zIndex: 2 }}>
          {/* Breadcrumb Navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12.5px",
              color: "#94a3b8",
              marginBottom: "20px",
            }}
          >
            <Link to="/" style={{ color: "#cbd5e1", textDecoration: "none" }}>
              Home
            </Link>
            <span>/</span>
            <span style={{ color: "#ec2226", fontWeight: "700" }}>Flash Sale & Offers</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "35px",
              alignItems: "center",
            }}
          >
            {/* Left Column: Offer Details */}
            <div>
              {/* Pulsing Pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(236, 34, 38, 0.15)",
                  border: "1px solid rgba(236, 34, 38, 0.4)",
                  color: "#ff6b6e",
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                  animation: "pulseGlow 2.5s infinite",
                }}
              >
                <Flame size={15} fill="#ec2226" color="#ec2226" />
                <span>Active Campaign • Save Up to 15% OFF</span>
              </div>

              <h1
                style={{
                  fontSize: "clamp(30px, 4vw, 48px)",
                  fontWeight: "950",
                  lineHeight: "1.15",
                  letterSpacing: "-1px",
                  margin: "0 0 16px",
                  color: "#ffffff",
                }}
              >
                Flash Sale & Clearance Catalog
              </h1>

              <p
                style={{
                  fontSize: "15.5px",
                  color: "#cbd5e1",
                  lineHeight: "1.6",
                  margin: "0 0 24px",
                  maxWidth: "580px",
                }}
              >
                Handpicked 100% seasoned Mahogany and Oak wood furniture pieces currently on limited-time promotional pricing. Every order includes premium multi-layer protective packaging.
              </p>

              {/* Coupon Code Capsule */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px dashed rgba(236, 34, 38, 0.6)",
                  padding: "10px 18px",
                  borderRadius: "14px",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div>
                  <div style={{ fontSize: "10.5px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>
                    Special Checkout Promo
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: "#ffffff", letterSpacing: "1px" }}>
                    KINGLET15
                  </div>
                </div>

                <button
                  onClick={handleCopyCode}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: copiedCoupon ? "#16a34a" : "#ec2226",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {copiedCoupon ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCoupon ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Live Countdown Card */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "20px",
                padding: "30px",
                maxWidth: "460px",
                justifySelf: "end",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fca5a5", fontSize: "13px", fontWeight: "800" }}>
                  <Clock size={16} color="#ec2226" />
                  <span>DEAL EXPIRES IN:</span>
                </div>
                <span
                  style={{
                    background: "#ec2226",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: "800",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  48-HR WINDOW
                </span>
              </div>

              {/* Countdown Digits */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
                {[
                  { label: "DAYS", val: timeLeft.days },
                  { label: "HOURS", val: timeLeft.hours },
                  { label: "MINS", val: timeLeft.minutes },
                  { label: "SECS", val: timeLeft.seconds },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(10, 14, 23, 0.85)",
                      border: "1px solid rgba(236, 34, 38, 0.35)",
                      borderRadius: "12px",
                      padding: "12px 6px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "28px",
                        fontWeight: "950",
                        color: "#ffffff",
                        lineHeight: "1",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {String(item.val).padStart(2, "0")}
                    </div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700", marginTop: "4px" }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust Badges List */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  fontSize: "12px",
                  color: "#cbd5e1",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  paddingTop: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Truck size={14} color="#ec2226" /> Nationwide Delivery
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={14} color="#ec2226" /> 10-Yr Timber Warranty
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Tag size={14} color="#ec2226" /> Factory Direct Pricing
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Percent size={14} color="#ec2226" /> 0% EMI up to 12 Mo.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Category Tabs Strip */}
      <section style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "16px 0" }}>
        <div className="container" style={{ maxWidth: "1400px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto",
              scrollbarWidth: "none",
              paddingBottom: "4px",
            }}
          >
            {categoryTabs.map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    border: isActive ? "1px solid #ec2226" : "1px solid #cbd5e1",
                    background: isActive ? "#ec2226" : "#ffffff",
                    color: isActive ? "#ffffff" : "#334155",
                    boxShadow: isActive ? "0 4px 14px rgba(236, 34, 38, 0.25)" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Filter & Sort Toolbar */}
      <div className="container" style={{ maxWidth: "1400px", paddingTop: "32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            background: "#ffffff",
            padding: "16px 20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            marginBottom: "28px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          {/* Left: Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "8px 14px",
              minWidth: "260px",
              flexGrow: 1,
              maxWidth: "400px",
            }}
          >
            <Search size={16} color="#94a3b8" />
            <input
              id="flash-sale-search"
              name="flashSaleSearch"
              type="text"
              placeholder="Search flash sale models, mahogany, oak..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "13.5px",
                color: "#0f172a",
                width: "100%",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Right: Discount Filter + Sort By */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Discount Level */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "700" }}>Discount:</span>
              <select
                id="flash-sale-discount-filter"
                name="discountFilter"
                value={discountFilter}
                onChange={(e) => setDiscountFilter(e.target.value)}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#0f172a",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="all">All Discounts</option>
                <option value="15plus">15% OFF & Above</option>
                <option value="12to14">12% - 14% OFF</option>
                <option value="under12">Under 12% OFF</option>
              </select>
            </div>

            {/* Sort Options */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "700" }}>Sort By:</span>
              <select
                id="flash-sale-sort-by"
                name="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#0f172a",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="savings-high">Biggest Savings (৳)</option>
                <option value="discount-high">Highest % Discount</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            padding: "0 4px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", margin: "0 0 4px" }}>
              Showing {filteredProducts.length} Flash Sale Deals
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              Save up to ৳15,000 per suite. Direct factory prices with certified warranties.
            </p>
          </div>

          {(selectedCategory !== "all" || discountFilter !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory("all");
                setDiscountFilter("all");
                setSearchQuery("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#f1f5f9",
                border: "none",
                color: "#0f172a",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={13} /> Reset Filters
            </button>
          )}
        </div>

        {/* 4. Products Grid */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "70px 20px" }}>
            <div
              style={{
                display: "inline-block",
                width: "40px",
                height: "40px",
                border: "3px solid #f1f5f9",
                borderTopColor: "#ec2226",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ marginTop: "14px", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>
              Loading curated backend offer products...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "70px 20px",
              background: "#f8fafc",
              borderRadius: "18px",
              border: "1px dashed #cbd5e1",
            }}
          >
            <div style={{ fontSize: "42px", marginBottom: "12px" }}>🏷️</div>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px" }}>
              {flashSaleProducts.length === 0
                ? "No Offer Products Selected in Backend Yet"
                : "No Products Match the Selected Filter"}
            </h3>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 auto 20px", maxWidth: "480px" }}>
              {flashSaleProducts.length === 0
                ? "In the Admin Portal (Product Management), click the '🔥 Offer' pill next to any product to feature it here instantly."
                : "Try adjusting your category or discount filters to view available promotional models."}
            </p>
            {flashSaleProducts.length > 0 && (
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setDiscountFilter("all");
                  setSearchQuery("");
                }}
                style={{
                  background: "#ec2226",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 22px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                View All {flashSaleProducts.length} Flash Deals
              </button>
            )}
          </div>
        ) : (
          <div
            className="kinglet-posh-4x4-grid"
            style={{
              gap: "20px",
              width: "100%",
            }}
          >
            {filteredProducts.map((p, idx) => {
              const isWishlisted = wishlistIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  className="flash-sale-card"
                  style={{
                    background: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease, border-color 0.28s ease",
                    position: "relative",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                    animation: `cardFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${(idx % 8) * 0.04}s backwards`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 14px 30px rgba(15, 23, 42, 0.08)";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    const img = e.currentTarget.querySelector(".flash-img");
                    if (img) img.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.04)";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    const img = e.currentTarget.querySelector(".flash-img");
                    if (img) img.style.transform = "scale(1.0)";
                  }}
                >
                {/* Strict 1:1 Aspect Ratio Image Container with Smooth 2nd Image Hover Pop-up */}
                <KingletProductCardImage
                  product={p}
                  badges={
                    <>
                      {p.discountPercent > 0 && (
                        <span
                          style={{
                            background: "#ec2226",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: "800",
                            padding: "4px 9px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            boxShadow: "0 2px 8px rgba(236, 34, 38, 0.35)",
                          }}
                        >
                          <Flame size={12} fill="#ffffff" />
                          <span>{p.discountPercent}% OFF</span>
                        </span>
                      )}

                      {p.savingsBDT > 0 && (
                        <span
                          style={{
                            background: "#0f172a",
                            color: "#ffffff",
                            fontSize: "9.5px",
                            fontWeight: "800",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                            padding: "3px 8px",
                            borderRadius: "5px",
                          }}
                        >
                          SAVE ৳{p.savingsBDT.toLocaleString()}
                        </span>
                      )}

                      {p.couponCode && (
                        <span
                          style={{
                            background: "#059669",
                            color: "#ffffff",
                            fontSize: "9.5px",
                            fontWeight: "800",
                            letterSpacing: "0.5px",
                            padding: "3px 8px",
                            borderRadius: "5px",
                          }}
                        >
                          🎟️ {p.couponCode}
                        </span>
                      )}

                      {p.badge && (
                        <span
                          style={{
                            background: "#1e293b",
                            color: "#ffffff",
                            fontSize: "9.5px",
                            fontWeight: "800",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                            padding: "3px 8px",
                            borderRadius: "5px",
                          }}
                        >
                          {p.badge}
                        </span>
                      )}
                    </>
                  }
                  quickActions={
                    <>
                      <button
                        onClick={() => onToggleWishlist(p)}
                        title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                        style={{
                          width: "35px",
                          height: "35px",
                          borderRadius: "50%",
                          background: isWishlisted ? "#ec2226" : "rgba(255, 255, 255, 0.95)",
                          backdropFilter: "blur(6px)",
                          color: isWishlisted ? "#ffffff" : "#334155",
                          border: "1px solid rgba(255, 255, 255, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Heart size={15} fill={isWishlisted ? "#ffffff" : "none"} />
                      </button>

                      <button
                        onClick={() => onQuickView(p)}
                        title="Quick View Specs"
                        style={{
                          width: "35px",
                          height: "35px",
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.95)",
                          backdropFilter: "blur(6px)",
                          color: "#334155",
                          border: "1px solid rgba(255, 255, 255, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        onClick={() => onToggleCompare(p)}
                        title="Compare Details"
                        style={{
                          width: "35px",
                          height: "35px",
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.95)",
                          backdropFilter: "blur(6px)",
                          color: "#334155",
                          border: "1px solid rgba(255, 255, 255, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <ArrowLeftRight size={14} />
                      </button>
                    </>
                  }
                />

                  {/* Card Content Details */}
                  <div
                    style={{
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      flexGrow: 1,
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      {/* Timber Specification */}
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.6px",
                          marginBottom: "6px",
                        }}
                      >
                        {p.woodType ? p.woodType.split("&")[0].trim() : "Seasoned Mahogany Timber"}
                      </div>

                      {/* Title */}
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "800",
                          margin: "0 0 8px",
                          lineHeight: "1.35",
                        }}
                      >
                        <Link
                          to={`/product/${p.slug}`}
                          style={{
                            color: "#0f172a",
                            textDecoration: "none",
                            transition: "color 0.2s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#ec2226")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#0f172a")}
                        >
                          {p.name}
                        </Link>
                      </h3>

                      {/* Stars */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          marginBottom: "12px",
                        }}
                      >
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
                        ))}
                        <span style={{ fontSize: "11.5px", color: "#94a3b8", fontWeight: "600", marginLeft: "2px" }}>
                          ({p.reviewsCount || 28})
                        </span>
                      </div>

                      {/* Pricing: Discounted vs Regular + Savings Pill */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "8px",
                          marginBottom: "6px",
                        }}
                      >
                        <span style={{ fontSize: "20px", fontWeight: "900", color: "#ec2226" }}>
                          ৳{Number(p.priceBDT).toLocaleString()}
                        </span>
                        {p.hasDiscount && (
                          <span
                            style={{
                              fontSize: "13.5px",
                              color: "#94a3b8",
                              textDecoration: "line-through",
                              fontWeight: "500",
                            }}
                          >
                            ৳{Number(p.oldPriceBDT).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* You Save text */}
                      {p.savingsBDT > 0 && (
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            color: "#16a34a",
                            marginBottom: "16px",
                          }}
                        >
                          You Save ৳{p.savingsBDT.toLocaleString()} with this Flash Deal
                        </div>
                      )}

                      {/* 0% Interest EMI Badge (Bangladeshi Partner Banks) */}
                      {onOpenEmi && (
                        <button
                          type="button"
                          onClick={() => onOpenEmi(p)}
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            padding: "6px 10px",
                            fontSize: "11px",
                            fontWeight: "700",
                            color: "#0f172a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            marginBottom: "12px",
                            width: "100%",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#ec2226";
                            e.currentTarget.style.background = "#fff5f5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#e2e8f0";
                            e.currentTarget.style.background = "#f8fafc";
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ec2226" }}>
                            <CreditCard size={12} />
                            <span>0% EMI from ৳{Math.round(p.priceBDT / 12).toLocaleString()}/mo</span>
                          </span>
                          <span style={{ color: "#64748b", fontSize: "10px", fontWeight: "600" }}>Plans →</span>
                        </button>
                      )}
                    </div>

                    {/* Bottom Action Row */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        paddingTop: "12px",
                        borderTop: "1px solid #e2e8f0",
                      }}
                    >
                      <button
                        onClick={() => onAddToCart(p)}
                        style={{
                          flexGrow: 1,
                          background: "#0f172a",
                          color: "#ffffff",
                          border: "none",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          fontSize: "12.5px",
                          fontWeight: "800",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#ec2226";
                          e.currentTarget.style.boxShadow = "0 6px 16px rgba(236, 34, 38, 0.35)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#0f172a";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <ShoppingBag size={14} />
                        <span>Add to Cart</span>
                      </button>

                      <a
                        href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent(
                          `Hello Kinglet, I would like to order the Flash Sale Deal: ${p.name} (Discount Price: ৳${p.priceBDT.toLocaleString()}, Regular: ৳${p.oldPriceBDT.toLocaleString()}, Coupon: KINGLET15)`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Order instantly on WhatsApp"
                        style={{
                          background: "#25D366",
                          color: "#ffffff",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textDecoration: "none",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                      >
                        <MessageCircle size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Campaign Terms & Assurance Box */}
      <section style={{ marginTop: "70px", background: "#f8fafc", padding: "50px 0", borderTop: "1px solid #e2e8f0" }}>
        <div className="container" style={{ maxWidth: "1400px" }}>
          <div style={{ textAlign: "center", marginBottom: "35px" }}>
            <span style={{ color: "#ec2226", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>
              Flash Sale Guarantees
            </span>
            <h2 style={{ fontSize: "26px", fontWeight: "900", color: "#0f172a", margin: "6px 0" }}>
              Kinglet Transparent Flash Sale Commitment
            </h2>
            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
              Genuine season-end timber promotions straight from our Savar manufacturing facility.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "22px" }}>
            {[
              {
                icon: <CheckCircle2 size={24} color="#ec2226" />,
                title: "100% Solid Seasoned Timber",
                desc: "Every flash sale item uses identical Grade-A kiln-dried timber and Italian PU lacquer as full-price items.",
              },
              {
                icon: <Truck size={24} color="#ec2226" />,
                title: "Nationwide Safe Delivery",
                desc: "Carefully packed and safely delivered to your doorstep anywhere across all 64 districts in Bangladesh.",
              },
              {
                icon: <ShieldCheck size={24} color="#ec2226" />,
                title: "10-Year Anti-Borer Guarantee",
                desc: "All discounted furniture pieces retain full 10-year official timber and pest protection warranties.",
              },
              {
                icon: <Gift size={24} color="#ec2226" />,
                title: "0% EMI on 18+ Bank Cards",
                desc: "Split payments into 3 to 12 convenient interest-free monthly installments at checkout.",
              },
            ].map((box, i) => (
              <div
                key={i}
                style={{
                  background: "#ffffff",
                  padding: "24px",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ marginBottom: "12px" }}>{box.icon}</div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px" }}>
                  {box.title}
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: "1.6" }}>
                  {box.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
