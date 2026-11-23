import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  Truck,
  Percent,
  Clock,
  Sparkles,
  Flame,
} from "lucide-react";

export default function KingletFlashSaleBanner() {
  const [copied, setCopied] = useState(false);

  // Live Real-Time Countdown Timer (48-Hour Promotional Window)
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 34,
    seconds: 56,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return { days: 2, hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText("KINGLET15");
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  return (
    <section
      aria-label="Kinglet Winter Seasonal Flash Sale"
      className="kinglet-winter-hero-section scroll-reveal"
      style={{
        position: "relative",
        width: "100%",
        margin: "0",
        padding: "0",
        background: "#0d1117",
        borderTop: "none",
        borderBottom: "none",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        /* 8K Ultra-Sharp Crystal Clear Rendering with GPU Anti-Aliasing */
        .kinglet-8k-banner-img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
          object-position: center center;
          image-rendering: auto;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          transform: translateZ(0) scale(1.0);
          transition: transform 14s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .kinglet-winter-hero-section:hover .kinglet-8k-banner-img {
          transform: translateZ(0) scale(1.025);
        }

        /* Subtle Live Floating Snowflakes & Sparkles */
        @keyframes subtleSnowDrift1 {
          0% { transform: translateY(-20px) translateX(0px); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(120px) translateX(30px); opacity: 0; }
        }
        @keyframes subtleSnowDrift2 {
          0% { transform: translateY(-20px) translateX(0px); opacity: 0; }
          25% { opacity: 0.7; }
          75% { opacity: 0.7; }
          100% { transform: translateY(140px) translateX(-25px); opacity: 0; }
        }
        @keyframes sparkleGlowPulse {
          0%, 100% { transform: scale(0.9); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 0.95; }
        }

        /* Refined CTA Shimmer Effect */
        @keyframes winterCtaShimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }

        /* Responsive Action Ribbon */
        .winter-ribbon-container {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          width: 100%;
        }

        .winter-ribbon-top-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .winter-campaign-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(236, 34, 38, 0.16);
          border: 1px solid rgba(236, 34, 38, 0.4);
          color: #ff6b6e;
          padding: 5px 12px;
          borderRadius: 9999px;
          font-size: 11.5px;
          font-weight: 850;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .winter-hallmarks-row {
          display: flex;
          align-items: center;
          gap: 18px;
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.75);
          font-weight: 600;
        }

        .hallmark-item {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .hallmark-dot {
          display: none;
        }

        .winter-actions-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .winter-countdown-box {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 9999px;
          padding: 6px 14px;
          font-size: 12px;
          color: #ffffff;
        }

        .winter-coupon-capsule {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px dashed rgba(255, 255, 255, 0.35);
          padding: 6px 14px;
          border-radius: 9999px;
          cursor: pointer;
          color: #ffffff;
          font-size: 12px;
          font-weight: 750;
          transition: all 0.2s ease;
        }

        .winter-coupon-capsule:hover {
          border-color: #ec2226;
          background: rgba(236, 34, 38, 0.14);
        }

        .winter-cta-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #ff2e33 0%, #ec2226 60%, #b91c1c 100%);
          color: #ffffff;
          padding: 9px 24px;
          border-radius: 9999px;
          font-weight: 800;
          font-size: 13.5px;
          text-decoration: none;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(236, 34, 38, 0.5);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .winter-cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(236, 34, 38, 0.75);
        }

        @media (max-width: 900px) {
          .winter-banner-cta-ribbon {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            right: auto !important;
            margin: -2px 0 0 !important;
            border-radius: 0 !important;
            border-left: none !important;
            border-right: none !important;
          }
        }

        @media (max-width: 768px) {
          .winter-banner-cta-ribbon {
            padding: 12px 14px !important;
          }
          .winter-ribbon-container {
            flex-direction: column !important;
            gap: 10px !important;
          }
          .winter-ribbon-top-row {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .winter-campaign-badge {
            font-size: 10px !important;
            padding: 4px 9px !important;
            white-space: nowrap !important;
          }
          .winter-countdown-box {
            padding: 4px 10px !important;
            font-size: 11px !important;
          }
          .winter-countdown-box .countdown-label {
            display: none !important;
          }
          .winter-hallmarks-row {
            display: flex !important;
            align-items: center !important;
            justify-content: space-around !important;
            gap: 6px !important;
            font-size: 10px !important;
            color: rgba(255, 255, 255, 0.8) !important;
            background: rgba(255, 255, 255, 0.05) !important;
            padding: 5px 8px !important;
            border-radius: 8px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .hallmark-dot {
            display: inline-block !important;
            color: #ec2226 !important;
            font-size: 10px !important;
          }
          .winter-actions-row {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .winter-coupon-capsule {
            flex: 1 1 auto !important;
            justify-content: center !important;
            padding: 7px 10px !important;
            font-size: 11.5px !important;
          }
          .winter-cta-button {
            flex: 1.2 1 auto !important;
            padding: 8px 14px !important;
            font-size: 12px !important;
            white-space: nowrap !important;
            text-align: center !important;
          }
        }
      `}</style>

      {/* Main Banner Visual Frame with Link to /flash-sale */}
      <Link
        to="/flash-sale"
        style={{
          display: "block",
          position: "relative",
          width: "100%",
          textDecoration: "none",
          cursor: "pointer",
          overflow: "hidden",
        }}
        title="Explore Kinglet 15% OFF Flash Sale Collection"
      >
        {/* 8K Multi-Resolution Picture Element (Serves 8K, 4K WebP & JPG Fallbacks) */}
        <picture>
          {/* 8K Ultra-High-Definition WebP (7680x4282) */}
          <source
            media="(min-width: 1440px)"
            srcSet="/images/kinglet-winter-banner-8k.webp"
            type="image/webp"
          />
          {/* 4K High-Definition WebP (3840x2141) */}
          <source
            media="(min-width: 768px)"
            srcSet="/images/kinglet-winter-banner-4k.webp"
            type="image/webp"
          />
          {/* Mobile & Tablet WebP */}
          <source
            srcSet="/images/kinglet-winter-banner-4k.webp"
            type="image/webp"
          />
          {/* 4K JPG Fallback */}
          <img
            src="/images/kinglet-winter-banner-4k.jpg"
            alt="Kinglet Furniture & Interior - শীতের আমেজে ঘর সাজান নতুন রূপে! ১৫% ছাড়!"
            className="kinglet-8k-banner-img"
            loading="lazy"
            decoding="async"
            width="3840"
            height="2142"
            style={{ aspectRatio: "3840 / 2142" }}
          />
        </picture>

        {/* Live Ambient Winter Atmosphere: Floating Snowflakes & Sparkles */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 2,
            overflow: "hidden",
          }}
        >
          {/* Snowflake 1 */}
          <div
            style={{
              position: "absolute",
              top: "15%",
              left: "18%",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: "0 0 10px #ffffff, 0 0 20px rgba(255, 255, 255, 0.8)",
              animation: "subtleSnowDrift1 7s ease-in-out infinite",
            }}
          />
          {/* Snowflake 2 */}
          <div
            style={{
              position: "absolute",
              top: "28%",
              left: "42%",
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: "0 0 8px #ffffff",
              animation: "subtleSnowDrift2 9s ease-in-out infinite 1.5s",
            }}
          />
          {/* Snowflake 3 */}
          <div
            style={{
              position: "absolute",
              top: "12%",
              left: "65%",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: "0 0 12px #ffffff",
              animation: "subtleSnowDrift1 8s ease-in-out infinite 3s",
            }}
          />
          {/* Snowflake 4 */}
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "25%",
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: "0 0 6px #ffffff",
              animation: "subtleSnowDrift2 6.5s ease-in-out infinite 2s",
            }}
          />
          {/* Ambient Sparkle Near Badge */}
          <div
            style={{
              position: "absolute",
              top: "60%",
              right: "22%",
              color: "#fbbf24",
              animation: "sparkleGlowPulse 3s ease-in-out infinite",
            }}
          >
            <Sparkles size={16} />
          </div>
        </div>

        {/* Subtle Dark Edge Gradients for Smooth Seamless Site Integration */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "80px",
            background: "linear-gradient(to top, rgba(13, 17, 23, 0.65) 0%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      </Link>

      {/* Sophisticated Floating Action & Countdown Ribbon (Hatil & Brothers Style) */}
      <div
        className="winter-banner-cta-ribbon"
        style={{
          position: "relative",
          zIndex: 4,
          background: "rgba(10, 14, 22, 0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.14)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "16px clamp(16px, 3.5vw, 40px)",
          boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.35)",
        }}
      >
        <div className="winter-ribbon-container">
          {/* Top Row: Campaign Badge + Countdown Box */}
          <div className="winter-ribbon-top-row">
            <div className="winter-campaign-badge">
              <Flame size={13} fill="#ec2226" color="#ec2226" />
              <span>Winter Flash Sale • 15% OFF</span>
            </div>

            {/* Countdown Timer */}
            <div className="winter-countdown-box">
              <Clock size={13} color="#ec2226" />
              <span className="countdown-label" style={{ color: "rgba(255, 255, 255, 0.65)", fontWeight: "650" }}>Closes in:</span>
              <span style={{ fontWeight: "850", fontVariantNumeric: "tabular-nums" }}>
                {String(timeLeft.days).padStart(2, "0")}d : {String(timeLeft.hours).padStart(2, "0")}h :{" "}
                {String(timeLeft.minutes).padStart(2, "0")}m :{" "}
                <span style={{ color: "#ff6b6e" }}>{String(timeLeft.seconds).padStart(2, "0")}s</span>
              </span>
            </div>
          </div>

          {/* Hallmarks Row */}
          <div className="winter-hallmarks-row">
            <div className="hallmark-item">
              <Truck size={14} color="#ec2226" />
              <span>Nationwide Delivery</span>
            </div>
            <span className="hallmark-dot">•</span>
            <div className="hallmark-item">
              <ShieldCheck size={14} color="#ec2226" />
              <span>10-Year Timber Warranty</span>
            </div>
            <span className="hallmark-dot">•</span>
            <div className="hallmark-item">
              <Percent size={14} color="#ec2226" />
              <span>Bank EMI Available (3-36 Mo)</span>
            </div>
          </div>

          {/* Actions Row: Coupon Capsule + Primary CTA */}
          <div className="winter-actions-row">
            {/* Promo Code Capsule */}
            <div
              onClick={handleCopyCode}
              title="Click to copy coupon code"
              className="winter-coupon-capsule"
            >
              <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Code:</span>
              <span style={{ fontWeight: "900", letterSpacing: "0.8px" }}>KINGLET15</span>
              <span
                style={{
                  background: copied ? "#16a34a" : "#ec2226",
                  color: "#ffffff",
                  padding: "2px 6px",
                  borderRadius: "5px",
                  fontSize: "10px",
                  fontWeight: "800",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                {copied ? <Check size={10} strokeWidth={3} /> : <Copy size={10} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </span>
            </div>

            {/* PRIMARY REQUESTED BUTTON: 'See All Offer Products' */}
            <Link
              to="/flash-sale"
              className="winter-cta-button"
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "40%",
                  height: "100%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                  animation: "winterCtaShimmer 3.5s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
              <span>See All Offer Products</span>
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
