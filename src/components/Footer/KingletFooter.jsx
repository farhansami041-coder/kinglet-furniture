import React from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Crown,
  Truck,
  ArrowUp,
  Wand2,
} from "lucide-react";
import { BRAND_INFO } from "../../data/kingletData";

const CURRENT_YEAR = new Date().getFullYear();

export default function KingletFooter({ _onOpenConsultation, onSelectCategory, onOpenOrderTrack, onOpenAiStylist }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer style={{ background: "#080a0d", borderTop: "1px solid rgba(212, 175, 55, 0.25)", color: "#9da3ae", fontSize: "14px", position: "relative" }}>
      {/* Upper Newsletter & VIP Club Banner */}
      <div style={{ background: "linear-gradient(90deg, #1b0708 0%, #290b0d 50%, #1b0708 100%)", borderBottom: "1px solid rgba(236,34,38,0.2)", padding: "36px 20px" }}>
        <div style={{ maxWidth: "1320px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#fca5a5", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
              JOIN THE KINGLET SANCTUARY CLUB
            </div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", color: "#ffffff", fontWeight: "700", marginTop: "4px" }}>
              Receive Private Preview Catalogs & Seasonal Woodworking Dispatches
            </h3>
          </div>

          <div style={{ display: "flex", gap: "10px", flex: "0 1 420px" }}>
            <input
              id="footer-newsletter-email"
              name="newsletterEmail"
              type="email"
              placeholder="Enter your email address..."
              style={{
                flex: 1,
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "999px",
                padding: "12px 20px",
                color: "#ffffff",
                fontSize: "13px",
                outline: "none",
              }}
            />
            <button
              onClick={() => alert("Thank you for synchronizing with the Kinglet Sanctuary Club!")}
              className="btn-luxury-red"
              style={{ padding: "12px 24px", fontSize: "13px" }}
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "80px 20px 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "40px",
            marginBottom: "60px",
          }}
        >
          {/* Brand & Story */}
          <div style={{ gridColumn: "span 1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "#ec2226",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Crown size={20} color="#ffffff" />
              </div>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "20px", fontWeight: "700", color: "#ffffff", letterSpacing: "1px" }}>
                KINGLET
              </span>
            </div>

            <p style={{ fontSize: "13px", lineHeight: "1.7", color: "#9da3ae", marginBottom: "20px" }}>
              Creators of fine environments. Handcrafting modern luxury furniture and turnkey interior solutions from seasoned Mahogany since 2019.
            </p>

            {/* Social Icons (SVGs) */}
            <div style={{ display: "flex", gap: "10px" }}>
              {/* Facebook */}
              <a
                href={BRAND_INFO.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", textDecoration: "none" }}
                aria-label="Facebook"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a
                href={BRAND_INFO.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", textDecoration: "none" }}
                aria-label="YouTube"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a
                href={BRAND_INFO.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", textDecoration: "none" }}
                aria-label="Instagram"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Collections */}
          <div>
            <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Master Collections
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", padding: 0 }}>
              {["bedroom", "living-room", "dining", "office"].map((catId) => (
                <li key={catId}>
                  <button
                    onClick={() => {
                      onSelectCategory(catId);
                      const el = document.getElementById("catalog-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    style={{ background: "transparent", border: "none", color: "#9da3ae", fontSize: "14px", cursor: "pointer", padding: 0 }}
                  >
                    {catId === "bedroom" ? "Bedroom Sanctuary" : catId === "living-room" ? "Living Room Sectionals" : catId === "dining" ? "Dining & Banquets" : "Executive Workspace"}
                  </button>
                </li>
              ))}
              <li>
                <a href="#interior-studio" style={{ color: "#ec2226", textDecoration: "none" }}>
                  Turnkey 3D Interior Design
                </a>
              </li>
              <li>
                <a href="#room-visualizer" style={{ color: "#9da3ae", textDecoration: "none" }}>
                  Atmosphere Simulator
                </a>
              </li>
              <li>
                <a href="#budget-estimator" style={{ color: "#9da3ae", textDecoration: "none" }}>
                  Budget & Cost Calculator
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Care & Policies */}
          <div>
            <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Customer Assurance
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", padding: 0 }}>
              {onOpenOrderTrack && (
                <li>
                  <button
                    onClick={onOpenOrderTrack}
                    style={{ background: "transparent", border: "none", color: "#ec2226", fontSize: "14px", cursor: "pointer", padding: 0, fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Truck size={14} />
                    <span>Track Bespoke Order</span>
                  </button>
                </li>
              )}
              {onOpenAiStylist && (
                <li>
                  <button
                    onClick={onOpenAiStylist}
                    style={{ background: "transparent", border: "none", color: "#ffffff", fontSize: "14px", cursor: "pointer", padding: 0, fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Wand2 size={14} color="#ec2226" />
                    <span>AI Space Stylist</span>
                  </button>
                </li>
              )}
              <li>10-Year Anti-Borer Warranty</li>
              <li>Free White-Glove Dhaka Delivery</li>
              <li>Care & Wood Maintenance Guide</li>
              <li>Exchange & Return Policy</li>
              <li>Bespoke Custom Furniture Orders</li>
              <li>Corporate & Duplex Projects</li>
            </ul>
          </div>

          {/* Flagship Showroom Contact */}
          <div>
            <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Sales Center & Inquiries
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <MapPin size={16} color="#ec2226" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>752/2, West Shewrapara, Begum Rokeya Sarani, Mirpur, Dhaka-1216, Bangladesh.</span>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <Phone size={16} color="#ec2226" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>+8801676900442, 01707073414, 01771776270</span>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <Mail size={16} color="#ec2226" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>info.kingletbd@gmail.com</span>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <Clock size={16} color="#9da3ae" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>Everyday except Sunday: 9:00 AM – 10:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accepted Payment Cards Strip */}
        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "24px",
            paddingBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "#9da3ae" }}>SECURE DHAKA & NATIONAL SETTLEMENT:</span>
            {["bKash", "Nagad", "Visa", "Mastercard", "Cash on Delivery", "Bank Wire"].map((method) => (
              <span
                key={method}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  color: "#e5e7eb",
                  fontWeight: "600",
                }}
              >
                {method}
              </span>
            ))}
          </div>

          <button
            onClick={scrollToTop}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: "pointer",
            }}
            aria-label="Scroll to Top"
          >
            <ArrowUp size={16} />
          </button>
        </div>

        {/* Copyright Attribution */}
        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            paddingTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          <div>
            © {CURRENT_YEAR} Kinglet Furniture & Interior. All Rights Reserved. Crafted with seasoned Mahogany.
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Privacy Policy</a>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Terms of Service</a>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Warranty Registration</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
