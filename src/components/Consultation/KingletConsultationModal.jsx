import React, { useState } from "react";
import { X, Sparkles, CheckCircle, MessageCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { BRAND_INFO } from "../../data/kingletData";

export default function KingletConsultationModal({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("Gulshan / Banani");
  const [projectType, setProjectType] = useState("Complete Apartment Interior");
  const [approxSqft, setApproxSqft] = useState("2,200 sq.ft");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Please enter your name and phone number.");
      return;
    }
    setIsSubmitted(true);
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#ec2226", "#000000", "#ffffff"],
      });
    } catch {}
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Kinglet Interior Studio, I would like to schedule a 3D Interior Consultation:\n\n• Name: ${name}\n• Phone: ${phone}\n• Area in Dhaka: ${location}\n• Project Type: ${projectType} (${approxSqft})\n\nPlease share available architect consultation slots.`
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(10, 12, 16, 0.85)",
        backdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#161922",
          border: "1px solid rgba(212, 175, 55, 0.4)",
          borderRadius: "20px",
          maxWidth: "600px",
          width: "100%",
          padding: "36px",
          position: "relative",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
          animation: "fadeIn 0.25s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "18px",
            right: "18px",
            background: "rgba(255, 255, 255, 0.08)",
            border: "none",
            color: "#ffffff",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>

        {isSubmitted ? (
          <div style={{ textAlign: "center", padding: "30px 10px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.15)",
                border: "2px solid #ec2226",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle size={36} color="#ec2226" />
            </div>

            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "26px", color: "#ffffff", marginBottom: "8px" }}>
              Consultation Scheduled!
            </h3>
            <p style={{ color: "#9da3ae", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
              Thank you, {name}. Our senior architect will review your project brief ({projectType}) and call you at <strong>{phone}</strong> within 2 hours.
            </p>

            <a
              href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-luxury-red"
              style={{ width: "100%", padding: "14px", marginBottom: "12px" }}
            >
              <MessageCircle size={18} />
              <span>Connect on WhatsApp Instantly</span>
            </a>

            <button
              onClick={() => {
                setIsSubmitted(false);
                onClose();
              }}
              className="btn-luxury-outline"
              style={{ width: "100%", padding: "12px" }}
            >
              Close Window
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ec2226", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
              <Sparkles size={16} />
              <span>COMPLIMENTARY ARCHITECTURAL SESSION</span>
            </div>

            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", color: "#ffffff", fontWeight: "700", marginBottom: "8px" }}>
              Schedule Your 3D Interior Visit
            </h3>
            <p style={{ color: "#9da3ae", fontSize: "14px", marginBottom: "24px" }}>
              Includes on-site laser survey, customized 3D layout simulation, and direct factory millwork estimate.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label htmlFor="consult-full-name" style={{ fontSize: "12px", color: "#d1d5db", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                  Your Full Name *
                </label>
                <input
                  id="consult-full-name"
                  name="fullName"
                  type="text"
                  placeholder="e.g. Architect / Dr. Farhan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "10px 14px", color: "#ffffff", outline: "none" }}
                />
              </div>

              <div>
                <label htmlFor="consult-phone" style={{ fontSize: "12px", color: "#d1d5db", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                  Mobile / WhatsApp Number *
                </label>
                <input
                  id="consult-phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. 017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "10px 14px", color: "#ffffff", outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label htmlFor="consult-location" style={{ fontSize: "12px", color: "#d1d5db", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                    Location in Dhaka
                  </label>
                  <select
                    id="consult-location"
                    name="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ width: "100%", background: "#161922", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "10px", color: "#ffffff", outline: "none" }}
                  >
                    <option value="Gulshan / Banani">Gulshan / Banani</option>
                    <option value="Dhanmondi / Lalmatia">Dhanmondi / Lalmatia</option>
                    <option value="Uttara Model Town">Uttara Model Town</option>
                    <option value="Mirpur / DOHS">Mirpur / DOHS</option>
                    <option value="Bashundhara R/A">Bashundhara R/A</option>
                    <option value="Outside Dhaka">Outside Dhaka</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="consult-sqft" style={{ fontSize: "12px", color: "#d1d5db", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                    Approximate Size
                  </label>
                  <input
                    id="consult-sqft"
                    name="approxSqft"
                    type="text"
                    value={approxSqft}
                    onChange={(e) => setApproxSqft(e.target.value)}
                    style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "10px 14px", color: "#ffffff", outline: "none" }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="consult-project-type" style={{ fontSize: "12px", color: "#d1d5db", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                  Project Scope
                </label>
                <select
                  id="consult-project-type"
                  name="projectType"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  style={{ width: "100%", background: "#161922", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "10px", color: "#ffffff", outline: "none" }}
                >
                  <option value="Complete Apartment Interior">Complete Apartment Interior</option>
                  <option value="Duplex Villa Architectural Furnishing">Duplex Villa Architectural Furnishing</option>
                  <option value="Living & Master Bed Remodel">Living & Master Bed Remodel</option>
                  <option value="Modular Kitchen & Mahogany & Oak Veneer Doors">Modular Kitchen & Mahogany & Oak Veneer Doors</option>
                  <option value="Corporate Office & Boardroom">Corporate Office & Boardroom</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-luxury-red"
                style={{ width: "100%", marginTop: "10px", padding: "14px" }}
              >
                <Sparkles size={16} />
                <span>Request Free Architect Session</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
