import React, { useEffect } from "react";
import { X, Heart, ShoppingBag, Trash2 } from "lucide-react";

export default function KingletWishlistDrawer({
  isOpen,
  onClose,
  wishlistItems,
  wishlistProducts,
  onRemoveFromWishlist,
  onRemoveItem,
  onAddToCart,
}) {
  const displayItems = wishlistProducts || wishlistItems || [];
  const removeItem = onRemoveFromWishlist || onRemoveItem;
  // Lock body and html scroll when wishlist drawer is open
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
        zIndex: 2500,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "flex-end",
        animation: "fadeIn 0.2s ease-out",
        overscrollBehavior: "contain",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          height: "100vh",
          maxHeight: "100vh",
          background: "#ffffff",
          borderLeft: "1px solid #e2e8f0",
          boxShadow: "-20px 0 60px rgba(15, 23, 42, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: "20px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Heart size={19} color="#ec2226" fill="#ec2226" />
            </div>
            <div>
              <h3 style={{ fontSize: "17.5px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Saved Wishlist
              </h3>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                {displayItems.length} {displayItems.length === 1 ? "piece" : "pieces"} saved
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close wishlist"
            style={{
              background: "#f1f5f9",
              border: "none",
              color: "#64748b",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.color = "#ec2226";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body - Scrollable Area */}
        <div
          className="custom-modal-scroll"
          style={{
            flex: "1 1 0%",
            minHeight: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            padding: "20px",
          }}
        >
          {displayItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "50%",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Heart size={32} color="#94a3b8" />
              </div>
              <h4 style={{ fontSize: "18px", color: "#0f172a", fontWeight: "700", marginBottom: "6px" }}>
                No saved pieces yet
              </h4>
              <p
                style={{
                  fontSize: "13.5px",
                  color: "#64748b",
                  marginBottom: "24px",
                  maxWidth: "300px",
                  margin: "0 auto 24px",
                }}
              >
                Click the heart icon (❤️) on any piece in the gallery to curate your private favorites list.
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: "10px 24px",
                  background: "linear-gradient(135deg, #ff3b30 0%, #ec2226 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "9999px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(236, 34, 38, 0.35)",
                }}
              >
                Browse Furniture
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {displayItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: "14px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "12px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <img
                    src={item.image || (Array.isArray(item.images) ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url) : null) || "/images/furniture-placeholder.svg"}
                    alt={item.name}
                    width="72"
                    height="72"
                    loading="lazy"
                    style={{
                      width: "72px",
                      height: "72px",
                      aspectRatio: "1 / 1",
                      objectFit: "cover",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/furniture-placeholder.svg";
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "700",
                          color: "#0f172a",
                          margin: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (removeItem) removeItem(item);
                        }}
                        aria-label={`Remove ${item.name} from wishlist`}
                        title="Remove from wishlist"
                        style={{
                          background: "#f1f5f9",
                          border: "none",
                          color: "#64748b",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#fee2e2";
                          e.currentTarget.style.color = "#dc2626";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f1f5f9";
                          e.currentTarget.style.color = "#64748b";
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ fontSize: "14px", fontWeight: "800", color: "#ec2226", marginTop: "4px" }}>
                      ৳{Number(item.priceBDT ?? item.basePrice ?? item.price ?? 0).toLocaleString()}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(item);
                        if (removeItem) removeItem(item);
                      }}
                      style={{
                        marginTop: "10px",
                        padding: "8px 14px",
                        fontSize: "12px",
                        fontWeight: "700",
                        borderRadius: "8px",
                        width: "100%",
                        background: "linear-gradient(135deg, #ff3b30 0%, #ec2226 100%)",
                        color: "#ffffff",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        boxShadow: "0 2px 8px rgba(236, 34, 38, 0.25)",
                        transition: "all 0.2s ease",
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
                      <ShoppingBag size={14} />
                      <span>Move to Cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
