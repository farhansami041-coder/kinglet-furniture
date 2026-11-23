import React, { useState, useEffect } from "react";
import { MessageCircle, Phone, ArrowUp } from "lucide-react";
import { BRAND_INFO } from "../../data/kingletData";

export default function KingletFloatingConcierge() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", checkScroll, { passive: true });
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "28px",
        right: "24px",
        zIndex: 1900,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        alignItems: "center",
      }}
    >
      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          style={{
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            background: "#0a0a0a",
            border: "1px solid rgba(236, 34, 38, 0.4)",
            color: "#ec2226",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
            transition: "all 0.25s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#ec2226";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#0a0a0a";
            e.currentTarget.style.color = "#ec2226";
          }}
        >
          <ArrowUp size={20} />
        </button>
      )}

      {/* Direct Hotline Dial */}
      <a
        href={`tel:${BRAND_INFO.hotlinePrimary}`}
        aria-label="Call Kinglet Hotline"
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          background: "#ec2226",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          boxShadow: "0 8px 25px rgba(236, 34, 38, 0.5)",
          transition: "transform 0.25s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <Phone size={22} />
      </a>

      {/* Direct WhatsApp Concierge */}
      <a
        href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent("Hello Kinglet Furniture, I would like to inquire about your collections and custom woodworking.")}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{
          width: "54px",
          height: "54px",
          borderRadius: "50%",
          background: "#0a0a0a",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.5)",
          transition: "transform 0.25s",
          position: "relative",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <MessageCircle size={28} />
        {/* Pulse Ring */}
        <span
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: "#ffffff",
            border: "2px solid #0a0a0a",
          }}
        />
      </a>
    </div>
  );
}
