import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const HERO_SLIDES = [
  {
    image: "https://www.kingletbd.com/storage/images/OM_17609533777XZzHYYq.png",
    link: "/category/living-room",
    title: "Mastercrafted Luxury Living & Turnkey Interior Suites",
  },
  {
    image: "https://www.kingletbd.com/storage/images/OM_1760953366DyoM2GSn.png",
    link: "/category/bed-room",
    title: "Royal Teak & Mahogany Bedroom Collections",
  },
  {
    image: "https://www.kingletbd.com/storage/images/jvlJAnyToolz_compressed_banners1-01.png",
    link: "/category/dining",
    title: "Solid Timber Dining Suites & Artisanal Carved Doors",
  },
  {
    image: "/images/kinglet-winter-banner-4k.webp",
    link: "/flash-sale",
    title: "Winter Clearance & Custom Bridal Furniture Packages",
  },
];

export default function KingletHeroSliderClone() {
  const [slides, setSlides] = useState(HERO_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch dynamic CMS banners from backend database
  useEffect(() => {
    let isMounted = true;
    fetch("/api/v1/cms/banners")
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const dynamicSlides = json.data.map((b) => ({
            image: b.imageUrl,
            link: b.targetUrl || "/category/all",
            title: b.title || "Kinglet Furniture Flagship",
          }));
          setSlides(dynamicSlides);
        }
      })
      .catch((err) => console.warn("Could not fetch CMS banners, using defaults:", err.message));

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto slide every 5.5 seconds
  useEffect(() => {
    if (!slides.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div
      className="kinglet-hero-slider-wrap"
      style={{
        position: "relative",
        width: "100%",
        height: "86vh",
        minHeight: "540px",
        maxHeight: "820px",
        overflow: "hidden",
        background: "#0a0a0c",
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .kinglet-hero-slider-wrap {
            height: 60vw !important;
            min-height: 280px !important;
            max-height: 480px !important;
          }
        }
        @media (max-width: 540px) {
          .kinglet-hero-slider-wrap {
            height: 62vw !important;
            min-height: 220px !important;
          }
        }
      `}</style>

      {/* 100% Full Clear Banners without dark scrims or conflicting text */}
      {slides.map((slide, idx) => {
        const isActive = currentSlide === idx;
        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              inset: 0,
              opacity: isActive ? 1 : 0,
              transform: isActive ? "scale(1.0)" : "scale(1.02)",
              transition: "opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 5s cubic-bezier(0.16, 1, 0.3, 1)",
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            <Link
              to={slide.link || "/category/all"}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                textDecoration: "none",
                cursor: "pointer",
              }}
              title={slide.title}
            >
              <img
                src={slide.image}
                alt={slide.title}
                width="1920"
                height="780"
                fetchPriority={idx === 0 ? "high" : "auto"}
                loading={idx === 0 ? "eager" : "lazy"}
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=80";
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  aspectRatio: "1920 / 780",
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                }}
              />
            </Link>
          </div>
        );
      })}

      {/* 100% Pure Transparent Top - Zero Dark Gradients */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "85px",
          background: "transparent",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* Minimalist Prev Arrow Control */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          prevSlide();
        }}
        aria-label="Previous Slide"
        style={{
          position: "absolute",
          left: "22px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "46px",
          height: "46px",
          borderRadius: "50%",
          background: "rgba(0, 0, 0, 0.32)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 20,
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
          transition: "all 0.22s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#ec2226";
          e.currentTarget.style.borderColor = "#ec2226";
          e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0, 0, 0, 0.32)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
          e.currentTarget.style.transform = "translateY(-50%) scale(1.0)";
        }}
      >
        <ChevronLeft size={24} />
      </button>

      {/* Minimalist Next Arrow Control */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        aria-label="Next Slide"
        style={{
          position: "absolute",
          right: "22px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "46px",
          height: "46px",
          borderRadius: "50%",
          background: "rgba(0, 0, 0, 0.32)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 20,
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
          transition: "all 0.22s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#ec2226";
          e.currentTarget.style.borderColor = "#ec2226";
          e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0, 0, 0, 0.32)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
          e.currentTarget.style.transform = "translateY(-50%) scale(1.0)";
        }}
      >
        <ChevronRight size={24} />
      </button>

      {/* Slide Pagination Indicator Pills */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
          zIndex: 20,
          background: "rgba(0, 0, 0, 0.28)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          padding: "5px 12px",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.18)",
        }}
      >
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(idx);
            }}
            aria-label={`Go to slide ${idx + 1}`}
            style={{
              width: currentSlide === idx ? "26px" : "8px",
              height: "7px",
              borderRadius: "4px",
              background: currentSlide === idx ? "#ec2226" : "rgba(255, 255, 255, 0.45)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.25s ease",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
