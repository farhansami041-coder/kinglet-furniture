import React, { useState } from "react";
import { Star, ChevronDown, ChevronUp, Quote, CheckCircle } from "lucide-react";
import { TESTIMONIALS, FAQS } from "../../data/kingletData";

export default function KingletReviews() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section style={{ padding: "90px 20px", background: "#0b0d11" }}>
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        {/* Testimonials Section */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "3px", color: "#ec2226", textTransform: "uppercase", marginBottom: "10px" }}>
            AUTHENTIC EXPERIENCES
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
            Trusted by 12,000+ Discerning Homes in Bangladesh
          </h2>
          <p style={{ color: "#9da3ae", maxWidth: "600px", margin: "0 auto", fontSize: "15px" }}>
            Read how homeowners and corporate executives across Dhaka describe the Kinglet craftsmanship experience.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "28px",
            marginBottom: "90px",
          }}
        >
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              style={{
                background: "#14171f",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "20px",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(236, 34, 38, 0.4)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div>
                {/* Stars and Quote Icon */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "2px", color: "#ec2226" }}>
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="#ec2226" strokeWidth={0} />
                    ))}
                  </div>
                  <Quote size={28} color="rgba(236, 34, 38, 0.3)" />
                </div>

                <p style={{ color: "#d1d5db", fontSize: "14px", lineHeight: "1.7", fontStyle: "italic", marginBottom: "24px" }}>
                  "{t.quote}"
                </p>
              </div>

              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <strong style={{ color: "#ffffff", fontSize: "15px" }}>{t.client}</strong>
                  <CheckCircle size={14} color="#ec2226" />
                </div>
                <div style={{ fontSize: "12px", color: "#ec2226", marginTop: "2px" }}>
                  {t.location} • {t.project}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Accordion Section */}
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "3px", color: "#ec2226", textTransform: "uppercase", marginBottom: "8px" }}>
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "32px",
                color: "#ffffff",
                fontWeight: "700",
              }}
            >
              Everything You Need To Know
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  style={{
                    background: "#141720",
                    border: isOpen ? "1px solid rgba(236, 34, 38, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    overflow: "hidden",
                    transition: "all 0.25s ease",
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    style={{
                      width: "100%",
                      padding: "18px 24px",
                      background: "transparent",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "16px",
                      fontWeight: "600",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} color="#ec2226" /> : <ChevronDown size={18} color="#9da3ae" />}
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: "0 24px 20px",
                        color: "#9da3ae",
                        fontSize: "14px",
                        lineHeight: "1.7",
                        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                        paddingTop: "14px",
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
