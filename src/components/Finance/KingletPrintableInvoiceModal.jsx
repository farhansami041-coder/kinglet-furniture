import React, { useState } from "react";
import { Printer, Download, X, CheckCircle, ShieldCheck, Phone, MapPin, Mail, Globe, Loader2 } from "lucide-react";
import { BRAND_INFO } from "../../data/kingletData";

export default function KingletPrintableInvoiceModal({ order, isOpen, onClose }) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = order.trackingCode || order.invoice || order.invoiceCode || order.orderNumber || order.id || "KL-INV-2026-001";

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || html2pdfModule;
      const element = document.getElementById("kinglet-printable-area");
      if (!element) return;
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `Kinglet-Official-Invoice-${invoiceNumber}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF download error:", err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };
  const customer = order.customer || {};
  const items = order.items || [];
  const subtotal = order.subtotal || items.reduce((acc, i) => acc + (i.unitPrice || i.priceBDT || 0) * (i.quantity || 1), 0);
  const deliveryFee = order.deliveryFee ?? 0;
  const grandTotal = order.grandTotal || subtotal + deliveryFee;
  const isCodOrder = order.paymentMethod === "COD" || order.paymentMethod === "cod";
  const isFullPaid = order.paymentStatus === "PAID";
  const advancePaid = isFullPaid
    ? grandTotal
    : order.advancePaid !== undefined
    ? Number(order.advancePaid)
    : Number(order.advanceAmount || 0) > 0
    ? Number(order.advanceAmount)
    : order.paymentStatus === "PARTIAL" && isCodOrder
    ? Math.min(Number(order.codAdvanceRequired || 5000), grandTotal)
    : 0;
  const remainingDue = isFullPaid ? 0 : Math.max(0, grandTotal - advancePaid);

  return (
    <div
      className="kinglet-invoice-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <div
        className="kinglet-invoice-modal"
        style={{
          background: "#ffffff",
          width: "100%",
          maxWidth: "760px",
          borderRadius: "14px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top Control Bar (Hidden on print) */}
        <div
          className="no-print"
          style={{
            background: "#0f172a",
            color: "#ffffff",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "14px", fontWeight: "700" }}>Official Kinglet Sales Memo & Tax Invoice</span>
            <span
              style={{
                background: "rgba(236,34,38,0.25)",
                color: "#ff8082",
                border: "1px solid rgba(236,34,38,0.4)",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "700",
              }}
            >
              Verified Authentic
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                padding: "7px 16px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: downloadingPdf ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease",
              }}
            >
              {downloadingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span>{downloadingPdf ? "Generating PDF..." : "Download Official PDF"}</span>
            </button>
            <button
              onClick={handlePrint}
              style={{
                background: "#ec2226",
                color: "#ffffff",
                border: "none",
                padding: "7px 16px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease",
              }}
            >
              <Printer size={15} /> Print Invoice
            </button>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                color: "#94a3b8",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Memo Document Body */}
        <div
          id="kinglet-printable-area"
          style={{
            padding: "36px 36px 28px",
            overflowY: "auto",
            color: "#1e293b",
            fontSize: "13px",
            lineHeight: "1.5",
            background: "#ffffff",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: "20px",
              marginBottom: "20px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "900",
                    letterSpacing: "-0.5px",
                    color: "#ec2226",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  KINGLET
                </span>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Bangladesh Ltd.
                </span>
              </div>
              <div style={{ color: "#64748b", fontSize: "11px", lineHeight: "1.4" }}>
                Leading Seasoned Mahogany & Luxury Furniture Manufacturer in Bangladesh<br />
                Central Hub: Plot #8, Mirpur-10 Main Circle, Dhaka-1216<br />
                Govt VAT Reg / BIN: 002948172-0101 • Trade Lic: 048192
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  display: "inline-block",
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#0f172a",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                CASH MEMO / INVOICE
              </div>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#ec2226", fontFamily: "monospace" }}>
                {invoiceNumber}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                Date: {order.date || order.createdAt || "Official Invoice"}
              </div>
            </div>
          </div>

          {/* Customer & Order Metadata */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: "20px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "16px 18px",
              marginBottom: "24px",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                Billed & Delivered To:
              </div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
                {customer.fullName || customer.name || "Valued Client"}
              </div>
              <div style={{ color: "#334155", fontSize: "12px", marginTop: "2px" }}>
                📞 Mobile: <strong>{customer.phone || "017XXXXXXXX"}</strong>
                {customer.altPhone && <span> (Alt: {customer.altPhone})</span>}
              </div>
              <div style={{ color: "#475569", fontSize: "12px", marginTop: "4px" }}>
                📍 Address: {customer.address || "Dhaka, Bangladesh"}
                {customer.district && `, ${customer.district}`}
                {customer.division && `, ${customer.division}`}
              </div>
            </div>

            <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "18px" }}>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                Order Logistics & Status:
              </div>
              <div style={{ fontSize: "12px", color: "#334155", marginBottom: "3px" }}>
                Unique Code: <strong style={{ color: "#ec2226" }}>{order.trackingCode || invoiceNumber}</strong>
              </div>
              <div style={{ fontSize: "12px", color: "#334155", marginBottom: "3px" }}>
                Payment Method:{" "}
                <strong style={{ textTransform: "uppercase" }}>
                  {order.paymentMethod === "bkash" ? "bKash MFS" : order.paymentMethod === "card" ? "Credit/Debit Card" : "Cash on Delivery"}
                </strong>
              </div>
              {order.trxId && (
                <div style={{ fontSize: "11px", color: "#059669", fontWeight: "700" }}>
                  TrxID: {order.trxId}
                </div>
              )}
              <div style={{ fontSize: "12px", color: "#059669", fontWeight: "700", marginTop: "4px" }}>
                Status: {order.status || "Confirmed & Dispatched"}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
            <thead>
              <tr style={{ background: "#0f172a", color: "#ffffff", textAlign: "left", fontSize: "11px", textTransform: "uppercase" }}>
                <th style={{ padding: "10px 12px", borderRadius: "6px 0 0 0" }}>#</th>
                <th style={{ padding: "10px 12px" }}>Product Description & Specifications</th>
                <th style={{ padding: "10px 12px", textAlign: "center" }}>Qty</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Unit Price</th>
                <th style={{ padding: "10px 12px", textAlign: "right", borderRadius: "0 6px 0 0" }}>Total (BDT)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px", color: "#64748b", fontWeight: "700" }}>{idx + 1}</td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ fontWeight: "700", color: "#0f172a" }}>{item.name}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      Timber: {item.woodType || "Seasoned Mahogany (100% Kiln Seasoned)"} • {item.dimensions || "Standard Factory Specification"}
                    </div>
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", fontWeight: "700" }}>{item.quantity || 1}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#334155" }}>
                    ৳{(item.priceBDT || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: "800", color: "#0f172a" }}>
                    ৳{((item.priceBDT || 0) * (item.quantity || 1)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Calculation Summary */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
            <div style={{ maxWidth: "340px", fontSize: "11px", color: "#64748b", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <strong style={{ color: "#0f172a" }}>Warranty Terms:</strong> This memo serves as your official purchase certificate for Kinglet's <strong>10-Year Timber Replacement Guarantee</strong> against termite & fungal decay. Please preserve this slip.
            </div>

            <div style={{ width: "260px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#475569" }}>
                <span>Subtotal:</span>
                <strong style={{ color: "#0f172a" }}>৳{subtotal.toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#475569" }}>
                <span>Delivery Charge:</span>
                <span>৳{deliveryFee.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#16a34a" }}>
                <span>Carpenter Assembly:</span>
                <span style={{ fontWeight: "700" }}>FREE</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0 4px",
                  marginTop: "6px",
                  borderTop: "2px solid #0f172a",
                  fontSize: "15px",
                  fontWeight: "900",
                }}
              >
                <span>Order Total:</span>
                <span style={{ color: "#0f172a" }}>৳{grandTotal.toLocaleString()}</span>
              </div>
              {advancePaid > 0 && !isFullPaid && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "#16a34a", fontWeight: "700" }}>
                  <span>COD Security Advance Paid:</span>
                  <span>-৳{advancePaid.toLocaleString()}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0 0",
                  marginTop: "4px",
                  borderTop: "1px dashed #cbd5e1",
                  fontSize: "14px",
                  fontWeight: "900",
                }}
              >
                <span>{isFullPaid ? "Balance Due:" : isCodOrder ? "Net COD Due on Delivery:" : "Total Payable:"}</span>
                <span style={{ color: "#ec2226" }}>৳{remainingDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Seal */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              paddingTop: "28px",
              marginTop: "20px",
              borderTop: "1px dashed #cbd5e1",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "160px", borderTop: "1px solid #94a3b8", paddingTop: "6px", fontSize: "11px", color: "#64748b" }}>
                Customer Signature & Date
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "#166534",
                  fontSize: "11px",
                  fontWeight: "800",
                  border: "1px solid #86efac",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  marginBottom: "8px",
                  background: "#f0fdf4",
                }}
              >
                <ShieldCheck size={14} /> Official Kinglet Certified
              </div>
              <div style={{ width: "180px", borderTop: "1px solid #0f172a", paddingTop: "6px", fontSize: "11px", fontWeight: "700", color: "#0f172a" }}>
                Kinglet Bangladesh Ltd. Authorized Officer
              </div>
            </div>
          </div>

          {/* Footer Contact */}
          <div
            style={{
              textAlign: "center",
              fontSize: "10px",
              color: "#94a3b8",
              marginTop: "24px",
              borderTop: "1px solid #f1f5f9",
              paddingTop: "12px",
            }}
          >
            Direct Helpline: {BRAND_INFO.hotlinePrimary} • WhatsApp: {BRAND_INFO.whatsapp} • Email: info@kingletbd.com • Web: www.kingletbd.com
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #kinglet-printable-area, #kinglet-printable-area * {
            visibility: visible;
          }
          #kinglet-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .kinglet-invoice-overlay {
            position: static !important;
            background: none !important;
            padding: 0 !important;
          }
          .kinglet-invoice-modal {
            box-shadow: none !important;
            max-height: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
