import React, { useState } from "react";
import { X, Mail } from "lucide-react";
import { BRAND_INFO } from "../../data/kingletData";

export default function KingletAnnouncementModalClone({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3500,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          background: "#ffffff",
          borderRadius: "14px",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexWrap: "wrap",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "rgba(0,0,0,0.1)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          <X size={18} />
        </button>

        <div style={{ flex: "1 1 260px", minHeight: "220px", background: "#f9fafb" }}>
          <img
            src={BRAND_INFO.banners.announcementModal}
            alt="Under Construction"
            width="320"
            height="240"
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div style={{ flex: "1 1 300px", padding: "32px 28px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h3 style={{ fontSize: "22px", fontWeight: "700", color: "#111827", margin: "0 0 8px" }}>
            Opps! Under Construction
          </h3>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 20px", lineHeight: "1.5" }}>
            This site is under construction! Actual Price will be Updated Soon. Subscribe to get our official catalog dispatch.
          </p>

          {subscribed ? (
            <div style={{ background: "#ecfdf5", color: "#065f46", padding: "12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600" }}>
              ✓ Thank you for subscribing to Kinglet updates!
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ position: "relative" }}>
                <Mail size={16} color="#9ca3af" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="newsletter-announcement-email"
                  name="subscriberEmail"
                  type="email"
                  placeholder="Your e-mail address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 38px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  background: "#ec2226",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
