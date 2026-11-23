import React, { useState, useMemo } from "react";
import {
  Heart,
  Eye,
  ShoppingBag,
  Star,
  Sparkles,
  MessageCircle,
  ArrowLeftRight,
} from "lucide-react";
import { PRODUCTS, BRAND_INFO } from "../../data/kingletData";

const CATEGORY_TABS = [
  { id: "all", label: "All Collections" },
  { id: "bedroom", label: "Bedroom Sanctuary" },
  { id: "living-room", label: "Living Room" },
  { id: "dining", label: "Dining & Showcase" },
  { id: "office", label: "Executive Office" },
];

const WOOD_FILTERS = [
  "All Timber",
  "Seasoned Mahogany (Mahogany)",
  "Natural Oak",
  "Seasoned Mahogany",
  "Marble & Mahogany",
];

export default function KingletProductCatalog({
  activeCategory,
  onSelectCategory,
  currency,
  onQuickView,
  onAddToCart,
  onToggleWishlist,
  wishlistIds = [],
  onToggleCompare,
  compareIds = [],
}) {
  const [selectedWood, setSelectedWood] = useState("All Timber");
  const [sortBy, setSortBy] = useState("featured");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchesCategory =
        activeCategory === "all" || p.category === activeCategory;
      const matchesWood =
        selectedWood === "All Timber" ||
        p.woodType.toLowerCase().includes(selectedWood.toLowerCase());
      const matchesSearch =
        searchTerm === "" ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.woodType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesWood && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.priceBDT - b.priceBDT;
      if (sortBy === "price-desc") return b.priceBDT - a.priceBDT;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });
  }, [activeCategory, selectedWood, sortBy, searchTerm]);

  return (
    <section id="catalog-section" style={{ padding: "90px 20px", background: "#0b0d11" }}>
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        {/* Section Heading */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", marginBottom: "40px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "3px", color: "#ec2226", textTransform: "uppercase", marginBottom: "8px" }}>
              THE MASTER ARCHIVE
            </div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "36px", color: "#ffffff", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
              Curated Furniture Gallery
            </h2>
            <p style={{ color: "#9da3ae", marginTop: "8px", maxWidth: "600px", fontSize: "15px" }}>
              Explore our hallmark solid Seasoned Mahogany collections, seasoned for 21 days and handcrafted by master artisans.
            </p>
          </div>

          {/* Quick Search */}
          <div style={{ minWidth: "260px" }}>
            <input
              id="catalog-quick-search"
              name="catalogQuickSearch"
              type="text"
              placeholder="Search pieces, wood species..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "999px",
                padding: "10px 18px",
                color: "#ffffff",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Filter Bar: Tabs, Wood Filter, Sorting */}
        <div
          style={{
            background: "#13161d",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "36px",
          }}
        >
          {/* Category Tabs */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSelectCategory(tab.id)}
                style={{
                  background: activeCategory === tab.id ? "#ec2226" : "rgba(255, 255, 255, 0.04)",
                  border: activeCategory === tab.id ? "1px solid #ec2226" : "1px solid rgba(255, 255, 255, 0.08)",
                  color: activeCategory === tab.id ? "#ffffff" : "#9da3ae",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Secondary Controls: Wood Filter & Sort */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Timber Filter */}
            <select
              id="catalog-wood-filter"
              name="catalogWoodFilter"
              value={selectedWood}
              onChange={(e) => setSelectedWood(e.target.value)}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#ffffff",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {WOOD_FILTERS.map((wf) => (
                <option key={wf} value={wf} style={{ background: "#151820", color: "#ffffff" }}>
                  {wf}
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              id="catalog-sort-by"
              name="catalogSortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#ffffff",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="featured" style={{ background: "#151820", color: "#ffffff" }}>Sort: Featured Artisans</option>
              <option value="price-asc" style={{ background: "#151820", color: "#ffffff" }}>Price: Low to High</option>
              <option value="price-desc" style={{ background: "#151820", color: "#ffffff" }}>Price: High to Low</option>
              <option value="rating" style={{ background: "#151820", color: "#ffffff" }}>Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#151820",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <Sparkles size={36} color="#ec2226" style={{ marginBottom: "16px" }} />
            <h3 style={{ fontSize: "20px", color: "#ffffff", marginBottom: "8px" }}>
              No pieces match your exact criteria
            </h3>
            <p style={{ color: "#9da3ae", marginBottom: "20px" }}>
              Try selecting another wood type or category tab above.
            </p>
            <button
              onClick={() => {
                onSelectCategory("all");
                setSelectedWood("All Timber");
                setSearchTerm("");
              }}
              className="btn-luxury-outline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            className="kinglet-posh-4x4-grid"
            style={{
              gap: "24px",
              width: "100%",
            }}
          >
            {filteredProducts.map((product) => {
              const isWish = wishlistIds.includes(product.id);
              const isCompared = compareIds.includes(product.id);
              const displayPrice =
                currency === "USD"
                  ? `$${Math.round(product.priceBDT / 122).toLocaleString()}`
                  : `৳${product.priceBDT.toLocaleString()}`;

              const oldDisplayPrice =
                product.oldPriceBDT &&
                (currency === "USD"
                  ? `$${Math.round(product.oldPriceBDT / 122).toLocaleString()}`
                  : `৳${product.oldPriceBDT.toLocaleString()}`);

              return (
                <div
                  key={product.id}
                  className="product-card-wrap"
                  style={{
                    background: "#14171e",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                    position: "relative",
                  }}
                >
                  {/* Image Container with Badges & Hover Controls */}
                  <div
                    style={{
                      position: "relative",
                      aspectRatio: "1 / 1",
                      overflow: "hidden",
                      background: "#0d0f14",
                    }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      width="400"
                      height="300"
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                      className="product-main-img"
                      onError={(e) => (e.currentTarget.src = product.fallbackImage)}
                    />

                    {/* Badge */}
                    {product.badge && (
                      <span
                        style={{
                          position: "absolute",
                          top: "12px",
                          left: "12px",
                          background: "#ec2226",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          boxShadow: "0 2px 10px rgba(236,34,38,0.4)",
                        }}
                      >
                        {product.badge}
                      </span>
                    )}

                    {/* Compare Button */}
                    {onToggleCompare && (
                      <button
                        onClick={() => onToggleCompare(product)}
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "52px",
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: isCompared ? "#ec2226" : "rgba(15, 17, 21, 0.75)",
                          border: isCompared ? "1px solid #ec2226" : "1px solid rgba(255, 255, 255, 0.2)",
                          color: isCompared ? "#121418" : "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          backdropFilter: "blur(6px)",
                          transition: "all 0.2s",
                        }}
                        title={isCompared ? "Remove from comparison" : "Add to side-by-side comparison"}
                        aria-label="Compare Piece"
                      >
                        <ArrowLeftRight size={15} />
                      </button>
                    )}

                    {/* Wishlist Button */}
                    <button
                      onClick={() => onToggleWishlist(product)}
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: isWish ? "#ec2226" : "rgba(15, 17, 21, 0.75)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        backdropFilter: "blur(6px)",
                        transition: "all 0.2s",
                      }}
                      aria-label="Save to Wishlist"
                    >
                      <Heart size={16} fill={isWish ? "#ffffff" : "none"} />
                    </button>

                    {/* Quick View Button Hover Overlay */}
                    <button
                      onClick={() => onQuickView(product)}
                      className="quick-view-btn"
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        left: "50%",
                        transform: "translateX(-50%) translateY(10px)",
                        opacity: 0,
                        background: "rgba(15, 17, 21, 0.9)",
                        color: "#ffffff",
                        border: "1px solid rgba(236, 34, 38, 0.4)",
                        borderRadius: "999px",
                        padding: "8px 20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                        backdropFilter: "blur(8px)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Eye size={14} color="#ec2226" />
                      <span>Inspect Details</span>
                    </button>
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                    <div>
                      {/* Category & Wood Species */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", color: "#ec2226", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                          {product.categoryLabel}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          <Star size={12} fill="#ec2226" color="#ec2226" />
                          <span style={{ fontSize: "11px", color: "#9da3ae" }}>{product.rating}</span>
                        </div>
                      </div>

                      {/* Product Name */}
                      <h3
                        onClick={() => onQuickView(product)}
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#ffffff",
                          marginBottom: "6px",
                          cursor: "pointer",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ec2226")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}
                      >
                        {product.name}
                      </h3>

                      {/* Material Tag */}
                      <div style={{ fontSize: "12px", color: "#9da3ae", marginBottom: "14px" }}>
                        {product.woodType}
                      </div>
                    </div>

                    {/* Price and Cart Buttons */}
                    <div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "14px" }}>
                        <span style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff" }}>
                          {displayPrice}
                        </span>
                        {oldDisplayPrice && (
                          <span style={{ fontSize: "13px", color: "#6b7280", textDecoration: "line-through" }}>
                            {oldDisplayPrice}
                          </span>
                        )}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" }}>
                        <button
                          onClick={() => onAddToCart(product)}
                          className="btn-luxury-red"
                          style={{
                            padding: "9px 16px",
                            fontSize: "13px",
                            borderRadius: "8px",
                          }}
                        >
                          <ShoppingBag size={15} />
                          <span>Add to Cart</span>
                        </button>

                        <a
                          href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent(
                            `Hello Kinglet, I would like to order the "${product.name}" (${displayPrice}).`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "8px",
                            background: "rgba(37,211,102,0.15)",
                            border: "1px solid rgba(236,34,38,0.4)",
                            color: "#ec2226",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textDecoration: "none",
                            transition: "all 0.2s",
                          }}
                          aria-label="Direct WhatsApp Order"
                        >
                          <MessageCircle size={18} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .product-card-wrap:hover {
          transform: translateY(-6px);
          border-color: rgba(236, 34, 38, 0.4);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7);
        }
        .product-card-wrap:hover .product-main-img {
          transform: scale(1.08);
        }
        .product-card-wrap:hover .quick-view-btn {
          opacity: 1 !important;
          transform: translateX(-50%) translateY(0) !important;
        }
      `}</style>
    </section>
  );
}
