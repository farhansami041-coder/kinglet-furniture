import React, { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Shield, Award, Hammer, ChevronLeft, ChevronRight } from "lucide-react";

const HERO_SLIDES = [
  {
    id: 1,
    tagline: "DESIGNING YOUR SPACE, DEFINING YOUR STYLE",
    title: "Seasoned Mahogany Sanctuaries Handcrafted For Generations",
    subtitle:
      "Dhaka's premier direct-from-factory brand. We blend 100% seasoned solid timber with modern architectural elegance and heirloom craftsmanship.",
    badge: "Festive Collection 2026",
    primaryCta: "Explore 2026 Catalog",
    secondaryCta: "Schedule 3D Interior Visit",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=85",
  },
  {
    id: 2,
    tagline: "ARCHITECTURAL INTERIOR SOLUTIONS",
    title: "Turnkey Interior Design From Concept to Final Handover",
    subtitle:
      "Comprehensive 3D space planning, bespoke modular kitchens, solid architectural doors, and acoustic ceilings tailored for discerning Dhaka homes.",
    badge: "Turnkey Turn Around",
    primaryCta: "View Interior Portfolio",
    secondaryCta: "Get Free Project Estimate",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1920&q=85",
  },
  {
    id: 3,
    tagline: "DIRECT FROM IN-HOUSE FACTORY",
    title: "100+ Master Artisans. Zero Middleman Markups.",
    subtitle:
      "Experience our 15,000 sq.ft state-of-the-art facility. 21-day kiln drying, zero-emissions Italian polyurethane finishing, and 10-year structural warranty.",
    badge: "Authentic Craftsmanship",
    primaryCta: "Discover Mahogany Anatomy",
    secondaryCta: "Visit Mirpur Sales Center",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1920&q=85",
  },
];
const HERO_FEATURES = [
  {
    icon: Shield,
    title: "10-Year Warranty",
    desc: "Anti-borer, termite & joint security guaranteed",
  },
  {
    icon: Hammer,
    title: "100% Seasoned Wood",
    desc: "Kiln-dried Seasoned Mahogany & Black Plum Wood & Mahogany inputs",
  },
  {
    icon: Award,
    title: "Direct In-House Factory",
    desc: "100+ artisans with zero retail markup",
  },
  {
    icon: Sparkles,
    title: "Turnkey 3D Interiors",
    desc: "Complete apartment & office architectural solutions",
  },
];

export default function KingletHero({ onOpenConsultation, onExploreCatalog }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div
      style={{ position: "relative", minHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image Carousel with Parallax & Gradient Overlays */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${slide.image})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          transition: "background-image 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 8s ease",
          transform: "scale(1.04)",
          zIndex: 1,
        }}
      />
      {/* Cinematic Dark Gradient Layers for supreme contrast */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(15,17,21,0.85) 0%, rgba(15,17,21,0.6) 40%, rgba(15,17,21,0.95) 100%)",
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 20% 50%, rgba(236,34,38,0.12) 0%, transparent 60%)",
          zIndex: 2,
        }}
      />

      {/* Main Hero Content */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          maxWidth: "1320px",
          width: "100%",
          margin: "0 auto",
          padding: "80px 20px 40px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: "780px" }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(236,34,38,0.15)",
              border: "1px solid rgba(236,34,38,0.4)",
              borderRadius: "999px",
              padding: "6px 16px",
              marginBottom: "20px",
              backdropFilter: "blur(10px)",
            }}
          >
            <Sparkles size={14} color="#ec2226" />
            <span style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", color: "#fca5a5", textTransform: "uppercase" }}>
              {slide.tagline}
            </span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(36px, 5.5vw, 68px)",
              fontWeight: "700",
              lineHeight: "1.12",
              color: "#ffffff",
              marginBottom: "24px",
              letterSpacing: "-0.5px",
              textShadow: "0 4px 20px rgba(0,0,0,0.6)",
            }}
          >
            {slide.title}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "clamp(16px, 1.8vw, 20px)",
              color: "#d1d5db",
              lineHeight: "1.6",
              marginBottom: "36px",
              maxWidth: "680px",
              fontWeight: "400",
            }}
          >
            {slide.subtitle}
          </p>

          {/* CTA Button Group */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => {
                if (onExploreCatalog) {
                  onExploreCatalog();
                } else {
                  const el = document.getElementById("catalog-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="btn-luxury-red"
              style={{ padding: "16px 36px", fontSize: "15px" }}
            >
              <span>{slide.primaryCta}</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={onOpenConsultation}
              className="btn-luxury-outline"
              style={{ padding: "16px 32px", fontSize: "15px" }}
            >
              <Sparkles size={16} color="#ec2226" />
              <span>{slide.secondaryCta}</span>
            </button>
          </div>
        </div>

        {/* Slide Indicators & Navigation Arrows */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "40px" }}>
          {/* Dots */}
          <div style={{ display: "flex", gap: "10px" }}>
            {HERO_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: currentSlide === idx ? "36px" : "12px",
                  height: "8px",
                  borderRadius: "999px",
                  background: currentSlide === idx ? "#ec2226" : "rgba(255,255,255,0.25)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#ec2226")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#ec2226")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Trust Pillars Strip */}
      <div
        style={{
          position: "relative",
          zIndex: 6,
          background: "rgba(20, 23, 30, 0.9)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
            padding: "20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
          }}
        >
          {HERO_FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "12px",
                    background: "rgba(236,34,38,0.12)",
                    border: "1px solid rgba(236,34,38,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} color="#ec2226" />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff", marginBottom: "2px" }}>
                    {feat.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#9da3ae" }}>
                    {feat.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
