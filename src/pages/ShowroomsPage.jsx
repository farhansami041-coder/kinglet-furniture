import React, { useState } from "react";
import { MapPin, Phone, Clock, Check, MessageCircle, Navigation, ExternalLink, ShieldCheck, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { SHOWROOMS, BRAND_INFO } from "../data/kingletData";
import KingletSEO from "../components/Common/KingletSEO";

export default function ShowroomsPage() {
  const showroom = SHOWROOMS[0];
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [bookingData, setBookingData] = useState({
    name: "",
    phone: "",
    date: "",
    showroom: showroom.name,
    notes: "",
  });

  const handleBooking = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanPhone = bookingData.phone.replace(/[-\s+]/g, "").replace(/^88/, "");
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMsg("সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/support/showroom-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bookingData.name.trim(),
          phone: cleanPhone,
          showroomLocation: bookingData.showroom,
          visitingDate: bookingData.date,
          notes: bookingData.notes || "Showroom visit booking",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to schedule showroom visit.");
      }
      setBookingResult(data.data);
      setBookingSuccess(true);
    } catch (err) {
      console.error("Showroom booking error:", err);
      setErrorMsg(err.message || "Network error. Please try again or call our showroom hotline directly.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBookingSuccess(false);
    setBookingResult(null);
    setBookingData({ name: "", phone: "", date: "", showroom: showroom.name, notes: "" });
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", paddingBottom: "70px" }}>
      {/* Search Engine Optimization (Local SEO) Metadata */}
      <KingletSEO
        title="Furniture Showroom in Mirpur, Dhaka | Kinglet Bangladesh Ltd"
        description="Visit the official Kinglet flagship furniture showroom in Mirpur-10, Dhaka. Touch & experience seasoned Mahogany, Black Plum Wood & Oak Veneer beds, sofas, dining tables with factory-direct pricing. Open 10 AM - 8:30 PM daily."
        keywords="furniture showroom Mirpur, best furniture store Dhaka, furniture showroom in Bangladesh, mahogany furniture showroom Dhaka, oak veneer furniture, Kinglet showroom"
        canonicalUrl="https://www.kingletbd.com/showrooms"
      />

      {/* Hero Banner */}
      <div style={{ background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)", color: "#ffffff", padding: "50px 0 45px", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "1000px", padding: "0 20px" }}>
          <span style={{ background: "rgba(236,34,38,0.2)", color: "#ff8080", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", display: "inline-block", marginBottom: "12px" }}>
            Official Kinglet Flagship Showroom
          </span>
          <h1 style={{ fontSize: "32px", fontWeight: "900", margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            Experience Kinglet Craftsmanship In Person
          </h1>
          <p style={{ color: "#9ca3af", maxWidth: "700px", margin: "0 auto", fontSize: "14.5px", lineHeight: "1.6" }}>
            We serve all valued customers directly through our sole official flagship experience center in Mirpur, Dhaka. Touch and feel our seasoned Mahogany and Oak Veneer suites, explore authentic Italian PU lacquer finishes, and receive direct manufacturer pricing.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: "1200px", padding: "35px 20px 0" }}>
        
        {/* Main Showroom Card */}
        <div
          className="showroom-hero-grid"
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            marginBottom: "50px",
          }}
        >
          {/* Left: Gallery & Visual */}
          <div style={{ position: "relative", minHeight: "360px", background: "#0f172a" }}>
            <img
              src={showroom.image}
              alt={showroom.name}
              width="600"
              height="360"
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.95 }}
            />
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                background: "#ec2226",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: "30px",
                fontSize: "12px",
                fontWeight: "750",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(236,34,38,0.4)",
              }}
            >
              <Sparkles size={14} /> Sole Official Showroom &amp; Head Office
            </div>

            <div
              style={{
                position: "absolute",
                bottom: "16px",
                left: "16px",
                right: "16px",
                background: "rgba(15, 23, 42, 0.88)",
                backdropFilter: "blur(6px)",
                color: "#ffffff",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "12.5px",
                lineHeight: "1.5",
              }}
            >
              <div style={{ fontWeight: "750", color: "#38bdf8", marginBottom: "3px" }}>
                🚇 Metro Rail Landmark
              </div>
              <div>Located right on Begum Rokeya Sarani beside West Shewrapara Metro Station. Rapid direct access via MRT Line 6!</div>
            </div>
          </div>

          {/* Right: Full Details */}
          <div style={{ padding: "32px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "inline-block", background: "#fef2f2", color: "#ec2226", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", padding: "3px 10px", borderRadius: "4px", marginBottom: "8px" }}>
                Central Experience Hub
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: "850", color: "#0f172a", margin: "0 0 12px", lineHeight: "1.3" }}>
                {showroom.name}
              </h2>

              {/* Exact Address */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "#334155", marginBottom: "12px", background: "#f8fafc", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <MapPin size={20} color="#ec2226" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span style={{ fontWeight: "600", lineHeight: "1.5" }}>
                  {showroom.address}
                </span>
              </div>

              {/* Timing */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", color: "#475569", marginBottom: "10px" }}>
                <Clock size={18} color="#ec2226" style={{ flexShrink: 0 }} />
                <span><strong>Visiting Hours: </strong>{showroom.hours}</span>
              </div>

              {/* Phone Hotlines */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", color: "#475569", marginBottom: "16px" }}>
                <Phone size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Hotlines: </strong>
                  <a href={`tel:${BRAND_INFO.hotlinePrimary}`} style={{ color: "#ec2226", fontWeight: "750", textDecoration: "none" }}>{BRAND_INFO.hotlinePrimary}</a>,{" "}
                  <a href="tel:+8801707073414" style={{ color: "#334155", fontWeight: "600", textDecoration: "none" }}>+88-01707073414</a>,{" "}
                  <a href="tel:01771776270" style={{ color: "#334155", fontWeight: "600", textDecoration: "none" }}>01771776270</a>
                </span>
              </div>

              {/* Key Features */}
              <div style={{ marginBottom: "22px" }}>
                <div style={{ fontSize: "12px", fontWeight: "750", color: "#64748b", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>
                  Showroom Amenities &amp; Services
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {showroom.features.map((feat, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#334155" }}>
                      <ShieldCheck size={14} color="#16a34a" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "18px" }}>
              <a
                href={`tel:${BRAND_INFO.hotlinePrimary}`}
                style={{
                  flex: 1,
                  background: "#ec2226",
                  color: "#ffffff",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  fontWeight: "750",
                  textAlign: "center",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 2px 8px rgba(236,34,38,0.25)",
                }}
              >
                <Phone size={16} /> Call Showroom
              </a>

              <a
                href={showroom.mapUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  background: "#0f172a",
                  color: "#ffffff",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  fontWeight: "750",
                  textAlign: "center",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Navigation size={16} /> Google Maps <ExternalLink size={13} />
              </a>

              <a
                href={`https://wa.me/${BRAND_INFO.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hello Kinglet! I would like to visit your showroom at 752/2 West Shewrapara, Mirpur.")}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "#25D366",
                  color: "#ffffff",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                }}
                title="WhatsApp Showroom Desk"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* VIP Appointment Form */}
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "36px", maxWidth: "720px", margin: "0 auto", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span style={{ color: "#ec2226", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>
              Personalized In-Person Consultation
            </span>
            <h2 style={{ fontSize: "24px", fontWeight: "850", color: "#0f172a", margin: "6px 0 8px" }}>
              Book a Showroom Visit
            </h2>
            <p style={{ color: "#64748b", fontSize: "13.5px", margin: 0, lineHeight: "1.5" }}>
              Meet our seasoned interior advisors at our West Shewrapara flagship showroom. We will prepare your interested models and arrange fabric &amp; wood samples prior to your arrival.
            </p>
          </div>

          {bookingSuccess ? (
            <div style={{ padding: "30px 24px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", textAlign: "center", color: "#166534" }}>
              <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#dcfce7", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                <Check size={30} color="#15803d" />
              </div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#14532d", marginBottom: "6px" }}>
                Visit Appointment Confirmed!
              </div>
              <div style={{ fontSize: "14px", lineHeight: "1.6", maxWidth: "520px", margin: "0 auto 16px" }}>
                Thank you, <strong>{bookingResult?.name || bookingData.name}</strong>. Our Mirpur showroom manager will call you at <strong>{bookingResult?.phone || bookingData.phone}</strong> to confirm your scheduled time and prepare the furniture pieces for demonstration.
              </div>

              {bookingResult?.bookingCode && (
                <div style={{ display: "inline-block", padding: "8px 18px", background: "#ffffff", borderRadius: "8px", border: "1px dashed #86efac", marginBottom: "18px" }}>
                  <div style={{ fontSize: "11px", color: "#475569", fontWeight: "700", textTransform: "uppercase" }}>Booking Reference</div>
                  <div style={{ fontSize: "19px", fontWeight: "900", color: "#ec2226", letterSpacing: "1px" }}>{bookingResult.bookingCode}</div>
                </div>
              )}

              <div style={{ fontSize: "12.5px", color: "#15803d", fontWeight: "600", marginBottom: "20px" }}>
                📍 Flagship Center: 752/2, West Shewrapara, Begum Rokeya Sarani, Mirpur, Dhaka-1216, Bangladesh.
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                <a
                  href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent(
                    `Hello Kinglet Mirpur Showroom, I booked an in-person visit appointment:\nBooking ID: ${bookingResult?.bookingCode || "N/A"}\nName: ${bookingData.name}\nDate: ${bookingData.date}\nPlease confirm staff availability.`
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
                  <MessageCircle size={16} /> WhatsApp Showroom Team
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
                  <RefreshCw size={14} /> Book Another Visit
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBooking} className="showroom-booking-grid">
              {errorMsg && (
                <div style={{ gridColumn: "span 2", padding: "12px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#991b1b", fontSize: "13px", fontWeight: "600" }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div>
                <label htmlFor="showroom-booking-name" style={{ display: "block", fontSize: "12.5px", fontWeight: "750", color: "#334151", marginBottom: "6px" }}>
                  Your Full Name *
                </label>
                <input
                  id="showroom-booking-name"
                  name="fullName"
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={bookingData.name}
                  onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13.5px" }}
                />
              </div>

              <div>
                <label htmlFor="showroom-booking-phone" style={{ display: "block", fontSize: "12.5px", fontWeight: "750", color: "#334151", marginBottom: "6px" }}>
                  Phone Number *
                </label>
                <input
                  id="showroom-booking-phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="017... / 018..."
                  value={bookingData.phone}
                  onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13.5px" }}
                />
              </div>

              <div>
                <label htmlFor="showroom-booking-date" style={{ display: "block", fontSize: "12.5px", fontWeight: "750", color: "#334151", marginBottom: "6px" }}>
                  Preferred Visiting Date *
                </label>
                <input
                  id="showroom-booking-date"
                  name="visitingDate"
                  type="date"
                  required
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13.5px" }}
                />
              </div>

              <div>
                <label htmlFor="showroom-booking-location" style={{ display: "block", fontSize: "12.5px", fontWeight: "750", color: "#334151", marginBottom: "6px" }}>
                  Showroom Location
                </label>
                <input
                  id="showroom-booking-location"
                  name="showroomLocation"
                  type="text"
                  readOnly
                  value="752/2 West Shewrapara, Mirpur, Dhaka"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", background: "#f1f5f9", color: "#334151", fontWeight: "650", cursor: "not-allowed" }}
                />
              </div>

              <div style={{ gridColumn: "span 2", marginTop: "4px" }}>
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
                    fontSize: "14.5px",
                    fontWeight: "800",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(236,34,38,0.25)",
                    transition: "background 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Confirming Showroom Appointment..." : "Confirm Showroom Visit Appointment"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
