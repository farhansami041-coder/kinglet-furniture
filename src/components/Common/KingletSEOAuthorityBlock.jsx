import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ShieldCheck, Award, Truck, Wrench, Sparkles, HelpCircle } from "lucide-react";

export default function KingletSEOAuthorityBlock() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const priceGuides = [
    { category: "Solid Mahogany & Oak Bedroom Sets", priceRange: "৳ 42,000 – ৳ 145,000", popularity: "High (Top Seller)" },
    { category: "Luxury L-Shaped & Sectional Sofas", priceRange: "৳ 38,000 – ৳ 98,000", popularity: "Trending" },
    { category: "Solid Mahogany & Black Plum Dining Sets (6 & 8 Seater)", priceRange: "৳ 45,000 – ৳ 125,000", popularity: "High" },
    { category: "Master Almirahs & Wardrobes (2 Part, 3 Part, 4 Part)", priceRange: "৳ 55,000 – ৳ 110,000", popularity: "Very High" },
    { category: "Executive Office Desks & Ergonomic Chairs", priceRange: "৳ 18,500 – ৳ 65,000", popularity: "Corporate Choice" },
    { category: "Carved Solid Wood & Veneer Entrance Doors", priceRange: "৳ 22,000 – ৳ 58,000", popularity: "Standard" },
  ];

  const seoFaqs = [
    {
      q: "What materials does Kinglet Bangladesh Ltd use?",
      a: "Kinglet Bangladesh Ltd uses 100% genuine kiln-seasoned Mahogany, Black Plum Wood (কালো জাম কাঠ), Engineering Processed Wood, Canadian Oak Veneer, and German Oak Veneer Wood. Unlike standard commercial timber, every Kinglet plank undergoes automated vacuum-pressure chemical treatment and industrial kiln drying to reduce moisture content strictly below 10%. Finished with 5-stage Italian PU automated booth lacquer, Kinglet furniture lasts over 50+ years and comes with an official 10-Year Timber Replacement Guarantee against termite and fungal decay."
    },
    {
      q: "How does Kinglet compare with other furniture brands in Bangladesh?",
      a: "Kinglet specializes in solid seasoned Mahogany, Black Plum Wood, and authentic Canadian & German Oak Veneers combined with European modern ergonomics. Kinglet provides lifetime durability, authentic timber value, free in-home carpenter assembly, and 0% EMI across 18+ Bangladeshi commercial banks."
    },
    {
      q: "What is the delivery timeline and packaging across all 64 districts in Bangladesh?",
      a: "Inside Dhaka City (Mirpur, Uttara, Gulshan, Banani, Dhanmondi, Bashundhara, Mohammadpur), Kinglet delivers within 24 to 48 hours via its specialized white-glove padded van fleet with free carpenter assembly. For outside Dhaka (Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, Comilla), orders are shipped in shockproof reinforced wooden crates within 3 to 5 business days."
    },
    {
      q: "Does Kinglet provide 0% interest EMI installment facilities?",
      a: "Yes. Kinglet Bangladesh Ltd offers 3, 6, 9, and 12-month 0% interest EMI options on credit cards from City Bank Amex, BRAC Bank, Eastern Bank (EBL), Standard Chartered, Dutch-Bangla Bank (DBBL), Prime Bank, and 12 other partner financial institutions."
    },
    {
      q: "How do I track my custom furniture order live online?",
      a: "Every order placed with Kinglet receives a Unique Product Tracking Code (e.g. KL-TRK-XXXXXX). You can enter this code into the Kinglet Live Tracker on our website or view it in your Kinglet Customer Account to monitor lumber vacuum seasoning, master carpentry carving, Italian PU spray lacquering, and van dispatch in real time."
    }
  ];

  return (
    <section
      aria-label="Kinglet Furniture Authority Guide & Price Index Bangladesh"
      style={{
        background: "#ffffff",
        borderTop: "1px solid #e2e8f0",
        padding: "50px 0 35px",
        color: "#334155",
      }}
    >
      <div className="container" style={{ maxWidth: "1280px" }}>
        
        {/* Top SEO Header */}
        <div style={{ marginBottom: "32px", textAlign: "left" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fee2e2", color: "#dc2626", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
            <Award size={13} />
            <span>BANGLADESH FURNITURE BUYERS & PRICING GUIDE 2026</span>
          </div>
          
          <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#0f172a", margin: "0 0 10px", lineHeight: "1.3" }}>
            Buy Luxury Furniture in Bangladesh — Kinglet Bangladesh Ltd
          </h2>
          
          <p style={{ color: "#64748b", fontSize: "13.5px", lineHeight: "1.7", margin: "0 0 14px", maxWidth: "1100px" }}>
            Welcome to <strong>Kinglet Bangladesh Ltd</strong>, the country's foremost manufacturer of handcrafted Mahogany, Black Plum Wood, Engineering Processed Wood, Canadian Oak Veneer, and German Oak Veneer bedroom suites, luxury living room sofas, dining tables, 2-part, 3-part &amp; 4-part almirahs, and turnkey residential interior solutions. Established with a commitment to generational craftsmanship and Scandinavian minimalism, Kinglet bridges the gap between traditional Bangladeshi heritage woodcraft and contemporary international architecture.
          </p>
        </div>

        {/* 3 Pillars of Quality Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px", marginBottom: "36px" }}>
          <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0f172a", fontWeight: "800", fontSize: "14px", marginBottom: "8px" }}>
              <ShieldCheck size={20} color="#ec2226" />
              <span>100% Kiln-Dried Seasoned Timber</span>
            </div>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: "1.6" }}>
              Harvested from certified sustainable forestry. Chemically treated in automated vacuum chambers and moisture-metered below 10% to prevent warping, cracking, and termite damage.
            </p>
          </div>

          <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0f172a", fontWeight: "800", fontSize: "14px", marginBottom: "8px" }}>
              <Sparkles size={20} color="#ec2226" />
              <span>5-Stage Italian PU Lacquer</span>
            </div>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: "1.6" }}>
              Automated dust-free spray booth finishing using imported Italian polyurethane lacquers. Delivers unmatched UV reflection, heat resistance, silky satin touch, and scratch resistance.
            </p>
          </div>

          <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#0f172a", fontWeight: "800", fontSize: "14px", marginBottom: "8px" }}>
              <Truck size={20} color="#ec2226" />
              <span>Nationwide Safe Delivery & Assembly</span>
            </div>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: "1.6" }}>
              White-glove dispatch team delivering to all 64 districts in Bangladesh. Professional carpenter installation is 100% complimentary in Dhaka city with every bedroom and dining suite.
            </p>
          </div>
        </div>

        {/* 2026 Price Index Table */}
        <div style={{ marginBottom: "36px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
            Kinglet Furniture Price Index in Bangladesh (Updated 2026)
          </h3>
          <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", background: "#ffffff", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", color: "#0f172a", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "12px 16px" }}>Furniture Category</th>
                  <th style={{ padding: "12px 16px" }}>Price Range (BDT)</th>
                  <th style={{ padding: "12px 16px" }}>Material & Grade</th>
                  <th style={{ padding: "12px 16px" }}>Popularity</th>
                </tr>
              </thead>
              <tbody>
                {priceGuides.map((guide, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < priceGuides.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0f172a" }}>{guide.category}</td>
                    <td style={{ padding: "12px 16px", color: "#ec2226", fontWeight: "800" }}>{guide.priceRange}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>Seasoned Mahogany / Black Plum Wood / Oak Veneer</td>
                    <td style={{ padding: "12px 16px", color: "#166534", fontWeight: "700" }}>{guide.popularity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Frequently Asked Questions (FAQPage Rich Results) */}
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "14px" }}>
            Frequently Asked Questions by Furniture Buyers in Bangladesh
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {seoFaqs.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? -1 : idx)}
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "13.5px",
                    fontWeight: "800",
                    color: openFaqIndex === idx ? "#ec2226" : "#0f172a",
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: openFaqIndex === idx ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>

                {openFaqIndex === idx && (
                  <div style={{ padding: "0 18px 16px", fontSize: "12.5px", color: "#475569", lineHeight: "1.65", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
