import React from "react";
import { ShieldCheck, Truck, Wrench, CreditCard } from "lucide-react";

export default function KingletTrustStrip({ onOpenEmi, _onOpenShowrooms }) {
  const TRUST_ITEMS = [
    {
      icon: <ShieldCheck size={24} color="#ec2226" strokeWidth={2.2} />,
      title: "10-15 Yrs Timber Guarantee",
      desc: "Seasoned vacuum kiln-dried Seasoned Mahogany & Mahogany",
    },
    {
      icon: <Wrench size={24} color="#ec2226" strokeWidth={2.2} />,
      title: "Free In-Home Carpenter Setup",
      desc: "Delivered & assembled by master technicians with zero extra fees",
    },
    {
      icon: <CreditCard size={24} color="#ec2226" strokeWidth={2.2} />,
      title: "0% Interest Credit Card EMI",
      desc: "Up to 36 months installment with 18+ Bangladeshi partner banks",
      onClick: onOpenEmi,
      clickable: true,
    },
    {
      icon: <Truck size={24} color="#ec2226" strokeWidth={2.2} />,
      title: "48-Hour Express Dhaka Delivery",
      desc: "Safe shock-absorbent packaging across all 64 districts of Bangladesh",
    },
  ];

  return (
    <div
      style={{
        background: "#ffffff",
        borderTop: "1px solid #f1f5f9",
        borderBottom: "1px solid #f1f5f9",
        padding: "24px 0",
      }}
    >
      <div className="container" style={{ maxWidth: "1400px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {TRUST_ITEMS.map((item, idx) => (
            <div
              key={idx}
              onClick={item.onClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: item.clickable ? "#fafafa" : "transparent",
                border: item.clickable ? "1px solid #f1f5f9" : "none",
                cursor: item.clickable ? "pointer" : "default",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (item.clickable) {
                  e.currentTarget.style.background = "#fff5f5";
                  e.currentTarget.style.borderColor = "#fecaca";
                }
              }}
              onMouseLeave={(e) => {
                if (item.clickable) {
                  e.currentTarget.style.background = "#fafafa";
                  e.currentTarget.style.borderColor = "#f1f5f9";
                }
              }}
            >
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "10px",
                  background: "#fff5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: "800", color: "#0f172a", marginBottom: "2px" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "11.5px", color: "#64748b", lineHeight: "1.35" }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
