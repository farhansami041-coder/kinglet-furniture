import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Phone, PhoneCall, Video } from "lucide-react";
import { adminAuthService } from "../../utils/adminAuthService";
import { broadcastSettingsUpdate } from "../../utils/siteSettings";

// Helper to get setting value by key
export const getSettingValue = (settings, key, defaultVal = "") => {
  if (!Array.isArray(settings)) return defaultVal;
  const found = settings.find((s) => s.key === key);
  return found && found.value !== undefined ? found.value : defaultVal;
};

const resolveSettingImg = (val, fallback = "") => {
  if (!val) return fallback;
  if (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("blob:") || val.startsWith("data:")) {
    return val;
  }
  if (val.startsWith("/")) {
    return val;
  }
  return `https://www.kingletbd.com/storage/images/${val}`;
};

// ----------------------------------------------------------------------
// 1. GENERAL SETTINGS TAB (Matching authentic Kinglet admin layout)
// ----------------------------------------------------------------------
export function GeneralSettingsTab({ settings, onSave, saving }) {
  // Navigation tabs
  const [activeVerticalTab, setActiveVerticalTab] = useState("footer_contact");
  const [activeFooterPill, setActiveFooterPill] = useState("basic");

  // Success notification banner
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [successBannerMsg, setSuccessBannerMsg] = useState("Data Updated Successfully.");

  // File input refs for direct JPG/PNG uploads
  const gatewayImgRef = useRef(null);
  const logoImgRef = useRef(null);
  const faviconImgRef = useRef(null);
  const loaderImgRef = useRef(null);
  const metaImgRef = useRef(null);

  // Uploading status
  const [uploadingField, setUploadingField] = useState(null);
  const [fileNameDisplay, setFileNameDisplay] = useState({});

  // Full settings state
  const [form, setForm] = useState({
    // Basic Information
    title: getSettingValue(settings, "title", "Kinglet Bangladesh Ltd"),
    home_page_title: getSettingValue(settings, "home_page_title", "Leading Furniture Store in Bangladesh"),
    site_tagline: getSettingValue(settings, "site_tagline", "10-Year Timber Guarantee • 100% Kiln-Seasoned Chittagong Mahogany & Oak Veneer"),
    primary_color: getSettingValue(settings, "primary_color", "#EC2226"),
    currency_symbol: getSettingValue(settings, "currency_symbol", "৳"),
    currency_direction: getSettingValue(settings, "currency_direction", "0"),
    decimal_separator: getSettingValue(settings, "decimal_separator", "."),
    thousand_separator: getSettingValue(settings, "thousand_separator", ","),
    copy_right: getSettingValue(
      settings,
      "copy_right",
      "Designed and Developed by Ridgeben IT Solutions Ltd. Copyright©2026, All Rights Reserved."
    ),

    // Media
    logo: getSettingValue(settings, "logo", "https://www.kingletbd.com/storage/images/OM_1760884761NzeZb9h8.png"),
    favicon: getSettingValue(settings, "favicon", "https://www.kingletbd.com/storage/images/OM_17608847525DnZPuIu.png"),
    loader: getSettingValue(settings, "loader", "https://www.kingletbd.com/storage/images/OM_1761223679xWum3x0L.jpeg"),
    is_loader: getSettingValue(settings, "is_loader", "0"),
    feature_image: getSettingValue(settings, "feature_image", "1600622296topic.jpg"),

    // Seo
    meta_keywords: getSettingValue(
      settings,
      "meta_keywords",
      "Kinglet,Kinglet Bangladesh,Kinglet Furniture,Best Furniture Showroom in BD,Home Furniture,Office furniture"
    ),
    meta_description: getSettingValue(
      settings,
      "meta_description",
      "Kinglet Bangladesh ltd is no. 1 home furniture showroom in Bangladesh"
    ),
    meta_image: getSettingValue(settings, "meta_image", "OM_1753368121t7dN8oFl.jpg"),
    google_search_console_tag: getSettingValue(settings, "google_search_console_tag", ""),

    // Custom CSS
    custom_css: getSettingValue(settings, "custom_css", ""),

    // Scripts
    google_analytics_id: getSettingValue(settings, "google_analytics_id", "UA-106757798-1"),
    facebook_pixel: getSettingValue(settings, "facebook_pixel", ""),
    google_adsense: getSettingValue(settings, "google_adsense", ""),
    custom_header_script: getSettingValue(settings, "custom_header_script", ""),
    custom_footer_script: getSettingValue(settings, "custom_footer_script", ""),

    // Shop & Checkout
    min_price: getSettingValue(settings, "min_price", "0"),
    max_price: getSettingValue(settings, "max_price", "200000"),
    cod_security_advance_bdt: getSettingValue(settings, "cod_security_advance_bdt", "5000"),
    is_guest_checkout: getSettingValue(settings, "is_guest_checkout", "1"),
    is_single_checkout: getSettingValue(settings, "is_single_checkout", "1"),
    emi_tenures_available: getSettingValue(settings, "emi_tenures_available", "3,6,9,12,18,24,30,36"),
    emi_rates_json: getSettingValue(
      settings,
      "emi_rates_json",
      JSON.stringify([
        { tenure: 3, label: "3 Months", rate: 6.00 },
        { tenure: 6, label: "6 Months", rate: 6.50 },
        { tenure: 9, label: "9 Months", rate: 6.95 },
        { tenure: 12, label: "12 Months", rate: 9.29 },
        { tenure: 18, label: "18 Months", rate: 12.99 },
        { tenure: 24, label: "24 Months", rate: 18.34 },
        { tenure: 30, label: "30 Months", rate: 19.76 },
        { tenure: 36, label: "36 Months", rate: 24.22 },
      ])
    ),

    // Direct Hotlines & Contact Numbers
    primary_phone: getSettingValue(settings, "primary_phone", "+8801676900442"),
    whatsapp_number: getSettingValue(settings, "whatsapp_number", "+880 1898-878815"),

    // Footer & Contact Page - Basic
    footer_address: getSettingValue(
      settings,
      "footer_address",
      getSettingValue(settings, "showroom_address", "752/2, West Shewrapara, Begum Rokeya Sarani, Mirpur, Dhaka 1216")
    ),
    footer_phone: getSettingValue(
      settings,
      "footer_phone",
      getSettingValue(settings, "primary_phone", "+880 1898-878815, +880 1898-878816, 01676900442")
    ),
    footer_email: getSettingValue(
      settings,
      "footer_email",
      getSettingValue(settings, "primary_email", "info.kingletbd@gmail.com")
    ),
    footer_gateway_img: getSettingValue(
      settings,
      "footer_gateway_img",
      "https://www.kingletbd.com/storage/images/OM_1760886037KTtGSCGp.png"
    ),

    // Footer & Contact Page - Social Links
    facebook_url: getSettingValue(settings, "facebook_url", "https://www.facebook.com/kingletbd"),
    youtube_url: getSettingValue(settings, "youtube_url", "https://www.youtube.com/@kingletbd"),
    instagram_url: getSettingValue(settings, "instagram_url", "https://www.instagram.com/kingletbd"),
    twitter_url: getSettingValue(settings, "twitter_url", "https://twitter.com/kingletbd"),
    linkedin_url: getSettingValue(settings, "linkedin_url", "https://www.linkedin.com/company/kingletbd"),
    tiktok_url: getSettingValue(settings, "tiktok_url", "https://www.tiktok.com/@kingletbd"),

    // Footer & Contact Page - Working Days
    working_days_from_to: getSettingValue(settings, "working_days_from_to", "Everyday except Sunday"),
    friday_start: getSettingValue(settings, "friday_start", "9:00 AM"),
    friday_end: getSettingValue(settings, "friday_end", "10:00 PM"),
    satureday_start: getSettingValue(settings, "satureday_start", "10:00 AM"),
    satureday_end: getSettingValue(settings, "satureday_end", "08:00 PM"),
  });

  // Re-sync when settings prop updates
  useEffect(() => {
    if (Array.isArray(settings) && settings.length > 0) {
      setForm((prev) => ({
        ...prev,
        title: getSettingValue(settings, "title", prev.title),
        home_page_title: getSettingValue(settings, "home_page_title", prev.home_page_title),
        site_tagline: getSettingValue(settings, "site_tagline", prev.site_tagline),
        primary_color: getSettingValue(settings, "primary_color", prev.primary_color),
        currency_symbol: getSettingValue(settings, "currency_symbol", prev.currency_symbol),
        currency_direction: getSettingValue(settings, "currency_direction", prev.currency_direction),
        decimal_separator: getSettingValue(settings, "decimal_separator", prev.decimal_separator),
        thousand_separator: getSettingValue(settings, "thousand_separator", prev.thousand_separator),
        copy_right: getSettingValue(settings, "copy_right", prev.copy_right),
        logo: getSettingValue(settings, "logo", prev.logo),
        favicon: getSettingValue(settings, "favicon", prev.favicon),
        loader: getSettingValue(settings, "loader", prev.loader),
        is_loader: getSettingValue(settings, "is_loader", prev.is_loader),
        feature_image: getSettingValue(settings, "feature_image", prev.feature_image),
        meta_keywords: getSettingValue(settings, "meta_keywords", prev.meta_keywords),
        meta_description: getSettingValue(settings, "meta_description", prev.meta_description),
        meta_image: getSettingValue(settings, "meta_image", prev.meta_image),
        google_search_console_tag: getSettingValue(settings, "google_search_console_tag", prev.google_search_console_tag),
        custom_css: getSettingValue(settings, "custom_css", prev.custom_css),
        google_analytics_id: getSettingValue(settings, "google_analytics_id", prev.google_analytics_id),
        facebook_pixel: getSettingValue(settings, "facebook_pixel", prev.facebook_pixel),
        google_adsense: getSettingValue(settings, "google_adsense", prev.google_adsense),
        custom_header_script: getSettingValue(settings, "custom_header_script", prev.custom_header_script),
        custom_footer_script: getSettingValue(settings, "custom_footer_script", prev.custom_footer_script),
        min_price: getSettingValue(settings, "min_price", prev.min_price),
        max_price: getSettingValue(settings, "max_price", prev.max_price),
        cod_security_advance_bdt: getSettingValue(settings, "cod_security_advance_bdt", prev.cod_security_advance_bdt),
        is_guest_checkout: getSettingValue(settings, "is_guest_checkout", prev.is_guest_checkout),
        is_single_checkout: getSettingValue(settings, "is_single_checkout", prev.is_single_checkout),
        emi_tenures_available: getSettingValue(settings, "emi_tenures_available", prev.emi_tenures_available || "3,6,9,12,18,24,30,36"),
        emi_rates_json: getSettingValue(settings, "emi_rates_json", prev.emi_rates_json),
        primary_phone: getSettingValue(settings, "primary_phone", prev.primary_phone || "+8801676900442"),
        whatsapp_number: getSettingValue(settings, "whatsapp_number", prev.whatsapp_number || "+880 1898-878815"),
        footer_address: getSettingValue(settings, "footer_address", prev.footer_address),
        footer_phone: getSettingValue(settings, "footer_phone", prev.footer_phone),
        footer_email: getSettingValue(settings, "footer_email", prev.footer_email),
        footer_gateway_img: getSettingValue(settings, "footer_gateway_img", prev.footer_gateway_img),
        facebook_url: getSettingValue(settings, "facebook_url", prev.facebook_url),
        youtube_url: getSettingValue(settings, "youtube_url", prev.youtube_url),
        instagram_url: getSettingValue(settings, "instagram_url", prev.instagram_url),
        whatsapp_number: getSettingValue(settings, "whatsapp_number", prev.whatsapp_number),
        twitter_url: getSettingValue(settings, "twitter_url", prev.twitter_url),
        linkedin_url: getSettingValue(settings, "linkedin_url", prev.linkedin_url),
        tiktok_url: getSettingValue(settings, "tiktok_url", prev.tiktok_url),
        working_days_from_to: getSettingValue(settings, "working_days_from_to", prev.working_days_from_to),
        friday_start: getSettingValue(settings, "friday_start", prev.friday_start),
        friday_end: getSettingValue(settings, "friday_end", prev.friday_end),
        satureday_start: getSettingValue(settings, "satureday_start", prev.satureday_start),
        satureday_end: getSettingValue(settings, "satureday_end", prev.satureday_end),
      }));
    }
  }, [settings]);

  // Handle direct file upload (JPG/PNG/WebP) via /api/v1/admin/uploads
  const handleUploadImage = async (file, fieldKey) => {
    if (!file) return;
    setUploadingField(fieldKey);
    setFileNameDisplay((prev) => ({ ...prev, [fieldKey]: file.name }));

    try {
      const token = adminAuthService.getToken();
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "settings");

      const res = await fetch("/api/v1/admin/uploads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await res.json();
      if (json.success && (json.data?.url || json.data?.originalUrl)) {
        const uploadedUrl = json.data?.url || json.data?.originalUrl;
        setForm((prev) => ({ ...prev, [fieldKey]: uploadedUrl }));
        setSuccessBannerMsg("Image uploaded successfully! Remember to click Save Changes to persist.");
        setShowSuccessBanner(true);
      } else {
        alert(json.message || "Failed to upload image. Please try again.");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload image. " + (err.message || ""));
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      const cleanPhone = (form.primary_phone || (form.footer_phone ? form.footer_phone.split(",")[0].trim() : "+8801676900442")).trim();
      const cleanWhatsapp = (form.whatsapp_number || "+880 1898-878815").trim();

      // Also map mirrored fields so storefront components reading showroom_address, primary_phone, etc. get updated
      const payload = {
        ...form,
        primary_phone: cleanPhone,
        whatsapp_number: cleanWhatsapp,
        showroom_address: form.footer_address,
        primary_email: form.footer_email,
        site_name: form.title,
        site_title: form.home_page_title,
      };

      await onSave(payload, "Data Updated Successfully.");

      // Broadcast update immediately to storefront and other windows
      broadcastSettingsUpdate(payload);

      // Direct background sync with /api/v1/admin/settings/contact
      try {
        const token = adminAuthService.getToken();
        if (token) {
          await fetch("/api/v1/admin/settings/contact", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              primary_phone: cleanPhone,
              whatsapp_number: cleanWhatsapp,
              footer_phone: form.footer_phone,
            }),
          });
        }
      } catch (err) {
        console.warn("Contact endpoint background sync:", err);
      }

      setSuccessBannerMsg("Contact hotlines and website data saved successfully! Storefront updated live.");
      setShowSuccessBanner(true);
      // Auto-hide banner after 5s or let user dismiss
      setTimeout(() => setShowSuccessBanner(false), 5000);
    } catch (err) {
      alert("Error saving settings: " + (err.message || ""));
    }
  };

  const verticalTabs = [
    { id: "basic", label: "Basic Information" },
    { id: "hotlines", label: "📞 WhatsApp & Call Desk" },
    { id: "media", label: "Media" },
    { id: "seo", label: "Seo" },
    { id: "custom_css", label: "Custom Css" },
    { id: "scripts", label: "Scripts" },
    { id: "shop", label: "Shop & Checkout Page" },
    { id: "footer_contact", label: "Footer & Contact Page" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", maxWidth: "1280px" }}>
      {/* 1. TOP HEADER BAR */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          padding: "16px 24px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
          {verticalTabs.find((t) => t.id === activeVerticalTab)?.label || "Basic Information"}
        </h2>
      </div>

      {/* 2. DISMISSIBLE GREEN SUCCESS BANNER */}
      {showSuccessBanner && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderLeft: "5px solid #22c55e",
            borderRadius: "6px",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13.5px", color: "#1e293b", fontWeight: 500 }}>
              {successBannerMsg}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccessBanner(false)}
            aria-label="Dismiss message"
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "18px",
              cursor: "pointer",
              lineHeight: 1,
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. MAIN CARD: TWO-COLUMN CONFIGURATION */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          padding: "24px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          display: "flex",
          gap: "32px",
          alignItems: "flex-start",
        }}
      >
        {/* LEFT COLUMN: 7 VERTICAL MENU TABS */}
        <div
          style={{
            width: "220px",
            flexShrink: 0,
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {verticalTabs.map((tab, idx) => {
            const isActive = activeVerticalTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveVerticalTab(tab.id);
                  setShowSuccessBanner(false);
                }}
                style={{
                  padding: "13px 16px",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 500,
                  textAlign: "center",
                  background: isActive ? "#2563eb" : "#ffffff",
                  color: isActive ? "#ffffff" : "#334155",
                  border: "none",
                  borderBottom: idx < verticalTabs.length - 1 ? "1px solid #f1f5f9" : "none",
                  cursor: "pointer",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "#ffffff";
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* RIGHT COLUMN: CONTENT CORRESPONDING TO ACTIVE TAB */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* TAB: WHATSAPP & DIRECT CALL HOTLINE MANAGEMENT */}
          {activeVerticalTab === "hotlines" && (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "860px" }}>
              <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "10px", padding: "18px 20px" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <PhoneCall size={18} color="#2563eb" />
                  Website Contact Hotline & WhatsApp Concierge (হোয়াটসঅ্যাপ ও ডিরেক্ট কল নম্বর কনফিগারেশন)
                </h3>
                <p style={{ margin: "6px 0 0", fontSize: "12.5px", color: "#64748b", lineHeight: 1.5 }}>
                  এখানে আপনি প্রোডাক্ট পেজ এবং কুইক ভিউর <strong>হোয়াটসঅ্যাপ ভিডিও কল বাটন</strong> এবং <strong>ডিরেক্ট কল বাটন</strong>-এর নম্বর সরাসরি এডিট করতে পারবেন। সেভ করার সাথে সাথে ওয়েবসাইটের সব বাটনে নতুন নম্বর স্বয়ংক্রিয়ভাবে কার্যকর হয়ে যাবে।
                </p>
              </div>

              {/* 1. Direct Call Hotline */}
              <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "18px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  <Phone size={16} color="#0f172a" />
                  Direct Showroom Call Hotline (সরাসরি কল বাটন নম্বর) *
                </label>
                <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#64748b" }}>
                  গ্রাহক প্রোডাক্ট পেজে <strong>&ldquo;Call: [নম্বর] / Direct Showroom Desk&rdquo;</strong> কালো বাটনে ক্লিক করলে এই নম্বরে সরাসরি ডায়াল (tel:) হবে।
                </p>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    required
                    placeholder="+8801676900442"
                    value={form.primary_phone}
                    onChange={(e) => setForm({ ...form, primary_phone: e.target.value })}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#0f172a",
                      boxSizing: "border-box",
                    }}
                  />
                  <a
                    href={`tel:${(form.primary_phone || "").replace(/\s+/g, "")}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 16px",
                      background: "#0f172a",
                      color: "#ffffff",
                      borderRadius: "6px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Phone size={14} /> Test Call Dial
                  </a>
                </div>
              </div>

              {/* 2. WhatsApp Official Concierge */}
              <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "18px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  <MessageCircle size={16} color="#16a34a" />
                  Official WhatsApp Hotline (শোরুম ভিডিও ও লাইভ চ্যাট হোয়াটসঅ্যাপ নম্বর) *
                </label>
                <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#64748b" }}>
                  গ্রাহক <strong>&ldquo;Ask for Showroom Video / Live WhatsApp Video &amp; Cam&rdquo;</strong> সবুজ বাটনে ক্লিক করলে এই নম্বরে প্রোডাক্টের নাম ও স্পেক সহ হোয়াটসঅ্যাপ চ্যাট ওপেন হবে।
                </p>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    required
                    placeholder="+880 1898-878815"
                    value={form.whatsapp_number}
                    onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#0f172a",
                      boxSizing: "border-box",
                    }}
                  />
                  <a
                    href={`https://wa.me/${(form.whatsapp_number || "").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 16px",
                      background: "#16a34a",
                      color: "#ffffff",
                      borderRadius: "6px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <MessageCircle size={14} /> Test WhatsApp
                  </a>
                </div>
              </div>

              {/* 3. Footer Multi-Phone Numbers */}
              <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "18px" }}>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Store / Footer Comma-Separated Hotline List (হেডার ও ফুটার ফোন নম্বরসমূহ)
                </label>
                <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#64748b" }}>
                  ওয়েবসাইটের একদম উপরে এবং নিচে ফুটারের যোগাযোগের তালিকায় প্রদর্শিত নম্বরসমূহ (কমা দিয়ে একাধিক নম্বর দেওয়া যায়)।
                </p>
                <input
                  type="text"
                  placeholder="+880 1898-878815, +880 1898-878816, 01676900442"
                  value={form.footer_phone}
                  onChange={(e) => setForm({ ...form, footer_phone: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "13px",
                    color: "#1e293b",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* 4. LIVE BUTTONS PREVIEW AS SEEN ON STOREFRONT */}
              <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "10px", padding: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", marginBottom: "12px" }}>
                  👁️ Live Storefront Product Page Preview (প্রোডাক্ট পেজে যেভাবে দেখাবে)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxWidth: "600px" }}>
                  {/* WhatsApp Emerald Button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      background: "linear-gradient(135deg, #25D366 0%, #1ea952 100%)",
                      color: "#ffffff",
                      height: "48px",
                      borderRadius: "12px",
                      padding: "0 14px",
                      boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
                    }}
                  >
                    <MessageCircle size={18} fill="#ffffff" color="#25D366" />
                    <div style={{ textAlign: "left", lineHeight: 1.15 }}>
                      <div style={{ fontSize: "12.5px", fontWeight: 800 }}>Ask for Showroom Video</div>
                      <div style={{ fontSize: "10.5px", fontWeight: 600, opacity: 0.9 }}>Live WhatsApp Video & Cam</div>
                    </div>
                  </div>

                  {/* Dark Call Button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                      color: "#ffffff",
                      height: "48px",
                      borderRadius: "12px",
                      padding: "0 14px",
                      boxShadow: "0 4px 14px rgba(15, 23, 42, 0.25)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                    }}
                  >
                    <Phone size={16} strokeWidth={2.4} />
                    <div style={{ textAlign: "left", lineHeight: 1.15 }}>
                      <div style={{ fontSize: "12.5px", fontWeight: 800 }}>
                        Call: {form.primary_phone || "+8801676900442"}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600 }}>Direct Showroom Desk</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "12px 36px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: saving ? "wait" : "pointer",
                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                  }}
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 7: FOOTER & CONTACT PAGE (Default active as in screenshot) */}
          {activeVerticalTab === "footer_contact" && (
            <div>
              {/* 3 HORIZONTAL PILLS */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
                {[
                  { id: "basic", label: "Basic" },
                  { id: "social", label: "Social Link" },
                  { id: "working_days", label: "Working Days" },
                ].map((pill) => {
                  const isPillActive = activeFooterPill === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setActiveFooterPill(pill.id)}
                      style={{
                        padding: "8px 32px",
                        borderRadius: "9999px",
                        fontSize: "13px",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        background: isPillActive ? "#2563eb" : "#f1f5f9",
                        color: isPillActive ? "#ffffff" : "#475569",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isPillActive) e.currentTarget.style.background = "#e2e8f0";
                      }}
                      onMouseLeave={(e) => {
                        if (!isPillActive) e.currentTarget.style.background = "#f1f5f9";
                      }}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>

              {/* Bank Credit Card EMI Schedule & Rates Configuration */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "18px 20px",
                  marginTop: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                      💳 Bank Credit Card EMI Schedule & Charges (ইএমআই রেট কনফিগারেশন)
                    </h4>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                      Configure official bank convenience charge percentages per tenure. Changes automatically sync to live website calculators.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultRates = [
                        { tenure: 3, label: "3 Months", rate: 6.00 },
                        { tenure: 6, label: "6 Months", rate: 6.50 },
                        { tenure: 9, label: "9 Months", rate: 6.95 },
                        { tenure: 12, label: "12 Months", rate: 9.29 },
                        { tenure: 18, label: "18 Months", rate: 12.99 },
                        { tenure: 24, label: "24 Months", rate: 18.34 },
                        { tenure: 30, label: "30 Months", rate: 19.76 },
                        { tenure: 36, label: "36 Months", rate: 24.22 },
                      ];
                      setForm((prev) => ({
                        ...prev,
                        emi_tenures_available: "3,6,9,12,18,24,30,36",
                        emi_rates_json: JSON.stringify(defaultRates),
                      }));
                    }}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    Reset to Official Schedule
                  </button>
                </div>

                {/* Rates Table */}
                {(() => {
                  let parsedPlans = [];
                  try {
                    parsedPlans = JSON.parse(form.emi_rates_json || "[]");
                  } catch {
                    parsedPlans = [];
                  }
                  if (!Array.isArray(parsedPlans) || parsedPlans.length === 0) {
                    parsedPlans = [
                      { tenure: 3, label: "3 Months", rate: 6.00 },
                      { tenure: 6, label: "6 Months", rate: 6.50 },
                      { tenure: 9, label: "9 Months", rate: 6.95 },
                      { tenure: 12, label: "12 Months", rate: 9.29 },
                      { tenure: 18, label: "18 Months", rate: 12.99 },
                      { tenure: 24, label: "24 Months", rate: 18.34 },
                      { tenure: 30, label: "30 Months", rate: 19.76 },
                      { tenure: 36, label: "36 Months", rate: 24.22 },
                    ];
                  }

                  const handleRateChange = (tenure, newRate) => {
                    const updated = parsedPlans.map((p) =>
                      p.tenure === tenure ? { ...p, rate: Number(newRate) || 0 } : p
                    );
                    setForm((prev) => ({
                      ...prev,
                      emi_rates_json: JSON.stringify(updated),
                    }));
                  };

                  return (
                    <div style={{ overflowX: "auto", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <table style={{ width: "100%", fontSize: "12.5px", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#f1f5f9", textAlign: "left", borderBottom: "1.5px solid #e2e8f0" }}>
                            <th style={{ padding: "8px 12px", color: "#334155" }}>Tenure (মেয়াদ)</th>
                            <th style={{ padding: "8px 12px", color: "#334155" }}>Bank Charge Rate (%)</th>
                            <th style={{ padding: "8px 12px", color: "#334155" }}>Sample Calc (৳50,000 Order)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedPlans.map((plan) => {
                            const feeAmt = Math.round(50000 * (plan.rate / 100));
                            const total = 50000 + feeAmt;
                            const monthly = Math.round(total / plan.tenure);
                            return (
                              <tr key={plan.tenure} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "8px 12px", fontWeight: "700", color: "#0f172a" }}>
                                  {plan.label || `${plan.tenure} Months`}
                                </td>
                                <td style={{ padding: "8px 12px" }}>
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={plan.rate}
                                      onChange={(e) => handleRateChange(plan.tenure, e.target.value)}
                                      style={{
                                        width: "90px",
                                        padding: "6px 8px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontWeight: "700",
                                        color: "#ec2226",
                                        fontSize: "13px",
                                      }}
                                    />
                                    <span style={{ fontWeight: "700", color: "#64748b" }}>%</span>
                                  </div>
                                </td>
                                <td style={{ padding: "8px 12px", color: "#475569", fontSize: "11.5px" }}>
                                  Fee: +৳{feeAmt.toLocaleString()} • Total: ৳{total.toLocaleString()} • <strong>৳{monthly.toLocaleString()}/mo</strong>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                <div style={{ marginTop: "10px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Active Tenures (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={form.emi_tenures_available}
                    onChange={(e) => setForm({ ...form, emi_tenures_available: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12.5px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* PILL 1: BASIC */}
              {activeFooterPill === "basic" && (
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "780px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                      Store Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.footer_address}
                      onChange={(e) => setForm({ ...form, footer_address: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "13px",
                        color: "#1e293b",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                      Store Phone Number (Footer & Header) *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.footer_phone}
                      onChange={(e) => setForm({ ...form, footer_phone: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "13px",
                        color: "#1e293b",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                        Direct Call Hotline (সরাসরি কল বাটন নম্বর) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="+8801676900442"
                        value={form.primary_phone}
                        onChange={(e) => setForm({ ...form, primary_phone: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          fontSize: "13px",
                          color: "#1e293b",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                        Official WhatsApp Number (হোয়াটসঅ্যাপ নম্বর) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="+8801676900442"
                        value={form.whatsapp_number}
                        onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          fontSize: "13px",
                          color: "#1e293b",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                      Store Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.footer_email}
                      onChange={(e) => setForm({ ...form, footer_email: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "13px",
                        color: "#1e293b",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* CURRENT GATEWAY IMAGE & BROWSE UPLOAD */}
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                      Current Gateway Image
                    </label>

                    {/* IMAGE PREVIEW BOX */}
                    <div
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        padding: "16px",
                        maxWidth: "340px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#ffffff",
                        minHeight: "100px",
                      }}
                    >
                      <img
                        src={resolveSettingImg(form.footer_gateway_img, "https://www.kingletbd.com/storage/images/OM_1760886037KTtGSCGp.png")}
                        alt="Gateway Preview"
                        style={{
                          maxWidth: "321px",
                          maxHeight: "80px",
                          objectFit: "contain",
                          display: "block",
                        }}
                        onError={(e) => {
                          e.currentTarget.src = "/assets/authentic-cards-gateway.png";
                        }}
                      />
                    </div>

                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", marginBottom: "10px" }}>
                      Image Size Should Be 321 x 31.
                    </div>

                    {/* UPLOAD IMAGE / BROWSE BUTTON */}
                    <div style={{ display: "flex", maxWidth: "420px" }}>
                      <input
                        type="text"
                        readOnly
                        placeholder="Upload Image..."
                        value={fileNameDisplay.footer_gateway_img || (form.footer_gateway_img ? form.footer_gateway_img.split("/").pop() : "")}
                        style={{
                          flex: 1,
                          padding: "9px 12px",
                          border: "1px solid #cbd5e1",
                          borderRight: "none",
                          borderTopLeftRadius: "6px",
                          borderBottomLeftRadius: "6px",
                          background: "#f8fafc",
                          fontSize: "13px",
                          color: "#64748b",
                        }}
                      />
                      <button
                        type="button"
                        disabled={uploadingField === "footer_gateway_img"}
                        onClick={() => gatewayImgRef.current && gatewayImgRef.current.click()}
                        style={{
                          padding: "9px 20px",
                          background: "#e2e8f0",
                          border: "1px solid #cbd5e1",
                          borderTopRightRadius: "6px",
                          borderBottomRightRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#334155",
                          cursor: "pointer",
                        }}
                      >
                        {uploadingField === "footer_gateway_img" ? "Uploading..." : "Browse"}
                      </button>
                      <input
                        type="file"
                        ref={gatewayImgRef}
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadImage(e.target.files[0], "footer_gateway_img");
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        padding: "10px 32px",
                        background: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13.5px",
                        fontWeight: 600,
                        cursor: saving ? "wait" : "pointer",
                      }}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}

              {/* PILL 2: SOCIAL LINK */}
              {activeFooterPill === "social" && (
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "780px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Facebook Page URL</label>
                    <input
                      type="url"
                      value={form.facebook_url}
                      onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>YouTube Channel URL</label>
                    <input
                      type="text"
                      value={form.youtube_url}
                      onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Instagram Profile URL</label>
                    <input
                      type="url"
                      value={form.instagram_url}
                      onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>WhatsApp Hotline / Order Number</label>
                    <input
                      type="text"
                      value={form.whatsapp_number}
                      onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Twitter / X URL</label>
                    <input
                      type="url"
                      value={form.twitter_url}
                      onChange={(e) => setForm({ ...form, twitter_url: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>LinkedIn Company URL</label>
                    <input
                      type="url"
                      value={form.linkedin_url}
                      onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>TikTok URL</label>
                    <input
                      type="url"
                      value={form.tiktok_url}
                      onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        padding: "10px 32px",
                        background: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13.5px",
                        fontWeight: 600,
                        cursor: saving ? "wait" : "pointer",
                      }}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}

              {/* PILL 3: WORKING DAYS */}
              {activeFooterPill === "working_days" && (
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "780px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Working Days (Summary Text) *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.working_days_from_to}
                      onChange={(e) => setForm({ ...form, working_days_from_to: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                        Friday Hours - Start Time *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.friday_start}
                        onChange={(e) => setForm({ ...form, friday_start: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                        Friday Hours - End Time *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.friday_end}
                        onChange={(e) => setForm({ ...form, friday_end: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                        Saturday to Thursday - Start Time *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.satureday_start}
                        onChange={(e) => setForm({ ...form, satureday_start: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                        Saturday to Thursday - End Time *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.satureday_end}
                        onChange={(e) => setForm({ ...form, satureday_end: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        padding: "10px 32px",
                        background: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13.5px",
                        fontWeight: 600,
                        cursor: saving ? "wait" : "pointer",
                      }}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 1: BASIC INFORMATION */}
          {activeVerticalTab === "basic" && (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "780px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Brand / Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Primary Theme Color
                  </label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="color"
                      value={form.primary_color || "#EC2226"}
                      onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                      style={{ width: "40px", height: "40px", border: "1px solid #cbd5e1", borderRadius: "6px", padding: 0, cursor: "pointer" }}
                    />
                    <input
                      type="text"
                      value={form.primary_color}
                      onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                      style={{ flex: 1, padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Home Page Browser Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.home_page_title}
                  onChange={(e) => setForm({ ...form, home_page_title: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Brand Tagline / Timber Guarantee
                </label>
                <input
                  type="text"
                  value={form.site_tagline}
                  onChange={(e) => setForm({ ...form, site_tagline: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Currency Symbol</label>
                  <input
                    type="text"
                    value={form.currency_symbol}
                    onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Currency Direction</label>
                  <select
                    value={form.currency_direction}
                    onChange={(e) => setForm({ ...form, currency_direction: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", background: "#ffffff" }}
                  >
                    <option value="0">Left (৳ 100)</option>
                    <option value="1">Right (100 ৳)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Decimal Separator</label>
                  <input
                    type="text"
                    value={form.decimal_separator}
                    onChange={(e) => setForm({ ...form, decimal_separator: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Thousand Separator</label>
                  <input
                    type="text"
                    value={form.thousand_separator}
                    onChange={(e) => setForm({ ...form, thousand_separator: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Direct Hotlines quick view in Basic */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1.5px solid #e2e8f0" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    📞 Direct Call Hotline (সরাসরি কল বাটন নম্বর) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+8801676900442"
                    value={form.primary_phone}
                    onChange={(e) => setForm({ ...form, primary_phone: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", background: "#ffffff" }}
                  />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Product page call button dial</span>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    💬 WhatsApp Hotline (হোয়াটসঅ্যাপ নম্বর) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+880 1898-878815"
                    value={form.whatsapp_number}
                    onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", background: "#ffffff" }}
                  />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Showroom video WhatsApp button</span>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Copyright Text
                </label>
                <textarea
                  rows={3}
                  value={form.copy_right}
                  onChange={(e) => setForm({ ...form, copy_right: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div style={{ marginTop: "12px" }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 32px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MEDIA */}
          {activeVerticalTab === "media" && (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "780px" }}>
              {/* LOGO */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Current Logo</label>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "16px", maxWidth: "260px", background: "#f8fafc", minHeight: "70px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={resolveSettingImg(form.logo)}
                    alt="Logo"
                    style={{ maxWidth: "160px", maxHeight: "55px", objectFit: "contain" }}
                    onError={(e) => { e.currentTarget.src = "/assets/kinglet-logo.svg"; }}
                  />
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", margin: "6px 0 8px" }}>Image Size Should Be 160 x 55.</div>
                <div style={{ display: "flex", maxWidth: "420px" }}>
                  <input
                    type="text"
                    readOnly
                    placeholder="Upload Image..."
                    value={fileNameDisplay.logo || (form.logo ? form.logo.split("/").pop() : "")}
                    style={{ flex: 1, padding: "9px 12px", border: "1px solid #cbd5e1", borderRight: "none", borderTopLeftRadius: "6px", borderBottomLeftRadius: "6px", background: "#f8fafc", fontSize: "13px" }}
                  />
                  <button
                    type="button"
                    disabled={uploadingField === "logo"}
                    onClick={() => logoImgRef.current && logoImgRef.current.click()}
                    style={{ padding: "9px 20px", background: "#e2e8f0", border: "1px solid #cbd5e1", borderTopRightRadius: "6px", borderBottomRightRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    {uploadingField === "logo" ? "Uploading..." : "Browse"}
                  </button>
                  <input type="file" ref={logoImgRef} accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], "logo")} />
                </div>
              </div>

              {/* FAVICON */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Current Favicon</label>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px", maxWidth: "90px", background: "#f8fafc", minHeight: "70px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={resolveSettingImg(form.favicon)}
                    alt="Favicon"
                    style={{ maxWidth: "60px", maxHeight: "60px", objectFit: "contain" }}
                    onError={(e) => { e.currentTarget.src = "/favicon.ico"; }}
                  />
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", margin: "6px 0 8px" }}>Image Size Should Be 60 x 60.</div>
                <div style={{ display: "flex", maxWidth: "420px" }}>
                  <input
                    type="text"
                    readOnly
                    placeholder="Upload Image..."
                    value={fileNameDisplay.favicon || (form.favicon ? form.favicon.split("/").pop() : "")}
                    style={{ flex: 1, padding: "9px 12px", border: "1px solid #cbd5e1", borderRight: "none", borderTopLeftRadius: "6px", borderBottomLeftRadius: "6px", background: "#f8fafc", fontSize: "13px" }}
                  />
                  <button
                    type="button"
                    disabled={uploadingField === "favicon"}
                    onClick={() => faviconImgRef.current && faviconImgRef.current.click()}
                    style={{ padding: "9px 20px", background: "#e2e8f0", border: "1px solid #cbd5e1", borderTopRightRadius: "6px", borderBottomRightRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    {uploadingField === "favicon" ? "Uploading..." : "Browse"}
                  </button>
                  <input type="file" ref={faviconImgRef} accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], "favicon")} />
                </div>
              </div>

              {/* PRELOADER */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Current Loader Image</label>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px", maxWidth: "90px", background: "#f8fafc", minHeight: "70px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={resolveSettingImg(form.loader)}
                    alt="Loader"
                    style={{ maxWidth: "60px", maxHeight: "60px", objectFit: "contain" }}
                  />
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", margin: "6px 0 8px" }}>Image Size Should Be 60 x 60.</div>
                <div style={{ display: "flex", maxWidth: "420px" }}>
                  <input
                    type="text"
                    readOnly
                    placeholder="Upload Image..."
                    value={fileNameDisplay.loader || (form.loader ? form.loader.split("/").pop() : "")}
                    style={{ flex: 1, padding: "9px 12px", border: "1px solid #cbd5e1", borderRight: "none", borderTopLeftRadius: "6px", borderBottomLeftRadius: "6px", background: "#f8fafc", fontSize: "13px" }}
                  />
                  <button
                    type="button"
                    disabled={uploadingField === "loader"}
                    onClick={() => loaderImgRef.current && loaderImgRef.current.click()}
                    style={{ padding: "9px 20px", background: "#e2e8f0", border: "1px solid #cbd5e1", borderTopRightRadius: "6px", borderBottomRightRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    {uploadingField === "loader" ? "Uploading..." : "Browse"}
                  </button>
                  <input type="file" ref={loaderImgRef} accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], "loader")} />
                </div>

                <div style={{ marginTop: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>Loader Status</label>
                  <select
                    value={form.is_loader}
                    onChange={(e) => setForm({ ...form, is_loader: e.target.value })}
                    style={{ width: "200px", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#ffffff" }}
                  >
                    <option value="0">Inactive (0)</option>
                    <option value="1">Active (1)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: "12px" }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 32px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SEO */}
          {activeVerticalTab === "seo" && (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "780px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Meta Keywords
                </label>
                <textarea
                  rows={3}
                  value={form.meta_keywords}
                  onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Meta Description
                </label>
                <textarea
                  rows={4}
                  value={form.meta_description}
                  onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Google Search Console Verification Tag / Content Token
                </label>
                <input
                  type="text"
                  placeholder="e.g. google-site-verification=abcdef12345"
                  value={form.google_search_console_tag}
                  onChange={(e) => setForm({ ...form, google_search_console_tag: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Meta Share Image</label>
                <div style={{ display: "flex", maxWidth: "420px" }}>
                  <input
                    type="text"
                    readOnly
                    placeholder="Upload Image..."
                    value={fileNameDisplay.meta_image || (form.meta_image ? form.meta_image.split("/").pop() : "")}
                    style={{ flex: 1, padding: "9px 12px", border: "1px solid #cbd5e1", borderRight: "none", borderTopLeftRadius: "6px", borderBottomLeftRadius: "6px", background: "#f8fafc", fontSize: "13px" }}
                  />
                  <button
                    type="button"
                    disabled={uploadingField === "meta_image"}
                    onClick={() => metaImgRef.current && metaImgRef.current.click()}
                    style={{ padding: "9px 20px", background: "#e2e8f0", border: "1px solid #cbd5e1", borderTopRightRadius: "6px", borderBottomRightRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    {uploadingField === "meta_image" ? "Uploading..." : "Browse"}
                  </button>
                  <input type="file" ref={metaImgRef} accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], "meta_image")} />
                </div>
              </div>

              <div style={{ marginTop: "12px" }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 32px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: CUSTOM CSS */}
          {activeVerticalTab === "custom_css" && (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "780px" }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: "6px", fontSize: "12.5px", color: "#475569" }}>
                💡 <strong>Dynamic CSS Injection:</strong> Any custom CSS styles written here will be instantly injected into the storefront <code style={{ background: "#e2e8f0", padding: "2px 4px", borderRadius: "4px" }}>&lt;head&gt;</code> tag in real time across the website.
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Custom CSS Editor
                </label>
                <textarea
                  rows={14}
                  placeholder="/* e.g. .kinglet-authentic-footer { background: #0f172a !important; } */"
                  value={form.custom_css}
                  onChange={(e) => setForm({ ...form, custom_css: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "14px",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: "13px",
                    background: "#0f172a",
                    color: "#38bdf8",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                    lineHeight: "1.5",
                  }}
                />
              </div>

              <div style={{ marginTop: "12px" }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 32px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: SCRIPTS */}
          {activeVerticalTab === "scripts" && (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "780px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Google Analytics Measurement ID (GA4) / Tracking ID
                </label>
                <input
                  type="text"
                  placeholder="UA-106757798-1 or G-XXXXXXXXXX"
                  value={form.google_analytics_id}
                  onChange={(e) => setForm({ ...form, google_analytics_id: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Facebook Pixel Script / Tag
                </label>
                <textarea
                  rows={4}
                  placeholder="<!-- Meta Pixel Code -->"
                  value={form.facebook_pixel}
                  onChange={(e) => setForm({ ...form, facebook_pixel: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Google AdSense Code
                </label>
                <textarea
                  rows={3}
                  value={form.google_adsense}
                  onChange={(e) => setForm({ ...form, google_adsense: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginTop: "12px" }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 32px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 6: SHOP & CHECKOUT PAGE */}
          {activeVerticalTab === "shop" && (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "780px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Minimum Catalog Filter Price (৳)
                  </label>
                  <input
                    type="number"
                    value={form.min_price}
                    onChange={(e) => setForm({ ...form, min_price: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Maximum Catalog Filter Price (৳)
                  </label>
                  <input
                    type="number"
                    value={form.max_price}
                    onChange={(e) => setForm({ ...form, max_price: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Mandatory COD Security Advance Amount (৳ BDT)
                </label>
                <input
                  type="number"
                  value={form.cod_security_advance_bdt}
                  onChange={(e) => setForm({ ...form, cod_security_advance_bdt: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                />
                <span style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px", display: "block" }}>
                  Advance deposit required via bKash / Bank transfer before factory dispatch for Cash on Delivery orders.
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Guest Checkout
                  </label>
                  <select
                    value={form.is_guest_checkout}
                    onChange={(e) => setForm({ ...form, is_guest_checkout: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#ffffff", boxSizing: "border-box" }}
                  >
                    <option value="1">Enabled</option>
                    <option value="0">Disabled (Requires Login)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Single Page Checkout
                  </label>
                  <select
                    value={form.is_single_checkout}
                    onChange={(e) => setForm({ ...form, is_single_checkout: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#ffffff", boxSizing: "border-box" }}
                  >
                    <option value="1">Enabled (One-Step Frictionless)</option>
                    <option value="0">Disabled (Multi-Step)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: "12px" }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 32px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. HOME NOTICE SCROLLER TAB
// ----------------------------------------------------------------------
export function NoticeScrollerTab({ settings, onSave, saving }) {
  const [enabled, setEnabled] = useState(getSettingValue(settings, "notice_scroller_enabled", "true") === "true");
  const [text, setText] = useState(
    getSettingValue(
      settings,
      "notice_scroller_text",
      "✨ Winter Season Luxury Offer: Get up to 25% Off on Seasoned Solid Mahogany Bedroom Suites • 0% EMI across 18 Banks • Free Assembly in Dhaka • Call Hotline: +8801676900442"
    )
  );
  const [bg, setBg] = useState(getSettingValue(settings, "notice_scroller_bg", "#0f172a"));
  const [speed, setSpeed] = useState(getSettingValue(settings, "notice_scroller_speed", "28s"));

  useEffect(() => {
    setEnabled(getSettingValue(settings, "notice_scroller_enabled", "true") === "true");
    setText(getSettingValue(settings, "notice_scroller_text", "✨ Winter Season Luxury Offer: Get up to 25% Off on Seasoned Solid Mahogany Bedroom Suites..."));
    setBg(getSettingValue(settings, "notice_scroller_bg", "#0f172a"));
    setSpeed(getSettingValue(settings, "notice_scroller_speed", "28s"));
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(
      {
        notice_scroller_enabled: enabled ? "true" : "false",
        notice_scroller_text: text,
        notice_scroller_bg: bg,
        notice_scroller_speed: speed,
      },
      "Notice Scroller updated successfully!"
    );
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
        📢 Home Notice Scroller
      </h2>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
        Manage the animated announcement ticker running at the very top of Kinglet's storefront header.
      </p>

      {/* Live Preview Box */}
      <div style={{ marginBottom: "22px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
          Live Storefront Header Preview:
        </span>
        <div style={{ background: bg, color: "#ffffff", padding: "8px 16px", borderRadius: "6px", fontSize: "12.5px", fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap" }}>
          <div style={{ display: "inline-block", animation: "marquee 20s linear infinite" }}>
            {enabled ? text : "⚠️ Notice Scroller is currently disabled and hidden from storefront."}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <input
            type="checkbox"
            id="scroller-toggle"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: "18px", height: "18px", accentColor: "#0f172a", cursor: "pointer" }}
          />
          <label htmlFor="scroller-toggle" style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", cursor: "pointer" }}>
            Enable Top Notice Scroller on Storefront
          </label>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Announcement Ticker Text *
          </label>
          <textarea
            rows={3}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
              Background Color
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="color"
                value={bg.startsWith("#") ? bg : "#0f172a"}
                onChange={(e) => setBg(e.target.value)}
                style={{ width: "40px", height: "36px", border: "none", cursor: "pointer", borderRadius: "4px" }}
              />
              <input
                type="text"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                style={{ flexGrow: 1, padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
              Animation Cycle Speed
            </label>
            <select
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#ffffff" }}
            >
              <option value="18s">Fast (18 seconds)</option>
              <option value="28s">Normal / Recommended (28 seconds)</option>
              <option value="40s">Slow (40 seconds)</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: "8px" }}>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
          >
            {saving ? "Saving..." : "Save Notice Scroller"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. MENU BUILDER TAB
// ----------------------------------------------------------------------
export function MenuBuilderTab({ settings, onSave, saving }) {
  const defaultMenu = [
    { label: "Home", url: "/" },
    { label: "Bed Room", url: "/category/bed-room" },
    { label: "Living Room", url: "/category/living-room" },
    { label: "Dining", url: "/category/dining" },
    { label: "Door", url: "/category/door" },
    { label: "Office", url: "/category/office" },
    { label: "Interior", url: "/interior" },
    { label: "Offers", url: "/offers" },
    { label: "Showrooms", url: "/showrooms" },
  ];

  const [items, setItems] = useState(() => {
    try {
      const raw = getSettingValue(settings, "site_navigation_menu", "");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return defaultMenu;
  });

  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newLabel.trim() || !newUrl.trim()) return;
    setItems([...items, { label: newLabel.trim(), url: newUrl.trim() }]);
    setNewLabel("");
    setNewUrl("");
  };

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleMove = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    const temp = copy[idx];
    copy[idx] = copy[target];
    copy[target] = temp;
    setItems(copy);
  };

  const handleSave = () => {
    onSave({ site_navigation_menu: JSON.stringify(items) }, "Navigation menu updated successfully!");
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            📑 Header Menu Builder
          </h2>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Add, reorder, and configure the links displayed in Kinglet's main navigation bar.
          </span>
        </div>
        <button
          onClick={() => setItems(defaultMenu)}
          style={{ padding: "6px 12px", border: "1px solid #cbd5e1", background: "#f8fafc", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
        >
          Reset to Defaults
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "600px", marginBottom: "20px" }}>
        {items.map((it, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700, width: "16px" }}>{idx + 1}.</span>
              <strong style={{ fontSize: "13.5px", color: "#0f172a" }}>{it.label}</strong>
              <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>({it.url})</span>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                type="button"
                onClick={() => handleMove(idx, -1)}
                disabled={idx === 0}
                style={{ padding: "4px 8px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "11px", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.4 : 1 }}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => handleMove(idx, 1)}
                disabled={idx === items.length - 1}
                style={{ padding: "4px 8px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "11px", cursor: idx === items.length - 1 ? "default" : "pointer", opacity: idx === items.length - 1 ? 0.4 : 1 }}
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => handleRemoveItem(idx)}
                style={{ padding: "4px 8px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "4px", fontSize: "11px", fontWeight: 700, cursor: "pointer", marginLeft: "4px" }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Link */}
      <form onSubmit={handleAddItem} style={{ display: "flex", gap: "10px", maxWidth: "600px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Menu Label (e.g. Dining Sets)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
        />
        <input
          type="text"
          placeholder="Destination URL (e.g. /category/dining)"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
        />
        <button
          type="submit"
          style={{ padding: "8px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
        >
          + Add Link
        </button>
      </form>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{ padding: "10px 24px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
      >
        {saving ? "Saving Menu..." : "Save Navigation Menu"}
      </button>
    </div>
  );
}

// ----------------------------------------------------------------------
// 4. HOME PAGE SECTIONS TAB
// ----------------------------------------------------------------------
export function HomePageTab({ settings, onSave, saving }) {
  const [sections, setSections] = useState(() => {
    try {
      const raw = getSettingValue(settings, "home_page_sections", "");
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      showHeroSlider: true,
      showQuickCategories: true,
      showNewArrivals: true,
      showBorderlessShowcase: true,
      showWinterSale: true,
      showAuthorityBlock: true,
      newArrivalsHeading: "New Arrivals & Signature Collections",
      featuredHeading: "Signature Kiln-Seasoned Teak & Mahogany",
    };
  });

  const handleToggle = (key) => {
    setSections({ ...sections, [key]: !sections[key] });
  };

  const handleSave = () => {
    onSave({ home_page_sections: JSON.stringify(sections) }, "Homepage layout saved successfully!");
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
        🏠 Home Page Sections & Layout
      </h2>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
        Control which sections appear on the homepage, customize section titles, and tailor the customer discovery flow.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "650px", marginBottom: "20px" }}>
        {[
          { key: "showHeroSlider", label: "Full-Bleed 4K Hero Slider", desc: "Top dynamic banner slider with CTA collection links" },
          { key: "showBorderlessShowcase", label: "Borderless 4-Card Visual Showcase", desc: "Curated category visual highlights" },
          { key: "showQuickCategories", label: "Quick Category Squircle Badges", desc: "Horizontal icon row for instant room filtering" },
          { key: "showNewArrivals", label: "New Arrivals & Signature Grid", desc: "Real-time product cards with add-to-cart & wood finish options" },
          { key: "showWinterSale", label: "Winter Clearance / Promo Banner", desc: "Promotional banner section" },
          { key: "showAuthorityBlock", label: "Bangladesh Buyers & Pricing Authority Block", desc: "Comprehensive SEO content, pricing index, and FAQs for Google #1 ranking" },
        ].map((sec) => (
          <div
            key={sec.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: sections[sec.key] ? "#f0fdf4" : "#f8fafc",
              border: `1px solid ${sections[sec.key] ? "#bbf7d0" : "#e2e8f0"}`,
              borderRadius: "8px",
            }}
          >
            <div>
              <strong style={{ fontSize: "13.5px", color: "#0f172a", display: "block" }}>{sec.label}</strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>{sec.desc}</span>
            </div>
            <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(sections[sec.key])}
                onChange={() => handleToggle(sec.key)}
                style={{ width: "18px", height: "18px", accentColor: "#15803d", cursor: "pointer" }}
              />
            </label>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: "650px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            New Arrivals Section Heading
          </label>
          <input
            type="text"
            value={sections.newArrivalsHeading || ""}
            onChange={(e) => setSections({ ...sections, newArrivalsHeading: e.target.value })}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
      >
        {saving ? "Saving..." : "Save Homepage Layout"}
      </button>
    </div>
  );
}

// ----------------------------------------------------------------------
// 5. VISIBILITY TAB
// ----------------------------------------------------------------------
export function VisibilityTab({ settings, onSave, saving }) {
  const [vis, setVis] = useState(() => {
    try {
      const raw = getSettingValue(settings, "site_feature_visibility", "");
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      enableWishlist: true,
      enableCompare: true,
      enableFloatingWhatsApp: true,
      enableEmiModal: true,
      enableCustomerReviews: true,
      enableCustomSizingModal: true,
      enableQuickView: true,
    };
  });

  const handleToggle = (k) => setVis({ ...vis, [k]: !vis[k] });

  const handleSave = () => {
    onSave({ site_feature_visibility: JSON.stringify(vis) }, "Visibility rules saved successfully!");
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
        👁️ Storefront Features Visibility
      </h2>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
        Enable or disable customer interactive widgets, floating concierge, and comparison drawers.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "620px", marginBottom: "20px" }}>
        {[
          { key: "enableWishlist", label: "Wishlist Drawer & Heart Buttons", desc: "Allow shoppers to save pieces across sessions" },
          { key: "enableCompare", label: "Product Compare Drawer", desc: "Allow side-by-side dimension and timber comparisons" },
          { key: "enableFloatingWhatsApp", label: "Floating WhatsApp / Helpline Concierge", desc: "Pulsing 24/7 button on bottom right" },
          { key: "enableEmiModal", label: "Bank EMI Calculator on Product Pages", desc: "Monthly installment planner across 18 partner banks" },
          { key: "enableCustomerReviews", label: "Customer Reviews & Star Ratings", desc: "Display and allow review submissions" },
          { key: "enableCustomSizingModal", label: "Custom Dimensions Consultation Lead Modal", desc: "Allow bespoke room sizing inquiries" },
        ].map((it) => (
          <div
            key={it.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: vis[it.key] ? "#f0fdf4" : "#f8fafc",
              border: `1px solid ${vis[it.key] ? "#bbf7d0" : "#e2e8f0"}`,
              borderRadius: "8px",
            }}
          >
            <div>
              <strong style={{ fontSize: "13.5px", color: "#0f172a", display: "block" }}>{it.label}</strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>{it.desc}</span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(vis[it.key])}
              onChange={() => handleToggle(it.key)}
              style={{ width: "18px", height: "18px", accentColor: "#15803d", cursor: "pointer" }}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
      >
        {saving ? "Saving..." : "Save Visibility Settings"}
      </button>
    </div>
  );
}

// ----------------------------------------------------------------------
// 6. STORAGE SETTINGS TAB
// ----------------------------------------------------------------------
export function StorageSettingsTab({ settings, onSave, saving }) {
  const [driver, setDriver] = useState(getSettingValue(settings, "storage_driver", "local"));
  const [maxMb, setMaxMb] = useState(getSettingValue(settings, "max_upload_size_mb", "15"));

  const handleSave = (e) => {
    e.preventDefault();
    onSave(
      {
        storage_driver: driver,
        max_upload_size_mb: String(maxMb),
      },
      "Storage configurations updated!"
    );
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
        💾 Storage & Asset Upload Engine
      </h2>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
        Configure persistent product image storage, automated WebP compression, and upload limits.
      </p>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "600px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Storage Driver</label>
          <select
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#fff" }}
          >
            <option value="local">Persistent Local Object Storage (/storage/objects) • Active</option>
            <option value="s3">Amazon S3 / Cloudflare R2 Compatible</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Max Image Upload Limit (MB)</label>
          <input
            type="number"
            min="2"
            max="50"
            value={maxMb}
            onChange={(e) => setMaxMb(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#475569" }}>
          ⚡ <strong>Sharp Automated WebP Pipeline:</strong> All uploaded furniture images are automatically converted to high-performance WebP formats, reducing page load size by ~70% while preserving timber grain fidelity.
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
          >
            {saving ? "Saving..." : "Save Storage Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------
// 7. SOCIAL LOGIN TAB
// ----------------------------------------------------------------------
export function SocialLoginTab({ settings, onSave, saving }) {
  const [googleEnabled, setGoogleEnabled] = useState(getSettingValue(settings, "google_login_enabled", "false") === "true");
  const [googleClientId, setGoogleClientId] = useState(getSettingValue(settings, "google_client_id", ""));
  const [facebookEnabled, setFacebookEnabled] = useState(getSettingValue(settings, "facebook_login_enabled", "false") === "true");
  const [facebookAppId, setFacebookAppId] = useState(getSettingValue(settings, "facebook_app_id", ""));

  const handleSave = (e) => {
    e.preventDefault();
    onSave(
      {
        google_login_enabled: googleEnabled ? "true" : "false",
        google_client_id: googleClientId,
        facebook_login_enabled: facebookEnabled ? "true" : "false",
        facebook_app_id: facebookAppId,
      },
      "Social login credentials updated!"
    );
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
        🔑 Social Login & OAuth
      </h2>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
        Allow customers to quickly log in and synchronize their furniture wishlist via Google or Facebook.
      </p>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "650px" }}>
        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <strong style={{ fontSize: "14px", color: "#0f172a" }}>Google OAuth 2.0 Login</strong>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={googleEnabled}
                onChange={(e) => setGoogleEnabled(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#0f172a" }}
              />
              Active
            </label>
          </div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Google Client ID</label>
          <input
            type="text"
            placeholder="e.g. 123456789-xxxx.apps.googleusercontent.com"
            value={googleClientId}
            onChange={(e) => setGoogleClientId(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <strong style={{ fontSize: "14px", color: "#0f172a" }}>Facebook Login</strong>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={facebookEnabled}
                onChange={(e) => setFacebookEnabled(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#0f172a" }}
              />
              Active
            </label>
          </div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Facebook App ID</label>
          <input
            type="text"
            placeholder="e.g. 987654321098765"
            value={facebookAppId}
            onChange={(e) => setFacebookAppId(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
          >
            {saving ? "Saving..." : "Save Social Login"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------
// 8. EMAIL SETTINGS TAB
// ----------------------------------------------------------------------
export function EmailSettingsTab({ settings, onSave, saving }) {
  const [form, setForm] = useState({
    smtp_host: getSettingValue(settings, "smtp_host", "smtp.gmail.com"),
    smtp_port: getSettingValue(settings, "smtp_port", "587"),
    smtp_user: getSettingValue(settings, "smtp_user", "info.kingletbd@gmail.com"),
    smtp_from_name: getSettingValue(settings, "smtp_from_name", "Kinglet Furniture & Interior"),
    smtp_encryption: getSettingValue(settings, "smtp_encryption", "tls"),
  });

  const handleSave = (e) => {
    e.preventDefault();
    onSave(form, "Email SMTP settings updated!");
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
        ✉️ Outgoing Email (SMTP) Settings
      </h2>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
        Configure mail delivery for official PDF invoices and order confirmation receipts.
      </p>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "650px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>SMTP Host</label>
            <input
              type="text"
              required
              value={form.smtp_host}
              onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Port</label>
            <input
              type="text"
              required
              value={form.smtp_port}
              onChange={(e) => setForm({ ...form, smtp_port: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Sender Name</label>
            <input
              type="text"
              required
              value={form.smtp_from_name}
              onChange={(e) => setForm({ ...form, smtp_from_name: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Encryption</label>
            <select
              value={form.smtp_encryption}
              onChange={(e) => setForm({ ...form, smtp_encryption: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#fff" }}
            >
              <option value="tls">TLS (Port 587)</option>
              <option value="ssl">SSL (Port 465)</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Sender Email Account</label>
          <input
            type="email"
            required
            value={form.smtp_user}
            onChange={(e) => setForm({ ...form, smtp_user: e.target.value })}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
          >
            {saving ? "Saving..." : "Save Email Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------
// 9. SMS SETTINGS TAB
// ----------------------------------------------------------------------
export function SmsSettingsTab({ settings, onSave, saving }) {
  const [provider, setProvider] = useState(getSettingValue(settings, "sms_provider", "mim_sms"));
  const [senderId, setSenderId] = useState(getSettingValue(settings, "sms_sender_id", "KINGLET"));
  const [orderTemplate, setOrderTemplate] = useState(
    getSettingValue(
      settings,
      "sms_order_placed_template",
      "Dear {customer_name}, your Kinglet Furniture order {order_number} has been received. Track live: https://www.kingletbd.com/track-order?code={tracking_code}"
    )
  );

  const handleSave = (e) => {
    e.preventDefault();
    onSave(
      {
        sms_provider: provider,
        sms_sender_id: senderId,
        sms_order_placed_template: orderTemplate,
      },
      "SMS gateway configuration updated!"
    );
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
        📱 SMS Gateway & Order Notifications
      </h2>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
        Configure Bangladeshi SMS gateways to automatically dispatch tracking codes upon checkout and delivery.
      </p>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "650px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>SMS Gateway</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#fff" }}
            >
              <option value="mim_sms">MIM SMS (Bangladeshi Direct Route)</option>
              <option value="greenweb">Greenweb Bangladesh</option>
              <option value="ssl_wireless">SSL Wireless Telemetry</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Sender ID (BTRC Masking)</label>
            <input
              type="text"
              required
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Order Placed Customer SMS Template
          </label>
          <textarea
            rows={3}
            required
            value={orderTemplate}
            onChange={(e) => setOrderTemplate(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
          />
          <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "4px" }}>
            Supported tags: <code>{"{customer_name}"}</code>, <code>{"{order_number}"}</code>, <code>{"{tracking_code}"}</code>
          </span>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
          >
            {saving ? "Saving..." : "Save SMS Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------
// 10. ANNOUNCEMENT TAB
// ----------------------------------------------------------------------
export function AnnouncementTab({ settings, onSave, saving }) {
  const [enabled, setEnabled] = useState(getSettingValue(settings, "announcement_enabled", "false") === "true");
  const [title, setTitle] = useState(getSettingValue(settings, "announcement_title", "🎉 Exclusive Winter Bridal Furniture Packages"));
  const [message, setMessage] = useState(
    getSettingValue(
      settings,
      "announcement_message",
      "Visit our Mirpur Flagship Experience Hub or order online to get instant flat 10% cash discount & 10-year replacement warranty on solid mahogany bedroom sets!"
    )
  );
  const [btnText, setBtnText] = useState(getSettingValue(settings, "announcement_button_text", "Explore Bridal Offers →"));
  const [btnUrl, setBtnUrl] = useState(getSettingValue(settings, "announcement_button_url", "/offers"));

  const handleSave = (e) => {
    e.preventDefault();
    onSave(
      {
        announcement_enabled: enabled ? "true" : "false",
        announcement_title: title,
        announcement_message: message,
        announcement_button_text: btnText,
        announcement_button_url: btnUrl,
      },
      "Announcement popup updated!"
    );
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
        🎉 Promotional Announcement Modal
      </h2>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
        Display an attractive promotional popup modal when visitors arrive on Kinglet's storefront.
      </p>

      {/* Live Preview */}
      <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px", maxWidth: "550px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
          Live Customer Popup Preview:
        </span>
        <div style={{ background: "#fff", padding: "18px", borderRadius: "10px", border: "2px solid #ef4444", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
          <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>{title}</h4>
          <p style={{ fontSize: "12.5px", color: "#475569", margin: "0 0 14px", lineHeight: "1.4" }}>{message}</p>
          <div style={{ display: "inline-block", padding: "8px 16px", background: "#ec2226", color: "#fff", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
            {btnText}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "650px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <input
            type="checkbox"
            id="announcement-toggle"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: "18px", height: "18px", accentColor: "#0f172a", cursor: "pointer" }}
          />
          <label htmlFor="announcement-toggle" style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", cursor: "pointer" }}>
            Enable Promotional Announcement Popup on Storefront
          </label>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Modal Headline</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Offer Description</label>
          <textarea
            rows={3}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>CTA Button Text</label>
            <input
              type="text"
              required
              value={btnText}
              onChange={(e) => setBtnText(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Destination URL</label>
            <input
              type="text"
              required
              value={btnUrl}
              onChange={(e) => setBtnUrl(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
          >
            {saving ? "Saving..." : "Save Announcement"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------
// 11. COOKIES ALERT TAB
// ----------------------------------------------------------------------
export function CookiesAlertTab({ settings, onSave, saving }) {
  const [enabled, setEnabled] = useState(getSettingValue(settings, "cookies_alert_enabled", "true") === "true");
  const [msg, setMsg] = useState(
    getSettingValue(
      settings,
      "cookies_alert_message",
      "We use essential cookies and kiln-seasoning telemetry to ensure you get the best handcrafted timber shopping experience."
    )
  );
  const [btnText, setBtnText] = useState(getSettingValue(settings, "cookies_alert_button_text", "Accept & Continue"));

  const handleSave = (e) => {
    e.preventDefault();
    onSave(
      {
        cookies_alert_enabled: enabled ? "true" : "false",
        cookies_alert_message: msg,
        cookies_alert_button_text: btnText,
      },
      "Cookie consent notice updated!"
    );
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
        🍪 Cookies & Privacy Consent Alert
      </h2>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
        Configure the bottom cookie consent banner shown to first-time storefront visitors.
      </p>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "650px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <input
            type="checkbox"
            id="cookie-toggle"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: "18px", height: "18px", accentColor: "#0f172a", cursor: "pointer" }}
          />
          <label htmlFor="cookie-toggle" style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", cursor: "pointer" }}>
            Enable Cookie Consent Banner on Storefront
          </label>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Cookie Notice Message
          </label>
          <textarea
            rows={3}
            required
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Button Label
          </label>
          <input
            type="text"
            required
            value={btnText}
            onChange={(e) => setBtnText(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
          >
            {saving ? "Saving..." : "Save Cookie Alert"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------
// 12. MAINTAINANCE TAB
// ----------------------------------------------------------------------
export function MaintenanceTab({ settings, onSave, saving }) {
  const [enabled, setEnabled] = useState(getSettingValue(settings, "maintenance_mode_enabled", "false") === "true");
  const [msg, setMsg] = useState(
    getSettingValue(
      settings,
      "maintenance_message",
      "We are currently upgrading Kinglet's timber catalog and online showroom. We will be back online shortly. For urgent inquiries, call: +8801676900442."
    )
  );

  const handleSave = (e) => {
    e.preventDefault();
    onSave(
      {
        maintenance_mode_enabled: enabled ? "true" : "false",
        maintenance_message: msg,
      },
      "Maintenance mode setting updated!"
    );
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
        🛠️ Website Maintenance Mode
      </h2>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
        Temporarily lock the customer storefront during timber catalog upgrades or factory maintenance.
      </p>

      {enabled && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "14px 18px", borderRadius: "8px", color: "#991b1b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <div>
            <strong>MAINTENANCE MODE IS CURRENTLY ACTIVE!</strong>
            <p style={{ margin: "2px 0 0", fontSize: "12px" }}>
              Public storefront visitors are currently seeing the maintenance notice screen. Authenticated administrators can still access the platform.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "650px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <input
            type="checkbox"
            id="maintenance-toggle"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: "18px", height: "18px", accentColor: "#ef4444", cursor: "pointer" }}
          />
          <label htmlFor="maintenance-toggle" style={{ fontSize: "13px", fontWeight: 700, color: enabled ? "#dc2626" : "#0f172a", cursor: "pointer" }}>
            Enable Maintenance Mode (Halt Customer Access)
          </label>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Customer Maintenance Notice Message
          </label>
          <textarea
            rows={4}
            required
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: "10px 24px", background: enabled ? "#dc2626" : "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
          >
            {saving ? "Updating..." : "Save Maintenance Status"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------
// 13. SITEMAP TAB
// ----------------------------------------------------------------------
export function SitemapTab() {
  const [regenerating, setRegenerating] = useState(false);
  const [status, setStatus] = useState(null);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/seo/sitemap/regenerate", { method: "POST" });
      setStatus(`✓ Success! Sitemap regenerated with ${res.data?.sizeBytes ? Math.round(res.data.sizeBytes / 1024) + " KB" : "107+ URLs"}`);
    } catch (err) {
      alert("Failed to regenerate sitemap: " + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
        🗺️ XML Sitemap & Google Indexing
      </h2>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
        Manage XML sitemaps containing all products, categories, and high-resolution Google image extensions.
      </p>

      {status && (
        <div style={{ padding: "12px 18px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", fontSize: "13px", fontWeight: 700, marginBottom: "20px" }}>
          {status}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "650px" }}>
        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <strong style={{ fontSize: "14px", color: "#0f172a", display: "block", marginBottom: "4px" }}>
            Production Live Sitemap URL:
          </strong>
          <a
            href="https://www.kingletbd.com/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: "13px", color: "#ec2226", fontWeight: 700, textDecoration: "none" }}
          >
            https://www.kingletbd.com/sitemap.xml ↗
          </a>
        </div>

        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <strong style={{ fontSize: "14px", color: "#0f172a", display: "block", marginBottom: "4px" }}>
            Google Merchant Center Product Feed:
          </strong>
          <a
            href="/api/v1/seo/google-merchant-feed.xml"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: "13px", color: "#0f172a", fontWeight: 700, textDecoration: "none" }}
          >
            /api/v1/seo/google-merchant-feed.xml ↗
          </a>
        </div>

        <div>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            style={{ padding: "10px 24px", background: "#ec2226", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: regenerating ? "wait" : "pointer" }}
          >
            {regenerating ? "Regenerating Sitemap..." : "🚀 1-Click Regenerate Live Sitemap"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 14. SCHEMA TAB
// ----------------------------------------------------------------------
export function SchemaTab({ settings, onSave, saving }) {
  const [form, setForm] = useState({
    schema_org_type: getSettingValue(settings, "schema_org_type", "FurnitureStore"),
    schema_brand_name: getSettingValue(settings, "schema_brand_name", "Kinglet Bangladesh Ltd"),
    schema_geo_latitude: getSettingValue(settings, "schema_geo_latitude", "23.7915"),
    schema_geo_longitude: getSettingValue(settings, "schema_geo_longitude", "90.3734"),
    schema_opening_hours: getSettingValue(settings, "schema_opening_hours", "Mo-Sa 09:00-22:00"),
    schema_rating_value: getSettingValue(settings, "schema_rating_value", "4.9"),
    schema_review_count: getSettingValue(settings, "schema_review_count", "428"),
  });

  const handleSave = (e) => {
    e.preventDefault();
    onSave(form, "Schema.org structured data updated!");
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
        🏷️ Schema.org Structured Data & Rich Snippets
      </h2>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
        Configure Google Knowledge Graph entity properties, Mirpur GPS coordinates, and aggregate star ratings.
      </p>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "650px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Schema Type</label>
            <input
              type="text"
              required
              value={form.schema_org_type}
              onChange={(e) => setForm({ ...form, schema_org_type: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Official Brand Entity Name</label>
            <input
              type="text"
              required
              value={form.schema_brand_name}
              onChange={(e) => setForm({ ...form, schema_brand_name: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Mirpur Hub Latitude</label>
            <input
              type="text"
              required
              value={form.schema_geo_latitude}
              onChange={(e) => setForm({ ...form, schema_geo_latitude: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Mirpur Hub Longitude</label>
            <input
              type="text"
              required
              value={form.schema_geo_longitude}
              onChange={(e) => setForm({ ...form, schema_geo_longitude: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Aggregate Rating (1 - 5)</label>
            <input
              type="text"
              required
              value={form.schema_rating_value}
              onChange={(e) => setForm({ ...form, schema_rating_value: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Verified Reviews Count</label>
            <input
              type="text"
              required
              value={form.schema_review_count}
              onChange={(e) => setForm({ ...form, schema_review_count: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
          >
            {saving ? "Saving..." : "Save Schema Data"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------
// 15. ROBOTS.TXT TAB
// ----------------------------------------------------------------------
export function RobotsTab({ settings, onSave, saving }) {
  const defaultRobots = `# Kinglet Bangladesh Ltd - Production Robots.txt for Search Engine Crawlers
# Official Canonical Domain: https://www.kingletbd.com/

User-agent: *
Allow: /
Allow: /category/
Allow: /product/
Allow: /flash-sale
Allow: /offers
Allow: /interior
Allow: /showrooms
Allow: /warranty-care
Allow: /faq
Allow: /about-us
Allow: /privacy-policy
Allow: /warranty-terms
Allow: /exchange-return
Allow: /delivery
Allow: /care-maintenance
Allow: /contact

# Private User Sessions, Cart & Checkout (Disallow indexing)
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /cart
Disallow: /checkout
Disallow: /order-confirmation
Disallow: /order-confirmation/
Disallow: /account
Disallow: /login
Disallow: /register
Disallow: /track-order

# Internal parameter filters & search queries to avoid duplicate content
Disallow: /*?search=*
Disallow: /*&search=*

# XML Sitemap
Sitemap: https://www.kingletbd.com/sitemap.xml
`;

  const [content, setContent] = useState(getSettingValue(settings, "custom_robots_txt", defaultRobots));

  const handleSave = (e) => {
    e.preventDefault();
    onSave({ custom_robots_txt: content }, "Robots.txt directives published!");
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            🤖 Robots.txt Code Editor
          </h2>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Directly edit and publish crawler indexing directives for Googlebot, Bingbot, and social crawlers.
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noreferrer"
            style={{ padding: "6px 12px", border: "1px solid #cbd5e1", background: "#f8fafc", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textDecoration: "none", color: "#0f172a" }}
          >
            View Live /robots.txt ↗
          </a>
          <button
            type="button"
            onClick={() => setContent(defaultRobots)}
            style={{ padding: "6px 12px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
          >
            Reset Default Rules
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <textarea
          rows={16}
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: "100%", padding: "14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", fontFamily: "monospace", boxSizing: "border-box", background: "#0f172a", color: "#f8fafc", lineHeight: "1.5" }}
        />

        <div>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
          >
            {saving ? "Saving..." : "Save & Publish Robots.txt"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------
// 16. LANGUAGE TAB
// ----------------------------------------------------------------------
export function LanguageTab({ settings, onSave, saving }) {
  const [lang, setLang] = useState(getSettingValue(settings, "default_language", "en"));
  const [translit, setTranslit] = useState(getSettingValue(settings, "enable_bengali_transliteration", "true") === "true");

  const handleSave = (e) => {
    e.preventDefault();
    onSave(
      {
        default_language: lang,
        enable_bengali_transliteration: translit ? "true" : "false",
      },
      "Language preferences saved!"
    );
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
        🌐 Language & Localization
      </h2>
      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
        Set primary storefront language and manage bilingual timber terminology (Bangla & English).
      </p>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "600px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Default Storefront Language
          </label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#fff" }}
          >
            <option value="en">English (Default Luxury Ergonomic)</option>
            <option value="bn">বাংলা (Bengali Storefront)</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <input
            type="checkbox"
            id="translit-toggle"
            checked={translit}
            onChange={(e) => setTranslit(e.target.checked)}
            style={{ width: "18px", height: "18px", accentColor: "#0f172a", cursor: "pointer" }}
          />
          <label htmlFor="translit-toggle" style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", cursor: "pointer" }}>
            Enable Bilingual Timber Transliteration (e.g. মেহগনি, কালো জাম কাঠ, চিটাগাং সেগুন)
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
          >
            {saving ? "Saving..." : "Save Language Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

