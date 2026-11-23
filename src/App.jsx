import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Lenis from "lenis";
import KingletHeaderClone from "./components/Header/KingletHeaderClone";
import KingletFooterClone from "./components/Footer/KingletFooterClone";
import KingletFloatingIconsClone from "./components/FloatingConcierge/KingletFloatingIconsClone";
import KingletMobileBottomNav from "./components/Header/KingletMobileBottomNav";
import KingletCookieConsentClone from "./components/Consultation/KingletCookieConsentClone";
import KingletCartDrawer from "./components/Cart/KingletCartDrawer";
import KingletWishlistDrawer from "./components/Wishlist/KingletWishlistDrawer";
import KingletCompareDrawer from "./components/Compare/KingletCompareDrawer";
import KingletProductModal from "./components/Products/KingletProductModal";
import KingletCursor from "./components/Cursor/KingletCursor";
import KingletEmiModal from "./components/Finance/KingletEmiModal";
import KingletShowroomBookingModal from "./components/Showrooms/KingletShowroomBookingModal";
import KingletCustomDimensionsModal from "./components/Consultation/KingletCustomDimensionsModal";
import KingletScrollWaveController from "./components/Common/KingletScrollWaveController";
import ErrorBoundary from "./components/Common/ErrorBoundary";
import { getCurrentUser, apiGetCustomerWishlist, apiSyncCustomerWishlist } from "./utils/accountService";

// Admin Management Portal
import AdminLayout from "./pages/admin/AdminLayout";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardOverview from "./pages/admin/AdminDashboardOverview";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminContentPage from "./pages/admin/AdminContentPage";
import AdminInventoryPage from "./pages/admin/AdminInventoryPage";
import AdminCouponsPage from "./pages/admin/AdminCouponsPage";
import AdminSeoPage from "./pages/admin/AdminSeoPage";

// Pages (HomePage eagerly loaded for instant LCP, secondary routes code-split)
import HomePage from "./pages/HomePage";
const CategoryPage = React.lazy(() => import("./pages/CategoryPage"));
const ProductDetailPage = React.lazy(() => import("./pages/ProductDetailPage"));
const CartPage = React.lazy(() => import("./pages/CartPage"));
const CheckoutPage = React.lazy(() => import("./pages/CheckoutPage"));
const OrderConfirmationPage = React.lazy(() => import("./pages/OrderConfirmationPage"));
const ShowroomsPage = React.lazy(() => import("./pages/ShowroomsPage"));
const OffersPage = React.lazy(() => import("./pages/OffersPage"));
const FlashSalePage = React.lazy(() => import("./pages/FlashSalePage"));
const InteriorPage = React.lazy(() => import("./pages/InteriorPage"));
const TrackOrderPage = React.lazy(() => import("./pages/TrackOrderPage"));
const WarrantyCarePage = React.lazy(() => import("./pages/WarrantyCarePage"));
const KingletInfoPage = React.lazy(() => import("./pages/KingletInfoPage"));
const AccountPage = React.lazy(() => import("./pages/AccountPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));

import { PRODUCTS } from "./data/kingletData";

// Helper component to auto-scroll to top when route changes
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, search]);
  return null;
}

// Layout wrapper to ensure inner pages have top padding so fixed navbar never collides with breadcrumbs
function AppContent({ children }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isHomePage = location.pathname === "/" || location.pathname === "";
  const isCategoryPage = location.pathname.startsWith("/category");
  const isInteriorPage = location.pathname.startsWith("/interior");
  const isFlashSalePage = location.pathname.startsWith("/flash-sale");

  // Pages with full-bleed atmospheric hero banners start right at browser top: 0
  const hasFullBleedHero = isHomePage || isCategoryPage || isInteriorPage || isFlashSalePage || isAdmin;

  return (
    <main
      style={{
        flexGrow: 1,
        paddingTop: hasFullBleedHero ? "0px" : "125px",
        transition: "padding-top 0.25s ease",
      }}
    >
      {children}
    </main>
  );
}

function AppInner() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const [cartItems, setCartItems] = useState([
    { ...PRODUCTS[0], quantity: 1, selectedWood: PRODUCTS[0].woodType, selectedSize: "King Size (6.5 ft x 6.0 ft)" },
  ]);
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const savedItems = localStorage.getItem("kinglet_wishlist_items");
      if (savedItems) {
        const parsed = JSON.parse(savedItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((p) => p && (p.id || p.id === 0) && (p.name || p.title));
        }
      }
      // Backward compatibility with legacy stored IDs
      const savedIds = localStorage.getItem("kinglet_wishlist_ids");
      if (savedIds) {
        const parsedIds = JSON.parse(savedIds);
        if (Array.isArray(parsedIds)) {
          return parsedIds
            .map((id) => PRODUCTS.find((p) => String(p.id) === String(id)))
            .filter(Boolean);
        }
      }
    } catch {
      // fallback
    }
    return [];
  });
  const [compareItems, setCompareItems] = useState([PRODUCTS[0], PRODUCTS[1]]);
  const [siteSettings, setSiteSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kinglet_site_settings") || "{}");
    } catch {
      return {};
    }
  });
  const [announcementDismissed, setAnnouncementDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("kinglet_announcement_dismissed") === "true";
    } catch {
      return false;
    }
  });

  // Listen for real-time site settings updates from Admin or other tabs
  useEffect(() => {
    const handleUpdate = (e) => {
      if (e?.detail) setSiteSettings(e.detail);
    };
    const handleStorage = (e) => {
      if (e.key === "kinglet_site_settings" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSiteSettings(parsed);
        } catch {}
      }
    };
    window.addEventListener("kinglet_settings_updated", handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("kinglet_settings_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Synchronize dynamic browser title from General Settings
  useEffect(() => {
    const title = siteSettings?.home_page_title || siteSettings?.site_title || siteSettings?.title;
    if (title && !isAdmin) {
      document.title = title;
    }
  }, [siteSettings?.home_page_title, siteSettings?.site_title, siteSettings?.title, isAdmin]);

  // Synchronize dynamic Custom CSS from Admin Panel
  useEffect(() => {
    let styleEl = document.getElementById("kinglet-custom-css");
    if (siteSettings?.custom_css) {
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "kinglet-custom-css";
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = siteSettings.custom_css;
    } else if (styleEl) {
      styleEl.innerHTML = "";
    }
  }, [siteSettings?.custom_css]);

  // Synchronize dynamic SEO Meta tags and Favicon
  useEffect(() => {
    if (siteSettings?.meta_description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = siteSettings.meta_description;
    }
    if (siteSettings?.meta_keywords) {
      let metaKw = document.querySelector('meta[name="keywords"]');
      if (!metaKw) {
        metaKw = document.createElement("meta");
        metaKw.name = "keywords";
        document.head.appendChild(metaKw);
      }
      metaKw.content = siteSettings.meta_keywords;
    }
    if (siteSettings?.favicon) {
      let linkFavicon = document.querySelector('link[rel="icon"]');
      if (!linkFavicon) {
        linkFavicon = document.createElement("link");
        linkFavicon.rel = "icon";
        document.head.appendChild(linkFavicon);
      }
      const rawFav = siteSettings.favicon;
      linkFavicon.href = rawFav.startsWith("http") || rawFav.startsWith("/") ? rawFav : `/storage/images/${rawFav}`;
    }
  }, [siteSettings?.meta_description, siteSettings?.meta_keywords, siteSettings?.favicon]);

  // Feature Visibility toggles managed via Admin -> Visibility
  const featureVisibility = useMemo(() => {
    try {
      if (siteSettings?.site_feature_visibility) {
        const raw = siteSettings.site_feature_visibility;
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (parsed && typeof parsed === "object") {
          return {
            enableWishlist: parsed.enableWishlist !== false,
            enableCompare: parsed.enableCompare !== false,
            enableFloatingWhatsApp: parsed.enableFloatingWhatsApp !== false,
            enableEmiModal: parsed.enableEmiModal !== false,
            enableCustomerReviews: parsed.enableCustomerReviews !== false,
            enableCustomSizingModal: parsed.enableCustomSizingModal !== false,
            enableQuickView: parsed.enableQuickView !== false,
          };
        }
      }
    } catch {}
    return {
      enableWishlist: true,
      enableCompare: true,
      enableFloatingWhatsApp: true,
      enableEmiModal: true,
      enableCustomerReviews: true,
      enableCustomSizingModal: true,
      enableQuickView: true,
    };
  }, [siteSettings?.site_feature_visibility]);

  // Initial cloud wishlist fetch for logged-in customer
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      apiGetCustomerWishlist().then((cloudItems) => {
        if (Array.isArray(cloudItems) && cloudItems.length > 0) {
          setWishlistItems((prev) => {
            const map = new Map();
            prev.forEach((item) => map.set(String(item.id || item.slug), item));
            cloudItems.forEach((item) => map.set(String(item.id || item.slug), item));
            return Array.from(map.values());
          });
        }
      }).catch(() => {});
    }
  }, []);

  // Dynamic SEO Verification, Settings Sync & Google Analytics Tag Injection
  useEffect(() => {
    fetch("/api/v1/cms/settings")
      .then((res) => res.json())
      .then((json) => {
        if (!json?.success || !json?.data) return;
        setSiteSettings(json.data);
        try {
          localStorage.setItem("kinglet_site_settings", JSON.stringify(json.data));
          window.dispatchEvent(new CustomEvent("kinglet_settings_updated", { detail: json.data }));
        } catch {}

        const { google_search_console_tag, google_analytics_id } = json.data;

        // 1. Google Search Console Verification Meta Tag
        if (google_search_console_tag && typeof google_search_console_tag === "string") {
          let token = google_search_console_tag.trim();
          const match = token.match(/content=["'](.*?)["']/);
          if (match) token = match[1];

          if (token) {
            let meta = document.querySelector('meta[name="google-site-verification"]');
            if (!meta) {
              meta = document.createElement("meta");
              meta.name = "google-site-verification";
              document.head.appendChild(meta);
            }
            meta.content = token;
          }
        }

        // 2. Google Analytics 4 (GA4) Global Site Tag
        if (google_analytics_id && typeof google_analytics_id === "string") {
          const gaId = google_analytics_id.trim();
          if (gaId && !document.getElementById("kinglet-ga4-script")) {
            const gaScript = document.createElement("script");
            gaScript.id = "kinglet-ga4-script";
            gaScript.async = true;
            gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
            document.head.appendChild(gaScript);

            const inlineScript = document.createElement("script");
            inlineScript.id = "kinglet-ga4-inline";
            inlineScript.innerHTML = `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { send_page_view: true });
            `;
            document.head.appendChild(inlineScript);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("kinglet_wishlist_items", JSON.stringify(wishlistItems));
      localStorage.setItem("kinglet_wishlist_ids", JSON.stringify(wishlistItems.map((p) => p.id)));
    } catch {
      // non-blocking
    }
    const user = getCurrentUser();
    if (user && wishlistItems.length > 0) {
      const timer = setTimeout(() => {
        apiSyncCustomerWishlist(wishlistItems).catch(() => {});
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [wishlistItems]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [emiProduct, setEmiProduct] = useState(null);
  const [isShowroomModalOpen, setIsShowroomModalOpen] = useState(false);
  const [customSizingProduct, setCustomSizingProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Initialize Responsive Ultra-Smooth Lenis Scroll
  useEffect(() => {
    if (isAdmin) return; // Native desktop scroll behavior for admin data tables

    const lenis = new Lenis({
      duration: 0.75,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.2,
    });

    let rafId = null;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [isAdmin]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add to Cart
  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 1) + (product.quantity || 1) }
            : item
        );
      }
      return [...prev, { ...product, quantity: product.quantity || 1 }];
    });
    showToast(`Added "${product.name}" to your Cart!`);
    if (quickViewProduct) setQuickViewProduct(null);
  };

  const handleUpdateQuantity = (productId, newQty) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Wishlist Handlers (Supports both object and direct ID)
  const handleToggleWishlist = (productOrId) => {
    if (!productOrId) return;
    const isObj = typeof productOrId === "object" && productOrId !== null;
    const targetId = isObj ? productOrId.id : productOrId;
    const targetObj = isObj
      ? productOrId
      : (wishlistItems.find((p) => String(p.id) === String(targetId)) || PRODUCTS.find((p) => String(p.id) === String(targetId)));
    const targetName = targetObj?.name || "Product";

    setWishlistItems((prev) => {
      const exists = prev.some((p) => String(p.id) === String(targetId) || (targetObj?.slug && p.slug === targetObj.slug));
      if (exists) {
        showToast(targetName ? `Removed "${targetName}" from Wishlist.` : "Removed piece from Wishlist.");
        return prev.filter((p) => String(p.id) !== String(targetId) && !(targetObj?.slug && p.slug === targetObj.slug));
      }
      if (targetObj) {
        showToast(targetName ? `Saved "${targetName}" to Wishlist!` : "Saved to Wishlist!");
        return [...prev, targetObj];
      }
      return prev;
    });
  };

  const handleRemoveFromWishlist = (productOrId) => {
    if (!productOrId) return;
    const isObj = typeof productOrId === "object" && productOrId !== null;
    const targetId = isObj ? productOrId.id : productOrId;
    const targetObj = isObj
      ? productOrId
      : (wishlistItems.find((p) => String(p.id) === String(targetId)) || PRODUCTS.find((p) => String(p.id) === String(targetId)));
    const targetName = targetObj?.name || "Piece";

    setWishlistItems((prev) => prev.filter((p) => String(p.id) !== String(targetId) && !(targetObj?.slug && p.slug === targetObj.slug)));
    showToast(targetName ? `Removed "${targetName}" from Wishlist.` : "Removed piece from Wishlist.");
  };

  // Compare Handlers (Supports both object and direct ID)
  const handleToggleCompare = (productOrId) => {
    const isObj = typeof productOrId === "object" && productOrId !== null;
    const targetId = isObj ? productOrId.id : productOrId;
    const targetObj = isObj ? productOrId : PRODUCTS.find((p) => String(p.id) === String(targetId));

    setCompareItems((prev) => {
      const exists = prev.some((p) => String(p.id) === String(targetId) || (targetObj?.slug && p.slug === targetObj.slug));
      if (exists) {
        showToast(targetObj ? `Removed "${targetObj.name}" from Compare.` : "Removed from Compare.");
        return prev.filter((p) => String(p.id) !== String(targetId) && !(targetObj?.slug && p.slug === targetObj.slug));
      }
      if (prev.length >= 4) {
        showToast("Maximum 4 models can be compared at once.");
        return prev;
      }
      if (targetObj) {
        showToast(`Added "${targetObj.name}" to Compare!`);
        return [...prev, targetObj];
      }
      return prev;
    });
  };

  const handleRemoveFromCompare = (productOrId) => {
    const isObj = typeof productOrId === "object" && productOrId !== null;
    const targetId = isObj ? productOrId.id : productOrId;
    const targetObj = isObj ? productOrId : PRODUCTS.find((p) => String(p.id) === String(targetId));

    setCompareItems((prev) => prev.filter((p) => String(p.id) !== String(targetId) && !(targetObj?.slug && p.slug === targetObj.slug)));
    showToast(targetObj ? `Removed "${targetObj.name}" from Compare.` : "Removed piece from Comparison.");
  };

  const wishlistIds = wishlistItems.map((p) => p.id);
  const wishlistProducts = wishlistItems;
  const wishlistCount = wishlistItems.length;

  if (!isAdmin && siteSettings.maintenance_mode_enabled === "true") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0d14", color: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: "560px", background: "#111827", border: "1px solid #1f2937", borderRadius: "16px", padding: "40px 32px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🚧</div>
          <span style={{ display: "inline-block", background: "#ef4444", color: "#fff", fontSize: "11px", fontWeight: 800, padding: "4px 12px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>
            Scheduled System Upgrade
          </span>
          <h1 style={{ fontSize: "26px", fontWeight: 900, margin: "0 0 12px", color: "#ffffff" }}>
            {siteSettings.maintenance_mode_title || "Kinglet Craftsmanship Under Maintenance"}
          </h1>
          <p style={{ fontSize: "14px", color: "#9ca3af", lineHeight: 1.6, margin: "0 0 24px" }}>
            {siteSettings.maintenance_mode_message || "We are currently optimizing our timber manufacturing inventory, custom dimension engine, and showroom reservations. We will be back online shortly."}
          </p>
          <div style={{ background: "#1f2937", padding: "16px", borderRadius: "10px", fontSize: "13px", color: "#d1d5db", marginBottom: "24px" }}>
            <div>📞 Direct Concierge: <strong style={{ color: "#ef4444" }}>{siteSettings.primary_phone || "+8801676900442"}</strong></div>
            <div style={{ marginTop: "4px", fontSize: "12px", color: "#9ca3af" }}>📍 Mirpur Showroom: {siteSettings.showroom_address || "752/2 West Shewrapara, Mirpur, Dhaka"}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            <a
              href="/admin/login"
              style={{ fontSize: "12px", color: "#64748b", textDecoration: "underline" }}
            >
              Admin Portal Access →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      {/* Dynamic Bidirectional Scroll Wave Float Controller */}
      {!isAdmin && <KingletScrollWaveController />}
      {/* Luxury Custom Cursor Animation */}
      {!isAdmin && <KingletCursor />}

      <div style={{ minHeight: "100vh", background: isAdmin ? "#f8fafc" : "#ffffff", color: "#333333", display: "flex", flexDirection: "column" }}>
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: "fixed",
              bottom: "90px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(10, 10, 10, 0.95)",
              border: "1px solid rgba(236, 34, 38, 0.4)",
              backdropFilter: "blur(12px)",
              color: "#ffffff",
              padding: "10px 22px",
              borderRadius: "30px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              zIndex: 99999,
              fontSize: "13px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ color: "#ec2226" }}>●</span> {toastMessage}
          </div>
        )}

        {/* Master Customer Menubar - Hidden on Admin */}
        {!isAdmin && (
          <KingletHeaderClone
            cartCount={cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)}
            wishlistCount={wishlistCount}
            compareCount={compareItems.length}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenWishlist={() => setIsWishlistOpen(true)}
            onOpenCompare={() => setIsCompareOpen(true)}
          />
        )}

        {/* Maintenance Mode Overlay when enabled by Admin */}
        {siteSettings.maintenance_mode_enabled === "true" && !isAdmin && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999999,
              background: "#080c14",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: "560px" }}>
              <div style={{ fontSize: "52px", marginBottom: "16px" }}>👑</div>
              <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px", letterSpacing: "-0.5px" }}>
                Under Scheduled Upgrades
              </h1>
              <p style={{ fontSize: "15px", color: "#94a3b8", lineHeight: 1.6, marginBottom: "24px" }}>
                {siteSettings.maintenance_message || "We are currently upgrading Kinglet's timber catalog and online showroom. We will be back online shortly. For urgent inquiries, call: +8801676900442."}
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <a
                  href={`tel:${siteSettings.primary_phone || "+8801676900442"}`}
                  style={{
                    padding: "10px 20px",
                    background: "#ec2226",
                    color: "#fff",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                >
                  📞 Call Hotline: {siteSettings.primary_phone || "+8801676900442"}
                </a>
                <a
                  href="/admin"
                  style={{
                    padding: "10px 20px",
                    background: "#1e293b",
                    color: "#cbd5e1",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  Admin Login →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Page Routing */}
        <AppContent>
          <ErrorBoundary>
            <React.Suspense fallback={<div style={{ minHeight: "60vh", background: "#fcfbf9" }} />}>
              <Routes>
              {/* ADMIN MANAGEMENT PORTAL ROUTES */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardOverview />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="inventory" element={<AdminInventoryPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="coupons" element={<AdminCouponsPage />} />
                <Route path="seo" element={<AdminSeoPage />} />
                <Route path="content" element={<AdminContentPage />} />
                {/* Dedicated Aliases matching kingletbd.com/admin */}
                <Route path="transactions" element={<AdminOrdersPage />} />
                <Route path="customers" element={<AdminOrdersPage />} />
                <Route path="tickets" element={<AdminOrdersPage />} />
                <Route path="users" element={<AdminOrdersPage />} />
                <Route path="attributes" element={<AdminProductsPage />} />
                <Route path="features" element={<AdminContentPage />} />
                <Route path="shipping" element={<AdminContentPage />} />
                <Route path="sliders" element={<AdminContentPage />} />
                <Route path="settings" element={<AdminContentPage />} />
                <Route path="faqs" element={<AdminContentPage />} />
                <Route path="blogs" element={<AdminContentPage />} />
                <Route path="pages" element={<AdminContentPage />} />
                <Route path="subscribers" element={<AdminContentPage />} />
                <Route path="backup" element={<AdminContentPage />} />
              </Route>

              {/* CUSTOMER STOREFRONT ROUTES */}
              <Route
                path="/"
                element={
                  <HomePage
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    onToggleCompare={handleToggleCompare}
                    wishlistIds={wishlistIds}
                    onQuickView={(p) => setQuickViewProduct(p)}
                    onOpenEmi={(p) => setEmiProduct(p)}
                    onOpenShowroomModal={() => setIsShowroomModalOpen(true)}
                    onOpenCustomSizing={(p) => setCustomSizingProduct(p)}
                  />
                }
              />

              <Route
                path="/category/:slug"
                element={
                  <CategoryPage
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    onToggleCompare={handleToggleCompare}
                    wishlistIds={wishlistIds}
                    onQuickView={(p) => setQuickViewProduct(p)}
                    onOpenEmi={(p) => setEmiProduct(p)}
                    onOpenCustomSizing={(p) => setCustomSizingProduct(p)}
                  />
                }
              />

              <Route
                path="/product/:slug"
                element={
                  <ProductDetailPage
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    onToggleCompare={handleToggleCompare}
                    wishlistIds={wishlistIds}
                    isWishlisted={(idOrProd) => {
                      const pid = typeof idOrProd === "object" ? idOrProd?.id : idOrProd;
                      const pslug = typeof idOrProd === "object" ? idOrProd?.slug : null;
                      return wishlistItems.some((wi) => String(wi.id) === String(pid) || (pslug && wi.slug === pslug));
                    }}
                    compareItems={compareItems}
                    isCompared={(idOrProd) => {
                      const pid = typeof idOrProd === "object" ? idOrProd?.id : idOrProd;
                      const pslug = typeof idOrProd === "object" ? idOrProd?.slug : null;
                      return compareItems.some((ci) => String(ci.id) === String(pid) || (pslug && ci.slug === pslug));
                    }}
                    onOpenEmi={(p) => setEmiProduct(p)}
                    onOpenCustomSizing={(p) => setCustomSizingProduct(p)}
                  />
                }
              />

              <Route
                path="/cart"
                element={
                  <CartPage
                    cartItems={cartItems}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                  />
                }
              />

              <Route
                path="/checkout"
                element={
                  <CheckoutPage
                    cartItems={cartItems}
                    onClearCart={handleClearCart}
                  />
                }
              />

              {/* Dedicated Order & Payment Confirmation */}
              <Route
                path="/order-confirmation/:orderNumber"
                element={<OrderConfirmationPage />}
              />

              {/* Physical Showrooms & Factory Outlets */}
              <Route path="/showrooms" element={<ShowroomsPage />} />

              {/* Special Offers & Exclusive Discounts */}
              <Route
                path="/offers"
                element={
                  <OffersPage
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    wishlistIds={wishlistIds}
                    onQuickView={(p) => setQuickViewProduct(p)}
                    onOpenEmi={(p) => setEmiProduct(p)}
                    onOpenCustomSizing={(p) => setCustomSizingProduct(p)}
                  />
                }
              />

              {/* Flash Sale Event Page */}
              <Route
                path="/flash-sale"
                element={
                  <FlashSalePage
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    wishlistIds={wishlistIds}
                    onQuickView={(p) => setQuickViewProduct(p)}
                    onOpenEmi={(p) => setEmiProduct(p)}
                    onOpenCustomSizing={(p) => setCustomSizingProduct(p)}
                  />
                }
              />

              {/* Turnkey Interior Design Studio */}
              <Route path="/interior" element={<InteriorPage />} />

              {/* Live Order Tracker */}
              <Route path="/track-order" element={<TrackOrderPage />} />

              {/* Warranty & Timber Care */}
              <Route path="/warranty-care" element={<WarrantyCarePage />} />

              {/* Authentic Kinglet Information Pages from kingletbd.com */}
              <Route path="/faq" element={<KingletInfoPage />} />
              <Route path="/about-us" element={<KingletInfoPage />} />
              <Route path="/privacy-policy" element={<KingletInfoPage />} />
              <Route path="/warranty-terms" element={<KingletInfoPage />} />
              <Route path="/exchange-return" element={<KingletInfoPage />} />
              <Route path="/delivery" element={<KingletInfoPage />} />
              <Route path="/care-maintenance" element={<KingletInfoPage />} />
              <Route path="/contact" element={<KingletInfoPage />} />
              
              {/* User Account, Registration & Live Tracking Hub */}
              <Route path="/account" element={<AccountPage />} />
              <Route path="/register" element={<AccountPage />} />
              <Route path="/login" element={<AccountPage />} />

              {/* Branded 404 Not Found Page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </React.Suspense>
        </ErrorBoundary>
      </AppContent>

        {/* Customer Global Elements - Hidden on Admin */}
        {!isAdmin && (
          <>
            <KingletFooterClone />
            {featureVisibility.enableFloatingWhatsApp !== false && <KingletFloatingIconsClone />}
            <KingletMobileBottomNav
              cartCount={cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)}
              wishlistCount={wishlistCount}
              onOpenCart={() => setIsCartOpen(true)}
              onOpenWishlist={() => setIsWishlistOpen(true)}
            />
            <KingletCookieConsentClone />
            <KingletCartDrawer
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
            {featureVisibility.enableWishlist !== false && (
              <KingletWishlistDrawer
                isOpen={isWishlistOpen}
                onClose={() => setIsWishlistOpen(false)}
                wishlistProducts={wishlistProducts}
                onAddToCart={handleAddToCart}
                onRemoveFromWishlist={handleRemoveFromWishlist}
                onRemoveItem={handleRemoveFromWishlist}
              />
            )}
            {featureVisibility.enableCompare !== false && (
              <KingletCompareDrawer
                isOpen={isCompareOpen}
                onClose={() => setIsCompareOpen(false)}
                compareItems={compareItems}
                onToggleCompare={handleToggleCompare}
                onRemoveFromCompare={handleRemoveFromCompare}
                onRemoveItem={handleRemoveFromCompare}
                onAddToCart={handleAddToCart}
              />
            )}
            {featureVisibility.enableQuickView !== false && quickViewProduct && (
              <KingletProductModal
                product={quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                isWishlisted={wishlistIds.some((wid) => String(wid) === String(quickViewProduct.id))}
                onToggleCompare={handleToggleCompare}
                isCompared={compareItems.some((ci) => String(ci.id) === String(quickViewProduct.id))}
                onOpenEmi={(p) => setEmiProduct(p || quickViewProduct)}
                onOpenCustomSizing={(p) => setCustomSizingProduct(p || quickViewProduct)}
              />
            )}
            {featureVisibility.enableEmiModal !== false && emiProduct && (
              <KingletEmiModal
                product={emiProduct}
                onClose={() => setEmiProduct(null)}
              />
            )}
            {isShowroomModalOpen && (
              <KingletShowroomBookingModal
                onClose={() => setIsShowroomModalOpen(false)}
              />
            )}
            {featureVisibility.enableCustomSizingModal !== false && customSizingProduct && (
              <KingletCustomDimensionsModal
                product={customSizingProduct}
                onClose={() => setCustomSizingProduct(null)}
              />
            )}

            {/* Dynamic Storefront Announcement */}
            {siteSettings.announcement_enabled === "true" && !announcementDismissed && !isAdmin && (
              <div
                style={{
                  position: "fixed",
                  bottom: "24px",
                  left: "24px",
                  zIndex: 9999,
                  maxWidth: "420px",
                  background: "#0f172a",
                  color: "#ffffff",
                  borderRadius: "12px",
                  padding: "18px 20px",
                  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)",
                  border: "1px solid #334155",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px" }}>🔔</span>
                    <strong style={{ fontSize: "14px", fontWeight: 800, color: "#f8fafc" }}>
                      {siteSettings.announcement_title || "Special VIP Announcement"}
                    </strong>
                  </div>
                  <button
                    onClick={() => {
                      setAnnouncementDismissed(true);
                      try { sessionStorage.setItem("kinglet_announcement_dismissed", "true"); } catch {}
                    }}
                    style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "16px", cursor: "pointer", padding: "0 4px" }}
                    title="Dismiss announcement"
                  >
                    ✕
                  </button>
                </div>
                <p style={{ fontSize: "12.5px", color: "#cbd5e1", lineHeight: 1.5, margin: "0 0 14px" }}>
                  {siteSettings.announcement_message || "Exclusive VIP discount on Seasoned Mahogany Bedroom Suites."}
                </p>
                {siteSettings.announcement_link && (
                  <a
                    href={siteSettings.announcement_link}
                    style={{ display: "inline-block", background: "#ec2226", color: "#ffffff", fontSize: "12px", fontWeight: 700, padding: "6px 14px", borderRadius: "6px", textDecoration: "none" }}
                  >
                    {siteSettings.announcement_btn_text || "Learn More →"}
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}
