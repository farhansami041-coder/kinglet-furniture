import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  PhoneCall,
  Crown,
  ChevronDown,
  Sparkles,
  ArrowLeftRight,
  Truck,
  Layers,
  Wand2,
} from "lucide-react";
import { PRODUCTS, CATEGORIES } from "../../data/kingletData";

export default function KingletNavbar({
  cartCount,
  wishlistCount,
  compareCount = 0,
  onOpenCart,
  onOpenWishlist,
  onOpenCompare,
  onOpenOrderTrack,
  onOpenAiStylist,
  onOpenConsultation,
  onSelectCategory,
  onQuickView,
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Purely derived search results
  const searchResults = useMemo(() => {
    if (searchQuery.trim().length <= 1) return [];
    const q = searchQuery.toLowerCase();
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.woodType.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: isScrolled
          ? "rgba(14, 16, 20, 0.94)"
          : "rgba(14, 16, 20, 0.8)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(212, 175, 55, 0.18)",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
        }}
      >
        {/* Brand Logo & Tagline */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a
            href="#"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ec2226 0%, #b91c1c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 15px rgba(236, 34, 38, 0.35)",
              }}
            >
              <Crown size={22} color="#ffffff" />
            </div>
            <div>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "22px",
                  fontWeight: "800",
                  letterSpacing: "2.5px",
                  color: "#ffffff",
                  display: "block",
                  lineHeight: "1.1",
                }}
              >
                KINGLET
              </span>
              <span
                style={{
                  fontSize: "9px",
                  letterSpacing: "1.5px",
                  color: "#ec2226",
                  textTransform: "uppercase",
                  fontWeight: "700",
                  display: "block",
                }}
              >
                Furniture & Interior
              </span>
            </div>
          </a>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          className="desktop-nav"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {/* Collections Mega Menu Dropdown */}
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setActiveDropdown("collections")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              style={{
                background: "transparent",
                border: "none",
                color: activeDropdown === "collections" ? "#ec2226" : "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                padding: "8px 0",
                transition: "color 0.2s",
              }}
            >
              <span>Collections</span>
              <ChevronDown size={14} />
            </button>

            {activeDropdown === "collections" && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "-20px",
                  width: "560px",
                  background: "#12151b",
                  border: "1px solid rgba(212, 175, 55, 0.3)",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 25px 50px rgba(0,0,0,0.75)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  zIndex: 2000,
                  animation: "fadeIn 0.2s ease-out",
                }}
              >
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      onSelectCategory(cat.id);
                      setActiveDropdown(null);
                      const el = document.getElementById("catalog-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(212,175,55,0.1)";
                      e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                    }}
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      width="50"
                      height="50"
                      loading="lazy"
                      style={{
                        width: "50px",
                        height: "50px",
                        aspectRatio: "1 / 1",
                        borderRadius: "8px",
                        objectFit: "cover",
                      }}
                    />
                    <div>
                      <div
                        style={{
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: "700",
                        }}
                      >
                        {cat.name}
                      </div>
                      <div style={{ color: "#ec2226", fontSize: "11px" }}>
                        {cat.itemCount} Fine Pieces
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <a
            href="#interior-studio"
            style={{
              color: "#e5e7eb",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ec2226")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#e5e7eb")}
          >
            Turnkey Interior
          </a>

          <a
            href="#craftsmanship"
            style={{
              color: "#e5e7eb",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ec2226")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#e5e7eb")}
          >
            Wood Seasoning
          </a>

          {/* 3D Visualizer Link */}
          <a
            href="#room-visualizer"
            style={{
              color: "#e5e7eb",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ec2226")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#e5e7eb")}
          >
            <Layers size={13} color="#ec2226" />
            <span>Atmosphere Simulator</span>
          </a>

          {/* AI Stylist Trigger */}
          <button
            onClick={onOpenAiStylist}
            style={{
              background: "transparent",
              border: "none",
              color: "#ec2226",
              fontSize: "14px",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
              padding: "0",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#ec2226")}
          >
            <Wand2 size={14} />
            <span>AI Stylist</span>
          </button>

          {/* Track Order Trigger */}
          <button
            onClick={onOpenOrderTrack}
            style={{
              background: "transparent",
              border: "none",
              color: "#9da3ae",
              fontSize: "14px",
              fontWeight: "500",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
              padding: "0",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9da3ae")}
          >
            <Truck size={14} />
            <span>Track Order</span>
          </button>
        </nav>

        {/* Live Search Bar */}
        <div
          className="desktop-search"
          style={{ position: "relative", width: "240px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "999px",
              padding: "7px 14px",
              gap: "8px",
            }}
          >
            <Search size={15} color="#9da3ae" />
            <input
              id="kinglet-navbar-search"
              name="navbarSearch"
              type="text"
              autoComplete="off"
              placeholder="Search mahogany, beds..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                setIsSearchOpen(val.trim().length > 1);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 1) setIsSearchOpen(true);
              }}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: "12px",
                width: "100%",
              }}
            />
            {searchQuery && (
              <X
                size={14}
                color="#9da3ae"
                style={{ cursor: "pointer" }}
                onClick={() => setSearchQuery("")}
              />
            )}
          </div>

          {/* Search Autocomplete Flyout */}
          {isSearchOpen && searchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "115%",
                left: 0,
                right: 0,
                width: "320px",
                background: "#14171f",
                border: "1px solid rgba(212, 175, 55, 0.3)",
                borderRadius: "14px",
                padding: "8px",
                boxShadow: "0 15px 35px rgba(0,0,0,0.8)",
                zIndex: 2500,
              }}
            >
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onQuickView(p);
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    width="36"
                    height="36"
                    loading="lazy"
                    style={{
                      width: "36px",
                      height: "36px",
                      aspectRatio: "1 / 1",
                      borderRadius: "6px",
                      objectFit: "cover",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#ffffff",
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#9da3ae" }}>
                      {p.woodType} • ৳{p.priceBDT.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Icons: Compare, Wishlist, Cart, Consultation CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Compare Trigger */}
          <button
            onClick={onOpenCompare}
            aria-label="Compare"
            title="Side-by-side furniture comparison"
            style={{
              position: "relative",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ec2226";
              e.currentTarget.style.color = "#ec2226";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "#ffffff";
            }}
          >
            <ArrowLeftRight size={17} />
            {compareCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "#ec2226",
                  color: "#121418",
                  fontSize: "11px",
                  fontWeight: "800",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {compareCount}
              </span>
            )}
          </button>

          {/* Wishlist Trigger */}
          <button
            onClick={onOpenWishlist}
            aria-label="Wishlist"
            style={{
              position: "relative",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ec2226";
              e.currentTarget.style.color = "#ec2226";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "#ffffff";
            }}
          >
            <Heart size={18} />
            {wishlistCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "#ec2226",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: "700",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Drawer Trigger */}
          <button
            onClick={onOpenCart}
            aria-label="Cart"
            style={{
              position: "relative",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ec2226";
              e.currentTarget.style.color = "#ec2226";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "#ffffff";
            }}
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "linear-gradient(135deg, #ec2226 0%, #b91c1c 100%)",
                  color: "#121418",
                  fontSize: "11px",
                  fontWeight: "800",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cartCount}
              </span>
            )}
          </button>

          {/* Book Consultation Modal CTA */}
          <button
            onClick={onOpenConsultation}
            className="btn-luxury-red"
            style={{
              padding: "9px 20px",
              fontSize: "13px",
              letterSpacing: "0.3px",
            }}
          >
            <Sparkles size={14} />
            <span>Book Consultation</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-hamburger"
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              display: "none",
            }}
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div
          style={{
            background: "#12151b",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: "8px", padding: "8px 12px", gap: "8px" }}>
            <Search size={16} color="#9da3ae" />
            <input
              id="kinglet-navbar-mobile-search"
              name="navbarMobileSearch"
              type="text"
              autoComplete="off"
              placeholder="Search Kinglet pieces..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                setIsSearchOpen(val.trim().length > 1);
              }}
              style={{ background: "transparent", border: "none", color: "#ffffff", width: "100%", outline: "none" }}
            />
          </div>

          <a
            href="#collections"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ color: "#ffffff", textDecoration: "none", fontSize: "15px", fontWeight: "600", padding: "8px 0" }}
          >
            Collections & Products
          </a>
          <a
            href="#interior-studio"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ color: "#ffffff", textDecoration: "none", fontSize: "15px", fontWeight: "600", padding: "8px 0" }}
          >
            Turnkey Interior Architecture
          </a>
          <a
            href="#room-visualizer"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ color: "#ec2226", textDecoration: "none", fontSize: "15px", fontWeight: "600", padding: "8px 0" }}
          >
            3D Atmosphere Simulator
          </a>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenAiStylist();
            }}
            style={{ background: "transparent", border: "none", color: "#ec2226", textAlign: "left", fontSize: "15px", fontWeight: "600", padding: "8px 0", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Wand2 size={16} />
            <span>AI Space Stylist</span>
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenOrderTrack();
            }}
            style={{ background: "transparent", border: "none", color: "#ffffff", textAlign: "left", fontSize: "15px", fontWeight: "600", padding: "8px 0", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Truck size={16} />
            <span>Track Bespoke Order</span>
          </button>
          <a
            href="#craftsmanship"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ color: "#ffffff", textDecoration: "none", fontSize: "15px", fontWeight: "600", padding: "8px 0" }}
          >
            Timber Seasoning & Quality Anatomy
          </a>
          <a
            href="#budget-estimator"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ color: "#ec2226", textDecoration: "none", fontSize: "15px", fontWeight: "600", padding: "8px 0" }}
          >
            Interactive Budget Estimator
          </a>
          <a
            href="#showroom"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ color: "#ffffff", textDecoration: "none", fontSize: "15px", fontWeight: "600", padding: "8px 0" }}
          >
            Mirpur Sales Center & Factory
          </a>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenConsultation();
            }}
            className="btn-luxury-red"
            style={{ width: "100%", marginTop: "10px" }}
          >
            <PhoneCall size={16} />
            <span>Request In-Home Consultation</span>
          </button>
        </div>
      )}

      {/* Responsive CSS Media Queries */}
      <style>{`
        @media (max-width: 960px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-search {
            display: none !important;
          }
          .mobile-hamburger {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}
