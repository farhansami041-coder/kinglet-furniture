import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { INTERIOR_PROJECTS } from "../../data/kingletData";

const DESIGN_STAGES = [
  {
    step: "01",
    title: "In-Home Laser Survey",
    desc: "Our senior architects visit your apartment or villa in Dhaka for precise laser measurement, architectural flow audit, and lifestyle consultation.",
  },
  {
    step: "02",
    title: "Photorealistic 3D Visualization",
    desc: "Experience your sanctuary before a single piece of wood is cut. Walkthrough 3D CGI renders with exact materials, lighting, and timber tones.",
  },
  {
    step: "03",
    title: "Factory Precision Millwork",
    desc: "Over 100 artisans craft your custom millwork, modular kitchen cabinets, and wardrobes under strict temperature-controlled factory standards.",
  },
  {
    step: "04",
    title: "White-Glove Turnkey Handover",
    desc: "Dust-free on-site installation, Italian PU polish touchup, architectural lighting integration, and official 10-Year Warranty certification.",
  },
];

export default function KingletInteriorStudio({ onOpenConsultation }) {
  const [activeProject, setActiveProject] = useState(INTERIOR_PROJECTS[0]);

  return (
    <section id="interior-studio" style={{ padding: "100px 20px", background: "#0e1015", position: "relative" }}>
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
            ARCHITECTURE & BESPOKE INTERIORS
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
            From Bare Concrete To Timeless Luxury
          </h2>
          <p style={{ color: "#9da3ae", maxWidth: "680px", margin: "0 auto", fontSize: "16px", lineHeight: "1.6" }}>
            We bridge the gap between architectural interior design and precision in-house furniture manufacturing. No middleman friction. Just flawless execution.
          </p>
        </div>

        {/* 4-Stage Design Journey */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
            marginBottom: "70px",
          }}
        >
          {DESIGN_STAGES.map((stg) => (
            <div
              key={stg.step}
              style={{
                background: "#161920",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                padding: "28px",
                position: "relative",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.4)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "800",
                  fontFamily: "var(--font-serif)",
                  color: "rgba(212, 175, 55, 0.3)",
                  marginBottom: "12px",
                }}
              >
                {stg.step}
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff", marginBottom: "8px" }}>
                {stg.title}
              </h3>
              <p style={{ fontSize: "13px", color: "#9da3ae", lineHeight: "1.6" }}>
                {stg.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Featured Project Showcase */}
        <div
          style={{
            background: "linear-gradient(135deg, #181c25 0%, #12151c 100%)",
            border: "1px solid rgba(212, 175, 55, 0.3)",
            borderRadius: "24px",
            padding: "40px",
            boxShadow: "0 30px 60px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "40px",
              alignItems: "center",
            }}
          >
            {/* Project Image */}
            <div
              style={{
                borderRadius: "18px",
                overflow: "hidden",
                height: "400px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                position: "relative",
              }}
            >
              <img
                src={activeProject.image}
                alt={activeProject.title}
                width="800"
                height="420"
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "16px",
                  background: "rgba(15,17,21,0.85)",
                  backdropFilter: "blur(8px)",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  color: "#ec2226",
                  fontWeight: "600",
                }}
              >
                {activeProject.category}
              </div>
            </div>

            {/* Project Details & Tab Switcher */}
            <div>
              <div style={{ fontSize: "12px", color: "#ec2226", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                COMPLETED ARCHITECTURAL SHOWCASE
              </div>

              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "32px",
                  color: "#ffffff",
                  fontWeight: "700",
                  marginBottom: "12px",
                }}
              >
                {activeProject.title}
              </h3>

              <div style={{ display: "flex", gap: "20px", marginBottom: "20px", fontSize: "14px" }}>
                <div>
                  <span style={{ color: "#9da3ae" }}>Scope: </span>
                  <strong style={{ color: "#ffffff" }}>{activeProject.scope}</strong>
                </div>
                <div>
                  <span style={{ color: "#9da3ae" }}>Timeline: </span>
                  <strong style={{ color: "#ffffff" }}>{activeProject.duration}</strong>
                </div>
              </div>

              <p style={{ color: "#d1d5db", fontSize: "15px", lineHeight: "1.7", marginBottom: "28px" }}>
                {activeProject.highlight}
              </p>

              {/* Project selector pills */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "30px" }}>
                {INTERIOR_PROJECTS.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => setActiveProject(proj)}
                    style={{
                      background: activeProject.id === proj.id ? "#ec2226" : "rgba(255, 255, 255, 0.06)",
                      color: "#ffffff",
                      border: activeProject.id === proj.id ? "1px solid #ec2226" : "1px solid rgba(255, 255, 255, 0.1)",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {proj.title}
                  </button>
                ))}
              </div>

              <button
                onClick={onOpenConsultation}
                className="btn-luxury-red"
                style={{ padding: "14px 28px" }}
              >
                <Sparkles size={16} />
                <span>Book 3D Design Consultation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
