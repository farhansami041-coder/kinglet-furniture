import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Lock,
  ArrowUp,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { BRAND_INFO } from "../../data/kingletData";

export default function KingletFooterClone() {
  const [siteSettings, setSiteSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kinglet_site_settings") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleSettingsUpdate = (e) => {
      if (e?.detail) setSiteSettings(e.detail);
    };
    const handleStorage = (e) => {
      if (e.key === "kinglet_site_settings" && e.newValue) {
        try {
          setSiteSettings(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("kinglet_settings_updated", handleSettingsUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("kinglet_settings_updated", handleSettingsUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentAddress = siteSettings.footer_address || siteSettings.showroom_address || "752/2, West Shewrapara, Begum Rokeya Sarani, Mirpur, Dhaka 1216, Bangladesh.";
  const currentPhone = siteSettings.footer_phone || siteSettings.primary_phone || BRAND_INFO.hotlinePrimary;
  const currentEmail = siteSettings.footer_email || siteSettings.primary_email || "info.kingletbd@gmail.com";
  const currentFacebook = siteSettings.facebook_url || BRAND_INFO.socials.facebook;
  const currentInstagram = siteSettings.instagram_url || BRAND_INFO.socials.instagram;
  const currentYoutube = siteSettings.youtube_url || BRAND_INFO.socials.youtube;
  const currentTwitter = siteSettings.twitter_url || BRAND_INFO.socials.twitter;
  const currentWhatsapp = siteSettings.whatsapp_number || BRAND_INFO.whatsapp;
  const currentSiteName = siteSettings.title || siteSettings.site_name || "Kinglet Bangladesh Ltd";
  const currentGatewayImg = siteSettings.footer_gateway_img || BRAND_INFO.cardsImg;
  const currentCopyright = siteSettings.copy_right || `Designed and Developed by Ridgeben IT Solutions Ltd. Copyright©2026 ${currentSiteName}. All Rights Reserved.`;
  const currentWorkingDays = siteSettings.working_days_from_to || "Everyday except Sunday";
  const currentFridayHours = `Friday: ${siteSettings.friday_start || "9:00 AM"} – ${siteSettings.friday_end || "10:00 PM"}`;

  return (
    <footer className="kinglet-authentic-footer" role="contentinfo">

      {/* 2. Main 6-Column Content Grid */}
      <div className="container" style={{ maxWidth: "1440px", padding: "0 24px" }}>
        <div className="kinglet-footer-grid">
          
          {/* Column 1: Brand Logo & Showroom Beacon */}
          <div>
            <Link to="/" style={{ display: "inline-block", transition: "transform 0.25s ease" }} className="kinglet-footer-brand">
              <img
                src={BRAND_INFO.logoDark}
                alt="Kinglet Furniture & Interior"
                width="140"
                height="50"
                loading="lazy"
                style={{ width: "100%", maxWidth: "140px", height: "auto", display: "block" }}
              />
            </Link>

            <div style={{ marginTop: "14px", fontSize: "11.5px", color: "#64748b", fontStyle: "italic", lineHeight: "1.4" }}>
              "Creativity in Simplicity"
            </div>

            {/* Live Showroom Status */}
            <div style={{ marginTop: "16px" }}>
              <div className="live-showroom-beacon">
                <span className="live-beacon-dot" />
                <span>Showroom Open</span>
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                <span>🚇 Beside Metro Rail</span>
              </div>
            </div>
          </div>

          {/* Column 2: Get In Touch */}
          <div>
            <h3 className="kinglet-footer-title">Get In Touch</h3>
            
            {/* Address */}
            <div className="kinglet-footer-contact-item">
              <MapPin size={17} className="contact-icon" />
              <div>
                <strong>Address: </strong>
                <span>{currentAddress}</span>
                <div style={{ marginTop: "3px" }}>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(currentAddress)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "11.5px", color: "#ec2226", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px" }}
                  >
                    <span>View on Google Maps</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="kinglet-footer-contact-item">
              <Phone size={17} className="contact-icon" />
              <div>
                <strong>Phone: </strong>
                <a href={`tel:${currentPhone}`} style={{ color: "inherit", textDecoration: "none" }}>{currentPhone}</a>
              </div>
            </div>

            {/* Email */}
            <div className="kinglet-footer-contact-item">
              <Mail size={17} className="contact-icon" />
              <div>
                <strong>Email: </strong>
                <a href={`mailto:${currentEmail}`} style={{ color: "#ec2226", textDecoration: "none", fontWeight: "600" }}>
                  {currentEmail}
                </a>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="kinglet-footer-contact-item" style={{ marginBottom: 0 }}>
              <Clock size={17} className="contact-icon" />
              <div>
                <strong>Everyday except Sunday: </strong>
                <span>9:00 AM - 10:00 PM</span>
              </div>
            </div>
          </div>

          {/* Column 3: Usefull Links */}
          <div>
            <h3 className="kinglet-footer-title">Usefull Links</h3>
            <ul className="kinglet-footer-list">
              <li>
                <Link to="/faq" className="kinglet-footer-link">
                  <span className="link-dot" />
                  <span>FAQs</span>
                </Link>
              </li>
              <li>
                <Link to="/about-us" className="kinglet-footer-link">
                  <span className="link-dot" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="kinglet-footer-link">
                  <span className="link-dot" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/warranty-terms" className="kinglet-footer-link">
                  <span className="link-dot" />
                  <span>Warranty &amp; Service Terms</span>
                </Link>
              </li>
              <li>
                <Link to="/exchange-return" className="kinglet-footer-link">
                  <span className="link-dot" />
                  <span>Exchange and Return</span>
                </Link>
              </li>
              <li>
                <Link to="/delivery" className="kinglet-footer-link">
                  <span className="link-dot" />
                  <span>Delivery</span>
                </Link>
              </li>
              <li>
                <Link to="/care-maintenance" className="kinglet-footer-link">
                  <span className="link-dot" />
                  <span>Care &amp; Maintenance</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Help Center */}
          <div>
            <h3 className="kinglet-footer-title">Help Center</h3>
            <ul className="kinglet-footer-list">
              <li>
                <Link to="/account" className="kinglet-footer-link">
                  <span className="link-dot" />
                  <span>My Account</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="kinglet-footer-link">
                  <span className="link-dot" />
                  <span>Location</span>
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="kinglet-footer-link">
                  <span className="link-dot" />
                  <span>Live Order Tracking</span>
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-kinglet-helpline", { detail: { tab: "chat" } }))}
                  className="kinglet-footer-link"
                  style={{ background: "none", border: "none", padding: 0, font: "inherit", cursor: "pointer", textAlign: "left", width: "100%", display: "flex", alignItems: "center" }}
                >
                  <span className="link-dot" />
                  <span>24/7 Helpline &amp; AI Chatbot</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-kinglet-helpline", { detail: { tab: "report" } }))}
                  className="kinglet-footer-link"
                  style={{ background: "none", border: "none", padding: 0, font: "inherit", cursor: "pointer", textAlign: "left", width: "100%", display: "flex", alignItems: "center" }}
                >
                  <span className="link-dot" />
                  <span style={{ color: "#f87171" }}>Report a Problem / Issue</span>
                </button>
              </li>
              <li>
                <a href={`tel:${BRAND_INFO.hotlinePrimary}`} className="kinglet-footer-link">
                  <span className="link-dot" />
                  <span>Instant Hotline Help</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Pay With */}
          <div>
            <h3 className="kinglet-footer-title">Pay With</h3>
            <div className="kinglet-pay-container" style={{ marginTop: "10px" }}>
              <img
                src={currentGatewayImg}
                alt="Supported Cards & Mobile Banking (Visa, Mastercard, bKash, Nagad)"
                width="280"
                height="42"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = BRAND_INFO.cardsImg;
                }}
                style={{
                  width: "100%",
                  maxWidth: "280px",
                  height: "auto",
                  display: "block",
                  borderRadius: "4px",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#16a34a", fontWeight: "700", marginTop: "8px", padding: "0 4px" }}>
                <Lock size={12} />
                <span>100% Encrypted &amp; Secure Payment</span>
              </div>
            </div>
          </div>

          {/* Column 6: Hotline 24/7 & Social Media */}
          <div>
            <h3 className="kinglet-footer-title">Hotline 24/7</h3>
            
            {/* Interactive Hotline Card */}
            <div className="kinglet-hotline-card">
              <div style={{ fontSize: "11px", fontWeight: "750", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                Dedicated Support Call
              </div>
              <a href={`tel:${(currentPhone || "+880 1898-878815").replace(/[^0-9+]/g, "")}`} className="kinglet-footer-hotline">
                {currentPhone || "+880 1898-878815"}
              </a>
              <div style={{ marginTop: "10px" }}>
                <a
                  href={`https://wa.me/${(currentWhatsapp || "+880 1898-878815").replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hello Kinglet! I would like to inquire about furniture.")}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#25D366",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "750",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(37, 211, 102, 0.3)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <MessageCircle size={14} /> WhatsApp Us
                </a>
              </div>
            </div>

            {/* Social Buttons */}
            <div style={{ fontSize: "11.5px", fontWeight: "750", color: "#475569", marginBottom: "8px" }}>
              Follow Kinglet:
            </div>
            <div className="kinglet-footer-social-row">
              {/* Facebook */}
              <a
                href={currentFacebook}
                target="_blank"
                rel="noreferrer"
                className="kinglet-footer-social-btn facebook"
                aria-label="Facebook"
                title="Facebook"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href={currentYoutube}
                target="_blank"
                rel="noreferrer"
                className="kinglet-footer-social-btn youtube"
                aria-label="YouTube"
                title="YouTube"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href={currentInstagram}
                target="_blank"
                rel="noreferrer"
                className="kinglet-footer-social-btn instagram"
                aria-label="Instagram"
                title="Instagram"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* X / Twitter */}
              <a
                href={BRAND_INFO.socials.twitter}
                target="_blank"
                rel="noreferrer"
                className="kinglet-footer-social-btn twitter"
                aria-label="X"
                title="X (Twitter)"
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 3H21L13.89 11.1 21.5 21h-6.02l-4.71-6.2L5.4 21H3l7.64-9.2L3.5 3h6.02l4.33 5.66L18.244 3Z" />
                </svg>
              </a>

              {/* WhatsApp direct */}
              <a
                href={`https://wa.me/${currentWhatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hello Kinglet! I am contacting from the website.")}`}
                target="_blank"
                rel="noreferrer"
                className="kinglet-footer-social-btn whatsapp"
                aria-label="WhatsApp"
                title="WhatsApp Direct"
              >
                <MessageCircle size={17} />
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Bottom Bar: Copyright & Back to Top */}
      <div className="kinglet-footer-bottom-bar">
        <div
          className="container"
          style={{
            maxWidth: "1440px",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
            {currentCopyright}
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="kinglet-back-to-top-btn"
            title="Scroll to top of page"
          >
            <span>Back to Top</span>
            <ArrowUp size={14} />
          </button>
        </div>
      </div>

    </footer>
  );
}
