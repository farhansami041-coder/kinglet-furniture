import React, { useState, useEffect } from "react";
import { X, Calculator, ShieldCheck, CheckCircle2, Table, Sparkles } from "lucide-react";
import { EMI_PLANS, BD_BANKS, calculateEmi } from "../../utils/emiCalculator";

export default function KingletEmiModal({ product = null, onClose }) {
  const defaultPrice = product?.priceBDT || 48500;
  const [amount, setAmount] = useState(defaultPrice);
  const [selectedBank, setSelectedBank] = useState("city");
  const [selectedTenure, setSelectedTenure] = useState(12);
  const [showFullTable, setShowFullTable] = useState(false);

  const emiResult = calculateEmi(amount, selectedTenure);

  // Lock body and html scroll when EMI modal is open
  useEffect(() => {
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
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 0.2s ease-out",
        overscrollBehavior: "contain",
      }}
      onClick={onClose}
    >
      <div
        className="custom-modal-scroll"
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          maxWidth: "720px",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          overscrollBehavior: "contain",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          border: "1px solid #e2e8f0",
          position: "relative",
          animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            borderRadius: "16px 16px 0 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "#ec2226",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(236,34,38,0.35)",
              }}
            >
              <Calculator size={19} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", letterSpacing: "-0.3px" }}>
                Official Bank EMI Calculator (ব্যাংক ইএমআই)
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                18+ Bangladeshi Partner Banks • 3 to 36 Months Tenure Options
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              border: "none",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "22px 24px" }}>
          {/* Target Product Summary (If opened from a specific product) */}
          {product && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "12px 16px",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                marginBottom: "20px",
              }}
            >
              <img
                src={(product.images && product.images[0]) || product.image}
                alt={product.name}
                width="56"
                height="56"
                loading="lazy"
                style={{ width: "56px", height: "56px", aspectRatio: "1 / 1", objectFit: "contain", borderRadius: "8px", background: "#ffffff", border: "1px solid #e2e8f0" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>{product.name}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>{product.woodType || "Premium Seasoned Timber"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "17px", fontWeight: "900", color: "#ec2226" }}>
                  ৳{Number(product.priceBDT || product.price || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "700" }}>✓ Bank EMI Eligible</div>
              </div>
            </div>
          )}

          {/* Amount Field */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
              Total Purchase Amount (ক্রয়মূল্য BDT ৳)
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontWeight: "800", color: "#0f172a", fontSize: "16px" }}>
                ৳
              </span>
              <input
                id="emi-calc-amount"
                name="emiAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(1000, Number(e.target.value)))}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 32px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "16px",
                  fontWeight: "800",
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Select Bank */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>
              Select Credit Card Bank (বাংলাদেশি পার্টনার ব্যাংকসমূহ)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", maxHeight: "160px", overflowY: "auto", paddingRight: "4px" }}>
              {BD_BANKS.map((bank) => {
                const isSelected = selectedBank === bank.id;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => setSelectedBank(bank.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: isSelected ? "2px solid #ec2226" : "1px solid #e2e8f0",
                      background: isSelected ? "#fff5f5" : "#ffffff",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: isSelected ? "800" : "600",
                      color: isSelected ? "#ec2226" : "#334155",
                      transition: "all 0.15s ease",
                      boxShadow: isSelected ? "0 2px 8px rgba(236,34,38,0.15)" : "none",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "24px",
                        borderRadius: "4px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        padding: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={bank.logo}
                        alt={bank.name}
                        loading="lazy"
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                      />
                    </div>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                      {bank.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Tenure (Months & Rates) */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", margin: 0 }}>
                Select Tenure & Bank Charge Rate (কিস্তির মেয়াদ)
              </label>
              <button
                type="button"
                onClick={() => setShowFullTable(!showFullTable)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: "11.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: 0,
                }}
              >
                <Table size={13} />
                {showFullTable ? "Hide Schedule Table" : "View Full Rate Schedule"}
              </button>
            </div>

            {/* Tenure Buttons Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
              {EMI_PLANS.map((plan) => {
                const isSelected = selectedTenure === plan.tenure;
                const calc = calculateEmi(amount, plan.tenure);
                return (
                  <button
                    key={plan.tenure}
                    type="button"
                    onClick={() => setSelectedTenure(plan.tenure)}
                    style={{
                      padding: "8px 6px",
                      borderRadius: "8px",
                      border: isSelected ? "2px solid #ec2226" : "1px solid #e2e8f0",
                      background: isSelected ? "#ec2226" : "#f8fafc",
                      color: isSelected ? "#ffffff" : "#0f172a",
                      cursor: "pointer",
                      textAlign: "center",
                      boxShadow: isSelected ? "0 4px 12px rgba(236,34,38,0.25)" : "none",
                      transition: "all 0.18s ease",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: "800" }}>{plan.tenure} Months</div>
                    <div
                      style={{
                        fontSize: "10.5px",
                        fontWeight: "700",
                        marginTop: "2px",
                        color: isSelected ? "#fee2e2" : "#ec2226",
                      }}
                    >
                      {plan.rate}% fee
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        opacity: isSelected ? 0.95 : 0.7,
                        color: isSelected ? "#ffffff" : "#64748b",
                        marginTop: "2px",
                      }}
                    >
                      ৳{calc.monthlyInstallment.toLocaleString()}/mo
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Schedule Comparison Table (Collapsible) */}
          {showFullTable && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "12px",
                marginBottom: "18px",
                overflowX: "auto",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
                📋 Official Bank EMI Schedule for ৳{Number(amount).toLocaleString()}
              </div>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px", color: "#475569" }}>Tenure</th>
                    <th style={{ padding: "8px 10px", color: "#475569" }}>Bank Charge Rate</th>
                    <th style={{ padding: "8px 10px", color: "#475569" }}>Bank Fee (৳)</th>
                    <th style={{ padding: "8px 10px", color: "#475569" }}>Total Payable (৳)</th>
                    <th style={{ padding: "8px 10px", color: "#475569" }}>Monthly Installment</th>
                  </tr>
                </thead>
                <tbody>
                  {EMI_PLANS.map((plan) => {
                    const res = calculateEmi(amount, plan.tenure);
                    const isRowSelected = selectedTenure === plan.tenure;
                    return (
                      <tr
                        key={plan.tenure}
                        onClick={() => setSelectedTenure(plan.tenure)}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: isRowSelected ? "#fef2f2" : "transparent",
                          cursor: "pointer",
                          fontWeight: isRowSelected ? "700" : "500",
                        }}
                      >
                        <td style={{ padding: "8px 10px", color: isRowSelected ? "#ec2226" : "#0f172a" }}>
                          {plan.label} {isRowSelected && "✓"}
                        </td>
                        <td style={{ padding: "8px 10px", color: "#ec2226", fontWeight: "700" }}>{plan.rate}%</td>
                        <td style={{ padding: "8px 10px", color: "#64748b" }}>৳{res.bankCharge.toLocaleString()}</td>
                        <td style={{ padding: "8px 10px", color: "#0f172a" }}>৳{res.totalPayable.toLocaleString()}</td>
                        <td style={{ padding: "8px 10px", color: "#ec2226", fontWeight: "800" }}>
                          ৳{res.monthlyInstallment.toLocaleString()} / mo
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Calculated Result Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%)",
              border: "1.5px solid #fecdd3",
              borderRadius: "14px",
              padding: "16px 20px",
              marginBottom: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Estimated Monthly Installment (মাসিক কিস্তি)
                </div>
                <div style={{ fontSize: "28px", fontWeight: "900", color: "#ec2226", letterSpacing: "-0.5px" }}>
                  ৳{emiResult.monthlyInstallment.toLocaleString()}
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", marginLeft: "4px" }}>
                    / month × {emiResult.tenure} mos
                  </span>
                </div>
                <div style={{ fontSize: "11.5px", color: "#16a34a", fontWeight: "700", marginTop: "2px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <CheckCircle2 size={13} /> Bank Rate: {emiResult.rate}% • Fully Transparent Pricing
                </div>
              </div>

              {/* Breakdown Summary */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #fed7aa",
                  fontSize: "11.5px",
                  minWidth: "210px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", marginBottom: "3px" }}>
                  <span>Base Product Price:</span>
                  <span style={{ fontWeight: "700", color: "#0f172a" }}>৳{emiResult.baseAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#ec2226", marginBottom: "3px" }}>
                  <span>Bank Charge ({emiResult.rate}%):</span>
                  <span style={{ fontWeight: "800" }}>+৳{emiResult.bankCharge.toLocaleString()}</span>
                </div>
                <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "4px", display: "flex", justifyContent: "space-between", fontWeight: "800", color: "#0f172a", fontSize: "12px" }}>
                  <span>Total Payable:</span>
                  <span style={{ color: "#ec2226" }}>৳{emiResult.totalPayable.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", color: "#0f172a", fontWeight: "700" }}>
              <ShieldCheck size={15} color="#16a34a" /> How to avail EMI:
            </div>
            1. Select "Bank EMI Installment" during online checkout or swipe your Credit Card at our Mirpur showroom.<br />
            2. Choose your preferred tenure (3, 6, 9, 12, 18, 24, 30, or 36 Months) with applicable bank convenience fee.<br />
            3. Our finance desk verifies your card issuer and confirms order dispatch immediately.
          </div>

          {/* Partner Bank Logos Gallery */}
          <div style={{ marginBottom: "18px", background: "#f8fafc", borderRadius: "10px", padding: "12px 14px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              Accepted Credit Cards & Partner Banks (সকল ব্যাংকের অরিজিনাল লোগো)
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {BD_BANKS.map((b) => (
                <div
                  key={b.id}
                  title={b.name}
                  onClick={() => setSelectedBank(b.id)}
                  style={{
                    background: "#ffffff",
                    border: selectedBank === b.id ? "1.5px solid #ec2226" : "1px solid #e2e8f0",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "30px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: selectedBank === b.id ? "0 2px 8px rgba(236,34,38,0.15)" : "none",
                  }}
                >
                  <img
                    src={b.logo}
                    alt={b.name}
                    loading="lazy"
                    style={{ maxHeight: "20px", maxWidth: "60px", objectFit: "contain" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Contact Concierge Action */}
          <div style={{ display: "flex", gap: "10px" }}>
            <a
              href="https://wa.me/8801676900442?text=Hello%20Kinglet,%20I%20want%20to%20avail%20Bank%20EMI%20for%20furniture"
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1,
                background: "#25D366",
                color: "#ffffff",
                padding: "11px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "800",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 2px 8px rgba(37,211,102,0.3)",
              }}
            >
              <span>Instant WhatsApp Assistance (+8801676-900442)</span>
            </a>
            <button
              onClick={onClose}
              style={{
                padding: "11px 22px",
                borderRadius: "8px",
                background: "#0f172a",
                color: "#ffffff",
                border: "none",
                fontSize: "13px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
