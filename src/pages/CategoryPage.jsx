import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Star,
  ArrowUpDown,
  LayoutGrid,
  Grid3X3,
  Sparkles,
  X,
  Home,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  Layers,
  Crown,
  Utensils,
  Coffee,
  Tv,
  DoorOpen,
  Gem,
  Armchair,
  BedDouble,
  Bed,
  FolderArchive,
  Clock,
  Compass,
  Briefcase,
  Laptop,
} from "lucide-react";
import { PRODUCTS, NAV_CATEGORIES } from "../data/kingletData";
import { productService } from "../utils/productService";
import KingletPoshProductCard from "../components/Products/KingletPoshProductCard";
import KingletSEO from "../components/Common/KingletSEO";
import KingletSEOAuthorityBlock from "../components/Common/KingletSEOAuthorityBlock";

// Bespoke Furniture & Suite Iconography
const SUBCATEGORY_ICON_MAP = {
  all: Sparkles,
  "dining-table-set": Utensils,
  "dining-chair": Armchair,
  "dinner-wagon": Utensils,
  showcase: Gem,
  "mini-cabinet": Layers,
  "tea-trolley": Coffee,
  "bed-room-set": Crown,
  bed: BedDouble,
  almirah: FolderArchive,
  "dressing-table": Sparkles,
  wardrobe: FolderArchive,
  "chest-of-drawers": Layers,
  "bedside-table": Clock,
  "reading-table": Compass,
  mattress: Bed,
  "sofa-set": Armchair,
  divan: Armchair,
  "center-table": LayoutGrid,
  "tv-cabinet": Tv,
  "coffee-table": Coffee,
  "shoe-rack": Layers,
  "hanging-couch": Armchair,
  "dolona-cradle": Sparkles,
  corner: LayoutGrid,
  "kids-bunk-bed": BedDouble,
  "study-table": Compass,
  "study-chair": Armchair,
  "computer-table": Tv,
  islandcart: Utensils,
  "modular-kitchen": Layers,
  "solid-wooden-door": DoorOpen,
  "solid-engineered-wooden-door": DoorOpen,
  "solid-wooden-double-leaf-door": DoorOpen,
  "plain-veneered-flush-door": DoorOpen,
  "door-frame": Layers,
  "conference-table": Briefcase,
  "file-cabinet": FolderArchive,
  "office-chairs": Armchair,
  "file-rack": FolderArchive,
  shelves: Layers,
  chair: Armchair,
  lobby: Armchair,
  resident: Home,
  office: Briefcase,
  desks: Laptop,
  "side-table": Coffee,
};

// High-resolution atmospheric category scenic backgrounds
const CATEGORY_BACKGROUNDS = {
  bedroom: "https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=1600&q=80",
  "bed-room": "https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=1600&q=80",
  "living-room": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80",
  dining: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=80",
  "kids-room": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
  kitchen: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1600&q=80",
  door: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
  office: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=80",
  interior: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80",
  table: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1600&q=80",
  all: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80",
};

export default function CategoryPage({
  onAddToCart,
  onToggleWishlist,
  _onToggleCompare,
  wishlistIds = [],
  onQuickView,
  onOpenEmi,
  onOpenCustomSizing,
}) {
  const { slug, sub: paramSub, child: paramChild } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Support both path params (/category/:slug/:sub) and query params (?sub=...)
  const rawSub = paramSub || searchParams.get("sub") || "all";
  const rawChild = paramChild || searchParams.get("child") || "";
  const searchQueryParam = (searchParams.get("search") || searchParams.get("q") || "").trim();

  // Helper string normalizer
  const norm = (s) => (s || "").toLowerCase().replace(/[-\s]/g, "");

  // Find category details - with fallback matching for subcategories entered as category slug
  const categoryInfo = useMemo(() => {
    let found = NAV_CATEGORIES.find(
      (c) => norm(c.slug) === norm(slug) || norm(c.id) === norm(slug)
    );

    // If slug is not a category, check if it's a subcategory
    if (!found && slug && slug !== "all") {
      for (const c of NAV_CATEGORIES) {
        const hasSub = c.subcategories?.find(
          (s) => norm(s.slug) === norm(slug) || norm(s.name) === norm(slug)
        );
        if (hasSub) {
          found = c;
          break;
        }
      }
    }

    return (
      found || {
        name:
          slug === "all"
            ? "All Master Collections"
            : slug
            ? slug.replace(/-/g, " ").toUpperCase()
            : "Furniture Catalog",
        slug: slug || "all",
        description:
          "Handcrafted by master wood artisans using seasoned Mahogany, Black Plum Wood, Engineering Processed Wood, Canadian Oak Veneer, and German Oak Veneer with 7-layer Italian PU lacquer finish.",
        subcategories: [],
      }
    );
  }, [slug]);

  // Determine active subcategory (accounting for slug possibly being subcategory)
  const activeSubcategory = useMemo(() => {
    if (rawSub && rawSub !== "all") return rawSub;
    if (slug && slug !== "all") {
      const isSub = categoryInfo.subcategories?.find(
        (s) => norm(s.slug) === norm(slug) || norm(s.name) === norm(slug)
      );
      if (isSub) return isSub.slug;
    }
    return "all";
  }, [rawSub, slug, categoryInfo]);

  const activeChild = rawChild;

  // Find active subcategory object and labels
  const currentSubObj = useMemo(() => {
    if (!activeSubcategory || activeSubcategory === "all") return null;
    return categoryInfo.subcategories?.find(
      (s) => norm(s.slug) === norm(activeSubcategory) || norm(s.name) === norm(activeSubcategory)
    );
  }, [categoryInfo, activeSubcategory]);

  const currentSubTitle =
    currentSubObj?.name ||
    (activeSubcategory !== "all"
      ? activeSubcategory.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "");

  const currentChildTitle = activeChild ? decodeURIComponent(activeChild) : "";

  // Dynamic Page Heading based on search, subcategory or child selection
  const pageHeading = useMemo(() => {
    if (searchQueryParam) return `Search Results for "${searchQueryParam}"`;
    if (currentChildTitle) return currentChildTitle;
    if (currentSubTitle) return `${currentSubTitle} Collection`;
    return categoryInfo.name;
  }, [searchQueryParam, currentChildTitle, currentSubTitle, categoryInfo.name]);

  // Filter States
  const [selectedWood, setSelectedWood] = useState("all");
  const [priceRange, setPriceRange] = useState(500000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("featured");
  const [gridCols, setGridCols] = useState(4); // Default to 4 columns (4x4) as requested
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const subnavScrollRef = useRef(null);

  const handleSubnavScroll = (direction) => {
    if (subnavScrollRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      subnavScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const bgImage =
    CATEGORY_BACKGROUNDS[slug] ||
    CATEGORY_BACKGROUNDS[categoryInfo?.slug] ||
    CATEGORY_BACKGROUNDS[categoryInfo?.id] ||
    CATEGORY_BACKGROUNDS.all;

  // Helper: Match product to category
  const matchesCategory = (p) => {
    if (!slug || slug === "all") return true;
    const targetNorm = norm(categoryInfo.slug || slug);
    const catNorm = norm(p.category || p.categorySlug);
    const catLabelNorm = norm(p.categoryLabel);
    const subNorm = norm(p.subcategory || p.subcategorySlug);
    const subLabelNorm = norm(p.subcategoryLabel);

    if (catNorm === targetNorm || catLabelNorm === targetNorm) return true;
    if (subNorm === targetNorm || subLabelNorm === targetNorm) return true;
    if (targetNorm === "bedroom" && (catNorm === "bedroom" || catNorm === "bedroom" || catLabelNorm.includes("bedroom"))) return true;
    if (targetNorm === "livingroom" && (catNorm === "livingroom" || catLabelNorm.includes("living"))) return true;
    if (targetNorm === "kidsroom" && (catNorm === "kidsroom" || catLabelNorm.includes("kid"))) return true;
    if (targetNorm === "table" && (catNorm === "table" || catLabelNorm.includes("table") || subNorm.includes("table"))) return true;
    if (targetNorm === "interior" && (catNorm === "interior" || catLabelNorm.includes("interior"))) return true;
    if (targetNorm === "dining" && (catNorm === "dining" || catLabelNorm.includes("dining"))) return true;
    if (targetNorm === "door" && (catNorm === "door" || catLabelNorm.includes("door"))) return true;
    if (targetNorm === "office" && (catNorm === "office" || catLabelNorm.includes("office"))) return true;
    if (targetNorm === "kitchen" && (catNorm === "kitchen" || catLabelNorm.includes("kitchen"))) return true;

    // Check if categoryInfo subcategories match the product
    if (categoryInfo.subcategories && categoryInfo.subcategories.some(s => norm(s.slug) === subNorm || norm(s.slug) === catNorm)) {
      return true;
    }

    return false;
  };

  // Helper: Match product to subcategory strictly to prevent category conflicts
  const matchesSubcategory = (p, subSlug) => {
    if (!subSlug || subSlug === "all") return true;
    const subNorm = norm(subSlug);
    const pSubNorm = norm(p.subcategory || p.subcategorySlug);
    const pSubLabelNorm = norm(p.subcategoryLabel);

    // Exact subcategory matching
    if (pSubNorm === subNorm || pSubLabelNorm === subNorm) return true;

    // Strict subcategory alias checks (Never use loose substring matching like includes("bed"))
    if (subNorm === "bed") {
      return pSubNorm === "bed" || pSubLabelNorm === "bed";
    }
    if (subNorm === "dressingtable") {
      return pSubNorm === "dressingtable" || pSubLabelNorm === "dressingtable" || pSubNorm === "dressing-table";
    }
    if (subNorm === "almirah") {
      return pSubNorm === "almirah" || pSubLabelNorm === "almirah" || pSubNorm === "almira";
    }
    if (subNorm === "wardrobe") {
      return pSubNorm === "wardrobe" || pSubLabelNorm === "wardrobe";
    }
    if (subNorm === "bedsidetable") {
      return pSubNorm === "bedsidetable" || pSubLabelNorm === "bedsidetable" || pSubNorm === "bedside-table";
    }
    if (subNorm === "readingtable") {
      return pSubNorm === "readingtable" || pSubLabelNorm === "readingtable" || pSubNorm === "reading-table";
    }
    if (subNorm === "bedroomset") {
      return pSubNorm === "bedroomset" || pSubLabelNorm === "bedroomset" || pSubNorm === "bed-room-set";
    }
    if (subNorm === "sofaset") {
      return pSubNorm === "sofaset" || pSubLabelNorm === "sofaset" || pSubNorm === "sofa" || pSubNorm === "sofa-set";
    }
    if (subNorm === "centertable") {
      return pSubNorm === "centertable" || pSubLabelNorm === "centertable" || pSubNorm === "center-table";
    }
    if (subNorm === "tvcabinet") {
      return pSubNorm === "tvcabinet" || pSubLabelNorm === "tvcabinet" || pSubNorm === "tv-cabinet";
    }
    if (subNorm === "diningtableset") {
      return pSubNorm === "diningtableset" || pSubLabelNorm === "diningtableset" || pSubNorm === "dining-table-set";
    }
    if (subNorm === "showcase") {
      return pSubNorm === "showcase" || pSubLabelNorm === "showcase";
    }

    const targetSubObj = categoryInfo.subcategories?.find(
      (s) => norm(s.slug) === subNorm || norm(s.name) === subNorm
    );

    if (targetSubObj) {
      const subObjSlugNorm = norm(targetSubObj.slug);
      const subObjNameNorm = norm(targetSubObj.name);
      if (pSubNorm === subObjSlugNorm || pSubLabelNorm === subObjNameNorm) {
        return true;
      }
    }

    return false;
  };

  // State for live product catalog
  const [catalogProducts, setCatalogProducts] = useState(PRODUCTS);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveProducts = () => {
      productService.getProducts({ limit: 250 }).then((res) => {
        if (isMounted && res.products && res.products.length > 0) {
          setCatalogProducts(res.products);
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
  }, [slug]);

  // Calculate live product counts for each subcategory
  const subcategoryCounts = useMemo(() => {
    const counts = { all: 0 };
    catalogProducts.forEach((p) => {
      if (!matchesCategory(p)) return;
      counts.all += 1;

      if (categoryInfo.subcategories) {
        categoryInfo.subcategories.forEach((sub) => {
          if (matchesSubcategory(p, sub.slug)) {
            counts[sub.slug] = (counts[sub.slug] || 0) + 1;
          }
        });
      }
    });
    return counts;
  }, [slug, categoryInfo, catalogProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    // 1. Initial filter by category, subcategory, or search query
    let results = catalogProducts.filter((p) => {
      if (searchQueryParam) {
        const qNorm = searchQueryParam.toLowerCase();
        const matchesQuery =
          (p.name && p.name.toLowerCase().includes(qNorm)) ||
          (p.category && p.category.toLowerCase().includes(qNorm)) ||
          (p.categoryLabel && p.categoryLabel.toLowerCase().includes(qNorm)) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(qNorm)) ||
          (p.woodType && p.woodType.toLowerCase().includes(qNorm)) ||
          (p.description && p.description.toLowerCase().includes(qNorm)) ||
          (p.sku && p.sku.toLowerCase().includes(qNorm));
        if (!matchesQuery) return false;
        if (slug && slug !== "all" && !matchesCategory(p)) return false;
      } else {
        if (!matchesCategory(p)) return false;
        if (!matchesSubcategory(p, activeSubcategory)) return false;
      }

      // Wood filter matching Kinglet authentic materials
      if (selectedWood !== "all") {
        const pWoodNorm = (p.woodType || "").toLowerCase();
        if (selectedWood === "black-plum" && !pWoodNorm.includes("plum") && !pWoodNorm.includes("jam")) return false;
        if (selectedWood === "canadian-oak" && !pWoodNorm.includes("canadian") && !pWoodNorm.includes("oak")) return false;
        if (selectedWood === "german-oak" && !pWoodNorm.includes("german") && !pWoodNorm.includes("oak")) return false;
        if (selectedWood === "engineered" && !pWoodNorm.includes("engineering") && !pWoodNorm.includes("processed") && !pWoodNorm.includes("engineered")) return false;
        if (selectedWood === "mahogany" && !pWoodNorm.includes("mahogany")) return false;
      }

      // Price filter
      if (p.priceBDT > priceRange) return false;

      // In stock
      if (inStockOnly && !p.inStock) return false;

      // Rating
      if (minRating > 0 && p.rating < minRating) return false;

      return true;
    });

    // 2. Child filter refinement if child param is present
    if (activeChild && results.length > 0) {
      const childNorm = norm(decodeURIComponent(activeChild));
      const childMatches = results.filter((p) => {
        return (
          (p.childCategoryLabel && norm(p.childCategoryLabel) === childNorm) ||
          (p.childCategory && norm(p.childCategory) === childNorm) ||
          (p.childCategorySlug && norm(p.childCategorySlug) === childNorm) ||
          norm(p.name).includes(childNorm)
        );
      });
      // If specific child matches exist, use them; otherwise show all subcategory pieces
      if (childMatches.length > 0) {
        results = childMatches;
      }
    }

    // 3. Fallback: if category has products but specific subcategory filter returned 0, show category products
    if (!searchQueryParam && results.length === 0 && activeSubcategory !== "all") {
      results = PRODUCTS.filter((p) => matchesCategory(p));
    }

    return results.sort((a, b) => {
      if (sortBy === "price-low") return a.priceBDT - b.priceBDT;
      if (sortBy === "price-high") return b.priceBDT - a.priceBDT;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "newest") return b.id - a.id;
      return 0; // featured default
    });
  }, [
    slug,
    activeSubcategory,
    activeChild,
    searchQueryParam,
    selectedWood,
    priceRange,
    inStockOnly,
    minRating,
    sortBy,
    categoryInfo,
    catalogProducts,
  ]);

  const activeFiltersCount =
    (selectedWood !== "all" ? 1 : 0) +
    (priceRange < 500000 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (activeSubcategory !== "all" ? 1 : 0) +
    (activeChild ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedWood("all");
    setPriceRange(160000);
    setInStockOnly(false);
    setMinRating(0);
    setSearchParams({});
  };

  // Preset budget options
  const BUDGET_PRESETS = [
    { label: "< ৳30k", value: 30000 },
    { label: "৳30k - ৳60k", value: 60000 },
    { label: "৳60k - ৳100k", value: 100000 },
    { label: "All Prices", value: 160000 },
  ];

  // Wood types (Kinglet Official Materials)
  const WOOD_OPTIONS = [
    { id: "all", label: "All Materials", color: "#64748b" },
    { id: "mahogany", label: "Seasoned Mahogany", color: "#78350f" },
    { id: "black-plum", label: "Black Plum Wood (কালো জাম)", color: "#312e81" },
    { id: "canadian-oak", label: "Canadian Oak Veneer", color: "#d97706" },
    { id: "german-oak", label: "German Oak Veneer Wood", color: "#b45309" },
    { id: "engineered", label: "Engineering Processed Wood", color: "#334155" },
  ];

  // Shared Filter Controls Component
  const renderFilterControls = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* 1. Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "14px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SlidersHorizontal size={16} color="#ec2226" />
          </div>
          <div>
            <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>
              Filter Catalog
            </div>
            {activeFiltersCount > 0 && (
              <span style={{ fontSize: "11px", color: "#ec2226", fontWeight: "700" }}>
                {activeFiltersCount} active filter{activeFiltersCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <button
            onClick={handleResetFilters}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              color: "#ec2226",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            <RotateCcw size={12} />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* 2. Active Filter Chips (Instant Removal) */}
      {activeFiltersCount > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            padding: "10px 12px",
            background: "#f8fafc",
            borderRadius: "10px",
            border: "1px dashed #e2e8f0",
          }}
        >
          {selectedWood !== "all" && (
            <span
              onClick={() => setSelectedWood("all")}
              style={{
                fontSize: "11px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "3px 8px",
                borderRadius: "6px",
                color: "#0f172a",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: "600",
              }}
              title="Click to remove"
            >
              Wood: {selectedWood} <X size={11} color="#ec2226" />
            </span>
          )}

          {priceRange < 160000 && (
            <span
              onClick={() => setPriceRange(160000)}
              style={{
                fontSize: "11px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "3px 8px",
                borderRadius: "6px",
                color: "#0f172a",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: "600",
              }}
              title="Click to reset price"
            >
              ≤ ৳{priceRange.toLocaleString()} <X size={11} color="#ec2226" />
            </span>
          )}

          {inStockOnly && (
            <span
              onClick={() => setInStockOnly(false)}
              style={{
                fontSize: "11px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "3px 8px",
                borderRadius: "6px",
                color: "#0f172a",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: "600",
              }}
              title="Click to show all items"
            >
              In-Stock Only <X size={11} color="#ec2226" />
            </span>
          )}

          {minRating > 0 && (
            <span
              onClick={() => setMinRating(0)}
              style={{
                fontSize: "11px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "3px 8px",
                borderRadius: "6px",
                color: "#0f172a",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: "600",
              }}
              title="Click to remove rating filter"
            >
              {minRating}★ & Above <X size={11} color="#ec2226" />
            </span>
          )}
        </div>
      )}

      {/* 3. Price Budget Slider + Presets */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
            Price Budget:
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: "800",
              color: "#ec2226",
              background: "#fef2f2",
              padding: "2px 8px",
              borderRadius: "6px",
              border: "1px solid #fee2e2",
            }}
          >
            Up to ৳{priceRange.toLocaleString()}
          </span>
        </div>

        <input
          type="range"
          id="filter-price-slider"
          name="priceRange"
          aria-label="Filter products by maximum price"
          min="10000"
          max="160000"
          step="5000"
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="kinglet-price-slider"
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "#64748b",
            fontWeight: "600",
            marginTop: "6px",
            marginBottom: "10px",
          }}
        >
          <span>৳10,000</span>
          <span>৳160,000+</span>
        </div>

        {/* Budget Preset Pills */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {BUDGET_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setPriceRange(preset.value)}
              style={{
                fontSize: "11px",
                fontWeight: priceRange === preset.value ? "800" : "600",
                padding: "5px 8px",
                borderRadius: "6px",
                border: priceRange === preset.value ? "1.5px solid #ec2226" : "1px solid #e2e8f0",
                background: priceRange === preset.value ? "#fef2f2" : "#ffffff",
                color: priceRange === preset.value ? "#ec2226" : "#475569",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Timber & Wood Type Filter */}
      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "#0f172a",
            marginBottom: "10px",
          }}
        >
          Timber & Wood Type:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {WOOD_OPTIONS.map((wood) => {
            const isSelected = selectedWood === wood.id;
            return (
              <div
                key={wood.id}
                onClick={() => setSelectedWood(wood.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  border: isSelected ? "1.5px solid #ec2226" : "1px solid #e2e8f0",
                  background: isSelected ? "rgba(236, 34, 38, 0.05)" : "#ffffff",
                  transition: "all 0.18s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: wood.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: isSelected ? "800" : "500",
                      color: isSelected ? "#ec2226" : "#334155",
                    }}
                  >
                    {wood.label}
                  </span>
                </div>
                {isSelected && <Check size={14} color="#ec2226" strokeWidth={3} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Availability & Express Delivery Toggle */}
      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "#0f172a",
            marginBottom: "10px",
          }}
        >
          Delivery & Stock:
        </div>
        <div
          onClick={() => setInStockOnly(!inStockOnly)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            borderRadius: "10px",
            cursor: "pointer",
            border: inStockOnly ? "1.5px solid #ec2226" : "1px solid #e2e8f0",
            background: inStockOnly ? "rgba(236, 34, 38, 0.05)" : "#ffffff",
            transition: "all 0.18s ease",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "5px",
              border: inStockOnly ? "2px solid #ec2226" : "2px solid #cbd5e1",
              background: inStockOnly ? "#ec2226" : "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {inStockOnly && <Check size={13} color="#ffffff" strokeWidth={3} />}
          </div>
          <div>
            <div
              style={{
                fontSize: "12.5px",
                fontWeight: "800",
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Truck size={13} color="#16a34a" />
              <span>Ready In-Stock</span>
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              48-Hour Express Dhaka Delivery
            </div>
          </div>
        </div>
      </div>

      {/* 6. Customer Rating Filter */}
      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "#0f172a",
            marginBottom: "10px",
          }}
        >
          Customer Rating:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[
            { stars: 0, label: "All Ratings" },
            { stars: 5, label: "5 Stars Top Rated" },
            { stars: 4, label: "4 Stars & Above" },
          ].map((r) => {
            const isSelected = minRating === r.stars;
            return (
              <div
                key={r.stars}
                onClick={() => setMinRating(r.stars)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  border: isSelected ? "1.5px solid #ec2226" : "1px solid #e2e8f0",
                  background: isSelected ? "rgba(236, 34, 38, 0.05)" : "#ffffff",
                  transition: "all 0.18s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: isSelected ? "800" : "500",
                      color: isSelected ? "#ec2226" : "#334155",
                    }}
                  >
                    {r.label}
                  </span>
                  {r.stars > 0 && <Star size={13} color="#f59e0b" fill="#f59e0b" />}
                </div>
                {isSelected && <Check size={14} color="#ec2226" strokeWidth={3} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Kinglet Heritage Guarantee Seal */}
      <div
        style={{
          background: "linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)",
          border: "1px dashed rgba(236, 34, 38, 0.3)",
          borderRadius: "12px",
          padding: "14px",
          display: "flex",
          gap: "10px",
          alignItems: "flex-start",
        }}
      >
        <ShieldCheck size={20} color="#ec2226" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a" }}>
            10-15 Yrs Timber Warranty
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.4", marginTop: "2px" }}>
            Vacuum kiln-dried timber anti-termite guarantee & nationwide safe delivery across Bangladesh.
          </div>
        </div>
      </div>
    </div>
  );

  const seoTitle = `${categoryInfo.name} Price in Bangladesh | Kinglet Furniture`;
  const seoDesc = `Shop ${categoryInfo.name} at Kinglet Bangladesh Ltd. Handcrafted from seasoned Mahogany, Black Plum Wood, and Oak Veneer with Italian PU lacquer and 10-Year Timber Guarantee. Nationwide delivery across Bangladesh.`;
  const seoKeywords = `${categoryInfo.name}, ${categoryInfo.name} price in Bangladesh, mahogany ${categoryInfo.name}, black plum wood, canadian oak veneer, german oak veneer, luxury furniture BD, Kinglet Furniture`;

  const categoryItemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${categoryInfo.name} Furniture Collection`,
    description: seoDesc,
    numberOfItems: filteredProducts.length,
    itemListElement: filteredProducts.slice(0, 12).map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      url: `https://www.kingletbd.com/product/${item.slug || item.id}`,
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
        name: categoryInfo.name,
        item: `https://www.kingletbd.com/category/${categoryInfo.slug || slug}`,
      },
      ...(activeSubcategory !== "all"
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: currentSubTitle,
              item: `https://www.kingletbd.com/category/${categoryInfo.slug || slug}/${activeSubcategory}`,
            },
          ]
        : []),
    ],
  };

  return (
    <div
      className="category-page"
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        paddingTop: 0,
        marginTop: 0,
        paddingBottom: "80px",
      }}
    >
      {/* Dynamic Google 1st Page SEO Engine */}
      <KingletSEO
        title={seoTitle}
        description={seoDesc}
        keywords={seoKeywords}
        canonicalUrl={`https://www.kingletbd.com/category/${slug || "bed-room"}`}
        schemaJson={[categoryItemListSchema, breadcrumbSchema]}
      />

      {/* 1. Category Atmospheric Architectural Hero Banner - Full Bleed to Browser Top */}
      <div
        style={{
          position: "relative",
          minHeight: "380px",
          width: "100%",
          margin: 0,
          padding: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          background: "#0f172a",
        }}
      >
        {/* Background Image with Ambient Ken Burns Motion */}
        <img
          src={bgImage}
          alt={categoryInfo.name}
          width="1920"
          height="600"
          fetchPriority="high"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.85) contrast(1.05)",
            animation: "livePosterKenBurns 28s ease-in-out infinite alternate",
          }}
        />

        {/* Ambient Radial Red Glow Orb */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "15%",
            width: "450px",
            height: "450px",
            background: "radial-gradient(circle, rgba(236, 34, 38, 0.3) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Dynamic Dark Gradient Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.88) 45%, rgba(15, 23, 42, 0.45) 100%)",
            zIndex: 1,
          }}
        />

        {/* Hero Content with Generous Top Padding for Floating Header */}
        <div
          className="container category-hero-container"
          style={{
            position: "relative",
            zIndex: 2,
            padding: "135px 20px 48px",
            maxWidth: "1420px",
            width: "100%",
          }}
        >
          {/* Breadcrumb Navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12.5px",
              color: "#94a3b8",
              marginBottom: "14px",
              fontWeight: "600",
            }}
          >
            <Link
              to="/"
              style={{
                color: "#cbd5e1",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
            >
              <Home size={13} />
              <span>Home</span>
            </Link>
            <ChevronRight size={12} color="#64748b" />
            <Link
              to="/category/all"
              style={{ color: "#cbd5e1", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
            >
              Collections
            </Link>
            <ChevronRight size={12} color="#64748b" />
            <Link
              to={`/category/${categoryInfo.slug || slug}`}
              style={{
                color: activeSubcategory === "all" ? "#ff3b30" : "#cbd5e1",
                fontWeight: "700",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = activeSubcategory === "all" ? "#ff3b30" : "#cbd5e1")
              }
            >
              {categoryInfo.name}
            </Link>
            {activeSubcategory !== "all" && (
              <>
                <ChevronRight size={12} color="#64748b" />
                <Link
                  to={`/category/${categoryInfo.slug || slug}?sub=${activeSubcategory}`}
                  style={{
                    color: activeChild ? "#cbd5e1" : "#ff3b30",
                    fontWeight: "700",
                    textDecoration: "none",
                  }}
                >
                  {currentSubTitle}
                </Link>
              </>
            )}
            {activeChild && (
              <>
                <ChevronRight size={12} color="#64748b" />
                <span style={{ color: "#ff3b30", fontWeight: "700" }}>
                  {currentChildTitle}
                </span>
              </>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "24px",
            }}
          >
            <div style={{ maxWidth: "760px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  background: "rgba(236, 34, 38, 0.16)",
                  border: "1px solid rgba(236, 34, 38, 0.35)",
                  padding: "5px 14px",
                  borderRadius: "9999px",
                  color: "#fca5a5",
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "0.5px",
                  marginBottom: "10px",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Sparkles size={13} color="#ec2226" />
                <span>
                  {activeChild
                    ? `Curated Design • ${currentSubTitle}`
                    : activeSubcategory !== "all"
                    ? `Bespoke Atelier • ${currentSubTitle}`
                    : "Kinglet Signature Handcrafted Woodcraft"}
                </span>
              </div>

              <h1
                className="category-hero-title"
                style={{
                  fontSize: "36px",
                  fontWeight: "900",
                  margin: "0 0 10px",
                  color: "#ffffff",
                  letterSpacing: "-0.5px",
                  lineHeight: "1.2",
                  textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                }}
              >
                {pageHeading}
              </h1>

              <p
                style={{
                  fontSize: "14.5px",
                  color: "#cbd5e1",
                  margin: "0 0 16px",
                  lineHeight: "1.6",
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                  maxWidth: "680px",
                }}
              >
                {categoryInfo.description}
              </p>

              {/* Quick Trust Feature Pills */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {[
                  { icon: ShieldCheck, text: "10-15 Yrs Timber Warranty" },
                  { icon: Layers, text: "Seasoned Solid Hardwood" },
                  { icon: Truck, text: "Nationwide Delivery" },
                  { icon: CreditCard, text: "0% EMI up to 12 Months" },
                ].map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(255, 255, 255, 0.08)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#e2e8f0",
                      }}
                    >
                      <Icon size={12} color="#ec2226" />
                      <span>{feat.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Luxury Stats Glass Card */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.07)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                borderRadius: "18px",
                padding: "20px 30px",
                textAlign: "center",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                minWidth: "170px",
              }}
            >
              <div
                style={{
                  fontSize: "38px",
                  fontWeight: "900",
                  color: "#ff3b30",
                  lineHeight: "1",
                  textShadow: "0 2px 14px rgba(236,34,38,0.6)",
                }}
              >
                {filteredProducts.length}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  color: "#ffffff",
                }}
              >
                Crafted Designs
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#4ade80",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "4px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 6px #22c55e",
                  }}
                />
                Mirpur Showroom Open
              </div>

              {onOpenCustomSizing && (
                <button
                  type="button"
                  onClick={() => onOpenCustomSizing()}
                  style={{
                    marginTop: "8px",
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ec2226";
                    e.currentTarget.style.borderColor = "#ec2226";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                  }}
                >
                  Custom Sizing
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Haute Atelier Curated Suite Deck - Seamless Liquid Glass Ribbon (Zero Gap, Flush Docking) */}
      {categoryInfo.subcategories && categoryInfo.subcategories.length > 0 && (
        <section
          aria-label="Atelier Subcategory Suites"
          className="kinglet-curated-island-wrapper"
          style={{
            position: "sticky",
            top: "56px",
            zIndex: 900,
            background: "rgba(255, 255, 255, 0.16)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.28)",
            boxShadow: "0 4px 20px -8px rgba(15, 23, 42, 0.03)",
            padding: "8px 0",
            transition: "all 0.25s ease",
          }}
        >
          <div className="kinglet-curated-island-inner">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              {/* Left Scroll Track with Chevrons and Translucent Glass Pills */}
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* Left Scroll Button */}
                <button
                  type="button"
                  onClick={() => handleSubnavScroll("left")}
                  aria-label="Scroll suites left"
                  className="kinglet-subnav-chevron kinglet-subnav-chevron-left"
                  style={{
                    position: "absolute",
                    left: "0",
                    zIndex: 10,
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.35)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.45)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#334155",
                    transition: "all 0.2s ease",
                  }}
                >
                  <ChevronLeft size={14} />
                </button>

                {/* Scrollable Track */}
                <div
                  ref={subnavScrollRef}
                  className="kinglet-curated-track custom-modal-scroll"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    overflowX: "auto",
                    padding: "2px 24px",
                    width: "100%",
                    scrollbarWidth: "none",
                    scrollBehavior: "smooth",
                  }}
                >
                  {/* 1. All Collection Item */}
                  {(() => {
                    const isAllActive = activeSubcategory === "all";
                    const allCount = subcategoryCounts.all || filteredProducts.length;

                    return (
                      <button
                        key="all-capsule"
                        type="button"
                        onClick={() => setSearchParams({})}
                        className={`kinglet-posh-suite-pill ${isAllActive ? "is-active" : ""}`}
                      >
                        <span className="suite-pill-icon">
                          <Crown size={13} />
                        </span>
                        <span className="suite-pill-label">All {categoryInfo.name}</span>
                        <span className="suite-pill-count">
                          {allCount}
                        </span>
                      </button>
                    );
                  })()}

                  {/* 2. Subcategory Items */}
                  {categoryInfo.subcategories.map((sub, idx) => {
                    const isActive =
                      activeSubcategory === sub.slug ||
                      activeSubcategory === sub.name.toLowerCase();
                    const count = subcategoryCounts[sub.slug] || 0;
                    const IconComponent = SUBCATEGORY_ICON_MAP[sub.slug] || Layers;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSearchParams({ sub: sub.slug })}
                        className={`kinglet-posh-suite-pill ${isActive ? "is-active" : ""}`}
                      >
                        <span className="suite-pill-icon">
                          <IconComponent size={13} />
                        </span>
                        <span className="suite-pill-label">{sub.name}</span>
                        {count > 0 && (
                          <span className="suite-pill-count">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right Scroll Button */}
                <button
                  type="button"
                  onClick={() => handleSubnavScroll("right")}
                  aria-label="Scroll suites right"
                  className="kinglet-subnav-chevron kinglet-subnav-chevron-right"
                  style={{
                    position: "absolute",
                    right: "0",
                    zIndex: 10,
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.35)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.45)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#334155",
                    transition: "all 0.2s ease",
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Right: Quick Reset if Filter Active */}
              {activeSubcategory !== "all" && (
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  style={{
                    background: "rgba(236, 34, 38, 0.08)",
                    border: "1px solid rgba(236, 34, 38, 0.22)",
                    color: "#ec2226",
                    fontSize: "11.5px",
                    fontWeight: "800",
                    padding: "5px 12px",
                    borderRadius: "9999px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    backdropFilter: "blur(8px)",
                    transition: "all 0.2s ease",
                  }}
                  title="Reset to all designs"
                >
                  <RotateCcw size={11} />
                  <span>Show All</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3. Main Content Area: Sticky Left Sidebar + Product Grid */}
      <div className="container" style={{ paddingTop: "20px", maxWidth: "1420px" }}>
        <div className="category-layout-grid">
          {/* Left Sticky Filter Sidebar (Desktop) */}
          <aside
            className="category-desktop-sidebar custom-modal-scroll"
            style={{
              position: "sticky",
              top: "124px",
              maxHeight: "calc(100vh - 145px)",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "22px",
              boxShadow: "0 4px 25px -4px rgba(15, 23, 42, 0.05)",
            }}
          >
            {renderFilterControls()}
          </aside>

          {/* Right Product Showcase Area */}
          <div>
            {/* Top Toolbar: Items count, Sort dropdown, and Grid Toggles */}
            <div
              style={{
                background: "#ffffff",
                padding: "12px 18px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "12px",
                boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Mobile Filter Button */}
                <button
                  className="category-mobile-filter-btn"
                  onClick={() => setIsMobileFilterOpen(true)}
                  style={{
                    alignItems: "center",
                    gap: "6px",
                    background: "linear-gradient(135deg, #ff3b30 0%, #ec2226 100%)",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(236,34,38,0.3)",
                  }}
                >
                  <SlidersHorizontal size={14} />
                  <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}</span>
                </button>

                <div
                  style={{
                    fontSize: "13.5px",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "#22c55e",
                    }}
                  />
                  <span>
                    Showing{" "}
                    <strong style={{ color: "#0f172a", fontWeight: "800" }}>
                      {filteredProducts.length}
                    </strong>{" "}
                    pieces in{" "}
                    <span style={{ color: "#ec2226", fontWeight: "800" }}>
                      {categoryInfo.name}
                    </span>
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Sort Dropdown */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ArrowUpDown size={14} color="#64748b" />
                  <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>
                    Sort:
                  </span>
                  <select
                    id="catalog-sort-select"
                    name="sortBy"
                    aria-label="Sort product catalog"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: "6px 12px",
                      fontSize: "13px",
                      fontWeight: "600",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "8px",
                      background: "#ffffff",
                      color: "#0f172a",
                      cursor: "pointer",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#ec2226")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                  >
                    <option value="featured">Featured First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Customer Rated</option>
                    <option value="newest">Newest Collection</option>
                  </select>
                </div>

                {/* Grid Layout Toggles: 3 Columns vs 4 Columns (4x4) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    borderLeft: "1px solid #e2e8f0",
                    paddingLeft: "12px",
                  }}
                >
                  <button
                    onClick={() => setGridCols(3)}
                    title="3 Columns (Showcase View)"
                    style={{
                      background: gridCols === 3 ? "#fef2f2" : "transparent",
                      border: gridCols === 3 ? "1px solid #fecaca" : "1px solid transparent",
                      color: gridCols === 3 ? "#ec2226" : "#94a3b8",
                      padding: "6px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setGridCols(4)}
                    title="4 Columns (Catalog 4x4 View)"
                    style={{
                      background: gridCols === 4 ? "#fef2f2" : "transparent",
                      border: gridCols === 4 ? "1px solid #fecaca" : "1px solid transparent",
                      color: gridCols === 4 ? "#ec2226" : "#94a3b8",
                      padding: "6px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Grid3X3 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Cards Grid: Dynamic 4-Column or 3-Column */}
            {filteredProducts.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  padding: "70px 20px",
                  borderRadius: "16px",
                  textAlign: "center",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div
                  style={{
                    width: "68px",
                    height: "68px",
                    borderRadius: "50%",
                    background: "#fef2f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <SlidersHorizontal size={28} color="#ec2226" />
                </div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "800",
                    color: "#0f172a",
                    margin: "0 0 8px",
                  }}
                >
                  No matching furniture pieces found
                </h3>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "14px",
                    margin: "0 auto 20px",
                    maxWidth: "380px",
                  }}
                >
                  We couldn't find designs matching your selected price or wood filter. Try resetting
                  your criteria.
                </p>
                <button
                  onClick={handleResetFilters}
                  style={{
                    background: "linear-gradient(135deg, #ff3b30 0%, #ec2226 100%)",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 24px",
                    borderRadius: "9999px",
                    fontWeight: "700",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(236, 34, 38, 0.35)",
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div
                className={`category-products-grid ${
                  gridCols === 4 ? "grid-cols-4" : "grid-cols-3"
                }`}
              >
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
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      {isMobileFilterOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 100000,
            display: "flex",
            justifyContent: "flex-end",
            overscrollBehavior: "contain",
          }}
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div
            className="custom-modal-scroll"
            style={{
              width: "85%",
              maxWidth: "350px",
              height: "100%",
              background: "#ffffff",
              boxShadow: "-15px 0 45px rgba(15, 23, 42, 0.2)",
              padding: "24px 20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                paddingBottom: "14px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div style={{ fontWeight: "800", fontSize: "17px", color: "#0f172a" }}>
                Filter Catalog
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                aria-label="Close filters"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flexGrow: 1 }}>{renderFilterControls()}</div>

            <div
              style={{
                paddingTop: "20px",
                borderTop: "1px solid #f1f5f9",
                marginTop: "16px",
              }}
            >
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #ff3b30 0%, #ec2226 100%)",
                  color: "#ffffff",
                  border: "none",
                  padding: "13px",
                  borderRadius: "10px",
                  fontWeight: "800",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(236, 34, 38, 0.35)",
                }}
              >
                Apply Filters ({filteredProducts.length} Results)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authority Furniture SEO Buyers Guide & Price Index */}
      <KingletSEOAuthorityBlock />
    </div>
  );
}
