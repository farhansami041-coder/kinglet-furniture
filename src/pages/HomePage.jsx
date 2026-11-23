import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Star,
  BedDouble,
  Sofa,
  UtensilsCrossed,
  Baby,
  CookingPot,
  DoorClosed,
  Paintbrush,
  Briefcase,
  Table as TableIcon,
  ArrowRight,
} from "lucide-react";
import KingletHeroSliderClone from "../components/Hero/KingletHeroSliderClone";
import KingletBorderlessShowcase from "../components/Hero/KingletBorderlessShowcase";
import KingletFlashSaleBanner from "../components/Hero/KingletFlashSaleBanner";
import KingletNewArrivalsSection from "../components/Products/KingletNewArrivalsSection";
import KingletMidBannerClone from "../components/Hero/KingletMidBannerClone";
import KingletFeaturesStripClone from "../components/Craftsmanship/KingletFeaturesStripClone";
import KingletOurClients from "../components/Clients/KingletOurClients";
import KingletPoshProductCard from "../components/Products/KingletPoshProductCard";
import KingletSectionHeader from "../components/Common/KingletSectionHeader";
import KingletVerifiedReviews from "../components/Reviews/KingletVerifiedReviews";
import KingletSEO from "../components/Common/KingletSEO";
import KingletSEOAuthorityBlock from "../components/Common/KingletSEOAuthorityBlock";
import { PRODUCTS, NAV_CATEGORIES } from "../data/kingletData";
import { productService } from "../utils/productService";

const QUICK_CATEGORY_ICONS = {
  bedroom: BedDouble,
  "living-room": Sofa,
  dining: UtensilsCrossed,
  "kids-room": Baby,
  kitchen: CookingPot,
  door: DoorClosed,
  interior: Paintbrush,
  office: Briefcase,
  table: TableIcon,
};

const QUICK_CATEGORY_SUBTITLES = {
  bedroom: "Luxury Suites",
  "living-room": "Living Sets",
  dining: "Dining Tables",
  "kids-room": "Kids' Comfort",
  kitchen: "Modular Kitchen",
  door: "Solid Timber",
  interior: "3D Studio",
  office: "Executive",
  table: "Fine Tables",
};

export default function HomePage({
  onAddToCart,
  onToggleWishlist,
  onToggleCompare,
  wishlistIds = [],
  onQuickView,
  onOpenEmi,
  _onOpenShowrooms,
  onOpenCustomSizing,
}) {
  const [liveProducts, setLiveProducts] = useState(PRODUCTS);
  const [siteSettings, setSiteSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kinglet_site_settings") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleSettingsUpdate = (e) => {
      if (e?.detail) setSiteSettings(e.detail);
    };
    window.addEventListener("kinglet_settings_updated", handleSettingsUpdate);
    return () => window.removeEventListener("kinglet_settings_updated", handleSettingsUpdate);
  }, []);

  const homeSections = useMemo(() => {
    try {
      if (siteSettings?.home_page_sections) {
        const raw = siteSettings.home_page_sections;
        return typeof raw === "string" ? JSON.parse(raw) : raw;
      }
    } catch {}
    return {
      showHeroSlider: true,
      showQuickCategories: true,
      showNewArrivals: true,
      showBorderlessShowcase: true,
      showWinterSale: true,
      showAuthorityBlock: true,
    };
  }, [siteSettings?.home_page_sections]);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveProducts = () => {
      productService.getProducts({ limit: 250 }).then((res) => {
        if (isMounted && res.products && res.products.length > 0) {
          setLiveProducts(res.products);
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

  // Curate Winter Flash Sale & Offer products directly from admin isOffer selection
  const flashSaleItems = useMemo(() => {
    const markedOffers = liveProducts.filter((p) => Boolean(p.isOffer));
    return markedOffers.length > 0 ? markedOffers.slice(0, 8) : [];
  }, [liveProducts]);

  // Curate New Arrivals directly from admin isNewArrival selection
  const newArrivalProducts = useMemo(() => {
    const marked = liveProducts.filter((p) => p.isNewArrival);
    return marked.length > 0 ? marked : liveProducts;
  }, [liveProducts]);

  // Curate 8 showroom classics directly from admin isShowroomClassic selection
  const showroomClassicItems = useMemo(() => {
    const markedShowroom = liveProducts.filter((p) => p.isShowroomClassic);
    if (markedShowroom.length >= 8) return markedShowroom.slice(0, 8);
    const remaining = liveProducts.filter((p) => !markedShowroom.some((m) => m.id === p.id));
    return [...markedShowroom, ...remaining].slice(0, 8);
  }, [liveProducts]);

  return (
    <div className="home-page" style={{ background: "#ffffff" }}>
      {/* Search Engine Optimization (SEO) Master Metadata */}
      <KingletSEO
        title="Leading Seasoned Mahogany Furniture Brand in Bangladesh | Kinglet Furniture Ltd"
        description="Shop 100% genuine kiln-seasoned Mahogany bedroom suites, luxury sofas, 6-seater dining tables & turnkey 3D interior design in Bangladesh. 10-Year Timber Guarantee & nationwide delivery."
        keywords="Kinglet, Kinglet Bangladesh, Kinglet Furniture, Mahogany Furniture BD, Black Plum Wood, Oak Veneer, Seasoned Mahogany Khat, Mahogany Wood Bed Price in Bangladesh, Luxury Sofa Set Dhaka, Dining Table Price in BD, Best Furniture Store Bangladesh, HATIL vs Kinglet"
        canonicalUrl="https://www.kingletbd.com/"
      />

      {/* Semantic Top 1 Ranking Heading for Search Engine Crawlers & Screen Readers */}
      <h1
        className="sr-only"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        Kinglet Furniture &amp; Interior — Luxury Handcrafted Seasoned Mahogany, Black Plum Wood &amp; Oak Veneer Furniture Bangladesh
      </h1>

      {/* 1. Full-Bleed Borderless Hero Slider with Transparent Menubar sitting on top */}
      {homeSections.showHeroSlider !== false && <KingletHeroSliderClone />}

      {/* 2. Borderless 4-Card Visual Showcase (Matching bottom row of JMG Furniture screenshot) */}
      {homeSections.showBorderlessShowcase !== false && <KingletBorderlessShowcase />}

      {/* 3. Quick Category Navigation Bar - Luxury Dynamic Squircle Badges */}
      {homeSections.showQuickCategories !== false && (
        <section
          className="quick-category-section scroll-reveal"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            borderBottom: "1px solid #eef2f6",
            padding: "32px 0 28px",
          }}
        >
          <div className="container" style={{ maxWidth: "1440px", padding: "0 20px" }}>
            <div className="quick-category-grid">
              {NAV_CATEGORIES.map((cat, i) => {
                const IconComponent = QUICK_CATEGORY_ICONS[cat.id] || BedDouble;
                const subLabel = QUICK_CATEGORY_SUBTITLES[cat.id] || "Collection";

                return (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className={`quick-category-card stagger-${(i % 9) + 1}`}
                    title={`Explore ${cat.name} Collection`}
                  >
                    <div className="quick-cat-icon-squircle">
                      <IconComponent size={22} strokeWidth={2.1} />
                    </div>
                    <span className="quick-cat-title">{cat.name}</span>
                    <span className="quick-cat-subtitle">{subLabel}</span>
                    <div className="quick-cat-indicator" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. New Arrivals Section (Minimal Elegant Scandinavian Luxury with Category Filter Tabs) */}
      {homeSections.showNewArrivals !== false && (
        <KingletNewArrivalsSection
          products={newArrivalProducts}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          onToggleCompare={onToggleCompare}
          wishlistIds={wishlistIds}
          onQuickView={onQuickView}
          onOpenEmi={onOpenEmi}
          onOpenCustomSizing={onOpenCustomSizing}
        />
      )}

      {/* 4.5 Big Flash Sale & 15% OFF Motion Video Hero Banner */}
      {homeSections.showWinterSale !== false && (
        <>
          <KingletFlashSaleBanner />

          {/* 4.6 Winter Mega Flash Sale (Strictly 2 Rows of 4 Discounted Showcase Pieces) */}
          <section
            className="scroll-reveal"
            style={{
              padding: "60px 0 50px",
              background: "#ffffff",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div className="container" style={{ maxWidth: "1440px", padding: "0 20px" }}>
              <KingletSectionHeader
                title="WINTER MEGA FLASH SALE"
                subtitle="HOT SEASONAL OFFERS • UP TO 17% INSTANT SAVINGS"
                linkTo="/flash-sale"
                linkLabel="SEE MORE OFFERS"
              />

              <div className="kinglet-posh-4x4-grid">
                {flashSaleItems.map((p) => (
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
            </div>
          </section>
        </>
      )}



      {/* 6. Mid Promotional Banner */}
      <div className="scroll-reveal">
        <KingletMidBannerClone />
      </div>

      {/* 7. Trending Showroom Classics */}
      <section className="fproduct-area" style={{ padding: "55px 0" }}>
        <div className="container" style={{ maxWidth: "1440px", padding: "0 20px" }}>
          {/* JMG-style Section Header with red accent line */}
          <KingletSectionHeader
            title="TRENDING SHOWROOM CLASSICS"
            subtitle="Customer Favorites"
            linkTo="/category/all"
            linkLabel="SEE MORE CLASSICS"
          />

          <div className="kinglet-posh-4x4-grid">
            {showroomClassicItems.map((p) => (
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

          {/* Dynamic Center See More Button */}
          <div style={{ textAlign: "center", marginTop: "38px" }}>
            <Link
              to="/category/all"
              className="kinglet-dynamic-center-see-more"
              title="Explore all showroom classic products"
            >
              <span className="btn-shimmer-sweep" />
              <span>EXPLORE ALL SHOWROOM MODELS</span>
              <span className="btn-icon-bubble">
                <ArrowRight size={15} strokeWidth={2.6} />
              </span>
            </Link>
          </div>
        </div>
      </section>



      {/* 8. Comparison: Why Kinglet vs Traditional Brands */}
      <section className="scroll-reveal" style={{ background: "#f8f9fa", color: "#111827", padding: "60px 0", borderTop: "1px solid #f0f0f0" }}>
        <div className="container" style={{ maxWidth: "1400px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span style={{ color: "#ec2226", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>The Kinglet Distinction</span>
            <h2 style={{ fontSize: "30px", fontWeight: "900", margin: "6px 0 10px", letterSpacing: "-0.5px" }}>Why Bangladesh Chooses Kinglet Furniture</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", maxWidth: "600px", margin: "0 auto" }}>Direct factory pricing with zero retail middlemen markups.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              { title: "100% Solid Seasoned Timber", desc: "Authentic seasoned Mahogany with 10% moisture vacuum kiln drying." },
              { title: "Italian Automated PU Finishing", desc: "High-gloss 5-layer automated spray finish that resists hot spills and monsoon humidity." },
              { title: "Transparent Factory Pricing", desc: "Save up to 30% compared to traditional brand overheads with superior wood volume." },
              { title: "Nationwide Safe Delivery", desc: "Carefully packaged and safely delivered to your doorstep anywhere across Bangladesh." },
            ].map((box, i) => (
              <div key={i} className={`stagger-${i + 1}`} style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "24px", boxShadow: "0 4px 15px rgba(0,0,0,0.04)" }}>
                <div style={{ color: "#ec2226", marginBottom: "12px" }}><Check size={22} /></div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", margin: "0 0 8px" }}>{box.title}</h3>
                <p style={{ fontSize: "13px", color: "#4b5563", margin: 0, lineHeight: "1.6" }}>{box.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Super Dynamic Verified Customer Showroom Reviews */}
      <KingletVerifiedReviews />

      {/* 10. Our Prestigious Clients Marquee */}
      <KingletOurClients />

      {/* 11. 4-Pillar Features Strip */}
      <KingletFeaturesStripClone />

      {/* 12. Authority Furniture SEO Buyers Guide & Price Index (Google 1st Page Ranking Engine) */}
      {homeSections.showAuthorityBlock !== false && <KingletSEOAuthorityBlock />}
    </div>
  );
}
