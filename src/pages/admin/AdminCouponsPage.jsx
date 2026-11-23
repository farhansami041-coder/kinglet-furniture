import React, { useState, useEffect } from "react";
import { Plus, Tag, Trash2, Edit3, CheckCircle2, AlertCircle, Percent, DollarSign, Calendar, Users } from "lucide-react";
import { adminAuthService } from "../../utils/adminAuthService";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENT",
    discountValue: 10,
    minOrderValue: 20000,
    maxDiscount: 5000,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    usageLimit: 100,
    perCustomerLimit: 1,
    isActive: true,
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/coupons");
      setCoupons(res.data || []);
    } catch (err) {
      showAlert(err.message || "Failed to load coupons", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const showAlert = (msg, type = "success") => {
    setAlertMsg({ text: msg, type });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      code: "",
      discountType: "PERCENT",
      discountValue: 10,
      minOrderValue: 20000,
      maxDiscount: 5000,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      usageLimit: 100,
      perCustomerLimit: 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount || "",
      startDate: new Date(coupon.startDate).toISOString().split("T")[0],
      endDate: new Date(coupon.endDate).toISOString().split("T")[0],
      usageLimit: coupon.usageLimit,
      perCustomerLimit: coupon.perCustomerLimit || 1,
      isActive: coupon.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: Number(form.usageLimit),
        perCustomerLimit: Number(form.perCustomerLimit),
      };

      if (editingId) {
        await adminAuthService.fetch(`/api/v1/admin/coupons/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showAlert(`Coupon ${payload.code} updated successfully!`);
      } else {
        await adminAuthService.fetch("/api/v1/admin/coupons", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showAlert(`Coupon ${payload.code} created successfully!`);
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      showAlert(err.message || "Failed to save coupon", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete promo code ${code}?`)) return;
    try {
      await adminAuthService.fetch(`/api/v1/admin/coupons/${id}`, { method: "DELETE" });
      showAlert(`Coupon ${code} removed.`);
      fetchCoupons();
    } catch (err) {
      showAlert(err.message || "Failed to delete coupon", "error");
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
            Promotions &amp; Coupon Codes
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Configure percentage/fixed discounts, minimum order thresholds, and abuse prevention rules.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "#ec2226",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Plus size={16} /> Create New Coupon
        </button>
      </div>

      {alertMsg && (
        <div style={{ padding: "12px 18px", borderRadius: "8px", marginBottom: "20px", background: alertMsg.type === "error" ? "#fef2f2" : "#f0fdf4", color: alertMsg.type === "error" ? "#991b1b" : "#166534", border: `1px solid ${alertMsg.type === "error" ? "#fecaca" : "#bbf7d0"}`, fontSize: "14px", fontWeight: 600 }}>
          {alertMsg.text}
        </div>
      )}

      {/* Coupons Table */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase", fontSize: "11px" }}>
                <th style={{ padding: "12px 18px" }}>Code</th>
                <th style={{ padding: "12px 18px" }}>Discount</th>
                <th style={{ padding: "12px 18px" }}>Min. Order</th>
                <th style={{ padding: "12px 18px" }}>Validity Window</th>
                <th style={{ padding: "12px 18px" }}>Redemptions</th>
                <th style={{ padding: "12px 18px" }}>Status</th>
                <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                    No promo coupons found. Click "Create New Coupon" to set up your first promotion.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => {
                  const isExpired = new Date(c.endDate) < new Date();
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "14px", color: "#0f172a", background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px" }}>
                          {c.code}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", fontWeight: 700, color: "#ec2226" }}>
                        {c.discountType === "PERCENT" ? `${c.discountValue}% OFF` : `৳${c.discountValue.toLocaleString()} FLAT`}
                        {c.maxDiscount && <div style={{ fontSize: "11px", color: "#64748b" }}>Max: ৳{c.maxDiscount.toLocaleString()}</div>}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        ৳{c.minOrderValue.toLocaleString()}
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: "12px", color: "#475569" }}>
                        {new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{c.usedCount}</span> / {c.usageLimit}
                        <div style={{ fontSize: "11px", color: "#64748b" }}>Limit: {c.perCustomerLimit || 1}/user</div>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        {isExpired ? (
                          <span style={{ padding: "3px 8px", borderRadius: "4px", background: "#fee2e2", color: "#991b1b", fontSize: "11px", fontWeight: 800 }}>EXPIRED</span>
                        ) : c.isActive ? (
                          <span style={{ padding: "3px 8px", borderRadius: "4px", background: "#dcfce7", color: "#166534", fontSize: "11px", fontWeight: 800 }}>ACTIVE</span>
                        ) : (
                          <span style={{ padding: "3px 8px", borderRadius: "4px", background: "#f1f5f9", color: "#64748b", fontSize: "11px", fontWeight: 800 }}>DISABLED</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            style={{ padding: "6px 10px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.code)}
                            style={{ padding: "6px 10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "520px", padding: "26px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>
              {editingId ? `Edit Coupon: ${form.code}` : "Create Promotional Coupon"}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Promo Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KINGLET10, EID2026"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: 700, fontFamily: "monospace" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT_BDT">Flat BDT (৳)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Value {form.discountType === "PERCENT" ? "(%)" : "(৳)"} *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Min. Order Subtotal (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minOrderValue}
                    onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Max Cap (Optional ৳)</label>
                  <input
                    type="number"
                    placeholder="None"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Start Date</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>End Date</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Global Usage Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Per-Customer Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={form.perCustomerLimit}
                    onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="active-check"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  style={{ width: "16px", height: "16px" }}
                />
                <label htmlFor="active-check" style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                  Coupon is Active &amp; Redeemable
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: "#ec2226", color: "#ffffff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                >
                  {saving ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

