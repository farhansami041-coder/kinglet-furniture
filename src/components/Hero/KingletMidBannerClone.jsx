import React from "react";
import { Link } from "react-router-dom";
import { BRAND_INFO } from "../../data/kingletData";

export default function KingletMidBannerClone() {
  return (
    <section
      className="banner-section"
      style={{
        width: "100%",
        maxWidth: "1440px",
        margin: "40px auto 55px",
        padding: "0 clamp(16px, 3vw, 32px)",
        boxSizing: "border-box",
      }}
    >
      <Link
        to="/offers"
        className="genius-banner"
        style={{
          display: "block",
          width: "100%",
          textDecoration: "none",
          borderRadius: "clamp(12px, 1.8vw, 20px)",
          overflow: "hidden",
          boxShadow: "0 14px 40px -12px rgba(15, 23, 42, 0.14)",
          background: "#0c0a09",
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        title="Explore Kinglet Mega Festive Offers"
      >
        <img
          src={BRAND_INFO.banners.midBanner}
          alt="Kinglet Mega Festive Offers - কিংলেট ফার্নিচার আপনার স্টাইল আর স্বাচ্ছন্দ্যের প্রতীক"
          loading="lazy"
          width="2730"
          height="1043"
          style={{
            width: "100%",
            height: "auto",
            aspectRatio: "2730 / 1043",
            display: "block",
            objectFit: "contain",
            borderRadius: "inherit",
          }}
        />
      </Link>
    </section>
  );
}
