import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, ChevronRight, Copy, Check, UserCheck, ShieldCheck, ArrowRight, Printer, AlertCircle, Smartphone, Tag } from "lucide-react";
import { BANGLADESH_DIVISIONS, BRAND_INFO } from "../data/kingletData";
import { getCurrentUser, getCustomerToken, apiGetPaymentConfig, createOrder } from "../utils/accountService";
import KingletPrintableInvoiceModal from "../components/Finance/KingletPrintableInvoiceModal";
import KingletSEO from "../components/Common/KingletSEO";
import { EMI_PLANS, BD_BANKS, calculateEmi } from "../utils/emiCalculator";

export default function CheckoutPage({ cartItems, onClearCart }) {
  const _navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBkash, setCopiedBkash] = useState(false);
  const [trxId, setTrxId] = useState("");
  const [trxError, setTrxError] = useState("");
  const [codAdvanceChannel, setCodAdvanceChannel] = useState("gateway"); // "gateway" | "manual"
  const [emiTenure, setEmiTenure] = useState("12");
  const [senderAccount, setSenderAccount] = useState("");
  const [paymentConfig, setPaymentConfig] = useState({
    codAdvanceBdt: 5000,
    bkashMerchantNumber: "+8801676-900442",
    bankAccountDetails: "Kinglet Furniture & Interior",
    emiTenures: [3, 6, 9, 12, 18, 24, 30, 36],
    emiGatewayConfigured: false,
  });
  const [phoneError, setPhoneError] = useState("");
  const [submitError, setSubmitError] = useState(null);
  const [lastSavedOrder, setLastSavedOrder] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("coupon") || "";
    } catch {
      return "";
    }
  });
  const [appliedCouponData, setAppliedCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    altPhone: "",
    email: "",
    division: "Dhaka",
    district: "Dhaka City",
    thana: "Mirpur / Gulshan",
    address: "",
    deliveryMethod: "express",
    paymentMethod: "cod",
    notes: "",
  });

  // Auto-fill customer details & load dynamic payment configuration
  useEffect(() => {
    apiGetPaymentConfig().then((cfg) => {
      if (cfg && cfg.codAdvanceBdt !== undefined) setPaymentConfig(cfg);
    });
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || user.name || prev.fullName,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
        address: user.address || prev.address,
        division: user.division || prev.division,
        district: user.district || prev.district,
      }));
    }
  }, []);

  // Dynamic Shipping Methods configured from Admin Panel
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/orders/shipping-methods")
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setShippingMethods(json.data);
          setSelectedShippingMethod(json.data[0]);
        }
      })
      .catch((err) => console.warn("Could not load dynamic shipping methods:", err))
      .finally(() => setShippingLoading(false));
  }, []);

  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderInvoice, setOrderInvoice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockAlert, setStockAlert] = useState(null);

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
  const deliveryInfo = BANGLADESH_DIVISIONS.find((d) => d.name === formData.division) || BANGLADESH_DIVISIONS[0];
  const deliveryFee = selectedShippingMethod ? Number(selectedShippingMethod.baseRate || 0) : 0;
  const couponDiscount = appliedCouponData ? (appliedCouponData.discountAmountBDT || appliedCouponData.discountAmount || 0) : 0;
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);
  const COD_ADVANCE_BDT = Number(paymentConfig.codAdvanceBdt) || 5000;
  const isCodSelected = formData.paymentMethod === "cod";
  const codAdvanceAmount = isCodSelected && grandTotal > 0 ? Math.min(COD_ADVANCE_BDT, grandTotal) : 0;
  const codRemainingDue = isCodSelected ? Math.max(0, grandTotal - codAdvanceAmount) : grandTotal;

  const handleApplyCoupon = async (codeToApply) => {
    const cleanCode = (typeof codeToApply === "string" ? codeToApply : couponCode).trim().toUpperCase();
    if (!cleanCode) return;
    setCouponError(null);

    if (!hasFixedPriceItems) {
      setAppliedCouponData(null);
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
          items: cartItems.map((item) => ({
            productId: String(item.id),
            categoryId: item.categoryId || null,
            quantity: item.quantity || 1,
          })),
        }),
      });
      const json = await res.json();
      if (json.success && json.data && json.data.valid) {
        setAppliedCouponData(json.data);
        setCouponCode(cleanCode);
      } else {
        setAppliedCouponData(null);
        setCouponError(json.message || "Invalid coupon code.");
      }
    } catch {
      setAppliedCouponData(null);
      setCouponError("Could not validate coupon. Please check code.");
    } finally {
      setCouponLoading(false);
    }
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const paramCode = params.get("coupon");
      if (paramCode && subtotal > 0 && hasFixedPriceItems && !appliedCouponData) {
        handleApplyCoupon(paramCode);
      }
    } catch {
      // Non-blocking
    }
  }, [subtotal, hasFixedPriceItems]);

  const handleCopyCode = () => {
    if (!orderInvoice) return;
    navigator.clipboard.writeText(orderInvoice);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyBkash = () => {
    const cleanNum = String(paymentConfig.bkashMerchantNumber || "+8801676-900442").replace(/[^+\d]/g, "");
    navigator.clipboard.writeText(cleanNum);
    setCopiedBkash(true);
    setTimeout(() => setCopiedBkash(false), 2500);
  };

  const validatePhone = (phone) => {
    const cleaned = (phone || "").replace(/[-\s+]/g, "");
    return /^(01[3-9]\d{8}|8801[3-9]\d{8})$/.test(cleaned);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneError("");
    setTrxError("");
    setStockAlert(null);
    setSubmitError(null);

    if (cartItems.length === 0) {
      alert("Your shopping cart is empty.");
      return;
    }

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      alert("Please fill in your name, contact phone number, and delivery address.");
      return;
    }

    if (!validatePhone(formData.phone)) {
      setPhoneError("সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)");
      return;
    }

    if (isCodSelected && codAdvanceChannel === "manual" && trxId.trim().length < 4) {
      setTrxError(`৳${(codAdvanceAmount || COD_ADVANCE_BDT).toLocaleString()} সিকিউরিটি অ্যাডভান্স পেমেন্টের সঠিক Transaction ID (কমপক্ষে ৪ অক্ষর) দিন অথবা Online Gateway ব্যবহার করুন।`);
      return;
    }

    const cleanedPhone = (formData.phone || "").replace(/[-\s+]/g, "");
    const formattedPhone = cleanedPhone.startsWith("88") ? cleanedPhone.slice(2) : cleanedPhone;

    setIsSubmitting(true);

    try {
      // 1. Revalidate Real-time Factory Stock & Prices
      const preparedApiItems = cartItems.map((item) => ({
        productId: String(item.id),
        variantId: item.variantId || null,
        quantity: item.quantity || 1,
      }));

      try {
        const revalRes = await fetch("/api/v1/cart/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: preparedApiItems }),
        });
        const revalJson = await revalRes.json();

        if (revalJson.success && revalJson.data && !revalJson.data.allValid) {
          const invalidItems = revalJson.data.items.filter((i) => !i.valid);
          const messages = invalidItems.map((i) => `• ${i.name}: ${i.reason}`).join("\n");
          setStockAlert(messages);
          setIsSubmitting(false);
          return;
        }
      } catch (revalErr) {
        console.warn("Stock revalidation network skip:", revalErr.message);
      }

      // 2. Submit Atomic Order to Backend
      const idempotencyKey = `KL-IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const mappedPaymentMethod =
        formData.paymentMethod === "bkash"
          ? "BKASH"
          : formData.paymentMethod === "card"
          ? "CARD_POS"
          : formData.paymentMethod === "emi"
          ? "BANK_EMI"
          : "COD";

      const codSecurityNote =
        isCodSelected && codAdvanceChannel === "manual"
          ? `COD Security Advance ৳${codAdvanceAmount.toLocaleString()} (bKash/Bank Manual TrxID: ${trxId.trim()}) • Remaining COD Due: ৳${codRemainingDue.toLocaleString()}`
          : isCodSelected
          ? `COD Security Advance Required: ৳${codAdvanceAmount.toLocaleString()} (via bKash/Bank Gateway) • Remaining COD Due: ৳${codRemainingDue.toLocaleString()}`
          : "";

      const combinedNotes = [formData.notes?.trim(), codSecurityNote].filter(Boolean).join(" | ") || null;

      const currentEmi = formData.paymentMethod === "emi" ? calculateEmi(grandTotal, emiTenure) : null;
      const formattedEmiTenure = currentEmi
        ? `${currentEmi.tenure} Months (${currentEmi.rate}% fee) • ৳${currentEmi.monthlyInstallment.toLocaleString()}/mo • Total: ৳${currentEmi.totalPayable.toLocaleString()}`
        : undefined;

      const manualTransactionPayload =
        (isCodSelected && codAdvanceChannel === "manual" && trxId.trim()) ||
        (formData.paymentMethod === "bkash" && trxId.trim()) ||
        (formData.paymentMethod === "emi" && trxId.trim())
          ? {
              channel:
                formData.paymentMethod === "emi"
                  ? "BANK_EMI"
                  : formData.paymentMethod === "bkash"
                  ? "BKASH_MFS"
                  : "BKASH_OR_BANK",
              trxId: trxId.trim(),
              senderAccount: senderAccount.trim() || undefined,
              purpose: isCodSelected ? "cod_advance" : formData.paymentMethod === "emi" ? "emi" : "full",
              emiTenure: formattedEmiTenure,
            }
          : formData.paymentMethod === "emi"
          ? {
              channel: "BANK_EMI",
              purpose: "emi",
              emiTenure: formattedEmiTenure,
            }
          : null;

      const orderPayload = {
        idempotencyKey,
        customerName: formData.fullName,
        customerPhone: formattedPhone,
        customerEmail: formData.email || undefined,
        shippingAddress: formData.address,
        division: formData.division,
        district: formData.district || "Dhaka City",
        thana: formData.thana || "Mirpur",
        deliveryLocation: `${formData.thana || "Mirpur"}, ${formData.district || "Dhaka City"}, ${formData.division}`,
        paymentMethod: mappedPaymentMethod,
        shippingCode: selectedShippingMethod?.code || "based_on_location",
        couponCode: appliedCouponData ? appliedCouponData.code : (couponCode && couponCode.trim() ? couponCode.trim().toUpperCase() : null),
        notes: combinedNotes,
        ...(manualTransactionPayload ? { manualTransaction: manualTransactionPayload } : {}),
        items: preparedApiItems,
      };

      const customerToken = getCustomerToken();
      const orderHeaders = {
        "Content-Type": "application/json",
        "idempotency-key": idempotencyKey,
      };
      if (customerToken) {
        orderHeaders.Authorization = `Bearer ${customerToken}`;
      }

      const orderRes = await fetch("/api/v1/orders", {
        method: "POST",
        headers: orderHeaders,
        body: JSON.stringify(orderPayload),
      });

      const orderJson = await orderRes.json();

      if (!orderRes.ok || !orderJson.success) {
        const serverMsg =
          orderJson?.errors?.[0]?.message ||
          orderJson?.message ||
          "Could not place order. Please review your details.";
        const apiErr = new Error(serverMsg);
        apiErr.isApiValidation = true;
        throw apiErr;
      }

      if (orderJson.success && orderJson.data) {
        const createdOrder = orderJson.data;
        const trackingCode = createdOrder.orderNumber;

        // Local mirror for quick invoice printing if needed
        createOrder({
          customer: {
            fullName: formData.fullName,
            phone: formattedPhone,
            altPhone: formData.altPhone,
            email: formData.email,
            division: formData.division,
            district: formData.district,
            thana: formData.thana,
            address: formData.address,
            userId: currentUser?.id,
          },
          cartItems,
          deliveryFee,
          paymentMethod: formData.paymentMethod,
          deliveryMethod: formData.deliveryMethod,
          trxId: formData.paymentMethod === "bkash" || isCodSelected ? trxId : null,
          notes: combinedNotes,
          trackingCode,
          invoice: createdOrder.invoiceCode,
          id: createdOrder.id,
        });

        if (onClearCart) onClearCart();

        // 3. Initiate payment gateway for Full Online Payment OR COD Security Advance (unless manual TrxID already submitted)
        const shouldInitiateGateway =
          formData.paymentMethod === "card" ||
          (formData.paymentMethod === "bkash" && !trxId.trim()) ||
          (isCodSelected && codAdvanceChannel === "gateway");

        if (shouldInitiateGateway) {
          try {
            const payRes = await fetch("/api/v1/payments/initiate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: createdOrder.id }),
            });
            const payJson = await payRes.json();
            if (payJson.success && payJson.data?.gatewayUrl) {
              window.location.href = payJson.data.gatewayUrl;
              return;
            }
          } catch (payErr) {
            console.error("Payment session initialization error:", payErr);
          }
        }

        // 4. Default: Navigate to dedicated Order Confirmation screen
        _navigate(`/order-confirmation/${trackingCode}`);
        return;
      } else {
        throw new Error(orderJson.message || "Failed to submit order to factory system");
      }
    } catch (err) {
      if (err.isApiValidation) {
        setSubmitError(err.message);
        return;
      }
      console.error("Order submission error:", err.message);
      setSubmitError(err.message || "Network error while placing order. Please verify connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderCompleted) {
    return (
      <div style={{ background: "#f8f9fa", minHeight: "100vh", padding: "60px 0" }}>
        <KingletSEO
          title="Order Confirmation | Kinglet Bangladesh Ltd"
          description="Your furniture order has been confirmed."
          noindex={true}
        />
        <div className="container" style={{ maxWidth: "660px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "36px 30px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "inline-flex", padding: "16px", background: "#f0fdf4", borderRadius: "50%", color: "#16a34a", marginBottom: "16px" }}>
              <CheckCircle2 size={52} />
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#111827", margin: "0 0 6px" }}>
              Order Successfully Confirmed!
            </h1>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 20px" }}>
              Kinglet Bangladesh Ltd. এ আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে। আমাদের টিম ৩০ মিনিটের মধ্যে কনফার্মেশনের জন্য কল করবে।
            </p>

            {/* Prominent Unique Tracking Code Box */}
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                borderRadius: "14px",
                padding: "24px 20px",
                color: "#ffffff",
                marginBottom: "24px",
                textAlign: "center",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.2)",
                border: "1px solid #334155",
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(236,34,38,0.2)", border: "1px solid rgba(236,34,38,0.4)", color: "#fca5a5", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", padding: "4px 14px", borderRadius: "20px", marginBottom: "10px" }}>
                <ShieldCheck size={14} /> Unique Tracking Code • ইউনিক ট্র্যাকিং কোড
              </div>
              <div style={{ fontSize: "30px", fontWeight: "900", letterSpacing: "2.5px", color: "#38bdf8", fontFamily: "ui-monospace, monospace", margin: "6px 0 14px" }}>
                {orderInvoice}
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    background: copiedCode ? "#16a34a" : "rgba(255,255,255,0.12)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.25)",
                    padding: "8px 20px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                  }}
                >
                  {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                  {copiedCode ? "Tracking Code Copied!" : "Copy Unique Tracking Code"}
                </button>
              </div>
              <p style={{ margin: "14px 0 0", fontSize: "12px", color: "#94a3b8", lineHeight: "1.5" }}>
                এই ইউনিক কোডটি দিয়ে আপনি যেকোনো সময় ওয়েবসাইট থেকে সরাসরি আপনার ফার্নিচারের কাটিং, সিজনিং, ল্যাকার পলিশ এবং লাইভ ডেলিভারি ট্র্যাক করতে পারবেন।
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "26px", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>Recipient Name:</span>
                <strong style={{ color: "#111827" }}>{formData.fullName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>Phone Number:</span>
                <strong>{formData.phone}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>Delivery Address:</span>
                <span style={{ textAlign: "right", maxWidth: "280px", color: "#374151" }}>{formData.address}, {formData.division}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "800", borderTop: "1px solid #e2e8f0", paddingTop: "10px", marginTop: "4px" }}>
                <span>Total Amount:</span>
                <span style={{ color: "#ec2226", fontSize: "16px" }}>৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginBottom: "16px" }}>
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(true)}
                style={{
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  padding: "12px 22px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
                }}
              >
                <Printer size={16} /> Print Cash Memo / Save PDF
              </button>
              <Link
                to={`/track-order?inv=${orderInvoice}`}
                style={{
                  background: "#ec2226",
                  color: "#ffffff",
                  padding: "12px 22px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "700",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(236,34,38,0.25)",
                }}
              >
                Track Live Order <ArrowRight size={16} />
              </Link>
              <Link
                to="/account"
                style={{
                  background: "#ffffff",
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  padding: "12px 22px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "700",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                View in My Account
              </Link>
              <Link
                to="/"
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        {/* Official Printable Cash Memo Modal */}
        <KingletPrintableInvoiceModal
          order={
            lastSavedOrder || {
              id: orderInvoice,
              trackingCode: orderInvoice,
              invoice: orderInvoice,
              date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
              customer: formData,
              items: cartItems,
              deliveryFee,
              grandTotal,
              paymentMethod: formData.paymentMethod,
              trxId,
            }
          }
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
        />
      </div>
    );
  }

  // Phase 2 Empty Cart Guard & Protection
  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div style={{ background: "#f8f9fa", minHeight: "80vh", padding: "100px 20px 60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <KingletSEO
          title="Checkout | Kinglet Bangladesh Ltd"
          description="Complete your order for handcrafted seasoned mahogany and luxury furniture with nationwide delivery."
          noindex={true}
        />
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "48px 32px",
            maxWidth: "560px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#ec2226",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <ShoppingBag size={34} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", marginBottom: "8px" }}>
            Your Shopping Cart is Empty
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", maxWidth: "420px", margin: "0 auto 24px" }}>
            You have no furniture pieces in your cart to proceed with checkout. Explore Kinglet's handcrafted seasoned Mahogany and Oak collections to customize your piece.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/category/all"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#ec2226",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "13.5px",
                fontWeight: "800",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(236,34,38,0.3)",
              }}
            >
              Explore Master Collections
            </Link>
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#f1f5f9",
                color: "#334155",
                padding: "12px 20px",
                borderRadius: "8px",
                fontSize: "13.5px",
                fontWeight: "700",
                textDecoration: "none",
              }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", padding: "30px 0 60px" }}>
      <KingletSEO
        title="Secure Checkout | Kinglet Bangladesh Ltd"
        description="Complete your order for handcrafted seasoned mahogany and luxury furniture with nationwide delivery."
        noindex={true}
      />
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>
          <Link to="/" style={{ color: "#374151", textDecoration: "none" }}>Home</Link>
          <ChevronRight size={13} />
          <Link to="/cart" style={{ color: "#374151", textDecoration: "none" }}>Cart</Link>
          <ChevronRight size={13} />
          <span style={{ color: "#ec2226", fontWeight: "600" }}>Checkout</span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#111827", margin: "0 0 18px" }}>
          Delivery & Payment Details
        </h1>

        {/* Account Status Notice */}
        {currentUser ? (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: "10px",
              padding: "12px 18px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UserCheck size={18} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#065f46" }}>
                  Logged in as {currentUser.fullName || currentUser.name} ({currentUser.phone})
                </div>
                <div style={{ fontSize: "12px", color: "#047857" }}>
                  আপনার অ্যাকাউন্ট থেকে ডেলিভারি নাম ও ঠিকানা অটোমেটিক পূরণ করা হয়েছে।
                </div>
              </div>
            </div>
            <Link
              to="/account"
              style={{ fontSize: "12px", fontWeight: "700", color: "#059669", textDecoration: "underline" }}
            >
              Manage Account
            </Link>
          </div>
        ) : (
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "10px",
              padding: "12px 18px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: "13px", color: "#1e40af" }}>
              <strong>Already have an Account?</strong> Create an account or sign in to auto-fill address and track all your orders.
            </div>
            <Link
              to="/account"
              style={{
                background: "#2563eb",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                textDecoration: "none",
              }}
            >
              Sign In / Create Account
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="checkout-main-grid">
            
            {/* Form Fields */}
            <div className="checkout-form-box" style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              {/* Customer Contact */}
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#111827", margin: "0 0 16px" }}>
                1. Customer & Contact Details
              </h3>
              <div className="checkout-input-row" style={{ marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                    Full Name *
                  </label>
                  <input
                    id="checkout-full-name"
                    name="fullName"
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label htmlFor="checkout-phone" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                    Mobile Phone Number *
                  </label>
                  <input
                    id="checkout-phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="e.g. 01712345678"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (phoneError) setPhoneError("");
                    }}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: phoneError ? "2px solid #ef4444" : "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "13px",
                      background: phoneError ? "#fef2f2" : "#ffffff",
                    }}
                  />
                  {phoneError && (
                    <div style={{ color: "#dc2626", fontSize: "11px", fontWeight: "600", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <AlertCircle size={12} /> {phoneError}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="checkout-alt-phone" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                    Alternative Phone (Optional)
                  </label>
                  <input
                    id="checkout-alt-phone"
                    name="altPhone"
                    type="tel"
                    placeholder="For delivery coordination"
                    value={formData.altPhone}
                    onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label htmlFor="checkout-email" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                    Email Address (Optional)
                  </label>
                  <input
                    id="checkout-email"
                    name="email"
                    type="email"
                    placeholder="For invoice receipt"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "0 0 16px", flexWrap: "wrap", gap: "6px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#111827", margin: 0 }}>
                  2. Delivery Destination
                </h3>
                <span style={{ fontSize: "11px", color: "#b45309", fontWeight: 700, background: "#fef3c7", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: "4px" }}>
                  📍 Delivery charge is based on customer location
                </span>
              </div>
              <div className="checkout-input-row" style={{ marginBottom: "24px" }}>
                <div>
                  <label htmlFor="checkout-division" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                    Division *
                  </label>
                  <select
                    id="checkout-division"
                    name="division"
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", background: "#ffffff" }}
                  >
                    {BANGLADESH_DIVISIONS.map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="checkout-thana" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                    Thana / Police Station *
                  </label>
                  <input
                    id="checkout-thana"
                    name="thana"
                    type="text"
                    required
                    placeholder="e.g. Mirpur, Gulshan, Uttara"
                    value={formData.thana}
                    onChange={(e) => setFormData({ ...formData, thana: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>

                <div className="checkout-input-full-col">
                  <label htmlFor="checkout-address" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                    Detailed House, Road, Flat & Landmark *
                  </label>
                  <textarea
                    id="checkout-address"
                    name="address"
                    rows={3}
                    required
                    placeholder="e.g. House #14, Road #5, Flat 4B, Sector 3..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>

                <div className="checkout-input-full-col" style={{ marginTop: "4px" }}>
                  <div style={{ fontSize: "11.5px", color: "#64748b", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px", border: "1px dashed #cbd5e1", lineHeight: "1.4" }}>
                    🚚 <strong>ডেলিভারি পলিসি:</strong> কিংলেট ফার্নিচারের ডেলিভারি চার্জ গ্রাহকের সঠিক লোকেশন ও দূরত্বের ওপর ভিত্তি করে নির্ধারিত হয়। অর্ডার কনফার্মেশন কলের সময় আমাদের টিম আপনাকে চূড়ান্ত পরিবহন চার্জ জানিয়ে দিবে এবং ডেলিভারির সময় তা প্রদেয়।
                  </div>
                </div>
              </div>

              {/* Delivery & Assembly Method Selection (Loaded Dynamically from Admin Settings) */}
              <div style={{ marginBottom: "26px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "0 0 12px", flexWrap: "wrap", gap: "6px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🚚</span> 3. Delivery &amp; Assembly Method
                  </h3>
                  <span style={{ fontSize: "11px", color: "#166534", fontWeight: 700, background: "#dcfce7", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: "4px" }}>
                    Official Tariffs
                  </span>
                </div>

                {shippingLoading ? (
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", color: "#64748b", fontSize: "13px", textAlign: "center" }}>
                    Loading available logistics options...
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {shippingMethods.map((method) => {
                      const isSelected = selectedShippingMethod?.id === method.id || selectedShippingMethod?.code === method.code;
                      const isPickup = method.code === "showroom_pickup" || (method.title && method.title.toLowerCase().includes("pickup"));
                      const isZeroRate = Number(method.baseRate) === 0;

                      return (
                        <div
                          key={method.id || method.code}
                          onClick={() => setSelectedShippingMethod(method)}
                          style={{
                            border: isSelected ? "2px solid #ec2226" : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "14px 16px",
                            background: isSelected ? "#fffbfb" : "#ffffff",
                            cursor: "pointer",
                            transition: "all 0.18s ease",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            boxShadow: isSelected ? "0 4px 12px rgba(236, 34, 38, 0.08)" : "none",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 200px", minWidth: 0 }}>
                              <input
                                type="radio"
                                name="selectedShipping"
                                checked={isSelected}
                                onChange={() => setSelectedShippingMethod(method)}
                                style={{ accentColor: "#ec2226", width: "17px", height: "17px", cursor: "pointer", flexShrink: 0 }}
                              />
                              <span style={{ fontWeight: 800, fontSize: "14px", color: isSelected ? "#ec2226" : "#0f172a", wordBreak: "break-word" }}>
                                {method.title}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                color: !isZeroRate ? "#0f172a" : isPickup ? "#334155" : "#b45309",
                                background: !isZeroRate ? "#f1f5f9" : isPickup ? "#f1f5f9" : "#fef3c7",
                                border: !isZeroRate ? "1px solid #e2e8f0" : isPickup ? "1px solid #cbd5e1" : "1px solid #fde68a",
                                padding: "3px 10px",
                                borderRadius: "6px",
                                whiteSpace: "nowrap",
                                alignSelf: "flex-start",
                              }}
                            >
                              {!isZeroRate
                                ? `৳${Number(method.baseRate).toLocaleString()}`
                                : isPickup
                                  ? "Showroom Pickup"
                                  : "Based on Location"}
                            </span>
                          </div>

                          {method.description && (
                            <p style={{ margin: "2px 0 4px 27px", fontSize: "12.5px", color: "#475569", lineHeight: "1.4" }}>
                              {method.description}
                            </p>
                          )}

                          <div style={{ marginLeft: "27px", display: "flex", gap: "8px", alignItems: "center" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background: method.freeAssembly ? "#eff6ff" : "#f8fafc",
                                color: method.freeAssembly ? "#1d4ed8" : "#64748b",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              {method.freeAssembly ? "✓ Carpenter Fitting Included" : "Standard Logistics Delivery"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#111827", margin: "0 0 16px" }}>
                4. Payment Method
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {[
                  {
                    id: "cod",
                    label: "Cash on Delivery (COD) — ৳5,000 Advance Security Required",
                    sub: "Pay ৳5,000 security advance via bKash or Bank now (deducted from total); pay remaining cash upon product delivery.",
                  },
                  { id: "bkash", label: "bKash / Nagad / Rocket (MFS)", sub: "Instant mobile banking transaction with 0% gateway charge." },
                  { id: "card", label: "Credit / Debit Card (Visa, MasterCard, Amex)", sub: "Processed securely via SSLCommerz gateway." },
                  { id: "emi", label: "Bank Credit Card EMI (3 - 36 Months)", sub: "Available across 18+ Bangladeshi Banks (City Bank Amex, BRAC, SCB, EBL, etc.)" },
                ].map((pay) => (
                  <label
                    key={pay.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: formData.paymentMethod === pay.id ? "2px solid #ec2226" : "1px solid #e5e7eb",
                      background: formData.paymentMethod === pay.id ? "#fff5f5" : "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={formData.paymentMethod === pay.id}
                      onChange={() => {
                        setFormData({ ...formData, paymentMethod: pay.id });
                        setTrxError("");
                      }}
                      style={{ marginTop: "3px", accentColor: "#ec2226" }}
                    />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>{pay.label}</div>
                      <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{pay.sub}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* COD Security Advance (৳5,000 via bKash / Bank) Panel */}
              {formData.paymentMethod === "cod" && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                    border: "1.5px solid #f59e0b",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <ShieldCheck size={18} color="#b45309" />
                      <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#92400e" }}>
                        COD Security Advance: ৳{(codAdvanceAmount || COD_ADVANCE_BDT).toLocaleString()} (bKash / Bank)
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: "700", background: "#ffffff", color: "#b45309", border: "1px solid #fcd34d", padding: "3px 8px", borderRadius: "6px" }}>
                      মোট বিল থেকে মাইনাস হবে
                    </span>
                  </div>

                  <p style={{ fontSize: "12px", color: "#78350f", margin: "0 0 12px", lineHeight: "1.5" }}>
                    ক্যাশ অন ডেলিভারি (COD) কনফার্ম করতে নিরাপত্তার জন্য <strong>৳{(codAdvanceAmount || COD_ADVANCE_BDT).toLocaleString()}</strong> অগ্রিম <strong>bKash বা Bank</strong>-এর মাধ্যমে পরিশোধ করতে হবে। ডেলিভারির সময় মোট দাম থেকে এই <strong>৳{(codAdvanceAmount || COD_ADVANCE_BDT).toLocaleString()}</strong> মাইনাস হয়ে বাকি টাকা (৳{codRemainingDue.toLocaleString()}) ক্যাশে পরিশোধ করবেন।
                  </p>

                  {/* Sub-selector: Online Gateway vs Manual bKash/Bank TrxID */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: codAdvanceChannel === "manual" ? "12px" : "0" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCodAdvanceChannel("gateway");
                        setTrxError("");
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: codAdvanceChannel === "gateway" ? "2px solid #b45309" : "1px solid #fcd34d",
                        background: codAdvanceChannel === "gateway" ? "#ffffff" : "rgba(255,255,255,0.65)",
                        color: "#78350f",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      💳 Pay ৳{(codAdvanceAmount || COD_ADVANCE_BDT).toLocaleString()} Now (bKash / Bank Gateway)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCodAdvanceChannel("manual");
                        setTrxError("");
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: codAdvanceChannel === "manual" ? "2px solid #b45309" : "1px solid #fcd34d",
                        background: codAdvanceChannel === "manual" ? "#ffffff" : "rgba(255,255,255,0.65)",
                        color: "#78350f",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      📱 Direct bKash / Bank Transfer (Enter TrxID)
                    </button>
                  </div>

                  {codAdvanceChannel === "manual" && (
                    <div style={{ background: "#ffffff", borderRadius: "8px", padding: "12px", border: "1px solid #fde68a" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                        <div style={{ fontSize: "12px", color: "#0f172a" }}>
                          <strong>bKash Merchant:</strong> <span style={{ fontFamily: "monospace", color: "#be185d", fontWeight: "800" }}>{paymentConfig.bkashMerchantNumber}</span> (Pay / Send ৳{(codAdvanceAmount || COD_ADVANCE_BDT).toLocaleString()})
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>Bank: {paymentConfig.bankAccountDetails}</div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyBkash}
                          style={{
                            background: copiedBkash ? "#16a34a" : "#be185d",
                            color: "#ffffff",
                            border: "none",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {copiedBkash ? <Check size={12} /> : <Copy size={12} />}
                          {copiedBkash ? "Copied" : "Copy Number"}
                        </button>
                      </div>
                      <label htmlFor="cod-advance-trx-id" style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#92400e", marginBottom: "4px", textTransform: "uppercase" }}>
                        bKash / Bank Transaction Reference (TrxID) *
                      </label>
                      <input
                        id="cod-advance-trx-id"
                        name="codAdvanceTrxId"
                        type="text"
                        placeholder="e.g. BKASH9K82JD71LX or Bank Deposit Ref"
                        value={trxId}
                        onChange={(e) => {
                          setTrxId(e.target.value);
                          if (trxError) setTrxError("");
                        }}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          border: trxError ? "2px solid #dc2626" : "1px solid #f59e0b",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontFamily: "monospace",
                          background: trxError ? "#fef2f2" : "#ffffff",
                          boxSizing: "border-box",
                        }}
                      />
                      {trxError && (
                        <div style={{ color: "#dc2626", fontSize: "11px", fontWeight: "600", marginTop: "4px" }}>
                          ⚠️ {trxError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* bKash & Nagad Payment Box */}
              {formData.paymentMethod === "bkash" && (
                <div
                  style={{
                    background: "#fdf2f8",
                    border: "1px solid #fbcfe8",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#e11d48", color: "#ffffff", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "800" }}>
                        bKash / Nagad
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "#831843" }}>
                        Merchant Number: {paymentConfig.bkashMerchantNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyBkash}
                      style={{
                        background: copiedBkash ? "#16a34a" : "#be185d",
                        color: "#ffffff",
                        border: "none",
                        padding: "5px 12px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {copiedBkash ? <Check size={12} /> : <Copy size={12} />}
                      {copiedBkash ? "Copied" : "Copy Number"}
                    </button>
                  </div>

                  <div style={{ fontSize: "12px", color: "#701a75", lineHeight: "1.5", marginBottom: "12px" }}>
                    ১. আপনার বিকাশ বা নগদ অ্যাপে গিয়ে <strong>Payment</strong> অথবা <strong>Send Money</strong> সিলেক্ট করুন।<br />
                    ২. মার্চেন্ট নম্বর <strong>{paymentConfig.bkashMerchantNumber}</strong> দিন এবং রেফারেন্সে আপনার ফোন নম্বর লিখুন।<br />
                    ৩. পেমেন্টের পর পাওয়া <strong>Transaction ID (TrxID)</strong> নিচের বক্সে লিখুন:
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#831843", marginBottom: "4px", textTransform: "uppercase" }}>
                      bKash / Nagad Transaction ID (TrxID)
                    </label>
                    <input
                      id="checkout-trx-id"
                      name="trxId"
                      type="text"
                      placeholder="e.g. 9K82JD71LX (Optional - can be verified via phone)"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        border: "1px solid #f472b6",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontFamily: "monospace",
                        background: "#ffffff",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* EMI Bank Verification & Tenure Selection Notice */}
              {formData.paymentMethod === "emi" && (() => {
                const selectedPlanEmi = calculateEmi(grandTotal, emiTenure);
                const tenuresList = paymentConfig.emiTenures || [3, 6, 9, 12, 18, 24, 30, 36];
                return (
                  <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "12px", padding: "16px 18px", marginBottom: "16px", fontSize: "12px", color: "#1e3a8a" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                      <div style={{ fontWeight: "800", fontSize: "13.5px" }}>
                        🏦 Bank Credit Card EMI Facility (৩ থেকে ৩৬ মাস কিস্তি)
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: "700", background: "#dbeafe", padding: "2px 8px", borderRadius: "10px" }}>
                        18+ Partner Banks
                      </span>
                    </div>
                    <p style={{ margin: "0 0 10px", lineHeight: "1.5", color: "#334155" }}>
                      আপনার ক্রেডিট কার্ডের জন্য কিস্তির মেয়াদ সিলেক্ট করুন। নির্বাচিত মেয়াদের প্রযোজ্য ব্যাংক চার্জ সহ মাসিক কিস্তি স্বয়ংক্রিয়ভাবে হিসাব করা হয়েছে:
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px", marginBottom: "14px" }}>
                      {tenuresList.map((m) => {
                        const plan = calculateEmi(grandTotal, m);
                        const isSelected = String(emiTenure) === String(m);
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setEmiTenure(String(m))}
                            style={{
                              padding: "8px 10px",
                              borderRadius: "8px",
                              border: isSelected ? "2px solid #1d4ed8" : "1px solid #bfdbfe",
                              background: isSelected ? "#ffffff" : "#f0f7ff",
                              color: "#1e3a8a",
                              fontWeight: "700",
                              fontSize: "12px",
                              cursor: "pointer",
                              textAlign: "left",
                              boxShadow: isSelected ? "0 2px 8px rgba(29,78,216,0.15)" : "none",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: "800" }}>{m} Months</span>
                              <span style={{ fontSize: "10.5px", color: "#2563eb", fontWeight: "700" }}>{plan.rate}%</span>
                            </div>
                            <div style={{ fontSize: "11px", color: isSelected ? "#1d4ed8" : "#64748b", marginTop: "2px", fontWeight: "700" }}>
                              ৳{plan.monthlyInstallment.toLocaleString()}/mo
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* EMI Calculation Summary Box */}
                    <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: "8px", border: "1px dashed #93c5fd", marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#475569" }}>
                        <span>Base Order Value:</span>
                        <strong>৳{grandTotal.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#2563eb" }}>
                        <span>Bank EMI Convenience Fee ({selectedPlanEmi.rate}%):</span>
                        <strong>+৳{selectedPlanEmi.bankCharge.toLocaleString()}</strong>
                      </div>
                      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "6px", display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>
                        <span>Total Payable via EMI:</span>
                        <span style={{ color: "#1d4ed8" }}>৳{selectedPlanEmi.totalPayable.toLocaleString()}</span>
                      </div>
                      <div style={{ marginTop: "4px", fontSize: "12.5px", fontWeight: "800", color: "#16a34a" }}>
                        ➜ Monthly Installment: ৳{selectedPlanEmi.monthlyInstallment.toLocaleString()} / month ({selectedPlanEmi.tenure} Months)
                      </div>
                    </div>

                    {/* Bank Logos Preview & Quick Selection */}
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#1e3a8a", marginBottom: "6px" }}>
                        Click your Bank Card or type below:
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                        {BD_BANKS.map((b) => {
                          const isBankActive = trxId === b.name || trxId.toLowerCase().includes(b.id);
                          return (
                            <button
                              key={b.id}
                              type="button"
                              title={b.name}
                              onClick={() => setTrxId(b.name)}
                              style={{
                                background: "#ffffff",
                                border: isBankActive ? "2px solid #1d4ed8" : "1px solid #bfdbfe",
                                borderRadius: "6px",
                                padding: "3px 8px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "28px",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                boxShadow: isBankActive ? "0 2px 6px rgba(29,78,216,0.25)" : "none",
                              }}
                            >
                              <img
                                src={b.logo}
                                alt={b.name}
                                loading="lazy"
                                style={{ maxHeight: "17px", maxWidth: "48px", objectFit: "contain" }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Selected Bank / Card Issuing Bank (or click bank logo above)"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #93c5fd", borderRadius: "6px", fontSize: "12px", background: "#ffffff", boxSizing: "border-box" }}
                    />
                  </div>
                );
              })()}

              {/* Credit / Debit Card Notice */}
              {formData.paymentMethod === "card" && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    marginBottom: "16px",
                    fontSize: "12px",
                    color: "#166534",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <ShieldCheck size={20} color="#16a34a" />
                  <div>
                    <strong>SSLCommerz 128-bit Bank Encryption:</strong> Visa, MasterCard, Amex & UnionPay cards are supported with 3D Secure OTP verification.
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Order Review */}
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px", position: "sticky", top: "90px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#111827", margin: "0 0 14px" }}>
                Order Summary ({cartItems.length} items)
              </h3>

              <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px", borderBottom: "1px solid #e5e7eb", paddingBottom: "12px" }}>
                {cartItems.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <img src={item.image} alt={item.name} width="36" height="36" loading="lazy" style={{ width: "36px", height: "36px", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: "4px" }} />
                      <div>
                        <div style={{ fontWeight: "700", color: "#1f2937" }}>{item.name}</div>
                        <div style={{ color: "#9ca3af" }}>Qty: {item.quantity || 1}</div>
                      </div>
                    </div>
                    <span style={{ fontWeight: "700", color: "#ec2226" }}>
                      ৳{(item.priceBDT * (item.quantity || 1)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo / Coupon Redemption - FIXED PRICE ONLY */}
              <div style={{ marginBottom: "14px" }}>
                {allItemsDiscounted ? (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px dashed #fca5a5",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      color: "#991b1b",
                      lineHeight: "1.4",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>🏷️</span>
                    <span>কুপন শুধুমাত্র ফিক্সড প্রাইসের (Regular Price) পণ্যে প্রযোজ্য। আপনার কার্টের সকল পণ্য ইতিমধ্যেই বিশেষ ডিসকাউন্টে রয়েছে।</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        id="checkout-coupon-code"
                        name="couponCode"
                        type="text"
                        placeholder="Promo / Coupon Code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError(null);
                        }}
                        disabled={appliedCouponData !== null || couponLoading}
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          border: appliedCouponData ? "1px solid #86efac" : "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          fontWeight: 700,
                          background: appliedCouponData ? "#f0fdf4" : "#ffffff",
                        }}
                      />
                      {appliedCouponData ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCouponData(null);
                            setCouponCode("");
                            setCouponError(null);
                          }}
                          style={{
                            padding: "8px 12px",
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          disabled={couponLoading || !couponCode.trim()}
                          style={{
                            padding: "8px 14px",
                            background: couponLoading || !couponCode.trim() ? "#e5e7eb" : "#111827",
                            color: couponLoading || !couponCode.trim() ? "#9ca3af" : "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: couponLoading || !couponCode.trim() ? "not-allowed" : "pointer",
                          }}
                        >
                          {couponLoading ? "..." : "Apply"}
                        </button>
                      )}
                    </div>
                    {discountedItems.length > 0 && (
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                        💡 কুপন ছাড় শুধুমাত্র কার্টের ফিক্সড প্রাইস পণ্যের ওপর (৳{fixedPriceSubtotal.toLocaleString()}) কার্যকর হবে।
                      </div>
                    )}
                    {couponError && (
                      <div style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px" }}>
                        ⚠️ {couponError}
                      </div>
                    )}
                    {appliedCouponData && (
                      <div style={{ fontSize: "11px", color: "#16a34a", marginTop: "4px", fontWeight: 700 }}>
                        ✓ Coupon <strong>{appliedCouponData.code}</strong> applied (-৳{couponDiscount.toLocaleString()})!
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderBottom: "1px solid #e5e7eb", paddingBottom: "12px", marginBottom: "12px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#4b5563" }}>
                  <span>Subtotal</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a", fontWeight: 700 }}>
                    <span>Coupon Discount ({appliedCouponData?.code})</span>
                    <span>-৳{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ color: "#374151", fontWeight: 600 }}>Delivery Charge</span>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>
                      {selectedShippingMethod ? selectedShippingMethod.title : formData.division}
                    </span>
                  </div>
                  {(() => {
                    const isPickup = selectedShippingMethod?.code === "showroom_pickup" || (selectedShippingMethod?.title && selectedShippingMethod.title.toLowerCase().includes("pickup"));
                    const hasFee = deliveryFee > 0;
                    return (
                      <span style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: hasFee ? "#0f172a" : isPickup ? "#334155" : "#b45309",
                        background: hasFee ? "#f1f5f9" : isPickup ? "#f1f5f9" : "#fef3c7",
                        border: hasFee ? "1px solid #e2e8f0" : isPickup ? "1px solid #cbd5e1" : "1px solid #fde68a",
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}>
                        {hasFee ? `৳${deliveryFee.toLocaleString()}` : isPickup ? "Showroom Pickup" : "Based on Location"}
                      </span>
                    );
                  })()}
                </div>
                {selectedShippingMethod?.description && (
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", lineHeight: "1.35", background: "#f8fafc", padding: "6px 8px", borderRadius: "4px", border: "1px dashed #e2e8f0" }}>
                    * {selectedShippingMethod.description}
                  </div>
                )}
              </div>

              {isCodSelected ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#374151" }}>
                    <span>Total Order Value</span>
                    <strong>৳{grandTotal.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#b45309", fontWeight: 700 }}>
                    <span>COD Security Advance (bKash / Bank)</span>
                    <span>-৳{codAdvanceAmount.toLocaleString()}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "13px",
                      background: "#f8fafc",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px dashed #cbd5e1",
                      color: "#0f172a",
                      fontWeight: 700,
                    }}
                  >
                    <span>Due on Delivery (ডেলিভারির পর)</span>
                    <span>৳{codRemainingDue.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: "6px", borderTop: "1px solid #e5e7eb" }}>
                    <span style={{ fontSize: "14px", fontWeight: "800", color: "#111827" }}>Payable Now (Advance)</span>
                    <span style={{ fontSize: "22px", fontWeight: "900", color: "#ec2226" }}>৳{codAdvanceAmount.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "18px" }}>
                  <span style={{ fontSize: "15px", fontWeight: "800", color: "#111827" }}>Total to Pay</span>
                  <span style={{ fontSize: "22px", fontWeight: "900", color: "#ec2226" }}>৳{grandTotal.toLocaleString()}</span>
                </div>
              )}

              {stockAlert && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", marginBottom: "14px", fontSize: "12px", color: "#b91c1c" }}>
                  <strong>Stock Notification:</strong>
                  <div style={{ whiteSpace: "pre-line", marginTop: "4px" }}>{stockAlert}</div>
                </div>
              )}

              {submitError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", marginBottom: "14px", fontSize: "12px", color: "#b91c1c" }}>
                  <strong>Order Submission Issue:</strong>
                  <div style={{ marginTop: "4px" }}>{submitError}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || cartItems.length === 0}
                style={{
                  width: "100%",
                  height: "46px",
                  background: isSubmitting || cartItems.length === 0 ? "#9ca3af" : "#ec2226",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: isSubmitting || cartItems.length === 0 ? "not-allowed" : "pointer",
                  boxShadow: isSubmitting || cartItems.length === 0 ? "none" : "0 4px 12px rgba(236,34,38,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {isSubmitting
                  ? "Securing Factory Order..."
                  : cartItems.length === 0
                  ? "Shopping Cart is Empty"
                  : isCodSelected
                  ? codAdvanceChannel === "gateway"
                    ? `Pay ৳${(codAdvanceAmount || COD_ADVANCE_BDT).toLocaleString()} Advance & Place COD Order →`
                    : `Confirm ৳${(codAdvanceAmount || COD_ADVANCE_BDT).toLocaleString()} TrxID & Place COD Order`
                  : "Place Order Now"}
              </button>

              <div style={{ marginTop: "12px", fontSize: "11px", color: "#6b7280", textAlign: "center" }}>
                By placing this order you agree to Kinglet's 10-year timber warranty & delivery policies.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
