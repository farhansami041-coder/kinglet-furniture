import React, { useState, useEffect } from "react";
import {
  Search, Globe, RefreshCw, CheckCircle2, AlertCircle, ArrowRight,
  ExternalLink, Copy, Check, Plus, Trash2, Edit3, ShieldAlert,
  Sliders, FileText, ShoppingBag, Terminal, Code
} from "lucide-react";
import { adminAuthService } from "../../utils/adminAuthService";

export default function AdminSeoPage() {
  const [activeTab, setActiveTab] = useState("matrix"); // 'matrix' | 'redirects' | 'google'
  const [loading, setLoading] = useState(true);
  const [matrixData, setMatrixData] = useState(null);
  const [redirects, setRedirects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL"); // 'ALL' | 'PRODUCT' | 'CATEGORY' | 'PAGE'

  // Edit SEO Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    metaDescription: "",
    canonicalUrl: "",
    ogImage: "",
    ogTitle: "",
    ogDescription: "",
    isNoIndex: false,
    structuredData: "",
  });
  const [savingSeo, setSavingSeo] = useState(false);

  // New Redirect Modal State
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);
  const [redirectForm, setRedirectForm] = useState({
    sourcePath: "",
    targetPath: "",
    statusCode: 301,
    notes: "",
  });
  const [savingRedirect, setSavingRedirect] = useState(false);

  // Global Settings State
  const [siteSettings, setSiteSettings] = useState({
    google_search_console_tag: "",
    google_analytics_id: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Feedback notifications
  const [alertMsg, setAlertMsg] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [regeneratingSitemap, setRegeneratingSitemap] = useState(false);

  const fetchSeoData = async () => {
    setLoading(true);
    try {
      const [matrixRes, redirectsRes, settingsRes] = await Promise.all([
        adminAuthService.fetch("/api/v1/admin/seo/matrix"),
        adminAuthService.fetch("/api/v1/admin/seo/redirects"),
        adminAuthService.fetch("/api/v1/cms/settings"),
      ]);

      setMatrixData(matrixRes.data || null);
      setRedirects(redirectsRes.data || []);
      setSiteSettings({
        google_search_console_tag: settingsRes.data?.google_search_console_tag || "",
        google_analytics_id: settingsRes.data?.google_analytics_id || "",
      });
    } catch (err) {
      console.error("Error loading SEO data:", err);
      showAlert("Failed to load SEO configuration: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeoData();
  }, []);

  const showAlert = (msg, type = "success") => {
    setAlertMsg({ text: msg, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  // 1. Regenerate Sitemap
  const handleRegenerateSitemap = async () => {
    setRegeneratingSitemap(true);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/seo/sitemap/regenerate", {
        method: "POST",
      });
      showAlert(res.message || "Sitemap successfully regenerated with latest database URLs!");
      fetchSeoData();
    } catch (err) {
      showAlert("Sitemap generation error: " + err.message, "error");
    } finally {
      setRegeneratingSitemap(false);
    }
  };

  // 2. Open Edit SEO Modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditForm({
      title: item.title || "",
      metaDescription: item.metaDescription || "",
      canonicalUrl: item.canonicalUrl || "",
      ogImage: item.ogImage || "",
      ogTitle: item.ogTitle || "",
      ogDescription: item.ogDescription || "",
      isNoIndex: Boolean(item.isNoIndex),
      structuredData: item.structuredData || "",
    });
    setIsEditModalOpen(true);
  };

  // 3. Save SEO Metadata
  const handleSaveSeo = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingSeo(true);

    try {
      const payload = {
        ...editForm,
        productId: editingItem.type === "PRODUCT" ? editingItem.id : null,
        categoryId: editingItem.type === "CATEGORY" ? editingItem.id : null,
        pageRoute: editingItem.type === "PAGE" ? editingItem.slug : null,
      };

      await adminAuthService.fetch("/api/v1/admin/seo/metadata", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showAlert(`SEO metadata for "${editingItem.name}" updated successfully!`);
      setIsEditModalOpen(false);
      fetchSeoData();
    } catch (err) {
      showAlert("Error saving SEO: " + err.message, "error");
    } finally {
      setSavingSeo(false);
    }
  };

  // 4. Save 301 Redirect
  const handleCreateRedirect = async (e) => {
    e.preventDefault();
    setSavingRedirect(true);
    try {
      await adminAuthService.fetch("/api/v1/admin/seo/redirects", {
        method: "POST",
        body: JSON.stringify(redirectForm),
      });
      showAlert(`301 Redirect created: ${redirectForm.sourcePath} → ${redirectForm.targetPath}`);
      setIsRedirectModalOpen(false);
      setRedirectForm({ sourcePath: "", targetPath: "", statusCode: 301, notes: "" });
      fetchSeoData();
    } catch (err) {
      showAlert("Failed to create redirect: " + err.message, "error");
    } finally {
      setSavingRedirect(false);
    }
  };

  // 5. Delete Redirect
  const handleDeleteRedirect = async (id, sourcePath) => {
    if (!window.confirm(`Delete redirect for ${sourcePath}?`)) return;
    try {
      await adminAuthService.fetch(`/api/v1/admin/seo/redirects/${id}`, {
        method: "DELETE",
      });
      showAlert(`Redirect for ${sourcePath} removed.`);
      fetchSeoData();
    } catch (err) {
      showAlert("Failed to delete redirect: " + err.message, "error");
    }
  };

  // 6. Save Google Verification Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await Promise.all([
        adminAuthService.fetch("/api/v1/cms/settings", {
          method: "PUT",
          body: JSON.stringify({
            key: "google_search_console_tag",
            value: siteSettings.google_search_console_tag,
            group: "seo",
            description: "Google Search Console HTML Verification Meta Tag",
          }),
        }),
        adminAuthService.fetch("/api/v1/cms/settings", {
          method: "PUT",
          body: JSON.stringify({
            key: "google_analytics_id",
            value: siteSettings.google_analytics_id,
            group: "seo",
            description: "Google Analytics 4 Measurement ID",
          }),
        }),
      ]);
      showAlert("Google Search Console & Analytics settings saved!");
    } catch (err) {
      showAlert("Failed to save settings: " + err.message, "error");
    } finally {
      setSavingSettings(false);
    }
  };

  // Flatten and filter items for Matrix Table
  const allItems = matrixData
    ? [
        ...(matrixData.staticPages || []),
        ...(matrixData.categories || []),
        ...(matrixData.products || []),
      ]
    : [];

  const filteredItems = allItems.filter((item) => {
    if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.slug?.toLowerCase().includes(q) ||
      item.title?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
            SEO & Technical Search Management
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Configure meta titles, descriptions, canonical URLs, 301 redirects, Google Search Console, and Google Merchant product feeds.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={handleRegenerateSitemap}
            disabled={regeneratingSitemap}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "#0f172a",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: regeneratingSitemap ? "wait" : "pointer",
            }}
          >
            <RefreshCw size={15} className={regeneratingSitemap ? "spin" : ""} />
            {regeneratingSitemap ? "Generating XML..." : "Regenerate Sitemap.xml"}
          </button>

          <button
            onClick={() => setIsRedirectModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "#ec2226",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Plus size={15} /> Add 301 Redirect
          </button>
        </div>
      </div>

      {/* Floating Alert */}
      {alertMsg && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "8px",
            marginBottom: "20px",
            background: alertMsg.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: alertMsg.type === "error" ? "#991b1b" : "#166534",
            border: `1px solid ${alertMsg.type === "error" ? "#fecaca" : "#bbf7d0"}`,
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {alertMsg.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {alertMsg.text}
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Indexable URLs</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
            {matrixData?.summary?.totalIndexableUrls || 0}
          </div>
          <div style={{ fontSize: "12px", color: "#16a34a", marginTop: "2px" }}>
            {matrixData?.summary?.totalProducts || 0} Products + {matrixData?.summary?.totalCategories || 0} Categories
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Active 301 Redirects</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#ec2226", marginTop: "4px" }}>
            {redirects.length}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            Permanent SEO Preservation
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Sitemap File</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
            <span style={{ fontSize: "13px", fontFamily: "monospace", color: "#0284c7" }}>/sitemap.xml</span>
            <button
              onClick={() => handleCopy("https://www.kingletbd.com/sitemap.xml", "sitemap")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              title="Copy URL"
            >
              {copiedUrl === "sitemap" ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
            </button>
          </div>
          <div style={{ fontSize: "12px", color: "#16a34a", marginTop: "4px" }}>
            Image-Extended Schema Valid
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Google Merchant Feed</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
            <span style={{ fontSize: "13px", fontFamily: "monospace", color: "#0284c7" }}>/google-merchant-feed.xml</span>
            <button
              onClick={() => handleCopy("https://www.kingletbd.com/api/v1/seo/google-merchant-feed.xml", "feed")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              title="Copy Feed URL"
            >
              {copiedUrl === "feed" ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
            </button>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            RSS 2.0 Shopping Aggregator
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", marginBottom: "20px" }}>
        {[
          { id: "matrix", label: "Metadata & Indexing Matrix", icon: Sliders },
          { id: "redirects", label: `301 URL Redirects (${redirects.length})`, icon: ArrowRight },
          { id: "google", label: "Google Console & Analytics Setup", icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                border: "none",
                background: "transparent",
                borderBottom: isActive ? "2px solid #ec2226" : "2px solid transparent",
                color: isActive ? "#ec2226" : "#64748b",
                fontWeight: isActive ? 800 : 600,
                fontSize: "14px",
                cursor: "pointer",
                marginBottom: "-1px",
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: METADATA MATRIX */}
      {activeTab === "matrix" && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {/* Controls */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ position: "relative", width: "260px" }}>
                <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
                <input
                  type="text"
                  placeholder="Search pages or products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px 7px 32px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                {["ALL", "PRODUCT", "CATEGORY", "PAGE"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      border: typeFilter === t ? "1px solid #0f172a" : "1px solid #e2e8f0",
                      background: typeFilter === t ? "#0f172a" : "#f8fafc",
                      color: typeFilter === t ? "#ffffff" : "#475569",
                      cursor: "pointer",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Showing {filteredItems.length} entities
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "12px 18px" }}>Entity / Name</th>
                  <th style={{ padding: "12px 18px" }}>URL Slug</th>
                  <th style={{ padding: "12px 18px" }}>SEO Title</th>
                  <th style={{ padding: "12px 18px" }}>Meta Description</th>
                  <th style={{ padding: "12px 18px" }}>Index Status</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const titleLen = item.title?.length || 0;
                  const descLen = item.metaDescription?.length || 0;
                  const isTitleOptimal = titleLen >= 40 && titleLen <= 65;
                  const isDescOptimal = descLen >= 110 && descLen <= 165;

                  return (
                    <tr
                      key={item.id || idx}
                      style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#ffffff" : "#fcfcfd" }}
                    >
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.name}</div>
                        <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: item.type === "PRODUCT" ? "#e0f2fe" : item.type === "CATEGORY" ? "#fef3c7" : "#f1f5f9", color: item.type === "PRODUCT" ? "#0369a1" : item.type === "CATEGORY" ? "#b45309" : "#475569" }}>
                          {item.type}
                        </span>
                      </td>

                      <td style={{ padding: "14px 18px", fontFamily: "monospace", fontSize: "12px", color: "#475569" }}>
                        {item.slug}
                      </td>

                      <td style={{ padding: "14px 18px", maxWidth: "240px" }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#1e293b", fontWeight: 600 }}>
                          {item.title}
                        </div>
                        <span style={{ fontSize: "11px", color: isTitleOptimal ? "#16a34a" : "#d97706" }}>
                          {titleLen} chars {isTitleOptimal ? "✓" : "(Recommended: 50-60)"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 18px", maxWidth: "260px" }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#64748b" }}>
                          {item.metaDescription}
                        </div>
                        <span style={{ fontSize: "11px", color: isDescOptimal ? "#16a34a" : "#d97706" }}>
                          {descLen} chars {isDescOptimal ? "✓" : "(Recommended: 120-160)"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        {item.isNoIndex ? (
                          <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "11px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px" }}>
                            NOINDEX
                          </span>
                        ) : (
                          <span style={{ background: "#dcfce7", color: "#166534", fontSize: "11px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px" }}>
                            INDEXABLE
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <button
                          onClick={() => openEditModal(item)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "6px 12px",
                            background: "#f1f5f9",
                            color: "#334155",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <Edit3 size={13} /> Edit SEO
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: 301 REDIRECTS */}
      {activeTab === "redirects" && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                Active URL 301 / 302 Redirection Rules
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Requests to source URLs are permanently mapped to new target paths to maintain link equity and prevent 404s.
              </p>
            </div>
            <button
              onClick={() => setIsRedirectModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: "#ec2226",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> New Redirect
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase", fontSize: "11px" }}>
                <th style={{ padding: "12px 18px" }}>Source Path</th>
                <th style={{ padding: "12px 18px" }}>Target Path</th>
                <th style={{ padding: "12px 18px" }}>HTTP Code</th>
                <th style={{ padding: "12px 18px" }}>Hits</th>
                <th style={{ padding: "12px 18px" }}>Notes</th>
                <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {redirects.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                    No 301 redirects registered. All incoming links resolve to valid live routes.
                  </td>
                </tr>
              ) : (
                redirects.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 18px", fontFamily: "monospace", fontWeight: 700, color: "#b91c1c" }}>
                      {r.sourcePath}
                    </td>
                    <td style={{ padding: "14px 18px", fontFamily: "monospace", fontWeight: 700, color: "#16a34a" }}>
                      {r.targetPath}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", fontWeight: 800, fontSize: "11px" }}>
                        {r.statusCode}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: 700, color: "#0f172a" }}>
                      {r.hitCount || 0}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#64748b" }}>
                      {r.notes || "—"}
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <button
                        onClick={() => handleDeleteRedirect(r.id, r.sourcePath)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                        title="Delete redirect"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: GOOGLE SEARCH CONSOLE & ANALYTICS */}
      {activeTab === "google" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
          {/* Settings Form */}
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>
              Google Search Console & Tag Integration
            </h3>

            <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Google Search Console Verification Tag
                </label>
                <input
                  type="text"
                  placeholder='google-site-verification=XXXXXXXXXXXXXXXX'
                  value={siteSettings.google_search_console_tag}
                  onChange={(e) => setSiteSettings({ ...siteSettings, google_search_console_tag: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", fontFamily: "monospace" }}
                />
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                  Paste the verification code from Google Search Console &gt; Settings &gt; Ownership Verification.
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Google Analytics 4 (GA4) Measurement ID
                </label>
                <input
                  type="text"
                  placeholder="G-XXXXXXXXXX"
                  value={siteSettings.google_analytics_id}
                  onChange={(e) => setSiteSettings({ ...siteSettings, google_analytics_id: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", fontFamily: "monospace" }}
                />
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                  Enables e-commerce transaction tracking, purchase events, and audience insights.
                </span>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 20px",
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {savingSettings ? "Saving..." : "Save Verification Settings"}
              </button>
            </form>
          </div>

          {/* Action Checklist & Deployment Notice */}
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>
              Google Production Launch Checklist
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#334155" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong>XML Sitemap Generated:</strong> Ready at <code>https://www.kingletbd.com/sitemap.xml</code> with images.
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong>Google Merchant Center Feed:</strong> Ready at <code>/api/v1/seo/google-merchant-feed.xml</code>.
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong>Structured Data (JSON-LD):</strong> Implemented on all Product &amp; Category pages with reviews and pricing.
                </div>
              </div>

              <div style={{ marginTop: "12px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#475569" }}>
                <strong style={{ color: "#0f172a" }}>Requires Merchant Action Upon Live Deployment:</strong>
                <ol style={{ margin: "6px 0 0", paddingLeft: "18px" }}>
                  <li>Add domain property in <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" style={{ color: "#ec2226" }}>Google Search Console</a>.</li>
                  <li>Paste the verification tag in the box on the left and submit sitemap URL: <code>https://www.kingletbd.com/sitemap.xml</code>.</li>
                  <li>In <a href="https://merchants.google.com" target="_blank" rel="noopener noreferrer" style={{ color: "#ec2226" }}>Google Merchant Center</a>, add new Scheduled Feed pointing to your feed URL.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SEO MODAL */}
      {isEditModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto", padding: "26px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
              Edit SEO: {editingItem?.name}
            </h2>
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "18px" }}>
              Path: {editingItem?.slug}
            </div>

            <form onSubmit={handleSaveSeo} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Custom SEO Title ({editForm.title.length}/60 chars)
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Meta Description ({editForm.metaDescription.length}/160 chars)
                </label>
                <textarea
                  rows={3}
                  required
                  value={editForm.metaDescription}
                  onChange={(e) => setEditForm({ ...editForm, metaDescription: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Canonical URL Override
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.kingletbd.com/..."
                    value={editForm.canonicalUrl}
                    onChange={(e) => setEditForm({ ...editForm, canonicalUrl: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Social Share Image (OG Image)
                  </label>
                  <input
                    type="text"
                    placeholder="https://... image url"
                    value={editForm.ogImage}
                    onChange={(e) => setEditForm({ ...editForm, ogImage: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <input
                  type="checkbox"
                  id="noindex-check"
                  checked={editForm.isNoIndex}
                  onChange={(e) => setEditForm({ ...editForm, isNoIndex: e.target.checked })}
                  style={{ width: "16px", height: "16px" }}
                />
                <label htmlFor="noindex-check" style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", cursor: "pointer" }}>
                  Exclude from search engines (Apply <code>noindex, nofollow</code> tag)
                </label>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Custom Structured Data (JSON-LD Override - Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder='{"@context": "https://schema.org", ...}'
                  value={editForm.structuredData}
                  onChange={(e) => setEditForm({ ...editForm, structuredData: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontFamily: "monospace" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSeo}
                  style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: "#ec2226", color: "#ffffff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                >
                  {savingSeo ? "Saving..." : "Save SEO Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW REDIRECT MODAL */}
      {isRedirectModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "480px", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
              Create 301 Permanent Redirect
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
              Safely route old product or category URLs to new destinations without losing search rankings.
            </p>

            <form onSubmit={handleCreateRedirect} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Source Path (Incoming Old URL) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="/old-category/old-product"
                  value={redirectForm.sourcePath}
                  onChange={(e) => setRedirectForm({ ...redirectForm, sourcePath: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", fontFamily: "monospace" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Target Path (New Destination URL) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="/product/pure-veneer"
                  value={redirectForm.targetPath}
                  onChange={(e) => setRedirectForm({ ...redirectForm, targetPath: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", fontFamily: "monospace" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  HTTP Status Code
                </label>
                <select
                  value={redirectForm.statusCode}
                  onChange={(e) => setRedirectForm({ ...redirectForm, statusCode: Number(e.target.value) })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value={301}>301 Moved Permanently (Recommended for SEO)</option>
                  <option value={302}>302 Found (Temporary Redirect)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Reason / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Migration from old catalog slug"
                  value={redirectForm.notes}
                  onChange={(e) => setRedirectForm({ ...redirectForm, notes: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsRedirectModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRedirect}
                  style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: "#ec2226", color: "#ffffff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                >
                  {savingRedirect ? "Creating..." : "Create 301 Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
