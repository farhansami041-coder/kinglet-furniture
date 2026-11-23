import React from "react";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "../../data/kingletData";

export default function KingletCategoryGrid({ onSelectCategory }) {
  return (
    <section id="collections" style={{ padding: "90px 20px", background: "#0e1014" }}>
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
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
            CURATED ARCHITECTURAL SANCTUARIES
          </div>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(30px, 4vw, 48px)",
              color: "#ffffff",
              fontWeight: "700",
              letterSpacing: "-0.5px",
              marginBottom: "16px",
            }}
          >
            Explore Master Collections
          </h2>
          <p style={{ color: "#9da3ae", maxWidth: "600px", margin: "0 auto", fontSize: "16px" }}>
            Handcrafted with precision-milled Seasoned Mahogany, architectural joinery, and durable European hardware.
          </p>
        </div>

        {/* Dynamic Category Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "28px",
          }}
        >
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id);
                const el = document.getElementById("catalog-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="luxury-card"
              style={{
                position: "relative",
                height: "360px",
                borderRadius: "20px",
                overflow: "hidden",
                cursor: "pointer",
                background: "#181b22",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              {/* Background Image */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${cat.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                className="category-img"
              />

              {/* Gradient Shading */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(15,17,21,0.2) 0%, rgba(15,17,21,0.85) 75%, rgba(15,17,21,0.98) 100%)",
                }}
              />

              {/* Card Content Overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  zIndex: 2,
                }}
              >
                {/* Top Badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      background: "rgba(15, 17, 21, 0.8)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(212, 175, 55, 0.3)",
                      color: "#ec2226",
                      padding: "4px 12px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {cat.count}
                  </span>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(8px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      transition: "all 0.3s",
                    }}
                    className="arrow-circle"
                  >
                    <ArrowUpRight size={18} />
                  </div>
                </div>

                {/* Bottom Details */}
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "26px",
                      color: "#ffffff",
                      fontWeight: "700",
                      marginBottom: "6px",
                    }}
                  >
                    {cat.name}
                  </h3>
                  <p style={{ color: "#d1d5db", fontSize: "14px", marginBottom: "14px" }}>
                    {cat.tagline}
                  </p>

                  {/* Subcategories tags */}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {cat.subcategories.slice(0, 3).map((sub, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "rgba(255, 255, 255, 0.1)",
                          color: "#e5e7eb",
                          padding: "3px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                        }}
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .luxury-card:hover .category-img {
          transform: scale(1.08);
        }
        .luxury-card:hover .arrow-circle {
          background: #ec2226;
          transform: rotate(45deg);
        }
      `}</style>
    </section>
  );
}
