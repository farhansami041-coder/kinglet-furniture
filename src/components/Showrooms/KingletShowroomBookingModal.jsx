import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Sparkles, Building2, Loader2, MessageCircle } from "lucide-react";
import { BRAND_INFO } from "../../data/kingletData";

const SHOWROOMS = [
  {
    id: "mirpur-flagship",
    name: "Kinglet Flagship Showroom & Experience Center",
    address: "752/2, West Shewrapara, Begum Rokeya Sarani, Mirpur, Dhaka-1216, Bangladesh.",
    timing: "Everyday except Sunday: 9:00 AM - 10:00 PM",
    phone: "+880 1676 900442",
  },
];

export default function KingletShowroomBookingModal({ onClose }) {
  const [selectedShowroom] = useState("mirpur-flagship");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("morning");
  const [interest, setInterest] = useState("all");
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingCode, setBookingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Lock body and html scroll when Showroom modal is open
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

    const cleanPhone = phone.replace(/[-\s+]/g, "").replace(/^88/, "");
    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMsg("Please enter a valid 11-digit Bangladeshi mobile number (017XXXXXXXX).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/support/showroom-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          showroomLocation: showroomObj.name,
          visitingDate: date || new Date().toISOString().split("T")[0],
          visitingTime: timeSlot,
          notes: `Interested Category: ${interest}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to confirm showroom appointment.");
      }
      setBookingCode(data.data?.bookingCode || data.data?.id || "KL-SHW-VIP");
      setIsSuccess(true);
    } catch (err) {
      console.error("Modal booking error:", err);
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showroomObj = SHOWROOMS.find((s) => s.id === selectedShowroom) || SHOWROOMS[0];

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
          maxWidth: "660px",
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
              <Building2 size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", letterSpacing: "-0.3px" }}>
                Book Showroom VIP Experience
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                Private wood inspection with a Kinglet Senior Interior Architect
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
            <div style={{ textAlign: "center", padding: "20px 10px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px" }}>
                VIP Appointment Confirmed!
              </h3>
              <p style={{ fontSize: "13.5px", color: "#475569", maxWidth: "440px", margin: "0 auto 16px" }}>
                Thank you, <strong>{name}</strong>. Our senior designer at{" "}
                <strong>{showroomObj.name}</strong> has registered your personal consultation session. We will call you on <strong>{phone}</strong>.
              </p>

              {bookingCode && (
                <div style={{ display: "inline-block", padding: "8px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", marginBottom: "16px" }}>
                  <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Booking Reference</div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "#ec2226", letterSpacing: "1px" }}>{bookingCode}</div>
                </div>
              )}

              <div
                style={{
                  background: "#f8fafc",
                  padding: "14px",
                  borderRadius: "10px",
                  fontSize: "12.5px",
                  color: "#334155",
                  marginBottom: "20px",
                  textAlign: "left",
                }}
              >
                📍 <strong>Location:</strong> {showroomObj.address}
                <br />
                📞 <strong>Direct Helpline:</strong> {showroomObj.phone}
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <a
                  href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent(
                    `Hello Kinglet Showroom, I confirmed my VIP appointment:\nBooking: ${bookingCode}\nName: ${name}\nPlease prepare the models for demonstration.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: "#25d366",
                    color: "#ffffff",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    fontWeight: "800",
                    fontSize: "13px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <MessageCircle size={15} /> WhatsApp Director
                </a>
                <button
                  onClick={onClose}
                  style={{
                    background: "#0f172a",
                    color: "#ffffff",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontWeight: "800",
                    fontSize: "13px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errorMsg && (
                <div style={{ padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#991b1b", fontSize: "12.5px", fontWeight: "600", marginBottom: "14px" }}>
                  ⚠️ {errorMsg}
                </div>
              )}
              {/* Showroom Choice */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>
                  Official Kinglet Showroom Location
                </label>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1.5px solid #ec2226",
                    background: "#fff5f5",
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: "800", color: "#ec2226" }}>
                    {SHOWROOMS[0].name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#334155", marginTop: "3px", fontWeight: "500" }}>
                    📍 {SHOWROOMS[0].address}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    ⏰ {SHOWROOMS[0].timing}
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label htmlFor="booking-name" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                    Your Full Name *
                  </label>
                  <input
                    id="booking-name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Mahbubur Rahman"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="booking-phone" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                    Mobile Number (WhatsApp) *
                  </label>
                  <input
                    id="booking-phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Date & Time Slot */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label htmlFor="booking-date" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                    Preferred Visit Date
                  </label>
                  <input
                    id="booking-date"
                    name="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="booking-time-slot" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                    Preferred Time Slot
                  </label>
                  <select
                    id="booking-time-slot"
                    name="timeSlot"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      outline: "none",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="morning">Morning (11:00 AM - 01:00 PM)</option>
                    <option value="afternoon">Afternoon (02:00 PM - 05:00 PM)</option>
                    <option value="evening">Evening (05:00 PM - 08:30 PM)</option>
                  </select>
                </div>
              </div>

              {/* Category of Interest */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                  Primary Category of Interest
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { id: "all", label: "Full Apartment" },
                    { id: "living", label: "Living Sofas" },
                    { id: "bedroom", label: "Bedroom Suite" },
                    { id: "dining", label: "Dining Table" },
                    { id: "office", label: "Executive Office" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setInterest(c.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "700",
                        border: interest === c.id ? "1px solid #ec2226" : "1px solid #e2e8f0",
                        background: interest === c.id ? "#ec2226" : "#f8fafc",
                        color: interest === c.id ? "#ffffff" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
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
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{loading ? "Confirming Appointment..." : "Confirm VIP Showroom Appointment"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
