import React from "react";
import { Flame, Layers, Users, Sparkles } from "lucide-react";
import { CRAFT_PILLARS } from "../../data/kingletData";

const PILLAR_ICONS = {
  seasoning: Flame,
  joinery: Layers,
  finishing: Sparkles,
  artisans: Users,
};

export default function KingletCraftsmanship() {
  return (
    <section id="craftsmanship" style={{ padding: "100px 20px", background: "#0b0d11", position: "relative" }}>
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "3px",
              color: "#ec2226",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            THE KINGLET STANDARD
          </div>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(30px, 4.5vw, 48px)",
              color: "#ffffff",
              fontWeight: "700",
              letterSpacing: "-0.5px",
              marginBottom: "16px",
            }}
          >
            Anatomy of Uncompromising Woodworking
          </h2>
          <p style={{ color: "#9da3ae", maxWidth: "640px", margin: "0 auto", fontSize: "16px" }}>
            We treat furniture not as temporary commodities, but as generational heirlooms engineered against Dhaka's tropical humidity and seasonal stress.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "28px",
            marginBottom: "60px",
          }}
        >
          {CRAFT_PILLARS.map((pillar) => {
            const Icon = PILLAR_ICONS[pillar.id] || Sparkles;
            return (
              <div
                key={pillar.id}
                style={{
                  background: "#14171f",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "20px",
                  padding: "32px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.4)";
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 20px 40px -10px rgba(0,0,0,0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div>
                  {/* Icon & Badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "14px",
                        background: "rgba(236,34,38,0.12)",
                        border: "1px solid rgba(236,34,38,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={24} color="#ec2226" />
                    </div>
                    <span
                      style={{
                        background: "rgba(212, 175, 55, 0.12)",
                        border: "1px solid rgba(212, 175, 55, 0.3)",
                        color: "#ec2226",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#ffffff", marginBottom: "6px" }}>
                    {pillar.title}
                  </h3>
                  <div style={{ fontSize: "13px", color: "#ec2226", fontWeight: "600", marginBottom: "14px" }}>
                    {pillar.subtitle}
                  </div>
                  <p style={{ fontSize: "14px", color: "#9da3ae", lineHeight: "1.6" }}>
                    {pillar.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quality Comparison Table (Kinglet vs Ordinary Market Furniture) */}
        <div
          style={{
            background: "#151820",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "20px",
            padding: "36px",
            overflowX: "auto",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "24px",
              color: "#ffffff",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            How Kinglet Compares Against Generic Market Furniture
          </h3>

          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.12)" }}>
                <th style={{ padding: "14px", textAlign: "left", color: "#9da3ae" }}>Craftsmanship Parameter</th>
                <th style={{ padding: "14px", textAlign: "left", color: "#ec2226" }}>Kinglet Furniture & Interior</th>
                <th style={{ padding: "14px", textAlign: "left", color: "#6b7280" }}>Standard Market Vendors</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <td style={{ padding: "14px", color: "#ffffff", fontWeight: "600" }}>Raw Timber Source</td>
                <td style={{ padding: "14px", color: "#ffffff", fontWeight: "600" }}>
                  100% Certified Seasoned Mahogany & Oak & Gamari
                </td>
                <td style={{ padding: "14px", color: "#9da3ae" }}>Unseasoned mixed softwoods / low-grade veneer</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <td style={{ padding: "14px", color: "#ffffff", fontWeight: "600" }}>Moisture Seasoning</td>
                <td style={{ padding: "14px", color: "#ffffff", fontWeight: "600" }}>
                  21-Day Scientific Steam Kiln (10-12% target)
                </td>
                <td style={{ padding: "14px", color: "#9da3ae" }}>Air-dried or unseasoned (causes wood bending & splits)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <td style={{ padding: "14px", color: "#ffffff", fontWeight: "600" }}>Frame Joinery</td>
                <td style={{ padding: "14px", color: "#ffffff", fontWeight: "600" }}>
                  Interlocking Mortise-and-Tenon + Marine Resin
                </td>
                <td style={{ padding: "14px", color: "#9da3ae" }}>Surface nails and screws (loosens in 1-2 years)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <td style={{ padding: "14px", color: "#ffffff", fontWeight: "600" }}>Finishing & Polish</td>
                <td style={{ padding: "14px", color: "#ffffff", fontWeight: "600" }}>
                  Italian Automated Multi-Coat Polyurethane (PU)
                </td>
                <td style={{ padding: "14px", color: "#9da3ae" }}>Single hand spirit polish (scratches & white-spots)</td>
              </tr>
              <tr>
                <td style={{ padding: "14px", color: "#ffffff", fontWeight: "600" }}>Warranty & Support</td>
                <td style={{ padding: "14px", color: "#ec2226", fontWeight: "700" }}>
                  10-Year Anti-Borer & Structural Guarantee
                </td>
                <td style={{ padding: "14px", color: "#9da3ae" }}>No warranty or vague verbal promises</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
