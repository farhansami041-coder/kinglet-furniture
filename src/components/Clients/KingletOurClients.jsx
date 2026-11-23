import React, { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

// Helper to create reliable, self-contained SVG logos with zero network dependencies (prevents CORB)
const svgUri = (svgStr) => `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;

// Prestigious institutional & corporate clients with high-resolution vector emblems
const CLIENT_LOGOS = [
  {
    name: "Indian High Commission",
    subtitle: "Dhaka, Bangladesh",
    logo: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="46" fill="#f8fafc" stroke="#1e3a8a" stroke-width="3"/><circle cx="50" cy="50" r="24" fill="none" stroke="#1e3a8a" stroke-width="2.5"/><circle cx="50" cy="50" r="5" fill="#1e3a8a"/><g stroke="#1e3a8a" stroke-width="1.5"><line x1="50" y1="26" x2="50" y2="74"/><line x1="26" y1="50" x2="74" y2="50"/><line x1="33" y1="33" x2="67" y2="67"/><line x1="33" y1="67" x2="67" y2="33"/></g><text x="50" y="88" font-size="7.5" font-weight="900" fill="#1e3a8a" text-anchor="middle" font-family="sans-serif">CHANCERY</text><path d="M42 20 L50 12 L58 20" fill="none" stroke="#d97706" stroke-width="2.5"/></svg>`),
  },
  {
    name: "Jamuna Group",
    subtitle: "Industrial Conglomerate",
    logo: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect x="6" y="6" width="88" height="88" rx="18" fill="#881337" stroke="#fbbf24" stroke-width="3"/><circle cx="50" cy="50" r="32" fill="#9f1239" stroke="#fbbf24" stroke-width="1.5"/><text x="50" y="58" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif" letter-spacing="1">JG</text><text x="50" y="74" font-size="6.5" font-weight="800" fill="#fef08a" text-anchor="middle" font-family="sans-serif" letter-spacing="1.5">JAMUNA GROUP</text></svg>`),
  },
  {
    name: "Rapid Action Battalion",
    subtitle: "RAB, Bangladesh",
    logo: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M50 8 L85 24 V54 C85 74 50 92 50 92 C50 92 15 74 15 54 V24 Z" fill="#0f172a" stroke="#dc2626" stroke-width="3"/><path d="M50 16 L77 29 V52 C77 68 50 82 50 82 C50 82 23 68 23 52 V29 Z" fill="#1e293b"/><polygon points="50,28 55,42 70,42 58,51 63,65 50,56 37,65 42,51 30,42 45,42" fill="#dc2626"/><text x="50" y="76" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif" letter-spacing="1">RAB</text></svg>`),
  },
  {
    name: "National Board of Revenue",
    subtitle: "Government of BD",
    logo: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="#065f46" stroke="#fbbf24" stroke-width="3"/><circle cx="50" cy="50" r="36" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="3,2"/><circle cx="50" cy="40" r="14" fill="#dc2626"/><polygon points="50,32 52,38 58,38 53,42 55,48 50,44 45,48 47,42 42,38 48,38" fill="#ffffff"/><path d="M30 64 Q50 56 70 64" fill="none" stroke="#fbbf24" stroke-width="3"/><text x="50" y="74" font-size="8.5" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">NBR</text></svg>`),
  },
  {
    name: "Passport & Immigration",
    subtitle: "Dept. of Immigration",
    logo: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect x="14" y="8" width="72" height="84" rx="8" fill="#047857" stroke="#fbbf24" stroke-width="2.5"/><circle cx="50" cy="42" r="20" fill="none" stroke="#fbbf24" stroke-width="2"/><circle cx="50" cy="42" r="16" fill="#065f46"/><polygon points="50,32 53,39 60,39 55,43 57,50 50,46 43,50 45,43 40,39 47,39" fill="#fbbf24"/><rect x="24" y="68" width="52" height="2" fill="#fbbf24"/><text x="50" y="78" font-size="6.5" font-weight="900" fill="#fef08a" text-anchor="middle" font-family="sans-serif" letter-spacing="1">PASSPORT</text></svg>`),
  },
  {
    name: "Dhaka University",
    subtitle: "Est. 1921",
    logo: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="#581c87" stroke="#fbbf24" stroke-width="3"/><path d="M32 58 V42 Q32 30 50 30 Q68 30 68 42 V58 Z" fill="#7e22ce" stroke="#fbbf24" stroke-width="2"/><path d="M44 58 V46 Q44 40 50 40 Q56 40 56 46 V58 Z" fill="#fbbf24"/><path d="M28 66 L50 60 L72 66 L50 72 Z" fill="#ffffff"/><text x="50" y="84" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">ESTD 1921</text></svg>`),
  },
  {
    name: "Police Bureau",
    subtitle: "PBI, Bangladesh",
    logo: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><polygon points="50,6 61,32 89,32 67,50 75,76 50,60 25,76 33,50 11,32 39,32" fill="#1e3a8a" stroke="#e2e8f0" stroke-width="2"/><circle cx="50" cy="45" r="16" fill="#0f172a" stroke="#fbbf24" stroke-width="1.5"/><text x="50" y="50" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">PBI</text><text x="50" y="88" font-size="7" font-weight="800" fill="#1e3a8a" text-anchor="middle" font-family="sans-serif">POLICE</text></svg>`),
  },
  {
    name: "Bangladesh Bank",
    subtitle: "Central Bank",
    logo: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="#064e3b" stroke="#eab308" stroke-width="3"/><circle cx="50" cy="50" r="37" fill="#065f46"/><line x1="30" y1="36" x2="70" y2="36" stroke="#fbbf24" stroke-width="3"/><line x1="50" y1="28" x2="50" y2="60" stroke="#fbbf24" stroke-width="3"/><circle cx="30" cy="44" r="7" fill="none" stroke="#fbbf24" stroke-width="2"/><circle cx="70" cy="44" r="7" fill="none" stroke="#fbbf24" stroke-width="2"/><text x="50" y="74" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">BANGLADESH BANK</text></svg>`),
  },
  {
    name: "Bangladesh Army",
    subtitle: "Armed Forces",
    logo: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="#991b1b" stroke="#f59e0b" stroke-width="3"/><line x1="26" y1="74" x2="74" y2="26" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/><line x1="74" y1="74" x2="26" y2="26" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/><polygon points="50,28 54,38 64,38 56,44 59,54 50,48 41,54 44,44 36,38 46,38" fill="#fbbf24"/><text x="50" y="80" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">ARMY</text></svg>`),
  },
  {
    name: "BRAC University",
    subtitle: "Private University",
    logo: svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect x="8" y="8" width="84" height="84" rx="16" fill="#1e40af" stroke="#f97316" stroke-width="3"/><circle cx="50" cy="46" r="20" fill="#1d4ed8"/><path d="M50 28 C45 36 42 42 50 50 C58 42 55 36 50 28 Z" fill="#f97316"/><path d="M38 52 Q50 62 62 52" fill="none" stroke="#fde047" stroke-width="2.5"/><text x="50" y="78" font-size="8.5" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif" letter-spacing="1">BRACU</text></svg>`),
  },
];

export default function KingletOurClients() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const doubledLogos = [...CLIENT_LOGOS, ...CLIENT_LOGOS];

  return (
    <section
      ref={sectionRef}
      className="scroll-reveal"
      style={{
        background: "#f8f9fa",
        padding: "50px 0 45px",
        borderTop: "1px solid #f0f0f0",
        borderBottom: "1px solid #f0f0f0",
        overflow: "hidden",
      }}
    >
      {/* Header Row */}
      <div
        className="container"
        style={{
          maxWidth: "1400px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px", flex: 1 }}>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "900",
              color: "#111111",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "1px",
              whiteSpace: "nowrap",
              fontStyle: "italic",
            }}
          >
            Our Clients
          </h2>
          <div
            style={{
              flex: 1,
              height: "2px",
              background: "linear-gradient(90deg, #ec2226 0%, rgba(236, 34, 38, 0.08) 100%)",
              borderRadius: "2px",
              minWidth: "40px",
            }}
          />
        </div>

        <a
          href="#"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#ec2226",
            fontWeight: "700",
            fontSize: "13px",
            textDecoration: "none",
            transition: "gap 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.gap = "10px"; }}
          onMouseLeave={(e) => { e.currentTarget.style.gap = "6px"; }}
        >
          Check All Clients <ArrowRight size={15} />
        </a>
      </div>

      {/* Infinite Marquee */}
      <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
        {/* Left fade */}
        <div
          style={{
            position: "absolute", top: 0, left: 0, width: "80px", height: "100%",
            background: "linear-gradient(90deg, #f8f9fa 0%, transparent 100%)",
            zIndex: 2, pointerEvents: "none",
          }}
        />
        {/* Right fade */}
        <div
          style={{
            position: "absolute", top: 0, right: 0, width: "80px", height: "100%",
            background: "linear-gradient(270deg, #f8f9fa 0%, transparent 100%)",
            zIndex: 2, pointerEvents: "none",
          }}
        />

        {/* Scrolling Track */}
        <div
          className="clients-marquee-track"
          style={{
            display: "flex",
            gap: "0px",
            width: "max-content",
            animation: isVisible ? "marqueeScroll 40s linear infinite" : "none",
          }}
        >
          {doubledLogos.map((client, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "165px",
                padding: "18px 22px",
                margin: "0 10px",
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #f0f0f0",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px) scale(1.03)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(236, 34, 38, 0.12)";
                e.currentTarget.style.borderColor = "rgba(236, 34, 38, 0.3)";
                const track = e.currentTarget.closest('.clients-marquee-track');
                if (track) track.style.animationPlayState = 'paused';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#f0f0f0";
                const track = e.currentTarget.closest('.clients-marquee-track');
                if (track) track.style.animationPlayState = 'running';
              }}
            >
              <div style={{ width: "58px", height: "58px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                <img
                  src={client.logo}
                  alt={client.name}
                  width="58"
                  height="58"
                  loading="lazy"
                  style={{
                    width: "58px",
                    height: "58px",
                    aspectRatio: "1 / 1",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    filter: "grayscale(100%)",
                    opacity: 0.65,
                    transition: "filter 0.3s, opacity 0.3s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = "grayscale(0%)"; e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = "grayscale(100%)"; e.currentTarget.style.opacity = "0.65"; }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = document.createElement('div');
                    fallback.style.cssText = "width:36px;height:36px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#ec2226;font-size:18px;font-weight:900;";
                    fallback.textContent = client.name.charAt(0);
                    e.currentTarget.parentElement.appendChild(fallback);
                  }}
                />
              </div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#111111", textAlign: "center", lineHeight: "1.3", maxWidth: "130px" }}>
                {client.name}
              </div>
              <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "600", textAlign: "center", marginTop: "2px" }}>
                {client.subtitle}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
