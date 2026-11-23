import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Heart,
  ShoppingBag,
  ArrowLeftRight,
  User,
  Phone,
  Gift,
  ChevronDown,
  ChevronRight,
  MapPin,
  Truck,
  Sparkles,
  X,
  Menu,
  ArrowRight,
} from "lucide-react";
import { BRAND_INFO, NAV_CATEGORIES, PRODUCTS } from "../../data/kingletData";
import { getCurrentUser } from "../../utils/accountService";
import { productService } from "../../utils/productService";

const SEARCH_SUGGESTIONS = [
  "Search 'Seasoned Mahogany Bed'...",
  "Search 'L-Shaped Sofa Set'...",
  "Search '6-Seater Dining Table'...",
  "Search 'Sunflora Almirah'...",
  "Search 'Dressing Table Vanity'...",
  "Search 'Orthopedic Mattress'...",
  "Search 'Executive Office Desk'...",
];

export default function KingletHeaderClone({
  cartCount = 0,
  wishlistCount = 0,
  compareCount = 0,
  onOpenCart,
  onOpenWishlist,
  onOpenCompare,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/" || location.pathname === "";

  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [siteSettings, setSiteSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kinglet_site_settings") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleAuth = (e) => {
      setCurrentUser(e.detail !== undefined ? e.detail : getCurrentUser());
    };
    const handleSettingsUpdate = (e) => {
      if (e?.detail) setSiteSettings(e.detail);
    };
    window.addEventListener("kinglet_auth_change", handleAuth);
    window.addEventListener("kinglet_settings_updated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("kinglet_auth_change", handleAuth);
      window.removeEventListener("kinglet_settings_updated", handleSettingsUpdate);
    };
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [activeNavIndex, setActiveNavIndex] = useState(null);
  const [activeSubIndex, setActiveSubIndex] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileCat, setExpandedMobileCat] = useState(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const navLeaveTimeoutRef = useRef(null);

  // Synchronously close navigation drawers and search upon route transitions
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setActiveNavIndex(null);
    setActiveSubIndex(null);
  }

  // Dynamic Navigation Categories synchronized with Menu Builder in Admin
  const activeNavCategories = useMemo(() => {
    if (siteSettings?.site_navigation_menu) {
      try {
        const raw = siteSettings.site_navigation_menu;
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => {
            const label = item.label || item.title || item.name || "Item";
            const url = item.url || item.link || "/category/all";
            const normUrl = url.toLowerCase().replace(/\/$/, "");

            // Match with rich subcategories from NAV_CATEGORIES if category exists
            const match = NAV_CATEGORIES.find((cat) => {
              const catSlug = cat.slug?.toLowerCase();
              const catName = cat.name?.toLowerCase();
              return (
                (catSlug && (normUrl.endsWith(catSlug) || normUrl.includes(`/category/${catSlug}`))) ||
                (catName && label.toLowerCase().includes(catName))
              );
            });

            return {
              id: match?.id || `menu-cat-${idx}`,
              name: label,
              slug: match?.slug || (url.startsWith("/category/") ? url.replace("/category/", "") : null),
              url: url,
              subcategories: match?.subcategories || null,
              columns: match?.columns || null,
            };
          });
        }
      } catch (err) {
        console.warn("Could not parse site_navigation_menu:", err);
      }
    }
    return NAV_CATEGORIES.map((c) => ({ ...c, url: `/category/${c.slug}` }));
  }, [siteSettings?.site_navigation_menu]);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth < 1024;
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [liveCatalog, setLiveCatalog] = useState(PRODUCTS);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveProducts = () => {
      productService.getProducts({ limit: 250 }).then((res) => {
        if (isMounted && res.products && res.products.length > 0) {
          setLiveCatalog(res.products);
        }
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

  // Purely derived real-time search results (zero setState lag/cascade)
  const searchResults = useMemo(() => {
    if (searchQuery.trim().length === 0) return [];
    const q = searchQuery.toLowerCase().trim();
    return liveCatalog.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q)) ||
        (p.woodType && p.woodType.toLowerCase().includes(q)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchQuery, liveCatalog]);

  const handleNavMouseEnter = (idx) => {
    if (navLeaveTimeoutRef.current) {
      clearTimeout(navLeaveTimeoutRef.current);
      navLeaveTimeoutRef.current = null;
    }
    setActiveNavIndex(idx);
    setActiveSubIndex(null);
  };

  const handleNavMouseLeave = () => {
    navLeaveTimeoutRef.current = setTimeout(() => {
      setActiveNavIndex(null);
      setActiveSubIndex(null);
    }, 320);
  };

  const handleSubMouseEnter = (sIdx) => {
    if (navLeaveTimeoutRef.current) {
      clearTimeout(navLeaveTimeoutRef.current);
      navLeaveTimeoutRef.current = null;
    }
    setActiveSubIndex(sIdx);
  };

  useEffect(() => {
    return () => {
      if (navLeaveTimeoutRef.current) clearTimeout(navLeaveTimeoutRef.current);
    };
  }, []);

  // Dynamic cycling animated search placeholder
  useEffect(() => {
    if (isSearchFocused || searchQuery.length > 0) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_SUGGESTIONS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isSearchFocused, searchQuery]);

  // Scroll listener for sticky compact transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Keyboard shortcut (⌘K / Ctrl+K to focus search, Esc to blur/close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === "Escape" && (isSearchFocused || isSearchOpen)) {
        setIsSearchOpen(false);
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchFocused, isSearchOpen]);

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const q = searchQuery.trim();
    if (q.length > 0) {
      navigate(`/category/all?search=${encodeURIComponent(q)}`);
      setIsSearchOpen(false);
    }
  };

  const hasFullBleedHero =
    isHomePage ||
    location.pathname.startsWith("/category") ||
    location.pathname.startsWith("/interior") ||
    location.pathname.startsWith("/flash-sale");

  const isHeaderTransparent = hasFullBleedHero && !isScrolled;

  return (
    <>
      <header
        className={`kinglet-apple-header ${isHeaderTransparent ? "is-top-transparent" : "is-scrolled"}`}
      >
        {/* Transparent Glass Backdrop Layer */}
        <div className="header-glass-backdrop" />

        {/* 1. Top Utility Strip - Gracefully condenses when scrolled (Desktop Only) */}
        {!isMobile && (
          <div
            className="desktop-top-bar"
            style={{
              position: "relative",
              zIndex: 1,
              maxHeight: isScrolled ? "0px" : "34px",
              opacity: isScrolled ? 0 : 1,
              overflow: "hidden",
              transition: "max-height 0.3s ease, opacity 0.25s ease",
              background: "transparent",
              borderBottom: isHeaderTransparent ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
              padding: isScrolled ? "0" : "6px 0",
              fontSize: "12px",
            }}
          >
            <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 clamp(12px, 2vw, 24px)", boxSizing: "border-box" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {/* Left Hotline & Showroom */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <a
                    href={`tel:${siteSettings.footer_phone ? siteSettings.footer_phone.split(",")[0].trim() : (siteSettings.primary_phone || BRAND_INFO.hotlinePrimary)}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: isHeaderTransparent ? "#ffffff" : "#0f172a",
                      fontWeight: "750",
                      textDecoration: "none",
                      textShadow: isHeaderTransparent ? "0 1px 3px rgba(0,0,0,0.85)" : "none",
                    }}
                  >
                    <Phone size={12} color="#ec2226" />
                    <span>Hotline: {siteSettings.footer_phone ? siteSettings.footer_phone.split(",")[0].trim() : (siteSettings.primary_phone || BRAND_INFO.hotlinePrimary)}</span>
                  </a>
                  <span style={{ color: isHeaderTransparent ? "rgba(255, 255, 255, 0.4)" : "rgba(15, 23, 42, 0.35)" }}>•</span>
                  <Link
                    to="/showrooms"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: isHeaderTransparent ? "rgba(255, 255, 255, 0.9)" : "#334155",
                      fontWeight: "650",
                      textDecoration: "none",
                      textShadow: isHeaderTransparent ? "0 1px 3px rgba(0,0,0,0.85)" : "none",
                    }}
                  >
                    <MapPin size={12} color="#ec2226" />
                    <span>Showroom: {siteSettings.footer_address ? siteSettings.footer_address.split(",")[0].trim() : (siteSettings.showroom_address ? siteSettings.showroom_address.split(",")[0].trim() : "752/2 West Shewrapara, Mirpur")}</span>
                  </Link>
                </div>

                {/* Right Links */}
                <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                  <Link
                    to="/offers"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      color: isHeaderTransparent ? "#ffffff" : "#0f172a",
                      fontWeight: "750",
                      textDecoration: "none",
                      textShadow: isHeaderTransparent ? "0 1px 3px rgba(0,0,0,0.85)" : "none",
                    }}
                  >
                    <Gift size={12} color="#ec2226" /> Bridal Packages
                  </Link>
                  <Link
                    to="/track-order"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      color: isHeaderTransparent ? "rgba(255, 255, 255, 0.9)" : "#334155",
                      fontWeight: "650",
                      textDecoration: "none",
                      textShadow: isHeaderTransparent ? "0 1px 3px rgba(0,0,0,0.85)" : "none",
                    }}
                  >
                    <Truck size={12} color="#ec2226" /> Track Order
                  </Link>
                  <Link
                    to="/interior"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      color: isHeaderTransparent ? "#ffffff" : "#0f172a",
                      fontWeight: "750",
                      textDecoration: "none",
                      textShadow: isHeaderTransparent ? "0 1px 3px rgba(0,0,0,0.85)" : "none",
                    }}
                  >
                    <Sparkles size={12} color="#ec2226" /> Interior Studio
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Main Navigation Bar - Balanced Width & Zero Horizontal Overflow */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: isScrolled ? "10px 0" : "14px 0",
            transition: "padding 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            style={{
              maxWidth: "1440px",
              margin: "0 auto",
              padding: "0 clamp(12px, 2vw, 24px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Brand Logo - Pure White at top, smoothly cross-fading to Signature Red on scroll */}
            <div style={{ flexShrink: 0, position: "relative" }}>
              <Link
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  position: "relative",
                  height: isScrolled ? "44px" : "54px",
                  transition: "height 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* 1. Full White Logo (At top transparent hero state) */}
                <img
                  src="/images/kinglet-logo-white.png"
                  width="116"
                  height="54"
                  onError={(e) => {
                    if (e.currentTarget.src !== BRAND_INFO.logoWhite) {
                      e.currentTarget.src = BRAND_INFO.logoWhite;
                    }
                  }}
                  alt={BRAND_INFO.name}
                  style={{
                    height: isScrolled ? "44px" : "54px",
                    width: "auto",
                    objectFit: "contain",
                    display: "block",
                    filter: "drop-shadow(0 2px 10px rgba(0, 0, 0, 0.65))",
                    opacity: isHeaderTransparent ? 1 : 0,
                    transform: isHeaderTransparent ? "scale(1)" : "scale(0.96)",
                    transition: "opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    pointerEvents: isHeaderTransparent ? "auto" : "none",
                  }}
                />

                {/* 2. Signature Red Logo (Smoothly fades in when scrolled or on solid header) */}
                <img
                  src="/images/kinglet-logo-red.png"
                  width="116"
                  height="54"
                  onError={(e) => {
                    if (e.currentTarget.src !== BRAND_INFO.logoDark) {
                      e.currentTarget.src = BRAND_INFO.logoDark;
                    }
                  }}
                  alt={BRAND_INFO.name}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: isScrolled ? "44px" : "54px",
                    width: "auto",
                    objectFit: "contain",
                    display: "block",
                    filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.10))",
                    opacity: isHeaderTransparent ? 0 : 1,
                    transform: isHeaderTransparent ? "scale(0.96)" : "scale(1)",
                    transition: "opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    pointerEvents: isHeaderTransparent ? "none" : "auto",
                  }}
                />
              </Link>
            </div>

            {/* Desktop Category Menus - Left-Aligned Next to Brand Logo */}
            <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", flexShrink: 0, marginLeft: "28px", marginRight: "auto" }}>
              <ul style={{ display: "flex", listStyle: "none", margin: 0, padding: 0, gap: "4px", alignItems: "center" }}>
                {activeNavCategories.map((cat, idx) => {
                  const isOpen = activeNavIndex === idx;
                  const targetUrl = cat.url || (cat.slug ? `/category/${cat.slug}` : "/category/all");

                  return (
                    <li
                      key={cat.id || idx}
                      className="kinglet-nav-item"
                      onMouseEnter={() => handleNavMouseEnter(idx)}
                      onMouseLeave={handleNavMouseLeave}
                      style={{ position: "relative" }}
                    >
                      <Link
                        to={targetUrl}
                        className={`kinglet-nav-link ${isOpen ? "is-active-dropdown" : ""}`}
                      >
                        <span>{cat.name}</span>
                      </Link>

                      {/* Cascading Subcategory Dropdown with Per-Item Level-Aligned Flyout */}
                      {cat.subcategories && (
                        <div
                          className={`kinglet-cascade-dropdown ${isOpen ? "is-open" : ""}`}
                          style={{
                            left: "0",
                            right: "auto",
                            display: isOpen ? "block" : undefined,
                          }}
                          onMouseEnter={() => {
                            if (navLeaveTimeoutRef.current) {
                              clearTimeout(navLeaveTimeoutRef.current);
                              navLeaveTimeoutRef.current = null;
                            }
                            setActiveNavIndex(idx);
                          }}
                          onMouseLeave={handleNavMouseLeave}
                        >
                          {/* Level 1: Subcategories List */}
                          <div
                            className="cascade-level-1"
                            onMouseLeave={() => setActiveSubIndex(null)}
                          >
                            {cat.subcategories.map((sub, sIdx) => {
                              const isSubActive = activeSubIndex === sIdx;
                              const hasChildren = sub.children && sub.children.length > 0;

                              return (
                                <div
                                  key={sIdx}
                                  className={`cascade-item-level-1 ${isSubActive ? "is-active" : ""}`}
                                  onMouseEnter={() => handleSubMouseEnter(sIdx)}
                                >
                                  <Link
                                    to={`/category/${cat.slug}?sub=${sub.slug}`}
                                    className="cascade-link-level-1"
                                    draggable={false}
                                    style={{ userSelect: "none", cursor: "pointer" }}
                                    onClick={() => {
                                      setActiveNavIndex(null);
                                      setActiveSubIndex(null);
                                    }}
                                  >
                                    <span className="cascade-sub-label" style={{ userSelect: "none" }}>{sub.name}</span>
                                    {hasChildren && (
                                      <ChevronRight
                                        size={13}
                                        className={`cascade-sub-arrow ${isSubActive ? "is-active" : ""}`}
                                      />
                                    )}
                                  </Link>

                                  {/* Level 2: Subcategory Child Flyout - Directly Aligned Level With Hovered Item ("OI BORABOR") */}
                                  {hasChildren && isSubActive && (
                                    <div
                                      className="cascade-level-2-flyout flyout-right"
                                      style={{
                                        top: 0,
                                        left: "calc(100% + 8px)",
                                        right: "auto",
                                      }}
                                    >
                                      {sub.children.map((child, cIdx) => {
                                        const childName =
                                          typeof child === "string" ? child : child.name;
                                        return (
                                          <Link
                                            key={cIdx}
                                            to={`/category/${cat.slug}?sub=${sub.slug}&child=${encodeURIComponent(
                                              childName
                                            )}`}
                                            className="cascade-link-level-2"
                                            draggable={false}
                                            style={{ userSelect: "none", cursor: "pointer" }}
                                            onClick={() => {
                                              setActiveNavIndex(null);
                                              setActiveSubIndex(null);
                                            }}
                                          >
                                            <span style={{ userSelect: "none" }}>{childName}</span>
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Right: Search Capsule & Action Icons */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              {/* Dynamic Animated Search Pill */}
              <div
                ref={searchContainerRef}
                className={`desktop-search ${isSearchFocused ? "is-focused" : ""} ${
                  searchQuery.length > 0 ? "has-query" : ""
                }`}
                style={{ position: "relative" }}
              >
                <form
                  onSubmit={handleSearchSubmit}
                  className="header-search-form"
                >
                  {/* Dynamic Search Input Field - Clean, Spacious & Fluid */}
                  <input
                    ref={searchInputRef}
                    id="kinglet-desktop-search"
                    name="q"
                    type="text"
                    autoComplete="off"
                    placeholder={SEARCH_SUGGESTIONS[placeholderIndex]}
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      setIsSearchOpen(val.trim().length > 0);
                    }}
                    onFocus={() => {
                      setIsSearchFocused(true);
                      if (searchQuery.trim().length > 0) setIsSearchOpen(true);
                    }}
                    onBlur={() => {
                      setIsSearchFocused(false);
                    }}
                    className="header-search-input"
                    autoComplete="off"
                    spellCheck="false"
                  />

                  {/* Animated Clear Button (appears when text is typed) */}
                  {searchQuery.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setIsSearchOpen(false);
                        searchInputRef.current?.focus();
                      }}
                      aria-label="Clear search"
                      className="search-clear-btn"
                    >
                      <X size={12} strokeWidth={2.8} />
                    </button>
                  )}

                  {/* Single Dynamic Action Search Button (Morphing Lens -> Arrow) */}
                  <button
                    type="submit"
                    aria-label="Submit Search"
                    className={`header-search-submit-btn ${
                      searchQuery.length > 0 ? "has-text" : ""
                    }`}
                  >
                    <span className="search-orb-glow" />
                    {isSearchFocused && searchQuery.length > 0 ? (
                      <ArrowRight size={14} strokeWidth={2.5} className="search-btn-icon is-arrow" />
                    ) : (
                      <Search size={14} strokeWidth={2.5} className="search-btn-icon is-lens" />
                    )}
                  </button>
                </form>

                {/* Autocomplete Popup with Ultra-Smooth Scrollbar & Micro-Animations */}
                {isSearchOpen && searchResults.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      right: 0,
                      width: "365px",
                      background: "#ffffff",
                      borderRadius: "16px",
                      border: "1.5px solid rgba(236, 34, 38, 0.22)",
                      boxShadow:
                        "0 25px 60px -10px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0,0,0,0.04)",
                      zIndex: 10000,
                      overflow: "hidden",
                      animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                    onWheel={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div
                      style={{
                        padding: "11px 16px 9px",
                        background: "#f8fafc",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          color: "#ec2226",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Sparkles size={12} color="#ec2226" />
                        <span>Matching Designs ({searchResults.length})</span>
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
                        Instant Search
                      </span>
                    </div>

                    {/* Smooth Scrollable Results List with Zero-Bug Scroll Containment */}
                    <div
                      className="kinglet-search-results-scroll"
                      onWheel={(e) => e.stopPropagation()}
                      style={{
                        maxHeight: "315px",
                        overflowY: "auto",
                        overscrollBehavior: "contain",
                        padding: "6px 8px 6px 10px",
                      }}
                    >
                      {searchResults.map((p) => (
                        <div
                          key={p.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            navigate(`/product/${p.slug}`);
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "9px 12px",
                            borderRadius: "10px",
                            marginBottom: "4px",
                            cursor: "pointer",
                            transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                            background: "#ffffff",
                          }}
                          className="kinglet-search-result-item"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#fef2f2";
                            e.currentTarget.style.transform = "translateX(3px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.transform = "translateX(0)";
                          }}
                        >
                          <img
                            src={p.image}
                            alt={p.name}
                            width="44"
                            height="44"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/images/furniture-placeholder.svg";
                            }}
                            style={{
                              width: "44px",
                              height: "44px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: "700",
                                color: "#0f172a",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {p.name}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                                textTransform: "capitalize",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {p.woodType ? p.woodType.split("&")[0].trim() : p.category}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: "6px" }}>
                            <div style={{ fontSize: "13px", color: "#ec2226", fontWeight: "800" }}>
                              ৳{p.priceBDT.toLocaleString()}
                            </div>
                            <ChevronRight
                              size={12}
                              color="#94a3b8"
                              style={{ display: "inline-block", marginTop: "2px" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer View All Link */}
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSearchSubmit(e);
                      }}
                      style={{
                        padding: "11px 16px",
                        background: "#f8fafc",
                        borderTop: "1px solid #f1f5f9",
                        textAlign: "center",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#ec2226",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fee2e2";
                        e.currentTarget.style.color = "#ec2226";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f8fafc";
                        e.currentTarget.style.color = "#ec2226";
                      }}
                    >
                      <span>View all results for "{searchQuery}"</span>
                      <ArrowRight size={13} strokeWidth={2.5} />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: Account, Wishlist, Compare, Cart - 100% Inside Screen Frame */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                {/* User / Orders */}
                <Link
                  to="/account"
                  className="header-action-btn action-btn-user"
                  aria-label="My Customer Account & Orders"
                >
                  <span className="action-btn-aura" />
                  <User size={16} strokeWidth={2.1} />
                  {currentUser && (
                    <span
                      style={{
                        position: "absolute",
                        top: "3px",
                        right: "3px",
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "#22c55e",
                        border: "1.5px solid #ffffff",
                        boxShadow: "0 0 4px #22c55e",
                      }}
                    />
                  )}
                  <span className="action-tooltip">
                    {currentUser ? (currentUser.fullName ? currentUser.fullName.split(" ")[0] : "Account") : "Account"}
                  </span>
                </Link>

                {/* Wishlist */}
                <button
                  onClick={onOpenWishlist}
                  aria-label={`Wishlist (${wishlistCount} items)`}
                  className="header-action-btn action-btn-wishlist"
                >
                  <span className="action-btn-aura" />
                  <Heart size={16} strokeWidth={2.1} />
                  {wishlistCount > 0 && (
                    <span className="header-action-badge">
                      {wishlistCount}
                    </span>
                  )}
                  <span className="action-tooltip">Wishlist ({wishlistCount})</span>
                </button>

                {/* Compare */}
                <button
                  onClick={onOpenCompare}
                  aria-label={`Compare Models (${compareCount} items)`}
                  className="header-action-btn action-btn-compare"
                >
                  <span className="action-btn-aura" />
                  <ArrowLeftRight size={16} strokeWidth={2.1} />
                  {compareCount > 0 && (
                    <span className="header-action-badge">
                      {compareCount}
                    </span>
                  )}
                  <span className="action-tooltip">Compare ({compareCount})</span>
                </button>

                {/* Cart Button */}
                <button
                  onClick={onOpenCart}
                  aria-label={`Shopping Cart (${cartCount} items)`}
                  className="header-action-btn action-btn-cart"
                >
                  <span className="action-btn-aura" />
                  <ShoppingBag size={16} strokeWidth={2.1} />
                  {cartCount > 0 && (
                    <span className="header-action-badge">
                      {cartCount}
                    </span>
                  )}
                  <span className="action-tooltip">Cart ({cartCount})</span>
                </button>

                {/* Mobile Menu Hamburger */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle Mobile Menu"
                  className="mobile-hamburger-btn header-action-btn"
                >
                  <span className="action-btn-aura" />
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-in Drawer */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(6px)",
            }}
          />

          {/* Drawer content */}
          <div
            style={{
              position: "relative",
              width: "310px",
              height: "100%",
              background: "rgba(14, 16, 22, 0.96)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              borderLeft: "1px solid rgba(255, 255, 255, 0.15)",
              display: "flex",
              flexDirection: "column",
              padding: "20px",
              overflowY: "auto",
              zIndex: 2,
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <img src={BRAND_INFO.logoWhite} alt={BRAND_INFO.name} width="116" height="34" style={{ height: "34px", width: "auto", objectFit: "contain" }} />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "#ffffff",
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Search Bar inside Drawer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/category/all?search=${encodeURIComponent(searchQuery.trim())}`);
                  setIsMobileMenuOpen(false);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                borderRadius: "10px",
                padding: "8px 12px",
                marginBottom: "20px",
                position: "relative",
              }}
            >
              <Search size={16} color="rgba(255, 255, 255, 0.75)" style={{ marginRight: "8px", flexShrink: 0 }} />
              <input
                id="kinglet-mobile-drawer-search"
                name="mobileSearch"
                type="search"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search beds, sofas, tables..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#ffffff",
                  fontSize: "14px",
                  width: "100%",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: "2px" }}
                >
                  <X size={14} />
                </button>
              )}
            </form>

            {/* Mobile Nav Categories */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#ec2226", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px" }}>
                CATEGORIES
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {activeNavCategories.map((cat, mIdx) => {
                  const catKey = cat.id || `mobile-cat-${mIdx}`;
                  const isExpanded = expandedMobileCat === catKey;
                  const targetUrl = cat.url || (cat.slug ? `/category/${cat.slug}` : "/category/all");

                  return (
                    <div key={catKey} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 0",
                          cursor: "pointer",
                        }}
                        onClick={() => setExpandedMobileCat(isExpanded ? null : catKey)}
                      >
                        <Link
                          to={targetUrl}
                          onClick={(e) => {
                            if (cat.columns || cat.subcategories) {
                              e.preventDefault();
                              setExpandedMobileCat(isExpanded ? null : catKey);
                            } else {
                              setIsMobileMenuOpen(false);
                            }
                          }}
                          style={{
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: "700",
                            textDecoration: "none",
                          }}
                        >
                          {cat.name}
                        </Link>
                        {(cat.columns || cat.subcategories) && (
                          <ChevronDown
                            size={16}
                            color="rgba(255,255,255,0.6)"
                            style={{
                              transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                              transition: "transform 0.25s ease",
                            }}
                          />
                        )}
                      </div>

                      {/* Subcategories list */}
                      {cat.subcategories && isExpanded && (
                        <div style={{ padding: "4px 0 12px 12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          {cat.subcategories.map((sub, sIdx) => (
                            <div key={sIdx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <Link
                                to={`/category/${cat.slug}?sub=${sub.slug}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                style={{
                                  color: "#ffffff",
                                  fontSize: "13px",
                                  fontWeight: "700",
                                  textDecoration: "none",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <span>{sub.name}</span>
                                {sub.children && <span style={{ color: "#ec2226" }}>→</span>}
                              </Link>
                              {sub.children && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "3px", paddingLeft: "10px" }}>
                                  {sub.children.map((child, kIdx) => {
                                    const childName =
                                      typeof child === "string" ? child : child.name;
                                    return (
                                      <Link
                                        key={kIdx}
                                        to={`/category/${cat.slug}?sub=${sub.slug}&child=${encodeURIComponent(
                                          childName
                                        )}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        style={{
                                          color: "rgba(255, 255, 255, 0.65)",
                                          fontSize: "12px",
                                          textDecoration: "none",
                                          padding: "2px 0",
                                        }}
                                      >
                                        • {childName}
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Contact & Links */}
            <div style={{ paddingTop: "20px", borderTop: "1px solid rgba(255, 255, 255, 0.12)", display: "flex", flexDirection: "column", gap: "12px" }}>
              <Link
                to="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  textAlign: "center",
                  fontWeight: "800",
                  fontSize: "13px",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <User size={15} /> {currentUser ? `My Account (${currentUser.fullName ? currentUser.fullName.split(" ")[0] : "User"})` : "Sign In / Create Account"}
              </Link>
              <a
                href={`tel:${BRAND_INFO.hotlinePrimary}`}
                style={{
                  background: "#ec2226",
                  color: "#ffffff",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  textAlign: "center",
                  fontWeight: "800",
                  fontSize: "13px",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Phone size={15} /> Call Hotline: {siteSettings.footer_phone ? siteSettings.footer_phone.split(",")[0].trim() : (siteSettings.primary_phone || BRAND_INFO.hotlinePrimary)}
              </a>
              <Link
                to="/showrooms"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ color: "#ffffff", fontSize: "13px", textDecoration: "none", textAlign: "center", fontWeight: "600" }}
              >
                Showroom: 752/2 West Shewrapara, Mirpur, Dhaka
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
