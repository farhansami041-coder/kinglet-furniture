import React, { useState, useEffect } from "react";
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  MessageCircle,
  CheckCircle,
  MapPin,
  User,
} from "lucide-react";
import confetti from "canvas-confetti";
import { BRAND_INFO } from "../../data/kingletData";

export default function KingletCartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currency,
}) {
  const [shippingZone, setShippingZone] = useState("dhaka");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isOrdered, setIsOrdered] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Lock body and html scroll when cart drawer is open so background never scrolls
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

  const subtotalBDT = cartItems.reduce(
    (sum, item) => sum + (Number(item.priceBDT ?? item.basePrice ?? item.price ?? 0) * (Number(item.quantity) || 1)),
    0
  );
  // Delivery charge is finalized based on exact customer location
  const shippingFeeBDT = 0;
  const grandTotalBDT = subtotalBDT + shippingFeeBDT;

  const displayGrandTotal =
    currency === "USD"
      ? `$${Math.round(grandTotalBDT / 122).toLocaleString()}`
      : `৳${grandTotalBDT.toLocaleString()}`;

  const handleCheckout = (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      alert("Please enter your name, phone number, and delivery address.");
      return;
    }

    const genOrderNo = `KGL-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderNumber(genOrderNo);
    setIsOrdered(true);

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ec2226", "#0f172a", "#d4af37"],
      });
    } catch {
      // safe fallback
    }
  };

  const whatsappOrderSync = () => {
    const itemsSummary = cartItems
      .map(
        (item) =>
          `• ${item.name} (${item.quantity || 1}x, Finish: ${
            item.selectedFinish || "Mahogany"
          }) - ৳${(item.priceBDT * (item.quantity || 1)).toLocaleString()}`
      )
      .join("\n");

    const message = encodeURIComponent(
      `Hello Kinglet Furniture, I have placed an order online (Order #${orderNumber}):\n\nName: ${customerName}\nPhone: ${customerPhone}\nAddress: ${customerAddress}\nZone: ${
        shippingZone === "dhaka" ? "Inside Dhaka" : "Outside Dhaka"
      }\nPayment: ${paymentMethod.toUpperCase()}\n\nItems:\n${itemsSummary}\n\nTotal: ${displayGrandTotal}\n\nPlease confirm delivery schedule.`
    );
    window.open(`https://wa.me/${BRAND_INFO.whatsapp}?text=${message}`, "_blank");
  };

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
          maxWidth: "490px",
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
        {/* Drawer Header */}
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
              <ShoppingBag size={19} color="#ec2226" />
            </div>
            <div>
              <h3 style={{ fontSize: "17.5px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Your Furniture Cart
              </h3>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                {cartItems.length} {cartItems.length === 1 ? "piece" : "pieces"} selected
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close cart"
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

        {/* Drawer Body - Scrollable content area */}
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
          {isOrdered ? (
            <div style={{ textAlign: "center", padding: "40px 10px" }}>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "#ecfdf5",
                  border: "2px solid #10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <CheckCircle size={40} color="#10b981" />
              </div>

              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#10b981",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "4px",
                }}
              >
                Reservation Confirmed
              </div>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: "800",
                  color: "#0f172a",
                  marginBottom: "6px",
                }}
              >
                Order Placed Successfully!
              </h3>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  background: "#fef2f2",
                  color: "#ec2226",
                  fontSize: "13px",
                  fontWeight: "800",
                  marginBottom: "16px",
                  border: "1px solid #fecaca",
                }}
              >
                Order #{orderNumber}
              </div>

              <p
                style={{
                  fontSize: "13.5px",
                  color: "#64748b",
                  lineHeight: "1.6",
                  marginBottom: "28px",
                  maxWidth: "380px",
                  margin: "0 auto 28px",
                }}
              >
                Thank you, <strong>{customerName}</strong>. Our Kinglet concierge team will reach out at{" "}
                <strong>{customerPhone}</strong> to verify specifications and confirm your delivery date.
              </p>

              <button
                onClick={whatsappOrderSync}
                style={{
                  width: "100%",
                  padding: "13px",
                  marginBottom: "12px",
                  background: "#25D366",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "700",
                  fontSize: "13.5px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(37, 211, 102, 0.3)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1ebd58")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#25D366")}
              >
                <MessageCircle size={18} />
                <span>Confirm Order via WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  onClearCart();
                  setIsOrdered(false);
                  onClose();
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#f1f5f9",
                  color: "#0f172a",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
              >
                Continue Browsing
              </button>
            </div>
          ) : cartItems.length === 0 ? (
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
                <ShoppingBag size={32} color="#94a3b8" />
              </div>
              <h4 style={{ fontSize: "18px", color: "#0f172a", fontWeight: "700", marginBottom: "6px" }}>
                Your cart is empty
              </h4>
              <p
                style={{
                  fontSize: "13.5px",
                  color: "#64748b",
                  marginBottom: "24px",
                  maxWidth: "320px",
                  margin: "0 auto 24px",
                }}
              >
                Browse our luxury seasoned mahogany and mahogany collections to add pieces to your home.
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
                Explore Collections
              </button>
            </div>
          ) : (
            <div>
              {/* Item List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "22px" }}>
                {cartItems.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
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
                      src={item.image}
                      alt={item.name}
                      width="68"
                      height="68"
                      loading="lazy"
                      style={{
                        width: "68px",
                        height: "68px",
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
                          onClick={() => onRemoveItem(item.id)}
                          aria-label="Remove item"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#94a3b8",
                            cursor: "pointer",
                            padding: "2px",
                            transition: "color 0.2s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                        {item.selectedFinish || "Mahogany Finish"} • {item.woodType || "Seasoned Mahogany"}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "10px",
                        }}
                      >
                        <span style={{ fontSize: "14.5px", fontWeight: "800", color: "#ec2226" }}>
                          ৳{(item.priceBDT * (item.quantity || 1)).toLocaleString()}
                        </span>

                        {/* Quantity Counter Buttons */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                            overflow: "hidden",
                          }}
                        >
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))
                            }
                            aria-label="Decrease quantity"
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#0f172a",
                              width: "26px",
                              height: "26px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "13px",
                              fontWeight: "700",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            -
                          </button>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#0f172a",
                              padding: "0 8px",
                            }}
                          >
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                            aria-label="Increase quantity"
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#0f172a",
                              width: "26px",
                              height: "26px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "13px",
                              fontWeight: "700",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Region Selection Card */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "14px",
                  borderRadius: "14px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "12.5px",
                    fontWeight: "800",
                    color: "#0f172a",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <MapPin size={14} color="#ec2226" />
                  <span>Delivery Region:</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div
                    onClick={() => setShippingZone("dhaka")}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      border: shippingZone === "dhaka" ? "2px solid #ec2226" : "1.5px solid #e2e8f0",
                      background: shippingZone === "dhaka" ? "rgba(236, 34, 38, 0.05)" : "#ffffff",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12.5px",
                        fontWeight: "700",
                        color: shippingZone === "dhaka" ? "#ec2226" : "#0f172a",
                      }}
                    >
                      Inside Dhaka
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      Based on Location
                    </div>
                  </div>

                  <div
                    onClick={() => setShippingZone("outside")}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      border: shippingZone === "outside" ? "2px solid #ec2226" : "1.5px solid #e2e8f0",
                      background: shippingZone === "outside" ? "rgba(236, 34, 38, 0.05)" : "#ffffff",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12.5px",
                        fontWeight: "700",
                        color: shippingZone === "outside" ? "#ec2226" : "#0f172a",
                      }}
                    >
                      Outside Dhaka
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      Based on Location (64 Districts)
                    </div>
                  </div>
                </div>
              </div>

              {/* Express Checkout Form */}
              <form onSubmit={handleCheckout} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "800",
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <User size={14} color="#ec2226" />
                  <span>Customer & Delivery Details:</span>
                </div>

                <input
                  id="cart-customer-name"
                  name="customerName"
                  type="text"
                  placeholder="Your Full Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  style={{
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "11px 14px",
                    color: "#0f172a",
                    fontSize: "13px",
                    fontWeight: "500",
                    outline: "none",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#ec2226";
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(236, 34, 38, 0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />

                <input
                  id="cart-customer-phone"
                  name="customerPhone"
                  type="tel"
                  placeholder="Phone Number (e.g. 017XXXXXXXX) *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  style={{
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "11px 14px",
                    color: "#0f172a",
                    fontSize: "13px",
                    fontWeight: "500",
                    outline: "none",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#ec2226";
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(236, 34, 38, 0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />

                <textarea
                  id="cart-customer-address"
                  name="customerAddress"
                  placeholder="Delivery Address (Apt, Road, Area in Dhaka/BD) *"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  required
                  rows={2}
                  style={{
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "11px 14px",
                    color: "#0f172a",
                    fontSize: "13px",
                    fontWeight: "500",
                    outline: "none",
                    resize: "none",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#ec2226";
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(236, 34, 38, 0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />

                {/* Payment Selection */}
                <div style={{ marginTop: "4px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#475569",
                      marginBottom: "6px",
                    }}
                  >
                    Payment Preference:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    {[
                      { id: "cod", label: "Cash on Delivery" },
                      { id: "bkash", label: "bKash / Nagad" },
                      { id: "card", label: "Card / Bank EMI" },
                    ].map((pm) => (
                      <button
                        type="button"
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id)}
                        style={{
                          padding: "9px 6px",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          borderRadius: "8px",
                          background: paymentMethod === pm.id ? "#ec2226" : "#f1f5f9",
                          border: paymentMethod === pm.id ? "1px solid #ec2226" : "1px solid #e2e8f0",
                          color: paymentMethod === pm.id ? "#ffffff" : "#475569",
                          cursor: "pointer",
                          transition: "all 0.18s ease",
                          boxShadow: paymentMethod === pm.id ? "0 2px 8px rgba(236,34,38,0.25)" : "none",
                        }}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pricing Summary */}
                <div
                  style={{
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "14px",
                    marginTop: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "13px",
                      color: "#64748b",
                      marginBottom: "6px",
                    }}
                  >
                    <span>Items Subtotal:</span>
                    <span style={{ color: "#0f172a", fontWeight: "600" }}>
                      ৳{subtotalBDT.toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "13px",
                      color: "#64748b",
                      marginBottom: "10px",
                    }}
                  >
                    <span>Delivery Charge:</span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#b45309",
                        background: "#fef3c7",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      Based on Location
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "8px",
                      borderTop: "1px dashed #e2e8f0",
                    }}
                  >
                    <span style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                      Grand Total:
                    </span>
                    <span style={{ fontSize: "20px", fontWeight: "900", color: "#ec2226" }}>
                      {displayGrandTotal}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  style={{
                    marginTop: "14px",
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "14.5px",
                    fontWeight: "800",
                    background: "linear-gradient(135deg, #ff3b30 0%, #ec2226 100%)",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 6px 18px rgba(236, 34, 38, 0.35)",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1.5px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(236, 34, 38, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(236, 34, 38, 0.35)";
                  }}
                >
                  <span>Confirm Order Reservation</span>
                  <ArrowRight size={17} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
