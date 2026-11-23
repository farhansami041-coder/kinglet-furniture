import React, { useState } from "react";
import { Sparkles, Sun, Moon, Layers, Palette, Eye, ArrowRight } from "lucide-react";

const ROOM_PIECES = [
  {
    id: "bed",
    name: "Grain Craft Bed Suite",
    room: "Master Bedroom Sanctuary",
    imageDay: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
    imageNight: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    timber: "Seasoned Mahogany",
    accent: "Hand-rubbed Walnut Polish",
  },
  {
    id: "sofa",
    name: "Forestique L-Shaped Living Suite",
    room: "Open-Plan Living Sanctuary",
    imageDay: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
    imageNight: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80",
    timber: "Seasoned Mahogany Frame & Belgian Linen",
    accent: "Forest Slate & Champagne Brass",
  },
  {
    id: "dining",
    name: "Grand Atelier Banquet Suite",
    room: "Formal Dining Hall",
    imageDay: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80",
    imageNight: "https://images.unsplash.com/photo-1533090161767-e6ffed986b88?auto=format&fit=crop&w=1200&q=80",
    timber: "Master-Grade Mahogany Pedestal",
    accent: "Carrara Marble Inlay",
  },
];

const WALL_PALETTES = [
  { name: "Alabaster Cream", color: "#FAF7EE", filter: "brightness(1) contrast(1)" },
  { name: "Warm Greige", color: "#D4CDC5", filter: "sepia(0.15) brightness(0.95)" },
  { name: "Nordic Sage", color: "#A8B2A6", filter: "hue-rotate(25deg) brightness(0.92)" },
  { name: "Obsidian Charcoal", color: "#1F232B", filter: "contrast(1.15) brightness(0.85)" },
];

const FLOOR_TYPES = [
  { name: "Herringbone French Oak", color: "#C89D66" },
  { name: "Carrara White Marble", color: "#E8E8E8" },
  { name: "Dark Smoked Walnut", color: "#4A2F13" },
];

export default function KingletRoomVisualizer({ onOpenConsultation }) {
  const [selectedPiece, setSelectedPiece] = useState(ROOM_PIECES[0]);
  const [isNightMode, setIsNightMode] = useState(false);
  const [selectedWall, setSelectedWall] = useState(WALL_PALETTES[0]);
  const [selectedFloor, setSelectedFloor] = useState(FLOOR_TYPES[0]);

  const currentImage = isNightMode ? selectedPiece.imageNight : selectedPiece.imageDay;

  return (
    <section id="room-visualizer" style={{ padding: "100px 20px", background: "#0a0c0f", position: "relative" }}>
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "3px", color: "#ec2226", textTransform: "uppercase", marginBottom: "10px" }}>
            VIRTUAL ROOM STUDIO
          </div>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(28px, 4vw, 44px)",
              color: "#ffffff",
              fontWeight: "700",
              letterSpacing: "-0.5px",
              marginBottom: "14px",
            }}
          >
            Interactive Sanctuary Atmosphere Simulator
          </h2>
          <p style={{ color: "#9da3ae", maxWidth: "640px", margin: "0 auto", fontSize: "15px" }}>
            See how Kinglet solid timber pieces harmonize across daytime sunlight and intimate evening warmth with your custom wall and flooring finishes.
          </p>
        </div>

        {/* Visualizer Workbench */}
        <div
          style={{
            background: "#141720",
            border: "1px solid rgba(212, 175, 55, 0.35)",
            borderRadius: "24px",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            boxShadow: "0 30px 70px rgba(0, 0, 0, 0.8)",
          }}
        >
          {/* Left / Center: Interactive Canvas */}
          <div
            style={{
              position: "relative",
              minHeight: "460px",
              overflow: "hidden",
              background: "#080a0d",
            }}
          >
            <img
              src={currentImage}
              alt={selectedPiece.name}
              width="800"
              height="500"
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "filter 0.5s ease, transform 0.6s ease",
                filter: `${selectedWall.filter} ${isNightMode ? "brightness(0.85) contrast(1.1)" : "brightness(1.02)"}`,
              }}
            />

            {/* Ambient Lighting Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: isNightMode
                  ? "radial-gradient(circle at 50% 40%, rgba(212,175,55,0.18) 0%, rgba(10,12,16,0.65) 100%)"
                  : "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(10,12,16,0.4) 100%)",
                pointerEvents: "none",
                transition: "background 0.5s ease",
              }}
            />

            {/* Floating Room Info Overlay */}
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                background: "rgba(15, 17, 21, 0.88)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(236, 34, 38, 0.3)",
                padding: "10px 18px",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "11px", color: "#ec2226", fontWeight: "700", textTransform: "uppercase" }}>
                {selectedPiece.room}
              </div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>
                {selectedPiece.name}
              </div>
            </div>

            {/* Quick Lighting Mode Switcher */}
            <div
              style={{
                position: "absolute",
                bottom: "20px",
                left: "20px",
                display: "flex",
                gap: "8px",
                background: "rgba(15, 17, 21, 0.9)",
                backdropFilter: "blur(12px)",
                padding: "6px",
                borderRadius: "999px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              <button
                onClick={() => setIsNightMode(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: !isNightMode ? "#ec2226" : "transparent",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "999px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <Sun size={14} />
                <span>Daylight Sun</span>
              </button>

              <button
                onClick={() => setIsNightMode(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: isNightMode ? "#ec2226" : "transparent",
                  color: isNightMode ? "#121418" : "#ffffff",
                  border: "none",
                  borderRadius: "999px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <Moon size={14} />
                <span>Evening Ambient</span>
              </button>
            </div>
          </div>

          {/* Right: Studio Customization Panel */}
          <div style={{ padding: "36px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              {/* 1. Select Furniture Setting */}
              <div style={{ marginBottom: "26px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Eye size={15} color="#ec2226" />
                  <span>1. Select Furniture Sanctuary:</span>
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {ROOM_PIECES.map((piece) => (
                    <button
                      key={piece.id}
                      onClick={() => setSelectedPiece(piece)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: selectedPiece.id === piece.id ? "rgba(236, 34, 38, 0.15)" : "rgba(255, 255, 255, 0.04)",
                        border: selectedPiece.id === piece.id ? "1px solid #ec2226" : "1px solid rgba(255, 255, 255, 0.08)",
                        color: "#ffffff",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textAlign: "left",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "600" }}>{piece.name}</div>
                        <div style={{ fontSize: "11px", color: "#9da3ae" }}>{piece.timber}</div>
                      </div>
                      <ArrowRight size={14} color={selectedPiece.id === piece.id ? "#ec2226" : "#6b7280"} />
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Wall Tone Atmosphere */}
              <div style={{ marginBottom: "26px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <Palette size={15} color="#ec2226" />
                  <span>2. Architectural Wall Color: <strong style={{ color: "#ec2226" }}>{selectedWall.name}</strong></span>
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {WALL_PALETTES.map((wall) => (
                    <button
                      key={wall.name}
                      onClick={() => setSelectedWall(wall)}
                      title={wall.name}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: wall.color,
                        border: selectedWall.name === wall.name ? "3px solid #ec2226" : "2px solid rgba(255,255,255,0.2)",
                        cursor: "pointer",
                        transition: "transform 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                  ))}
                </div>
              </div>

              {/* 3. Flooring Material */}
              <div style={{ marginBottom: "30px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <Layers size={15} color="#ec2226" />
                  <span>3. Flooring Material: <strong style={{ color: "#ec2226" }}>{selectedFloor.name}</strong></span>
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {FLOOR_TYPES.map((floor) => (
                    <button
                      key={floor.name}
                      onClick={() => setSelectedFloor(floor)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        background: selectedFloor.name === floor.name ? "rgba(236,34,38,0.2)" : "rgba(255,255,255,0.05)",
                        border: selectedFloor.name === floor.name ? "1px solid #ec2226" : "1px solid rgba(255,255,255,0.08)",
                        color: "#ffffff",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {floor.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div>
              <button
                onClick={onOpenConsultation}
                className="btn-luxury-red"
                style={{ width: "100%", padding: "14px", fontSize: "14px" }}
              >
                <Sparkles size={16} />
                <span>Recreate This In Your Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
