import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  User,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  XCircle,
  Truck,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Printer,
  PhoneCall,
  MessageCircle,
  Calendar,
  Sparkles,
  Building2,
  Share2,
} from "lucide-react";
import { BRAND_INFO } from "../data/kingletData";
import { getOrderByTrackingCode } from "../utils/accountService";
import KingletSEO from "../components/Common/KingletSEO";
import KingletPrintableInvoiceModal from "../components/Finance/KingletPrintableInvoiceModal";

export default function TrackOrderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlInv = searchParams.get("inv") || searchParams.get("code") || "";
  const initialInv = urlInv;
  const [invInput, setInvInput] = useState(initialInv);
  const [searchedInv, setSearchedInv] = useState(initialInv);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  useEffect(() => {
    if (urlInv && urlInv !== searchedInv) {
      setInvInput(urlInv);
      setSearchedInv(urlInv);
    }
  }, [urlInv]);

  const loadTracking = useCallback(async (code, { silent = false } = {}) => {
    if (!code) return;
    if (!silent) setLoading(true);
    setFetchError(null);

    try {
      const res = await fetch(`/api/v1/orders/track/${encodeURIComponent(code)}?t=${Date.now()}`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (json.success && json.data) {
        setOrderData(json.data);
        setLastRefreshedAt(new Date());
      } else {
        const localOrder = getOrderByTrackingCode(code);
        if (localOrder) {
          setOrderData(localOrder);
          setLastRefreshedAt(new Date());
        } else {
          setOrderData(null);
          setFetchError(json.message || "No order found matching this tracking code.");
        }
      }
    } catch {
      const localOrder = getOrderByTrackingCode(code);
      if (localOrder) {
        setOrderData(localOrder);
        setLastRefreshedAt(new Date());
      } else if (!silent) {
        setOrderData(null);
        setFetchError("Unable to reach tracking server. Please check your connection and try again.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchedInv) return;
    loadTracking(searchedInv);

    // Live auto-refresh every 15s while customer is watching the tracker
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadTracking(searchedInv, { silent: true });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [searchedInv, loadTracking]);

  const handleSearch = (e) => {
    e?.preventDefault();
    const trimmed = invInput.trim();
    if (trimmed) {
      setSearchedInv(trimmed);
      setSearchParams({ inv: trimmed });
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const steps = orderData?.steps || [];
  const currentStepNum = orderData?.currentStepIndex || 1;
  const isCancelled = orderData?.isCancelled || orderData?.orderStatus === "CANCELLED";
  const isFailed = orderData?.isFailed || orderData?.orderStatus === "FAILED";
  const isOnHold = orderData?.isOnHold || orderData?.orderStatus === "ON_HOLD";
  const isDelivered = orderData?.orderStatus === "DELIVERED";

  // Calculate overall progress percentage across 6 stages
  const progressPercent = isCancelled || isFailed
    ? 0
    : isDelivered
    ? 100
    : Math.min(100, Math.max(16, Math.round(((currentStepNum - 1) / (steps.length > 0 ? steps.length - 1 : 5)) * 100) || 16));

  const trackingCodeDisplay = orderData?.orderNumber || searchedInv;
  const invoiceCodeDisplay = orderData?.invoiceCode;

  // WhatsApp concierge helper
  const whatsappUrl = `https://wa.me/8801898878815?text=${encodeURIComponent(
    `Hello Kinglet Support, I am tracking my order ${trackingCodeDisplay}. Could you please give me an update on production & dispatch?`
  )}`;

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "28px 0 80px", color: "#0f172a" }}>
      <KingletSEO
        title={`Live Furniture Order Tracker | Kinglet Furniture Bangladesh`}
        description="Monitor the real-time kiln seasoning, master joinery, Italian PU lacquering, and doorstep delivery progress of your Kinglet order."
        noindex={true}
      />

      <div className="container" style={{ maxWidth: "920px", margin: "0 auto", padding: "0 16px" }}>
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            color: "#64748b",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <Link to="/" style={{ color: "#475569", textDecoration: "none", fontWeight: "500" }}>
            Home
          </Link>
          <ChevronRight size={13} color="#94a3b8" />
          <Link to="/account" style={{ color: "#475569", textDecoration: "none", fontWeight: "500" }}>
            Account
          </Link>
          <ChevronRight size={13} color="#94a3b8" />
          <span style={{ color: "#ec2226", fontWeight: "700" }}>Live Order Tracking</span>
        </nav>

        {/* Hero Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: "700",
              color: "#0f172a",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#16a34a",
                boxShadow: "0 0 0 3px rgba(22, 163, 74, 0.2)",
              }}
            />
            <span style={{ letterSpacing: "0.5px" }}>MIRPUR FACTORY HUB • REAL-TIME DISPATCH ERP</span>
          </div>

          <h1
            style={{
              fontSize: "30px",
              fontWeight: "900",
              color: "#0f172a",
              letterSpacing: "-0.5px",
              margin: "0 0 10px",
              lineHeight: "1.25",
            }}
          >
            Kinglet Live Order &amp; Craftsmanship Tracker
          </h1>
          <p
            style={{
              color: "#64748b",
              fontSize: "14px",
              maxWidth: "640px",
              margin: "0 auto",
              lineHeight: "1.6",
            }}
          >
            Enter your <strong style={{ color: "#0f172a" }}>Order ID</strong>, <strong style={{ color: "#0f172a" }}>Tracking Code</strong>, or <strong style={{ color: "#0f172a" }}>Invoice Reference</strong> to view real-time factory preparation, timber treatment, courier dispatch, and doorstep handover.
          </p>
        </div>

        {/* Dynamic Search Box */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "8px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)",
            marginBottom: "28px",
          }}
        >
          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexGrow: 1,
                gap: "12px",
                padding: "8px 14px",
                minWidth: "260px",
              }}
            >
              <Search size={20} color="#94a3b8" style={{ flexShrink: 0 }} />
              <input
                id="track-order-code-input"
                name="trackingCode"
                type="text"
                placeholder="Enter Order ID (e.g. KL-ORD-...), Tracking Code (KL-TRK-...), or Phone"
                value={invInput}
                onChange={(e) => setInvInput(e.target.value)}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#0f172a",
                  background: "transparent",
                  fontFamily: "inherit",
                }}
              />
              {invInput && (
                <button
                  type="button"
                  onClick={() => {
                    setInvInput("");
                    document.getElementById("track-order-code-input")?.focus();
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Clear input"
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !invInput.trim()}
              style={{
                background: "#ec2226",
                color: "#ffffff",
                border: "none",
                padding: "12px 28px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "800",
                cursor: loading || !invInput.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 14px rgba(236, 34, 38, 0.3)",
                opacity: loading || !invInput.trim() ? 0.7 : 1,
                flexShrink: 0,
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Searching...
                </>
              ) : (
                <>
                  <Search size={16} /> Track Order
                </>
              )}
            </button>
          </form>

          {/* Quick Lookup Helper Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px 4px",
              borderTop: "1px dashed #f1f5f9",
              fontSize: "12px",
              color: "#64748b",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span>
              💡 Hint: Check your SMS confirmation or invoice email for your <strong>KL-ORD-XXXX</strong> reference.
            </span>
            {lastRefreshedAt && (
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                Live synced: {lastRefreshedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </div>
        </div>

        {/* Empty / Error Notification */}
        {!searchedInv && !orderData && !loading && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px dashed #cbd5e1",
              boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "#64748b",
              }}
            >
              <Package size={28} />
            </div>
            <h2 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
              Ready to Track Your Furniture Journey
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", maxWidth: "440px", margin: "0 auto 20px", lineHeight: "1.5" }}>
              Enter your Order Number in the search box above to inspect live kiln seasoning moisture levels, master joinery milestones, and dispatch status.
            </p>
            <Link
              to="/account"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: "700",
                color: "#ec2226",
                textDecoration: "none",
              }}
            >
              View My Recent Orders in Account <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {fetchError && !orderData && (
          <div
            style={{
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: "14px",
              padding: "18px 20px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              color: "#9f1239",
            }}
          >
            <XCircle size={22} style={{ flexShrink: 0, marginTop: "2px", color: "#e11d48" }} />
            <div style={{ flexGrow: 1 }}>
              <div style={{ fontWeight: "800", fontSize: "14px", marginBottom: "4px" }}>
                {fetchError}
              </div>
              <div style={{ fontSize: "13px", color: "#be123c", lineHeight: "1.5" }}>
                Please verify that your Order ID begins with <code>KL-ORD-</code> or your Invoice Code matches <code>KL-INV-</code>. You can also track using your registered 11-digit Bangladeshi mobile number.
              </div>
              <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
                <a
                  href={`tel:${BRAND_INFO.hotlinePrimary}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    background: "#e11d48",
                    color: "#ffffff",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "700",
                    textDecoration: "none",
                  }}
                >
                  <PhoneCall size={13} /> Call Dispatch Desk ({BRAND_INFO.hotlinePrimary})
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Main Loaded Tracking Card */}
        {orderData && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 30px -5px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)",
              overflow: "hidden",
            }}
          >
            {/* Top Status Header Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                padding: "24px 28px",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "11px",
                      fontWeight: "800",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                      color: "#94a3b8",
                      marginBottom: "6px",
                    }}
                  >
                    <ShieldCheck size={13} color="#22c55e" /> Verified Kinglet Furniture Order
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "24px",
                        fontWeight: "900",
                        color: "#ffffff",
                        letterSpacing: "-0.5px",
                        fontFamily: "monospace",
                      }}
                    >
                      {trackingCodeDisplay}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(trackingCodeDisplay)}
                      title="Copy Tracking Reference"
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "#ffffff",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {copiedCode ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                      {copiedCode ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px", fontSize: "12px", color: "#cbd5e1", flexWrap: "wrap" }}>
                    {invoiceCodeDisplay && (
                      <span style={{ fontFamily: "monospace", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: "5px" }}>
                        Invoice: {invoiceCodeDisplay}
                      </span>
                    )}
                    {orderData.date && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <Calendar size={13} color="#94a3b8" /> Booked on {orderData.date}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side Status & Actions */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                  {/* Dynamic Status Badge */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      fontWeight: "800",
                      background: isCancelled
                        ? "rgba(239, 68, 68, 0.2)"
                        : isDelivered
                        ? "rgba(34, 197, 94, 0.2)"
                        : "rgba(236, 34, 38, 0.2)",
                      border: isCancelled
                        ? "1px solid rgba(239, 68, 68, 0.5)"
                        : isDelivered
                        ? "1px solid rgba(34, 197, 94, 0.5)"
                        : "1px solid rgba(236, 34, 38, 0.5)",
                      color: isCancelled ? "#fca5a5" : isDelivered ? "#86efac" : "#fca5a5",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: isCancelled ? "#ef4444" : isDelivered ? "#22c55e" : "#ec2226",
                        boxShadow: isCancelled ? "none" : isDelivered ? "0 0 8px #22c55e" : "0 0 8px #ec2226",
                      }}
                    />
                    <span>{orderData.statusLabel || orderData.orderStatus?.replace(/_/g, " ")}</span>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => loadTracking(searchedInv)}
                      disabled={loading}
                      title="Sync with live database"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "#ffffff",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: loading ? "wait" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                      {loading ? "Syncing..." : "Live Refresh"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsInvoiceModalOpen(true)}
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "#ffffff",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Printer size={13} /> Official Invoice
                    </button>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: "#16a34a",
                        border: "none",
                        color: "#ffffff",
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        textDecoration: "none",
                      }}
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              {/* Dynamic Overall Progress Bar (Horizontal Meter) */}
              <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: "12px" }}>
                  <span style={{ color: "#94a3b8", fontWeight: "700" }}>
                    Fulfillment Progress: <strong style={{ color: "#ffffff" }}>{progressPercent}% Completed</strong>
                  </span>
                  <span style={{ color: "#f87171", fontWeight: "800" }}>
                    Stage {isCancelled ? "Cancelled" : `${currentStepNum} of ${steps.length || 6}`}
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: "999px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progressPercent}%`,
                      background: isDelivered
                        ? "linear-gradient(90deg, #10b981 0%, #22c55e 100%)"
                        : isCancelled
                        ? "#ef4444"
                        : "linear-gradient(90deg, #22c55e 0%, #ec2226 100%)",
                      borderRadius: "999px",
                      transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Inner Body Content */}
            <div style={{ padding: "28px" }}>
              {/* Alert Boxes for Special Statuses */}
              {isCancelled && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    marginBottom: "24px",
                    color: "#991b1b",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <XCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ fontSize: "14px", display: "block", marginBottom: "2px" }}>
                      This order has been cancelled.
                    </strong>
                    {orderData.cancellationReason && (
                      <div style={{ fontSize: "13px", color: "#b91c1c" }}>
                        Reason: {orderData.cancellationReason}
                      </div>
                    )}
                    {orderData.cancellationDate && (
                      <div style={{ fontSize: "11px", color: "#7f1d1d", marginTop: "4px" }}>
                        Cancelled on: {new Date(orderData.cancellationDate).toLocaleString("en-GB")}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isFailed && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    marginBottom: "24px",
                    color: "#991b1b",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ fontSize: "14px", display: "block", marginBottom: "2px" }}>
                      Order could not proceed (Payment / Verification Failed).
                    </strong>
                    {orderData.rejectedReason && (
                      <div style={{ fontSize: "13px", color: "#b91c1c" }}>
                        Details: {orderData.rejectedReason}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isOnHold && (
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    marginBottom: "24px",
                    color: "#92400e",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <Clock size={20} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ fontSize: "14px", display: "block", marginBottom: "2px" }}>
                      This order is temporarily On Hold.
                    </strong>
                    {orderData.holdReason && (
                      <div style={{ fontSize: "13px", color: "#b45309" }}>
                        Notice: {orderData.holdReason}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3-Column Luxury Logistics & Finance Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "16px",
                  marginBottom: "28px",
                }}
              >
                {/* Card 1: Customer & Delivery Destination */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "10px",
                      }}
                    >
                      <User size={14} color="#ec2226" /> Recipient Client
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "3px" }}>
                      {orderData.customer?.fullName || orderData.customerName || "Valued Customer"}
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px", fontFamily: "monospace" }}>
                      {orderData.customer?.phone || orderData.customerPhone || "—"}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "6px",
                      }}
                    >
                      <MapPin size={14} color="#ec2226" /> Delivery Address
                    </div>
                    <div style={{ fontSize: "13px", color: "#334155", fontWeight: "600", lineHeight: "1.4" }}>
                      {orderData.customer?.address || orderData.fullAddress || orderData.shippingAddress || "Showroom Handover"}
                    </div>
                  </div>

                  {(orderData.district || orderData.division || orderData.deliveryLocation) && (
                    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #cbd5e1", fontSize: "12px", color: "#64748b" }}>
                      📍 {orderData.deliveryLocation || `${orderData.thana || ""}, ${orderData.district || ""}`.replace(/^,\s*/, "")}
                    </div>
                  )}
                </div>

                {/* Card 2: Payment & Due Ledger */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Payment Ledger
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: orderData.paymentStatus === "PAID" ? "#dcfce7" : "#fef3c7",
                          color: orderData.paymentStatus === "PAID" ? "#166534" : "#92400e",
                        }}
                      >
                        {orderData.paymentStatus || "UNPAID"}
                      </span>
                    </div>

                    <div style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", marginBottom: "4px" }}>
                      ৳{Number(orderData.grandTotal || 0).toLocaleString()}
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", marginLeft: "6px" }}>
                        ({orderData.paymentMethod || "COD"})
                      </span>
                    </div>

                    {/* Breakdown */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px", fontSize: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                        <span>Subtotal:</span>
                        <span>৳{Number(orderData.subtotal || 0).toLocaleString()}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                        <span>Delivery Charge:</span>
                        <span>
                          {Number(orderData.deliveryFee || 0) > 0 ? `৳${Number(orderData.deliveryFee).toLocaleString()}` : "Based on Location"}
                        </span>
                      </div>
                      {Number(orderData.discountAmount || 0) > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a", fontWeight: "700" }}>
                          <span>Discount Applied:</span>
                          <span>-৳{Number(orderData.discountAmount).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Settlement Chip */}
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: orderData.paymentStatus === "PAID" ? "#f0fdf4" : "#fffbeb",
                      border: orderData.paymentStatus === "PAID" ? "1px solid #bbf7d0" : "1px solid #fde68a",
                      fontSize: "12px",
                    }}
                  >
                    {orderData.paymentStatus === "PAID" ? (
                      <div style={{ color: "#166534", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle2 size={15} color="#16a34a" /> Paid in Full (100% Settled)
                      </div>
                    ) : Number(orderData.advancePaid || 0) > 0 ? (
                      <div>
                        <div style={{ color: "#166534", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                          <CheckCircle2 size={14} color="#16a34a" /> Advance Received: ৳{Number(orderData.advancePaid).toLocaleString()}
                        </div>
                        <div style={{ color: "#92400e", fontWeight: "900", marginTop: "4px", fontSize: "13px" }}>
                          Due on Delivery: ৳{Number(orderData.remainingDue ?? Math.max(0, Number(orderData.grandTotal || 0) - Number(orderData.advancePaid))).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ color: "#b45309", fontWeight: "800" }}>
                          COD Security Advance: ৳{Number(orderData.codAdvanceRequired || 5000).toLocaleString()} Pending
                        </div>
                        <div style={{ color: "#475569", marginTop: "2px", fontSize: "11px" }}>
                          Balance due on delivery: ৳{Math.max(0, Number(orderData.grandTotal || 0) - Number(orderData.codAdvanceRequired || 5000)).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3: Logistics & White-Glove Dispatch */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "10px",
                      }}
                    >
                      <Truck size={14} color="#ec2226" /> Dispatch Logistics
                    </div>

                    <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
                      {orderData.courierName || "Kinglet White-Glove Fleet"}
                    </div>

                    {orderData.trackingNumber ? (
                      <div style={{ fontSize: "12px", color: "#475569", marginBottom: "8px" }}>
                        Tracking No:{" "}
                        <strong style={{ fontFamily: "monospace", color: "#0f172a" }}>
                          #{orderData.trackingNumber}
                        </strong>
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                        Direct factory transport &amp; professional assembly team.
                      </div>
                    )}

                    <div style={{ fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
                      {orderData.deliveredAt ? (
                        <span style={{ color: "#166534", fontWeight: "700" }}>
                          Delivered on {new Date(orderData.deliveredAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      ) : orderData.estimatedDeliveryDate ? (
                        <span>
                          Estimated Delivery: <strong style={{ color: "#0f172a" }}>{new Date(orderData.estimatedDeliveryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>
                        </span>
                      ) : (
                        <span>Standard Production Window: <strong>3–20 Working Days</strong></span>
                      )}
                    </div>
                  </div>

                  {orderData.trackingUrl ? (
                    <a
                      href={orderData.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        marginTop: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "8px 12px",
                        background: "#0f172a",
                        color: "#ffffff",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        textDecoration: "none",
                      }}
                    >
                      Open Courier Live Tracking <ExternalLink size={12} />
                    </a>
                  ) : (
                    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #cbd5e1", fontSize: "11px", color: "#64748b" }}>
                      Direct showroom hotline: <strong style={{ color: "#0f172a" }}>{BRAND_INFO.hotlinePrimary}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Ordered Furniture Showcase */}
              {orderData.items && orderData.items.length > 0 && (
                <div style={{ marginBottom: "32px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Package size={16} color="#ec2226" /> Purchased Furniture Pieces ({orderData.items.length})
                    </div>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                      Crafted with 10-Year Seasoned Timber Guarantee
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {orderData.items.map((it, idx) => {
                      const lineTotal =
                        it.total !== undefined
                          ? Number(it.total)
                          : Number(it.unitPrice ?? it.priceBDT ?? 0) * Number(it.quantity || 1);
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                            gap: "14px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            {it.image ? (
                              <img
                                src={it.image}
                                alt={it.name}
                                width="54"
                                height="54"
                                loading="lazy"
                                style={{
                                  width: "54px",
                                  height: "54px",
                                  aspectRatio: "1 / 1",
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                  border: "1px solid #e2e8f0",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "54px",
                                  height: "54px",
                                  borderRadius: "8px",
                                  background: "#e2e8f0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#64748b",
                                }}
                              >
                                <Package size={22} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
                                {it.name}
                              </div>
                              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                <span>{it.woodType || "Seasoned Mahogany Internal Structure"}</span>
                                {it.dimensions && <span> • {it.dimensions}</span>}
                              </div>
                              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                                Quantity: <strong style={{ color: "#334155" }}>{it.quantity || 1} Unit(s)</strong>
                                {it.sku && <span> • SKU: {it.sku}</span>}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "15px", fontWeight: "900", color: "#ec2226" }}>
                              ৳{lineTotal.toLocaleString()}
                            </div>
                            {Number(it.quantity || 1) > 1 && (
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                ৳{Number(it.unitPrice || 0).toLocaleString()} / unit
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6-Stage Craftsmanship & Delivery Progression Timeline */}
              {steps.length > 0 && (
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "28px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "22px",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a", margin: 0 }}>
                        Order Tracking &amp; Delivery Progress
                      </h3>
                      <p style={{ fontSize: "12px", color: "#64748b", margin: "3px 0 0" }}>
                        6-Stage official fulfillment progression directly updated by factory supervisors.
                      </p>
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#16a34a",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <Sparkles size={12} /> Auto-Syncing with Factory ERP
                    </div>
                  </div>

                  {/* Connected Stepper */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {steps.map((step, idx) => {
                      const isStepCompleted = step.completed;
                      const isStepCurrent = step.current;
                      const isPending = !isStepCompleted && !isStepCurrent;

                      return (
                        <div
                          key={step.id || idx}
                          style={{
                            display: "flex",
                            gap: "18px",
                            position: "relative",
                          }}
                        >
                          {/* Connected Node Line */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                background: isStepCompleted
                                  ? "#16a34a"
                                  : isStepCurrent
                                  ? "#ec2226"
                                  : "#ffffff",
                                border: isStepCompleted
                                  ? "2px solid #16a34a"
                                  : isStepCurrent
                                  ? "2px solid #ec2226"
                                  : "2px solid #cbd5e1",
                                color: isStepCompleted || isStepCurrent ? "#ffffff" : "#64748b",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 2,
                                fontWeight: "800",
                                fontSize: "13px",
                                boxShadow: isStepCurrent
                                  ? "0 0 0 4px rgba(236, 34, 38, 0.2), 0 4px 10px rgba(236, 34, 38, 0.3)"
                                  : isStepCompleted
                                  ? "0 2px 6px rgba(22, 163, 74, 0.2)"
                                  : "none",
                                transition: "all 0.3s ease",
                              }}
                            >
                              {isStepCompleted ? (
                                <CheckCircle2 size={18} />
                              ) : isStepCurrent ? (
                                <Clock size={17} />
                              ) : (
                                <span>{step.id}</span>
                              )}
                            </div>

                            {idx < steps.length - 1 && (
                              <div
                                style={{
                                  width: "2px",
                                  flexGrow: 1,
                                  background: isStepCompleted ? "#16a34a" : "#e2e8f0",
                                  margin: "4px 0",
                                  minHeight: "40px",
                                }}
                              />
                            )}
                          </div>

                          {/* Step Content Card */}
                          <div
                            style={{
                              flexGrow: 1,
                              paddingBottom: idx === steps.length - 1 ? "0" : "16px",
                            }}
                          >
                            <div
                              style={{
                                background: isStepCurrent
                                  ? "#fff5f5"
                                  : isStepCompleted
                                  ? "#ffffff"
                                  : "#f8fafc",
                                border: isStepCurrent
                                  ? "1px solid #fecaca"
                                  : isStepCompleted
                                  ? "1px solid #e2e8f0"
                                  : "1px dashed #e2e8f0",
                                borderRadius: "12px",
                                padding: "14px 18px",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: "8px",
                                  marginBottom: "4px",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span
                                    style={{
                                      fontSize: "15px",
                                      fontWeight: "800",
                                      color: isStepCurrent
                                        ? "#ec2226"
                                        : isStepCompleted
                                        ? "#0f172a"
                                        : "#64748b",
                                    }}
                                  >
                                    {step.name || step.title}
                                  </span>
                                  {isStepCurrent && (
                                    <span
                                      style={{
                                        fontSize: "10px",
                                        fontWeight: "900",
                                        letterSpacing: "0.5px",
                                        background: "#ec2226",
                                        color: "#ffffff",
                                        padding: "2px 7px",
                                        borderRadius: "999px",
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      CURRENT STAGE
                                    </span>
                                  )}
                                </div>

                                <span
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    color: isStepCurrent
                                      ? "#ec2226"
                                      : isStepCompleted
                                      ? "#16a34a"
                                      : "#94a3b8",
                                  }}
                                >
                                  {step.date || (isStepCompleted ? "Completed" : "Pending")}
                                </span>
                              </div>

                              <div style={{ fontSize: "13px", color: isStepCurrent ? "#475569" : "#64748b", lineHeight: "1.5" }}>
                                {step.desc}
                              </div>

                              {/* Official Factory Log / SMS Note */}
                              {step.note && (
                                <div
                                  style={{
                                    marginTop: "10px",
                                    padding: "8px 12px",
                                    background: isStepCurrent ? "#ffffff" : "#f1f5f9",
                                    border: isStepCurrent ? "1px solid #fed7aa" : "1px solid #e2e8f0",
                                    borderLeft: `3px solid ${isStepCurrent ? "#ec2226" : "#16a34a"}`,
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    color: "#334155",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "8px",
                                  }}
                                >
                                  <ShieldCheck size={14} color={isStepCurrent ? "#ec2226" : "#16a34a"} style={{ flexShrink: 0, marginTop: "2px" }} />
                                  <div style={{ flexGrow: 1, lineHeight: "1.4" }}>
                                    <strong style={{ color: "#0f172a" }}>Factory Log:</strong> {step.note}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Warranty & Hotline Footer Strip */}
              <div
                style={{
                  marginTop: "32px",
                  padding: "16px 20px",
                  background: "#f8fafc",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  fontSize: "13px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ShieldCheck size={20} color="#16a34a" />
                  <span>
                    Protected by <strong>Kinglet 10-Year Solid Timber Replacement Warranty</strong>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <a
                    href={`tel:${BRAND_INFO.hotlinePrimary}`}
                    style={{
                      color: "#ec2226",
                      fontWeight: "800",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <PhoneCall size={14} /> Hotline: {BRAND_INFO.hotlinePrimary}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation CTA */}
        <div style={{ marginTop: "28px", textAlign: "center" }}>
          <Link
            to="/account"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "#475569",
              fontSize: "14px",
              fontWeight: "700",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              transition: "all 0.15s ease",
            }}
          >
            ← Return to Customer Dashboard
          </Link>
        </div>
      </div>

      {/* Official Printable Invoice Modal */}
      {isInvoiceModalOpen && orderData && (
        <KingletPrintableInvoiceModal
          order={orderData}
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
        />
      )}
    </div>
  );
}
