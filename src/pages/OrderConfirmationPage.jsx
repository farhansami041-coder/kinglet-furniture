import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2, AlertCircle, Clock, Truck, ShieldCheck, Copy, Check,
  Printer, ArrowRight, PackageCheck, PhoneCall, Headphones, ExternalLink,
  ChevronRight, RefreshCw, Calendar, MapPin
} from "lucide-react";
import KingletSEO from "../components/Common/KingletSEO";
import KingletPrintableInvoiceModal from "../components/Finance/KingletPrintableInvoiceModal";
import { BRAND_INFO } from "../data/kingletData";
import { getAllOrders, apiGetPaymentConfig, apiSubmitManualTransaction } from "../utils/accountService";

const PRODUCTION_STEPS = [
  { step: 1, title: "Order Placed", desc: "Your order has been placed & recorded in our system" },
  { step: 2, title: "Order Confirmed", desc: "Order & advance payment verified and confirmed" },
  { step: 3, title: "Factory Received the Order", desc: "Factory has received your order — product preparation takes 3–20 days" },
  { step: 4, title: "Order is Ready", desc: "Product is crafted, quality checked & ready for delivery" },
  { step: 5, title: "Order is Out for Delivery", desc: "Your order is out for delivery to your address" },
  { step: 6, title: "Order Delivered to Customer's Address", desc: "Delivered & handed over at your delivery address" },
];

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentQuery = searchParams.get("payment"); // 'success' | 'failed' | 'cancelled'
  const tranIdQuery = searchParams.get("tran_id");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState({ codAdvanceBdt: 5000, bkashMerchantNumber: "+8801676-900442" });
  const [manualTrx, setManualTrx] = useState("");
  const [manualChannel, setManualChannel] = useState("BKASH");
  const [submittingTrx, setSubmittingTrx] = useState(false);
  const [trxMessage, setTrxMessage] = useState(null);

  // Fetch verified order details from backend API
  const refreshOrder = async () => {
    try {
      const res = await fetch(`/api/v1/orders/track/${encodeURIComponent(orderNumber)}?t=${Date.now()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrder(json.data);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    apiGetPaymentConfig().then((cfg) => {
      if (isMounted && cfg) setPaymentConfig(cfg);
    });

    async function loadOrder() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/orders/track/${encodeURIComponent(orderNumber)}?t=${Date.now()}`);
        const json = await res.json();

        if (json.success && json.data) {
          if (isMounted) setOrder(json.data);
        } else {
          // Offline fallback only when local cache has it
          const localOrders = getAllOrders();
          const match = localOrders.find(
            (o) => o.trackingCode === orderNumber || o.invoice === orderNumber || o.id === orderNumber
          );
          if (match && isMounted) {
            setOrder(match);
          } else if (isMounted) {
            setError(json.message || "Order not found. Please check your reference code.");
          }
        }
      } catch (err) {
        console.error("Error fetching order confirmation:", err);
        const localOrders = getAllOrders();
        const match = localOrders.find(
          (o) => o.trackingCode === orderNumber || o.invoice === orderNumber || o.id === orderNumber
        );
        if (match && isMounted) {
          setOrder(match);
        } else if (isMounted) {
          setError("Failed to connect to the order system. Please retry shortly.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (orderNumber) {
      loadOrder();
    }
    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  const handleSubmitManualTrx = async (e) => {
    e.preventDefault();
    if (!manualTrx.trim() || manualTrx.trim().length < 4) {
      setTrxMessage({ type: "error", text: "Please enter a valid Transaction ID (minimum 4 characters)." });
      return;
    }
    setSubmittingTrx(true);
    setTrxMessage(null);
    try {
      await apiSubmitManualTransaction({
        orderNumber: order?.orderNumber || orderNumber,
        channel: manualChannel,
        trxId: manualTrx.trim(),
      });
      setTrxMessage({ type: "success", text: "Transaction ID submitted and is now awaiting admin verification." });
      setManualTrx("");
      await refreshOrder();
    } catch (err) {
      setTrxMessage({ type: "error", text: err.message || "Failed to submit transaction ID." });
    } finally {
      setSubmittingTrx(false);
    }
  };

  const handleCopyCode = () => {
    const code = order?.orderNumber || order?.trackingCode || orderNumber;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleRetryOnlinePayment = async () => {
    if (!order?.id) return;
    setIsRetryingPayment(true);
    try {
      const res = await fetch("/api/v1/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const json = await res.json();
      if (json.success && json.data?.gatewayUrl) {
        window.location.href = json.data.gatewayUrl;
      } else {
        alert(json.message || "Failed to initiate online payment session.");
      }
    } catch (e) {
      alert("Error contacting payment gateway: " + e.message);
    } finally {
      setIsRetryingPayment(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "75vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <RefreshCw size={36} className="spin" color="#ec2226" style={{ margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
          <h2 style={{ fontSize: "18px", color: "#1e293b", fontWeight: "700" }}>Verifying Order Details...</h2>
          <p style={{ fontSize: "13px", color: "#64748b" }}>Connecting securely to Kinglet Factory ERP & Payment Ledgers</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: "75vh", padding: "60px 20px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: "520px", background: "#ffffff", padding: "40px 30px", borderRadius: "16px", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: "0 auto 16px" }} />
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Order Reference Not Found</h1>
          <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
            We could not locate an order matching reference <strong>{orderNumber}</strong>. Please verify the code or contact our 24/7 Helpline.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link to="/track-order" style={{ padding: "10px 20px", background: "#ec2226", color: "#ffffff", borderRadius: "8px", fontWeight: "700", textDecoration: "none", fontSize: "14px" }}>
              Search Tracker
            </Link>
            <Link to="/" style={{ padding: "10px 20px", background: "#f1f5f9", color: "#334155", borderRadius: "8px", fontWeight: "700", textDecoration: "none", fontSize: "14px" }}>
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const orderNum = order.orderNumber || order.trackingCode || orderNumber;
  const invoiceNum = order.invoiceCode || order.invoice || `KL-INV-${orderNum.replace(/\D/g, "")}`;
  const isCod = order.paymentMethod === "COD" || order.paymentMethod === "cod";
  const isAwaitingVerification = order.paymentStatus === "AWAITING_VERIFICATION";
  const isPartialPaid = order.paymentStatus === "PARTIAL" || (paymentQuery === "success" && isCod && order.paymentStatus !== "PAID" && !isAwaitingVerification);
  const isPaid = order.paymentStatus === "PAID" || (paymentQuery === "success" && !isCod && !isAwaitingVerification);
  const items = order.items || [];
  const subtotal = order.subtotal || items.reduce((sum, i) => sum + (i.unitPrice || i.priceBDT || 0) * (i.quantity || 1), 0);
  const deliveryFee = order.deliveryFee ?? 0;
  const discountAmount = order.discountAmount || 0;
  const grandTotal = order.grandTotal || subtotal + deliveryFee - discountAmount;
  const cfgAdvance = Number(paymentConfig?.codAdvanceBdt) || 5000;
  const codAdvanceRequired =
    order.codAdvanceRequired !== undefined
      ? Number(order.codAdvanceRequired)
      : isCod
      ? Math.min(cfgAdvance, grandTotal)
      : 0;
  const advancePaid = isPaid
    ? grandTotal
    : order.advancePaid !== undefined
    ? Number(order.advancePaid)
    : isPartialPaid
    ? codAdvanceRequired
    : 0;
  const remainingDue = order.remainingDue !== undefined ? Number(order.remainingDue) : isPaid ? 0 : Math.max(0, grandTotal - advancePaid);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "40px 0 80px" }}>
      <KingletSEO
        title={`Order Confirmation: ${orderNum} | Kinglet Bangladesh`}
        description="Your handcrafted furniture order has been confirmed with factory booking details, invoice code, and 7-step production tracker."
        noindex={true}
      />

      <div className="container" style={{ maxWidth: "980px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b", marginBottom: "24px" }}>
          <Link to="/" style={{ color: "#334155", textDecoration: "none" }}>Home</Link>
          <ChevronRight size={13} />
          <Link to="/checkout" style={{ color: "#334155", textDecoration: "none" }}>Checkout</Link>
          <ChevronRight size={13} />
          <span style={{ color: "#ec2226", fontWeight: "700" }}>Order Confirmation</span>
        </div>

        {/* PAYMENT NOTIFICATION BANNER (IF RETURNING FROM GATEWAY OR COD ADVANCE / VERIFICATION PENDING) */}
        {isAwaitingVerification && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "14px" }}>
            <Clock size={24} color="#1d4ed8" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: "800", color: "#1e3a8a" }}>
                Payment Awaiting Admin Verification
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#1d4ed8" }}>
                {order.awaitingVerificationTx?.manualTrxId
                  ? `Your ${order.awaitingVerificationTx.channel} TrxID "${order.awaitingVerificationTx.manualTrxId}" (৳${Number(order.awaitingVerificationTx.amount || 0).toLocaleString()}) has been received and is queued for verification.`
                  : "Your payment submission is under manual review by our accounts team. Once verified, your order status will update to Confirmed."}
              </p>
            </div>
          </div>
        )}

        {paymentQuery === "success" && !isAwaitingVerification && (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "14px" }}>
            <CheckCircle2 size={24} color="#059669" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: "800", color: "#065f46" }}>
                {isPartialPaid ? `COD Security Advance (৳${advancePaid.toLocaleString()}) Paid Successfully!` : "Online Payment Verified Successfully!"}
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#047857" }}>
                {isPartialPaid
                  ? `৳${advancePaid.toLocaleString()} security advance deducted from ৳${grandTotal.toLocaleString()}. Remaining Cash on Delivery: ৳${remainingDue.toLocaleString()} (Ref: ${tranIdQuery || orderNum}).`
                  : `Payment of ৳${grandTotal.toLocaleString()} BDT confirmed via SSLCommerz / bKash Gateway (Bank Ref: ${tranIdQuery || orderNum}).`}
              </p>
            </div>
          </div>
        )}

        {!isPaid && !isPartialPaid && !isAwaitingVerification && paymentQuery !== "failed" && paymentQuery !== "cancelled" && (
          <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <ShieldCheck size={24} color="#b45309" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: "800", color: "#92400e" }}>
                    {isCod
                      ? `COD Security Advance Required: ৳${codAdvanceRequired.toLocaleString()}`
                      : `Payment Pending Verification: ৳${grandTotal.toLocaleString()} (${order.paymentMethod})`}
                  </h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "#b45309" }}>
                    {isCod
                      ? `Pay ৳${codAdvanceRequired.toLocaleString()} security advance via bKash or Bank now (deducted from total) so your order can be dispatched.`
                      : `Pay online via gateway OR send to bKash (${paymentConfig.bkashMerchantNumber}) and submit your TrxID below.`}
                  </p>
                </div>
              </div>
              {order.paymentMethod !== "BANK_EMI" && (
                <button
                  onClick={handleRetryOnlinePayment}
                  disabled={isRetryingPayment}
                  style={{ padding: "9px 18px", background: "#b45309", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
                >
                  {isRetryingPayment ? "Connecting..." : `Pay ৳${(isCod ? codAdvanceRequired : grandTotal).toLocaleString()} Online →`}
                </button>
              )}
            </div>
            <form onSubmit={handleSubmitManualTrx} style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #fcd34d", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <select
                value={manualChannel}
                onChange={(e) => setManualChannel(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #f59e0b", fontSize: "12px", fontWeight: "700", background: "#ffffff" }}
              >
                <option value="BKASH">bKash ({paymentConfig.bkashMerchantNumber})</option>
                <option value="NAGAD">Nagad</option>
                <option value="BANK">Bank Transfer</option>
                <option value="BANK_EMI">Bank EMI Ref</option>
              </select>
              <input
                type="text"
                placeholder="Enter bKash / Bank TrxID"
                value={manualTrx}
                onChange={(e) => setManualTrx(e.target.value)}
                style={{ flex: "1 1 200px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #f59e0b", fontSize: "13px", fontFamily: "monospace", background: "#ffffff" }}
              />
              <button
                type="submit"
                disabled={submittingTrx}
                style={{ padding: "8px 14px", background: "#111827", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
              >
                {submittingTrx ? "Submitting..." : "Submit TrxID for Verification"}
              </button>
            </form>
            {trxMessage && (
              <div style={{ marginTop: "8px", fontSize: "12px", fontWeight: "700", color: trxMessage.type === "error" ? "#dc2626" : "#059669" }}>
                {trxMessage.text}
              </div>
            )}
          </div>
        )}

        {paymentQuery === "failed" && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <AlertCircle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: "800", color: "#991b1b" }}>
                  Online Payment Failed / Declined at Gateway
                </h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#b91c1c" }}>
                  Don't worry! Your order reservation is safe in our system. You can switch to Cash on Delivery or retry online payment.
                </p>
              </div>
            </div>
            <button
              onClick={handleRetryOnlinePayment}
              disabled={isRetryingPayment}
              style={{ padding: "8px 18px", background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
            >
              {isRetryingPayment ? "Connecting..." : "Retry Online Payment"}
            </button>
          </div>
        )}

        {paymentQuery === "cancelled" && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Clock size={24} color="#d97706" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: "800", color: "#92400e" }}>
                  Payment Cancelled by User
                </h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#b45309" }}>
                  The online payment session was cancelled. You may pay Cash on Delivery upon home delivery & installation.
                </p>
              </div>
            </div>
            <button
              onClick={handleRetryOnlinePayment}
              disabled={isRetryingPayment}
              style={{ padding: "8px 18px", background: "#d97706", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
            >
              {isRetryingPayment ? "Connecting..." : "Retry Online Payment"}
            </button>
          </div>
        )}

        {/* HERO CONFIRMATION HEADER */}
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "36px 30px", marginBottom: "24px", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
            <div style={{ display: "flex", gap: "18px", alignItems: "flex-start" }}>
              <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckCircle2 size={32} color="#ec2226" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", background: "#fee2e2", color: "#ec2226", padding: "3px 10px", borderRadius: "20px" }}>
                    {order.statusLabel || order.orderStatus || "Order Recorded"}
                  </span>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    background: isPaid ? "#dcfce7" : isPartialPaid ? "#dbeafe" : isAwaitingVerification ? "#dbeafe" : "#fef3c7",
                    color: isPaid ? "#166534" : isPartialPaid ? "#1d4ed8" : isAwaitingVerification ? "#1e40af" : "#92400e",
                    padding: "3px 10px",
                    borderRadius: "20px"
                  }}>
                    {isPaid
                      ? "Payment: Paid (Full)"
                      : isPartialPaid
                      ? `COD Advance Paid: ৳${advancePaid.toLocaleString()} • Due: ৳${remainingDue.toLocaleString()}`
                      : isAwaitingVerification
                      ? "Payment: Awaiting Admin Verification"
                      : isCod
                      ? "Payment: COD (Advance Pending)"
                      : `Payment: ${order.paymentStatus || "Pending"}`}
                  </span>
                </div>
                <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
                  Thank you, {order.customerName || order.customer?.fullName || "Valued Customer"}!
                </h1>
                <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                  Your handcrafted furniture order has been submitted to the Kinglet Factory Production Queue.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 16px",
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                <Printer size={15} /> Print Official Invoice
              </button>
              <Link
                to="/account"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 16px",
                  background: "#ffffff",
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  textDecoration: "none"
                }}
              >
                View Order Details
              </Link>
              <Link
                to="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 16px",
                  background: "#f8fafc",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  textDecoration: "none"
                }}
              >
                Continue Shopping
              </Link>
              <Link
                to={`/track-order?inv=${encodeURIComponent(orderNum)}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 18px",
                  background: "#ec2226",
                  color: "#ffffff",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  textDecoration: "none"
                }}
              >
                <PackageCheck size={15} /> Track Order <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* REFERENCE NUMBERS CALLOUT */}
          <div style={{ marginTop: "28px", padding: "18px 22px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Order Tracking Ref</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <span style={{ fontSize: "17px", fontWeight: "800", color: "#ec2226", fontFamily: "monospace" }}>{orderNum}</span>
                <button
                  onClick={handleCopyCode}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "2px" }}
                  title="Copy code"
                >
                  {copiedCode ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Invoice Code</div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginTop: "4px", fontFamily: "monospace" }}>{invoiceNum}</div>
            </div>

            <div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Estimated Delivery</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>
                {order.division === "Dhaka" ? "24 - 48 Hours (Express Fleet)" : "4 - 7 Business Days (Regional Crate)"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Payment Status</div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: isPaid ? "#16a34a" : isPartialPaid ? "#2563eb" : "#d97706", marginTop: "4px" }}>
                {isPaid
                  ? "PAID (Full)"
                  : isPartialPaid
                  ? `৳${advancePaid.toLocaleString()} PAID • ৳${remainingDue.toLocaleString()} DUE ON DELIVERY`
                  : `COD (৳${codAdvanceRequired.toLocaleString()} Advance Pending)`}
              </div>
            </div>
          </div>
        </div>

        {/* 2-COLUMN LAYOUT: ORDER DETAILS & SUMMARY */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "24px" }} className="order-confirmation-grid">
          {/* LEFT: LINE ITEMS & PRODUCTION STATUS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* ITEMS CARD */}
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: "0 0 18px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                Ordered Handcrafted Furniture ({items.length} item{items.length > 1 ? "s" : ""})
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {items.map((item, idx) => {
                  const itemImg = item.image || item.product?.images?.[0]?.url || "/images/furniture-placeholder.svg";
                  const wood = item.woodType || item.selectedWood || item.product?.primaryMaterial || "Seasoned Mahogany";
                  const dims = item.dimensions || item.selectedSize || item.variantName || item.product?.dimensions || "Standard Factory Dimensions";
                  const price = item.unitPrice || item.priceBDT || 0;
                  const qty = item.quantity || 1;
                  const itemTotal = item.totalPrice || price * qty;

                  return (
                    <div key={item.id || idx} style={{ display: "flex", gap: "16px", alignItems: "center", paddingBottom: "16px", borderBottom: idx < items.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <img
                        src={itemImg}
                        alt={item.productName || item.name}
                        width="70"
                        height="70"
                        loading="lazy"
                        style={{ width: "70px", height: "70px", aspectRatio: "1 / 1", borderRadius: "10px", objectFit: "cover", border: "1px solid #e2e8f0", flexShrink: 0 }}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/furniture-placeholder.svg"; }}
                      />
                      <div style={{ flexGrow: 1 }}>
                        <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                          {item.productName || item.name}
                        </h4>
                        <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          <span>Timber: <strong style={{ color: "#334155" }}>{wood}</strong></span>
                          <span>Dimension: <strong style={{ color: "#334155" }}>{dims}</strong></span>
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginTop: "4px" }}>
                          ৳{price.toLocaleString()} × {qty} unit{qty > 1 ? "s" : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                        ৳{itemTotal.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7-STEP PRODUCTION LIFECYCLE */}
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  Factory Production Lifecycle
                </h3>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a", background: "#dcfce7", padding: "3px 8px", borderRadius: "6px" }}>
                  Active Queue
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {PRODUCTION_STEPS.map((s) => {
                  const statusStepLookup = {
                    PENDING: 1,
                    AWAITING_PAYMENT: 1,
                    PAYMENT_VERIFICATION: 1,
                    ON_HOLD: 1,
                    CONFIRMED: 2,
                    PROCESSING: 3,
                    PREPARING: 3,
                    TIMBER_SEASONING: 3,
                    JOINERY: 3,
                    PU_POLISHING: 3,
                    QUALITY_AUDIT: 4,
                    READY_FOR_DISPATCH: 4,
                    SHIPPED: 5,
                    DISPATCHED: 5,
                    OUT_FOR_DELIVERY: 5,
                    DELIVERED: 6,
                  };
                  const activeStep = statusStepLookup[order?.orderStatus] || 1;
                  const isDone = s.step < activeStep || (s.step === 6 && order?.orderStatus === "DELIVERED");
                  const isActive = s.step === activeStep && order?.orderStatus !== "DELIVERED";
                  return (
                    <div key={s.step} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                      <div style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        background: isDone ? "#16a34a" : isActive ? "#ec2226" : "#f1f5f9",
                        color: isDone || isActive ? "#ffffff" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "800",
                        flexShrink: 0,
                        marginTop: "2px"
                      }}>
                        {isDone ? "✓" : s.step}
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: isDone || isActive ? "800" : "600", color: isDone || isActive ? "#0f172a" : "#475569" }}>
                          {s.title}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "1px" }}>
                          {s.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: CUSTOMER, ADDRESS & TOTALS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* DELIVERY DESTINATION */}
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "22px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", margin: "0 0 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={18} color="#ec2226" /> Delivery Destination
              </h3>
              <div style={{ fontSize: "14px", color: "#334155", lineHeight: 1.6 }}>
                <strong>{order.customerName || order.customer?.fullName}</strong><br />
                {order.customerPhone || order.customer?.phone}<br />
                {order.customerEmail && <span style={{ color: "#64748b" }}>{order.customerEmail}<br /></span>}
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #e2e8f0", color: "#475569" }}>
                  {order.shippingAddress || order.address}<br />
                  {order.thana && `${order.thana}, `}{order.district || "Dhaka City"}, {order.division || "Dhaka"}
                </div>
              </div>
            </div>

            {/* FINANCIAL SUMMARY */}
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "22px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", margin: "0 0 16px" }}>
                Payment & Billing Details
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", color: "#475569" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Furniture Subtotal</span>
                  <strong>৳{subtotal.toLocaleString()}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Logistics & Assembly</span>
                  <strong>৳{deliveryFee.toLocaleString()}</strong>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
                    <span>Promo Discount</span>
                    <strong>-৳{discountAmount.toLocaleString()}</strong>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #e2e8f0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                  <span>Total Order Value</span>
                  <span>৳{grandTotal.toLocaleString()}</span>
                </div>

                {advancePaid > 0 && !isPaid && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a", fontWeight: "700" }}>
                    <span>COD Security Advance Paid</span>
                    <strong>-৳{advancePaid.toLocaleString()}</strong>
                  </div>
                )}

                {isCod && advancePaid === 0 && !isPaid && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#b45309", fontWeight: "700" }}>
                    <span>Required Security Advance</span>
                    <strong>৳{codAdvanceRequired.toLocaleString()}</strong>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px dashed #cbd5e1", fontSize: "17px", fontWeight: "900", color: "#0f172a" }}>
                  <span>{isPaid ? "Final Payable Due" : "Remaining Due on Delivery"}</span>
                  <span style={{ color: "#ec2226" }}>৳{remainingDue.toLocaleString()}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginTop: "4px" }}>
                  <span>Payment Method</span>
                  <strong>{isCod ? "Cash on Delivery (COD)" : order.paymentMethod}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span>Current Ledger State</span>
                  <strong style={{ color: isPaid ? "#16a34a" : isPartialPaid ? "#2563eb" : isAwaitingVerification ? "#1d4ed8" : "#d97706" }}>
                    {isPaid
                      ? "PAID IN FULL"
                      : isPartialPaid
                      ? `PARTIAL PAID (৳${advancePaid.toLocaleString()} ADVANCE)`
                      : isAwaitingVerification
                      ? "AWAITING VERIFICATION"
                      : isCod
                      ? `ADVANCE ৳${codAdvanceRequired.toLocaleString()} REQUIRED`
                      : order.paymentStatus || "PENDING"}
                  </strong>
                </div>
              </div>

              {/* 10-Year Warranty & Free Assembly Guarantee */}
              <div style={{ marginTop: "18px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={18} color="#ec2226" style={{ flexShrink: 0 }} />
                <span>Protected by Kinglet <strong>10-Year Anti-Termite & Seasoned Timber Warranty</strong></span>
              </div>
            </div>

            {/* 24/7 HELPLINE ASSISTANCE */}
            <div style={{ background: "#111827", borderRadius: "16px", padding: "22px", color: "#ffffff" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                <Headphones size={18} color="#ec2226" /> 24/7 Customer Support
              </h4>
              <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#9ca3af", lineHeight: 1.5 }}>
                Questions regarding timber finish, delivery timing, or architectural customizations?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <a
                  href={`tel:${BRAND_INFO.phone}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "#ec2226", color: "#ffffff", borderRadius: "8px", fontSize: "13px", fontWeight: "700", textDecoration: "none" }}
                >
                  <PhoneCall size={14} /> Call Hotline: {BRAND_INFO.phone}
                </a>
                <a
                  href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent(`Hello Kinglet Furniture, I am inquiring about Order #${orderNum}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "rgba(255,255,255,0.1)", color: "#ffffff", borderRadius: "8px", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}
                >
                  Chat on WhatsApp <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINTABLE INVOICE MODAL */}
      <KingletPrintableInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={order}
      />
    </div>
  );
}
