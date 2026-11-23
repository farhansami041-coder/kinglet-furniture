import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const SHOWCASE_ITEMS = [
  {
    tag: "LIVING & BED",
    title: "Home Furniture",
    subtitle: "Seasoned Mahogany Beds, Ergonomic Sofas & Dining Sets",
    cta: "Explore Home",
    image: "/images/showcase/home-furniture.webp",
    fallbackImage: "/images/catalog/bed-woodora.png",
    link: "/category/living-room",
  },
  {
    tag: "EXECUTIVE",
    title: "Office Furniture",
    subtitle: "Director Suites, Ergonomic Chairs & Meeting Tables",
    cta: "Explore Office",
    image: "/images/showcase/office-furniture.webp",
    fallbackImage: "/images/catalog/sofa-urban-nest.png",
    link: "/category/office",
  },
  {
    tag: "MODULAR",
    title: "Kitchen Solution",
    subtitle: "Waterproof Marine Ply Pantries & Island Counters",
    cta: "Explore Kitchen",
    image: "/images/showcase/kitchen-solution.webp",
    fallbackImage: "/images/catalog/dining-elite.png",
    link: "/category/kitchen",
  },
  {
    tag: "BESPOKE",
    title: "Interior Solution",
    subtitle: "Turnkey Architecture, Custom Woodwork & Fitouts",
    cta: "Explore Interior",
    image: "/images/showcase/interior-solution.png",
    fallbackImage: "/images/catalog/almira-verona.png",
    link: "/interior",
  },
];

export default function KingletBorderlessShowcase() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [_isVisible, setIsVisible] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="kinglet-category-showcase-section"
      style={{
        width: "100%",
        padding: 0,
        margin: 0,
        background: "#000000",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div className="kinglet-showcase-accordion">
        {SHOWCASE_ITEMS.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          const isAnyHovered = hoveredIndex !== null;

          // Dynamic accordion flex calculation on desktop:
          const flexValue = isHovered ? 1.65 : isAnyHovered ? 0.78 : 1;

          return (
            <Link
              key={idx}
              to={item.link}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="kinglet-accordion-item"
              style={{
                flex: flexValue,
                position: "relative",
                overflow: "hidden",
                textDecoration: "none",
                display: "block",
                background: "#000000",
                border: "none",
                outline: "none",
                cursor: "pointer",
                transition: "flex 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)",
              }}
            >
              {/* Background Imagery with cinematic zoom */}
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                width="600"
                height="700"
                onError={(e) => {
                  if (e.currentTarget.src !== item.fallbackImage) {
                    e.currentTarget.src = item.fallbackImage;
                  }
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  aspectRatio: "6 / 7",
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                  transform: isHovered ? "scale(1.10)" : "scale(1.0)",
                  filter: isHovered
                    ? "brightness(1.06) contrast(1.05)"
                    : isAnyHovered
                    ? "brightness(0.75)"
                    : "brightness(0.95)",
                  transition:
                    "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.45s ease",
                }}
              />

              {/* Seamless Dark Gradient Vignette for Depth */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: isHovered
                    ? "linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.1) 40%, rgba(0, 0, 0, 0.65) 75%, rgba(0, 0, 0, 0.95) 100%)"
                    : "linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.15) 45%, rgba(0, 0, 0, 0.7) 80%, rgba(0, 0, 0, 0.92) 100%)",
                  transition: "background 0.4s ease",
                  pointerEvents: "none",
                }}
              />

              {/* Minimalist Top Tag (Number removed) */}
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "18px",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: isHovered ? "rgba(236, 34, 38, 0.95)" : "rgba(0, 0, 0, 0.55)",
                    backdropFilter: "blur(6px)",
                    padding: "3px 9px",
                    borderRadius: "4px",
                    border: isHovered ? "1px solid #ec2226" : "1px solid rgba(255, 255, 255, 0.15)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: isHovered ? "#ffffff" : "#ec2226",
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: "800",
                      color: "#ffffff",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.tag}
                  </span>
                </div>
              </div>

              {/* Vertical divider line */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "1px",
                  height: "100%",
                  background: isHovered ? "rgba(236, 34, 38, 0.4)" : "rgba(255, 255, 255, 0.1)",
                  transition: "background 0.35s ease",
                  pointerEvents: "none",
                }}
              />

              {/* Bottom Interactive Content */}
              <div
                className="showcase-content-box"
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "14px",
                  right: "14px",
                  zIndex: 2,
                  pointerEvents: "none",
                  textAlign: "center",
                }}
              >
                {/* Main Title */}
                <h3
                  className="showcase-title"
                  style={{
                    margin: 0,
                    fontWeight: "900",
                    color: "#ffffff",
                    letterSpacing: "0.4px",
                    textShadow: "0 2px 10px rgba(0, 0, 0, 0.95), 0 1px 4px rgba(0, 0, 0, 0.8)",
                    textTransform: "capitalize",
                    transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.title}
                </h3>

                {/* Dynamic Subtitle - Desktop reveals on hover, mobile keeps concise */}
                <div
                  className="showcase-subtitle"
                  style={{
                    maxHeight: isHovered ? "40px" : "0px",
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? "translateY(0)" : "translateY(10px)",
                    overflow: "hidden",
                    transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.85)",
                    fontWeight: "500",
                    marginTop: isHovered ? "6px" : "0px",
                    lineHeight: "1.3",
                    textShadow: "0 1px 4px rgba(0, 0, 0, 0.9)",
                  }}
                >
                  {item.subtitle}
                </div>

                {/* Animated Red Accent / CTA Bar */}
                <div
                  className="showcase-cta-bar"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    marginTop: isHovered ? "10px" : "8px",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Desktop Hover CTA */}
                  <div className="showcase-desktop-cta">
                    {isHovered ? (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#ec2226",
                          color: "#ffffff",
                          padding: "5px 14px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "800",
                          letterSpacing: "0.5px",
                          boxShadow: "0 4px 14px rgba(236, 34, 38, 0.45)",
                          animation: "fadeInUp 0.25s ease-out",
                        }}
                      >
                        {item.cta} <ArrowUpRight size={13} strokeWidth={2.6} />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "36px",
                          height: "2.5px",
                          background: "rgba(255, 255, 255, 0.45)",
                          borderRadius: "2px",
                          transition: "all 0.3s ease",
                        }}
                      />
                    )}
                  </div>

                  {/* Mobile & Tablet Always-Visible Tactile Button */}
                  <div className="showcase-mobile-cta">
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "rgba(236, 34, 38, 0.9)",
                        color: "#ffffff",
                        padding: "3px 10px",
                        borderRadius: "14px",
                        fontSize: "10.5px",
                        fontWeight: "800",
                        letterSpacing: "0.3px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      {item.cta} <ArrowUpRight size={11} strokeWidth={2.6} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom active red border line */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: "#ec2226",
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  boxShadow: isHovered ? "0 0 12px #ec2226" : "none",
                  pointerEvents: "none",
                }}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
