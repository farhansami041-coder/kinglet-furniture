import React, { useState, useEffect } from "react";
import { adminAuthService } from "../../utils/adminAuthService";

export default function AdminInventoryPage() {
  const [activeTab, setActiveTab] = useState("stock"); // 'stock' | 'movements'
  const [inventoryList, setInventoryList] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [alertFilter, setAlertFilter] = useState("ALL"); // 'ALL' | 'LOW' | 'OUT'

  // Modal State for Manual Adjustment
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState("ADMIN_MANUAL_ADJUST");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/inventory");
      setInventoryList(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/inventory/movements?limit=100");
      setMovements(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "stock") {
      fetchInventory();
    } else {
      fetchMovements();
    }
  }, [activeTab]);

  const handleOpenAdjust = (item) => {
    setAdjustingItem(item);
    setNewQuantity(item.quantityAvailable);
    setAdjustReason("ADMIN_MANUAL_ADJUST");
    setAdjustNotes("");
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustingItem) return;
    setAdjustLoading(true);
    try {
      await adminAuthService.fetch("/api/v1/admin/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId: adjustingItem.productId,
          newQuantity: Number(newQuantity),
          reason: adjustReason,
          notes: adjustNotes,
        }),
      });
      setAdjustingItem(null);
      fetchInventory();
    } catch (err) {
      alert(err.message || "Failed to adjust stock");
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleSweepReservations = async () => {
    if (!window.confirm("Sweep and restore all expired checkout reservations?")) return;
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/inventory/sweep-reservations", {
        method: "POST",
      });
      alert(res.message || "Reservations swept successfully!");
      fetchInventory();
    } catch (err) {
      alert(err.message || "Sweep failed");
    }
  };

  const filteredItems = inventoryList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (alertFilter === "LOW") return item.isLowStock;
    if (alertFilter === "OUT") return item.isOutOfStock;
    return true;
  });

  const lowStockCount = inventoryList.filter((i) => i.isLowStock).length;
  const outOfStockCount = inventoryList.filter((i) => i.isOutOfStock).length;

  return (
    <div>
      {/* Page Title & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
            Inventory Control & Concurrency Stock Audit
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Real-time Mirpur Factory stock levels, reserved items, and immutable movement ledgers.
          </p>
        </div>

        <button
          onClick={handleSweepReservations}
          style={{
            padding: "8px 14px",
            background: "#0f172a",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          🧹 Sweep Expired Reservations
        </button>
      </div>

      {/* KPI Alert Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Total Catalog SKUs</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>{inventoryList.length}</div>
        </div>

        <div style={{ background: lowStockCount > 0 ? "#fef3c7" : "#ffffff", padding: "16px 20px", borderRadius: "10px", border: `1px solid ${lowStockCount > 0 ? "#fde68a" : "#e2e8f0"}` }}>
          <div style={{ fontSize: "12px", color: lowStockCount > 0 ? "#b45309" : "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Low Stock Alert (&le; 2 units)</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: lowStockCount > 0 ? "#b45309" : "#0f172a", marginTop: "4px" }}>{lowStockCount}</div>
        </div>

        <div style={{ background: outOfStockCount > 0 ? "#fef2f2" : "#ffffff", padding: "16px 20px", borderRadius: "10px", border: `1px solid ${outOfStockCount > 0 ? "#fecaca" : "#e2e8f0"}` }}>
          <div style={{ fontSize: "12px", color: outOfStockCount > 0 ? "#dc2626" : "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Out of Stock (0 units)</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: outOfStockCount > 0 ? "#dc2626" : "#0f172a", marginTop: "4px" }}>{outOfStockCount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
        <button
          onClick={() => setActiveTab("stock")}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            background: activeTab === "stock" ? "#ef4444" : "transparent",
            color: activeTab === "stock" ? "#ffffff" : "#64748b",
          }}
        >
          📦 Active Stock & Availability ({inventoryList.length})
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            background: activeTab === "movements" ? "#ef4444" : "transparent",
            color: activeTab === "movements" ? "#ffffff" : "#64748b",
          }}
        >
          📜 Stock Movements Audit Ledger
        </button>
      </div>

      {/* TAB 1: ACTIVE STOCK */}
      {activeTab === "stock" && (
        <div>
          {/* Filters */}
          <div style={{ background: "#ffffff", padding: "14px 18px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search by SKU or Product Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flexGrow: 1, minWidth: "220px", padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", outline: "none" }}
            />

            <select
              value={alertFilter}
              onChange={(e) => setAlertFilter(e.target.value)}
              style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#fff" }}
            >
              <option value="ALL">All Stock Levels</option>
              <option value="LOW">Low Stock Only (1-2)</option>
              <option value="OUT">Out of Stock Only (0)</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading real inventory levels...</div>
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No inventory records found.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px" }}>SKU</th>
                    <th style={{ padding: "12px 16px" }}>Product Name</th>
                    <th style={{ padding: "12px 16px" }}>Timber / Species</th>
                    <th style={{ padding: "12px 16px" }}>Available Stock</th>
                    <th style={{ padding: "12px 16px" }}>Reserved</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px" }}>Warehouse</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.productId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, color: "#334155" }}>
                        {item.sku}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>
                        {item.name}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>
                        {item.woodType}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 800, fontSize: "14px", color: item.isOutOfStock ? "#dc2626" : item.isLowStock ? "#b45309" : "#059669" }}>
                        {item.quantityAvailable} units
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>
                        {item.quantityReserved} in cart/order
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: item.isOutOfStock ? "#fef2f2" : item.isLowStock ? "#fef3c7" : "#ecfdf5",
                            color: item.isOutOfStock ? "#dc2626" : item.isLowStock ? "#b45309" : "#059669",
                          }}
                        >
                          {item.stockStatus}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px" }}>
                        {item.warehouseLocation}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          style={{
                            padding: "4px 10px",
                            background: "#0f172a",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Adjust Stock ✏️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STOCK MOVEMENTS AUDIT LEDGER */}
      {activeTab === "movements" && (
        <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading audit ledger...</div>
          ) : movements.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No stock movements recorded yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 16px" }}>Date & Time</th>
                  <th style={{ padding: "12px 16px" }}>Product / SKU</th>
                  <th style={{ padding: "12px 16px" }}>Movement Type</th>
                  <th style={{ padding: "12px 16px" }}>Qty Diff</th>
                  <th style={{ padding: "12px 16px" }}>Balance After</th>
                  <th style={{ padding: "12px 16px" }}>Reference</th>
                  <th style={{ padding: "12px 16px" }}>Authorized Origin</th>
                  <th style={{ padding: "12px 16px" }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px" }}>
                        {m.formattedDate}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{m.productName}</div>
                        <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>{m.sku}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, color: "#334155" }}>
                          {m.movementType}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 800, color: isPositive ? "#059669" : "#dc2626" }}>
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                        {m.balanceAfter} units
                      </td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "12px" }}>
                        {m.referenceId || "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569", fontSize: "12px" }}>
                        {m.performedBy || "SYSTEM"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "12px" }}>
                        {m.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {adjustingItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", width: "100%", maxWidth: "480px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Manual Stock Adjustment
              </h2>
              <button onClick={() => setAdjustingItem(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#94a3b8" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} style={{ padding: "20px" }}>
              <div style={{ marginBottom: "14px", padding: "10px", background: "#f8fafc", borderRadius: "6px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{adjustingItem.name}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>SKU: {adjustingItem.sku} · Current Available: <strong>{adjustingItem.quantityAvailable} units</strong></div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  New Physical Stock Count *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Reason for Adjustment *
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#fff", boxSizing: "border-box" }}
                >
                  <option value="ADMIN_MANUAL_ADJUST">Manual Inventory Audit Recount</option>
                  <option value="RESTOCK">Factory Hub Delivery / Restock</option>
                  <option value="DAMAGE_WRITE_OFF">Transit Damage / Defect Write-Off</option>
                  <option value="RETURN_RESTORE">Customer Exchange / Restored Piece</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Audit Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Conducted physical count at Mirpur Bay 4"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  style={{ padding: "8px 18px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: adjustLoading ? "not-allowed" : "pointer" }}
                >
                  {adjustLoading ? "Saving..." : "Save Stock Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

