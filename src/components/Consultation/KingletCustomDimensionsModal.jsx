import React, { useState, useEffect } from "react";
import { X, Ruler, CheckCircle2, MessageCircle, Hammer, Loader2 } from "lucide-react";
import { BRAND_INFO } from "../../data/kingletData";

export default function KingletCustomDimensionsModal({ product = null, onClose }) {
  const [productName, setProductName] = useState(product?.name || "Grain Craft Bed (Custom)");
  const [lengthFt, setLengthFt] = useState("6.5");
  const [widthFt, setWidthFt] = useState("5.0");
  const [woodGrade, setWoodGrade] = useState("Seasoned Mahogany & German Oak Veneer");
  const [lacquerFinish, _setLacquerFinish] = useState("High-Gloss Italian PU Lacquer");
  const [apartmentArea, _setApartmentArea] = useState("Dhaka (Gulshan / Banani / Dhanmondi / Uttara)");
  const [contactNumber, setContactNumber] = useState("");
  const [specialNotes, _setSpecialNotes] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [inquiryCode, setInquiryCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Lock body and html scroll when Custom Dimensions modal is open
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanPhone = contactNumber.replace(/[-\s+]/g, "").replace(/^88/, "");
    if (!cleanPhone) {
      setErrorMsg("Please provide your mobile number so our chief carpenter can reach you.");
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMsg("Please enter a valid 11-digit Bangladeshi mobile number (017XXXXXXXX).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/support/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Valued Custom Client",
          phone: cleanPhone,
          productId: product?.id ? String(product.id) : "CUSTOM_FURNITURE",
          productName: productName,
          inquiryType: "CUSTOM_DIMENSIONS",
          notes: `Requested Dimensions: ${lengthFt}ft x ${widthFt}ft | Wood: ${woodGrade} | Finish: ${lacquerFinish} | Area: ${apartmentArea} | Notes: ${specialNotes || "None"}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit custom blueprint request.");
      }
      setInquiryCode(data.data?.id || "KL-INQ-CUSTOM");
      setIsSuccess(true);
    } catch (err) {
      console.error("Custom dimensions submission error:", err);
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const whatsappLink = `https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent(
    `Hello Kinglet Chief Architect, I want custom sizing for "${productName}":\nRef: ${inquiryCode || "New Inquiry"}\nDimensions: ${lengthFt}ft x ${widthFt}ft\nTimber: ${woodGrade}\nFinish: ${lacquerFinish}\nLocation: ${apartmentArea}\nNotes: ${specialNotes || "None"}`
  )}`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.7)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
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
          maxWidth: "640px",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          overscrollBehavior: "contain",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
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
            padding: "20px 24px",
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
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#ec2226",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ruler size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", letterSpacing: "-0.3px" }}>
                Bespoke Custom Furniture Sizing
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                Tailored dimensions crafted for your apartment floor plan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "24px" }}>
          {isSuccess ? (
            <div style={{ textAlign: "center", padding: "24px 10px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <CheckCircle2 size={30} />
              </div>
              <h3 style={{ fontSize: "19px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
                Custom Blueprint Request Received!
              </h3>
              <p style={{ fontSize: "13px", color: "#475569", maxWidth: "420px", margin: "0 auto 14px", lineHeight: "1.5" }}>
                Our Master Carpenter is calculating your factory timber volume. We will reach you on WhatsApp within 30 minutes with the 3D cut diagram & quote.
              </p>

              {inquiryCode && (
                <div style={{ display: "inline-block", padding: "6px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", marginBottom: "16px" }}>
                  <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Inquiry Reference</div>
                  <div style={{ fontSize: "17px", fontWeight: "900", color: "#ec2226", letterSpacing: "1px" }}>{inquiryCode}</div>
                </div>
              )}
              <br />
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "#25D366",
                  color: "#ffffff",
                  padding: "11px 20px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "800",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <MessageCircle size={16} />
                <span>Chat Directly with Carpenter on WhatsApp</span>
              </a>
              <br />
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                Dismiss Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errorMsg && (
                <div style={{ padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#991b1b", fontSize: "12.5px", fontWeight: "600", marginBottom: "14px" }}>
                  ⚠️ {errorMsg}
                </div>
              )}
              <div style={{ marginBottom: "14px" }}>
                <label htmlFor="custom-dim-product" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                  Furniture Model / Name
                </label>
                <input
                  id="custom-dim-product"
                  name="productName"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontWeight: "700",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Dimensions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label htmlFor="custom-dim-length" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                    Length / Width (Feet)
                  </label>
                  <input
                    id="custom-dim-length"
                    name="lengthFt"
                    type="text"
                    value={lengthFt}
                    onChange={(e) => setLengthFt(e.target.value)}
                    placeholder="e.g. 6.5 ft"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="custom-dim-width" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                    Depth / Height (Feet)
                  </label>
                  <input
                    id="custom-dim-width"
                    name="widthFt"
                    type="text"
                    value={widthFt}
                    onChange={(e) => setWidthFt(e.target.value)}
                    placeholder="e.g. 5.0 ft"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Wood Timber Selection */}
              <div style={{ marginBottom: "14px" }}>
                <label htmlFor="custom-dim-wood-grade" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                  Preferred Timber Grade
                </label>
                <select
                  id="custom-dim-wood-grade"
                  name="woodGrade"
                  value={woodGrade}
                  onChange={(e) => setWoodGrade(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="Seasoned Mahogany & German Oak Veneer">
                    Seasoned Mahogany & German Oak Veneer - 15 Yrs Guarantee
                  </option>
                  <option value="Seasoned Antique Mahogany">
                    Seasoned Antique Mahogany - High Durability
                  </option>
                  <option value="Natural Red Oak Veneer on Hardwood Chassis">
                    Natural Red Oak Veneer on Hardwood Chassis
                  </option>
                  <option value="Gorjon Heavy Structural Framework">
                    Gorjon Heavy Structural Framework (Sofas & Sectionals)
                  </option>
                </select>
              </div>

              {/* Mobile Contact */}
              <div style={{ marginBottom: "16px" }}>
                <label htmlFor="custom-dim-contact" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                  WhatsApp / Mobile Number *
                </label>
                <input
                  id="custom-dim-contact"
                  name="contactNumber"
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: loading ? "#64748b" : "#0f172a",
                  color: "#ffffff",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "800",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#ec2226")}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#0f172a")}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Hammer size={16} />}
                <span>{loading ? "Calculating Timber Volume..." : "Request Custom Sizing Quote (Free 3D Blueprint)"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
