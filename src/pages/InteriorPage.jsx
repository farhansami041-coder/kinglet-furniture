import React, { useState } from "react";
import { Layers, Check, Home, Building2, Paintbrush, Loader2, MessageCircle, RefreshCw } from "lucide-react";
import KingletSEO from "../components/Common/KingletSEO";
import { BRAND_INFO } from "../data/kingletData";

export default function InteriorPage() {
  const [submitted, setSubmitted] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", spaceType: "residential", budget: "5-10-lakh", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanPhone = form.phone.replace(/[-\s+]/g, "").replace(/^88/, "");
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMsg("সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/support/interior-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.name.trim(),
          phone: cleanPhone,
          spaceType: form.spaceType,
          budget: form.budget,
          message: form.message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit interior consultation request.");
      }
      setTicketData(data.data);
      setSubmitted(true);
    } catch (err) {
      console.error("Interior consultation submission error:", err);
      setErrorMsg(err.message || "Network error. Please try again or WhatsApp our chief architect directly.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setTicketData(null);
    setForm({ name: "", phone: "", spaceType: "residential", budget: "5-10-lakh", message: "" });
  };

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", paddingBottom: "70px" }}>
      {/* Search Engine Optimization (SEO) Metadata */}
      <KingletSEO
        title="Turnkey Interior Design Studio in Dhaka, Bangladesh | Kinglet Ltd"
        description="Complete 3D architectural interior design, seasoned mahogany cabinetry, modular kitchen & false ceiling fit-out in Bangladesh by Kinglet Interior Studio. Free site inspection."
        keywords="interior design Bangladesh, best interior design company Dhaka, luxury home interior BD, modular kitchen Dhaka, apartment interior Dhaka, Kinglet interior studio"
        canonicalUrl="https://www.kingletbd.com/interior"
      />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)", color: "#ffffff", padding: "125px 0 50px", textAlign: "center" }}>
        <div className="container">
          <span style={{ background: "rgba(236,34,38,0.25)", color: "#ff8080", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
            Turnkey Architectural Interior Design & Fit-Out
          </span>
          <h1 style={{ fontSize: "36px", fontWeight: "900", margin: "14px 0 10px" }}>
            Kinglet Interior Studio Bangladesh
          </h1>
          <p style={{ color: "#9ca3af", maxWidth: "650px", margin: "0 auto", fontSize: "15px", lineHeight: "1.6" }}>
            From 3D photorealistic architectural renders to custom Seasoned Mahogany cabinetry, false ceiling lighting, and modular kitchens — we design and build complete living spaces.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "40px" }}>
        {/* Core Solutions Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "25px", marginBottom: "50px" }}>
          {[
            {
              icon: Home,
              title: "Residential Interior",
              desc: "Complete master bedroom suites, TV wall accent paneling, walk-in wardrobes, and contemporary foyer designs.",
            },
            {
              icon: Paintbrush,
              title: "Modular Kitchen & Pantry",
              desc: "100% boiling-waterproof marine ply cabinetry with Blum soft-close hinges, quartz countertops, and island units.",
            },
            {
              icon: Building2,
              title: "Corporate & Executive Offices",
              desc: "Modern conference rooms, soundproof executive cabins, reception desks, and ergonomic workstation clusters.",
            },
            {
              icon: Layers,
              title: "False Ceiling & Ambient Lighting",
              desc: "Gypsum false ceilings with hidden warm LED strip channels and acoustic wooden louvers.",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} style={{ background: "#ffffff", padding: "26px", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "10px", background: "#fff5f5", color: "#ec2226", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#111827", margin: "0 0 8px" }}>{item.title}</h3>
                <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: "1.6", margin: 0 }}>{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Free Consultation Booking Form */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "40px", maxWidth: "750px", margin: "0 auto", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <div style={{ textAlign: "center", marginBottom: "26px" }}>
            <span style={{ color: "#ec2226", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}>Free 3D Layout Consultation</span>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#111827", margin: "6px 0" }}>Schedule an In-Home Interior Measurement</h2>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
              Our senior interior architect will visit your flat anywhere in Dhaka with wood material samples and 3D floor plan layout ideas.
            </p>
          </div>

          {submitted ? (
            <div style={{ padding: "32px 24px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", textAlign: "center", color: "#166534" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#dcfce7", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                <Check size={32} color="#15803d" />
              </div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#14532d", marginBottom: "6px" }}>
                Interior Consultation Request Confirmed!
              </div>
              <p style={{ fontSize: "13.5px", color: "#166534", maxWidth: "480px", margin: "0 auto 16px", lineHeight: "1.5" }}>
                Thank you, <strong>{ticketData?.name || form.name}</strong>. Your inquiry has been registered into Kinglet Architecture CRM.
              </p>

              {ticketData?.ticketId && (
                <div style={{ display: "inline-block", padding: "10px 20px", background: "#ffffff", borderRadius: "8px", border: "1px dashed #86efac", marginBottom: "20px" }}>
                  <div style={{ fontSize: "11px", color: "#475569", fontWeight: "700", textTransform: "uppercase" }}>Tracking Reference Code</div>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#ec2226", letterSpacing: "1px" }}>{ticketData.ticketId}</div>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "8px" }}>
                <a
                  href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent(
                    `Hello Kinglet Interior Studio, I submitted an architectural consultation request:\nTicket ID: ${ticketData?.ticketId || "N/A"}\nName: ${form.name}\nPhone: ${form.phone}\nSpace: ${form.spaceType}\nBudget: ${form.budget}\nDetails: ${form.message || "None"}\nPlease share sample layouts.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 18px",
                    background: "#25d366",
                    color: "#ffffff",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "750",
                    textDecoration: "none",
                  }}
                >
                  <MessageCircle size={16} /> WhatsApp Chief Architect Now
                </a>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 16px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#334151",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw size={14} /> Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="interior-form-grid">
              {errorMsg && (
                <div style={{ gridColumn: "span 2", padding: "12px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#991b1b", fontSize: "13px", fontWeight: "600" }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div>
                <label htmlFor="interior-full-name" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>Your Full Name *</label>
                <input
                  id="interior-full-name"
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Engr. Tanvir Ahmed"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                />
              </div>

              <div>
                <label htmlFor="interior-phone" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>Phone Number *</label>
                <input
                  id="interior-phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="e.g. 01700000000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                />
              </div>

              <div>
                <label htmlFor="interior-space-type" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>Type of Space</label>
                <select
                  id="interior-space-type"
                  name="spaceType"
                  value={form.spaceType}
                  onChange={(e) => setForm({ ...form, spaceType: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", background: "#ffffff" }}
                >
                  <option value="residential">Residential Apartment / Flat</option>
                  <option value="duplex">Duplex / Villa</option>
                  <option value="commercial">Commercial / Corporate Office</option>
                  <option value="kitchen">Modular Kitchen Only</option>
                </select>
              </div>

              <div>
                <label htmlFor="interior-budget" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>Estimated Budget</label>
                <select
                  id="interior-budget"
                  name="budget"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", background: "#ffffff" }}
                >
                  <option value="3-5-lakh">৳3 Lakh – ৳5 Lakh</option>
                  <option value="5-10-lakh">৳5 Lakh – ৳10 Lakh</option>
                  <option value="10-20-lakh">৳10 Lakh – ৳20 Lakh</option>
                  <option value="premium">৳20 Lakh+ Luxury Turnkey</option>
                </select>
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label htmlFor="interior-message" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>Tell us about your apartment (Flat size in sqft, location)</label>
                <textarea
                  id="interior-message"
                  name="message"
                  rows={3}
                  placeholder="e.g. 1850 sqft flat in Bashundhara R/A, 3 bed, looking for modern minimal look..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: "46px",
                    background: loading ? "#64748b" : "#ec2226",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Registering In-Home Consultation..." : "Request Free In-Home Consultation"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
