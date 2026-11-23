import React, { useState } from "react";
import { Calculator, MessageCircle, Check } from "lucide-react";
import { BRAND_INFO } from "../../data/kingletData";

const SPACES = [
  { id: "living", name: "Living Room Sanctuary", baseBDT: 135000, desc: "Includes Sofa Suite, Center Table, TV Console & Shoe Cabinet" },
  { id: "master-bed", name: "Master Bedroom Suite", baseBDT: 155000, desc: "Includes King Bed, 4-Door Wardrobe, Dressing Table & 2 Bedside Tables" },
  { id: "dining-room", name: "Dining & Banquet Room", baseBDT: 120000, desc: "Includes 6/8 Seater Dining Table, Chairs & Amber Showcase" },
  { id: "full-flat-3bhk", name: "Complete 3BHK Flat", baseBDT: 480000, desc: "Full Master Bed, Guest Bed, Kids Bed, Living & Dining Furnishings" },
  { id: "duplex-villa", name: "Duplex Luxury Villa", baseBDT: 850000, desc: "Architectural seasoned mahogany furnishings across 2 floors" },
  { id: "corporate-office", name: "Executive Office Suite", baseBDT: 290000, desc: "Boardroom table, 8 meeting chairs, executive desk & credenza" },
];

const TIMBER_TIERS = [
  { id: "engineered", name: "Premium Natural Veneer", multiplier: 1.0, desc: "Quarter-cut natural oak veneer over seasoned marine core." },
  { id: "chittagong-mahogany", name: "Seasoned Mahogany & German Oak Veneer", multiplier: 1.35, desc: "100% solid seasoned Mahogany with 10-Year Warranty." },
  { id: "royal-handcarved", name: "Imperial Hand-Carved Mahogany", multiplier: 1.7, desc: "Hand-sculpted bespoke details and multi-tier Italian PU finish." },
];

const ADDONS = [
  { id: "modular-kitchen", name: "Modular Italian Acrylic Kitchen", priceBDT: 140000 },
  { id: "doors", name: "3x Architectural Seasoned Mahogany Doors", priceBDT: 85000 },
  { id: "ceiling", name: "Gypsum False Ceiling with Warm LED Spotlights", priceBDT: 65000 },
  { id: "marble-top", name: "Imported Italian Carrara Marble Top Upgrade", priceBDT: 40000 },
];

export default function KingletBudgetEstimator({ currency }) {
  const [selectedSpace, setSelectedSpace] = useState(SPACES[1]);
  const [selectedTier, setSelectedTier] = useState(TIMBER_TIERS[1]);
  const [selectedAddons, setSelectedAddons] = useState([ADDONS[0].id]);

  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const calculatedBase = Math.round(selectedSpace.baseBDT * selectedTier.multiplier);
  const addonsTotal = selectedAddons.reduce((sum, id) => {
    const item = ADDONS.find((a) => a.id === id);
    return sum + (item ? item.priceBDT : 0);
  }, 0);
  const grandTotalBDT = calculatedBase + addonsTotal;

  const displayTotal =
    currency === "USD"
      ? `$${Math.round(grandTotalBDT / 122).toLocaleString()}`
      : `৳${grandTotalBDT.toLocaleString()}`;

  const whatsappMessage = encodeURIComponent(
    `Hello Kinglet Furniture, I generated a custom estimate using your online calculator:\n\n• Space: ${selectedSpace.name}\n• Wood Tier: ${selectedTier.name}\n• Estimated Total: ${displayTotal}\n\nPlease connect me with an interior consultant to review my floor plan.`
  );

  return (
    <section id="budget-estimator" style={{ padding: "90px 20px", background: "#0e1117", position: "relative" }}>
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        {/* Header */}
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
            TRANSPARENT FACTORY PRICING
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
            Interactive Sanctuary Budget Estimator
          </h2>
          <p style={{ color: "#9da3ae", maxWidth: "600px", margin: "0 auto", fontSize: "15px" }}>
            Select your layout and preferred timber species to receive a real-time transparent estimate direct from our manufacturing facility.
          </p>
        </div>

        {/* Interactive Calculator Panel */}
        <div
          style={{
            background: "#161922",
            border: "1px solid rgba(212, 175, 55, 0.3)",
            borderRadius: "24px",
            padding: "40px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "40px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
          }}
        >
          {/* Left Column: Choices */}
          <div>
            {/* 1. Select Space */}
            <div style={{ marginBottom: "30px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff", display: "block", marginBottom: "12px" }}>
                1. Select Room / Layout:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {SPACES.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => setSelectedSpace(space)}
                    style={{
                      background: selectedSpace.id === space.id ? "rgba(236,34,38,0.15)" : "rgba(255,255,255,0.04)",
                      border: selectedSpace.id === space.id ? "1px solid #ec2226" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      padding: "12px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: "700", color: selectedSpace.id === space.id ? "#fca5a5" : "#ffffff", marginBottom: "3px" }}>
                      {space.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#9da3ae", lineHeight: "1.3" }}>
                      {space.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Select Timber & Finish Tier */}
            <div style={{ marginBottom: "30px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff", display: "block", marginBottom: "12px" }}>
                2. Select Wood Species & Finish Grade:
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {TIMBER_TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    style={{
                      background: selectedTier.id === tier.id ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                      border: selectedTier.id === tier.id ? "1px solid #ec2226" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: selectedTier.id === tier.id ? "#ec2226" : "#ffffff" }}>
                        {tier.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#9da3ae" }}>
                        {tier.desc}
                      </div>
                    </div>
                    {selectedTier.id === tier.id && <Check size={18} color="#ec2226" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Optional Architectural Add-ons */}
            <div>
              <label style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff", display: "block", marginBottom: "12px" }}>
                3. Optional Architectural Add-ons:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {ADDONS.map((addon) => {
                  const isChecked = selectedAddons.includes(addon.id);
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      style={{
                        background: isChecked ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                        border: isChecked ? "1px solid rgba(212,175,55,0.5)" : "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "8px",
                        padding: "10px",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "4px",
                          border: isChecked ? "none" : "1px solid rgba(255,255,255,0.3)",
                          background: isChecked ? "#ec2226" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#121418",
                          flexShrink: 0,
                        }}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div style={{ fontSize: "12px", color: isChecked ? "#ffffff" : "#9da3ae", lineHeight: "1.2" }}>
                        {addon.name} (+৳{addon.priceBDT.toLocaleString()})
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Price Summary Card */}
          <div
            style={{
              background: "#101217",
              border: "1px solid rgba(212, 175, 55, 0.4)",
              borderRadius: "18px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ec2226", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>
                <Calculator size={16} />
                <span>REAL-TIME ESTIMATE SUMMARY</span>
              </div>

              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "14px", color: "#9da3ae", marginBottom: "4px" }}>Selected Space</div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff" }}>{selectedSpace.name}</div>
              </div>

              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "14px", color: "#9da3ae", marginBottom: "4px" }}>Timber Grade</div>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#ec2226" }}>{selectedTier.name}</div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>Base: ৳{calculatedBase.toLocaleString()}</div>
              </div>

              {selectedAddons.length > 0 && (
                <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "16px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "13px", color: "#9da3ae", marginBottom: "6px" }}>Selected Add-ons ({selectedAddons.length})</div>
                  <div style={{ fontSize: "12px", color: "#d1d5db" }}>+৳{addonsTotal.toLocaleString()} in custom architectural extensions</div>
                </div>
              )}

              {/* Grand Total */}
              <div style={{ marginTop: "24px", marginBottom: "24px" }}>
                <div style={{ fontSize: "13px", color: "#9da3ae", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Estimated Turnkey Investment
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "42px",
                    fontWeight: "800",
                    color: "#ffffff",
                    letterSpacing: "-0.5px",
                    marginTop: "4px",
                  }}
                >
                  {displayTotal}
                </div>
                <div style={{ fontSize: "12px", color: "#ffffff", marginTop: "4px" }}>
                  ✔ Includes 10-Year Anti-Borer Warranty & On-Site Installation inside Dhaka
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Quote Button */}
            <div>
              <a
                href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-luxury-red"
                style={{
                  width: "100%",
                  padding: "16px",
                  fontSize: "14px",
                  borderRadius: "10px",
                }}
              >
                <MessageCircle size={18} />
                <span>Send This Estimate to WhatsApp</span>
              </a>
              <div style={{ textAlign: "center", fontSize: "11px", color: "#6b7280", marginTop: "10px" }}>
                Zero obligation. Our senior architect will review your floor plan within 2 hours.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
