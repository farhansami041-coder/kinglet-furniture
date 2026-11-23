import React, { useState } from "react";
import { X, Sparkles, Check, ArrowRight, RotateCcw, ShoppingBag, PhoneCall } from "lucide-react";
import { PRODUCTS } from "../../data/kingletData";

const ROOM_OPTIONS = [
  { id: "bedroom", label: "Master Bedroom Sanctuary", icon: "🛏️", desc: "Solid mahogany bed suites, wardrobes & dressing consoles" },
  { id: "living", label: "Executive Living Sanctuary", icon: "🛋️", desc: "Hand-tailored sectionals, statement coffee tables & media credenzas" },
  { id: "dining", label: "Royal Banquet Dining", icon: "🍽️", desc: "Heirloom dining tables with 6-8 ergonomic dining chairs" },
  { id: "office", label: "Executive Study & Library", icon: "🏛️", desc: "Distinguished timber desks, ergonomic leather chairs & book cabinetry" },
];

const SIZE_OPTIONS = [
  { id: "compact", label: "Compact Suite (12 x 14 ft)", desc: "Ideal for modern Dhaka apartments needing smart space utilization" },
  { id: "standard", label: "Standard Sanctuary (16 x 18 ft)", desc: "Balanced proportions with full circulation and statement pieces" },
  { id: "grand", label: "Grand Penthouse / Duplex (22 x 26+ ft)", desc: "Expansive layouts requiring large-scale presence and bespoke symmetry" },
];

const VIBE_OPTIONS = [
  { id: "classic", label: "Heritage Seasoned Mahogany & Black Plum Wood", tone: "Hand-rubbed Dark Walnut PU", desc: "Timeless warmth, exposed wood grains, and traditional prestige" },
  { id: "contemporary", label: "Modern Minimalist Scandinavian", tone: "Warm Honey Mahogany Polish", desc: "Clean lines, slim silhouettes, and organic lightness" },
  { id: "monochrome", label: "Smoked Ebony & Champagne Brass", tone: "Smoked Obsidian Matte", desc: "Dramatic, ultra-modern luxury with dark architectural undertones" },
];

const BUDGET_OPTIONS = [
  { id: "tier1", label: "৳ 1,50,000 – ৳ 3,00,000", range: "Tier 1 Foundation Suite" },
  { id: "tier2", label: "৳ 3,00,000 – ৳ 6,00,000", range: "Tier 2 Signature Artisan Suite" },
  { id: "tier3", label: "৳ 6,00,000 – ৳ 12,00,000", range: "Tier 3 Grand Master Collection" },
  { id: "tier4", label: "৳ 12,00,000+", range: "Bespoke Full Turnkey Interior Architecture" },
];

export default function KingletAiStylistModal({ isOpen, onClose, onAddToCart, onOpenConsultation, _currency }) {
  const [step, setStep] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState("bedroom");
  const [selectedSize, setSelectedSize] = useState("standard");
  const [selectedVibe, setSelectedVibe] = useState("classic");
  const [selectedBudget, setSelectedBudget] = useState("tier2");
  const [isGenerating, setIsGenerating] = useState(false);
  const [curatedResult, setCuratedResult] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // Pick matching pieces based on room
      let matchedProducts = [];
      if (selectedRoom === "bedroom") {
        matchedProducts = PRODUCTS.filter((p) => p.category === "beds" || p.category === "dressers" || p.id === 118 || p.id === 121);
      } else if (selectedRoom === "living") {
        matchedProducts = PRODUCTS.filter((p) => p.category === "living" || p.category === "tables");
      } else if (selectedRoom === "dining") {
        matchedProducts = PRODUCTS.filter((p) => p.category === "dining");
      } else {
        matchedProducts = PRODUCTS.filter((p) => p.category === "office" || p.category === "tables");
      }

      if (matchedProducts.length === 0) matchedProducts = PRODUCTS.slice(0, 3);
      const suiteItems = matchedProducts.slice(0, 3);
      const totalPriceBDT = suiteItems.reduce((acc, item) => acc + item.priceBDT, 0);
      const discountedPriceBDT = Math.round(totalPriceBDT * 0.9); // 10% bundle saving

      setCuratedResult({
        title: `The ${selectedRoom === "bedroom" ? "Royal Sanctuary" : selectedRoom === "living" ? "Atelier Lounge" : selectedRoom === "dining" ? "Banquet Sovereign" : "Executive Sovereign"} Collection`,
        room: ROOM_OPTIONS.find((r) => r.id === selectedRoom)?.label,
        size: SIZE_OPTIONS.find((s) => s.id === selectedSize)?.label,
        vibe: VIBE_OPTIONS.find((v) => v.id === selectedVibe)?.label,
        tone: VIBE_OPTIONS.find((v) => v.id === selectedVibe)?.tone,
        items: suiteItems,
        totalPriceBDT,
        discountedPriceBDT,
        timberNotes: "100% Solid Seasoned Mahogany timber seasoned in 21-day automated kiln chamber, hand-finished with Italian 4-coat PU lacquer.",
      });
      setIsGenerating(false);
      setStep(5); // Result screen
    }, 750);
  };

  const handleReset = () => {
    setCuratedResult(null);
    setStep(1);
  };

  const handleAddBundleToCart = () => {
    if (curatedResult && curatedResult.items) {
      curatedResult.items.forEach((item) => {
        onAddToCart(item);
      });
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2600,
        background: "rgba(10, 12, 16, 0.85)",
        backdropFilter: "blur(12px)",
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
          maxWidth: "880px",
          background: "#141720",
          border: "1px solid rgba(212, 175, 55, 0.4)",
          borderRadius: "24px",
          padding: "36px",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.85)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9da3ae",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.borderColor = "#ec2226";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#9da3ae";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#ec2226", fontSize: "13px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
            <Sparkles size={15} />
            <span>AI Space Curator & Stylist</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "30px", color: "#ffffff", fontWeight: "800", margin: "0 0 8px 0" }}>
            Tailor Your Dream Interior Suite
          </h2>
          <p style={{ color: "#9da3ae", fontSize: "14px", margin: 0 }}>
            Answer 4 quick design questions and let Kinglet AI curate the optimal solid timber furniture suite with bespoke dimension harmony.
          </p>
        </div>

        {/* Step Indicator (Steps 1 to 4) */}
        {step < 5 && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: "4px",
                  borderRadius: "2px",
                  background: step >= s ? "linear-gradient(90deg, #ec2226 0%, #ec2226 100%)" : "rgba(255, 255, 255, 0.1)",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        )}

        {/* Step 1: Room Sanctuary Selection */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: "18px", color: "#ffffff", marginBottom: "16px", fontWeight: "600" }}>
              Step 1 of 4: Which sanctuary space are you curating?
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "32px" }}>
              {ROOM_OPTIONS.map((room) => {
                const isSelected = selectedRoom === room.id;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    style={{
                      background: isSelected ? "rgba(212, 175, 55, 0.1)" : "rgba(255, 255, 255, 0.03)",
                      border: isSelected ? "1.5px solid #ec2226" : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "16px",
                      padding: "20px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: "30px", marginBottom: "12px" }}>{room.icon}</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: isSelected ? "#ec2226" : "#ffffff", marginBottom: "6px" }}>
                      {room.label}
                    </div>
                    <div style={{ fontSize: "12px", color: "#9da3ae", lineHeight: "1.4" }}>
                      {room.desc}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setStep(2)} className="btn-luxury-red" style={{ padding: "12px 28px", fontSize: "14px" }}>
                <span>Next: Room Dimensions</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Dimensions */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: "18px", color: "#ffffff", marginBottom: "16px", fontWeight: "600" }}>
              Step 2 of 4: What is the scale of your room?
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
              {SIZE_OPTIONS.map((size) => {
                const isSelected = selectedSize === size.id;
                return (
                  <div
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    style={{
                      background: isSelected ? "rgba(212, 175, 55, 0.1)" : "rgba(255, 255, 255, 0.03)",
                      border: isSelected ? "1.5px solid #ec2226" : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "16px",
                      padding: "20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.2s",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: isSelected ? "#ec2226" : "#ffffff", marginBottom: "4px" }}>
                        {size.label}
                      </div>
                      <div style={{ fontSize: "13px", color: "#9da3ae" }}>{size.desc}</div>
                    </div>
                    {isSelected && <Check size={20} color="#ec2226" />}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(1)} style={{ background: "transparent", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "10px", color: "#ffffff", padding: "10px 20px", cursor: "pointer" }}>
                Back
              </button>
              <button onClick={() => setStep(3)} className="btn-luxury-red" style={{ padding: "12px 28px", fontSize: "14px" }}>
                <span>Next: Aesthetic Vibe</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Aesthetic Vibe */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: "18px", color: "#ffffff", marginBottom: "16px", fontWeight: "600" }}>
              Step 3 of 4: Which timber finish & aesthetic resonates with you?
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
              {VIBE_OPTIONS.map((vibe) => {
                const isSelected = selectedVibe === vibe.id;
                return (
                  <div
                    key={vibe.id}
                    onClick={() => setSelectedVibe(vibe.id)}
                    style={{
                      background: isSelected ? "rgba(212, 175, 55, 0.1)" : "rgba(255, 255, 255, 0.03)",
                      border: isSelected ? "1.5px solid #ec2226" : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "16px",
                      padding: "20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.2s",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: isSelected ? "#ec2226" : "#ffffff", marginBottom: "4px" }}>
                        {vibe.label}
                      </div>
                      <div style={{ fontSize: "13px", color: "#ec2226", marginBottom: "2px" }}>
                        Polish: {vibe.tone}
                      </div>
                      <div style={{ fontSize: "12px", color: "#9da3ae" }}>{vibe.desc}</div>
                    </div>
                    {isSelected && <Check size={20} color="#ec2226" />}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(2)} style={{ background: "transparent", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "10px", color: "#ffffff", padding: "10px 20px", cursor: "pointer" }}>
                Back
              </button>
              <button onClick={() => setStep(4)} className="btn-luxury-red" style={{ padding: "12px 28px", fontSize: "14px" }}>
                <span>Next: Budget Range</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Budget Range */}
        {step === 4 && (
          <div>
            <h3 style={{ fontSize: "18px", color: "#ffffff", marginBottom: "16px", fontWeight: "600" }}>
              Step 4 of 4: What is your estimated investment budget?
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "32px" }}>
              {BUDGET_OPTIONS.map((b) => {
                const isSelected = selectedBudget === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBudget(b.id)}
                    style={{
                      background: isSelected ? "rgba(212, 175, 55, 0.1)" : "rgba(255, 255, 255, 0.03)",
                      border: isSelected ? "1.5px solid #ec2226" : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "16px",
                      padding: "20px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: "16px", fontWeight: "700", color: isSelected ? "#ec2226" : "#ffffff", marginBottom: "6px" }}>
                      {b.label}
                    </div>
                    <div style={{ fontSize: "12px", color: "#9da3ae" }}>{b.range}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(3)} style={{ background: "transparent", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "10px", color: "#ffffff", padding: "10px 20px", cursor: "pointer" }}>
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-luxury-red"
                style={{ padding: "12px 32px", fontSize: "15px" }}
              >
                <Sparkles size={16} />
                <span>{isGenerating ? "Analyzing Dimensions & Styling..." : "Curate My Space Suite"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Curated Result Showcase */}
        {step === 5 && curatedResult && (
          <div>
            <div style={{ background: "linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(236, 34, 38, 0.08) 100%)", border: "1px solid rgba(212, 175, 55, 0.35)", borderRadius: "20px", padding: "24px", marginBottom: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#ec2226", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
                    AI Curated Suite Specification
                  </span>
                  <h3 style={{ fontSize: "24px", color: "#ffffff", margin: "4px 0 0 0", fontFamily: "var(--font-heading)", fontWeight: "800" }}>
                    {curatedResult.title}
                  </h3>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "#9da3ae" }}>Curated Suite Bundle:</div>
                  <div style={{ fontSize: "22px", color: "#ec2226", fontWeight: "800", marginTop: "2px" }}>
                    ৳ {curatedResult.discountedPriceBDT.toLocaleString()}{" "}
                    <span style={{ fontSize: "14px", color: "#9da3ae", textDecoration: "line-through", fontWeight: "400" }}>
                      ৳ {curatedResult.totalPriceBDT.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#34d399", fontWeight: "600" }}>Includes 10% Kinglet Suite Incentive</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", fontSize: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "14px" }}>
                <div>
                  <span style={{ color: "#9da3ae" }}>Sanctuary:</span> <strong style={{ color: "#ffffff" }}>{curatedResult.room}</strong>
                </div>
                <div>
                  <span style={{ color: "#9da3ae" }}>Dimensions:</span> <strong style={{ color: "#ffffff" }}>{curatedResult.size}</strong>
                </div>
                <div>
                  <span style={{ color: "#9da3ae" }}>Finish Polish:</span> <strong style={{ color: "#ec2226" }}>{curatedResult.tone}</strong>
                </div>
              </div>
            </div>

            {/* Pieces Grid */}
            <h4 style={{ fontSize: "16px", color: "#ffffff", marginBottom: "14px", fontWeight: "600" }}>
              Included Artisan Furniture Pieces:
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
              {curatedResult.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    width="260"
                    height="140"
                    loading="lazy"
                    style={{ width: "100%", height: "140px", objectFit: "cover" }}
                  />
                  <div style={{ padding: "14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff", marginBottom: "4px" }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#ec2226", marginBottom: "8px" }}>
                        {item.woodType}
                      </div>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>
                      ৳ {item.priceBDT.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
              <button
                onClick={handleReset}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "10px",
                  color: "#9da3ae",
                  padding: "10px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={15} />
                <span>Re-Style Space</span>
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    onClose();
                    onOpenConsultation();
                  }}
                  className="btn-luxury-red"
                  style={{ padding: "12px 20px", fontSize: "14px" }}
                >
                  <PhoneCall size={16} />
                  <span>Book 3D Room Planning</span>
                </button>

                <button
                  onClick={handleAddBundleToCart}
                  className="btn-luxury-red"
                  style={{ padding: "12px 24px", fontSize: "14px" }}
                >
                  <ShoppingBag size={16} />
                  <span>Add Entire Suite to Cart</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
