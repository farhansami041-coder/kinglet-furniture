import React, { useState, useEffect, useMemo } from "react";

// Custom High-Fidelity SVG Icons tailored for Kinglet luxury branding
const NationwideShippingIcon = ({ isHighlighted }) => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      filter: isHighlighted
        ? "drop-shadow(0 0 12px rgba(236, 34, 38, 0.6))"
        : "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5))",
      transition: "all 0.3s ease",
    }}
  >
    <g transform="translate(4, 8)">
      {/* Truck Cargo Body */}
      <path
        d="M2 4C2 2.89543 2.89543 2 4 2H26C27.1046 2 28 2.89543 28 4V22H2V4Z"
        fill="#141923"
        stroke={isHighlighted ? "#ec2226" : "#475569"}
        strokeWidth="2"
      />
      {/* Front Cabin */}
      <path
        d="M28 8H34.5858C35.1163 8 35.6251 8.21071 36 8.58579L39.4142 12C39.7893 12.3749 40 12.8837 40 13.4142V22H28V8Z"
        fill={isHighlighted ? "#ec2226" : "#dc2626"}
      />
      {/* Cabin Window */}
      <path d="M28 10H33L36 14H28V10Z" fill="#ffffff" opacity="0.9" />
      {/* Safe Transit Verified Shield Emblem on Cargo */}
      <rect x="7" y="6" width="14" height="10" rx="2" fill="#1e293b" />
      <path
        d="M10 11L13 13.5L18 8.5"
        stroke="#22c55e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wheels */}
      <circle cx="10" cy="23" r="4.5" fill="#090d14" stroke="#94a3b8" strokeWidth="2.2" />
      <circle cx="10" cy="23" r="1.6" fill="#ec2226" />
      <circle cx="32" cy="23" r="4.5" fill="#090d14" stroke="#94a3b8" strokeWidth="2.2" />
      <circle cx="32" cy="23" r="1.6" fill="#ec2226" />
      {/* Speed lines */}
      <line x1="-1" y1="6" x2="-4" y2="6" stroke="#ec2226" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <line x1="-1" y1="12" x2="-6" y2="12" stroke="#ec2226" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="-1" y1="18" x2="-3" y2="18" stroke="#ec2226" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </g>
  </svg>
);

const MoneyBackIcon = ({ isHighlighted }) => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      filter: isHighlighted
        ? "drop-shadow(0 0 12px rgba(234, 179, 8, 0.6))"
        : "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5))",
      transition: "all 0.3s ease",
    }}
  >
    <g transform="translate(4, 4)">
      {/* Guarantee Shield */}
      <path
        d="M20 2L5 8V19C5 28.5 11.5 37 20 40C28.5 37 35 28.5 35 19V8L20 2Z"
        fill="#121826"
        stroke={isHighlighted ? "#eab308" : "#ca8a04"}
        strokeWidth="2.2"
      />
      {/* Golden Inner Aura Ring */}
      <circle
        cx="20"
        cy="19"
        r="11"
        fill="rgba(234, 179, 8, 0.12)"
        stroke="#fbbf24"
        strokeWidth="1.5"
        strokeDasharray="3 1.5"
      />
      {/* Circular Return Arrow */}
      <path
        d="M14 15.5C15.5 13.5 17.6 12.5 20 12.5C24 12.5 27 15.5 27 19.5C27 23.5 24 26.5 20 26.5C16.8 26.5 14.2 24.5 13.3 21.8"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M13 12V16H17"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 3-Days Badge */}
      <text
        x="20.5"
        y="22"
        textAnchor="middle"
        fill="#fbbf24"
        fontSize="8"
        fontWeight="900"
        fontFamily="sans-serif"
      >
        3D
      </text>
    </g>
  </svg>
);

const Support247Icon = ({ isHighlighted }) => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      filter: isHighlighted
        ? "drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))"
        : "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5))",
      transition: "all 0.3s ease",
    }}
  >
    <g transform="translate(4, 4)">
      {/* Headset Arc */}
      <path
        d="M7 20C7 12.8203 12.8203 7 20 7C27.1797 7 33 12.8203 33 20V25"
        stroke={isHighlighted ? "#60a5fa" : "#3b82f6"}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Left Earpad */}
      <rect x="4" y="19" width="6" height="11" rx="3" fill="#2563eb" />
      {/* Right Earpad */}
      <rect x="30" y="19" width="6" height="11" rx="3" fill="#2563eb" />
      {/* Microphone Arm */}
      <path
        d="M31 24V28C31 30.5 29 32.5 26.5 32.5H21"
        stroke="#60a5fa"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="32.5" r="2.2" fill="#ec2226" />
      {/* 24/7 Illuminated Badge */}
      <rect
        x="10.5"
        y="14.5"
        width="19"
        height="11"
        rx="3"
        fill="#0f172a"
        stroke="#3b82f6"
        strokeWidth="1.4"
      />
      <text
        x="20"
        y="22.5"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="7.5"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="0.2px"
      >
        24/7
      </text>
    </g>
  </svg>
);

const SecureOnlinePayIcon = ({ isHighlighted }) => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      filter: isHighlighted
        ? "drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))"
        : "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5))",
      transition: "all 0.3s ease",
    }}
  >
    {/* Smartphone Frame (matching Image 2) */}
    <rect
      x="12"
      y="3"
      width="24"
      height="42"
      rx="5"
      stroke="#94a3b8"
      strokeWidth="2.4"
      fill="#0c111c"
    />
    {/* Camera Speaker Notch */}
    <line x1="19" y1="6.5" x2="29" y2="6.5" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />
    
    {/* Upper Card (Orange/Coral) */}
    <rect x="15" y="11" width="18" height="11" rx="2" fill="#fb923c" />
    <rect x="17" y="13.5" width="4.5" height="3" rx="0.6" fill="#fef08a" />
    <line x1="15" y1="18" x2="33" y2="18" stroke="#ea580c" strokeWidth="1.5" />

    {/* Lower Card (Teal/Cyan with PAY) */}
    <rect x="16" y="21" width="19" height="12" rx="2" fill="#06b6d4" />
    <text
      x="25.5"
      y="29.5"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="6.5"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="0.4px"
    >
      PAY
    </text>

    {/* Home Indicator */}
    <circle cx="24" cy="40.5" r="1.5" fill="#64748b" />
  </svg>
);

const FEATURES = [
  {
    id: 1,
    title: "Nationwide Shipping",
    desc: "We deliver safely to your home anywhere in Bangladesh. We handle and are responsible for everything during delivery.",
    badge: "All 64 Districts",
    icon: NationwideShippingIcon,
  },
  {
    id: 2,
    title: "Money Back Guarantee",
    desc: "We return money within 3 days",
    badge: "3-Day Return",
    icon: MoneyBackIcon,
  },
  {
    id: 3,
    title: "24/7 Customer Support",
    desc: "24/7 Support. Always Here For You.",
    badge: "Always Active",
    icon: Support247Icon,
  },
  {
    id: 4,
    title: "Secure Online Payment",
    desc: "We posess SSL / Secure Certificate",
    badge: "SSL Encrypted",
    icon: SecureOnlinePayIcon,
  },
];

const FEATURE_ICONS = [NationwideShippingIcon, MoneyBackIcon, Support247Icon, SecureOnlinePayIcon];

export default function KingletFeaturesStripClone() {
  const [siteSettings, setSiteSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kinglet_site_settings") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e?.detail) setSiteSettings(e.detail);
    };
    const handleStorage = (e) => {
      if (e.key === "kinglet_site_settings" && e.newValue) {
        try {
          setSiteSettings(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("kinglet_settings_updated", handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("kinglet_settings_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Synchronize dynamic features from Admin -> Manage Features / Services
  const activeFeatures = useMemo(() => {
    try {
      const raw = siteSettings?.website_features || siteSettings?.site_features_list;
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            id: item.id || idx + 1,
            title: item.title || "Kinglet Guarantee",
            desc: item.desc || item.description || "",
            badge: item.badge || "AUTHENTIC",
            icon: FEATURE_ICONS[idx % FEATURE_ICONS.length],
          }));
        }
      }
    } catch {}
    return FEATURES;
  }, [siteSettings?.website_features, siteSettings?.site_features_list]);

  // Card 0 starts highlighted as shown in luxury brand preview
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section
      aria-label="Kinglet Customer Guarantees & Features"
      style={{
        background: "#000000",
        padding: "44px 20px",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "700px",
          height: "140px",
          background: "radial-gradient(ellipse at center, rgba(236, 34, 38, 0.09) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div
          className="kinglet-features-strip-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
          }}
        >
          {activeFeatures.map((item, idx) => {
            const IconComponent = item.icon;
            const isSelected = activeIdx === idx;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveIdx(idx)}
                tabIndex={0}
                role="article"
                aria-label={item.title}
                style={{
                  position: "relative",
                  background: isSelected
                    ? "linear-gradient(180deg, rgba(18, 18, 22, 0.98) 0%, rgba(10, 10, 12, 0.98) 100%)"
                    : "rgba(255, 255, 255, 0.015)",
                  borderRadius: "14px",
                  padding: "32px 24px",
                  border: isSelected
                    ? "1px solid rgba(236, 34, 38, 0.55)"
                    : "1px solid rgba(255, 255, 255, 0.06)",
                  boxShadow: isSelected
                    ? "0 0 28px rgba(236, 34, 38, 0.28), inset 0 0 16px rgba(236, 34, 38, 0.08)"
                    : "none",
                  transform: isSelected ? "translateY(-4px)" : "translateY(0)",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  outline: "none",
                }}
              >
                {/* Top Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "14px",
                    fontSize: "9px",
                    fontWeight: "800",
                    letterSpacing: "0.6px",
                    textTransform: "uppercase",
                    color: isSelected ? "#ec2226" : "rgba(255, 255, 255, 0.4)",
                    transition: "color 0.3s ease",
                  }}
                >
                  {item.badge}
                </div>

                {/* Related Icon Container */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "18px",
                    transform: isSelected ? "scale(1.08)" : "scale(1)",
                    transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <IconComponent isHighlighted={isSelected} />
                </div>

                {/* Feature Title (Matching Image 2) */}
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: "800",
                    color: "#ffffff",
                    margin: "0 0 10px",
                    lineHeight: "1.3",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {item.title}
                </h3>

                {/* Feature Description (Matching Image 2) */}
                <p
                  style={{
                    fontSize: "13px",
                    color: isSelected ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.62)",
                    margin: 0,
                    lineHeight: "1.55",
                    maxWidth: "280px",
                    transition: "color 0.25s ease",
                  }}
                >
                  {item.desc}
                </p>

                {/* Bottom Red Accent Indicator */}
                <div
                  style={{
                    width: isSelected ? "36px" : "0px",
                    height: "2px",
                    background: "#ec2226",
                    borderRadius: "2px",
                    marginTop: "16px",
                    opacity: isSelected ? 1 : 0,
                    boxShadow: "0 0 8px #ec2226",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
