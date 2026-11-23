import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { adminAuthService } from "../../utils/adminAuthService";

export default function AdminLoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (adminAuthService.isAuthenticated()) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await adminAuthService.login(phone, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to sign in. Verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #090d16 0%, #0f172a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#1e293b",
          borderRadius: "16px",
          border: "1px solid #334155",
          padding: "36px 32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          color: "#f8fafc",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #ef4444, #991b1b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "26px",
              fontWeight: 800,
              boxShadow: "0 8px 16px rgba(239, 68, 68, 0.3)",
            }}
          >
            K
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "0.5px" }}>
            KINGLET FURNITURE
          </h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
            Management Portal & Factory Operations ERP
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fca5a5",
              padding: "12px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Phone or Email Input */}
          <div style={{ marginBottom: "18px" }}>
            <label
              htmlFor="admin-login-phone"
              style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
            >
              Admin Email or Mobile / Phone
            </label>
            <input
              id="admin-login-phone"
              name="admin-phone"
              type="text"
              required
              autoComplete="off"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +8801676900442 or info.kingletbd@gmail.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "#0f172a",
                border: "1px solid #475569",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ef4444")}
              onBlur={(e) => (e.target.style.borderColor = "#475569")}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="admin-login-password"
              style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
            >
              Secret Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="admin-login-password"
                name="admin-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                style={{
                  width: "100%",
                  padding: "12px 44px 12px 14px",
                  background: "#0f172a",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#ef4444")}
                onBlur={(e) => (e.target.style.borderColor = "#475569")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: loading ? "#7f1d1d" : "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.1s, background 0.2s",
              boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
            }}
          >
            {loading ? "Authenticating Admin..." : "Sign In to Admin Portal →"}
          </button>
        </form>

        {/* Back to storefront link */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a href="/" style={{ color: "#64748b", fontSize: "13px", textDecoration: "none" }}>
            ← Return to Customer Storefront
          </a>
        </div>
      </div>
    </div>
  );
}

