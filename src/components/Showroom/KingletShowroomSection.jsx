import React from "react";
import { MapPin, Phone, Clock, Navigation, ExternalLink } from "lucide-react";
import { BRAND_INFO } from "../../data/kingletData";

export default function KingletShowroomSection() {
  return (
    <section id="showroom" style={{ padding: "100px 20px", background: "#0e1117", position: "relative" }}>
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #161a22 0%, #101319 100%)",
            border: "1px solid rgba(236, 34, 38, 0.3)",
            borderRadius: "24px",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7)",
          }}
        >
          {/* Left: Showroom Details & Invitation */}
          <div style={{ padding: "50px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "3px", color: "#ec2226", textTransform: "uppercase", marginBottom: "10px" }}>
                EXPERIENCE IN PERSON
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(28px, 4vw, 40px)",
                  color: "#ffffff",
                  fontWeight: "700",
                  marginBottom: "16px",
                  lineHeight: "1.2",
                }}
              >
                Visit Our 15,000 sq.ft Dhaka Flagship Sales Center
              </h2>
              <p style={{ color: "#9da3ae", fontSize: "15px", lineHeight: "1.6", marginBottom: "32px" }}>
                Touch the seasoned mahogany grain, test the reclining ergonomics, and meet our senior interior architects over freshly brewed tea.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Address */}
                <div style={{ display: "flex", gap: "14px" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: "rgba(236,34,38,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={20} color="#ec2226" />
                  </div>
                  <div>
                    <strong style={{ color: "#ffffff", fontSize: "15px", display: "block" }}>
                      Begum Rokeya Sarani, Mirpur
                    </strong>
                    <span style={{ color: "#9da3ae", fontSize: "13px" }}>
                      {BRAND_INFO.address}
                    </span>
                  </div>
                </div>

                {/* Hours */}
                <div style={{ display: "flex", gap: "14px" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: "rgba(236,34,38,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={20} color="#ec2226" />
                  </div>
                  <div>
                    <strong style={{ color: "#ffffff", fontSize: "15px", display: "block" }}>
                      Showroom Operating Hours
                    </strong>
                    <span style={{ color: "#9da3ae", fontSize: "13px" }}>
                      {BRAND_INFO.hours}
                    </span>
                  </div>
                </div>

                {/* Hotlines */}
                <div style={{ display: "flex", gap: "14px" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: "rgba(236,34,38,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Phone size={20} color="#ec2226" />
                  </div>
                  <div>
                    <strong style={{ color: "#ffffff", fontSize: "15px", display: "block" }}>
                      Direct Hotlines
                    </strong>
                    <span style={{ color: "#9da3ae", fontSize: "13px" }}>
                      {BRAND_INFO.hotlines.join(" • ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Map Link Button */}
            <div style={{ marginTop: "40px" }}>
              <a
                href="https://maps.google.com/?q=752/2,+West+Shewrapara,+Begum+Rokeya+Sarani,+Mirpur,+Dhaka-1216"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-luxury-red"
                style={{ width: "100%", padding: "14px" }}
              >
                <Navigation size={18} />
                <span>Get Google Maps Directions</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Right: Showroom Photography & Visual Experience */}
          <div style={{ position: "relative", minHeight: "380px" }}>
            <img
              src="https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80"
              alt="Kinglet Furniture Showroom Interior"
              width="600"
              height="380"
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(14,17,23,0.1) 0%, rgba(14,17,23,0.85) 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "24px",
                left: "24px",
                right: "24px",
                background: "rgba(15, 17, 21, 0.85)",
                backdropFilter: "blur(12px)",
                padding: "16px 20px",
                borderRadius: "14px",
                border: "1px solid rgba(236, 34, 38, 0.3)",
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>
                Over 120+ Life-Sized Room Displays Ready For Inspection
              </div>
              <div style={{ fontSize: "12px", color: "#ec2226", marginTop: "4px" }}>
                Master beds, modular kitchens, luxury sofas, and architectural doors.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
