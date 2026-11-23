import React from "react";
import { MapPin, Phone, Clock, MessageCircle, Sparkles, ShieldCheck, Truck, Wand2, Headphones } from "lucide-react";
import { BRAND_INFO } from "../../data/kingletData";

export default function KingletTopBar({ currency, setCurrency, onOpenOrderTrack, onOpenAiStylist }) {
  return (
    <div style={{ background: "#0a0c0f", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "13px", color: "#9da3ae" }}>
      {/* Dynamic Announcement Marquee */}
      <div style={{ background: "linear-gradient(90deg, #1b0708 0%, #300c0d 50%, #1b0708 100%)", borderBottom: "1px solid rgba(236,34,38,0.25)", overflow: "hidden", padding: "6px 0", color: "#fca5a5" }}>
        <div className="animate-marquee" style={{ whiteSpace: "nowrap", display: "flex", gap: "60px", fontSize: "12px", letterSpacing: "0.5px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={14} color="#f87171" />
            <strong>EID & FESTIVE PREVIEW:</strong> Enjoy up to 20% savings on Seasoned Mahogany, Black Plum Wood & Oak Veneer bedroom and dining suites.
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={14} color="#ec2226" />
            10-Year Anti-Borer & Structural Warranty included on all solid timber pieces.
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <MapPin size={14} color="#f87171" />
            Experience our 15,000 sq.ft Flagship Sales Center at Begum Rokeya Sarani, Mirpur, Dhaka.
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={14} color="#f87171" />
            Complimentary 3D Architectural Space Planning with turnkey interior contracts.
          </span>
          {/* Duplicate set for seamless looping */}
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={14} color="#f87171" />
            <strong>EID & FESTIVE PREVIEW:</strong> Enjoy up to 20% savings on Seasoned Mahogany, Black Plum Wood & Oak Veneer bedroom and dining suites.
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={14} color="#ec2226" />
            10-Year Anti-Borer & Structural Warranty included on all solid timber pieces.
          </span>
        </div>
      </div>

      {/* Main Top Utility Bar */}
      <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        {/* Left: Showroom address & hours */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
          <a
            href="https://maps.google.com/?q=752/2,+West+Shewrapara,+Begum+Rokeya+Sarani,+Mirpur,+Dhaka-1216"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "inherit", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9da3ae")}
          >
            <MapPin size={14} color="#ec2226" />
            <span>752/2, West Shewrapara, Begum Rokeya Sarani, Mirpur, Dhaka-1216, Bangladesh.</span>
          </a>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Clock size={14} color="#ec2226" />
            <span>9:00 AM – 10:00 PM (Fri–Thu)</span>
          </span>
        </div>

        {/* Right: Quick Services, Phone, WhatsApp, Currency */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* Track Order Direct Trigger */}
          <button
            onClick={onOpenOrderTrack}
            style={{
              background: "transparent",
              border: "none",
              color: "#ec2226",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "0",
            }}
          >
            <Truck size={13} />
            <span>Track Order</span>
          </button>

          {/* AI Stylist Direct Trigger */}
          <button
            onClick={onOpenAiStylist}
            style={{
              background: "rgba(212, 175, 55, 0.12)",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 8px",
              borderRadius: "6px",
            }}
          >
            <Wand2 size={12} color="#ec2226" />
            <span>AI Space Stylist</span>
          </button>

          {/* 24/7 Helpline & Smart Chatbot Trigger */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-kinglet-helpline", { detail: { tab: "chat" } }))}
            style={{
              background: "rgba(236, 34, 38, 0.15)",
              border: "1px solid rgba(236, 34, 38, 0.4)",
              color: "#ffffff",
              fontSize: "11.5px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 9px",
              borderRadius: "6px",
              transition: "all 0.15s ease",
            }}
            title="24/7 Helpline & AI Assistant (বাংলা, English, Banglish)"
          >
            <Headphones size={13} color="#ec2226" />
            <span>24/7 Helpline & Chat</span>
          </button>

          <a
            href={`tel:${BRAND_INFO.hotlinePrimary}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#ffffff", fontWeight: "600", textDecoration: "none" }}
          >
            <Phone size={14} color="#ec2226" />
            <span>{BRAND_INFO.hotlinePrimary}</span>
          </a>

          <a
            href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent("Hello Kinglet, I would like to inquire about your furniture and interior design services.")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#ec2226", color: "#ffffff", padding: "3px 10px", borderRadius: "999px", textDecoration: "none", fontWeight: "500", fontSize: "12px" }}
          >
            <MessageCircle size={13} />
            <span>WhatsApp Quick Chat</span>
          </a>

          {/* Currency Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>
            <button
              onClick={() => setCurrency("BDT")}
              style={{
                background: currency === "BDT" ? "#ec2226" : "transparent",
                color: currency === "BDT" ? "#ffffff" : "#9da3ae",
                border: "none",
                borderRadius: "4px",
                padding: "2px 6px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              ৳ BDT
            </button>
            <button
              onClick={() => setCurrency("USD")}
              style={{
                background: currency === "USD" ? "#ec2226" : "transparent",
                color: currency === "USD" ? "#ffffff" : "#9da3ae",
                border: "none",
                borderRadius: "4px",
                padding: "2px 6px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              $ USD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
