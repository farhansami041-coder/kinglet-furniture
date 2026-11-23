import React, { useState } from "react";
import { X, Search, CheckCircle2, Phone, MessageCircle, Sparkles, AlertCircle } from "lucide-react";
import { BRAND_INFO } from "../../data/kingletData";

const SAMPLE_ORDERS = {
  "KGL-829104": {
    id: "KGL-829104",
    customer: "Engr. Mahfuzur Rahman",
    location: "Banani DOHS, Dhaka",
    product: "Grain Craft Seasoned Mahogany Bed Suite (King Size)",
    polish: "Hand-Rubbed Dark Walnut Italian PU",
    orderedDate: "Oct 02, 2026",
    estimatedDelivery: "Oct 20, 2026",
    currentStage: 3,
    leadArtisan: "Master Ustad Rafiqul Islam (24 yrs exp)",
    stages: [
      {
        title: "Seasoned Mahogany Log Selection & Seasoning",
        desc: "Logs inspected for high grain density, moisture reduced to 11.4% in 21-day automated kiln chamber.",
        date: "Oct 04, 2026",
        completed: true,
      },
      {
        title: "Master Carpentry & Mortise-Tenon Joinery",
        desc: "Hand-chiselled interlocking joints crafted without structural nails for 50-year heirloom longevity.",
        date: "Oct 09, 2026",
        completed: true,
      },
      {
        title: "Italian Polyurethane 4-Layer Lacquer Finishing",
        desc: "Currently in dust-free spray booth: micro-sanded 600-grit, prime-coated, and sealed with matte finish.",
        date: "Oct 14, 2026 (In Progress)",
        completed: false,
        active: true,
      },
      {
        title: "36-Point Quality Assurance & 10-Yr Warranty Stamping",
        desc: "Laser-checked structural alignment, zero-wobble test, and official Kinglet brass badge installation.",
        date: "Est. Oct 17, 2026",
        completed: false,
      },
      {
        title: "White-Glove In-Home Delivery & Installation",
        desc: "Direct transit from Mirpur workshop via Kinglet dedicated cushioned freight crew.",
        date: "Est. Oct 20, 2026",
        completed: false,
      },
    ],
  },
  "KGL-914022": {
    id: "KGL-914022",
    customer: "Dr. Nusrat Jahan",
    location: "Bashundhara R/A, Block C",
    product: "Forestique L-Shaped Sectional Sofa & Grand Atelier Dining Set",
    polish: "Warm Honey Mahogany Polish + Belgian Forest Linen",
    orderedDate: "Sep 25, 2026",
    estimatedDelivery: "Oct 16, 2026",
    currentStage: 4,
    leadArtisan: "Master Ustad Kamal Hossain (19 yrs exp)",
    stages: [
      { title: "Seasoned Mahogany Log Selection & Seasoning", desc: "Moisture extracted to 10.8% and timber treated for anti-borer protection.", date: "Sep 27, 2026", completed: true },
      { title: "Seasoned Mahogany Frame & High-Resilience Webbing", desc: "Inner framework fortified with solid mahogany dowels and 40-density foam padding.", date: "Oct 03, 2026", completed: true },
      { title: "Precision Upholstery & Fabric Tailoring", desc: "Belgian water-repellent fabric hand-sewn with double French seam stitching.", date: "Oct 08, 2026", completed: true },
      { title: "Final Inspection & 10-Yr Warranty Stamping", desc: "Passed structural load test and anti-borer certification.", date: "Oct 13, 2026", completed: true, active: true },
      { title: "Dispatched for White-Glove Installation", desc: "En route to Bashundhara R/A with professional assembly technicians.", date: "Est. Oct 16, 2026", completed: false },
    ],
  },
  "KGL-773190": {
    id: "KGL-773190",
    customer: "Tanvir Ahmed (MD, Nexis Corp)",
    location: "Gulshan 2, Dhaka",
    product: "Turnkey 4,500 sq.ft Luxury Penthouse Interior Architecture",
    polish: "Custom Smoked Mahogany Veneer & Statuario Quartz Wall Panels",
    orderedDate: "Sep 10, 2026",
    estimatedDelivery: "Nov 05, 2026",
    currentStage: 2,
    leadArtisan: "Lead Architect: Ar. Sazzad Hossain",
    stages: [
      { title: "3D Laser Survey & Architectural Blueprint Approval", desc: "Virtual walkthrough finalized and material specification signed.", date: "Sep 15, 2026", completed: true },
      { title: "Civil, False Ceiling & Concealed Ambient Lighting", desc: "Gypsum ceiling framing and smart dimming circuits currently in progress on site.", date: "Oct 12, 2026 (Active)", completed: false, active: true },
      { title: "Custom Mahogany Cabinetry & Wall Paneling Fabrication", desc: "In production at Mirpur manufacturing center with precision CNC detailing.", date: "Est. Oct 24, 2026", completed: false },
      { title: "Marble Inlays, Italian PU Finishing & Fixtures", desc: "Polishing and luxury hardware installation by specialist technicians.", date: "Est. Nov 01, 2026", completed: false },
      { title: "Architectural Handover & Deep Cleaning", desc: "Final turnkey reveal with 10-year comprehensive interior warranty documentation.", date: "Est. Nov 05, 2026", completed: false },
    ],
  },
};

export default function KingletOrderTrackerModal({ isOpen, onClose }) {
  const [searchInput, setSearchInput] = useState("KGL-829104");
  const [activeOrder, setActiveOrder] = useState(SAMPLE_ORDERS["KGL-829104"]);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchInput.trim().toUpperCase();
    if (SAMPLE_ORDERS[query]) {
      setActiveOrder(SAMPLE_ORDERS[query]);
      setErrorMsg("");
    } else {
      setErrorMsg(`Order ID "${query}" not found in instant live sync. Try sample IDs below or WhatsApp concierge.`);
    }
  };

  const selectSample = (id) => {
    setSearchInput(id);
    setActiveOrder(SAMPLE_ORDERS[id]);
    setErrorMsg("");
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
          maxWidth: "850px",
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

        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#ec2226", fontSize: "13px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
            <Sparkles size={15} />
            <span>Artisan Production & Delivery Tracking</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "28px", color: "#ffffff", fontWeight: "800", margin: "0 0 8px 0" }}>
            Track Your Kinglet Bespoke Order
          </h2>
          <p style={{ color: "#9da3ae", fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
            Follow your seasoned mahogany and oak veneer piece through seasoning, mortise & tenon joinery, Italian PU finishing, and white-glove Dhaka delivery.
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={18} color="#9da3ae" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              id="modal-order-tracking-input"
              name="trackingCode"
              type="text"
              placeholder="Enter Order Tracking ID (e.g. KGL-829104)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(212, 175, 55, 0.3)",
                borderRadius: "12px",
                padding: "14px 16px 14px 48px",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none",
                fontWeight: "600",
                letterSpacing: "0.5px",
              }}
            />
          </div>
          <button
            type="submit"
            className="btn-luxury-red"
            style={{ padding: "0 24px", fontSize: "14px", whiteSpace: "nowrap" }}
          >
            Track Status
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
          <span style={{ fontSize: "12px", color: "#9da3ae" }}>Quick demo orders:</span>
          {Object.keys(SAMPLE_ORDERS).map((id) => (
            <button
              key={id}
              onClick={() => selectSample(id)}
              style={{
                background: activeOrder && activeOrder.id === id ? "rgba(212, 175, 55, 0.15)" : "rgba(255, 255, 255, 0.04)",
                border: activeOrder && activeOrder.id === id ? "1px solid #ec2226" : "1px solid rgba(255, 255, 255, 0.1)",
                color: activeOrder && activeOrder.id === id ? "#ec2226" : "#9da3ae",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {id}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div style={{ background: "rgba(236, 34, 38, 0.1)", border: "1px solid rgba(236, 34, 38, 0.3)", borderRadius: "10px", padding: "12px 16px", color: "#fca5a5", fontSize: "13px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <AlertCircle size={18} color="#ec2226" />
            <span>{errorMsg}</span>
          </div>
        )}

        {activeOrder && (
          <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "24px", marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#9da3ae", textTransform: "uppercase", letterSpacing: "0.5px" }}>Bespoke Order</span>
                <h3 style={{ fontSize: "20px", color: "#ffffff", margin: "4px 0 0 0", fontWeight: "700" }}>
                  {activeOrder.id}
                </h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "12px", color: "#9da3ae" }}>Estimated In-Home Delivery</span>
                <div style={{ fontSize: "16px", color: "#ec2226", fontWeight: "700", marginTop: "2px" }}>
                  {activeOrder.estimatedDelivery}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", fontSize: "13px" }}>
              <div>
                <div style={{ color: "#9da3ae", marginBottom: "2px" }}>Client / Destination:</div>
                <div style={{ color: "#ffffff", fontWeight: "600" }}>{activeOrder.customer}</div>
                <div style={{ color: "#9da3ae", fontSize: "12px" }}>{activeOrder.location}</div>
              </div>
              <div>
                <div style={{ color: "#9da3ae", marginBottom: "2px" }}>Commissioned Piece:</div>
                <div style={{ color: "#ffffff", fontWeight: "600" }}>{activeOrder.product}</div>
                <div style={{ color: "#ec2226", fontSize: "12px" }}>{activeOrder.polish}</div>
              </div>
              <div>
                <div style={{ color: "#9da3ae", marginBottom: "2px" }}>Artisan Supervisor:</div>
                <div style={{ color: "#ffffff", fontWeight: "600" }}>{activeOrder.leadArtisan}</div>
                <div style={{ color: "#34d399", fontSize: "12px" }}>Mirpur Master Workshop</div>
              </div>
            </div>
          </div>
        )}

        {activeOrder && (
          <div style={{ position: "relative", paddingLeft: "24px", borderLeft: "2px solid rgba(212, 175, 55, 0.25)", display: "flex", flexDirection: "column", gap: "28px", marginBottom: "32px" }}>
            {activeOrder.stages.map((stage, idx) => (
              <div key={idx} style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "-34px",
                    top: "2px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: stage.completed
                      ? "#ec2226"
                      : stage.active
                      ? "#ec2226"
                      : "#1e2430",
                    border: stage.active ? "3px solid #ec2226" : "2px solid rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: stage.active ? "0 0 12px rgba(236, 34, 38, 0.8)" : "none",
                  }}
                >
                  {stage.completed && <CheckCircle2 size={12} color="#121418" />}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "15px", color: stage.completed ? "#ffffff" : stage.active ? "#f87171" : "#9da3ae", fontWeight: "700" }}>
                    {stage.title}
                  </h4>
                  <span style={{ fontSize: "12px", color: stage.active ? "#ec2226" : "#9da3ae", fontWeight: "600" }}>
                    {stage.date}
                  </span>
                </div>
                <p style={{ margin: "6px 0 0 0", color: stage.completed || stage.active ? "#cbd5e1" : "#64748b", fontSize: "13px", lineHeight: "1.5" }}>
                  {stage.desc}
                </p>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(236,34,38,0.08) 100%)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "16px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ color: "#ffffff", fontWeight: "700", fontSize: "14px", marginBottom: "2px" }}>
              Have questions regarding your finish, polish, or delivery schedule?
            </div>
            <div style={{ color: "#9da3ae", fontSize: "12px" }}>
              Our workshop liaison is available via direct WhatsApp or phone.
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <a
              href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent("Hello Kinglet Workshop, I am inquiring regarding bespoke order ID " + (activeOrder ? activeOrder.id : ""))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-luxury-red"
              style={{ padding: "8px 18px", fontSize: "13px", textDecoration: "none" }}
            >
              <MessageCircle size={15} />
              <span>WhatsApp Workshop</span>
            </a>
            <a
              href={`tel:${BRAND_INFO.hotlinePrimary}`}
              className="btn-luxury-red"
              style={{ padding: "8px 18px", fontSize: "13px", textDecoration: "none" }}
            >
              <Phone size={15} />
              <span>Call Hotline</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
