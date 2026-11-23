import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useLocation, Link } from "react-router-dom";
import { adminAuthService } from "../../utils/adminAuthService";
import {
  GeneralSettingsTab,
  NoticeScrollerTab,
  MenuBuilderTab,
  HomePageTab,
  VisibilityTab,
  StorageSettingsTab,
  SocialLoginTab,
  EmailSettingsTab,
  SmsSettingsTab,
  AnnouncementTab,
  CookiesAlertTab,
  MaintenanceTab,
  SitemapTab,
  SchemaTab,
  RobotsTab,
  LanguageTab,
} from "./ManageSiteTabs";

export default function AdminContentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Tab determination from search params or direct path
  const pathEnd = location.pathname.split("/").filter(Boolean).pop();
  const pathMap = {
    general_settings: "general_settings",
    settings: "general_settings",
    notice_scroller: "notice_scroller",
    menu_builder: "menu_builder",
    home_page: "home_page",
    sliders: "banners",
    banners: "banners",
    services: "features",
    features: "features",
    visibility: "visibility",
    storage_settings: "storage_settings",
    social_login: "social_login",
    email_settings: "email_settings",
    sms_settings: "sms_settings",
    announcement: "announcement",
    cookies_alert: "cookies_alert",
    maintainance: "maintainance",
    maintenance: "maintainance",
    sitemap: "sitemap",
    schema: "schema",
    robots_txt: "robots_txt",
    language: "language",
    pages: "pages",
    faqs: "faqs",
    blogs: "blogs",
    shipping: "shipping",
    subscribers: "subscribers",
    backup: "backup",
  };
  const urlTab = searchParams.get("tab");
  const resolvedTab =
    (urlTab && (pathMap[urlTab] || urlTab)) ||
    pathMap[pathEnd] ||
    (window.location.hash === "#settings" ? "general_settings" : "banners");

  const [activeTab, setActiveTab] = useState(resolvedTab);

  useEffect(() => {
    const rawTab = searchParams.get("tab");
    if (rawTab) {
      setActiveTab(pathMap[rawTab] || rawTab);
    } else if (pathMap[pathEnd]) {
      setActiveTab(pathMap[pathEnd]);
    } else if (window.location.hash === "#settings") {
      setActiveTab("general_settings");
    }
  }, [searchParams, location.pathname]);

  const switchTab = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };

  const [message, setMessage] = useState(null);
  const showFeedback = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3500);
  };

  // ----------------------------------------------------------------------
  // 1. BANNERS & SETTINGS
  // ----------------------------------------------------------------------
  const [banners, setBanners] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState(null);
  const [bannerUploadSuccess, setBannerUploadSuccess] = useState(null);
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);
  const bannerFileInputRef = useRef(null);

  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    badge: "NEW ARRIVAL",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
    targetUrl: "/category/living-room",
    ctaText: "Explore Collection",
    displayOrder: 1,
  });

  const fetchBannersAndSettings = async () => {
    setLoading(true);
    try {
      const [bannersRes, settingsRes] = await Promise.all([
        adminAuthService.fetch("/api/v1/admin/banners"),
        adminAuthService.fetch("/api/v1/admin/settings"),
      ]);
      setBanners(bannersRes.data || []);
      setSettings(settingsRes.data || []);
    } catch (err) {
      console.error("Failed to load banners or settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannersAndSettings();
  }, []);

  const handleSettingChange = (key, val) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: val } : s))
    );
  };

  const syncStorefrontSettings = async () => {
    try {
      const res = await fetch("/api/v1/cms/settings");
      const json = await res.json();
      if (json?.success && json?.data) {
        localStorage.setItem("kinglet_site_settings", JSON.stringify(json.data));
        window.dispatchEvent(new CustomEvent("kinglet_settings_updated", { detail: json.data }));
      }
    } catch (err) {
      console.warn("Could not sync storefront settings:", err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await adminAuthService.fetch("/api/v1/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ settings }),
      });
      await syncStorefrontSettings();
      showFeedback("Website operational settings updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const saveSettingBatch = async (batchData, successMsg) => {
    setSavingSettings(true);
    try {
      await adminAuthService.fetch("/api/v1/admin/settings", {
        method: "PUT",
        body: JSON.stringify(batchData),
      });
      await syncStorefrontSettings();
      showFeedback(successMsg || "Settings updated successfully!");
      fetchBannersAndSettings();
    } catch (err) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOpenEditBanner = (b) => {
    setEditingBanner(b);
    setBannerUploadError(null);
    setBannerUploadSuccess(null);
    setShowManualUrlInput(false);
    setBannerForm({
      title: b.title || "",
      subtitle: b.subtitle || "",
      badge: b.badge || "NEW ARRIVAL",
      imageUrl: b.imageUrl || "",
      targetUrl: b.targetUrl || "/category/bed-room",
      ctaText: b.ctaText || "Explore Collection",
      displayOrder: b.displayOrder !== undefined ? Number(b.displayOrder) : banners.length + 1,
    });
    setIsBannerModalOpen(true);
  };

  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerUploadError(null);
    setBannerUploadSuccess(null);
    setShowManualUrlInput(false);
    setBannerForm({
      title: "",
      subtitle: "",
      badge: "NEW ARRIVAL",
      imageUrl: "",
      targetUrl: "/category/living-room",
      ctaText: "Explore Collection",
      displayOrder: banners.length + 1,
    });
    setIsBannerModalOpen(true);
  };

  const handleBannerFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate client-side limits & formats
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type.toLowerCase())) {
      setBannerUploadError("Please select a valid image file (JPG, JPEG, PNG, or WebP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setBannerUploadError("File size exceeds 15MB limit.");
      return;
    }

    setBannerUploading(true);
    setBannerUploadError(null);
    setBannerUploadSuccess(null);

    // Instant local preview for zero-lag feedback
    const localPreviewUrl = URL.createObjectURL(file);
    setBannerForm((prev) => ({ ...prev, imageUrl: localPreviewUrl }));

    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", "banners");
    formData.append("title", bannerForm.title || file.name);

    try {
      const token = adminAuthService.getToken();
      const res = await fetch("/api/v1/admin/uploads/banner", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to upload banner image.");
      }

      const uploadedUrl = json.data?.url || json.data?.largeUrl || json.data?.originalUrl;
      setBannerForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      setBannerUploadSuccess("✅ JPG image uploaded and converted to high-res WebP!");
      setTimeout(() => setBannerUploadSuccess(null), 4000);
    } catch (err) {
      setBannerUploadError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setBannerUploading(false);
    }
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (bannerUploading) {
      alert("Please wait for the image upload to complete.");
      return;
    }
    if (!bannerForm.imageUrl) {
      alert("Please upload a banner image (JPG or PNG) first.");
      return;
    }

    try {
      if (editingBanner) {
        await adminAuthService.fetch(`/api/v1/admin/banners/${editingBanner.id}`, {
          method: "PUT",
          body: JSON.stringify(bannerForm),
        });
        showFeedback("Hero banner updated successfully!");
      } else {
        await adminAuthService.fetch("/api/v1/admin/banners", {
          method: "POST",
          body: JSON.stringify(bannerForm),
        });
        showFeedback("Hero banner published successfully!");
      }
      setIsBannerModalOpen(false);
      setEditingBanner(null);
      setBannerForm({
        title: "",
        subtitle: "",
        badge: "NEW ARRIVAL",
        imageUrl: "",
        targetUrl: "/category/living-room",
        ctaText: "Explore Collection",
        displayOrder: banners.length + 1,
      });
      window.dispatchEvent(new CustomEvent("kinglet_banners_updated"));
      fetchBannersAndSettings();
    } catch (err) {
      alert(err.message || "Failed to save banner");
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm("Delete this homepage banner?")) return;
    try {
      await adminAuthService.fetch(`/api/v1/admin/banners/${id}`, {
        method: "DELETE",
      });
      showFeedback("Banner removed.");
      window.dispatchEvent(new CustomEvent("kinglet_banners_updated"));
      fetchBannersAndSettings();
    } catch (err) {
      alert(err.message || "Failed to delete banner");
    }
  };

  // ----------------------------------------------------------------------
  // 2. SHIPPING METHODS
  // ----------------------------------------------------------------------
  const [shippingMethods, setShippingMethods] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [editingShipping, setEditingShipping] = useState(null);
  const [shippingForm, setShippingForm] = useState({
    code: "",
    title: "",
    description: "",
    baseRate: 500,
    freeAssembly: true,
    isActive: true,
  });

  const fetchShipping = async () => {
    setShippingLoading(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/shipping-methods");
      setShippingMethods(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setShippingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "shipping") fetchShipping();
  }, [activeTab]);

  const handleOpenEditShipping = (m) => {
    setEditingShipping(m);
    setShippingForm({
      code: m.code || "",
      title: m.title || "",
      description: m.description || "",
      baseRate: m.baseRate !== undefined ? Number(m.baseRate) : 0,
      freeAssembly: Boolean(m.freeAssembly),
      isActive: m.isActive !== undefined ? Boolean(m.isActive) : true,
    });
    setIsShippingModalOpen(true);
  };

  const handleSaveShipping = async (e) => {
    e.preventDefault();
    try {
      if (editingShipping) {
        await adminAuthService.fetch(`/api/v1/admin/shipping-methods/${editingShipping.id}`, {
          method: "PUT",
          body: JSON.stringify({
            title: shippingForm.title,
            description: shippingForm.description,
            baseRate: Number(shippingForm.baseRate),
            freeAssembly: Boolean(shippingForm.freeAssembly),
            isActive: Boolean(shippingForm.isActive),
          }),
        });
        showFeedback("Shipping method updated successfully!");
      } else {
        await adminAuthService.fetch("/api/v1/admin/shipping-methods", {
          method: "POST",
          body: JSON.stringify(shippingForm),
        });
        showFeedback("Shipping method configured!");
      }
      setIsShippingModalOpen(false);
      setEditingShipping(null);
      setShippingForm({ code: "", title: "", description: "", baseRate: 500, freeAssembly: true, isActive: true });
      fetchShipping();
    } catch (err) {
      alert("Failed to save shipping method: " + err.message);
    }
  };

  const handleDeleteShipping = async (id) => {
    if (!window.confirm("Delete this shipping method?")) return;
    try {
      await adminAuthService.fetch(`/api/v1/admin/shipping-methods/${id}`, {
        method: "DELETE",
      });
      showFeedback("Shipping method removed.");
      fetchShipping();
    } catch (err) {
      alert("Failed to delete shipping method: " + err.message);
    }
  };

  // ----------------------------------------------------------------------
  // 3. FEATURES (CRAFTSMANSHIP PILLARS)
  // ----------------------------------------------------------------------
  const [features, setFeatures] = useState([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [editingFeatureIndex, setEditingFeatureIndex] = useState(null);
  const [featureForm, setFeatureForm] = useState({
    id: "",
    title: "",
    badge: "",
    desc: "",
  });

  const fetchFeatures = async () => {
    setFeaturesLoading(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/features");
      setFeatures(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFeaturesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "features" || activeTab === "services") fetchFeatures();
  }, [activeTab]);

  const handleOpenEditFeature = (f, idx) => {
    setEditingFeatureIndex(idx);
    setFeatureForm({ ...f });
    setIsFeatureModalOpen(true);
  };

  const handleOpenAddFeature = () => {
    setEditingFeatureIndex(null);
    setFeatureForm({
      id: `feat-${Date.now()}`,
      title: "",
      badge: "AUTHENTIC",
      desc: "",
    });
    setIsFeatureModalOpen(true);
  };

  const handleSaveFeature = async (e) => {
    e.preventDefault();
    let updated;
    if (editingFeatureIndex !== null) {
      updated = [...features];
      updated[editingFeatureIndex] = featureForm;
    } else {
      updated = [...features, featureForm];
    }
    try {
      await adminAuthService.fetch("/api/v1/admin/features", {
        method: "POST",
        body: JSON.stringify({ features: updated }),
      });
      setFeatures(updated);
      setIsFeatureModalOpen(false);
      await syncStorefrontSettings();
      showFeedback("Craftsmanship pillar updated!");
    } catch (err) {
      alert("Failed to save feature: " + err.message);
    }
  };

  const handleDeleteFeature = async (idx) => {
    if (!window.confirm("Remove this craftsmanship pillar?")) return;
    const updated = features.filter((_, i) => i !== idx);
    try {
      await adminAuthService.fetch("/api/v1/admin/features", {
        method: "POST",
        body: JSON.stringify({ features: updated }),
      });
      setFeatures(updated);
      await syncStorefrontSettings();
      showFeedback("Feature removed.");
    } catch (err) {
      alert("Failed to delete feature: " + err.message);
    }
  };

  // ----------------------------------------------------------------------
  // 4. FAQS
  // ----------------------------------------------------------------------
  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqSearch, setFaqSearch] = useState("");
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ id: "", question: "", answer: "" });
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);

  const fetchFaqs = async () => {
    setFaqLoading(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/faqs");
      setFaqs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFaqLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "faqs") fetchFaqs();
  }, [activeTab]);

  const handleOpenAddFaq = () => {
    setEditingFaq(null);
    setFaqForm({ id: `faq-${Date.now()}`, question: "", answer: "" });
    setIsFaqModalOpen(true);
  };

  const handleOpenEditFaq = (f) => {
    setEditingFaq(f);
    setFaqForm({ ...f });
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = async (e) => {
    e.preventDefault();
    let updated;
    if (editingFaq) {
      updated = faqs.map((f) => (f.id === editingFaq.id ? faqForm : f));
    } else {
      updated = [...faqs, faqForm];
    }
    try {
      await adminAuthService.fetch("/api/v1/admin/faqs", {
        method: "POST",
        body: JSON.stringify({ faqs: updated }),
      });
      setFaqs(updated);
      setIsFaqModalOpen(false);
      await syncStorefrontSettings();
      showFeedback(editingFaq ? "FAQ updated successfully!" : "FAQ created!");
    } catch (err) {
      alert("Failed to save FAQ: " + err.message);
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm("Remove this FAQ?")) return;
    const updated = faqs.filter((f) => f.id !== id);
    try {
      await adminAuthService.fetch("/api/v1/admin/faqs", {
        method: "POST",
        body: JSON.stringify({ faqs: updated }),
      });
      setFaqs(updated);
      await syncStorefrontSettings();
      showFeedback("FAQ deleted.");
    } catch (err) {
      alert("Failed to delete FAQ: " + err.message);
    }
  };

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question?.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.answer?.toLowerCase().includes(faqSearch.toLowerCase())
  );

  // ----------------------------------------------------------------------
  // 5. BLOGS
  // ----------------------------------------------------------------------
  const [blogs, setBlogs] = useState([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogSearch, setBlogSearch] = useState("");
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [blogForm, setBlogForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    coverImage: "https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=800&q=80",
  });

  const fetchBlogs = async () => {
    setBlogLoading(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/blogs");
      setBlogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setBlogLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "blogs") fetchBlogs();
  }, [activeTab]);

  const handlePublishBlog = async (e) => {
    e.preventDefault();
    try {
      await adminAuthService.fetch("/api/v1/admin/blogs", {
        method: "POST",
        body: JSON.stringify(blogForm),
      });
      setIsBlogModalOpen(false);
      setBlogForm({ title: "", excerpt: "", content: "", coverImage: "https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=800&q=80" });
      showFeedback("Craftsmanship article published!");
      fetchBlogs();
    } catch (err) {
      alert("Failed to publish blog: " + err.message);
    }
  };

  const handleDeleteBlog = async (id) => {
    if (!window.confirm("Delete this blog article?")) return;
    try {
      await adminAuthService.fetch(`/api/v1/admin/blogs/${id}`, {
        method: "DELETE",
      });
      showFeedback("Article deleted.");
      fetchBlogs();
    } catch (err) {
      alert("Failed to delete blog: " + err.message);
    }
  };

  const filteredBlogs = blogs.filter(
    (b) =>
      b.title?.toLowerCase().includes(blogSearch.toLowerCase()) ||
      b.excerpt?.toLowerCase().includes(blogSearch.toLowerCase())
  );

  // ----------------------------------------------------------------------
  // 6. POLICY & CONTENT PAGES
  // ----------------------------------------------------------------------
  const INITIAL_PAGES = [
    {
      id: "faq",
      title: "FAQs",
      subtitle: "Frequently Asked Questions (FAQ) – Kinglet Furniture",
      path: "/faq",
      badge: "HELP & ORDERS",
      summary: "Order processes, VAT regulations, seasonal clearance discounts, and delivery FAQ.",
      content: "Great furniture, incredible offers! Experience the perfect combination of quality and savings at Kinglet. Special seasonal offers and bundled bridal sets are available online and in our Mirpur showroom.\n\nAll product prices of Kinglet Furniture are displayed excluding VAT as per Bangladesh Government regulations. The applicable government taxes are clearly specified during checkout and on your official invoice.\n\nWe offer door-delivery service throughout Dhaka and all 64 districts in Bangladesh. The customer is responsible for all associated transportation and labor charges.\n\nEvery piece is crafted from 100% seasoned solid timber with Italian PU finish and sealed with our 10-year timber guarantee.",
    },
    {
      id: "about-us",
      title: "About Us",
      subtitle: "Kinglet Furniture & Interior Limited: Where Craftsmanship Meets Contemporary Living",
      path: "/about-us",
      badge: "HERITAGE",
      summary: "Company heritage, skilled artisans, factory direct sales, and solid timber philosophy.",
      content: "Founded in 2019, Kinglet Furniture & Interior is a premier manufacturer and direct retailer of fine home and office furnishings. We blend innovative, contemporary design with uncompromising craftsmanship to create interiors that inspire. Our dedicated team of skilled designers constantly researches new trends and technologies, ensuring our collections are as forward-thinking as they are functional.\n\nQuality is the foundation of everything we make. In our advanced manufacturing facility, over 100 skilled artisans utilize cutting-edge technology and the finest raw materials to build every product to perfect standards. By controlling the entire process—from design and production to direct sales in our own showroom—we guarantee exceptional value without ever compromising on integrity.\n\nAbove all, we believe our customers are partners. We are committed to providing not just beautiful, lasting furniture, but also an unparalleled standard of service. Your vision is our inspiration, and your satisfaction is the true measure of our success.",
    },
    {
      id: "privacy-policy",
      title: "Privacy Policy",
      subtitle: "Last Updated: 2026 • Kinglet Furniture and Interior",
      path: "/privacy-policy",
      badge: "LEGAL",
      summary: "Customer phone, address, and online payment transaction privacy standards in Bangladesh.",
      content: "Welcome to Kinglet Furniture and Interior. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you visit our website, visit our showrooms, or interact with our services in Bangladesh.\n\n1. Information We Collect: We collect information to provide you with a seamless experience and improve our services, including your name, phone number, email address, delivery address, and payment confirmation details.\n\n2. How We Use Your Information: We use the information we collect to process purchases, arrange delivery, installation, and manage returns or warranties; to respond to inquiries; and to protect our mutual transactions.\n\n3. How We Share Your Information: We value your trust and do not sell your personal data. We share details solely with licensed logistics partners for delivery.\n\n4. Data Security: We implement TLS encryption and secure database controls to safeguard your confidential customer profile.",
    },
    {
      id: "warranty-terms",
      title: "Warranty & Service Terms",
      subtitle: "Warranty Policy – Kinglet Furniture & Interior",
      path: "/warranty-terms",
      badge: "WARRANTY",
      summary: "12-month service warranty, 5-year wood-louse guarantee, and replacement conditions.",
      content: "• 12-Month Service Warranty: Covers parts and labor for wood cracks and loose joints. It excludes damages resulting from misuse or normal wear and tear.\n\n• 5-Year Wood-Louse Guarantee: 5-year guarantee against wood-louse (ghun puka). Infested parts will be replaced free of charge.\n\n• Exclusions: No warranty or guarantee is applicable for glass, fabric, rexine, marble, termite, and other decorative accessories.\n\n• Customized Orders: All customized furniture orders are non-refundable.\n\n• Challan Inspection: Please inspect goods thoroughly upon delivery. Any problems must be noted in writing on the challan at that time. Subsequent claims will not be accepted.\n\n• Invoice Requirement: For availing warranty service, customers must present the original copy of the Invoice.",
    },
    {
      id: "exchange-return",
      title: "Exchange and Return",
      subtitle: "Authentic guidelines for furniture exchange and refunds at Kinglet",
      path: "/exchange-return",
      badge: "RETURN POLICY",
      summary: "3-day exchange with 5% service fee and 3-day return with 10% charge policy.",
      content: "• Exchange Policy: Furniture can be exchanged in good condition within 3 days with a 5% service charge. Note: It is not applicable for customized orders, set-broken products, or fabric products.\n\n• Return-Refund Policy: Furniture can be returned in good condition within 3 days and money can be refunded with a 10% service charge. Note: It is not applicable for customized orders, set-broken products, or fabric products.\n\n• Inspection Procedure: Items must be inspected upon delivery with our assembly carpenter. Written acknowledgement on the delivery challan is mandatory.",
    },
    {
      id: "delivery",
      title: "Delivery",
      subtitle: "Delivery Policy – Kinglet Furniture & Interior",
      path: "/delivery",
      badge: "SHIPPING",
      summary: "White-glove delivery to all 64 districts, challan sign-off, and customer care.",
      content: "• Door-Delivery Service: We offer convenient door-delivery service across Bangladesh. The customer is responsible for all associated transportation and labor charges.\n\n• Inspection Upon Delivery: Please inspect all goods thoroughly upon delivery. Any problems, scratches, or issues must be noted in writing on the challan at that time. Subsequent claims will not be accepted.\n\n• Customer Handling Care: Customers are requested to carry and position products with due care once received from our delivery team to preserve joints and finishes.\n\n• Assembly: Complimentary carpenter assembly is provided within Dhaka metropolitan area.",
    },
    {
      id: "care-maintenance",
      title: "Care & Maintenance",
      subtitle: "Expert guidelines to preserve your solid wood and upholstery furniture",
      path: "/care-maintenance",
      badge: "CARE GUIDE",
      summary: "Preserving Italian PU lacquer, ambient humidity control, and upholstery maintenance.",
      content: "• Solid Wood Care: To prevent staining, please wipe any spills immediately with a soft, dry cloth. For everyday care, simply dust with a soft, dry cloth. For cleaning, use a slightly damp cloth and then dry the surface immediately to prevent water spots.\n\n• Protect From Humidity & Heat: To ensure longevity, protect fine wood from extreme humidity and temperature. Solid wood tops may expand in summer and contract in winter, which is a normal and harmless natural process. Always use a protective pad under hot or damp items.\n\n• Solvents & Direct Sun: Avoid placing products containing solvents (nail polish remover, perfume, hairspray, glass cleaner) directly on wooden surfaces. Protect from continuous direct sunlight to prevent UV fading.\n\n• Moving Furniture: To protect your floors and the furniture joinery, please lift rather than drag when repositioning pieces.",
    },
  ];

  const [policyPages, setPolicyPages] = useState(INITIAL_PAGES);
  const [editingPage, setEditingPage] = useState(null);
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [pageForm, setPageForm] = useState({ id: "", title: "", subtitle: "", path: "", summary: "", content: "", metaTitle: "", metaDescription: "" });

  const fetchPolicyPages = async () => {
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/pages");
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setPolicyPages(res.data);
      }
    } catch (err) {
      console.warn("Could not fetch policy pages:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "pages") fetchPolicyPages();
  }, [activeTab]);

  const handleOpenEditPage = (p) => {
    setEditingPage(p);
    setPageForm({
      id: p.id || "",
      title: p.title || "",
      subtitle: p.subtitle || "",
      path: p.path || "",
      summary: p.summary || "",
      content: p.content || "",
      metaTitle: p.metaTitle || "",
      metaDescription: p.metaDescription || "",
    });
    setPageModalOpen(true);
  };

  const handleSavePageContent = async (e) => {
    e.preventDefault();
    try {
      await adminAuthService.fetch(`/api/v1/admin/pages/${pageForm.id}`, {
        method: "PUT",
        body: JSON.stringify(pageForm),
      });
      const updated = policyPages.map((p) => (p.id === pageForm.id ? { ...p, ...pageForm } : p));
      setPolicyPages(updated);
      setPageModalOpen(false);
      await syncStorefrontSettings();
      window.dispatchEvent(new CustomEvent("kinglet_pages_updated", { detail: updated }));
      showFeedback(`Page "${pageForm.title}" content updated and persisted!`);
    } catch (err) {
      alert("Failed to save page: " + err.message);
    }
  };

  // ----------------------------------------------------------------------
  // 7. SUBSCRIBERS
  // ----------------------------------------------------------------------
  const [subscribers, setSubscribers] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subSearch, setSubSearch] = useState("");
  const [isAddSubModalOpen, setIsAddSubModalOpen] = useState(false);
  const [newSubEmail, setNewSubEmail] = useState("");

  const fetchSubscribers = async () => {
    setSubsLoading(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/subscribers");
      setSubscribers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSubsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "subscribers") fetchSubscribers();
  }, [activeTab]);

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Email,Subscription Date,Status", ...subscribers.map((s) => `${s.email},${s.date || "2026-10-28"},${s.status || "Active"}`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kinglet_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showFeedback("Subscribers list exported as CSV!");
  };

  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    if (!newSubEmail) return;
    const updated = [
      ...subscribers,
      { id: `sub-${Date.now()}`, email: newSubEmail, date: new Date().toISOString().slice(0, 10), status: "Active" },
    ];
    try {
      await adminAuthService.fetch("/api/v1/cms/settings", {
        method: "PUT",
        body: JSON.stringify({
          key: "newsletter_subscribers",
          value: JSON.stringify(updated),
          group: "marketing",
        }),
      });
      setSubscribers(updated);
      setNewSubEmail("");
      setIsAddSubModalOpen(false);
      showFeedback("VIP subscriber added!");
    } catch (err) {
      alert("Failed to add subscriber: " + err.message);
    }
  };

  const handleDeleteSub = async (id) => {
    try {
      await adminAuthService.fetch(`/api/v1/admin/subscribers/${id}`, {
        method: "DELETE",
      });
      showFeedback("Subscriber removed.");
      fetchSubscribers();
    } catch (err) {
      alert("Failed to remove subscriber: " + err.message);
    }
  };

  // ----------------------------------------------------------------------
  // 8. SYSTEM BACKUP
  // ----------------------------------------------------------------------
  const handleDownloadBackup = async () => {
    try {
      const res = await fetch("/api/v1/admin/backup/export", {
        headers: {
          Authorization: `Bearer ${adminAuthService.getToken()}`,
        },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kinglet_db_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showFeedback("Database snapshot downloaded!");
    } catch (err) {
      alert("Backup export failed: " + err.message);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
          CMS & Platform Operations Hub
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          Manage website content, store policies, hero banners, timber articles, FAQs, and database archives.
        </p>
      </div>

      {message && (
        <div style={{ padding: "12px 18px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", fontSize: "14px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>✅</span>
          <span>{message}</span>
        </div>
      )}

      {/* Navigation Tab Bar with Group Switcher */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "24px", background: "#ffffff", padding: "12px 16px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px" }}>📑</span>
            <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "#0f172a" }}>
              Manage Site Configuration (18 Sub-Options)
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            Active Panel: <strong style={{ color: "#ec2226", background: "#fef2f2", padding: "2px 8px", borderRadius: "4px" }}>{activeTab.replace(/_/g, " ").toUpperCase()}</strong>
          </div>
        </div>

        {/* Manage Site 18 Options */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { key: "general_settings", label: "General Settings", icon: "⚙️" },
            { key: "notice_scroller", label: "Home Notice Scroller", icon: "📢" },
            { key: "menu_builder", label: "Menu Builder", icon: "🧭" },
            { key: "home_page", label: "Home Page", icon: "🏠" },
            { key: "banners", label: "Sliders", icon: "🖼️" },
            { key: "features", label: "Services", icon: "⭐" },
            { key: "visibility", label: "Visibility", icon: "👁️" },
            { key: "storage_settings", label: "Storage Settings", icon: "💽" },
            { key: "social_login", label: "Social Login", icon: "🔑" },
            { key: "email_settings", label: "Email Settings", icon: "✉️" },
            { key: "sms_settings", label: "SMS Settings", icon: "💬" },
            { key: "announcement", label: "Announcement", icon: "🔔" },
            { key: "cookies_alert", label: "Cookies Alert", icon: "🍪" },
            { key: "maintainance", label: "Maintainance", icon: "🚧" },
            { key: "sitemap", label: "Sitemap", icon: "🗺️" },
            { key: "schema", label: "Schema", icon: "📐" },
            { key: "robots_txt", label: "Robots.txt", icon: "🤖" },
            { key: "language", label: "Language", icon: "🌐" },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => switchTab(tab.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  border: isActive ? "1px solid #0f172a" : "1px solid #e2e8f0",
                  background: isActive ? "#0f172a" : "#f8fafc",
                  color: isActive ? "#ffffff" : "#475569",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content & Logistics Options */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "10px", borderTop: "1px dashed #e2e8f0", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Content & Operations:</span>
          {[
            { key: "pages", label: "Manages Pages", icon: "📄" },
            { key: "faqs", label: "Manage FAQs", icon: "❓" },
            { key: "blogs", label: "Manage Blogs", icon: "📰" },
            { key: "shipping", label: "Shipping Methods", icon: "🚚" },
            { key: "subscribers", label: "Subscribers List", icon: "📬" },
            { key: "backup", label: "System Backup", icon: "💾" },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => switchTab(tab.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  border: isActive ? "1px solid #0f172a" : "1px solid #e2e8f0",
                  background: isActive ? "#0f172a" : "#ffffff",
                  color: isActive ? "#ffffff" : "#475569",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================== */}
      {/* TAB 1: MANAGE PAGES (USER-FRIENDLY POLICY & STORE DIRECTORY) */}
      {/* ====================================================================== */}
      {activeTab === "pages" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Content & Policy Pages Directory
              </h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Interactive documentation editor with live preview links and Google SEO synchronization.
              </span>
            </div>
            <Link
              to="/admin/seo"
              style={{
                padding: "8px 16px",
                background: "#f1f5f9",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🔍</span> SEO & Meta Tags Portal →
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
            {policyPages.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px", background: "#dcfce7", color: "#166534" }}>
                      ● {p.badge}
                    </span>
                    <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#0284c7" }}>
                      {p.path}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "6px 0 6px" }}>
                    {p.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px", lineHeight: 1.5 }}>
                    {p.summary}
                  </p>
                </div>

                {/* User-Friendly Action Buttons */}
                <div style={{ display: "flex", gap: "8px", paddingTop: "14px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleOpenEditPage(p)}
                    style={{
                      flexGrow: 1,
                      padding: "8px 12px",
                      background: "#0f172a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <span>✏️</span> Edit Content
                  </button>

                  <a
                    href={p.path}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "8px 12px",
                      background: "#f8fafc",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>👁️</span> Live ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: MANAGE FEATURES / SERVICES (CRAFTSMANSHIP PILLARS) */}
      {/* ====================================================================== */}
      {(activeTab === "features" || activeTab === "services") && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Kinglet Craftsmanship & Quality Pillars
              </h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                These 4 trust badges are displayed on every product card, cart, and checkout page.
              </span>
            </div>
            <button
              onClick={handleOpenAddFeature}
              style={{
                padding: "8px 16px",
                background: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Add Quality Pillar
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {features.map((f, i) => (
              <div key={i} style={{ padding: "20px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px", background: "#fef3c7", color: "#92400e" }}>
                    {f.badge}
                  </span>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "10px 0 6px" }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                    {f.desc}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                  <button
                    onClick={() => handleOpenEditFeature(f, i)}
                    style={{ padding: "6px 12px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFeature(i)}
                    style={{ padding: "6px 12px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 3: MANAGE FAQS */}
      {/* ====================================================================== */}
      {activeTab === "faqs" && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Frequently Asked Questions ({faqs.length})
              </h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Timber care, warranty, delivery, and customization answers for customer support.
              </span>
            </div>
            <button
              onClick={handleOpenAddFaq}
              style={{
                padding: "8px 16px",
                background: "#0f172a",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Add FAQ Question
            </button>
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: "16px", maxWidth: "420px" }}>
            <input
              type="text"
              placeholder="Search questions or keywords..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredFaqs.map((f) => (
              <div
                key={f.id}
                style={{
                  padding: "16px 20px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                }}
              >
                <div style={{ flexGrow: 1 }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                    Q: {f.question}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                    {f.answer}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    onClick={() => handleOpenEditFaq(f)}
                    style={{ padding: "6px 12px", background: "#e2e8f0", border: "none", borderRadius: "4px", color: "#0f172a", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFaq(f.id)}
                    style={{ padding: "6px 12px", background: "#fee2e2", border: "none", borderRadius: "4px", color: "#dc2626", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 4: MANAGE BLOGS */}
      {/* ====================================================================== */}
      {activeTab === "blogs" && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Timber Craftsmanship & Design Articles ({blogs.length})
              </h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Educational stories, seasoning science, and interior design inspiration.
              </span>
            </div>
            <button
              onClick={() => setIsBlogModalOpen(true)}
              style={{
                padding: "8px 16px",
                background: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Publish New Article
            </button>
          </div>

          <div style={{ marginBottom: "16px", maxWidth: "420px" }}>
            <input
              type="text"
              placeholder="Search published articles..."
              value={blogSearch}
              onChange={(e) => setBlogSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredBlogs.map((b) => (
              <div key={b.id} style={{ display: "flex", gap: "18px", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", alignItems: "center", flexWrap: "wrap" }}>
                {b.coverImage && (
                  <img
                    src={b.coverImage}
                    alt={b.title}
                    width="140"
                    height="90"
                    loading="lazy"
                    style={{ width: "140px", height: "90px", objectFit: "cover", borderRadius: "8px" }}
                  />
                )}
                <div style={{ flexGrow: 1, minWidth: "260px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7", textTransform: "uppercase" }}>
                    {b.category?.name || "Craftsmanship"}
                  </span>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: "4px 0 6px" }}>
                    {b.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 8px", maxWidth: "600px" }}>
                    {b.excerpt}
                  </p>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      Published: {new Date(b.publishedAt || b.createdAt).toLocaleDateString("en-GB")}
                    </span>
                    <button
                      onClick={() => handleDeleteBlog(b.id)}
                      style={{ padding: "3px 8px", background: "none", border: "1px solid #fecaca", borderRadius: "4px", color: "#dc2626", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Delete Article
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 5: SHIPPING METHODS */}
      {/* ====================================================================== */}
      {activeTab === "shipping" && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Shipping Rates & Assembly Methods
              </h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Active logistics tariffs for Dhaka City Express and Nationwide crating.
              </span>
            </div>
            <button
              onClick={() => {
                setEditingShipping(null);
                setShippingForm({ code: "", title: "", description: "", baseRate: 500, freeAssembly: true, isActive: true });
                setIsShippingModalOpen(true);
              }}
              style={{
                padding: "8px 16px",
                background: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              + Add Shipping Method
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, textTransform: "uppercase", fontSize: "11px" }}>
                  <th style={{ padding: "12px 18px" }}>Method Name & Code</th>
                  <th style={{ padding: "12px 18px" }}>Description</th>
                  <th style={{ padding: "12px 18px" }}>Base Rate</th>
                  <th style={{ padding: "12px 18px" }}>Carpenter Assembly</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {shippingMethods.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{m.title}</div>
                      <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>{m.code}</span>
                    </td>
                    <td style={{ padding: "14px 18px", color: "#475569" }}>
                      {m.description}
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: 800, color: "#0f172a" }}>
                      {m.baseRate === 0 ? "FREE" : `৳${Number(m.baseRate).toLocaleString()}`}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: m.freeAssembly ? "#dcfce7" : "#f1f5f9", color: m.freeAssembly ? "#166534" : "#64748b" }}>
                        {m.freeAssembly ? "Free Assembly Included" : "Standard Delivery"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditShipping(m)}
                        style={{
                          padding: "5px 12px",
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          color: "#0f172a",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          marginRight: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
                      >
                        <span>✏️</span> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteShipping(m.id)}
                        style={{
                          padding: "5px 10px",
                          background: "#fff1f2",
                          border: "1px solid #fecaca",
                          borderRadius: "6px",
                          color: "#dc2626",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#fff1f2"; }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 6: SLIDERS / BANNERS */}
      {/* ====================================================================== */}
      {(activeTab === "banners" || activeTab === "sliders") && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Homepage Hero Sliders & Banners
              </h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Active showcase sliders displayed on the storefront</span>
            </div>
            <button
              onClick={handleOpenAddBanner}
              style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            >
              + Add Hero Banner
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {banners.map((b) => (
              <div key={b.id} style={{ display: "flex", gap: "14px", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", alignItems: "center" }}>
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  width="120"
                  height="80"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80";
                  }}
                  style={{ width: "120px", height: "80px", objectFit: "cover", borderRadius: "6px" }}
                />
                <div style={{ flexGrow: 1 }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: "#ef4444", color: "#fff" }}>
                    {b.badge || "FEATURED"}
                  </span>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", margin: "4px 0 2px" }}>
                    {b.title}
                  </h3>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px" }}>
                    {b.subtitle}
                  </p>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      onClick={() => handleOpenEditBanner(b)}
                      style={{ padding: "4px 10px", background: "#0f172a", border: "none", borderRadius: "4px", color: "#ffffff", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(b.id)}
                      style={{ padding: "4px 8px", background: "none", border: "1px solid #fecaca", borderRadius: "4px", color: "#dc2626", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MANAGE SITE SUB-OPTIONS TABS */}
      {/* ====================================================================== */}

      {/* 1. GENERAL SETTINGS */}
      {(activeTab === "settings" || activeTab === "general_settings") && (
        <GeneralSettingsTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* 2. HOME NOTICE SCROLLER */}
      {activeTab === "notice_scroller" && (
        <NoticeScrollerTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* 3. MENU BUILDER */}
      {activeTab === "menu_builder" && (
        <MenuBuilderTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* 4. HOME PAGE */}
      {activeTab === "home_page" && (
        <HomePageTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* 7. VISIBILITY */}
      {activeTab === "visibility" && (
        <VisibilityTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* 8. STORAGE SETTINGS */}
      {activeTab === "storage_settings" && (
        <StorageSettingsTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* 9. SOCIAL LOGIN */}
      {activeTab === "social_login" && (
        <SocialLoginTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* 10. EMAIL SETTINGS */}
      {activeTab === "email_settings" && (
        <EmailSettingsTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* 11. SMS SETTINGS */}
      {activeTab === "sms_settings" && (
        <SmsSettingsTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* 12. ANNOUNCEMENT */}
      {activeTab === "announcement" && (
        <AnnouncementTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* 13. COOKIES ALERT */}
      {activeTab === "cookies_alert" && (
        <CookiesAlertTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* 14. MAINTAINANCE */}
      {(activeTab === "maintainance" || activeTab === "maintenance") && (
        <MaintenanceTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* 15. SITEMAP */}
      {activeTab === "sitemap" && (
        <SitemapTab />
      )}

      {/* 16. SCHEMA */}
      {activeTab === "schema" && (
        <SchemaTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* 17. ROBOTS.TXT */}
      {activeTab === "robots_txt" && (
        <RobotsTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* 18. LANGUAGE */}
      {activeTab === "language" && (
        <LanguageTab
          settings={settings}
          onSave={saveSettingBatch}
          saving={savingSettings}
        />
      )}

      {/* ====================================================================== */}
      {/* TAB 8: SUBSCRIBERS */}
      {/* ====================================================================== */}
      {activeTab === "subscribers" && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Newsletter & VIP Catalog Subscribers ({subscribers.length})
              </h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Clients subscribed to seasonal deals, bridal catalogs, and interior launches.
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setIsAddSubModalOpen(true)}
                style={{ padding: "8px 14px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                + Add Client Email
              </button>
              <button
                onClick={handleExportCSV}
                style={{ padding: "8px 14px", background: "#15803d", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <span>📥</span> Export CSV
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "16px", maxWidth: "420px" }}>
            <input
              type="text"
              placeholder="Search subscriber emails..."
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, textTransform: "uppercase", fontSize: "11px" }}>
                  <th style={{ padding: "12px 18px" }}>Subscriber Email</th>
                  <th style={{ padding: "12px 18px" }}>Subscription Date</th>
                  <th style={{ padding: "12px 18px" }}>Status</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {subscribers
                  .filter((s) => s.email?.toLowerCase().includes(subSearch.toLowerCase()))
                  .map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 18px", fontWeight: 700, color: "#0f172a" }}>
                        {s.email}
                      </td>
                      <td style={{ padding: "14px 18px", color: "#64748b" }}>
                        {s.date || "2026-10-28"}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#dcfce7", color: "#166534" }}>
                          {s.status || "Active"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <button
                          onClick={() => handleDeleteSub(s.id)}
                          style={{ padding: "4px 8px", background: "none", border: "1px solid #fecaca", borderRadius: "4px", color: "#dc2626", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                        >
                          Unsubscribe
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 9: SYSTEM BACKUP */}
      {/* ====================================================================== */}
      {activeTab === "backup" && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "28px", maxWidth: "680px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "20px" }}>
            <span style={{ fontSize: "36px" }}>💾</span>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                Complete MySQL Database Snapshot
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                Generate an immediate JSON archive containing all Kinglet catalog products, categories, orders, store settings, banners, coupons, and staff records.
              </p>
            </div>
          </div>

          <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>Snapshot Includes:</div>
            <ul style={{ fontSize: "12px", color: "#475569", margin: 0, paddingLeft: "18px", lineHeight: 1.6 }}>
              <li>110 Handcrafted Furniture Products & Variants</li>
              <li>21 Timber Product Categories & Subcategories</li>
              <li>Order Pipeline History & Production Milestones</li>
              <li>Shipping Methods, Coupons, and Customer Records</li>
            </ul>
          </div>

          <button
            onClick={handleDownloadBackup}
            style={{ padding: "12px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <span>⬇️</span> Download Database Backup (.json)
          </button>
        </div>
      )}

      {/* ====================================================================== */}
      {/* PAGE CONTENT EDIT MODAL */}
      {/* ====================================================================== */}
      {pageModalOpen && editingPage && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0 }}>
                Edit Page: {editingPage.title}
              </h3>
              <button onClick={() => setPageModalOpen(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}>✕</button>
            </div>

            <form onSubmit={handleSavePageContent} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Page Title</label>
                <input
                  type="text"
                  required
                  value={pageForm.title}
                  onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Page Subtitle / Tagline</label>
                <input
                  type="text"
                  value={pageForm.subtitle || ""}
                  onChange={(e) => setPageForm({ ...pageForm, subtitle: e.target.value })}
                  placeholder="e.g. 10-Year Timber Guarantee & Heritage Craftsmanship"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>URL Slug (Canonical Route)</label>
                <input
                  type="text"
                  disabled
                  value={pageForm.path}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", borderRadius: "6px", boxSizing: "border-box", fontFamily: "monospace" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Excerpt Summary (Shown on previews & search)</label>
                <input
                  type="text"
                  value={pageForm.summary}
                  onChange={(e) => setPageForm({ ...pageForm, summary: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Detailed Policy / Body Content</label>
                <textarea
                  required
                  rows={10}
                  value={pageForm.content}
                  onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box", fontSize: "13px", lineHeight: 1.6, fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>SEO Meta Title (Google SERP Title)</label>
                <input
                  type="text"
                  value={pageForm.metaTitle || ""}
                  onChange={(e) => setPageForm({ ...pageForm, metaTitle: e.target.value })}
                  placeholder="e.g. Warranty & Service Terms (10-Year Timber Guarantee) | Kinglet"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>SEO Meta Description (Google Snippet)</label>
                <input
                  type="text"
                  value={pageForm.metaDescription || ""}
                  onChange={(e) => setPageForm({ ...pageForm, metaDescription: e.target.value })}
                  placeholder="e.g. Official 10-Year Timber replacement warranty terms against termites and borer beetles..."
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                <button type="button" onClick={() => setPageModalOpen(false)} style={{ padding: "8px 14px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 18px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Save & Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* FEATURE EDIT MODAL */}
      {/* ====================================================================== */}
      {isFeatureModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "480px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 16px" }}>
              {editingFeatureIndex !== null ? "Edit Craftsmanship Pillar" : "Add Craftsmanship Pillar"}
            </h3>
            <form onSubmit={handleSaveFeature} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700 }}>Feature Title</label>
                <input
                  type="text"
                  required
                  value={featureForm.title}
                  onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
                  placeholder="e.g. 10-Year Timber Warranty"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700 }}>Badge Tag</label>
                <input
                  type="text"
                  required
                  value={featureForm.badge}
                  onChange={(e) => setFeatureForm({ ...featureForm, badge: e.target.value })}
                  placeholder="e.g. GUARANTEED or 12% MOISTURE"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700 }}>Description</label>
                <textarea
                  required
                  rows={3}
                  value={featureForm.desc}
                  onChange={(e) => setFeatureForm({ ...featureForm, desc: e.target.value })}
                  placeholder="Describe the craftsmanship guarantee..."
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button type="button" onClick={() => setIsFeatureModalOpen(false)} style={{ padding: "8px 14px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "6px" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 700 }}>Save Pillar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* FAQ MODAL */}
      {/* ====================================================================== */}
      {isFaqModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "480px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 16px" }}>
              {editingFaq ? "Edit FAQ Question" : "Add FAQ Question"}
            </h3>
            <form onSubmit={handleSaveFaq} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700 }}>Question</label>
                <input
                  type="text"
                  required
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  placeholder="e.g. What is the timber seasoning process?"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700 }}>Answer</label>
                <textarea
                  required
                  rows={4}
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  placeholder="Provide a clear, helpful explanation..."
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button type="button" onClick={() => setIsFaqModalOpen(false)} style={{ padding: "8px 14px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "6px" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 700 }}>Save FAQ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* ADD SUBSCRIBER MODAL */}
      {/* ====================================================================== */}
      {isAddSubModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "420px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 16px" }}>Register VIP Client Email</h3>
            <form onSubmit={handleAddSubscriber} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700 }}>Client Email Address</label>
                <input
                  type="email"
                  required
                  value={newSubEmail}
                  onChange={(e) => setNewSubEmail(e.target.value)}
                  placeholder="e.g. client@domain.com"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button type="button" onClick={() => setIsAddSubModalOpen(false)} style={{ padding: "8px 14px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "6px" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 700 }}>Save Subscriber</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* BANNER CREATION & EDIT MODAL */}
      {/* ====================================================================== */}
      {isBannerModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "14px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                {editingBanner ? "✏️ Edit Homepage Hero Banner" : "➕ Add Homepage Hero Banner"}
              </h3>
              <button
                type="button"
                onClick={() => { setIsBannerModalOpen(false); setEditingBanner(null); }}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveBanner} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px", color: "#334155" }}>Headline Title</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="e.g. Royal Solid Wood Bedroom Suites"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px", color: "#334155" }}>Subtitle</label>
                <input
                  type="text"
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="e.g. Generational craftsmanship with 10-year timber guarantee"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box", fontSize: "13px" }}
                />
              </div>

              {/* DIRECT JPG IMAGE UPLOAD SECTION */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>
                    Banner Image (Upload JPG / PNG) *
                  </label>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Max 15MB • Auto-WebP</span>
                </div>

                <input
                  ref={bannerFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleBannerFileSelect}
                />

                {bannerForm.imageUrl ? (
                  <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", background: "#f8fafc" }}>
                    <div style={{ position: "relative", width: "100%", height: "160px", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      <img
                        src={bannerForm.imageUrl}
                        alt="Banner Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                      {bannerUploading && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#ffffff", gap: "8px" }}>
                          <div style={{ width: "24px", height: "24px", border: "3px solid #ffffff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          <span style={{ fontSize: "12px", fontWeight: 600 }}>Optimizing & uploading JPG...</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", background: "#ffffff", borderTop: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "11.5px", color: "#64748b", fontFamily: "monospace", maxWidth: "230px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {bannerForm.imageUrl.startsWith("blob:") ? "Local JPG Preview (Uploading...)" : bannerForm.imageUrl.split("/").pop()}
                      </span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => bannerFileInputRef.current?.click()}
                          disabled={bannerUploading}
                          style={{
                            padding: "6px 12px",
                            background: "#0f172a",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>📁</span> Replace JPG
                        </button>
                        <button
                          type="button"
                          onClick={() => setBannerForm((prev) => ({ ...prev, imageUrl: "" }))}
                          disabled={bannerUploading}
                          style={{
                            padding: "6px 10px",
                            background: "#fee2e2",
                            color: "#b91c1c",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => bannerFileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files?.[0]) {
                        handleBannerFileSelect({ target: { files: e.dataTransfer.files } });
                      }
                    }}
                    style={{
                      border: "2px dashed #cbd5e1",
                      borderRadius: "10px",
                      padding: "26px 16px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: "#f8fafc",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>🖼️</div>
                    <div style={{ fontSize: "13.5px", fontWeight: 750, color: "#0f172a", marginBottom: "4px" }}>
                      Click to Browse or Drag & Drop JPG Image
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      Upload directly from your computer (JPG, JPEG, PNG, WebP)
                    </div>
                  </div>
                )}

                {bannerUploadError && (
                  <div style={{ marginTop: "6px", fontSize: "12px", color: "#dc2626", fontWeight: 600 }}>
                    ⚠️ {bannerUploadError}
                  </div>
                )}
                {bannerUploadSuccess && (
                  <div style={{ marginTop: "6px", fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>
                    {bannerUploadSuccess}
                  </div>
                )}

                <div style={{ marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setShowManualUrlInput(!showManualUrlInput)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontSize: "11.5px",
                      color: "#64748b",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    {showManualUrlInput ? "Hide manual URL input" : "Or enter image link manually"}
                  </button>
                  {showManualUrlInput && (
                    <div style={{ marginTop: "6px" }}>
                      <input
                        type="text"
                        value={bannerForm.imageUrl}
                        onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                        placeholder="https://... or /storage/objects/banners/..."
                        style={{ width: "100%", padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", boxSizing: "border-box" }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px", color: "#334155" }}>Badge Tag</label>
                <input
                  type="text"
                  value={bannerForm.badge}
                  onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px", color: "#334155" }}>Target Route Link</label>
                <input
                  type="text"
                  value={bannerForm.targetUrl}
                  onChange={(e) => setBannerForm({ ...bannerForm, targetUrl: e.target.value })}
                  placeholder="/category/bed-room"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box", fontSize: "13px" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button type="button" onClick={() => { setIsBannerModalOpen(false); setEditingBanner(null); }} style={{ padding: "8px 14px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
                <button
                  type="submit"
                  disabled={bannerUploading}
                  style={{
                    padding: "8px 18px",
                    background: bannerUploading ? "#94a3b8" : "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 700,
                    cursor: bannerUploading ? "not-allowed" : "pointer",
                    fontSize: "13px",
                  }}
                >
                  {bannerUploading ? "Uploading JPG..." : editingBanner ? "Update Banner" : "Publish Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* SHIPPING CREATION & EDIT MODAL */}
      {/* ====================================================================== */}
      {isShippingModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#fff", padding: "26px", borderRadius: "14px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                {editingShipping ? "✏️ Edit Shipping Method" : "➕ Add Shipping Method"}
              </h3>
              <button
                type="button"
                onClick={() => { setIsShippingModalOpen(false); setEditingShipping(null); }}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer", padding: "4px" }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 18px", lineHeight: "1.4" }}>
              Configure base tariff, free assembly policy, and live description for storefront checkout.
            </p>
            <form onSubmit={handleSaveShipping} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Method Code (Unique Identifier)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sylhet_crate"
                  value={shippingForm.code}
                  readOnly={Boolean(editingShipping)}
                  onChange={(e) => setShippingForm({ ...shippingForm, code: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                    background: editingShipping ? "#f8fafc" : "#ffffff",
                    color: editingShipping ? "#64748b" : "#0f172a",
                    fontFamily: "monospace",
                    cursor: editingShipping ? "not-allowed" : "text",
                  }}
                />
                {editingShipping && (
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Unique system code cannot be changed once created.</span>
                )}
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Method Title (Shown to Customer) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Outside Dhaka Transport (3-5 Days)"
                  value={shippingForm.title}
                  onChange={(e) => setShippingForm({ ...shippingForm, title: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Base Rate (৳ BDT) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="50"
                  placeholder="0 for Free Delivery"
                  value={shippingForm.baseRate}
                  onChange={(e) => setShippingForm({ ...shippingForm, baseRate: Number(e.target.value) })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
                <span style={{ fontSize: "11px", color: "#64748b" }}>Enter 0 if delivery is free or calculated upon arrival.</span>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Customer-Facing Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dedicated transport with 3 layer shockproof wooden crating"
                  value={shippingForm.description}
                  onChange={(e) => setShippingForm({ ...shippingForm, description: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", gap: "20px", alignItems: "center", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#1e293b", cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={shippingForm.freeAssembly}
                    onChange={(e) => setShippingForm({ ...shippingForm, freeAssembly: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: "#0f172a" }}
                  />
                  Free Carpenter Assembly Included
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#1e293b", cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={shippingForm.isActive}
                    onChange={(e) => setShippingForm({ ...shippingForm, isActive: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: "#0f172a" }}
                  />
                  Active on Checkout
                </label>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => { setIsShippingModalOpen(false); setEditingShipping(null); }}
                  style={{ padding: "9px 16px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "9px 20px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                >
                  {editingShipping ? "Update Method" : "Save Method"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* BLOG CREATION MODAL */}
      {/* ====================================================================== */}
      {isBlogModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "560px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 16px" }}>Publish Craftsmanship Blog</h3>
            <form onSubmit={handlePublishBlog} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700 }}>Article Title</label>
                <input
                  type="text"
                  required
                  value={blogForm.title}
                  onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700 }}>Excerpt Summary</label>
                <input
                  type="text"
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700 }}>Full Article Content</label>
                <textarea
                  required
                  rows={5}
                  value={blogForm.content}
                  onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button type="button" onClick={() => setIsBlogModalOpen(false)} style={{ padding: "8px 14px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "6px" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 700 }}>Publish Article</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
