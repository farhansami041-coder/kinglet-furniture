import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * KingletSectionHeader
 * Inspired by JMG Furniture & Hatil:
 * - Bold architectural title
 * - Continuous red accent horizontal line spanning across
 * - "SEE ALL ->" link on the right edge
 */
export default function KingletSectionHeader({
  title = "FEATURED PRODUCTS",
  subtitle = null,
  linkTo = "/category/all",
  linkLabel = "SEE ALL",
  style = {},
  className = "",
}) {
  return (
    <div
      className={`kinglet-section-header ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "26px",
        gap: "16px",
        ...style,
      }}
    >
      {/* Left: Bold Modern Architectural Title */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", flexShrink: 0 }}>
        {subtitle && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: "800",
              color: "#ec2226",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {subtitle}
          </span>
        )}
        <h2
          style={{
            margin: 0,
            fontSize: "26px",
            fontWeight: "900",
            color: "#0f172a",
            letterSpacing: "-0.5px",
            textTransform: "uppercase",
            fontFamily: '"Century Gothic", "CenturyGothic", "AppleGothic", "Outfit", "Jost", sans-serif',
            lineHeight: 1.15,
          }}
        >
          {title}
        </h2>
      </div>

      {/* Middle: Architectural Red Accent Line Spanning Across (Directly from JMG Screenshot) */}
      <div
        style={{
          flex: 1,
          height: "2px",
          background: "linear-gradient(90deg, #ec2226 0%, #ec2226 85%, rgba(236, 34, 38, 0.4) 100%)",
          borderRadius: "2px",
          minWidth: "40px",
          margin: "0 14px",
        }}
      />

      {/* Right: Dynamic SEE ALL / SEE MORE Button */}
      {linkTo && (
        <Link
          to={linkTo}
          className="kinglet-dynamic-see-more-btn"
          title={`Browse ${title}`}
        >
          <span>{linkLabel}</span>
          <span className="btn-arrow-bubble">
            <ArrowRight size={13} strokeWidth={2.6} />
          </span>
        </Link>
      )}
    </div>
  );
}
