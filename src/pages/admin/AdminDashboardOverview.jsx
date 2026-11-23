import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAuthService } from "../../utils/adminAuthService";

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/dashboard/stats?range=30d");
      setStats(res.data);
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const {
    totalOrders = 0,
    newOrdersToday = 0,
    pendingPaymentsCount = 0,
    ordersByStatus = {},
    financials = {},
    recentOrders = [],
    salesTrend = [],
  } = stats || {};

  const pendingCount = Number(ordersByStatus?.pending || 0) + Number(ordersByStatus?.awaitingPayment || 0) + Number(ordersByStatus?.paymentVerification || 0);
  const confirmedCount = Number(ordersByStatus?.confirmed || 0);
  const processingCount = Number(ordersByStatus?.processing || 0) + Number(ordersByStatus?.preparing || 0) + Number(ordersByStatus?.readyForDispatch || 0);
  const shippedCount = Number(ordersByStatus?.shipped || 0) + Number(ordersByStatus?.outForDelivery || 0);
  const deliveredCount = Number(ordersByStatus?.delivered || 0);
  const canceledCount = Number(ordersByStatus?.cancelled || 0) + Number(ordersByStatus?.failed || 0);
  const onHoldCount = Number(ordersByStatus?.onHold || 0);
  const totalCount = totalOrders || 0;
  const maxTrendAmount = Math.max(1, ...salesTrend.map((t) => Number(t.amount || 0)));

  return (
    <div>
      {/* Top Breadcrumb Bar */}
      <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#2a2f5b", margin: 0 }}>
          Operations & OMS Dashboard
        </h2>
        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          style={{ padding: "6px 14px", borderRadius: "5px", border: "1px solid #cbd5e1", background: "#ffffff", fontSize: "12px", fontWeight: 700, cursor: "pointer", color: "#334155" }}
        >
          {loading ? "Refreshing..." : "↻ Refresh Metrics"}
        </button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px 16px", borderRadius: "6px", marginBottom: "20px", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Row 1: Two Real-Time Sales & Revenue Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: "24px", marginBottom: "24px" }}>
        {/* Graph 1: Daily Order Revenue Trend (Live DB) */}
        <div style={{ background: "#ffffff", borderRadius: "6px", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#4d585f", margin: 0 }}>
              30-Day Order Revenue Trend (Live DB)
            </h3>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1572e8" }}>
              ৳{Number(financials?.netRevenue || 0).toLocaleString()}
            </span>
          </div>
          {salesTrend.length === 0 ? (
            <div style={{ height: "210px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "13px" }}>
              No order trend data in selected window.
            </div>
          ) : (
            <div style={{ height: "210px", display: "flex", alignItems: "flex-end", gap: "8px", padding: "16px 8px 4px", borderLeft: "1px solid #ebedf2", borderBottom: "1px solid #ebedf2", overflowX: "auto" }}>
              {salesTrend.slice(-18).map((pt) => {
                const hPct = Math.max(8, Math.round((Number(pt.amount || 0) / maxTrendAmount) * 100));
                return (
                  <div key={pt.date} title={`${pt.date}: ৳${Number(pt.amount || 0).toLocaleString()}`} style={{ flex: "1 0 26px", display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "4px" }}>
                      {Math.round(Number(pt.amount || 0) / 1000)}k
                    </div>
                    <div style={{ width: "100%", maxWidth: "24px", height: `${hPct}%`, background: "linear-gradient(180deg, #1572e8 0%, #3b82f6 100%)", borderRadius: "4px 4px 0 0" }} />
                    <div style={{ fontSize: "9px", color: "#8d9498", marginTop: "6px", whiteSpace: "nowrap" }}>
                      {pt.date.slice(5)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Graph 2: Financial Collection & Pipeline Health */}
        <div style={{ background: "#ffffff", borderRadius: "6px", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#4d585f", margin: "0 0 16px" }}>
            Payment Collection & Pipeline Overview
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px", borderRadius: "6px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Total Revenue (Confirmed+)</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#14532d", marginTop: "4px" }}>৳{Number(financials?.netRevenue || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "14px", borderRadius: "6px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>Collected Payments</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#1e3a8a", marginTop: "4px" }}>৳{Number(financials?.collectedPayments || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "14px", borderRadius: "6px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>Outstanding Receivables</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#78350f", marginTop: "4px" }}>৳{Number(financials?.outstandingPayments || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "14px", borderRadius: "6px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#b91c1c", textTransform: "uppercase" }}>Pending Verification / Unpaid</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#7f1d1d", marginTop: "4px" }}>{pendingPaymentsCount} Orders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Complete OMS Pipeline KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Orders", val: totalCount, color: "#312783", icon: "🛍️", link: "/admin/orders" },
          { label: "New Today", val: newOrdersToday, color: "#1572e8", icon: "✨", link: "/admin/orders" },
          { label: "Pending / Verification", val: pendingCount, color: "#ff6a00", icon: "⌛", link: "/admin/orders?status=PENDING" },
          { label: "Confirmed", val: confirmedCount, color: "#0ea5e9", icon: "✅", link: "/admin/orders?status=CONFIRMED" },
          { label: "Processing & Prep", val: processingCount, color: "#8b5cf6", icon: "🪵", link: "/admin/orders?status=PROCESSING" },
          { label: "Shipped / Out", val: shippedCount, color: "#6366f1", icon: "🚚", link: "/admin/orders?status=SHIPPED" },
          { label: "Delivered", val: deliveredCount, color: "#2bb930", icon: "✓", link: "/admin/orders?status=DELIVERED" },
          { label: "On Hold / Cancelled", val: onHoldCount + canceledCount, color: "#f3545d", icon: "✕", link: "/admin/orders?status=CANCELLED" },
        ].map((kpi) => (
          <Link key={kpi.label} to={kpi.link} style={{ textDecoration: "none" }}>
            <div style={{ background: "#ffffff", borderRadius: "6px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "6px", background: kpi.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "18px", flexShrink: 0 }}>
                {kpi.icon}
              </div>
              <div>
                <div style={{ fontSize: "11.5px", color: "#8d9498", fontWeight: 600 }}>{kpi.label}</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#2a2f5b" }}>{kpi.val}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Row 3: Live Recent Orders Table */}
      <div style={{ background: "#ffffff", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #ebedf2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#2a2f5b", margin: 0 }}>
            Recent Orders (Live Database)
          </h3>
          <Link to="/admin/orders" style={{ fontSize: "12.5px", fontWeight: 700, color: "#1572e8", textDecoration: "none" }}>
            View All Orders →
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #ebedf2", color: "#4d585f" }}>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Customer</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Order ID</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Payment</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((ord, idx) => (
                  <tr key={ord.id || idx} style={{ borderBottom: "1px solid #ebedf2" }}>
                    <td style={{ padding: "14px 20px", color: "#1572e8", fontWeight: 600 }}>
                      <Link to={`/admin/orders?openId=${ord.id}`} style={{ color: "#1572e8", textDecoration: "none" }}>
                        {ord.customerName}
                      </Link>
                    </td>
                    <td style={{ padding: "14px 20px", color: "#1572e8", fontFamily: "monospace" }}>
                      <Link to={`/admin/orders?openId=${ord.id}`} style={{ color: "#1572e8", textDecoration: "none" }}>
                        {ord.orderNumber}
                      </Link>
                    </td>
                    <td style={{ padding: "14px 20px", color: "#4d585f" }}>
                      {ord.paymentMethod} • <strong>{ord.paymentStatus}</strong>
                    </td>
                    <td style={{ padding: "14px 20px", color: "#2a2f5b", fontWeight: 600 }}>
                      {String(ord.orderStatus || "").replace(/_/g, " ")}
                    </td>
                    <td style={{ padding: "14px 20px", fontWeight: 600, color: "#2a2f5b" }}>
                      ৳{Number(ord.grandTotal || 0).toLocaleString()}.00
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: "32px 20px", textAlign: "center", color: "#94a3b8" }}>
                    {loading ? "Loading live orders..." : "No orders recorded yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
