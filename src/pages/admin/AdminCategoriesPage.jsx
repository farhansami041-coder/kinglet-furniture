import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { adminAuthService } from "../../utils/adminAuthService";

export default function AdminCategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "sub" ? "sub" : "all";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parentId: "",
    description: "",
    displayOrder: 0,
    isActive: true,
    metaTitle: "",
    metaDesc: "",
  });

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/categories");
      setCategories(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      parentId: "",
      description: "",
      displayOrder: categories.length + 1,
      isActive: true,
      metaTitle: "",
      metaDesc: "",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCategory(c);
    setFormData({
      name: c.name,
      slug: c.slug,
      parentId: c.parentId || "",
      description: c.description || "",
      displayOrder: c.displayOrder || 0,
      isActive: c.isActive,
      metaTitle: c.metaTitle || "",
      metaDesc: c.metaDesc || "",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      if (editingCategory) {
        await adminAuthService.fetch(`/api/v1/admin/categories/${editingCategory.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...formData,
            displayOrder: Number(formData.displayOrder) || 0,
          }),
        });
      } else {
        const autoSlug = (formData.slug || formData.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await adminAuthService.fetch("/api/v1/admin/categories", {
          method: "POST",
          body: JSON.stringify({
            ...formData,
            slug: autoSlug,
            displayOrder: Number(formData.displayOrder) || 0,
          }),
        });
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setModalError(err.message || "Failed to save category");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCategory = async (id, name, productsCount = 0) => {
    if (productsCount > 0) {
      const confirmForce = window.confirm(
        `Category "${name}" contains ${productsCount} assigned product(s).\n\nWould you like to safely reassign these products to another category and delete "${name}"?\n\n• Click OK to reassign & delete\n• Click Cancel to abort`
      );
      if (!confirmForce) return;

      try {
        const res = await adminAuthService.fetch(`/api/v1/admin/categories/${id}?force=true`, {
          method: "DELETE",
        });
        fetchCategories();
      } catch (err) {
        alert(err.message || "Cannot delete category");
      }
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      return;
    }

    try {
      await adminAuthService.fetch(`/api/v1/admin/categories/${id}`, {
        method: "DELETE",
      });
      fetchCategories();
    } catch (err) {
      alert(err.message || "Cannot delete category");
    }
  };

  const displayedCategories = activeTab === "sub" ? categories.filter((c) => c.parentId) : categories;

  return (
    <div>
      {/* Title & Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
            {activeTab === "sub" ? "Subcategories Directory" : "Categories & Department Taxonomy"}
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            {activeTab === "sub" ? "Managing child collections linked to main departments." : "Hierarchical collection structure for customer navigation and SEO silos."}
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            padding: "10px 18px",
            background: "#ef4444",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>➕</span>
          <span>{activeTab === "sub" ? "Add Subcategory" : "Add New Category"}</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", marginBottom: "20px" }}>
        <button
          onClick={() => setSearchParams({})}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "transparent",
            borderBottom: activeTab === "all" ? "3px solid #ef4444" : "3px solid transparent",
            color: activeTab === "all" ? "#ef4444" : "#64748b",
            fontWeight: activeTab === "all" ? 800 : 600,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          🗂️ All Categories ({categories.length})
        </button>
        <button
          onClick={() => setSearchParams({ tab: "sub" })}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "transparent",
            borderBottom: activeTab === "sub" ? "3px solid #ef4444" : "3px solid transparent",
            color: activeTab === "sub" ? "#ef4444" : "#64748b",
            fontWeight: activeTab === "sub" ? 800 : 600,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          📂 Subcategories Only ({categories.filter((c) => c.parentId).length})
        </button>
      </div>

      {/* Categories Table */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
            <div style={{ width: "32px", height: "32px", border: "3px solid #ef4444", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <div>Loading categories from database...</div>
          </div>
        ) : error ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#dc2626" }}>
            Error: {error}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 600, textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "12px 18px" }}>Order</th>
                  <th style={{ padding: "12px 18px" }}>Category Name</th>
                  <th style={{ padding: "12px 18px" }}>URL Slug</th>
                  <th style={{ padding: "12px 18px" }}>Parent Category</th>
                  <th style={{ padding: "12px 18px" }}>Assigned Products</th>
                  <th style={{ padding: "12px 18px" }}>Status</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedCategories.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 700, color: "#94a3b8" }}>
                      #{c.displayOrder}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{c.name}</div>
                      {c.description && <div style={{ fontSize: "11px", color: "#64748b" }}>{c.description}</div>}
                    </td>
                    <td style={{ padding: "14px 18px", fontFamily: "monospace", fontSize: "12px", color: "#475569" }}>
                      /{c.slug}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#475569" }}>
                      {c.parentName}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, color: "#334155" }}>
                        {c.productsCount} Products
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: c.isActive ? "#10b981" : "#94a3b8" }}>
                        {c.isActive ? "● Active" : "○ Hidden"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          style={{ padding: "4px 8px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px", cursor: "pointer", color: "#0f172a", fontWeight: 600 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id, c.name, c.productsCount)}
                          style={{ padding: "4px 8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", fontSize: "12px", cursor: "pointer", color: "#dc2626", fontWeight: 600 }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", width: "100%", maxWidth: "560px", maxHeight: "90vh", borderRadius: "16px", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                {editingCategory ? `Edit Category: ${editingCategory.name}` : "Create New Category"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div style={{ margin: "16px 24px 0", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: "8px", fontSize: "13px" }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} style={{ padding: "24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dining Room"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Custom URL Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. dining-room (auto-generated if empty)"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Parent Category</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", background: "#fff", boxSizing: "border-box" }}
                >
                  <option value="">None (Top-Level Root Category)</option>
                  {categories.filter((c) => !editingCategory || c.id !== editingCategory.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Category Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Authentic mahogany & Canadian oak veneer collections..."
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", paddingTop: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    Visible on Store
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "10px 18px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  style={{ padding: "10px 20px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: modalLoading ? "not-allowed" : "pointer" }}
                >
                  {modalLoading ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

