/**
 * Kinglet Furniture & Interior - Dynamic Product & Catalog Client Service
 * Bridges backend database records seamlessly into the customer storefront
 */

import { PRODUCTS as FALLBACK_PRODUCTS, NAV_CATEGORIES as FALLBACK_CATEGORIES } from "../data/kingletData";

let productsCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds fresh cache

export const productService = {
  /**
   * Fetch all active products with optional filters
   */
  async getProducts(params = {}) {
    const defaultParams = { limit: 250, ...params };
    const query = new URLSearchParams(defaultParams).toString();
    const url = `/api/v1/products?${query}`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return {
          products: json.data,
          total: json.pagination?.total || json.data.length,
          pages: json.pagination?.pages || 1,
        };
      }
    } catch (err) {
      console.warn("Live products API unavailable, falling back to static catalog:", err.message);
    }

    // Fallback if offline
    return {
      products: FALLBACK_PRODUCTS,
      total: FALLBACK_PRODUCTS.length,
      pages: 1,
    };
  },

  /**
   * Get single product by Slug or ID from live DB with fallback
   */
  async getProductBySlugOrId(idOrSlug) {
    if (!idOrSlug) return null;

    try {
      const res = await fetch(`/api/v1/products/${encodeURIComponent(idOrSlug)}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn("Live product lookup error:", err.message);
    }

    // Fallback to local catalog
    const found = FALLBACK_PRODUCTS.find(
      (p) => String(p.id) === String(idOrSlug) || p.slug === String(idOrSlug)
    );
    return found || null;
  },

  /**
   * Clear in-memory client cache and notify all subscriber components
   */
  invalidateCache() {
    productsCache = null;
    lastFetchTime = 0;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("kinglet:products-updated"));
    }
  },
};

export default productService;

