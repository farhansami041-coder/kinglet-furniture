import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PRODUCTS } from "../../data/kingletData";
import KingletSectionHeader from "../Common/KingletSectionHeader";
import KingletPoshProductCard from "./KingletPoshProductCard";

const FILTER_TABS = [
  { id: "all", label: "All Arrivals", icon: "✦" },
  { id: "living-room", label: "Living Suites", icon: "🛋️" },
  { id: "bedroom", label: "Bedroom", icon: "🛏️" },
  { id: "dining", label: "Dining Sets", icon: "🍽️" },
  { id: "almirah", label: "Wardrobes", icon: "🚪" },
  { id: "dressing-table", label: "Dressing Vanity", icon: "🪞" },
];

export default function KingletNewArrivalsSection({
  products = [],
  onAddToCart,
  onToggleWishlist,
  _onToggleCompare,
  wishlistIds = [],
  onQuickView,
  onOpenEmi,
  onOpenCustomSizing,
}) {
  const [activeTab, setActiveTab] = useState("all");

  const sourceProducts = products && products.length > 0 ? products : PRODUCTS;

  // Filter products directly from sourceProducts based on selected category tab
  const filteredProducts = useMemo(() => {
    const norm = (s) => (s || "").toLowerCase().replace(/[-\s]/g, "");

    if (activeTab === "all") {
      return sourceProducts.slice(0, 8);
    }

    const matchesCategory = (p) => {
      if (activeTab === "living-room") {
        return (
          norm(p.category).includes("living") ||
          norm(p.categorySlug).includes("living") ||
          norm(p.subcategory).includes("sofa") ||
          (p.name && norm(p.name).includes("sofa"))
        );
      }
      if (activeTab === "bedroom") {
        return (
          norm(p.category).includes("bed") ||
          norm(p.categorySlug).includes("bed") ||
          norm(p.subcategory).includes("bed") ||
          (p.name && norm(p.name).includes("bed"))
        );
      }
      if (activeTab === "dining") {
        return (
          norm(p.category).includes("dining") ||
          norm(p.categorySlug).includes("dining") ||
          norm(p.subcategory).includes("dining") ||
          (p.name && norm(p.name).includes("dining"))
        );
      }
      if (activeTab === "almirah") {
        return (
          norm(p.subcategory).includes("almirah") ||
          norm(p.subcategory).includes("wardrobe") ||
          norm(p.category).includes("almirah") ||
          (p.name &&
            (norm(p.name).includes("almirah") ||
              norm(p.name).includes("wardrobe") ||
              norm(p.name).includes("almira")))
        );
      }
      if (activeTab === "dressing-table") {
        return (
          norm(p.subcategory).includes("dressing") ||
          norm(p.category).includes("dressing") ||
          (p.name &&
            (norm(p.name).includes("dressing") ||
              norm(p.name).includes("vanity")))
        );
      }
      return true;
    };

    const curated = sourceProducts.filter(matchesCategory);
    if (curated.length > 0) return curated.slice(0, 8);
    return PRODUCTS.filter(matchesCategory).slice(0, 8);
  }, [activeTab, sourceProducts]);

  return (
    <section className="kinglet-new-arrivals-section scroll-reveal" style={{ padding: "70px 0 60px", background: "#ffffff" }}>
      <style>{`
        @keyframes arrivalsFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .kinglet-posh-4x4-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          width: 100%;
        }
        @media (max-width: 1120px) {
          .kinglet-posh-4x4-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }
        @media (max-width: 580px) {
          .kinglet-posh-4x4-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
        }
      `}</style>
      <div className="container" style={{ maxWidth: "1440px", padding: "0 20px" }}>
        
        {/* Section Header: JMG & Hatil Style with Continuous Red Accent Line */}
        <KingletSectionHeader
          title="NEW ARRIVAL PRODUCTS"
          subtitle="Curated 2026 Collection"
          linkTo={null}
        />

        {/* Minimal Filter Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "14px",
            marginBottom: "28px",
            scrollbarWidth: "none",
          }}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 16px",
                  borderRadius: "6px",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  border: isActive ? "1px solid #ec2226" : "1px solid #e2e8f0",
                  background: isActive ? "#ec2226" : "#ffffff",
                  color: isActive ? "#ffffff" : "#475569",
                  boxShadow: isActive ? "0 4px 12px rgba(236, 34, 38, 0.2)" : "none",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    e.currentTarget.style.color = "#0f172a";
                    e.currentTarget.style.background = "#f8fafc";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.color = "#475569";
                    e.currentTarget.style.background = "#ffffff";
                  }
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Clean Posh Product Grid (Strictly 4 Columns Per Line, 1:1 Big Framed Pictures) */}
        <div className="kinglet-posh-4x4-grid">
          {filteredProducts.map((p) => (
            <KingletPoshProductCard
              key={p.id}
              product={p}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              onQuickView={onQuickView}
              onOpenEmi={onOpenEmi}
              onOpenCustomSizing={onOpenCustomSizing}
              isWishlisted={wishlistIds.includes(p.id)}
            />
          ))}
        </div>

        {/* Dynamic Center "SEE MORE" Call to Action with Progress Indicator */}
        <div style={{ textAlign: "center", marginTop: "42px" }}>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <Link
              to="/category/all"
              className="kinglet-dynamic-center-see-more"
              title="Explore all new arrival products"
            >
              <span className="btn-shimmer-sweep" />
              <span>SEE MORE NEW ARRIVALS</span>
              <span className="btn-icon-bubble">
                <ArrowRight size={15} strokeWidth={2.6} />
              </span>
            </Link>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "650", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", display: "inline-block", boxShadow: "0 0 6px rgba(22, 163, 74, 0.6)" }} />
              Showing {filteredProducts.length} masterpieces • 100% Seasoned Mahogany & Black Plum Wood &amp; Italian PU
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
