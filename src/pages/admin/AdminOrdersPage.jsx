import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { adminAuthService } from "../../utils/adminAuthService";

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from search params or pathname
  const tabParam = searchParams.get("tab");
  const filterParam = searchParams.get("filter");
  const pathEnd = location.pathname.split("/").filter(Boolean).pop();
  const currentTab =
    tabParam === "transactions" || pathEnd === "transactions"
      ? "transactions"
      : tabParam === "customers" || pathEnd === "customers"
      ? "customers"
      : tabParam === "users" || pathEnd === "users"
      ? "users"
      : tabParam === "tickets" || filterParam === "tickets" || pathEnd === "tickets"
      ? "tickets"
      : "orders";

  // Tab State
  const [activeTab, setActiveTab] = useState(currentTab);

  useEffect(() => {
    setActiveTab(currentTab);
  }, [tabParam, filterParam, location.pathname]);

  const switchTab = (tabName) => {
    setActiveTab(tabName);
    if (tabName === "orders") {
      setSearchParams({});
    } else if (tabName === "tickets") {
      setSearchParams({ filter: "tickets" });
    } else {
      setSearchParams({ tab: tabName });
    }
  };

  // ----------------------------------------------------------------------
  // TAB 1: ORDERS STATE & HANDLERS
  // ----------------------------------------------------------------------
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get("paymentStatus") || "ALL");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [kpiStats, setKpiStats] = useState(null);

  // Selected Order for Inspection Drawer / Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusComment, setStatusComment] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [paymentUpdating, setPaymentUpdating] = useState(false);
  const [manualPaymentStatus, setManualPaymentStatus] = useState("UNPAID");
  const [trackingForm, setTrackingForm] = useState({ courierName: "", trackingNumber: "", trackingUrl: "", estimatedDeliveryDate: "", deliveryLocation: "" });
  const [savingTracking, setSavingTracking] = useState(false);
  const [internalNoteInput, setInternalNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [refundForm, setRefundForm] = useState({ open: false, refundAmount: "", reason: "", refundMethod: "BKASH", restoreStock: true });
  const [processingRefund, setProcessingRefund] = useState(false);

  const PRODUCTION_STEPS = [
    { key: "TIMBER_SEASONING", index: 3, label: "Kiln Seasoning (Legacy)" },
    { key: "JOINERY", index: 3, label: "Master Joinery (Legacy)" },
    { key: "PREPARING", index: 3, label: "Preparing & Finishing (Legacy)" },
    { key: "PU_POLISHING", index: 3, label: "Italian PU Polish (Legacy)" },
    { key: "QUALITY_AUDIT", index: 4, label: "Quality Audit (Legacy)" },
    { key: "DISPATCHED", index: 5, label: "Dispatched (Legacy)" },
  ];

  useEffect(() => {
    const paramStatus = searchParams.get("status");
    if (paramStatus && paramStatus !== statusFilter) {
      setStatusFilter(paramStatus);
      setPage(1);
    }
    const paramOpenId = searchParams.get("openId");
    if (paramOpenId && selectedOrder?.id !== paramOpenId) {
      openOrderDetails(paramOpenId);
    }
  }, [searchParams]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "15",
        status: statusFilter,
        paymentStatus: paymentFilter,
        search,
      });

      const [res, statsRes] = await Promise.all([
        adminAuthService.fetch(`/api/v1/admin/orders?${query.toString()}`),
        adminAuthService.fetch("/api/v1/admin/dashboard/stats?range=30d").catch(() => null),
      ]);
      if (statsRes?.data) setKpiStats(statsRes.data);
      setOrders(res.data || []);
      setSelectedOrderIds([]);
      const total = res.pagination?.total ?? (res.data?.length || 0);
      const computedPages = res.pagination?.totalPages || res.pagination?.pages || Math.ceil(total / 15) || 1;
      setTotalPages(computedPages);
      setTotalCount(total);

      const openId = searchParams.get("openId");
      if (openId && !selectedOrder) {
        openOrderDetails(openId);
      }
    } catch (err) {
      setOrdersError(err.message || "Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab, page, statusFilter, paymentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const openOrderDetails = async (id) => {
    setOrderDetailLoading(true);
    try {
      const res = await adminAuthService.fetch(`/api/v1/admin/orders/${id}`);
      const ord = res.data;
      setSelectedOrder(ord);
      setStatusComment("");
      setManualPaymentStatus(ord?.paymentStatus || "UNPAID");
      setTrackingForm({
        courierName: ord?.courierName || "",
        trackingNumber: ord?.trackingNumber || "",
        trackingUrl: ord?.trackingUrl || "",
        estimatedDeliveryDate: ord?.estimatedDeliveryDate ? String(ord.estimatedDeliveryDate).slice(0, 10) : "",
        deliveryLocation: ord?.deliveryLocation || `${ord?.thana || ""}, ${ord?.district || ""}`.replace(/^,\s*/, ""),
      });
      setRefundForm({
        open: false,
        refundAmount: String(ord?.advanceAmount || ord?.grandTotal || 0),
        reason: "",
        refundMethod: "BKASH",
        restoreStock: true,
      });
    } catch (err) {
      alert(err.message || "Failed to load order details");
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const handlePaymentAction = async ({ orderId, action, paymentStatus, transactionId, rejectionReason }) => {
    setPaymentUpdating(true);
    try {
      await adminAuthService.fetch(`/api/v1/admin/orders/${orderId}/payment`, {
        method: "PATCH",
        body: JSON.stringify({ action, paymentStatus, transactionId, rejectionReason }),
      });
      if (selectedOrder?.id === orderId) {
        await openOrderDetails(orderId);
      }
      fetchOrders();
      if (activeTab === "transactions") fetchTransactions();
    } catch (err) {
      alert(err.message || "Failed to update payment status");
    } finally {
      setPaymentUpdating(false);
    }
  };

  const handleSaveTracking = async (e, transitionToShipped = false) => {
    e?.preventDefault();
    if (!selectedOrder) return;
    setSavingTracking(true);
    try {
      await adminAuthService.fetch(`/api/v1/admin/orders/${selectedOrder.id}/tracking`, {
        method: "POST",
        body: JSON.stringify({
          ...trackingForm,
          ...(transitionToShipped ? { newStatus: "SHIPPED" } : {}),
        }),
      });
      await openOrderDetails(selectedOrder.id);
      fetchOrders();
    } catch (err) {
      alert(err.message || "Failed to save tracking details");
    } finally {
      setSavingTracking(false);
    }
  };

  const handleBookSteadfast = async () => {
    if (!selectedOrder) return;
    setSavingTracking(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/courier/dispatch", {
        method: "POST",
        body: JSON.stringify({ orderId: selectedOrder.id }),
      });
      if (res?.data?.consignment?.tracking_code) {
        alert(`Dispatched via Steadfast! Tracking Code: ${res.data.consignment.tracking_code}`);
      }
      await openOrderDetails(selectedOrder.id);
      fetchOrders();
    } catch (err) {
      alert(err.message || "Failed to dispatch to Steadfast");
    } finally {
      setSavingTracking(false);
    }
  };

  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !internalNoteInput.trim()) return;
    setSavingNote(true);
    try {
      await adminAuthService.fetch(`/api/v1/admin/orders/${selectedOrder.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ note: internalNoteInput.trim() }),
      });
      setInternalNoteInput("");
      await openOrderDetails(selectedOrder.id);
    } catch (err) {
      alert(err.message || "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setProcessingRefund(true);
    try {
      await adminAuthService.fetch(`/api/v1/admin/orders/${selectedOrder.id}/refund`, {
        method: "POST",
        body: JSON.stringify({
          refundAmount: Number(refundForm.refundAmount),
          reason: refundForm.reason || "Admin processed refund",
          refundMethod: refundForm.refundMethod,
          restoreStock: refundForm.restoreStock,
        }),
      });
      await openOrderDetails(selectedOrder.id);
      fetchOrders();
    } catch (err) {
      alert(err.message || "Failed to process refund");
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleUpdateStatus = async (newStatus, stepIndex) => {
    if (!selectedOrder) return;
    setStatusUpdating(true);
    try {
      await adminAuthService.fetch(`/api/v1/admin/orders/${selectedOrder.id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          stepIndex,
          allowOverride: true,
          allowReopen: selectedOrder.orderStatus === "CANCELLED" && newStatus !== "CANCELLED",
          comment: statusComment || `Order moved to ${newStatus} by factory supervisor`,
        }),
      });
      await openOrderDetails(selectedOrder.id);
      fetchOrders();
    } catch (err) {
      alert(err.message || "Failed to update order status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Permanently delete order ${orderNumber || orderId}? This cannot be undone.`)) {
      return;
    }
    setDeletingOrderId(orderId);
    try {
      await adminAuthService.fetch(`/api/v1/admin/orders/${orderId}`, {
        method: "DELETE",
      });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
      fetchOrders();
    } catch (err) {
      alert(err.message || "Failed to delete order");
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleBulkDeleteOrders = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedOrderIds.length} selected order(s)? This cannot be undone.`)) {
      return;
    }
    setBulkDeleting(true);
    try {
      await adminAuthService.fetch("/api/v1/admin/orders/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ orderIds: selectedOrderIds }),
      });
      if (selectedOrder && selectedOrderIds.includes(selectedOrder.id)) {
        setSelectedOrder(null);
      }
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (err) {
      alert(err.message || "Failed to delete selected orders");
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelectOrder = (id) => {
    setSelectedOrderIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAllOrders = () => {
    if (orders.length > 0 && selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o) => o.id));
    }
  };

  const getStatusBadge = (s) => {
    if (s === "DELIVERED") return { bg: "#ecfdf5", color: "#059669" };
    if (s === "CANCELLED" || s === "FAILED") return { bg: "#fef2f2", color: "#dc2626" };
    if (s === "PENDING" || s === "AWAITING_PAYMENT" || s === "ON_HOLD") return { bg: "#fef3c7", color: "#b45309" };
    if (s === "PAYMENT_VERIFICATION") return { bg: "#dbeafe", color: "#1e40af" };
    if (s === "DISPATCHED" || s === "SHIPPED" || s === "OUT_FOR_DELIVERY") return { bg: "#f5f3ff", color: "#7c3aed" };
    if (s === "CONFIRMED") return { bg: "#e0f2fe", color: "#0369a1" };
    return { bg: "#eff6ff", color: "#2563eb" };
  };

  // ----------------------------------------------------------------------
  // TAB 2: TRANSACTIONS STATE & HANDLERS
  // ----------------------------------------------------------------------
  const [transactions, setTransactions] = useState([]);
  const [txnLoading, setTxnLoading] = useState(false);

  const fetchTransactions = async () => {
    setTxnLoading(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/transactions");
      setTransactions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTxnLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactions();
    }
  }, [activeTab]);

  // ----------------------------------------------------------------------
  // TAB 3: CUSTOMERS STATE & HANDLERS
  // ----------------------------------------------------------------------
  const [customers, setCustomers] = useState([]);
  const [custLoading, setCustLoading] = useState(false);

  const fetchCustomers = async () => {
    setCustLoading(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/customers");
      setCustomers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCustLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "customers") {
      fetchCustomers();
    }
  }, [activeTab]);

  // ----------------------------------------------------------------------
  // TAB 4: TICKETS STATE & HANDLERS
  // ----------------------------------------------------------------------
  const [tickets, setTickets] = useState([]);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketResolutionNote, setTicketResolutionNote] = useState("");

  const fetchTickets = async () => {
    setTicketLoading(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/tickets");
      setTickets(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTicketLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tickets") {
      fetchTickets();
    }
  }, [activeTab]);

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      await adminAuthService.fetch(`/api/v1/admin/tickets/${ticketId}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          resolutionNotes: ticketResolutionNote || `Status changed to ${newStatus}`,
        }),
      });
      setSelectedTicket(null);
      setTicketResolutionNote("");
      fetchTickets();
    } catch (err) {
      alert("Failed to update ticket: " + err.message);
    }
  };

  // ----------------------------------------------------------------------
  // TAB 5: SYSTEM USERS STATE & HANDLERS
  // ----------------------------------------------------------------------
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  return (
    <div>
      {/* Top Navigation Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { key: "orders", label: `Manage Orders (${totalCount || orders.length})`, icon: "📋" },
          { key: "transactions", label: `Transactions (${transactions.length})`, icon: "🔀" },
          { key: "customers", label: `Customer List (${customers.length})`, icon: "👥" },
          { key: "tickets", label: `Support Tickets (${tickets.length})`, icon: "🎫" },
          { key: "users", label: `System Users (${users.length})`, icon: "👤" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                border: "none",
                background: "transparent",
                borderBottom: isActive ? "3px solid #ef4444" : "3px solid transparent",
                color: isActive ? "#ef4444" : "#64748b",
                fontWeight: isActive ? 800 : 600,
                fontSize: "14px",
                cursor: "pointer",
                marginBottom: "-1px",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ====================================================================== */}
      {/* TAB 1: ORDERS VIEW */}
      {/* ====================================================================== */}
      {activeTab === "orders" && (
        <div>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                Orders & Factory Production Pipeline
              </h1>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                {totalCount} Total orders tracked across Mirpur Factory Hub.
              </p>
            </div>
          </div>

          {/* KPI Summary Strip */}
          {kpiStats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: "10px", marginBottom: "16px" }}>
              {[
                { label: "New Today", val: kpiStats.newOrdersToday || 0, bg: "#eff6ff", color: "#1d4ed8" },
                { label: "Awaiting Verification", val: kpiStats.ordersByStatus?.paymentVerification || 0, bg: "#fef3c7", color: "#b45309" },
                { label: "Confirmed", val: kpiStats.ordersByStatus?.confirmed || 0, bg: "#e0f2fe", color: "#0369a1" },
                { label: "In Production", val: (kpiStats.ordersByStatus?.processing || 0) + (kpiStats.ordersByStatus?.preparing || 0), bg: "#f3e8ff", color: "#7e22ce" },
                { label: "Shipped / Out", val: (kpiStats.ordersByStatus?.shipped || 0) + (kpiStats.ordersByStatus?.outForDelivery || 0), bg: "#eef2ff", color: "#4338ca" },
                { label: "Delivered", val: kpiStats.ordersByStatus?.delivered || 0, bg: "#ecfdf5", color: "#047857" },
                { label: "Pending Payments", val: kpiStats.pendingPaymentsCount || 0, bg: "#fff7ed", color: "#c2410c" },
                { label: "Outstanding Due", val: `৳${Number(kpiStats.financials?.outstandingPayments || 0).toLocaleString()}`, bg: "#fef2f2", color: "#b91c1c" },
              ].map((k) => (
                <div key={k.label} style={{ background: k.bg, padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color: k.color, textTransform: "uppercase" }}>{k.label}</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{k.val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filter and Search Bar */}
          <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <div style={{ flexGrow: 1, minWidth: "240px" }}>
                <input
                  type="text"
                  placeholder="Search by Order ID (KL-TRK-...), Customer Name, or Phone..."
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

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#fff", outline: "none" }}
              >
                <option value="ALL">All Order Stages</option>
                <option value="PENDING">Pending</option>
                <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                <option value="PAYMENT_VERIFICATION">Payment Verification</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="PREPARING">Preparing</option>
                <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
                <option value="SHIPPED">Shipped</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="FAILED">Failed / Rejected</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
                <option value="TIMBER_SEASONING">Kiln Seasoning (Legacy)</option>
                <option value="JOINERY">Joinery Assembly (Legacy)</option>
                <option value="PU_POLISHING">PU Polishing (Legacy)</option>
                <option value="QUALITY_AUDIT">Quality Audit (Legacy)</option>
                <option value="DISPATCHED">Dispatched (Legacy)</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#fff", outline: "none" }}
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PENDING">Pending</option>
                <option value="AWAITING_VERIFICATION">Awaiting Verification</option>
                <option value="PARTIAL">Partially Paid (COD Advance)</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
                <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                <option value="REFUNDED">Refunded</option>
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
          </div>

          {/* Bulk Selection Toolbar */}
          {selectedOrderIds.length > 0 && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "12px 18px",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#991b1b" }}>
                {selectedOrderIds.length} order(s) selected
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedOrderIds([])}
                  style={{
                    padding: "7px 14px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  disabled={bulkDeleting}
                  onClick={handleBulkDeleteOrders}
                  style={{
                    padding: "7px 14px",
                    background: "#dc2626",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#ffffff",
                    cursor: bulkDeleting ? "not-allowed" : "pointer",
                  }}
                >
                  {bulkDeleting ? "Deleting..." : `🗑️ Delete Selected (${selectedOrderIds.length})`}
                </button>
              </div>
            </div>
          )}

          {/* Orders Table */}
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {ordersLoading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
                <div style={{ width: "32px", height: "32px", border: "3px solid #ef4444", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
                <div>Loading factory orders...</div>
              </div>
            ) : ordersError ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#dc2626" }}>
                Error: {ordersError}
              </div>
            ) : orders.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
                No orders found matching the filter criteria.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>
                      <th style={{ padding: "12px 14px", width: "36px" }}>
                        <input
                          type="checkbox"
                          checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                          onChange={toggleSelectAllOrders}
                          aria-label="Select all orders"
                          style={{ cursor: "pointer", width: "15px", height: "15px" }}
                        />
                      </th>
                      <th style={{ padding: "12px 18px" }}>Order Ref</th>
                      <th style={{ padding: "12px 18px" }}>Customer & Location</th>
                      <th style={{ padding: "12px 18px" }}>Items Snapshot</th>
                      <th style={{ padding: "12px 18px" }}>Grand Total</th>
                      <th style={{ padding: "12px 18px" }}>Payment</th>
                      <th style={{ padding: "12px 18px" }}>Production Stage</th>
                      <th style={{ padding: "12px 18px" }}>Booking Date</th>
                      <th style={{ padding: "12px 18px", textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const badge = getStatusBadge(o.orderStatus);
                      const itemCount = o.itemsCount || (o.items ? o.items.length : 0);
                      const isSelected = selectedOrderIds.includes(o.id);
                      return (
                        <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9", background: isSelected ? "#fff1f2" : "transparent" }}>
                          <td style={{ padding: "14px" }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOrder(o.id)}
                              aria-label={`Select order ${o.orderNumber}`}
                              style={{ cursor: "pointer", width: "15px", height: "15px" }}
                            />
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <div style={{ fontWeight: 800, color: "#0f172a" }}>{o.orderNumber}</div>
                            <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>{o.invoiceCode}</div>
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <div style={{ fontWeight: 700, color: "#1e293b" }}>{o.customerName}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{o.customerPhone}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{o.shippingAddress}</div>
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>{itemCount} Furniture Item(s)</div>
                            <div style={{ fontSize: "11px", color: "#64748b", maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {(o.items || []).map((i) => i.productName).join(", ")}
                            </div>
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <div style={{ fontWeight: 800, color: "#0f172a" }}>৳{Number(o.grandTotal || 0).toLocaleString()}</div>
                            {o.discountAmount > 0 && (
                              <div style={{ fontSize: "10px", color: "#10b981", fontWeight: 600 }}>
                                ৳{Number(o.discountAmount).toLocaleString()} saved
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: o.paymentStatus === "PAID" ? "#059669" : "#334155" }}>
                              {o.paymentMethod || "COD"}
                            </div>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background:
                                  o.paymentStatus === "PAID"
                                    ? "#dcfce7"
                                    : o.paymentStatus === "PARTIAL"
                                    ? "#dbeafe"
                                    : "#fef3c7",
                                color:
                                  o.paymentStatus === "PAID"
                                    ? "#15803d"
                                    : o.paymentStatus === "PARTIAL"
                                    ? "#1d4ed8"
                                    : "#b45309",
                              }}
                            >
                              {o.paymentStatus === "PARTIAL" ? "ADVANCE PAID (5K)" : o.paymentStatus}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 8px", borderRadius: "6px", background: badge.bg, color: badge.color, display: "inline-block" }}>
                              {o.orderStatus.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px", color: "#64748b", fontSize: "12px" }}>
                            {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                              <button
                                onClick={() => openOrderDetails(o.id)}
                                style={{
                                  padding: "6px 12px",
                                  background: "#f8fafc",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  cursor: "pointer",
                                }}
                              >
                                Manage →
                              </button>
                              <button
                                type="button"
                                disabled={deletingOrderId === o.id}
                                onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                                title="Delete Order Permanently"
                                style={{
                                  padding: "6px 10px",
                                  background: "#fef2f2",
                                  border: "1px solid #fecaca",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "#dc2626",
                                  cursor: deletingOrderId === o.id ? "not-allowed" : "pointer",
                                }}
                              >
                                {deletingOrderId === o.id ? "..." : "🗑️"}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Page {page} of {totalPages} ({totalCount} total orders)
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: page <= 1 ? "#f1f5f9" : "#fff", cursor: page <= 1 ? "not-allowed" : "pointer" }}
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: page >= totalPages ? "#f1f5f9" : "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: TRANSACTIONS VIEW */}
      {/* ====================================================================== */}
      {activeTab === "transactions" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                Payment & Settlement Transactions
              </h1>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Audit logs of bKash, Nagad, POS and Cash on Delivery payments.
              </p>
            </div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {txnLoading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>No transactions logged yet.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, textTransform: "uppercase", fontSize: "11px" }}>
                      <th style={{ padding: "12px 18px" }}>TXN Code / Gateway</th>
                      <th style={{ padding: "12px 18px" }}>Order Ref</th>
                      <th style={{ padding: "12px 18px" }}>Customer Details</th>
                      <th style={{ padding: "12px 18px" }}>Amount Paid</th>
                      <th style={{ padding: "12px 18px" }}>Settlement Status</th>
                      <th style={{ padding: "12px 18px" }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontFamily: "monospace" }}>
                            {t.manualTrxId ? `TrxID: ${t.manualTrxId}` : t.transactionRef || t.id.substring(0, 12)}
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#0369a1" }}>
                            {t.paymentChannel || t.gateway} {t.purpose ? `• ${t.purpose}` : ""}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", fontWeight: 700, color: "#0f172a" }}>
                          {t.order?.orderNumber || "Direct Purchase"}
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>{t.order?.customerName || "Customer"}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{t.order?.customerPhone || "N/A"}</div>
                        </td>
                        <td style={{ padding: "14px 18px", fontWeight: 800, color: "#0f172a" }}>
                          ৳{Number(t.amount).toLocaleString()}
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: t.status === "PAID" || t.status === "SUCCESS" || t.status === "CONFIRMED" ? "#dcfce7" : t.status === "FAILED" ? "#fee2e2" : "#fef3c7", color: t.status === "PAID" || t.status === "SUCCESS" || t.status === "CONFIRMED" ? "#166534" : t.status === "FAILED" ? "#b91c1c" : "#b45309" }}>
                            {t.status}
                          </span>
                          {(t.status === "AWAITING_VERIFICATION" || t.status === "PENDING") && t.orderId && (
                            <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                              <button
                                type="button"
                                disabled={paymentUpdating}
                                onClick={() => handlePaymentAction({ orderId: t.orderId, action: "APPROVE_TRANSACTION", transactionId: t.id })}
                                style={{ padding: "3px 8px", borderRadius: "4px", border: "none", background: "#16a34a", color: "#fff", fontSize: "10.5px", fontWeight: 700, cursor: "pointer" }}
                              >
                                ✓ Verify
                              </button>
                              <button
                                type="button"
                                disabled={paymentUpdating}
                                onClick={() => {
                                  const reason = window.prompt("Rejection reason:", "TrxID not found / amount mismatch");
                                  if (reason !== null) {
                                    handlePaymentAction({ orderId: t.orderId, action: "REJECT_TRANSACTION", transactionId: t.id, rejectionReason: reason });
                                  }
                                }}
                                style={{ padding: "3px 8px", borderRadius: "4px", border: "none", background: "#dc2626", color: "#fff", fontSize: "10.5px", fontWeight: 700, cursor: "pointer" }}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "14px 18px", color: "#64748b", fontSize: "12px" }}>
                          {new Date(t.createdAt).toLocaleString("en-GB")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 3: CUSTOMERS VIEW */}
      {/* ====================================================================== */}
      {activeTab === "customers" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                Customer Directory & Purchasing History
              </h1>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                {customers.length} verified showroom and online furniture clients.
              </p>
            </div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {custLoading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Loading customers...</div>
            ) : customers.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>No customer profiles found.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, textTransform: "uppercase", fontSize: "11px" }}>
                      <th style={{ padding: "12px 18px" }}>Client Name</th>
                      <th style={{ padding: "12px 18px" }}>Contact Phone</th>
                      <th style={{ padding: "12px 18px" }}>Email</th>
                      <th style={{ padding: "12px 18px" }}>Orders Count</th>
                      <th style={{ padding: "12px 18px" }}>Total Spend</th>
                      <th style={{ padding: "12px 18px" }}>Member Since</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => {
                      const totalSpend = (c.orders || []).reduce((acc, o) => acc + (o.grandTotal || 0), 0);
                      return (
                        <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 18px", fontWeight: 800, color: "#0f172a" }}>
                            {c.fullName}
                          </td>
                          <td style={{ padding: "14px 18px", color: "#1e293b", fontFamily: "monospace" }}>
                            {c.phone}
                          </td>
                          <td style={{ padding: "14px 18px", color: "#64748b" }}>
                            {c.email || "No email on record"}
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: "#f1f5f9", color: "#0f172a" }}>
                              {c.orders?.length || 0} order(s)
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px", fontWeight: 800, color: "#15803d" }}>
                            ৳{totalSpend.toLocaleString()}
                          </td>
                          <td style={{ padding: "14px 18px", color: "#64748b", fontSize: "12px" }}>
                            {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 4: TICKETS VIEW */}
      {/* ====================================================================== */}
      {activeTab === "tickets" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                Support Tickets & Customer Inquiries
              </h1>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Warranty claims, carpenter fitting requests, and design studio inquiries.
              </p>
            </div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {ticketLoading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>No active tickets logged.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, textTransform: "uppercase", fontSize: "11px" }}>
                      <th style={{ padding: "12px 18px" }}>Ticket ID / Source</th>
                      <th style={{ padding: "12px 18px" }}>Client</th>
                      <th style={{ padding: "12px 18px" }}>Issue Category</th>
                      <th style={{ padding: "12px 18px" }}>Description</th>
                      <th style={{ padding: "12px 18px" }}>Status</th>
                      <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontFamily: "monospace" }}>{t.id}</div>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "#e2e8f0", color: "#475569" }}>{t.source}</span>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{t.customerName}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{t.customerPhone}</div>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: "#fef3c7", color: "#92400e" }}>
                            {t.issueType}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", maxWidth: "280px" }}>
                          <div style={{ color: "#334155", fontSize: "12px" }}>{t.description}</div>
                          {t.resolutionNotes && (
                            <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px", fontStyle: "italic" }}>
                              Note: {t.resolutionNotes}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, padding: "3px 8px", borderRadius: "6px", background: t.status === "RESOLVED" ? "#dcfce7" : t.status === "IN_REVIEW" ? "#e0f2fe" : "#fee2e2", color: t.status === "RESOLVED" ? "#166534" : t.status === "IN_REVIEW" ? "#075985" : "#991b1b" }}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            {t.status !== "RESOLVED" && (
                              <button
                                onClick={() => handleUpdateTicketStatus(t.id, "RESOLVED")}
                                style={{ padding: "4px 8px", background: "#15803d", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                              >
                                Resolve ✓
                              </button>
                            )}
                            {t.status === "OPEN" && (
                              <button
                                onClick={() => handleUpdateTicketStatus(t.id, "IN_REVIEW")}
                                style={{ padding: "4px 8px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                              >
                                Review
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 5: SYSTEM USERS VIEW */}
      {/* ====================================================================== */}
      {activeTab === "users" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                System Users & Role-Based Access Control
              </h1>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Authorized administrators, factory supervisors, and dispatch officers.
              </p>
            </div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {usersLoading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Loading system staff...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, textTransform: "uppercase", fontSize: "11px" }}>
                      <th style={{ padding: "12px 18px" }}>Full Name</th>
                      <th style={{ padding: "12px 18px" }}>Phone / Login</th>
                      <th style={{ padding: "12px 18px" }}>Assigned Roles</th>
                      <th style={{ padding: "12px 18px" }}>Account Status</th>
                      <th style={{ padding: "12px 18px" }}>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 18px", fontWeight: 800, color: "#0f172a" }}>
                          {u.fullName}
                        </td>
                        <td style={{ padding: "14px 18px", fontFamily: "monospace", color: "#334155" }}>
                          {u.phone}
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          {(u.roles || []).map((r, i) => (
                            <span key={i} style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#e0f2fe", color: "#0369a1", marginRight: "4px" }}>
                              {r.role?.name || "SUPER_ADMIN"}
                            </span>
                          ))}
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: u.isActive !== false ? "#dcfce7" : "#fee2e2", color: u.isActive !== false ? "#166534" : "#991b1b" }}>
                            {u.isActive !== false ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", color: "#64748b", fontSize: "12px" }}>
                          {new Date(u.createdAt).toLocaleDateString("en-GB")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* ORDER INSPECTION MODAL DRAWER */}
      {/* ====================================================================== */}
      {selectedOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              background: "#ffffff",
              height: "100%",
              overflowY: "auto",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Order {selectedOrder.orderNumber}
                  </h2>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "3px 9px",
                      borderRadius: "999px",
                      background: getStatusBadge(selectedOrder.orderStatus).bg,
                      color: getStatusBadge(selectedOrder.orderStatus).color,
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    {selectedOrder.orderStatus.replace(/_/g, " ")}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
                  Invoice: {selectedOrder.invoiceCode}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  disabled={deletingOrderId === selectedOrder.id}
                  onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.orderNumber)}
                  style={{
                    padding: "6px 11px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#dc2626",
                    cursor: deletingOrderId === selectedOrder.id ? "not-allowed" : "pointer",
                  }}
                >
                  {deletingOrderId === selectedOrder.id ? "Deleting..." : "🗑️ Delete"}
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{ background: "none", border: "none", fontSize: "20px", color: "#64748b", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
              {selectedOrder.orderStatus === "CANCELLED" && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    fontSize: "12px",
                    color: "#991b1b",
                    fontWeight: 600,
                  }}
                >
                  ⚠️ This order is currently <strong>CANCELLED</strong>. Clicking any milestone step below will reopen the order and update live tracking, or you can permanently delete it.
                </div>
              )}

              {/* Customer & Delivery Summary */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "8px" }}>
                  Delivery & Customer Details
                </h3>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <span>{selectedOrder.customerName}</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <a href={`tel:${selectedOrder.customerPhone}`} style={{ padding: "4px 10px", background: "#0f172a", color: "#fff", borderRadius: "6px", fontSize: "11px", fontWeight: 700, textDecoration: "none" }}>
                      📞 Call
                    </a>
                    <a
                      href={`https://wa.me/${String(selectedOrder.customerPhone || "").replace(/\D/g, "").replace(/^0/, "880")}?text=${encodeURIComponent(`Hello ${selectedOrder.customerName}, regarding your Kinglet order ${selectedOrder.orderNumber}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: "4px 10px", background: "#16a34a", color: "#fff", borderRadius: "6px", fontSize: "11px", fontWeight: 700, textDecoration: "none" }}
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "#334155" }}>📞 {selectedOrder.customerPhone}</div>
                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                  📍 {selectedOrder.shippingAddress}, {selectedOrder.thana}, {selectedOrder.district}
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "12px" }}>
                  Purchased Furniture Pieces
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(selectedOrder.items || []).length === 0 ? (
                    <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", fontSize: "12px", color: "#64748b" }}>
                      No line items recorded for this order.
                    </div>
                  ) : (
                    (selectedOrder.items || []).map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>{item.productName}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>
                            Qty: {item.quantity} × ৳{Number(item.unitPrice).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px" }}>
                          ৳{Number(item.totalPrice).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ borderTop: "1px dashed #cbd5e1", marginTop: "16px", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>Grand Total</span>
                    <span style={{ fontSize: "18px", fontWeight: 900, color: "#ef4444" }}>৳{Number(selectedOrder.grandTotal || 0).toLocaleString()}</span>
                  </div>
                  {(() => {
                    const paidAdv =
                      selectedOrder.advanceAmount !== undefined && selectedOrder.advanceAmount !== null && Number(selectedOrder.advanceAmount) > 0
                        ? Number(selectedOrder.advanceAmount)
                        : (selectedOrder.payments || [])
                            .filter((p) => p.status === "SUCCESS")
                            .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    const dueCod =
                      selectedOrder.dueAmount !== undefined && selectedOrder.dueAmount !== null
                        ? Number(selectedOrder.dueAmount)
                        : Math.max(0, Number(selectedOrder.grandTotal || 0) - paidAdv);
                    const isCod = String(selectedOrder.paymentMethod || "").toUpperCase() === "COD";
                    if (!isCod && paidAdv === 0 && dueCod === 0) return null;
                    return (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", background: paidAdv > 0 ? "#eff6ff" : "#fffbeb", padding: "8px 10px", borderRadius: "6px", border: paidAdv > 0 ? "1px solid #bfdbfe" : "1px solid #fde68a" }}>
                        <span style={{ fontWeight: 700, color: paidAdv > 0 ? "#1d4ed8" : "#b45309" }}>
                          {paidAdv > 0 ? `Paid / Advance: -৳${paidAdv.toLocaleString()}` : isCod ? "COD Advance: Pending Verification" : "Payment Due"}
                        </span>
                        <strong style={{ color: "#0f172a" }}>Due on Delivery: ৳{dueCod.toLocaleString()}</strong>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Payment Verification & Ledger Controls */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "8px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Payment Verification & Status
                  </h3>
                  <span style={{ fontSize: "11px", fontWeight: 800, padding: "3px 8px", borderRadius: "999px", background: "#e2e8f0", color: "#0f172a" }}>
                    {selectedOrder.paymentStatus}
                  </span>
                </div>

                {(selectedOrder.payments || []).length === 0 ? (
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px", background: "#fff", padding: "10px", borderRadius: "6px", border: "1px dashed #cbd5e1" }}>
                    No customer transaction submitted yet ({selectedOrder.paymentMethod}).
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                    {selectedOrder.payments.map((tx) => {
                      const canReview = tx.status === "AWAITING_VERIFICATION" || tx.status === "PENDING";
                      return (
                        <div key={tx.id} style={{ background: "#fff", padding: "10px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <strong style={{ color: "#0f172a" }}>
                              {tx.channel || tx.gateway} • ৳{Number(tx.amount || 0).toLocaleString()}
                            </strong>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: tx.status === "SUCCESS" ? "#ecfdf5" : tx.status === "FAILED" ? "#fef2f2" : "#fffbeb",
                                color: tx.status === "SUCCESS" ? "#059669" : tx.status === "FAILED" ? "#dc2626" : "#b45309",
                              }}
                            >
                              {tx.status}
                            </span>
                          </div>
                          {tx.manualTrxId && (
                            <div style={{ color: "#334155", fontFamily: "monospace", fontSize: "11px" }}>
                              TrxID: <strong>{tx.manualTrxId}</strong> {tx.senderAccount ? `(${tx.senderAccount})` : ""}
                            </div>
                          )}
                          {tx.rejectionReason && (
                            <div style={{ color: "#dc2626", fontSize: "11px", marginTop: "3px" }}>
                              Rejected: {tx.rejectionReason}
                            </div>
                          )}
                          {canReview && (
                            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                              <button
                                type="button"
                                disabled={paymentUpdating}
                                onClick={() =>
                                  handlePaymentAction({
                                    orderId: selectedOrder.id,
                                    action: "APPROVE_TRANSACTION",
                                    transactionId: tx.id,
                                  })
                                }
                                style={{ padding: "5px 10px", borderRadius: "5px", border: "none", background: "#059669", color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                              >
                                Approve Payment
                              </button>
                              <button
                                type="button"
                                disabled={paymentUpdating}
                                onClick={() => {
                                  const reason = window.prompt("Enter reason for rejecting this transaction:", "Invalid or unverified TrxID");
                                  if (reason !== null) {
                                    handlePaymentAction({
                                      orderId: selectedOrder.id,
                                      action: "REJECT_TRANSACTION",
                                      transactionId: tx.id,
                                      rejectionReason: reason,
                                    });
                                  }
                                }}
                                style={{ padding: "5px 10px", borderRadius: "5px", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <select
                    value={manualPaymentStatus}
                    onChange={(e) => setManualPaymentStatus(e.target.value)}
                    style={{ flexGrow: 1, padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#fff" }}
                  >
                    <option value="UNPAID">Unpaid</option>
                    <option value="PENDING">Pending</option>
                    <option value="AWAITING_VERIFICATION">Awaiting Verification</option>
                    <option value="PARTIAL">Partially Paid (Advance Received)</option>
                    <option value="PAID">Paid in Full</option>
                    <option value="FAILED">Failed</option>
                    <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                  <button
                    type="button"
                    disabled={paymentUpdating}
                    onClick={() =>
                      handlePaymentAction({
                        orderId: selectedOrder.id,
                        action: "SET_PAYMENT_STATUS",
                        paymentStatus: manualPaymentStatus,
                      })
                    }
                    style={{ padding: "7px 12px", borderRadius: "6px", border: "none", background: "#0f172a", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: paymentUpdating ? "not-allowed" : "pointer" }}
                  >
                    {paymentUpdating ? "Saving..." : "Update Payment"}
                  </button>
                </div>
              </div>

              {/* Centralized OMS Order Status & Production Controls */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
                  Order Status & Production Pipeline
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "12px" }}>
                  {[
                    { key: "CONFIRMED", label: "2. Order Confirmed" },
                    { key: "PROCESSING", label: "3. Factory Received (3–20 Days)" },
                    { key: "READY_FOR_DISPATCH", label: "4. Order is Ready" },
                    { key: "OUT_FOR_DELIVERY", label: "5. Out for Delivery" },
                    { key: "DELIVERED", label: "6. Delivered to Address" },
                    { key: "SHIPPED", label: "Shipped / Courier Dispatched" },
                    { key: "ON_HOLD", label: "Put On Hold" },
                    { key: "FAILED", label: "Reject / Failed" },
                    { key: "CANCELLED", label: "Cancel Order" },
                  ].map((st) => {
                    const isCurrent = selectedOrder.orderStatus === st.key;
                    const isDanger = st.key === "CANCELLED" || st.key === "FAILED";
                    return (
                      <button
                        type="button"
                        key={st.key}
                        onClick={() => handleUpdateStatus(st.key)}
                        disabled={statusUpdating}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: isCurrent ? `2px solid ${isDanger ? "#dc2626" : "#ef4444"}` : `1px solid ${isDanger ? "#fecaca" : "#cbd5e1"}`,
                          background: isCurrent ? "#fef2f2" : "#ffffff",
                          color: isDanger ? "#dc2626" : isCurrent ? "#ef4444" : "#1e293b",
                          fontWeight: isCurrent ? 800 : 600,
                          fontSize: "12px",
                          cursor: statusUpdating ? "not-allowed" : "pointer",
                          textAlign: "left",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>{st.label}</span>
                        {isCurrent && <span style={{ fontSize: "10px", fontWeight: 800 }}>● CURRENT</span>}
                      </button>
                    );
                  })}
                </div>

                <details style={{ marginBottom: "12px" }}>
                  <summary style={{ fontSize: "11px", fontWeight: 700, color: "#475569", cursor: "pointer", marginBottom: "6px" }}>
                    Legacy Craftsmanship Milestones
                  </summary>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {PRODUCTION_STEPS.map((step) => {
                      const isCurrent = selectedOrder.orderStatus === step.key;
                      return (
                        <button
                          type="button"
                          key={step.key}
                          onClick={() => handleUpdateStatus(step.key, step.index)}
                          disabled={statusUpdating}
                          style={{
                            padding: "7px 10px",
                            borderRadius: "6px",
                            border: isCurrent ? "2px solid #ef4444" : "1px solid #cbd5e1",
                            background: isCurrent ? "#fef2f2" : "#ffffff",
                            color: isCurrent ? "#ef4444" : "#1e293b",
                            fontWeight: isCurrent ? 800 : 600,
                            fontSize: "12px",
                            cursor: statusUpdating ? "not-allowed" : "pointer",
                            textAlign: "left",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>{step.label}</span>
                          {isCurrent && <span style={{ fontSize: "10px", fontWeight: 800 }}>●</span>}
                        </button>
                      );
                    })}
                  </div>
                </details>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    Status Transition Note / Reason (Saved to Audit Trail):
                  </label>
                  <input
                    type="text"
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    placeholder="e.g. Payment verified or custom hold/reject reason..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Courier & Shipment Tracking */}
              <form onSubmit={(e) => handleSaveTracking(e, false)} style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Courier & Delivery Tracking
                  </h3>
                  <button
                    type="button"
                    disabled={savingTracking}
                    onClick={handleBookSteadfast}
                    style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", fontSize: "11px", fontWeight: 700, cursor: savingTracking ? "not-allowed" : "pointer" }}
                  >
                    Steadfast 1-Click Dispatch
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                  <input
                    type="text"
                    placeholder="Courier Name (e.g. Kinglet Van / Steadfast)"
                    value={trackingForm.courierName}
                    onChange={(e) => setTrackingForm((p) => ({ ...p, courierName: e.target.value }))}
                    style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#fff" }}
                  />
                  <input
                    type="text"
                    placeholder="Tracking Number"
                    value={trackingForm.trackingNumber}
                    onChange={(e) => setTrackingForm((p) => ({ ...p, trackingNumber: e.target.value }))}
                    style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#fff" }}
                  />
                  <input
                    type="date"
                    title="Estimated Delivery Date"
                    value={trackingForm.estimatedDeliveryDate}
                    onChange={(e) => setTrackingForm((p) => ({ ...p, estimatedDeliveryDate: e.target.value }))}
                    style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#fff" }}
                  />
                  <input
                    type="text"
                    placeholder="Delivery Location / Zone"
                    value={trackingForm.deliveryLocation}
                    onChange={(e) => setTrackingForm((p) => ({ ...p, deliveryLocation: e.target.value }))}
                    style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#fff" }}
                  />
                </div>
                <input
                  type="url"
                  placeholder="Tracking URL (Optional)"
                  value={trackingForm.trackingUrl}
                  onChange={(e) => setTrackingForm((p) => ({ ...p, trackingUrl: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#fff", marginBottom: "10px" }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="submit"
                    disabled={savingTracking}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", fontSize: "12px", fontWeight: 700, cursor: savingTracking ? "not-allowed" : "pointer" }}
                  >
                    {savingTracking ? "Saving..." : "Save Tracking Info"}
                  </button>
                  <button
                    type="button"
                    disabled={savingTracking}
                    onClick={(e) => handleSaveTracking(e, true)}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "none", background: "#0f172a", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: savingTracking ? "not-allowed" : "pointer" }}
                  >
                    Save & Mark Shipped
                  </button>
                </div>
              </form>

              {/* Internal Staff Notes */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                  Internal Staff Notes (Admin Only)
                </h3>
                {selectedOrder.internalNotes && (
                  <pre style={{ margin: "0 0 10px", padding: "10px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "11px", color: "#334155", whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                    {selectedOrder.internalNotes}
                  </pre>
                )}
                <form onSubmit={handleAddInternalNote} style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={internalNoteInput}
                    onChange={(e) => setInternalNoteInput(e.target.value)}
                    placeholder="Add internal verification or logistics note..."
                    style={{ flexGrow: 1, padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#fff" }}
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !internalNoteInput.trim()}
                    style={{ padding: "8px 14px", borderRadius: "6px", border: "none", background: "#0f172a", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: savingNote ? "not-allowed" : "pointer" }}
                  >
                    {savingNote ? "Saving..." : "Add Note"}
                  </button>
                </form>
              </div>

              {/* Refund Management */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Refunds & Stock Restoration
                  </h3>
                  <button
                    type="button"
                    onClick={() => setRefundForm((p) => ({ ...p, open: !p.open }))}
                    style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                  >
                    {refundForm.open ? "Close Refund Form" : "Issue Refund"}
                  </button>
                </div>

                {(selectedOrder.refunds || []).length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                    {selectedOrder.refunds.map((rf) => (
                      <div key={rf.id} style={{ background: "#fff", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
                        <span>
                          <strong>৳{Number(rf.amount || 0).toLocaleString()}</strong> via {rf.method} — {rf.reason}
                        </span>
                        <span style={{ color: "#64748b", fontSize: "11px" }}>{rf.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {refundForm.open && (
                  <form onSubmit={handleProcessRefund} style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Refund Amount (BDT)"
                        value={refundForm.refundAmount}
                        onChange={(e) => setRefundForm((p) => ({ ...p, refundAmount: e.target.value }))}
                        style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#fff" }}
                      />
                      <select
                        value={refundForm.refundMethod}
                        onChange={(e) => setRefundForm((p) => ({ ...p, refundMethod: e.target.value }))}
                        style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#fff" }}
                      >
                        <option value="BKASH">bKash</option>
                        <option value="BANK">Bank Transfer</option>
                        <option value="SSLCOMMERZ">SSLCommerz</option>
                        <option value="CASH">Cash</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Refund Reason"
                      value={refundForm.reason}
                      onChange={(e) => setRefundForm((p) => ({ ...p, reason: e.target.value }))}
                      style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", background: "#fff" }}
                    />
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#334155" }}>
                      <input
                        type="checkbox"
                        checked={refundForm.restoreStock}
                        onChange={(e) => setRefundForm((p) => ({ ...p, restoreStock: e.target.checked }))}
                      />
                      Restore reserved inventory stock back to product catalog
                    </label>
                    <button
                      type="submit"
                      disabled={processingRefund}
                      style={{ padding: "8px 14px", borderRadius: "6px", border: "none", background: "#dc2626", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: processingRefund ? "not-allowed" : "pointer" }}
                    >
                      {processingRefund ? "Processing Refund..." : "Confirm & Record Refund"}
                    </button>
                  </form>
                )}
              </div>

              {/* Status History Audit Trail */}
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
                  Production Milestone Audit Trail
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(selectedOrder.statusHistory || []).map((h) => (
                    <div key={h.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "16px" }}>🕒</span>
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>{h.status}</span>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(h.createdAt).toLocaleString("en-GB")}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>{h.comment}</div>
                        {h.updatedBy && (
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            Logged by: {h.updatedBy.fullName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
