import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HelpCircle,
  Info,
  Shield,
  FileText,
  RotateCcw,
  Truck,
  Sparkles,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { BRAND_INFO } from "../data/kingletData";
import KingletSEO from "../components/Common/KingletSEO";

const TABS = [
  { id: "faq", label: "FAQs", icon: HelpCircle, path: "/faq" },
  { id: "about-us", label: "About Us", icon: Info, path: "/about-us" },
  { id: "privacy-policy", label: "Privacy Policy", icon: Shield, path: "/privacy-policy" },
  { id: "warranty-terms", label: "Warranty & Service Terms", icon: FileText, path: "/warranty-terms" },
  { id: "exchange-return", label: "Exchange and Return", icon: RotateCcw, path: "/exchange-return" },
  { id: "delivery", label: "Delivery", icon: Truck, path: "/delivery" },
  { id: "care-maintenance", label: "Care & Maintenance", icon: Sparkles, path: "/care-maintenance" },
  { id: "contact", label: "Location & Showroom", icon: MapPin, path: "/contact" },
  { id: "account", label: "My Account", icon: User, path: "/account" },
];

export default function KingletInfoPage() {
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();

  // Determine active tab based on route
  let activeTab = "faq";
  if (currentPath.includes("about-us")) activeTab = "about-us";
  else if (currentPath.includes("privacy-policy")) activeTab = "privacy-policy";
  else if (currentPath.includes("warranty")) activeTab = "warranty-terms";
  else if (currentPath.includes("exchange") || currentPath.includes("return")) activeTab = "exchange-return";
  else if (currentPath.includes("delivery")) activeTab = "delivery";
  else if (currentPath.includes("care") || currentPath.includes("maintenance")) activeTab = "care-maintenance";
  else if (currentPath.includes("contact") || currentPath.includes("location")) activeTab = "contact";
  else if (currentPath.includes("account")) activeTab = "account";

  // Scroll to top whenever tab/route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const [siteSettings, setSiteSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kinglet_site_settings") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e?.detail) setSiteSettings(e.detail);
    };
    const handleStorage = (e) => {
      if (e.key === "kinglet_site_settings" && e.newValue) {
        try {
          setSiteSettings(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("kinglet_settings_updated", handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("kinglet_settings_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const [policyPagesList, setPolicyPagesList] = useState([]);

  // Fetch dynamic policy pages from API
  useEffect(() => {
    let isMounted = true;
    fetch("/api/v1/cms/pages")
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setPolicyPagesList(json.data);
        }
      })
      .catch((err) => console.warn("Could not load dynamic policy pages:", err));

    const handlePagesUpdate = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setPolicyPagesList(e.detail);
      }
    };
    window.addEventListener("kinglet_pages_updated", handlePagesUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("kinglet_pages_updated", handlePagesUpdate);
    };
  }, []);

  const dynamicFaqs = useMemo(() => {
    try {
      const raw = siteSettings?.website_faqs;
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return null;
  }, [siteSettings?.website_faqs]);

  const activePageData = useMemo(() => {
    const slugMap = {
      faq: "faq",
      "about-us": "about-us",
      "privacy-policy": "privacy-policy",
      "warranty-terms": "warranty-terms",
      "exchange-return": "exchange-return",
      delivery: "delivery",
      "care-maintenance": "care-maintenance",
    };
    const targetSlug = slugMap[activeTab] || activeTab;
    
    // First check policyPagesList state
    const foundFromState = policyPagesList.find(
      (p) => p.id === targetSlug || p.slug === targetSlug || p.path?.endsWith(targetSlug)
    );
    if (foundFromState) return foundFromState;

    // Second check siteSettings.website_policy_pages
    try {
      if (siteSettings?.website_policy_pages) {
        const parsed = typeof siteSettings.website_policy_pages === "string"
          ? JSON.parse(siteSettings.website_policy_pages)
          : siteSettings.website_policy_pages;
        if (Array.isArray(parsed)) {
          const found = parsed.find(
            (p) => p.id === targetSlug || p.slug === targetSlug || p.path?.endsWith(targetSlug)
          );
          if (found) return found;
        }
      }
    } catch {}

    return null;
  }, [policyPagesList, siteSettings?.website_policy_pages, activeTab]);

  const renderDynamicContent = (content) => {
    if (!content) return null;
    const blocks = content.split("\n\n").map((b) => b.trim()).filter(Boolean);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {blocks.map((block, idx) => {
          if (block.startsWith("•") || block.startsWith("-")) {
            const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
            return (
              <ul key={idx} style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px", margin: 0 }}>
                {lines.map((line, liIdx) => {
                  const cleaned = line.replace(/^[•\-*]\s*/, "");
                  const colonIdx = cleaned.indexOf(":");
                  if (colonIdx > 0 && colonIdx < 45) {
                    const heading = cleaned.slice(0, colonIdx);
                    const rest = cleaned.slice(colonIdx + 1);
                    return (
                      <li key={liIdx} style={{ lineHeight: 1.7 }}>
                        <strong style={{ color: "#0f172a" }}>{heading}:</strong>{rest}
                      </li>
                    );
                  }
                  return (
                    <li key={liIdx} style={{ lineHeight: 1.7 }}>{cleaned}</li>
                  );
                })}
              </ul>
            );
          }

          const colonMatch = block.match(/^([A-Za-z0-9\s.]+):([\s\S]*)$/);
          if (colonMatch && colonMatch[1].length < 45) {
            return (
              <div key={idx} style={{ lineHeight: 1.75 }}>
                <h3 style={{ fontSize: "16px", fontWeight: "750", color: "#0f172a", margin: "16px 0 6px" }}>
                  {colonMatch[1]}
                </h3>
                <p style={{ margin: 0, color: "#334155" }}>{colonMatch[2].trim()}</p>
              </div>
            );
          }

          return (
            <p key={idx} style={{ margin: 0, lineHeight: 1.75, color: "#334155", whiteSpace: "pre-line" }}>
              {block}
            </p>
          );
        })}
      </div>
    );
  };

  const seoMetadata = {
    faq: {
      title: "Frequently Asked Questions (FAQ) | Kinglet Furniture Bangladesh",
      description: "Answers to common questions about Kinglet seasoned mahogany & oak veneer furniture orders, delivery timeline, custom sizes, 0% EMI and 10-year timber warranty.",
      canonical: "https://www.kingletbd.com/faq",
    },
    "about-us": {
      title: "About Kinglet Bangladesh Ltd | Seasoned Mahogany & Luxury Furniture Heritage",
      description: "Learn about Kinglet Bangladesh Ltd, founded in 2019, crafting timeless kiln-seasoned Mahogany furniture with automated Italian PU finish.",
      canonical: "https://www.kingletbd.com/about-us",
    },
    "privacy-policy": {
      title: "Privacy Policy | Kinglet Bangladesh Ltd",
      description: "Official privacy and data protection policy for Kinglet Bangladesh Ltd online shoppers and showroom visitors.",
      canonical: "https://www.kingletbd.com/privacy-policy",
    },
    "warranty-terms": {
      title: "Warranty & Service Terms (10-Year Timber Guarantee) | Kinglet",
      description: "Official 10-Year Timber replacement warranty terms against termites, borer beetles, and fungal decay for Kinglet furniture.",
      canonical: "https://www.kingletbd.com/warranty-terms",
    },
    "exchange-return": {
      title: "Exchange and Return Policy | Kinglet Bangladesh Ltd",
      description: "Transparent 3-day exchange policy for manufacturing defects and damage-free nationwide delivery guarantees.",
      canonical: "https://www.kingletbd.com/exchange-return",
    },
    delivery: {
      title: "Nationwide Safe Delivery Information | Kinglet Bangladesh Ltd",
      description: "Delivery timelines, complimentary white-glove assembly in Dhaka, and district courier delivery across all 64 districts in Bangladesh.",
      canonical: "https://www.kingletbd.com/delivery",
    },
    "care-maintenance": {
      title: "Mahogany Furniture Care & Maintenance Guide | Kinglet Bangladesh Ltd",
      description: "Expert guidelines to preserve the beauty, luster, and longevity of your seasoned mahogany and Italian PU lacquer furniture in Bangladesh.",
      canonical: "https://www.kingletbd.com/care-maintenance",
    },
    contact: {
      title: "Contact Us & Showroom Location | Kinglet Bangladesh Ltd",
      description: "Visit Kinglet's flagship showroom in West Shewrapara, Mirpur, Dhaka. Contact our interior design and furniture specialists directly.",
      canonical: "https://www.kingletbd.com/contact",
    },
    account: {
      title: "Customer Account | Kinglet Bangladesh Ltd",
      description: "Access your customer orders and tracking.",
      canonical: "https://www.kingletbd.com/account",
      noindex: true,
    },
  }[activeTab] || {
    title: "Kinglet Furniture Information",
    description: "Official information, customer policies, and warranties.",
    canonical: `https://www.kingletbd.com/${activeTab}`,
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "85vh", padding: "32px 0 70px" }}>
      <KingletSEO
        title={activePageData?.metaTitle || seoMetadata.title}
        description={activePageData?.metaDescription || seoMetadata.description}
        canonicalUrl={seoMetadata.canonical}
        noindex={Boolean(seoMetadata.noindex)}
      />
      <div className="container" style={{ maxWidth: "1280px", padding: "0 20px" }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b", marginBottom: "24px" }}>
          <Link to="/" style={{ color: "#64748b", textDecoration: "none" }}>Home</Link>
          <ChevronRight size={14} />
          <span style={{ color: "#ec2226", fontWeight: "600", textTransform: "capitalize" }}>
            {TABS.find((t) => t.id === activeTab)?.label || "Information"}
          </span>
        </div>

        {/* Layout Grid: Sidebar Navigation + Main Content Card */}
        <div className="info-page-layout-grid">
          
          {/* Left Navigation Sidebar */}
          <aside
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
              overflow: "hidden",
              position: "sticky",
              top: "90px",
            }}
          >
            <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#ec2226", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                CUSTOMER HELP DESK
              </span>
              <h3 style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: "750", color: "#0f172a" }}>
                Information & Policies
              </h3>
            </div>

            <nav style={{ padding: "8px" }}>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "11px 14px",
                      borderRadius: "10px",
                      marginBottom: "3px",
                      textDecoration: "none",
                      fontSize: "13.5px",
                      fontWeight: isActive ? "700" : "500",
                      background: isActive ? "#ec2226" : "transparent",
                      color: isActive ? "#ffffff" : "#334155",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Icon size={16} color={isActive ? "#ffffff" : "#64748b"} />
                      <span>{tab.label}</span>
                    </div>
                    <ChevronRight size={14} color={isActive ? "#ffffff" : "#94a3b8"} />
                  </Link>
                );
              })}
            </nav>

            {/* Quick Contact Card inside sidebar */}
            <div style={{ padding: "16px", margin: "8px", background: "#fff5f5", borderRadius: "12px", border: "1px solid #fee2e2" }}>
              <div style={{ fontSize: "11px", fontWeight: "750", color: "#ec2226", textTransform: "uppercase", marginBottom: "4px" }}>
                Need Immediate Help?
              </div>
              <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.4, marginBottom: "8px" }}>
                Our Mirpur showroom consultants are ready to assist you.
              </div>
              <a
                href={`tel:${BRAND_INFO.hotlinePrimary}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background: "#ec2226",
                  color: "#ffffff",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  textDecoration: "none",
                }}
              >
                <Phone size={13} />
                <span>{BRAND_INFO.hotlinePrimary}</span>
              </a>
            </div>
          </aside>

          {/* Right Main Content Card */}
          <main
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
              padding: "36px 40px",
            }}
          >
            {/* ========================================================
                1. FAQs TAB (Exact content from kingletbd.com/faq)
                ======================================================== */}
            {activeTab === "faq" && (
              <div>
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "28px" }}>
                  <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
                    {activePageData?.title || "Frequently Asked Questions (FAQ)"}
                  </h1>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                    {activePageData?.subtitle || "Find answers regarding Kinglet Furniture orders, policies, VAT, and services in Bangladesh."}
                  </p>
                </div>

                <div className="info-two-col-grid">
                  {dynamicFaqs && dynamicFaqs.length > 0 ? (
                    dynamicFaqs.map((f, idx) => (
                      <div key={f.id || idx} style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ fontSize: "16px", fontWeight: "750", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Sparkles size={16} color="#ec2226" />
                          <span>{f.question}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                          {f.answer}
                        </p>
                      </div>
                    ))
                  ) : (
                    <>
                      {/* Card 1 */}
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ fontSize: "16px", fontWeight: "750", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Sparkles size={16} color="#ec2226" />
                          <span>Offer Information !</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", lineHeight: 1.6 }}>
                          Great furniture, incredible offers! Experience the perfect combination of quality and savings at Kinglet. Special seasonal offers and bundled bridal sets are available online and in our Mirpur showroom.
                        </p>
                      </div>

                      {/* Card 2 */}
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ fontSize: "16px", fontWeight: "750", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Sparkles size={16} color="#ec2226" />
                          <span>Coupon Information !</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", lineHeight: 1.6 }}>
                          Your perfect furniture is now more affordable. Find exclusive Kinglet coupon codes for special discounts online and in-store. Apply valid coupons at checkout to enjoy instant price deductions.
                        </p>
                      </div>

                      {/* Card 3 */}
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ fontSize: "16px", fontWeight: "750", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Sparkles size={16} color="#ec2226" />
                          <span>VAT Information !</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", lineHeight: 1.6 }}>
                          All product prices of Kinglet Furniture are displayed excluding VAT as per Bangladesh Government regulations. The applicable government taxes are clearly specified during checkout and on your official invoice.
                        </p>
                      </div>

                      {/* Card 4 */}
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ fontSize: "16px", fontWeight: "750", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Sparkles size={16} color="#ec2226" />
                          <span>Discount Policy !</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", lineHeight: 1.6 }}>
                          Kinglet brings you exciting seasonal sales and festival discounts. Celebrate with the best deals on quality furniture across Bangladesh. Note that clearance or special offer items may not be combined with additional voucher codes.
                        </p>
                      </div>

                      {/* Card 5 */}
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ fontSize: "16px", fontWeight: "750", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Truck size={16} color="#ec2226" />
                          <span>Product Delivery !</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", lineHeight: 1.6 }}>
                          We offer door-delivery service throughout Dhaka and all 64 districts in Bangladesh. The customer is responsible for all associated transportation and labor charges.
                        </p>
                      </div>

                      {/* Card 6 */}
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ fontSize: "16px", fontWeight: "750", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Shield size={16} color="#ec2226" />
                          <span>Furniture Quality !</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", lineHeight: 1.6 }}>
                          Furniture is the soul of a space. Choose pieces that are not only built to endure time but are beautiful enough to inspire your everyday life. Crafted from 100% seasoned Mahogany with Italian PU finish.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                2. ABOUT US TAB (Exact from kingletbd.com/about-us/pages)
                ======================================================== */}
            {activeTab === "about-us" && (
              <div>
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "24px" }}>
                  <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
                    {activePageData?.title || "About Us"}
                  </h1>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                    {activePageData?.subtitle || "Kinglet Furniture & Interior Limited: Where Craftsmanship Meets Contemporary Living"}
                  </p>
                </div>

                <div style={{ fontSize: "14px", color: "#334155", lineHeight: "1.75" }}>
                  {activePageData?.content ? (
                    <div style={{ marginBottom: "24px", whiteSpace: "pre-line" }}>
                      {activePageData.content.split("\n\n").map((para, i) => (
                        <p key={i} style={{ marginBottom: "16px" }}>{para}</p>
                      ))}
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" }}>
                        Kinglet Furniture &amp; Interior
                      </p>
                      <p style={{ marginBottom: "16px" }}>
                        Founded in 2019, <strong>Kinglet Furniture &amp; Interior</strong> is a premier manufacturer and direct retailer of fine home and office furnishings. We blend innovative, contemporary design with uncompromising craftsmanship to create interiors that inspire. Our dedicated team of skilled designers constantly researches new trends and technologies, ensuring our collections are as forward-thinking as they are functional.
                      </p>
                      <p style={{ marginBottom: "16px" }}>
                        <strong>Quality is the foundation of everything we make.</strong> In our advanced manufacturing facility, over 100 skilled artisans utilize cutting-edge technology and the finest raw materials to build every product to perfect standards. By controlling the entire process—from design and production to direct sales in our own showroom—we guarantee exceptional value without ever compromising on integrity.
                      </p>
                      <p style={{ marginBottom: "24px" }}>
                        Above all, we believe our customers are partners. We are committed to providing not just beautiful, lasting furniture, but also an unparalleled standard of service. Your vision is our inspiration, and your satisfaction is the true measure of our success.
                      </p>
                    </>
                  )}

                  <div className="info-two-col-grid" style={{ background: "#f8fafc", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "28px" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#ec2226", textTransform: "uppercase" }}>Slogan</span>
                      <div style={{ fontSize: "15px", fontWeight: "750", color: "#0f172a" }}>Creativity in Simplicity</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#ec2226", textTransform: "uppercase" }}>Year Established</span>
                      <div style={{ fontSize: "15px", fontWeight: "750", color: "#0f172a" }}>2019 (Dhaka, Bangladesh)</div>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#ec2226", textTransform: "uppercase" }}>Our Mission</span>
                      <div style={{ fontSize: "14px", color: "#334155" }}>
                        To enrich modern living by crafting exceptional furniture through innovative design, uncompromising quality, and a true partnership with our clients.
                      </div>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#ec2226", textTransform: "uppercase" }}>Our Vision</span>
                      <div style={{ fontSize: "14px", color: "#334155" }}>
                        To be the recognized leader in innovative furniture design and craftsmanship, setting the highest standards of quality and inspiring exceptional living.
                      </div>
                    </div>
                  </div>

                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "24px 0 12px" }}>
                    Our Core Values
                  </h3>
                  <ul style={{ paddingLeft: "20px", marginBottom: "24px" }}>
                    <li style={{ marginBottom: "8px" }}>
                      <strong>Quality without Compromise:</strong> We are unwavering in our commitment to excellence. From the selection of raw materials to the final stitch, we uphold the highest standards in every product we create.
                    </li>
                    <li style={{ marginBottom: "8px" }}>
                      <strong>Innovative by Design:</strong> We embrace progress and creativity. Our team is dedicated to researching trends and technologies to deliver fresh, functional, and forward-thinking furniture solutions.
                    </li>
                    <li style={{ marginBottom: "8px" }}>
                      <strong>Customer Partnership:</strong> We view every client as a collaborator. Your trust is earned through transparency, exceptional service, and a shared commitment to achieving your vision.
                    </li>
                    <li style={{ marginBottom: "8px" }}>
                      <strong>Integrity in Craftsmanship:</strong> We take pride in our work. Our skilled artisanship, advanced technology, and honest practices ensure that every piece is built to last and designed to inspire.
                    </li>
                  </ul>

                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "24px 0 12px" }}>
                    Why Choose Kinglet?
                  </h3>
                  <div className="info-two-col-grid">
                    <div style={{ padding: "14px 18px", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                      <strong>Direct from Our Factory:</strong> Experience exceptional value without compromise, as we control design, manufacturing, and direct sales.
                    </div>
                    <div style={{ padding: "14px 18px", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                      <strong>Unmatched Quality:</strong> Enjoy peace of mind with furniture built to the highest standards of craftsmanship and solid materials.
                    </div>
                    <div style={{ padding: "14px 18px", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                      <strong>Modern &amp; Innovative:</strong> Furnish your space with contemporary, research-driven styles that keep pace with modern living.
                    </div>
                    <div style={{ padding: "14px 18px", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                      <strong>A Partnership Approach:</strong> Benefit from our commitment to your satisfaction, providing expert service tailored to your vision.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                3. PRIVACY POLICY TAB (Exact from kingletbd.com/privacy-policy/pages)
                ======================================================== */}
            {activeTab === "privacy-policy" && (
              <div>
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "24px" }}>
                  <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
                    {activePageData?.title || "Privacy Policy"}
                  </h1>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                    {activePageData?.subtitle || "Last Updated: 2026 • Kinglet Furniture and Interior"}
                  </p>
                </div>

                <div style={{ fontSize: "14px", color: "#334155", lineHeight: "1.75" }}>
                  {activePageData?.content ? (
                    renderDynamicContent(activePageData.content)
                  ) : (
                    <>
                      <p style={{ marginBottom: "16px" }}>
                        Welcome to <strong>Kinglet Furniture and Interior</strong>. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you visit our website <a href="https://kingletbd.com/" target="_blank" rel="noreferrer" style={{ color: "#ec2226" }}>https://kingletbd.com/</a>, visit our showrooms, or interact with our services in Bangladesh. By using our services, you consent to the practices described in this policy.
                      </p>

                      <h3 style={{ fontSize: "16px", fontWeight: "750", color: "#0f172a", margin: "20px 0 8px" }}>
                        1. Information We Collect
                      </h3>
                      <p style={{ marginBottom: "16px" }}>
                        We collect information to provide you with a seamless experience and improve our services. This includes your name, phone number, email address, delivery address, and payment information (e.g., bKash/Nagad transaction IDs, bank details). When you visit our website, we automatically collect your IP address, browser type, device information, and pages you visit through cookies and similar technologies. We retain records of your communications with us, including customer service requests, feedback, and inquiries. For interior design services, we may collect information about your property, such as room dimensions, layout preferences, and budget.
                      </p>

                      <h3 style={{ fontSize: "16px", fontWeight: "750", color: "#0f172a", margin: "20px 0 8px" }}>
                        2. How We Use Your Information
                      </h3>
                      <p style={{ marginBottom: "16px" }}>
                        We use the information we collect to process your purchases, arrange for delivery, installation, and manage returns or warranties; to respond to your inquiries, offer support, and resolve issues; to analyze customer behavior and preferences to enhance our product offerings and website functionality; and to send promotional offers, newsletters, and updates about new products via SMS, email, or phone (opt-out available anytime). We also use your data to comply with applicable laws in Bangladesh, prevent fraudulent transactions, and protect our mutual rights.
                      </p>

                      <h3 style={{ fontSize: "16px", fontWeight: "750", color: "#0f172a", margin: "20px 0 8px" }}>
                        3. How We Share Your Information
                      </h3>
                      <p style={{ marginBottom: "16px" }}>
                        We value your trust and <strong>do not sell your personal data</strong>. We may share your information only with trusted third-party logistics partners to deliver your furniture, or if required by law, court order, or governmental authorities in Bangladesh.
                      </p>

                      <h3 style={{ fontSize: "16px", fontWeight: "750", color: "#0f172a", margin: "20px 0 8px" }}>
                        4. Data Security
                      </h3>
                      <p style={{ marginBottom: "16px" }}>
                        We implement appropriate technical and organizational security measures to protect your personal data from unauthorized access, alteration, disclosure, or destruction. This includes secure servers and encrypted data transmission.
                      </p>

                      <h3 style={{ fontSize: "16px", fontWeight: "750", color: "#0f172a", margin: "20px 0 8px" }}>
                        5. Your Rights
                      </h3>
                      <p style={{ margin: 0 }}>
                        As our valued customer, you have the right to request access to the personal information we hold about you, ask us to correct inaccuracies, unsubscribe from marketing communications, or request data deletion subject to legal transaction record obligations.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                4. WARRANTY & SERVICE TERMS (Exact from kingletbd.com/Warranty/pages)
                ======================================================== */}
            {activeTab === "warranty-terms" && (
              <div>
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "24px" }}>
                  <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
                    {activePageData?.title || "Warranty & Service Terms"}
                  </h1>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                    {activePageData?.subtitle || "Warranty Policy – Kinglet Furniture & Interior"}
                  </p>
                </div>

                <div style={{ fontSize: "14px", color: "#334155", lineHeight: "1.75" }}>
                  {activePageData?.content ? (
                    renderDynamicContent(activePageData.content)
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", gap: "12px", background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div>
                          <strong>12-Month Service Warranty:</strong> Covers parts and labor for wood cracks and loose joints. It excludes damages resulting from misuse or normal wear and tear.
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "12px", background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div>
                          <strong>5-Year Wood-Louse Guarantee:</strong> 5-year guarantee against wood-louse (ghun puka). Infested parts will be replaced free of charge.
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "12px", background: "#fff5f5", padding: "16px 20px", borderRadius: "12px", border: "1px solid #fee2e2" }}>
                        <Info size={20} color="#ec2226" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div>
                          <strong>Exclusions:</strong> No warranty or guarantee is applicable for glass, fabric, rexine, marble, termite, and other decorative accessories.
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "12px", background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div>
                          <strong>Customized Orders:</strong> All customized furniture orders are non-refundable.
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "12px", background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div>
                          <strong>Challan Inspection:</strong> Please inspect goods thoroughly upon delivery. Any problems must be noted in writing on the challan at that time. Subsequent claims will not be accepted.
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "12px", background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div>
                          <strong>Invoice Requirement:</strong> For availing warranty service, customers must present the original copy of the Invoice.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                5. EXCHANGE & RETURN TAB (Exact from kingletbd.com/Exchange/pages)
                ======================================================== */}
            {activeTab === "exchange-return" && (
              <div>
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "24px" }}>
                  <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
                    {activePageData?.title || "Exchange and Return Policy"}
                  </h1>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                    {activePageData?.subtitle || "Authentic guidelines for furniture exchange and refunds at Kinglet"}
                  </p>
                </div>

                <div style={{ fontSize: "14px", color: "#334155", lineHeight: "1.75" }}>
                  {activePageData?.content ? (
                    renderDynamicContent(activePageData.content)
                  ) : (
                    <div className="info-two-col-grid" style={{ marginBottom: "24px" }}>
                      {/* Exchange Policy */}
                      <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "24px", background: "#f8fafc" }}>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "10px" }}>
                          Exchange Policy
                        </div>
                        <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
                          Furniture can be exchanged in good condition within <strong>3 days</strong> with a <strong>5% service charge</strong>.
                          <br /><br />
                          <span style={{ color: "#dc2626", fontWeight: "600" }}>Note:</span> It is not applicable for customized orders, set-broken products, or fabric products.
                        </p>
                      </div>

                      {/* Return-Refund Policy */}
                      <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "24px", background: "#f8fafc" }}>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "10px" }}>
                          Return-Refund Policy
                        </div>
                        <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
                          Furniture can be returned in good condition within <strong>3 days</strong> and money can be refunded with a <strong>10% service charge</strong>.
                          <br /><br />
                          <span style={{ color: "#dc2626", fontWeight: "600" }}>Note:</span> It is not applicable for customized orders, set-broken products, or fabric products.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                6. DELIVERY TAB (Exact from kingletbd.com/delivery/pages)
                ======================================================== */}
            {activeTab === "delivery" && (
              <div>
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "24px" }}>
                  <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
                    {activePageData?.title || "Delivery Policy"}
                  </h1>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                    {activePageData?.subtitle || "Delivery Policy – Kinglet Furniture & Interior"}
                  </p>
                </div>

                <div style={{ fontSize: "14px", color: "#334155", lineHeight: "1.75" }}>
                  {activePageData?.content ? (
                    renderDynamicContent(activePageData.content)
                  ) : (
                    <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <li>
                        <strong>Door-Delivery Service:</strong> We offer convenient door-delivery service across Bangladesh. The customer is responsible for all associated transportation and labor charges.
                      </li>
                      <li>
                        <strong>Inspection Upon Delivery:</strong> Please inspect all goods thoroughly upon delivery. Any problems, scratches, or issues must be noted in writing on the challan at that time. Subsequent claims will not be accepted.
                      </li>
                      <li>
                        <strong>Customer Handling Care:</strong> Customers are requested to carry and position products with due care once received from our delivery team to preserve joints and finishes.
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                7. CARE & MAINTENANCE (Exact from kingletbd.com/Maintenance/pages)
                ======================================================== */}
            {activeTab === "care-maintenance" && (
              <div>
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "24px" }}>
                  <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
                    {activePageData?.title || "Care & Maintenance Guide"}
                  </h1>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                    {activePageData?.subtitle || "Expert guidelines to preserve your solid wood and upholstery furniture"}
                  </p>
                </div>

                <div style={{ fontSize: "14px", color: "#334155", lineHeight: "1.75" }}>
                  {activePageData?.content ? (
                    renderDynamicContent(activePageData.content)
                  ) : (
                    <>
                      <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                        Solid Wood Care and Maintenance
                      </h3>
                      <ul style={{ paddingLeft: "20px", marginBottom: "28px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <li>To prevent staining, please wipe any spills immediately with a soft, dry cloth.</li>
                        <li>For everyday care, simply dust with a soft, dry cloth. For cleaning, use a slightly damp cloth and then dry the surface immediately to prevent water spots.</li>
                        <li>To protect your floors and the furniture, please lift rather than drag when moving it.</li>
                        <li>Protect from direct sunlight to prevent UV damage, fading, and discoloration.</li>
                        <li>To ensure longevity, protect fine wood from extreme humidity and temperature. Solid wood tops may expand in summer and contract in winter, which is a normal and harmless natural process.</li>
                        <li>To protect the finish, avoid placing products containing solvents—such as nail polish remover, perfume, hairspray, or glass cleaner—directly on wooden surfaces.</li>
                        <li>Prevent finish damage: Keep rubber, plastic, and cork items off bare wood. Use a protective cloth barrier instead.</li>
                        <li>Protect furniture finishes from extreme heat, cold, or moisture. Always use a protective pad under hot or damp items.</li>
                        <li>Protect your furniture from dampness to prevent fungal growth. Ensure good airflow and room ventilation.</li>
                      </ul>

                      <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
                        Upholstery Care Guide
                      </h3>
                      <ul style={{ paddingLeft: "20px", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <li>Please avoid sitting on the sofa arms, as the excess pressure can damage the padding and frame over time.</li>
                        <li>Fabric Care: Snags can be caused by sharp objects. Always trim snags with scissors; pulling will cause further damage.</li>
                        <li>For cleaning, loose sofa covers and cushions can be removed and professionally dry-cleaned.</li>
                        <li>To protect the color and material of your upholstery, please avoid using bleach during cleaning.</li>
                        <li>Act quickly on spills: Blot immediately with a clean dry cloth—do not rub. Do not use household detergent cleaners.</li>
                        <li>Extend the life of your cushions: Flip and rotate them regularly to ensure even wear, and fluff them to maintain their shape.</li>
                        <li>Regularly vacuum your furniture with a soft brush attachment to remove dust and prevent embedded dirt.</li>
                        <li>We recommend a professional clean every two years. For Kinglet Care service, contact: <strong style={{ color: "#ec2226" }}>+88-01707073414</strong>.</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                8. LOCATION & SHOWROOM TAB
                ======================================================== */}
            {activeTab === "contact" && (
              <div>
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "24px" }}>
                  <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
                    Location &amp; Experience Center
                  </h1>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                    Visit our flagship furniture showroom in Mirpur, Dhaka
                  </p>
                </div>

                <div className="info-two-col-grid" style={{ marginBottom: "24px" }}>
                  <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                      <MapPin size={22} color="#ec2226" />
                      <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "750", color: "#0f172a" }}>
                        Head Office &amp; Showroom
                      </h3>
                    </div>
                    <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, marginBottom: "16px" }}>
                      752/2, West Shewrapara, Begum Rokeya Sarani, Mirpur, Dhaka-1216, Bangladesh.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13.5px", color: "#334155" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Clock size={16} color="#ec2226" />
                        <span><strong>Visiting Hours:</strong> Everyday except Sunday: 9:00 AM – 10:00 PM</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Phone size={16} color="#ec2226" />
                        <span><strong>Hotline 24/7:</strong> <a href={`tel:${BRAND_INFO.hotlinePrimary}`} style={{ color: "#ec2226", fontWeight: "700", textDecoration: "none" }}>{BRAND_INFO.hotlinePrimary}</a></span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Phone size={16} color="#ec2226" />
                        <span><strong>Sales Desk:</strong> +88-01707073414, 01771776270</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Mail size={16} color="#ec2226" />
                        <span><strong>Email:</strong> {BRAND_INFO.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Google Map Directions Card */}
                  <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ margin: "0 0 10px", fontSize: "17px", fontWeight: "750", color: "#0f172a" }}>
                        Get Driving Directions
                      </h3>
                      <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: 1.5, margin: "0 0 20px" }}>
                        Located on Begum Rokeya Sarani right by West Shewrapara, easily accessible via Metro Rail (Shewrapara Station).
                      </p>
                    </div>

                    <a
                      href="https://maps.google.com/?q=752/2,+West+Shewrapara,+Begum+Rokeya+Sarani,+Mirpur,+Dhaka-1216"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        background: "#ec2226",
                        color: "#ffffff",
                        padding: "12px 20px",
                        borderRadius: "10px",
                        fontWeight: "700",
                        fontSize: "14px",
                        textDecoration: "none",
                      }}
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                9. MY ACCOUNT TAB
                ======================================================== */}
            {activeTab === "account" && (
              <div>
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "24px" }}>
                  <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
                    Customer Account Hub
                  </h1>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                    Manage your orders, saved wishlists, and delivery addresses
                  </p>
                </div>

                <div className="info-two-col-grid">
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", background: "#f8fafc" }}>
                    <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "750", color: "#0f172a" }}>
                      Track Active Orders
                    </h3>
                    <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
                      Check real-time production, seasoning, polish, and delivery status.
                    </p>
                    <Link
                      to="/track-order"
                      style={{
                        display: "inline-block",
                        background: "#0f172a",
                        color: "#ffffff",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "700",
                        textDecoration: "none",
                      }}
                    >
                      Track Your Order →
                    </Link>
                  </div>

                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", background: "#f8fafc" }}>
                    <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "750", color: "#0f172a" }}>
                      Saved Wishlist
                    </h3>
                    <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
                      View your saved bedroom suites, sectionals, and dining collections.
                    </p>
                    <Link
                      to="/category/bed-room"
                      style={{
                        display: "inline-block",
                        background: "#ec2226",
                        color: "#ffffff",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "700",
                        textDecoration: "none",
                      }}
                    >
                      Explore Catalog →
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </main>

        </div>
      </div>
    </div>
  );
}
