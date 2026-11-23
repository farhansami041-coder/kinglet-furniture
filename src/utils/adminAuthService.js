/**
 * Kinglet Furniture & Interior - Admin Authentication & API Client Service
 */

const TOKEN_KEY = "kinglet_admin_token";
const USER_KEY = "kinglet_admin_user";

export const adminAuthService = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    if (!token || !user) return false;
    const allowed = ["SUPER_ADMIN", "ADMIN", "STORE_MANAGER", "DISPATCH_OFFICER", "STAFF"];
    const userRoles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
    return userRoles.some((r) => allowed.includes(r));
  },

  async login(phone, password) {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Invalid credentials or unauthorized role.");
    }

    const { token, user } = json.data;
    const allowed = ["SUPER_ADMIN", "ADMIN", "STORE_MANAGER", "DISPATCH_OFFICER", "STAFF"];
    const userRoles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
    const hasAdminRole = userRoles.some((r) => allowed.includes(r));

    if (!hasAdminRole) {
      throw new Error("Access denied. Admin privileges required.");
    }

    const primaryRole = user.role || userRoles[0] || "ADMIN";
    const userToSave = { ...user, role: primaryRole, roles: userRoles };

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userToSave));
    return userToSave;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = "/admin/login";
  },

  async fetch(url, options = {}) {
    const token = this.getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      this.logout();
      throw new Error("Session expired. Please sign in again.");
    }

    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.message || `Request failed with status ${res.status}`);
    }

    return json;
  },
};

