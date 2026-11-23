import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { Eye, ExternalLink } from "lucide-react";
import { adminAuthService } from "../../utils/adminAuthService";
import { productService } from "../../utils/productService";
import ProductImageManager from "../../components/admin/ProductImageManager";
import KingletProductModal from "../../components/Products/KingletProductModal";

export default function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const pathEnd = location.pathname.split("/").filter(Boolean).pop();
  const activeTab = searchParams.get("tab") === "attributes" || pathEnd === "attributes" ? "attributes" : "products";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [woodFilter, setWoodFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [placementFilter, setPlacementFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Attributes State
  const [attributes, setAttributes] = useState([]);
  const [attrLoading, setAttrLoading] = useState(false);
  const [newValForm, setNewValForm] = useState({ attrId: "", value: "", code: "" });

  const fetchAttributes = async () => {
    setAttrLoading(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/attributes");
      setAttributes(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAttrLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "attributes") {
      fetchAttributes();
    }
  }, [activeTab]);

  const handleAddAttributeValue = async (e, attrId) => {
    e.preventDefault();
    if (!newValForm.value) return;
    try {
      const autoCode = newValForm.value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      await adminAuthService.fetch(`/api/v1/admin/attributes/${attrId}/values`, {
        method: "POST",
        body: JSON.stringify({
          value: newValForm.value,
          code: autoCode,
          displayOrder: 10,
        }),
      });
      setNewValForm({ attrId: "", value: "", code: "" });
      fetchAttributes();
    } catch (err) {
      alert("Failed to add attribute value: " + err.message);
    }
  };

  const handleDeleteAttributeValue = async (valId) => {
    if (!window.confirm("Remove this attribute value?")) return;
    try {
      await adminAuthService.fetch(`/api/v1/admin/attributes/values/${valId}`, {
        method: "DELETE",
      });
      fetchAttributes();
    } catch (err) {
      alert("Failed to delete value: " + err.message);
    }
  };

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Modal State (Create / Edit)
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sku: "",
    parentCategoryId: "",
    childCategoryId: "",
    categoryId: "",
    primaryMaterial: "Seasoned Mahogany",
    dimensions: "6.5 ft x 6.0 ft (King Size)",
    finishType: "High-Gloss Italian PU",
    hardware: "Hydraulic Soft-Closing German Fittings",
    seasoningMethod: "Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)",
    regularPrice: 35000,
    basePrice: 35000,
    oldPrice: "",
    discountMode: "NONE", // "NONE", "PERCENT", "CUSTOM"
    discountPercent: 0,
    badge: "NEW",
    couponCode: "",
    isOffer: false,
    isNewArrival: false,
    isShowroomClassic: false,
    initialStock: 5,
    stockCount: 5,
    description: "",
    images: [""],
    isActive: true,
    inStock: true,
  });

  // Category Hierarchy Helpers (3-Tier: Level 1 Parent -> Level 2 Subcategory -> Level 3 Child Category)
  const parentCategories = useMemo(() => {
    return categories.filter((c) => !c.parentId || c.level === 1);
  }, [categories]);

  const currentSubcategories = useMemo(() => {
    if (!formData.parentCategoryId) return [];
    return categories.filter((c) => {
      if (c.level === 2) {
        return c.parentId === formData.parentCategoryId || c.rootParentId === formData.parentCategoryId;
      }
      return c.parentId === formData.parentCategoryId;
    });
  }, [categories, formData.parentCategoryId]);

  const currentChildCategories = useMemo(() => {
    if (!formData.subCategoryId) return [];
    return categories.filter((c) => {
      if (c.level === 3) {
        return c.parentId === formData.subCategoryId || c.subParentId === formData.subCategoryId;
      }
      return c.parentId === formData.subCategoryId;
    });
  }, [categories, formData.subCategoryId]);

  const selectedParentObj = useMemo(() => {
    return categories.find((c) => c.id === formData.parentCategoryId);
  }, [categories, formData.parentCategoryId]);

  const selectedSubObj = useMemo(() => {
    return categories.find((c) => c.id === formData.subCategoryId);
  }, [categories, formData.subCategoryId]);

  const selectedChildObj = useMemo(() => {
    return categories.find((c) => c.id === formData.childCategoryId);
  }, [categories, formData.childCategoryId]);

  const handleParentCategoryChange = (parentId) => {
    const matchingSubs = categories.filter((c) => {
      if (c.level === 2) return c.parentId === parentId || c.rootParentId === parentId;
      return c.parentId === parentId;
    });
    const defaultSub = matchingSubs.length > 0 ? matchingSubs[0].id : "";
    setFormData((prev) => ({
      ...prev,
      parentCategoryId: parentId,
      subCategoryId: defaultSub,
      childCategoryId: "",
      categoryId: defaultSub || parentId,
    }));
  };

  const handleSubCategoryChange = (subId) => {
    setFormData((prev) => ({
      ...prev,
      subCategoryId: subId,
      childCategoryId: "",
      categoryId: subId || prev.parentCategoryId,
    }));
  };

  const handleChildCategoryChange = (childId) => {
    setFormData((prev) => ({
      ...prev,
      childCategoryId: childId,
      categoryId: childId || prev.subCategoryId || prev.parentCategoryId,
    }));
  };

  const handleRegularPriceChange = (val) => {
    const regNum = Number(val) || 0;
    setFormData((prev) => {
      if (prev.discountMode === "PERCENT" && Number(prev.discountPercent) > 0) {
        const pct = Number(prev.discountPercent);
        const selling = Math.round(regNum * (1 - pct / 100));
        return {
          ...prev,
          regularPrice: val,
          oldPrice: regNum,
          basePrice: selling,
          badge: `${pct}% OFF`,
        };
      } else if (prev.discountMode === "CUSTOM") {
        const selling = Number(prev.basePrice) || 0;
        const diff = regNum - selling;
        const pct = regNum > 0 && diff > 0 ? Math.round((diff / regNum) * 100) : 0;
        return {
          ...prev,
          regularPrice: val,
          oldPrice: regNum,
          discountPercent: pct,
          badge: pct > 0 ? `${pct}% OFF` : (prev.badge?.includes("% OFF") ? "" : prev.badge),
        };
      }
      return {
        ...prev,
        regularPrice: val,
        basePrice: regNum,
        oldPrice: "",
        discountPercent: 0,
      };
    });
  };

  const handleSetDiscountMode = (mode) => {
    setFormData((prev) => {
      const regNum = Number(prev.regularPrice || prev.basePrice || prev.oldPrice) || 0;
      if (mode === "NONE") {
        return {
          ...prev,
          discountMode: "NONE",
          regularPrice: regNum,
          basePrice: regNum,
          oldPrice: "",
          discountPercent: 0,
          badge: prev.badge?.includes("% OFF") ? "" : prev.badge,
        };
      } else if (mode === "PERCENT") {
        const pct = Number(prev.discountPercent) > 0 ? Number(prev.discountPercent) : 15;
        const selling = Math.round(regNum * (1 - pct / 100));
        return {
          ...prev,
          discountMode: "PERCENT",
          regularPrice: regNum,
          oldPrice: regNum,
          discountPercent: pct,
          basePrice: selling,
          badge: `${pct}% OFF`,
          couponCode: "", // Discount products cannot have coupon offers
        };
      } else if (mode === "CUSTOM") {
        const curSelling = Number(prev.basePrice) > 0 && Number(prev.basePrice) < regNum
          ? Number(prev.basePrice)
          : Math.round(regNum * 0.85);
        const diff = regNum - curSelling;
        const pct = diff > 0 ? Math.round((diff / regNum) * 100) : 0;
        return {
          ...prev,
          discountMode: "CUSTOM",
          regularPrice: regNum,
          oldPrice: regNum,
          basePrice: curSelling,
          discountPercent: pct,
          badge: pct > 0 ? `${pct}% OFF` : prev.badge,
          couponCode: "", // Discount products cannot have coupon offers
        };
      }
      return prev;
    });
  };

  const handleSetDiscountPercent = (pctVal) => {
    const pct = Math.max(0, Math.min(90, Number(pctVal) || 0));
    setFormData((prev) => {
      const regNum = Number(prev.regularPrice || prev.basePrice || prev.oldPrice) || 0;
      if (pct === 0) {
        return {
          ...prev,
          discountPercent: 0,
          discountMode: "NONE",
          regularPrice: regNum,
          basePrice: regNum,
          oldPrice: "",
          badge: prev.badge?.includes("% OFF") ? "" : prev.badge,
        };
      }
      const selling = Math.round(regNum * (1 - pct / 100));
      return {
        ...prev,
        discountPercent: pct,
        discountMode: "PERCENT",
        regularPrice: regNum,
        oldPrice: regNum,
        basePrice: selling,
        badge: `${pct}% OFF`,
        couponCode: "", // Discount products cannot have coupons
      };
    });
  };

  const handleCustomSellingPriceChange = (val) => {
    const selling = Number(val) || 0;
    setFormData((prev) => {
      const regNum = Number(prev.regularPrice || prev.oldPrice || prev.basePrice) || 0;
      const diff = regNum - selling;
      const pct = regNum > 0 && diff > 0 ? Math.round((diff / regNum) * 100) : 0;
      return {
        ...prev,
        basePrice: val,
        discountMode: pct > 0 ? "CUSTOM" : "NONE",
        discountPercent: pct,
        oldPrice: pct > 0 ? regNum : "",
        badge: pct > 0 ? `${pct}% OFF` : (prev.badge?.includes("% OFF") ? "" : prev.badge),
        couponCode: pct > 0 ? "" : prev.couponCode,
      };
    });
  };

  const AUTHENTIC_WOODS = [
    "Seasoned Mahogany",
    "Black Plum Wood",
    "Engineering Processed Wood",
    "Canadian Oak Veneer",
    "German Oak Veneer Wood",
  ];

  // Fetch categories for dropdowns
  const fetchCategories = async () => {
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/categories");
      const cats = res.data || [];
      setCategories(cats);
      if (cats.length > 0 && !formData.categoryId) {
        const rootCats = cats.filter((c) => !c.parentId || c.level === 1);
        const defaultParent = rootCats[0] || cats[0];
        const matchingSubs = defaultParent
          ? cats.filter((c) => (c.level === 2 && (c.parentId === defaultParent.id || c.rootParentId === defaultParent.id)) || c.parentId === defaultParent.id)
          : [];
        const defaultSub = matchingSubs[0]?.id || "";
        setFormData((prev) => ({
          ...prev,
          parentCategoryId: defaultParent?.id || "",
          subCategoryId: defaultSub,
          childCategoryId: "",
          categoryId: defaultSub || defaultParent?.id || "",
        }));
      }
    } catch {
      // Non-blocking
    }
  };

  // Fetch products with filters
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        category: categoryFilter,
        wood: woodFilter,
        stock: stockFilter,
        status: statusFilter,
        placement: placementFilter !== "ALL" ? placementFilter : undefined,
        search,
      });

      const res = await adminAuthService.fetch(`/api/v1/admin/products?${query.toString()}`);
      setProducts(res.data || []);
      const total = res.pagination?.total ?? (res.data?.length || 0);
      const computedPages = res.pagination?.totalPages || res.pagination?.pages || Math.ceil(total / Number(limit)) || 1;
      setTotalPages(computedPages);
      setTotalCount(total);
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, limit, categoryFilter, woodFilter, stockFilter, statusFilter, placementFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    const rootCats = categories.filter((c) => !c.parentId || c.level === 1);
    const defaultParent = rootCats[0] || categories[0];
    const matchingSubs = defaultParent
      ? categories.filter((c) => (c.level === 2 && (c.parentId === defaultParent.id || c.rootParentId === defaultParent.id)) || c.parentId === defaultParent.id)
      : [];
    const defaultSub = matchingSubs[0]?.id || "";

    setFormData({
      name: "",
      slug: "",
      sku: `KL-${Math.floor(100 + Math.random() * 900)}`,
      parentCategoryId: defaultParent?.id || "",
      subCategoryId: defaultSub,
      childCategoryId: "",
      categoryId: defaultSub || defaultParent?.id || "",
      primaryMaterial: "Seasoned Mahogany",
      dimensions: "6.5 ft x 6.0 ft (King Size)",
      finishType: "High-Gloss Italian PU",
      hardware: "Hydraulic Soft-Closing German Fittings",
      seasoningMethod: "Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)",
      regularPrice: 35000,
      basePrice: 35000,
      oldPrice: "",
      discountMode: "NONE",
      discountPercent: 0,
      badge: "NEW",
      couponCode: "",
      isOffer: false,
      isNewArrival: true,
      isShowroomClassic: false,
      initialStock: 6,
      stockCount: 6,
      description: "Handcrafted masterwork seasoned with chemical pressure vacuum autoclave.",
      images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80"],
      isActive: true,
      inStock: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handlePreviewFromModal = () => {
    const rawImages = Array.isArray(formData.images) ? formData.images : [formData.images];
    let safeImages = rawImages
      .map((img) => (typeof img === "object" ? img?.url : img))
      .filter((url) => typeof url === "string" && url.trim().length > 0);

    if (safeImages.length === 0) {
      safeImages = ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80"];
    }

    const matchedCategory = categories.find((c) => String(c.id) === String(formData.categoryId));
    const basePriceNum = Number(formData.basePrice || formData.regularPrice || 0);
    const oldPriceNum = (formData.discountMode !== "NONE" && formData.oldPrice && Number(formData.oldPrice) > basePriceNum)
      ? Number(formData.oldPrice)
      : null;
    const computedDiscount =
      oldPriceNum && oldPriceNum > basePriceNum
        ? Math.round(((oldPriceNum - basePriceNum) / oldPriceNum) * 100)
        : 0;

    const previewItem = {
      id: editingProduct?.id || "preview-temp",
      name: formData.name || "Untitled Product Preview",
      sku: formData.sku || "KL-PREVIEW",
      category: matchedCategory?.name || "Kinglet Collection",
      priceBDT: basePriceNum,
      basePrice: basePriceNum,
      oldPriceBDT: oldPriceNum,
      oldPrice: oldPriceNum,
      couponCode: formData.couponCode ? formData.couponCode.trim() : null,
      badge: formData.badge || (computedDiscount > 0 ? `${computedDiscount}% OFF` : ""),
      image: safeImages[0],
      images: safeImages,
      woodType: formData.primaryMaterial || "Authentic Seasoned Timber",
      finish: formData.finishType || "Italian PU Lacquer",
      dimensions: formData.dimensions || "Standard Factory Dimensions",
      hardware: formData.hardware || "Hydraulic Soft-Closing German Fittings",
      seasoningMethod: formData.seasoningMethod || "Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)",
      description: formData.description || "Handcrafted masterwork seasoned with chemical pressure vacuum autoclave.",
      inStock: formData.inStock !== false,
      isActive: formData.isActive !== false,
      slug: formData.slug || (formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "preview"),
      rating: 5.0,
      reviewsCount: 16,
      stockCount: Number(formData.stockCount || 5),
    };

    setPreviewProduct(previewItem);
  };

  const handlePreviewFromRow = (p) => {
    let rawImages = [];
    if (p.imageObjects && p.imageObjects.length > 0) {
      rawImages = p.imageObjects.map((img) => (typeof img === "object" ? img?.url : img));
    } else if (p.images && p.images.length > 0) {
      rawImages = p.images.map((img) => (typeof img === "object" ? img?.url : img));
    } else if (p.image) {
      rawImages = [p.image];
    }

    const safeImages = rawImages.filter((url) => typeof url === "string" && url.trim().length > 0);
    if (safeImages.length === 0) {
      safeImages.push("https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80");
    }

    const matchedCategory = p.category?.name || categories.find((c) => String(c.id) === String(p.categoryId))?.name;
    const basePriceNum = Number(p.priceBDT || p.basePrice || 0);
    const oldPriceNum = p.oldPriceBDT ? Number(p.oldPriceBDT) : (p.oldPrice ? Number(p.oldPrice) : null);

    setPreviewProduct({
      ...p,
      name: p.name,
      sku: p.sku || "KL-SERIES",
      category: matchedCategory || "Kinglet Collection",
      priceBDT: basePriceNum,
      oldPriceBDT: oldPriceNum,
      badge: p.badge || "",
      image: safeImages[0],
      images: safeImages,
      woodType: p.woodType || p.primaryMaterial || "Authentic Seasoned Timber",
      finish: p.finish || p.finishType || "Italian PU Lacquer",
      dimensions: p.dimensions || "Standard Factory Dimensions",
      hardware: p.hardware || "Hydraulic Soft-Closing German Fittings",
      seasoningMethod: p.seasoningMethod || "Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)",
      description: p.description || "",
      inStock: p.inStock !== false,
      isActive: p.isActive !== false,
      slug: p.slug,
      rating: 5.0,
      reviewsCount: 16,
    });
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    const hasDiscount = p.oldPriceBDT && Number(p.oldPriceBDT) > Number(p.priceBDT);
    const regularPrice = hasDiscount ? Number(p.oldPriceBDT) : Number(p.priceBDT);
    const sellingPrice = Number(p.priceBDT);
    const discountPercent = hasDiscount
      ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100)
      : 0;

    // Detect Parent Category, Subcategory, and Child Category from p.categoryId
    const foundCat = categories.find((c) => c.id === p.categoryId);
    let parentCatId = "";
    let subCatId = "";
    let childCatId = "";

    if (foundCat) {
      if (foundCat.level === 3 || foundCat.subParentId || (foundCat.parent?.parentId)) {
        // Level 3 child category (e.g. King Size Bed, 2 Door Almirah)
        parentCatId = foundCat.rootParentId || foundCat.parent?.parent?.id || "";
        subCatId = foundCat.subParentId || foundCat.parentId || "";
        childCatId = foundCat.id;
      } else if (foundCat.parentId) {
        // Level 2 subcategory (e.g. Bed, Almirah, Dressing Table)
        parentCatId = foundCat.parentId;
        subCatId = foundCat.id;
        childCatId = "";
      } else {
        // Level 1 root category (e.g. Bedroom, Living Room)
        parentCatId = foundCat.id;
        subCatId = "";
        childCatId = "";
      }
    } else {
      const rootCategories = categories.filter((c) => !c.parentId || c.level === 1);
      parentCatId = rootCategories[0]?.id || "";
      subCatId = "";
      childCatId = "";
    }

    setFormData({
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      parentCategoryId: parentCatId,
      subCategoryId: subCatId,
      childCategoryId: childCatId,
      categoryId: childCatId || subCatId || parentCatId || p.categoryId,
      primaryMaterial: p.woodType || p.primaryMaterial || "Seasoned Mahogany",
      dimensions: p.dimensions || "6.5 ft x 6.0 ft",
      finishType: p.finish || p.finishType || "High-Gloss Italian PU",
      hardware: p.hardware || "Hydraulic Soft-Closing German Fittings",
      seasoningMethod: p.seasoningMethod || "Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)",
      regularPrice,
      basePrice: sellingPrice,
      oldPrice: hasDiscount ? p.oldPriceBDT : "",
      discountMode: hasDiscount ? "PERCENT" : "NONE",
      discountPercent,
      badge: p.badge || "",
      couponCode: hasDiscount ? "" : (p.couponCode || ""),
      isOffer: Boolean(p.isOffer),
      isNewArrival: Boolean(p.isNewArrival),
      isShowroomClassic: Boolean(p.isShowroomClassic),
      stockCount: p.stockCount,
      description: p.description || "",
      images: p.imageObjects && p.imageObjects.length > 0 ? p.imageObjects : (p.images && p.images.length > 0 ? p.images : [p.image]),
      isActive: p.isActive,
      inStock: p.inStock,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      const targetCatId =
        formData.childCategoryId ||
        formData.subCategoryId ||
        formData.parentCategoryId ||
        formData.categoryId ||
        categories[0]?.id;
      if (!targetCatId) {
        throw new Error("Please select or create a category first.");
      }

      const finalBasePrice = Number(formData.basePrice || formData.regularPrice || 0);
      const hasDiscountToSave =
        formData.discountMode !== "NONE" &&
        formData.oldPrice &&
        Number(formData.oldPrice) > finalBasePrice;
      const finalOldPrice = hasDiscountToSave ? Number(formData.oldPrice) : null;
      // Coupons strictly permitted ONLY on Fixed Price products. Discounted products CANNOT have coupon codes.
      const finalCouponCode = hasDiscountToSave
        ? null
        : (formData.couponCode && formData.couponCode.trim() ? formData.couponCode.trim() : null);
      const rawBadge = (formData.badge || "").trim();
      const finalBadge = (formData.discountMode === "NONE" && rawBadge.includes("% OFF"))
        ? null
        : (rawBadge || null);

      if (editingProduct) {
        // PUT update
        await adminAuthService.fetch(`/api/v1/admin/products/${editingProduct.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...formData,
            categoryId: targetCatId,
            basePrice: finalBasePrice,
            oldPrice: finalOldPrice,
            couponCode: finalCouponCode,
            badge: finalBadge,
            isOffer: Boolean(formData.isOffer),
            isNewArrival: Boolean(formData.isNewArrival),
            isShowroomClassic: Boolean(formData.isShowroomClassic),
            stockCount: Number(formData.stockCount || 5),
          }),
        });
      } else {
        // POST create
        const autoSlug = (formData.slug || formData.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await adminAuthService.fetch("/api/v1/admin/products", {
          method: "POST",
          body: JSON.stringify({
            ...formData,
            categoryId: targetCatId,
            slug: autoSlug,
            basePrice: finalBasePrice,
            oldPrice: finalOldPrice,
            couponCode: finalCouponCode,
            badge: finalBadge,
            isOffer: Boolean(formData.isOffer),
            isNewArrival: Boolean(formData.isNewArrival),
            isShowroomClassic: Boolean(formData.isShowroomClassic),
            initialStock: Number(formData.initialStock || formData.stockCount || 5),
          }),
        });
      }

      setIsModalOpen(false);
      productService.invalidateCache();
      fetchProducts();
    } catch (err) {
      setModalError(err.message || "Failed to save product");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProduct = async (id, name, hasOrders = false) => {
    const confirmMsg = hasOrders
      ? `Product "${name}" has customer order history. Deleting it will safely move it to Archive so customer records remain intact. Proceed?`
      : `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await adminAuthService.fetch(`/api/v1/admin/products/${id}`, {
        method: "DELETE",
      });
      productService.invalidateCache();
      fetchProducts();
    } catch (err) {
      alert(err.message || "Failed to delete product");
    }
  };

  const handleRestoreProduct = async (id, name) => {
    try {
      await adminAuthService.fetch(`/api/v1/admin/products/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: true, inStock: true }),
      });
      productService.invalidateCache();
      fetchProducts();
    } catch (err) {
      alert(err.message || "Failed to restore product");
    }
  };

  const handleQuickTogglePlacement = async (productId, field) => {
    try {
      const res = await adminAuthService.fetch(`/api/v1/admin/products/${productId}/toggle-placement`, {
        method: "PATCH",
        body: JSON.stringify({ field }),
      });
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, [field]: res.data[field] } : p))
        );
        productService.invalidateCache();
      }
    } catch (err) {
      alert(`Failed to update placement: ${err.message}`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    if (action === "delete" && !window.confirm(`Delete/Archive ${selectedIds.length} selected products?`)) {
      return;
    }
    setBulkLoading(true);
    try {
      await adminAuthService.fetch("/api/v1/admin/products/bulk", {
        method: "POST",
        body: JSON.stringify({ productIds: selectedIds, action }),
      });
      setSelectedIds([]);
      productService.invalidateCache();
      fetchProducts();
    } catch (err) {
      alert(err.message || "Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div>
      {/* Title & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
            {activeTab === "attributes" ? "Manage Product Attributes & Variants" : "Furniture Catalog & SKU Management"}
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            {activeTab === "attributes" ? "Configure Timber Species, Bed Dimensions, and Polish Finishes." : `${totalCount} Authentic Kinglet products loaded from real database records.`}
          </p>
        </div>

        {activeTab === "products" && (
          <button
            onClick={handleOpenCreateModal}
            style={{
              padding: "10px 18px",
              background: "#ef4444",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>➕</span>
            <span>Add New Furniture Piece</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", marginBottom: "20px" }}>
        <button
          onClick={() => setSearchParams({})}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "transparent",
            borderBottom: activeTab === "products" ? "3px solid #ef4444" : "3px solid transparent",
            color: activeTab === "products" ? "#ef4444" : "#64748b",
            fontWeight: activeTab === "products" ? 800 : 600,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          🅿️ All Products ({totalCount})
        </button>
        <button
          onClick={() => setSearchParams({ tab: "attributes" })}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "transparent",
            borderBottom: activeTab === "attributes" ? "3px solid #ef4444" : "3px solid transparent",
            color: activeTab === "attributes" ? "#ef4444" : "#64748b",
            fontWeight: activeTab === "attributes" ? 800 : 600,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          ⚙️ Manage Attributes ({attributes.length})
        </button>
      </div>

      {/* ====================================================================== */}
      {/* ATTRIBUTES TAB */}
      {/* ====================================================================== */}
      {activeTab === "attributes" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          {attrLoading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#64748b", gridColumn: "1 / -1" }}>Loading attributes...</div>
          ) : attributes.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8", gridColumn: "1 / -1" }}>No attributes found.</div>
          ) : (
            attributes.map((attr) => (
              <div key={attr.id} style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 2px" }}>{attr.name}</h3>
                    <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>code: {attr.code}</span>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: "#f1f5f9", color: "#334155" }}>
                    {attr.values?.length || 0} Options
                  </span>
                </div>

                {/* Values list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                  {(attr.values || []).map((val) => (
                    <div key={val.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{val.value}</span>
                      <button
                        onClick={() => handleDeleteAttributeValue(val.id)}
                        style={{ background: "none", border: "none", color: "#dc2626", fontSize: "12px", cursor: "pointer", fontWeight: 700 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new value input */}
                <form
                  onSubmit={(e) => handleAddAttributeValue(e, attr.id)}
                  style={{ display: "flex", gap: "8px" }}
                >
                  <input
                    type="text"
                    placeholder={`Add new ${attr.name.toLowerCase()}...`}
                    value={newValForm.attrId === attr.id ? newValForm.value : ""}
                    onChange={(e) => setNewValForm({ attrId: attr.id, value: e.target.value, code: "" })}
                    style={{ flexGrow: 1, padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", outline: "none" }}
                  />
                  <button
                    type="submit"
                    style={{ padding: "6px 12px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    + Add
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      )}

      {/* ====================================================================== */}
      {/* PRODUCTS TAB */}
      {/* ====================================================================== */}
      {activeTab === "products" && (
        <div>
          {/* Status Tabs Bar */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px", alignItems: "center" }}>
            {[
              { id: "ALL", label: "All Products" },
              { id: "ACTIVE", label: "Active Only" },
              { id: "ARCHIVED", label: "Archived / Inactive" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: statusFilter === tab.id ? "1px solid #ef4444" : "1px solid #e2e8f0",
                  background: statusFilter === tab.id ? "#fef2f2" : "#ffffff",
                  color: statusFilter === tab.id ? "#ef4444" : "#64748b",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter and Search Bar */}
          <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              {/* Search Input */}
              <div style={{ flexGrow: 1, minWidth: "220px" }}>
            <input
              type="text"
              placeholder="Search by SKU, Product Name or Material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "13px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#fff", outline: "none" }}
          >
            <option value="ALL">All Categories &amp; Subcategories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.level === 3
                  ? `\u00A0\u00A0\u00A0\u00A0↳ 🏷️ ${c.name}`
                  : c.level === 2
                  ? `\u00A0\u00A0↳ 📂 ${c.name}`
                  : `📁 ${c.name}`}
              </option>
            ))}
          </select>

          {/* Timber / Wood Filter */}
          <select
            value={woodFilter}
            onChange={(e) => {
              setWoodFilter(e.target.value);
              setPage(1);
            }}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#fff", outline: "none" }}
          >
            <option value="ALL">All Authentic Timbers</option>
            {AUTHENTIC_WOODS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setPage(1);
            }}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#fff", outline: "none" }}
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN">In Stock (&gt;2)</option>
            <option value="LOW">Low Stock (1-2)</option>
            <option value="OUT">Out of Stock (0)</option>
          </select>

          {/* Storefront Placement Filter */}
          <select
            value={placementFilter}
            onChange={(e) => {
              setPlacementFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "8px 12px",
              border: placementFilter !== "ALL" ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "13px",
              background: placementFilter !== "ALL" ? "#fef2f2" : "#fff",
              color: placementFilter !== "ALL" ? "#b91c1c" : "#0f172a",
              fontWeight: placementFilter !== "ALL" ? 700 : 500,
              outline: "none",
            }}
          >
            <option value="ALL">All Placements (সকল সেকশন)</option>
            <option value="OFFER">🔥 Winter Flash Sale & Offers</option>
            <option value="NEW_ARRIVAL">✨ Curated New Arrivals</option>
            <option value="SHOWROOM_CLASSIC">🏛️ Trending Showroom Classics</option>
          </select>

          <button
            type="submit"
            style={{
              padding: "8px 16px",
              background: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Filter
          </button>
        </form>

        {/* Bulk Actions Bar if items selected */}
        {selectedIds.length > 0 && (
          <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>
              {selectedIds.length} products selected:
            </span>
            <button
              onClick={() => handleBulkAction("activate")}
              disabled={bulkLoading}
              style={{ padding: "4px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction("deactivate")}
              disabled={bulkLoading}
              style={{ padding: "4px 10px", background: "#64748b", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            >
              Deactivate / Archive
            </button>
            <button
              onClick={() => handleBulkAction("delete")}
              disabled={bulkLoading}
              style={{ padding: "4px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
            <div style={{ width: "32px", height: "32px", border: "3px solid #ef4444", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <div>Loading catalog items...</div>
          </div>
        ) : error ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#dc2626" }}>
            Error: {error}
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
            No products found matching your search or filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "12px 16px", width: "36px" }}>
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={selectedIds.length === products.length && products.length > 0}
                    />
                  </th>
                  <th style={{ padding: "12px 16px" }}>Furniture Piece</th>
                  <th style={{ padding: "12px 16px" }}>SKU</th>
                  <th style={{ padding: "12px 16px" }}>Category</th>
                  <th style={{ padding: "12px 16px" }}>Authentic Timber</th>
                  <th style={{ padding: "12px 16px" }}>Price (BDT)</th>
                  <th style={{ padding: "12px 16px" }}>Stock</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Storefront Placements</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const isLow = p.stockCount > 0 && p.stockCount <= 2;
                  const isOut = p.stockCount <= 0;
                  const prodHasDiscount = Boolean(p.oldPriceBDT && Number(p.oldPriceBDT) > Number(p.priceBDT));

                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", background: isSelected ? "#fef2f2" : "transparent" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(p.id)}
                        />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <img
                            src={p.image}
                            alt={p.name}
                            width="44"
                            height="44"
                            loading="lazy"
                            style={{ width: "44px", height: "44px", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{p.name}</div>
                            <div style={{ fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", marginTop: "3px", flexWrap: "wrap" }}>
                              <span>{p.dimensions}</span>
                              {p.badge && (
                                <span
                                  style={{
                                    background: "#0f172a",
                                    color: "#ffffff",
                                    fontSize: "9px",
                                    fontWeight: 800,
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    letterSpacing: "0.4px",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {p.badge}
                                </span>
                              )}
                              {p.oldPriceBDT && p.oldPriceBDT > p.priceBDT && (
                                <span
                                  style={{
                                    background: "#fee2e2",
                                    color: "#dc2626",
                                    fontSize: "9px",
                                    fontWeight: 800,
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "2px",
                                  }}
                                >
                                  🔥 {Math.round(((p.oldPriceBDT - p.priceBDT) / p.oldPriceBDT) * 100)}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "12px", color: "#475569" }}>
                        {p.sku}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>
                        {p.categoryPath ? (
                          <div>
                            <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "12.5px" }}>{p.category}</div>
                            <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "2px" }}>{p.categoryPath}</div>
                          </div>
                        ) : (
                          p.category
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, color: "#334155" }}>
                          {p.woodType}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>৳{Number(p.priceBDT ?? p.basePrice ?? 0).toLocaleString()}</div>
                        {p.oldPriceBDT && Number(p.oldPriceBDT) > Number(p.priceBDT ?? p.basePrice ?? 0) ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                            <span style={{ fontSize: "11px", color: "#94a3b8", textDecoration: "line-through" }}>
                              ৳{Number(p.oldPriceBDT).toLocaleString()}
                            </span>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626" }}>
                              (-{Math.round(((Number(p.oldPriceBDT) - Number(p.priceBDT ?? p.basePrice ?? 0)) / Number(p.oldPriceBDT)) * 100)}%)
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "2px", fontWeight: 500 }}>
                            Fixed Regular Price
                          </div>
                        )}
                        {!prodHasDiscount && p.couponCode && (
                          <div style={{ marginTop: "3px" }}>
                            <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "9px", fontWeight: 800, padding: "1px 5px", borderRadius: "3px" }}>
                              🎟️ {p.couponCode}
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            background: isOut ? "#fef2f2" : isLow ? "#fef3c7" : "#ecfdf5",
                            color: isOut ? "#dc2626" : isLow ? "#b45309" : "#059669",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {p.stockCount} in factory
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: p.isActive ? "#10b981" : "#94a3b8" }}>
                          {p.isActive ? "● Active" : "○ Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", minWidth: "180px" }}>
                          {/* Offer / Flash Sale Pill */}
                          <button
                            type="button"
                            onClick={() => handleQuickTogglePlacement(p.id, "isOffer")}
                            title={p.isOffer ? "Currently in Winter Mega Flash Sale & Offers. Click to remove." : "Click to showcase in Winter Mega Flash Sale & Offers"}
                            style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "10px",
                              fontWeight: 700,
                              cursor: "pointer",
                              border: p.isOffer ? "1.5px solid #ef4444" : "1px dashed #cbd5e1",
                              background: p.isOffer ? "#fee2e2" : "#f8fafc",
                              color: p.isOffer ? "#b91c1c" : "#94a3b8",
                              transition: "all 0.15s ease",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <span>🔥</span>
                            <span>{p.isOffer ? "Offer" : "+ Offer"}</span>
                          </button>

                          {/* New Arrival Pill */}
                          <button
                            type="button"
                            onClick={() => handleQuickTogglePlacement(p.id, "isNewArrival")}
                            title={p.isNewArrival ? "Currently in Curated New Arrivals. Click to remove." : "Click to showcase in Curated New Arrivals"}
                            style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "10px",
                              fontWeight: 700,
                              cursor: "pointer",
                              border: p.isNewArrival ? "1.5px solid #10b981" : "1px dashed #cbd5e1",
                              background: p.isNewArrival ? "#d1fae5" : "#f8fafc",
                              color: p.isNewArrival ? "#047857" : "#94a3b8",
                              transition: "all 0.15s ease",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <span>✨</span>
                            <span>{p.isNewArrival ? "New Arrival" : "+ New"}</span>
                          </button>

                          {/* Showroom Classic Pill */}
                          <button
                            type="button"
                            onClick={() => handleQuickTogglePlacement(p.id, "isShowroomClassic")}
                            title={p.isShowroomClassic ? "Currently in Trending Showroom Classics. Click to remove." : "Click to showcase in Trending Showroom Classics"}
                            style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "10px",
                              fontWeight: 700,
                              cursor: "pointer",
                              border: p.isShowroomClassic ? "1.5px solid #8b5cf6" : "1px dashed #cbd5e1",
                              background: p.isShowroomClassic ? "#ede9fe" : "#f8fafc",
                              color: p.isShowroomClassic ? "#6d28d9" : "#94a3b8",
                              transition: "all 0.15s ease",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <span>🏛️</span>
                            <span>{p.isShowroomClassic ? "Showroom" : "+ Classic"}</span>
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            onClick={() => handlePreviewFromRow(p)}
                            style={{
                              padding: "4px 8px",
                              background: "#f0fdf4",
                              border: "1px solid #86efac",
                              borderRadius: "4px",
                              fontSize: "12px",
                              cursor: "pointer",
                              color: "#166534",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="Preview product on storefront"
                          >
                            <Eye size={12} />
                            Preview
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            style={{ padding: "4px 8px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px", cursor: "pointer", color: "#0f172a", fontWeight: 600 }}
                          >
                            Edit
                          </button>
                          {!p.isActive && (
                            <button
                              onClick={() => handleRestoreProduct(p.id, p.name)}
                              style={{ padding: "4px 8px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "4px", fontSize: "12px", cursor: "pointer", color: "#059669", fontWeight: 600 }}
                              title="Restore to Active Storefront"
                            >
                              Restore
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name, p.hasOrders)}
                            style={{ padding: "4px 8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", fontSize: "12px", cursor: "pointer", color: "#dc2626", fontWeight: 600 }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Strip */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "#f8fafc" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Showing <strong>{products.length > 0 ? (page - 1) * limit + 1 : 0}</strong> - <strong>{Math.min(page * limit, totalCount)}</strong> of <strong>{totalCount}</strong> products
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                style={{ padding: "2px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              style={{ padding: "4px 8px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", fontSize: "12px", opacity: page <= 1 ? 0.5 : 1 }}
              title="First Page"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ padding: "4px 10px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", fontSize: "12px", opacity: page <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((pNum) => pNum === 1 || pNum === totalPages || Math.abs(pNum - page) <= 2)
              .map((pNum, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && pNum - prev > 1;
                return (
                  <React.Fragment key={pNum}>
                    {showEllipsis && <span style={{ padding: "0 4px", color: "#94a3b8" }}>...</span>}
                    <button
                      onClick={() => setPage(pNum)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: page === pNum ? 700 : 500,
                        border: page === pNum ? "1px solid #0f172a" : "1px solid #cbd5e1",
                        background: page === pNum ? "#0f172a" : "#fff",
                        color: page === pNum ? "#fff" : "#334155",
                        cursor: "pointer",
                      }}
                    >
                      {pNum}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{ padding: "4px 10px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: "12px", opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              style={{ padding: "4px 8px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: "12px", opacity: page >= totalPages ? 0.5 : 1 }}
              title="Last Page"
            >
              »
            </button>
          </div>
        </div>
      </div>
      </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "calc(100vh - 32px)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              overflow: "hidden",
            }}
          >
            {/* Modal Fixed Header */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#ffffff",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  {editingProduct ? `Edit "${editingProduct.name}"` : "Create New Kinglet Furniture Piece"}
                </h2>
                <button
                  type="button"
                  onClick={handlePreviewFromModal}
                  style={{
                    padding: "4px 10px",
                    background: "#f0fdf4",
                    border: "1px solid #86efac",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#166534",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Live Storefront Preview of this Product"
                >
                  <Eye size={13} />
                  <span>Storefront Preview</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  cursor: "pointer",
                  color: "#64748b",
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div style={{ margin: "14px 24px 0", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: "8px", fontSize: "13px", flexShrink: 0 }}>
                {modalError}
              </div>
            )}

            <form
              onSubmit={handleSaveProduct}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: "1 1 auto",
                overflow: "hidden",
                margin: 0,
              }}
            >
              {/* Scrollable Form Body */}
              <div
                style={{
                  padding: "20px 24px",
                  overflowY: "auto",
                  flex: "1 1 auto",
                }}
              >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Category Hierarchy Selection (3-Tier: Parent -> Subcategory -> Child Category) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                {/* 1. Parent Category */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    1. Parent Category (মেইন ক্যাটাগরি) *
                  </label>
                  <select
                    value={formData.parentCategoryId || ""}
                    onChange={(e) => handleParentCategoryChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      border: "1.5px solid #2563eb",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#1e3a8a",
                      background: "#eff6ff",
                      boxSizing: "border-box",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {parentCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        📁 {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Subcategory */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    2. Subcategory (সাব-ক্যাটাগরি) *
                  </label>
                  <select
                    value={formData.subCategoryId || ""}
                    onChange={(e) => handleSubCategoryChange(e.target.value)}
                    disabled={currentSubcategories.length === 0}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      border: currentSubcategories.length === 0 ? "1px solid #cbd5e1" : "1.5px solid #059669",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: currentSubcategories.length === 0 ? "#94a3b8" : "#065f46",
                      background: currentSubcategories.length === 0 ? "#f8fafc" : "#ecfdf5",
                      boxSizing: "border-box",
                      cursor: currentSubcategories.length === 0 ? "not-allowed" : "pointer",
                      outline: "none",
                    }}
                  >
                    {currentSubcategories.length > 0 ? (
                      <>
                        {currentSubcategories.map((sc) => (
                          <option key={sc.id} value={sc.id}>
                            📂 {sc.name}
                          </option>
                        ))}
                      </>
                    ) : (
                      <option value="">(No Subcategories)</option>
                    )}
                  </select>
                </div>

                {/* 3. Child Category / Specific Type */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    3. Child Category (চাইল্ড ক্যাটাগরি / ধরন)
                  </label>
                  <select
                    value={formData.childCategoryId || ""}
                    onChange={(e) => handleChildCategoryChange(e.target.value)}
                    disabled={currentChildCategories.length === 0}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      border: currentChildCategories.length === 0 ? "1px solid #cbd5e1" : "1.5px solid #d97706",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: currentChildCategories.length === 0 ? "#94a3b8" : "#92400e",
                      background: currentChildCategories.length === 0 ? "#f8fafc" : "#fffbeb",
                      boxSizing: "border-box",
                      cursor: currentChildCategories.length === 0 ? "not-allowed" : "pointer",
                      outline: "none",
                    }}
                  >
                    {currentChildCategories.length > 0 ? (
                      <>
                        <option value="">-- All {selectedSubObj?.name || "Items"} (General) --</option>
                        {currentChildCategories.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            🏷️ {ch.name}
                          </option>
                        ))}
                      </>
                    ) : (
                      <option value="">(No specific sub-types)</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Craftsmanship & Materials Specifications Section */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "14px 16px",
                  marginBottom: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🪵 Craftsmanship & Materials Specifications</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#2563eb", background: "#dbeafe", padding: "1px 7px", borderRadius: "4px" }}>
                      Live PDP Specs
                    </span>
                  </label>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Reflects directly in "Craftsmanship & Materials" table on Product Page
                  </span>
                </div>

                {/* Row 1: Timber, Dimensions, Finish */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                  {/* Authentic Timber Selection */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                      Primary Timber (কাঁচামাল / কাঠ) *
                    </label>
                    <select
                      value={formData.primaryMaterial}
                      onChange={(e) => setFormData({ ...formData, primaryMaterial: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "13px",
                        background: "#fff",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    >
                      {AUTHENTIC_WOODS.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  {/* Finish Type */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                      Finish Type (পলিশ ও ফিনিশিং) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.finishType}
                      onChange={(e) => setFormData({ ...formData, finishType: e.target.value })}
                      placeholder="e.g. High-Gloss Italian PU"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "13px",
                        background: "#fff",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Dimensions */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                      Dimensions (L × W × H পরিমাপ) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      placeholder="e.g. 6.5 ft x 6.0 ft (King Size)"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "13px",
                        background: "#fff",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Row 2: Hardware & Seasoning Method */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {/* Hardware */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                      Hardware & Fittings (হার্ডওয়্যার ও ফিটিংস) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.hardware}
                      onChange={(e) => setFormData({ ...formData, hardware: e.target.value })}
                      placeholder="e.g. Hydraulic Soft-Closing German Fittings"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "13px",
                        background: "#fff",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Seasoning Method */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                      Seasoning Method (সিজনিং ও ট্রিটমেন্ট পদ্ধতি) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.seasoningMethod}
                      onChange={(e) => setFormData({ ...formData, seasoningMethod: e.target.value })}
                      placeholder="e.g. Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "13px",
                        background: "#fff",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Live Category Hierarchy Breadcrumb Chip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11.5px",
                  color: "#475569",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: "#64748b", fontWeight: 600 }}>Active Storefront Placement:</span>
                <span style={{ fontWeight: 800, color: "#1d4ed8", background: "#dbeafe", padding: "1px 6px", borderRadius: "3px" }}>
                  📁 {selectedParentObj?.name || "Parent Category"}
                </span>
                <span style={{ color: "#94a3b8" }}>➔</span>
                <span style={{ fontWeight: 800, color: selectedSubObj ? "#047857" : "#475569", background: selectedSubObj ? "#d1fae5" : "#e2e8f0", padding: "1px 6px", borderRadius: "3px" }}>
                  📂 {selectedSubObj ? selectedSubObj.name : "(No Subcategory)"}
                </span>
                {selectedChildObj ? (
                  <>
                    <span style={{ color: "#94a3b8" }}>➔</span>
                    <span style={{ fontWeight: 800, color: "#92400e", background: "#fef3c7", padding: "1px 6px", borderRadius: "3px" }}>
                      🏷️ {selectedChildObj.name}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                    (All {selectedSubObj?.name || selectedParentObj?.name || "Items"})
                  </span>
                )}
              </div>

              {/* MASTER PRICING & DISCOUNT CONTROLLER */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "16px 18px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>💰</span> Pricing, Discount &amp; Coupon Strategy (মূল্য ও ছাড় নির্ধারণ)
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                      Set a fixed regular price, or apply an automatic percentage % discount, and attach coupon offers.
                    </div>
                  </div>
                </div>

                {/* 1. Regular / Fixed Price & Mode Selection */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                      Regular / Fixed Price (রেগুলার মূল্য - ৳) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.regularPrice || ""}
                      onChange={(e) => handleRegularPriceChange(e.target.value)}
                      placeholder="e.g. 31000"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        border: "1.5px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#0f172a",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Discount Strategy Mode Selection */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                      Pricing / Discount Option (ডিসকাউন্ট অপশন)
                    </label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleSetDiscountMode("NONE")}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          borderRadius: "6px",
                          cursor: "pointer",
                          border: formData.discountMode === "NONE" ? "1.5px solid #10b981" : "1px solid #cbd5e1",
                          background: formData.discountMode === "NONE" ? "#ecfdf5" : "#ffffff",
                          color: formData.discountMode === "NONE" ? "#047857" : "#475569",
                          transition: "all 0.15s ease",
                        }}
                      >
                        🏷️ Fixed Price
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetDiscountMode("PERCENT")}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          borderRadius: "6px",
                          cursor: "pointer",
                          border: formData.discountMode === "PERCENT" ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                          background: formData.discountMode === "PERCENT" ? "#fef2f2" : "#ffffff",
                          color: formData.discountMode === "PERCENT" ? "#b91c1c" : "#475569",
                          transition: "all 0.15s ease",
                        }}
                      >
                        🔥 % Discount
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetDiscountMode("CUSTOM")}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          borderRadius: "6px",
                          cursor: "pointer",
                          border: formData.discountMode === "CUSTOM" ? "1.5px solid #8b5cf6" : "1px solid #cbd5e1",
                          background: formData.discountMode === "CUSTOM" ? "#f5f3ff" : "#ffffff",
                          color: formData.discountMode === "CUSTOM" ? "#6d28d9" : "#475569",
                          transition: "all 0.15s ease",
                        }}
                      >
                        💵 Custom
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Mode Sub-Controls */}
                {formData.discountMode === "NONE" && (
                  <div
                    style={{
                      background: formData.couponCode ? "#fffbeb" : "#ecfdf5",
                      border: formData.couponCode ? "1px solid #fde68a" : "1px solid #a7f3d0",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                      gap: "10px",
                    }}
                  >
                    <div style={{ fontSize: "12px", color: formData.couponCode ? "#92400e" : "#065f46" }}>
                      <strong>Fixed Regular Price:</strong> ৳{Number(formData.regularPrice || 0).toLocaleString()} (No strikethrough price shown).
                      {formData.couponCode && (
                        <span> + 🎟️ Coupon <strong>{formData.couponCode}</strong> can be applied at checkout for additional savings!</span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        background: formData.couponCode ? "#f59e0b" : "#10b981",
                        color: "#fff",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formData.couponCode ? "FIXED + COUPON" : "FIXED (NO DISCOUNT)"}
                    </span>
                  </div>
                )}

                {formData.discountMode === "PERCENT" && (
                  <div
                    style={{
                      background: "#fff1f2",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#991b1b" }}>
                        Discount Percentage (% ছাড় দিন):
                      </label>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[5, 10, 12, 15, 17, 20, 25].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleSetDiscountPercent(pct)}
                            style={{
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "10.5px",
                              fontWeight: 700,
                              cursor: "pointer",
                              border: Number(formData.discountPercent) === pct ? "1.5px solid #ef4444" : "1px solid #fca5a5",
                              background: Number(formData.discountPercent) === pct ? "#ef4444" : "#ffffff",
                              color: Number(formData.discountPercent) === pct ? "#ffffff" : "#b91c1c",
                            }}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "12px", alignItems: "center" }}>
                      <div style={{ position: "relative" }}>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={formData.discountPercent || ""}
                          onChange={(e) => handleSetDiscountPercent(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "7px 22px 7px 10px",
                            border: "1.5px solid #ef4444",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: 800,
                            color: "#991b1b",
                            boxSizing: "border-box",
                          }}
                        />
                        <span style={{ position: "absolute", right: "8px", top: "7px", fontSize: "12px", fontWeight: 800, color: "#ef4444" }}>%</span>
                      </div>

                      <div style={{ fontSize: "12px", color: "#991b1b", lineHeight: "1.4" }}>
                        Regular: <strong>৳{Number(formData.regularPrice || 0).toLocaleString()}</strong>
                        {" → "}
                        <span style={{ color: "#dc2626", fontWeight: 800 }}>{formData.discountPercent}% OFF (Save ৳{(Number(formData.oldPrice || 0) - Number(formData.basePrice || 0)).toLocaleString()})</span>
                        {" → "}
                        Customer Pays: <strong style={{ color: "#166534", fontSize: "14px" }}>৳{Number(formData.basePrice || 0).toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {formData.discountMode === "CUSTOM" && (
                  <div
                    style={{
                      background: "#f5f3ff",
                      border: "1px solid #ddd6fe",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "center" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#6d28d9", marginBottom: "3px" }}>
                          Final Customer Selling Price (বিক্রয়মূল্য - ৳) *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.basePrice || ""}
                          onChange={(e) => handleCustomSellingPriceChange(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "7px 10px",
                            border: "1.5px solid #8b5cf6",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: 800,
                            color: "#6d28d9",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      <div style={{ fontSize: "12px", color: "#5b21b6" }}>
                        <div>Strikethrough Price: <strong>৳{Number(formData.oldPrice || 0).toLocaleString()}</strong></div>
                        <div style={{ marginTop: "2px", color: "#7c3aed", fontWeight: 700 }}>
                          Calculated: {formData.discountPercent}% OFF (Save ৳{(Number(formData.oldPrice || 0) - Number(formData.basePrice || 0)).toLocaleString()})
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Coupon Offer Attachment - STRICTLY FIXED PRICE ONLY */}
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #cbd5e1" }}>
                  {formData.discountMode === "NONE" ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: "5px" }}>
                          <span>🎟️</span> Promotional Coupon Offer (কুপন অফার সংযুক্তকরণ)
                        </label>
                        <span style={{ fontSize: "11px", color: "#059669", fontWeight: 700 }}>Fixed Price Only</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "center" }}>
                        <div>
                          <input
                            type="text"
                            list="coupon-code-presets"
                            value={formData.couponCode || ""}
                            onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                            placeholder="কুপন কোড লিখুন বা ড্রপডাউন সিলেক্ট করুন (e.g. KINGLET15)"
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: formData.couponCode ? "1.5px solid #f59e0b" : "1.5px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "12px",
                              background: formData.couponCode ? "#fffbeb" : "#fff",
                              color: formData.couponCode ? "#92400e" : "#0f172a",
                              fontWeight: formData.couponCode ? 800 : 500,
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                          <datalist id="coupon-code-presets">
                            <option value="KINGLET15">KINGLET15 (Save 15% Extra on orders over ৳50,000)</option>
                            <option value="KINGLET10">KINGLET10 (Save 10% Extra on orders over ৳20,000)</option>
                            <option value="KINGLET2026">KINGLET2026 (Flat ৳2,000 Off on orders over ৳40,000)</option>
                            <option value="EIDSPECIAL">EIDSPECIAL (Special 10% Eid Discount)</option>
                            <option value="NEWYEAR">NEWYEAR (Special New Year Discount)</option>
                          </datalist>
                        </div>

                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {formData.couponCode ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ color: "#b45309", fontWeight: 700 }}>
                                ✓ Active Coupon: <strong>{formData.couponCode}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, couponCode: "" })}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#ef4444",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                  padding: 0,
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            "কুপন কোড দিলে কাস্টমার প্রোডাক্ট পেইজে ১-ক্লিক 'Copy Coupon' ব্যানার দেখতে পাবে।"
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px dashed #cbd5e1",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>🏷️</span>
                      <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                        <strong style={{ color: "#334155" }}>কুপন অপশন প্রযোজ্য নয়:</strong> কুপন শুধুমাত্র Fixed Price প্রোডাক্টের জন্য প্রযোজ্য। ডিসকাউন্ট যুক্ত প্রোডাক্টে কোনো কুপন অপশন থাকবে না।
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Badges & Discount Overlay Section */}
              {(() => {
                const baseNum = Number(formData.basePrice) || 0;
                const oldNum = (formData.discountMode !== "NONE" && formData.oldPrice) ? Number(formData.oldPrice) : 0;
                const modalDiscount = (baseNum > 0 && oldNum > baseNum)
                  ? Math.round(((oldNum - baseNum) / oldNum) * 100)
                  : 0;

                return (
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          🏷️ Product Badges (Storefront Card Overlays)
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Control the top-left badges shown over the product photo on the website.
                        </div>
                      </div>

                      {/* Live Preview Box */}
                      <div
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          alignItems: "flex-start",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          minWidth: "120px",
                        }}
                      >
                        <span style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Live Preview
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                          {modalDiscount > 0 ? (
                            <span
                              style={{
                                background: "linear-gradient(135deg, #ff2e34 0%, #ec2226 100%)",
                                color: "#ffffff",
                                fontSize: "10px",
                                fontWeight: 800,
                                padding: "2px 7px",
                                borderRadius: "5px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                alignSelf: "flex-start",
                                boxShadow: "0 2px 6px rgba(236, 34, 38, 0.35)",
                              }}
                            >
                              🔥 {modalDiscount}% OFF
                            </span>
                          ) : null}

                          {formData.badge ? (
                            <span
                              style={{
                                background: "rgba(15, 23, 42, 0.9)",
                                color: "#ffffff",
                                fontSize: "9.5px",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: "5px",
                                display: "inline-flex",
                                alignItems: "center",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                                alignSelf: "flex-start",
                              }}
                            >
                              {formData.badge}
                            </span>
                          ) : null}

                          {!formData.badge && modalDiscount === 0 && (
                            <span style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>
                              (No active badges)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Custom Badge Tag Input */}
                    <div style={{ marginBottom: "10px" }}>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                        Custom Badge Tag (Dark Pill Badge)
                      </label>
                      <input
                        type="text"
                        value={formData.badge || ""}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        placeholder="e.g. HOT, BESTSELLER, NEW, GRAND ENTRY, MANAGING DIRECTOR"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                          boxSizing: "border-box",
                          background: "#ffffff",
                        }}
                      />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>
                        Quick Select Presets (Click to set):
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {["HOT", "BESTSELLER", "NEW", "GRAND ENTRY", "MANAGING DIRECTOR", "POPULAR", "LIMITED", "EXCLUSIVE"].map((tag) => {
                          const isSelected = (formData.badge || "").trim().toUpperCase() === tag;
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setFormData({ ...formData, badge: tag })}
                              style={{
                                padding: "4px 9px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                                border: isSelected ? "1px solid #0f172a" : "1px solid #cbd5e1",
                                background: isSelected ? "#0f172a" : "#ffffff",
                                color: isSelected ? "#ffffff" : "#334155",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {tag}
                            </button>
                          );
                        })}
                        {formData.badge && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, badge: "" })}
                            style={{
                              padding: "4px 9px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              border: "1px dashed #ef4444",
                              background: "#fef2f2",
                              color: "#dc2626",
                            }}
                          >
                            ✕ Clear Badge
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Discount Badge Guidance */}
                    <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #e2e8f0", fontSize: "11px", color: "#64748b" }}>
                      💡 <strong style={{ color: "#334155" }}>Discount Badge (🔥 {modalDiscount > 0 ? `${modalDiscount}% OFF` : "% OFF"}):</strong> Automatically appears whenever <strong>Old Strikethrough Price</strong> is higher than <strong>Base Price</strong>.
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    {editingProduct ? "Inventory Stock Count" : "Initial Stock Count"}
                  </label>
                  <input
                    type="number"
                    value={editingProduct ? formData.stockCount : formData.initialStock}
                    onChange={(e) =>
                      editingProduct
                        ? setFormData({ ...formData, stockCount: e.target.value })
                        : setFormData({ ...formData, initialStock: e.target.value })
                    }
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Dimensions / Sizing *</label>
                  <input
                    type="text"
                    required
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder="e.g. 6.5 ft x 6.0 ft (King Size) or 3-Door"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <ProductImageManager
                  productId={editingProduct?.id || "draft"}
                  images={formData.images}
                  onChange={(updatedImages) => setFormData({ ...formData, images: updatedImages })}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Craftsmanship Description *</label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              {/* STOREFRONT PAGE & SECTION PLACEMENT */}
              <div
                style={{
                  background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "18px 20px",
                  marginBottom: "24px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>🎯</span> Storefront Page & Section Placement (কোন কোন পেজ ও সেকশনে দেখাবে)
                    </h4>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
                    Select where this product should be showcased on the customer website:
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
                  {/* 1. Winter Mega Flash Sale & Offers */}
                  <div
                    onClick={() => setFormData({ ...formData, isOffer: !formData.isOffer })}
                    style={{
                      cursor: "pointer",
                      padding: "14px",
                      borderRadius: "10px",
                      border: formData.isOffer ? "2px solid #ef4444" : "1.5px solid #cbd5e1",
                      background: formData.isOffer ? "#fff1f2" : "#ffffff",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.isOffer}
                      onChange={() => {}}
                      style={{ marginTop: "2px", cursor: "pointer", accentColor: "#ef4444", width: "16px", height: "16px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 800, fontSize: "13px", color: formData.isOffer ? "#b91c1c" : "#1e293b" }}>
                          🔥 Flash Sale & Offers
                        </span>
                        {formData.isOffer && (
                          <span style={{ fontSize: "9px", fontWeight: 800, background: "#ef4444", color: "#fff", padding: "1px 6px", borderRadius: "10px" }}>
                            SHOWING
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b", lineHeight: "1.4" }}>
                        Homepage <strong>WINTER MEGA FLASH SALE</strong> grid, <strong>/offers</strong> &amp; <strong>/flash-sale</strong> pages.
                      </p>
                    </div>
                  </div>

                  {/* 2. Curated New Arrivals */}
                  <div
                    onClick={() => setFormData({ ...formData, isNewArrival: !formData.isNewArrival })}
                    style={{
                      cursor: "pointer",
                      padding: "14px",
                      borderRadius: "10px",
                      border: formData.isNewArrival ? "2px solid #10b981" : "1.5px solid #cbd5e1",
                      background: formData.isNewArrival ? "#f0fdf4" : "#ffffff",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.isNewArrival}
                      onChange={() => {}}
                      style={{ marginTop: "2px", cursor: "pointer", accentColor: "#10b981", width: "16px", height: "16px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 800, fontSize: "13px", color: formData.isNewArrival ? "#047857" : "#1e293b" }}>
                          ✨ New Arrival Products
                        </span>
                        {formData.isNewArrival && (
                          <span style={{ fontSize: "9px", fontWeight: 800, background: "#10b981", color: "#fff", padding: "1px 6px", borderRadius: "10px" }}>
                            SHOWING
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b", lineHeight: "1.4" }}>
                        Homepage <strong>CURATED 2026 COLLECTION / NEW ARRIVAL PRODUCTS</strong> luxury showcase with category tabs.
                      </p>
                    </div>
                  </div>

                  {/* 3. Trending Showroom Classics */}
                  <div
                    onClick={() => setFormData({ ...formData, isShowroomClassic: !formData.isShowroomClassic })}
                    style={{
                      cursor: "pointer",
                      padding: "14px",
                      borderRadius: "10px",
                      border: formData.isShowroomClassic ? "2px solid #8b5cf6" : "1.5px solid #cbd5e1",
                      background: formData.isShowroomClassic ? "#f5f3ff" : "#ffffff",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.isShowroomClassic}
                      onChange={() => {}}
                      style={{ marginTop: "2px", cursor: "pointer", accentColor: "#8b5cf6", width: "16px", height: "16px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 800, fontSize: "13px", color: formData.isShowroomClassic ? "#6d28d9" : "#1e293b" }}>
                          🏛️ Showroom Classics
                        </span>
                        {formData.isShowroomClassic && (
                          <span style={{ fontSize: "9px", fontWeight: 800, background: "#8b5cf6", color: "#fff", padding: "1px 6px", borderRadius: "10px" }}>
                            SHOWING
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b", lineHeight: "1.4" }}>
                        Homepage <strong>TRENDING SHOWROOM CLASSICS</strong> (Customer Favorites) grid.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "24px", marginBottom: "24px", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active in Storefront
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  />
                  Mark Available for Order
                </label>
              </div>
              </div>

              {/* Fixed Modal Pinned Footer (Always visible at bottom) */}
              <div
                style={{
                  padding: "14px 24px",
                  borderTop: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexShrink: 0,
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                {/* Storefront Preview Options */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handlePreviewFromModal}
                    title="Live customer preview with current form values"
                    style={{
                      padding: "9px 16px",
                      background: "#f0fdf4",
                      border: "1.5px solid #86efac",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#166534",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 1px 3px rgba(16, 185, 129, 0.15)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Eye size={15} />
                    <span>👁️ Live Preview</span>
                  </button>

                  {(formData.slug || editingProduct?.slug) && (
                    <a
                      href={`/product/${formData.slug || editingProduct?.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open public product page in new browser tab"
                      style={{
                        padding: "9px 13px",
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#1e40af",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Live URL ↗</span>
                    </a>
                  )}
                </div>

                {/* Modal Action Buttons */}
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: "9px 18px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      color: "#334155",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    style={{
                      padding: "9px 24px",
                      background: modalLoading ? "#94a3b8" : "linear-gradient(135deg, #ff2e34 0%, #ec2226 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: modalLoading ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 12px rgba(236, 34, 38, 0.25)",
                    }}
                  >
                    {modalLoading ? "Saving Product..." : editingProduct ? "Save Changes" : "Create Product"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOREFRONT LIVE PREVIEW MODAL OVERLAY */}
      {previewProduct && (
        <div style={{ position: "relative", zIndex: 3000 }}>
          {/* Admin floating preview banner header */}
          <div
            style={{
              position: "fixed",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 3100,
              background: "rgba(15, 23, 42, 0.96)",
              backdropFilter: "blur(10px)",
              color: "#ffffff",
              padding: "10px 22px",
              borderRadius: "9999px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              fontSize: "13px",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
              <strong style={{ color: "#f8fafc" }}>Storefront Live Preview</strong>
            </span>
            <span style={{ color: "#64748b" }}>•</span>
            <span style={{ color: "#cbd5e1", fontSize: "12px" }}>
              Customer View Simulation
            </span>
            {previewProduct.slug && (
              <a
                href={`/product/${previewProduct.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#60a5fa",
                  textDecoration: "underline",
                  fontSize: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Open Public Page ↗
              </a>
            )}
            <button
              onClick={() => setPreviewProduct(null)}
              style={{
                background: "#ef4444",
                border: "none",
                color: "#ffffff",
                padding: "4px 12px",
                borderRadius: "9999px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
                marginLeft: "6px",
              }}
            >
              Close Preview ✕
            </button>
          </div>

          <KingletProductModal
            product={previewProduct}
            onClose={() => setPreviewProduct(null)}
            onAddToCart={(prod, qty, finish, size) => {
              alert(`[Preview Mode]: Customer would add ${qty}x "${prod.name}" (${finish}, ${size}) to Cart.`);
            }}
            onToggleWishlist={() => {
              alert("[Preview Mode]: Customer added this item to their Wishlist.");
            }}
            onOpenEmi={() => {
              alert("[Preview Mode]: Customer clicked to inspect 0% EMI financing plans.");
            }}
          />
        </div>
      )}
    </div>
  );
}

