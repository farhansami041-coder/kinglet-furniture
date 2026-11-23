import React from "react";
import { ShieldCheck } from "lucide-react";
import KingletSEO from "../components/Common/KingletSEO";

export default function WarrantyCarePage() {
  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", padding: "40px 0 70px" }}>
      {/* Search Engine Optimization (SEO) Metadata */}
      <KingletSEO
        title="10-Year Timber Warranty & Wood Care Policy | Kinglet Bangladesh Ltd"
        description="Kinglet's 10-Year Timber Replacement Guarantee against termites, borer beetles, and decay. Care instructions for seasoned Mahogany, Black Plum Wood, and Oak Veneer furniture in Bangladesh climate."
        keywords="furniture warranty Bangladesh, 10 year timber guarantee, mahogany furniture care Dhaka, termite free furniture BD, Kinglet warranty terms"
        canonicalUrl="https://www.kingletbd.com/warranty-care"
      />

      <div className="container" style={{ maxWidth: "800px" }}>
        <h1 style={{ fontSize: "30px", fontWeight: "900", color: "#111827", margin: "0 0 10px", textAlign: "center" }}>
          Kinglet 10-Year Timber Warranty & Furniture Care
        </h1>
        <p style={{ color: "#6b7280", textAlign: "center", fontSize: "14px", margin: "0 0 35px" }}>
          Our lifelong commitment to solid craftsmanship, vacuum seasoning, and Italian PU finishing.
        </p>

        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "30px", marginBottom: "25px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#ec2226", margin: "0 0 14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={22} /> 10-Year Anti-Borer & Termite Guarantee
          </h2>
          <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: "1.7", margin: "0 0 14px" }}>
            All Seasoned Mahogany, Black Plum Wood, and Engineering Processed Wood furniture manufactured by Kinglet Bangladesh Ltd undergo rigorous chemical pressure treatment against wood-boring insects, powder-post beetles, and subterranean termites.
          </p>
          <ul style={{ fontSize: "13px", color: "#4b5563", lineHeight: "1.7", paddingLeft: "20px", margin: 0 }}>
            <li>Free component repair or plank replacement if infestation occurs within 10 years.</li>
            <li>1-Year Complimentary Master Carpenter Service Warranty for hinges, locks, and alignment.</li>
            <li>Lifetime timber authenticity guarantee — 100% genuine natural wood logs.</li>
          </ul>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "30px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#111827", margin: "0 0 14px" }}>
            Furniture Care for Bangladesh Climate
          </h2>
          <div className="warranty-care-grid" style={{ fontSize: "13px", color: "#4b5563" }}>
            <div>
              <h4 style={{ color: "#16a34a", margin: "0 0 6px", fontWeight: "700" }}>✓ Recommended Maintenance</h4>
              <ul style={{ paddingLeft: "16px", margin: 0, lineHeight: "1.6" }}>
                <li>Dust regularly with dry micro-fiber cloth.</li>
                <li>Use heat pads or trivets beneath hot cups.</li>
                <li>Keep 2 inches gap from exterior walls during monsoon.</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: "#dc2626", margin: "0 0 6px", fontWeight: "700" }}>✕ Things to Avoid</h4>
              <ul style={{ paddingLeft: "16px", margin: 0, lineHeight: "1.6" }}>
                <li>Do not clean with harsh chemical thinners.</li>
                <li>Avoid prolonged direct torrential rainwater contact.</li>
                <li>Do not drag heavy beds — lift to reposition.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
