import React, { useState, useEffect, useMemo } from "react";
import { X, Trash2, ShoppingBag, Plus, Search, Scale, ArrowLeftRight } from "lucide-react";
import { PRODUCTS } from "../../data/kingletData";
import { productService } from "../../utils/productService";

export default function KingletCompareDrawer({
  isOpen,
  onClose,
  compareItems = [],
  onToggleCompare,
  onRemoveFromCompare,
  onRemoveItem,
  onAddToCart,
  _currency,
}) {
  const removeItem = onRemoveFromCompare || onRemoveItem;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddingMore, setIsAddingMore] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState(PRODUCTS);

  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const res = await productService.getProducts({ limit: 120 });
        if (isMounted && res && Array.isArray(res.products) && res.products.length > 0) {
          const map = new Map();
          [...PRODUCTS, ...res.products].forEach((p) => {
            if (p && p.id) map.set(String(p.id), p);
          });
          setCatalogProducts(Array.from(map.values()));
        }
      } catch {
        // Fallback to static PRODUCTS
      }
    }
    if (isOpen) {
      loadCatalog();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const availableCandidates = useMemo(() => {
    return catalogProducts.filter(
      (p) => !compareItems.some((ci) => String(ci.id) === String(p.id))
    );
  }, [catalogProducts, compareItems]);

  const filteredCandidates = useMemo(() => {
    return availableCandidates.filter((p) => {
      const matchSearch =
        !searchTerm.trim() ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (p.woodType && p.woodType.toLowerCase().includes(searchTerm.toLowerCase().trim()));
      const matchCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [availableCandidates, searchTerm, selectedCategory]);

  // Lock body and html scroll when modal is open so only the card scrolls
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
      return () => {
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2600,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.2s ease-out",
        overscrollBehavior: "contain",
      }}
      onClick={onClose}
    >
      <div
        className="custom-modal-scroll"
        style={{
          width: "100%",
          maxWidth: "1050px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "20px",
          padding: "32px",
          position: "relative",
          maxHeight: "88vh",
          overflowY: "auto",
          overscrollBehavior: "contain",
          boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.25)",
          animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "#f1f5f9",
            border: "none",
            color: "#64748b",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            zIndex: 20,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fee2e2";
            e.currentTarget.style.color = "#ec2226";
            e.currentTarget.style.transform = "rotate(90deg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.color = "#64748b";
            e.currentTarget.style.transform = "rotate(0deg)";
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px", flexWrap: "wrap", gap: "12px", paddingRight: "40px" }}>
          <div>
            <div
              style={{
                fontSize: "11.5px",
                fontWeight: "800",
                color: "#ec2226",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                marginBottom: "4px",
              }}
            >
              SIDE-BY-SIDE SPECIFICATION AUDIT
            </div>
            <h3
              style={{
                fontSize: "25px",
                color: "#0f172a",
                fontWeight: "800",
                letterSpacing: "-0.5px",
                margin: 0,
              }}
            >
              Compare Furniture Designs ({compareItems.length})
            </h3>
            <p style={{ color: "#64748b", fontSize: "13.5px", margin: "4px 0 0" }}>
              Compare craftsmanship, timber specifications, and pricing side-by-side.
            </p>
          </div>

          {compareItems.length > 0 && compareItems.length < 4 && (
            <button
              type="button"
              onClick={() => setIsAddingMore(!isAddingMore)}
              style={{
                background: isAddingMore ? "#1e293b" : "linear-gradient(135deg, #ff3b30 0%, #ec2226 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(236, 34, 38, 0.25)",
                transition: "all 0.15s ease",
              }}
            >
              {isAddingMore ? <X size={14} /> : <Plus size={14} />}
              <span>{isAddingMore ? "Close Product Selector" : `+ Add Another Piece (${compareItems.length}/4)`}</span>
            </button>
          )}
        </div>

        {/* Quick Add More Tray when comparison has items */}
        {isAddingMore && compareItems.length < 4 && (
          <div style={{ background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: "14px", padding: "16px", marginBottom: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                Select Another Piece to Compare Side-by-Side:
              </div>
              <input
                id="compare-search-quick"
                name="compareSearchQuick"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search models..."
                style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", width: "220px", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px" }} className="custom-modal-scroll">
              {filteredCandidates.slice(0, 10).map((product) => {
                const prodPrice = Number(product.priceBDT ?? product.basePrice ?? product.price ?? 0);
                const prodImg = product.image || (Array.isArray(product.images) ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url) : null) || "/images/furniture-placeholder.svg";
                return (
                  <div
                    key={product.id}
                    style={{ flexShrink: 0, width: "165px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                  >
                    <div>
                      <img src={prodImg} alt={product.name} width="165" height="85" loading="lazy" style={{ width: "100%", height: "85px", objectFit: "cover", borderRadius: "6px", marginBottom: "6px" }} />
                      <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={product.name}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#ec2226", margin: "4px 0 6px" }}>
                        ৳{prodPrice.toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onToggleCompare) onToggleCompare(product);
                      }}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        background: "linear-gradient(135deg, #ff3b30 0%, #ec2226 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      + Add
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {compareItems.length === 0 ? (
          <div style={{ padding: "10px 0 20px" }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#fef2f2",
                  color: "#ec2226",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  fontSize: "24px",
                }}
              >
                ⚖️
              </div>
              <h4 style={{ fontSize: "20px", color: "#0f172a", fontWeight: "800", marginBottom: "6px" }}>
                No pieces selected for comparison
              </h4>
              <p style={{ color: "#64748b", fontSize: "14px", maxWidth: "520px", margin: "0 auto" }}>
                Select 2 or more furniture designs below to compare timber craftsmanship, dimensions, warranty, and pricing side-by-side.
              </p>
            </div>

            {/* Interactive Search & Filter Controls */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px 20px", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ position: "relative", flex: "1 1 260px" }}>
                  <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "11px" }} />
                  <input
                    id="compare-search-main"
                    name="compareSearchMain"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search furniture by name or wood..."
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 36px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      style={{ position: "absolute", right: "10px", top: "9px", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {[
                    { id: "all", label: "All Collections" },
                    { id: "bedroom", label: "Bedroom" },
                    { id: "living-room", label: "Living Room" },
                    { id: "dining", label: "Dining" },
                    { id: "door", label: "Doors" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: 700,
                        borderRadius: "20px",
                        border: selectedCategory === cat.id ? "1.5px solid #ec2226" : "1px solid #cbd5e1",
                        background: selectedCategory === cat.id ? "#fef2f2" : "#ffffff",
                        color: selectedCategory === cat.id ? "#ec2226" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                Showing {filteredCandidates.length} available furniture pieces to compare (click <strong style={{ color: "#ec2226" }}>+ Add to Compare</strong> to begin):
              </div>
            </div>

            {/* Available Products Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: "14px",
                maxHeight: "360px",
                overflowY: "auto",
                paddingRight: "6px",
                marginBottom: "20px",
              }}
              className="custom-modal-scroll"
            >
              {filteredCandidates.map((product) => {
                const prodPrice = Number(product.priceBDT ?? product.basePrice ?? product.price ?? 0);
                const prodImg = product.image || (Array.isArray(product.images) ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url) : null) || "/images/furniture-placeholder.svg";
                const prodWood = product.woodType || product.primaryMaterial || "Solid Hardwood";

                return (
                  <div
                    key={product.id}
                    style={{
                      background: "#ffffff",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#fca5a5";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(236, 34, 38, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "0 2px 6px rgba(15, 23, 42, 0.04)";
                    }}
                  >
                    <div>
                      <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden", marginBottom: "8px" }}>
                        <img
                          src={prodImg}
                          alt={product.name}
                          width="200"
                          height="120"
                          loading="lazy"
                          style={{ width: "100%", height: "120px", objectFit: "cover", display: "block" }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/furniture-placeholder.svg";
                          }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            bottom: "6px",
                            left: "6px",
                            background: "rgba(15, 23, 42, 0.8)",
                            color: "#fff",
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            textTransform: "capitalize",
                          }}
                        >
                          {product.category || "Furniture"}
                        </span>
                      </div>
                      <h5 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px", lineHeight: "1.3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={product.name}>
                        {product.name}
                      </h5>
                      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {prodWood}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 800, color: "#ec2226", marginBottom: "8px" }}>
                        ৳{prodPrice.toLocaleString()}
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleCompare && onToggleCompare(product)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "linear-gradient(135deg, #ff3b30 0%, #ec2226 100%)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          boxShadow: "0 2px 8px rgba(236, 34, 38, 0.25)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(236, 34, 38, 0.35)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(236, 34, 38, 0.25)";
                        }}
                      >
                        <Plus size={14} />
                        <span>+ Add to Compare</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                onClick={onClose}
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "9999px",
                  padding: "9px 22px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Close & Explore Furniture Gallery
              </button>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
                minWidth: "720px",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      width: "160px",
                      color: "#64748b",
                      fontWeight: "700",
                      background: "#f8fafc",
                      borderBottom: "2px solid #e2e8f0",
                      borderTopLeftRadius: "12px",
                    }}
                  >
                    Piece Overview
                  </th>
                  {compareItems.map((item, idx) => (
                    <th
                      key={item.id}
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        width: "230px",
                        verticalAlign: "top",
                        background: "#ffffff",
                        borderBottom: "2px solid #e2e8f0",
                        borderTopRightRadius: idx === compareItems.length - 1 ? "12px" : "0",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          marginBottom: "10px",
                          borderRadius: "12px",
                          overflow: "hidden",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          width="200"
                          height="150"
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "150px",
                            objectFit: "cover",
                            display: "block",
                            transition: "transform 0.3s ease",
                          }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/furniture-placeholder.svg";
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (removeItem) removeItem(item.id);
                          }}
                          title="Remove from comparison"
                          aria-label={`Remove ${item.name} from comparison`}
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            background: "rgba(255, 255, 255, 0.95)",
                            border: "none",
                            color: "#dc2626",
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                            transition: "all 0.2s ease",
                            zIndex: 10,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#ec2226";
                            e.currentTarget.style.color = "#ffffff";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.95)";
                            e.currentTarget.style.color = "#dc2626";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: "700",
                          color: "#0f172a",
                          lineHeight: "1.3",
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "800",
                          color: "#ec2226",
                          marginTop: "4px",
                        }}
                      >
                        ৳{Number(item.priceBDT ?? item.basePrice ?? item.price ?? 0).toLocaleString()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: "#fcfcfd" }}>
                  <td
                    style={{
                      padding: "14px 16px",
                      color: "#64748b",
                      fontWeight: "700",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#f8fafc",
                    }}
                  >
                    Category
                  </td>
                  {compareItems.map((item) => (
                    <td
                      key={item.id}
                      style={{
                        padding: "14px 16px",
                        color: "#0f172a",
                        fontWeight: "600",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {item.categoryLabel || item.category}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td
                    style={{
                      padding: "14px 16px",
                      color: "#64748b",
                      fontWeight: "700",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#f8fafc",
                    }}
                  >
                    Timber Input
                  </td>
                  {compareItems.map((item) => (
                    <td
                      key={item.id}
                      style={{
                        padding: "14px 16px",
                        color: "#0f172a",
                        fontWeight: "600",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {item.woodType}
                    </td>
                  ))}
                </tr>

                <tr style={{ background: "#fcfcfd" }}>
                  <td
                    style={{
                      padding: "14px 16px",
                      color: "#64748b",
                      fontWeight: "700",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#f8fafc",
                    }}
                  >
                    Dimensions
                  </td>
                  {compareItems.map((item) => (
                    <td
                      key={item.id}
                      style={{
                        padding: "14px 16px",
                        color: "#0f172a",
                        fontWeight: "600",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {item.dimensions}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td
                    style={{
                      padding: "14px 16px",
                      color: "#64748b",
                      fontWeight: "700",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#f8fafc",
                    }}
                  >
                    Warranty
                  </td>
                  {compareItems.map((item) => (
                    <td
                      key={item.id}
                      style={{
                        padding: "14px 16px",
                        color: "#0f172a",
                        fontWeight: "700",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "#ecfdf5",
                          color: "#059669",
                          fontSize: "12px",
                          fontWeight: "700",
                        }}
                      >
                        {item.warranty}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr style={{ background: "#fcfcfd" }}>
                  <td
                    style={{
                      padding: "14px 16px",
                      color: "#64748b",
                      fontWeight: "700",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#f8fafc",
                    }}
                  >
                    Delivery Timeline
                  </td>
                  {compareItems.map((item) => (
                    <td
                      key={item.id}
                      style={{
                        padding: "14px 16px",
                        color: "#0f172a",
                        fontWeight: "600",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {item.leadTime}
                    </td>
                  ))}
                </tr>

                {/* Add to Cart Actions */}
                <tr>
                  <td
                    style={{
                      padding: "18px 16px",
                      background: "#f8fafc",
                      borderBottomLeftRadius: "12px",
                    }}
                  />
                  {compareItems.map((item, idx) => (
                    <td
                      key={item.id}
                      style={{
                        padding: "18px 16px",
                        borderBottomRightRadius:
                          idx === compareItems.length - 1 ? "12px" : "0",
                      }}
                    >
                      <button
                        onClick={() => {
                          onAddToCart(item);
                          onClose();
                        }}
                        style={{
                          width: "100%",
                          padding: "11px 16px",
                          fontSize: "13px",
                          fontWeight: "700",
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #ff3b30 0%, #ec2226 100%)",
                          color: "#ffffff",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          boxShadow: "0 4px 14px rgba(236, 34, 38, 0.3)",
                          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow =
                            "0 6px 18px rgba(236, 34, 38, 0.45)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 14px rgba(236, 34, 38, 0.3)";
                        }}
                      >
                        <ShoppingBag size={15} />
                        <span>Add to Cart</span>
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
