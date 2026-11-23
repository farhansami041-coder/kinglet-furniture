import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, ChevronRight, Tag } from "lucide-react";
import { BANGLADESH_DIVISIONS } from "../data/kingletData";
import KingletSEO from "../components/Common/KingletSEO";

export default function CartPage({ cartItems, onUpdateQuantity, onRemoveItem }) {
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState("Dhaka");

  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  // Fixed Price vs Discounted Products discrimination
  const isItemDiscounted = (item) => {
    const base = Number(item.priceBDT ?? item.basePrice ?? item.price ?? 0);
    const old = Number(item.oldPriceBDT ?? item.oldPrice ?? 0);
    const pct = Number(item.discountPercent ?? 0);
    return (old > 0 && old > base) || pct > 0;
  };

  const fixedPriceItems = cartItems.filter((i) => !isItemDiscounted(i));
  const discountedItems = cartItems.filter((i) => isItemDiscounted(i));
  const hasFixedPriceItems = fixedPriceItems.length > 0;
  const allItemsDiscounted = cartItems.length > 0 && discountedItems.length === cartItems.length;
  const fixedPriceSubtotal = fixedPriceItems.reduce((acc, i) => acc + (Number(i.priceBDT ?? i.basePrice ?? i.price ?? 0) * (i.quantity || 1)), 0);

  const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.priceBDT ?? item.basePrice ?? item.price ?? 0) * (Number(item.quantity) || 1)), 0);
  
  const deliveryInfo = BANGLADESH_DIVISIONS.find((d) => d.name === selectedDivision) || BANGLADESH_DIVISIONS[0];
  const deliveryFee = 0; // Based on customer location & distance
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError(null);
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) return;

    if (!hasFixedPriceItems) {
      setCouponError("কুপন শুধুমাত্র ফিক্সড প্রাইসের (Regular Price) পণ্যে প্রযোজ্য। ডিসকাউন্ট থাকা পণ্যে কুপন ব্যবহার করা যাবে না।");
      return;
    }

    setCouponLoading(true);
    try {
      const res = await fetch("/api/v1/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          orderTotal: fixedPriceSubtotal,
          orderSubtotal: subtotal,
          items: cartItems.map((i) => ({ productId: String(i.id), quantity: i.quantity || 1 })),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setDiscountAmount(json.data.discountAmount || 0);
        setCouponApplied(true);
      } else {
        setDiscountAmount(0);
        setCouponApplied(false);
        setCouponError(json.message || "Invalid coupon code.");
      }
    } catch (err) {
      // Local fallback for KINGLET10 (strictly calculates on fixed price items)
      if (cleanCode === "KINGLET10") {
        const disc = Math.round(fixedPriceSubtotal * 0.10);
        setDiscountAmount(disc);
        setCouponApplied(true);
      } else {
        setCouponError("Could not validate coupon. Please check code.");
      }
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", padding: "30px 0 60px" }}>
      <KingletSEO
        title="Your Furniture Cart | Kinglet Bangladesh Ltd"
        description="Review your selected handcrafted mahogany furniture items and proceed to secure checkout."
        noindex={true}
      />
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>
          <Link to="/" style={{ color: "#374151", textDecoration: "none" }}>Home</Link>
          <ChevronRight size={13} />
          <span style={{ color: "#ec2226", fontWeight: "600" }}>Shopping Cart ({cartItems.length} items)</span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#111827", margin: "0 0 25px" }}>
          Your Furniture Shopping Cart
        </h1>

        {cartItems.length === 0 ? (
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🛍️</div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: "0 0 8px" }}>Your Cart is Empty</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 20px" }}>
              Explore Kinglet's handcrafted mahogany and mahogany collections to add pieces to your space.
            </p>
            <Link
              to="/category/all"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#ec2226",
                color: "#ffffff",
                padding: "10px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "700",
                textDecoration: "none",
              }}
            >
              <ShoppingBag size={16} /> Explore All Collections
            </Link>
          </div>
        ) : (
          <div className="cart-layout-grid">
            {/* Cart Items List */}
            <div className="cart-items-card" style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <div className="cart-table-header" style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "12px", marginBottom: "16px", fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" }}>
                <span>Item Details</span>
                <span style={{ textAlign: "center" }}>Quantity</span>
                <span style={{ textAlign: "right" }}>Total</span>
                <span></span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-table-row" style={{ alignItems: "center", paddingBottom: "18px", borderBottom: "1px solid #f3f4f6" }}>
                    {/* Item Info */}
                    <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        width="70"
                        height="70"
                        loading="lazy"
                        style={{ width: "70px", height: "70px", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/furniture-placeholder.svg"; }}
                      />
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: "#111827" }}>
                          <Link to={`/product/${item.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{item.name}</Link>
                        </h4>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>{item.woodType}</div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#ec2226", marginTop: "2px" }}>
                          ৳{item.priceBDT.toLocaleString()} each
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid #d1d5db", borderRadius: "6px", overflow: "hidden" }}>
                        <button
                          onClick={() => onUpdateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                          style={{ width: "28px", height: "30px", background: "#f3f4f6", border: "none", cursor: "pointer", fontWeight: "bold" }}
                        >
                          -
                        </button>
                        <span style={{ width: "32px", textAlign: "center", fontSize: "13px", fontWeight: "700" }}>
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                          style={{ width: "28px", height: "30px", background: "#f3f4f6", border: "none", cursor: "pointer", fontWeight: "bold" }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Total Price */}
                    <div style={{ textAlign: "right", fontSize: "15px", fontWeight: "800", color: "#111827" }}>
                      ৳{(item.priceBDT * (item.quantity || 1)).toLocaleString()}
                    </div>

                    {/* Delete */}
                    <div style={{ textAlign: "right" }}>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery District Calculator */}
              <div style={{ marginTop: "20px", padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>Select Delivery Division</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Kinglet transports via own protected logistics fleet</div>
                  </div>
                  <select
                    id="cart-delivery-division"
                    name="deliveryDivision"
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    style={{ padding: "7px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "600" }}
                  >
                    {BANGLADESH_DIVISIONS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} (৳{d.deliveryFee} • {d.deliveryDays})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Order Summary Card */}
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px", position: "sticky", top: "90px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#111827", margin: "0 0 16px" }}>Order Summary</h3>

              {/* Coupon Box - STRICTLY FOR FIXED PRICE ITEMS */}
              {allItemsDiscounted ? (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px dashed #fca5a5",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "#991b1b",
                    lineHeight: "1.4",
                  }}
                >
                  <Tag size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span>কুপন শুধুমাত্র ফিক্সড প্রাইসের (Regular Price) পণ্যে প্রযোজ্য। আপনার কার্টের সব পণ্য ইতিমধ্যেই বিশেষ ডিসকাউন্টে রয়েছে।</span>
                </div>
              ) : (
                <>
                  <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                    <div style={{ position: "relative", flexGrow: 1 }}>
                      <Tag size={14} color="#9ca3af" style={{ position: "absolute", left: "10px", top: "11px" }} />
                      <input
                        id="cart-coupon-input"
                        name="couponCode"
                        type="text"
                        placeholder="Coupon code (KINGLET10)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px 8px 30px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "12px", textTransform: "uppercase" }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={couponLoading}
                      style={{ background: "#111827", color: "#ffffff", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: couponLoading ? "wait" : "pointer" }}
                    >
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </form>
                  {discountedItems.length > 0 && (
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "12px" }}>
                      💡 কুপন ছাড় শুধুমাত্র কার্টের ফিক্সড প্রাইস পণ্যের ওপর (৳{fixedPriceSubtotal.toLocaleString()}) প্রযোজ্য হবে।
                    </div>
                  )}
                </>
              )}

              {couponError && (
                <div style={{ fontSize: "11px", color: "#ef4444", fontWeight: "600", marginBottom: "14px" }}>
                  ⚠ {couponError}
                </div>
              )}

              {couponApplied && (
                <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                  ✓ 10% Kinglet VIP discount applied (-৳{discountAmount.toLocaleString()})
                </div>
              )}

              {/* Price Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderBottom: "1px solid #e5e7eb", paddingBottom: "14px", marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#4b5563" }}>
                  <span>Items Subtotal</span>
                  <span style={{ fontWeight: "700", color: "#111827" }}>৳{subtotal.toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#16a34a" }}>
                    <span>Coupon Discount</span>
                    <span>-৳{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                  <span style={{ color: "#4b5563" }}>Delivery ({selectedDivision})</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#b45309", background: "#fef3c7", padding: "2px 6px", borderRadius: "4px" }}>
                    Based on Location
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#111827" }}>Grand Total</span>
                <span style={{ fontSize: "22px", fontWeight: "900", color: "#ec2226" }}>৳{total.toLocaleString()}</span>
              </div>

              {/* Proceed to Checkout CTA */}
              <button
                onClick={() => navigate("/checkout")}
                style={{
                  width: "100%",
                  height: "46px",
                  background: "#ec2226",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(236,34,38,0.25)",
                }}
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center", marginTop: "14px", fontSize: "11px", color: "#6b7280" }}>
                <ShieldCheck size={14} color="#16a34a" /> 100% Safe & Secure SSL Encrypted Checkout
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
