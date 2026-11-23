import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  Phone,
  MapPin,
  Lock,
  CheckCircle2,
  Package,
  Search,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Clock,
  Truck,
  Edit3,
  Printer,
  MessageCircle,
  Bell,
  XCircle,
  Eye,
  X,
} from "lucide-react";
import {
  getCurrentUser,
  saveUser,
  loginUser,
  logoutUser,
  getCurrentUserOrders,
  getOrderByTrackingCode,
  apiRegisterCustomer,
  apiLoginCustomer,
  apiGetCustomerProfile,
  apiUpdateCustomerProfile,
  apiGetCustomerOrders,
  apiGetFilteredCustomerOrders,
  apiLookupGuestOrder,
  apiCancelCustomerOrder,
  apiGetCustomerNotifications,
  apiMarkCustomerNotificationsRead,
} from "../utils/accountService";
import { BANGLADESH_DIVISIONS, BRAND_INFO } from "../data/kingletData";
import KingletPrintableInvoiceModal from "../components/Finance/KingletPrintableInvoiceModal";
import KingletSEO from "../components/Common/KingletSEO";

export default function AccountPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // State: current authenticated user
  const [user, setUser] = useState(getCurrentUser());
  const [activeAuthTab, setActiveAuthTab] = useState(
    searchParams.get("tab") === "login" ? "login" : "register"
  );
  const [dashboardTab, setDashboardTab] = useState("orders"); // "orders" | "tracker" | "notifications"
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [orderPagination, setOrderPagination] = useState({ total: 0, page: 1, limit: 8, totalPages: 1 });
  const [detailOrder, setDetailOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [guestOrderNum, setGuestOrderNum] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestResult, setGuestResult] = useState(null);
  const [guestError, setGuestError] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Registration Form State
  const [regForm, setRegForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    division: "Dhaka",
    district: "Dhaka City",
    thana: "Mirpur",
    password: "",
  });

  // Login Form State
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // In-Dashboard Quick Tracker State
  const [trackQuery, setTrackQuery] = useState("");
  const [trackResult, setTrackResult] = useState(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    division: "Dhaka",
    district: "",
    thana: "",
  });

  const fetchFilteredOrders = async (pageOverride = orderPage) => {
    setOrdersLoading(true);
    try {
      const res = await apiGetFilteredCustomerOrders({
        search: orderSearch,
        status: orderStatusFilter,
        dateFrom,
        dateTo,
        page: pageOverride,
        limit: 8,
      });
      setOrders(res.orders || []);
      setOrderPagination(res.pagination || { total: 0, page: pageOverride, limit: 8, totalPages: 1 });
    } catch {
      const liveOrders = await apiGetCustomerOrders();
      setOrders(liveOrders || []);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Sync user state and orders
  useEffect(() => {
    let isMounted = true;
    const handleAuthChange = async () => {
      const cur = getCurrentUser();
      setUser(cur);
      if (cur) {
        setEditForm({
          fullName: cur.fullName || "",
          phone: cur.phone || "",
          address: cur.address || "",
          division: cur.division || "Dhaka",
          district: cur.district || "Dhaka City",
          thana: cur.thana || "Mirpur",
        });
        try {
          const [res, notifData] = await Promise.all([
            apiGetFilteredCustomerOrders({ page: 1, limit: 8 }),
            apiGetCustomerNotifications(),
          ]);
          if (isMounted) {
            setOrders(res.orders || []);
            setOrderPagination(res.pagination || { total: (res.orders || []).length, page: 1, limit: 8, totalPages: 1 });
            setNotifications(notifData.notifications || []);
            setUnreadNotifications(notifData.unreadCount || 0);
          }
        } catch {
          const liveOrders = await apiGetCustomerOrders();
          if (isMounted) setOrders(liveOrders || []);
        }
      }
    };

    handleAuthChange();
    window.addEventListener("kinglet_auth_change", handleAuthChange);
    window.addEventListener("kinglet_order_created", handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener("kinglet_auth_change", handleAuthChange);
      window.removeEventListener("kinglet_order_created", handleAuthChange);
    };
  }, []);

  // Handle Register (Create Account)
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");

    const cleanFullName = regForm.fullName.trim();
    const cleanPhone = regForm.phone.replace(/[-\s+()]/g, "").replace(/^880/, "0");
    const cleanAddress = regForm.address.trim();

    if (!cleanFullName) {
      setAuthError("Please enter your full name.");
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setAuthError("Please enter a valid Bangladeshi mobile number (e.g. 017XXXXXXXX).");
      return;
    }
    if (!cleanAddress) {
      setAuthError("Please enter your full delivery address (House, Road, Area).");
      return;
    }

    try {
      const data = await apiRegisterCustomer({
        fullName: cleanFullName,
        phone: cleanPhone,
        password: regForm.password && regForm.password.trim().length >= 4 ? regForm.password.trim() : "KingletPass@123",
        email: regForm.email && regForm.email.trim() ? regForm.email.trim() : undefined,
        address: cleanAddress,
        division: regForm.division,
        district: regForm.district,
        thana: regForm.thana,
      });

      setUser(data.user);
      setAuthSuccess("Account successfully created! You are now logged in.");
      setTimeout(() => setAuthSuccess(""), 3500);
    } catch (err) {
      setAuthError(err.message || "Registration failed. Please check your information.");
    }
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (!loginPhone.trim()) {
      setAuthError("Please enter your registered phone number.");
      return;
    }

    try {
      const data = await apiLoginCustomer({
        phone: loginPhone.trim(),
        password: loginPassword,
      });
      setUser(data.user);
      setAuthSuccess(`Welcome back, ${data.user?.fullName || "Valued Client"}!`);
      setTimeout(() => setAuthSuccess(""), 3000);
      try {
        await fetchFilteredOrders(1);
      } catch {}
    } catch (err) {
      setAuthError(err.message || "No account found with this phone number. Please register an account below.");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  // Handle Copy Tracking Code
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Quick Tracking Search (Live Backend DB)
  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    try {
      const r = await fetch(`/api/v1/orders/track/${encodeURIComponent(trackQuery.trim())}?t=${Date.now()}`);
      const j = await r.json();
      if (j.success && j.data) {
        setTrackResult(j.data);
        return;
      }
    } catch {}
    const res = getOrderByTrackingCode(trackQuery.trim());
    setTrackResult(res);
  };

  const handleGuestLookup = async (e) => {
    e.preventDefault();
    setGuestError("");
    setGuestResult(null);
    setGuestLoading(true);
    try {
      const data = await apiLookupGuestOrder({ orderNumber: guestOrderNum.trim(), phone: guestPhone.trim() });
      setGuestResult(data);
    } catch (err) {
      setGuestError(err.message || "No order matched that Order ID and Mobile Number.");
    } finally {
      setGuestLoading(false);
    }
  };

  const handleCustomerCancelOrder = async (orderToCancel) => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      await apiCancelCustomerOrder({
        orderId: orderToCancel.id,
        reason: cancelReason || "Customer requested cancellation",
        phone: user?.phone || guestPhone,
      });
      setCancelReason("");
      setDetailOrder(null);
      await fetchFilteredOrders(orderPage);
      if (guestResult && guestResult.id === orderToCancel.id) {
        const refreshed = await apiLookupGuestOrder({ orderNumber: guestOrderNum.trim(), phone: guestPhone.trim() });
        setGuestResult(refreshed);
      }
      setAuthSuccess("Order cancelled successfully.");
      setTimeout(() => setAuthSuccess(""), 3500);
    } catch (err) {
      alert(err.message || "Could not cancel order.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Save Profile Edit
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await apiUpdateCustomerProfile({
        fullName: editForm.fullName,
        phone: editForm.phone,
        address: editForm.address,
        division: editForm.division,
        district: editForm.district,
        thana: editForm.thana,
      });
      setUser(updated);
      setIsEditingProfile(false);
      setAuthSuccess("Profile details successfully updated!");
      setTimeout(() => setAuthSuccess(""), 3000);
    } catch (err) {
      setAuthError(err.message || "Failed to update profile.");
    }
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "30px 0 70px" }}>
      <KingletSEO
        title="Customer Account & Order Tracking | Kinglet Bangladesh Ltd"
        description="Access your Kinglet customer account, view past furniture orders, track deliveries and manage profile details."
        noindex={true}
      />
      <div className="container" style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 20px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
          <Link to="/" style={{ color: "#334155", textDecoration: "none" }}>Home</Link>
          <ChevronRight size={13} />
          <span style={{ color: "#ec2226", fontWeight: "700" }}>Customer Account</span>
        </div>

        {/* Global Notifications */}
        {authSuccess && (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "12px 18px", borderRadius: "10px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "600", animation: "fadeIn 0.25s ease" }}>
            <CheckCircle2 size={18} color="#059669" />
            <span>{authSuccess}</span>
          </div>
        )}

        {authError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 18px", borderRadius: "10px", marginBottom: "20px", fontSize: "14px", fontWeight: "600", animation: "fadeIn 0.25s ease" }}>
            {authError}
          </div>
        )}

        {/* ==============================================================
            STATE 1: USER IS NOT LOGGED IN (Create Account & Sign In Forms)
            ============================================================== */}
        {!user ? (
          <div className="account-auth-grid">
            {/* Left Card: Create Account or Sign In Form */}
            <div className="account-form-box" style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 25px rgba(15, 23, 42, 0.05)" }}>
              {/* Tab Selector: Create Account vs Sign In */}
              <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "12px", marginBottom: "24px" }}>
                <button
                  type="button"
                  onClick={() => { setActiveAuthTab("register"); setAuthError(""); }}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "9px",
                    border: "none",
                    background: activeAuthTab === "register" ? "#ec2226" : "transparent",
                    color: activeAuthTab === "register" ? "#ffffff" : "#475569",
                    fontWeight: "800",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Create New Account
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveAuthTab("login"); setAuthError(""); }}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "9px",
                    border: "none",
                    background: activeAuthTab === "login" ? "#0f172a" : "transparent",
                    color: activeAuthTab === "login" ? "#ffffff" : "#475569",
                    fontWeight: "800",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Sign In
                </button>
              </div>

              {/* CREATE ACCOUNT FORM */}
              {activeAuthTab === "register" ? (
                <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", margin: "0 0 6px" }}>
                      Create Your Customer Account
                    </h2>
                    <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 18px", lineHeight: "1.5" }}>
                      Save your contact and delivery address to place orders effortlessly and receive your unique live production tracking codes.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="reg-full-name" style={{ display: "block", fontSize: "12.5px", fontWeight: "750", color: "#334155", marginBottom: "6px" }}>
                      Full Name *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="reg-full-name"
                        name="fullName"
                        type="text"
                        required
                        placeholder="e.g. Dr. Salman Khan / Farhana Ahmed"
                        value={regForm.fullName}
                        onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px 14px 12px 38px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "14px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <User size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "14px" }} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-phone" style={{ display: "block", fontSize: "12.5px", fontWeight: "750", color: "#334155", marginBottom: "6px" }}>
                      Phone Number (Mobile) *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="reg-phone"
                        name="phone"
                        type="tel"
                        required
                        placeholder="e.g. 01712345678"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px 14px 12px 38px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "14px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <Phone size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "14px" }} />
                    </div>
                    <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                      Your order confirmation & live tracking code will be sent to this number.
                    </span>
                  </div>

                  <div className="account-input-grid" style={{ marginBottom: "12px" }}>
                    <div>
                      <label htmlFor="reg-division" style={{ display: "block", fontSize: "12.5px", fontWeight: "750", color: "#334155", marginBottom: "6px" }}>
                        Division *
                      </label>
                      <select
                        id="reg-division"
                        name="division"
                        value={regForm.division}
                        onChange={(e) => setRegForm({ ...regForm, division: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "13.5px",
                          outline: "none",
                          boxSizing: "border-box",
                          background: "#ffffff",
                        }}
                      >
                        {BANGLADESH_DIVISIONS.map((d) => (
                          <option key={d.name} value={d.name}>
                            {d.name} Division
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="reg-district" style={{ display: "block", fontSize: "12.5px", fontWeight: "750", color: "#334155", marginBottom: "6px" }}>
                        District / City
                      </label>
                      <input
                        id="reg-district"
                        name="district"
                        type="text"
                        placeholder="e.g. Dhaka City / Gazipur"
                        value={regForm.district}
                        onChange={(e) => setRegForm({ ...regForm, district: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "13.5px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-address" style={{ display: "block", fontSize: "12.5px", fontWeight: "750", color: "#334155", marginBottom: "6px" }}>
                      Full Delivery Address (House, Road, Area) *
                    </label>
                    <div style={{ position: "relative" }}>
                      <textarea
                        id="reg-address"
                        name="address"
                        required
                        rows={3}
                        placeholder="e.g. House #24, Road #7, Block C, Banani / Mirpur DOHS, Dhaka"
                        value={regForm.address}
                        onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px 14px 12px 38px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "13.5px",
                          outline: "none",
                          boxSizing: "border-box",
                          fontFamily: "inherit",
                        }}
                      />
                      <MapPin size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "14px" }} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-password" style={{ display: "block", fontSize: "12.5px", fontWeight: "750", color: "#334155", marginBottom: "6px" }}>
                      Security PIN / Password (Optional)
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="reg-password"
                        name="password"
                        type="password"
                        placeholder="Enter 4-6 digit PIN or password"
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px 14px 12px 38px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "14px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <Lock size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "14px" }} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: "#ec2226",
                      color: "#ffffff",
                      padding: "14px",
                      borderRadius: "12px",
                      border: "none",
                      fontSize: "14.5px",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginTop: "6px",
                      boxShadow: "0 6px 20px rgba(236, 34, 38, 0.3)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>Create Account & Start Ordering</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                /* SIGN IN FORM */
                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", margin: "0 0 6px" }}>
                      Sign In to Your Account
                    </h2>
                    <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 18px", lineHeight: "1.5" }}>
                      Enter your registered phone number to access your order history and track your furniture.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="login-phone" style={{ display: "block", fontSize: "12.5px", fontWeight: "750", color: "#334155", marginBottom: "6px" }}>
                      Phone Number *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="login-phone"
                        name="phone"
                        type="tel"
                        required
                        placeholder="e.g. 01712345678"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 14px 12px 38px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "14px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <Phone size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "14px" }} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="login-password" style={{ display: "block", fontSize: "12.5px", fontWeight: "750", color: "#334155", marginBottom: "6px" }}>
                      Password / PIN
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="login-password"
                        name="password"
                        type="password"
                        placeholder="Enter password (optional)"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 14px 12px 38px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "14px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <Lock size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "14px" }} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: "#0f172a",
                      color: "#ffffff",
                      padding: "14px",
                      borderRadius: "12px",
                      border: "none",
                      fontSize: "14.5px",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginTop: "6px",
                      boxShadow: "0 6px 20px rgba(15, 23, 42, 0.2)",
                    }}
                  >
                    <span>Sign In to Account</span>
                    <ArrowRight size={16} />
                  </button>

                  <div style={{ textAlign: "center", marginTop: "10px" }}>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      Don't have an account yet?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveAuthTab("register")}
                        style={{ background: "none", border: "none", color: "#ec2226", fontWeight: "800", cursor: "pointer", padding: 0 }}
                      >
                        Create an account here
                      </button>
                    </span>
                  </div>
                </form>
              )}
            </div>

            {/* Right Card: Features & Benefits of Account */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Card 1: Live Tracking Highlight */}
              <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: "20px", padding: "28px", color: "#ffffff", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)" }}>
                <div style={{ display: "inline-flex", padding: "8px 14px", background: "rgba(236, 34, 38, 0.2)", border: "1px solid rgba(236, 34, 38, 0.4)", borderRadius: "9999px", color: "#ff6b6e", fontSize: "11px", fontWeight: "800", marginBottom: "14px", gap: "6px", alignItems: "center" }}>
                  <Sparkles size={12} />
                  <span>UNIQUE CODE TRACKING</span>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", margin: "0 0 10px", lineHeight: "1.3" }}>
                  Track Production & Delivery Step-by-Step
                </h3>
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 16px", lineHeight: "1.6" }}>
                  When you place an order with your account, you instantly receive a <strong>Unique Tracking Code</strong> (e.g. <code>KL-TRK-784920</code>) that allows you to monitor:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px", color: "#cbd5e1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={15} color="#22c55e" />
                    <span>Order Placed &amp; Order Confirmed</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={15} color="#22c55e" />
                    <span>Factory Received Order (3–20 Days Preparation)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={15} color="#22c55e" />
                    <span>Order Ready &amp; Out for Delivery</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={15} color="#22c55e" />
                    <span>Order Delivered to Customer&apos;s Address</span>
                  </div>
                </div>
              </div>

              {/* Card 2: 1-Click Ordering from Website */}
              <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#ec2226" }}>
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                      Instant 1-Click Checkout
                    </h4>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      No need to re-type address every time
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: "12.5px", color: "#475569", margin: "0 0 14px", lineHeight: "1.5" }}>
                  Your saved name, phone number, and address will automatically populate when ordering any bedroom suite, sofa, or dining set.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "#16a34a", fontWeight: "700" }}>
                  <ShieldCheck size={14} />
                  <span>10-Year Genuine Timber Warranty Guarantee Included</span>
                </div>
              </div>

              {/* Card 3: Secure Guest Order Lookup */}
              <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "24px" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                  Guest Order Lookup & Tracking
                </h4>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px" }}>
                  Ordered without signing in? Verify your Order ID and Mobile Number below to view full order details.
                </p>
                <form onSubmit={handleGuestLookup} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    type="text"
                    required
                    placeholder="Order ID (e.g. KL-ORD-...)"
                    value={guestOrderNum}
                    onChange={(e) => setGuestOrderNum(e.target.value)}
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Verified Mobile (01XXXXXXXXX)"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                  <button
                    type="submit"
                    disabled={guestLoading}
                    style={{ padding: "9px 14px", borderRadius: "8px", border: "none", background: "#0f172a", color: "#ffffff", fontSize: "12.5px", fontWeight: "700", cursor: "pointer" }}
                  >
                    {guestLoading ? "Verifying..." : "Find My Order →"}
                  </button>
                </form>
                {guestError && <div style={{ marginTop: "8px", fontSize: "12px", color: "#dc2626", fontWeight: "600" }}>{guestError}</div>}
                {guestResult && (
                  <div style={{ marginTop: "12px", padding: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "12px" }}>
                    <div style={{ fontWeight: "800", color: "#ec2226", fontFamily: "monospace" }}>{guestResult.orderNumber}</div>
                    <div style={{ marginTop: "3px", color: "#0f172a" }}>Status: <strong>{guestResult.statusLabel || guestResult.orderStatus}</strong> • Payment: <strong>{guestResult.paymentStatus}</strong></div>
                    <div style={{ marginTop: "3px", color: "#475569" }}>Total: ৳{Number(guestResult.grandTotal || 0).toLocaleString()} • Due: ৳{Number(guestResult.remainingDue || 0).toLocaleString()}</div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button type="button" onClick={() => setDetailOrder(guestResult)} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
                        View Details
                      </button>
                      <Link to={`/track-order?inv=${encodeURIComponent(guestResult.orderNumber)}`} style={{ padding: "5px 10px", borderRadius: "6px", background: "#ec2226", color: "#ffffff", fontSize: "11px", fontWeight: "700", textDecoration: "none" }}>
                        Track Timeline
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ==============================================================
             STATE 2: USER IS LOGGED IN (Complete Customer Account Hub)
             ============================================================== */
          <div>
            {/* Top User Profile Header Banner */}
            <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {/* Initials Avatar */}
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, #ec2226 0%, #b91c1c 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "900", boxShadow: "0 6px 18px rgba(236, 34, 38, 0.3)" }}>
                  {(user.fullName || "K").charAt(0).toUpperCase()}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h1 style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", margin: 0 }}>
                      {user.fullName}
                    </h1>
                    <span style={{ background: "#f0fdf4", color: "#166534", fontSize: "11px", fontWeight: "800", padding: "2px 8px", borderRadius: "9999px", border: "1px solid #bbf7d0", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={11} /> Verified Account
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "#64748b", marginTop: "4px", flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Phone size={13} color="#94a3b8" /> {user.phone}
                    </span>
                    <span>•</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={13} color="#94a3b8" /> {user.address}, {user.division}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#334155", padding: "8px 14px", borderRadius: "8px", fontSize: "12.5px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Edit3 size={13} />
                  <span>{isEditingProfile ? "Close Edit" : "Edit Profile"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{ background: "#fee2e2", border: "1px solid #fecaca", color: "#dc2626", padding: "8px 14px", borderRadius: "8px", fontSize: "12.5px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Edit Profile Form (collapsible) */}
            {isEditingProfile && (
              <form onSubmit={handleSaveProfile} style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 16px" }}>
                  Update Customer & Delivery Details
                </h3>
                <div className="account-input-grid" style={{ marginBottom: "14px" }}>
                  <div>
                    <label htmlFor="edit-profile-name" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                      Full Name
                    </label>
                    <input
                      id="edit-profile-name"
                      name="fullName"
                      type="text"
                      required
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-profile-phone" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                      Phone Number
                    </label>
                    <input
                      id="edit-profile-phone"
                      name="phone"
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label htmlFor="edit-profile-address" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                    Full Delivery Address (House, Road, Area)
                  </label>
                  <textarea
                    id="edit-profile-address"
                    name="address"
                    rows={2}
                    required
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", boxSizing: "border-box", fontFamily: "inherit" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" style={{ background: "#ec2226", color: "#ffffff", padding: "8px 18px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "750", cursor: "pointer" }}>
                    Save Changes
                  </button>
                  <button type="button" onClick={() => setIsEditingProfile(false)} style={{ background: "#f1f5f9", color: "#475569", padding: "8px 18px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Dashboard Tabs Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", marginBottom: "24px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setDashboardTab("orders")}
                  style={{
                    padding: "10px 18px",
                    background: dashboardTab === "orders" ? "#ec2226" : "transparent",
                    color: dashboardTab === "orders" ? "#ffffff" : "#475569",
                    border: "none",
                    borderRadius: "8px 8px 0 0",
                    fontWeight: "800",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Package size={15} />
                  <span>My Orders ({orders.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDashboardTab("tracker")}
                  style={{
                    padding: "10px 18px",
                    background: dashboardTab === "tracker" ? "#ec2226" : "transparent",
                    color: dashboardTab === "tracker" ? "#ffffff" : "#475569",
                    border: "none",
                    borderRadius: "8px 8px 0 0",
                    fontWeight: "800",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Search size={15} />
                  <span>Track by Unique Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDashboardTab("notifications");
                    if (unreadNotifications > 0) {
                      apiMarkCustomerNotificationsRead().then(() => setUnreadNotifications(0)).catch(() => {});
                    }
                  }}
                  style={{
                    padding: "10px 18px",
                    background: dashboardTab === "notifications" ? "#ec2226" : "transparent",
                    color: dashboardTab === "notifications" ? "#ffffff" : "#475569",
                    border: "none",
                    borderRadius: "8px 8px 0 0",
                    fontWeight: "800",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Bell size={15} />
                  <span>Updates {unreadNotifications > 0 ? `(${unreadNotifications})` : ""}</span>
                </button>
              </div>

              <Link
                to="/category/bed-room"
                style={{
                  background: "#0f172a",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  fontWeight: "750",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                }}
              >
                <ShoppingBag size={13} />
                <span>Order Furniture Now</span>
              </Link>
            </div>

            {/* ==============================================================
                TAB 1: MY ORDERS & UNIQUE TRACKING CODES
                ============================================================== */}
            {dashboardTab === "orders" && (
              <div>
                {/* Search, Status Filter, Date Filter */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setOrderPage(1);
                    fetchFilteredOrders(1);
                  }}
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    padding: "14px",
                    marginBottom: "18px",
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search Order ID or Invoice..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    style={{ flex: "1 1 180px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#ffffff" }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                    <option value="PAYMENT_VERIFICATION">Payment Verification</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    title="From Date"
                    style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    title="To Date"
                    style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                  />
                  <button
                    type="submit"
                    disabled={ordersLoading}
                    style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#0f172a", color: "#ffffff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                  >
                    {ordersLoading ? "Loading..." : "Filter Orders"}
                  </button>
                </form>

                {orders.length === 0 ? (
                  <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "48px 24px", textAlign: "center" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fee2e2", color: "#ec2226", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                      <Package size={30} />
                    </div>
                    <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
                      No Orders Placed Yet
                    </h3>
                    <p style={{ fontSize: "13.5px", color: "#64748b", maxWidth: "460px", margin: "0 auto 20px", lineHeight: "1.5" }}>
                      You have an active account ready! As soon as you place an order for any bed, sofa, or dining suite, you will receive your unique tracking code here to watch its live carpentry and delivery progress.
                    </p>
                    <Link
                      to="/category/bed-room"
                      style={{
                        background: "#ec2226",
                        color: "#ffffff",
                        padding: "12px 24px",
                        borderRadius: "10px",
                        fontSize: "13.5px",
                        fontWeight: "800",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 6px 18px rgba(236, 34, 38, 0.25)",
                      }}
                    >
                      <span>Explore Furniture Catalog</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {orders.map((ord, idx) => {
                      const code = ord.orderNumber || ord.trackingCode;
                      const st = ord.orderStatus || ord.status || "PENDING";
                      const stColor =
                        st === "DELIVERED"
                          ? { bg: "#dcfce7", fg: "#166534", bd: "#86efac" }
                          : st === "CANCELLED" || st === "FAILED"
                          ? { bg: "#fee2e2", fg: "#b91c1c", bd: "#fecaca" }
                          : st === "ON_HOLD" || st === "PAYMENT_VERIFICATION" || st === "AWAITING_PAYMENT"
                          ? { bg: "#fef3c7", fg: "#92400e", bd: "#fde68a" }
                          : { bg: "#ecfdf5", fg: "#065f46", bd: "#a7f3d0" };
                      return (
                      <div
                        key={ord.id || idx}
                        style={{
                          background: "#ffffff",
                          borderRadius: "16px",
                          border: "1.5px solid #e2e8f0",
                          padding: "24px",
                          boxShadow: "0 4px 15px rgba(15, 23, 42, 0.03)",
                        }}
                      >
                        {/* Order Header: Tracking Code, Date, Status */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                          <div>
                            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "750", letterSpacing: "0.5px" }}>
                              Order ID & Tracking Ref
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "3px" }}>
                              <span style={{ fontSize: "20px", fontWeight: "900", color: "#ec2226", letterSpacing: "0.5px", fontFamily: "monospace" }}>
                                {code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(code)}
                                title="Copy Unique Code"
                                style={{
                                  background: copiedCode === code ? "#dcfce7" : "#f1f5f9",
                                  color: copiedCode === code ? "#166534" : "#475569",
                                  border: "1px solid",
                                  borderColor: copiedCode === code ? "#86efac" : "#cbd5e1",
                                  borderRadius: "6px",
                                  padding: "4px 8px",
                                  fontSize: "11px",
                                  fontWeight: "750",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {copiedCode === code ? (
                                  <>
                                    <Check size={11} />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>Copy Code</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "3px" }}>
                              Ordered on {ord.date} • Payment: <strong>{ord.paymentStatus || "UNPAID"}</strong>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ background: stColor.bg, color: stColor.fg, border: `1px solid ${stColor.bd}`, padding: "6px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              <Clock size={13} />
                              <span>{st.replace(/_/g, " ")}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => setDetailOrder(ord)}
                              style={{
                                background: "#f8fafc",
                                color: "#0f172a",
                                border: "1px solid #cbd5e1",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "750",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <Eye size={13} />
                              <span>View Details</span>
                            </button>

                            {/* View Cash Memo / Invoice */}
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceOrder({ ...ord, trackingCode: code, invoice: ord.invoiceCode || ord.invoice })}
                              style={{
                                background: "#0f172a",
                                color: "#ffffff",
                                border: "none",
                                padding: "8px 14px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "750",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Printer size={13} />
                              <span>Cash Memo</span>
                            </button>

                            {/* Live Tracking */}
                            <Link
                              to={`/track-order?inv=${encodeURIComponent(code)}`}
                              style={{
                                background: "#ec2226",
                                color: "#ffffff",
                                padding: "8px 14px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "750",
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 4px 12px rgba(236, 34, 38, 0.25)",
                              }}
                            >
                              <span>Track Order</span>
                              <ExternalLink size={13} />
                            </Link>
                          </div>
                        </div>

                        {/* Items in this Order */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                          {(ord.items || []).map((itm, i) => {
                            const unitP = Number(itm.unitPrice ?? itm.price ?? itm.priceBDT ?? 0);
                            const lineP = Number(itm.total ?? itm.totalPrice ?? unitP * (itm.quantity || 1));
                            return (
                            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "10px 14px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                {itm.image && (
                                  <img
                                    src={itm.image}
                                    alt={itm.name}
                                    width="48"
                                    height="48"
                                    loading="lazy"
                                    style={{ width: "48px", height: "48px", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                    onError={(e) => { e.currentTarget.src = "/images/catalog/bed-grain-craft.jpg"; }}
                                  />
                                )}
                                <div>
                                  <div style={{ fontSize: "13.5px", fontWeight: "750", color: "#0f172a" }}>
                                    {itm.name}
                                  </div>
                                  <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                                    Qty: {itm.quantity} · {itm.woodType || "Seasoned Mahogany"}
                                  </div>
                                </div>
                              </div>
                              <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                                ৳{lineP.toLocaleString()}
                              </strong>
                            </div>
                          );})}
                        </div>

                        {/* Order Footer Info */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "12px", flexWrap: "wrap", gap: "8px" }}>
                          <div>
                            <strong>Delivery to:</strong> {ord.deliveryAddress || `${ord.customer?.address || user.address}, ${ord.customer?.division || user.division}`}
                            {ord.courierName && <span style={{ marginLeft: "10px", color: "#1d4ed8", fontWeight: "700" }}>• Courier: {ord.courierName} ({ord.trackingNumber || "Assigned"})</span>}
                          </div>
                          <div>
                            <span style={{ marginRight: "6px" }}>Total Amount:</span>
                            <strong style={{ fontSize: "16px", color: "#ec2226" }}>
                              ৳{(ord.grandTotal || 0).toLocaleString()}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );})}

                    {/* Pagination Bar */}
                    {orderPagination.totalPages > 1 && (
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                        <button
                          type="button"
                          disabled={orderPage <= 1}
                          onClick={() => {
                            const prev = Math.max(1, orderPage - 1);
                            setOrderPage(prev);
                            fetchFilteredOrders(prev);
                          }}
                          style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: orderPage <= 1 ? "not-allowed" : "pointer", fontSize: "12.5px", fontWeight: "700" }}
                        >
                          Previous
                        </button>
                        <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#475569" }}>
                          Page {orderPage} of {orderPagination.totalPages} ({orderPagination.total} total)
                        </span>
                        <button
                          type="button"
                          disabled={orderPage >= orderPagination.totalPages}
                          onClick={() => {
                            const nxt = Math.min(orderPagination.totalPages, orderPage + 1);
                            setOrderPage(nxt);
                            fetchFilteredOrders(nxt);
                          }}
                          style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", cursor: orderPage >= orderPagination.totalPages ? "not-allowed" : "pointer", fontSize: "12.5px", fontWeight: "700" }}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ==============================================================
                TAB 2: TRACK ANY ORDER WITH UNIQUE CODE
                ============================================================== */}
            {dashboardTab === "tracker" && (
              <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "32px", boxShadow: "0 4px 18px rgba(15, 23, 42, 0.04)" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
                  Instant Product Craftsmanship & Dispatch Tracker
                </h3>
                <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 20px" }}>
                  Enter your unique order tracking code (received when placing your order) to view its real-time production status.
                </p>

                <form onSubmit={handleTrackSubmit} style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
                  <input
                    id="account-track-input"
                    name="trackingCode"
                    type="text"
                    required
                    placeholder="Enter Unique Tracking Code (e.g. KL-TRK-784920)"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    style={{
                      flexGrow: 1,
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "14px",
                      fontWeight: "700",
                      letterSpacing: "0.5px",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: "#ec2226",
                      color: "#ffffff",
                      border: "none",
                      padding: "0 22px",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 14px rgba(236, 34, 38, 0.3)",
                    }}
                  >
                    <Search size={15} />
                    <span>Track Product</span>
                  </button>
                </form>

                {trackResult && (
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", background: "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "20px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Tracking Code</div>
                        <div style={{ fontSize: "18px", fontWeight: "900", color: "#ec2226" }}>{trackResult.orderNumber || trackResult.trackingCode}</div>
                      </div>
                      <span style={{ background: "#f0fdf4", color: "#166534", padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: "800" }}>
                        Status: {trackResult.statusLabel || trackResult.orderStatus || trackResult.status}
                      </span>
                    </div>

                    {/* Stepper */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                      {(trackResult.steps || []).map((stp, idx) => (
                        <div key={idx} style={{ display: "flex", gap: "14px", position: "relative" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: stp.completed ? "#16a34a" : stp.current ? "#ec2226" : "#cbd5e1", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", zIndex: 2 }}>
                              {stp.completed ? <Check size={14} /> : idx + 1}
                            </div>
                            {idx < trackResult.steps.length - 1 && (
                              <div style={{ width: "2px", flexGrow: 1, background: stp.completed ? "#16a34a" : "#e2e8f0", margin: "4px 0" }} />
                            )}
                          </div>

                          <div style={{ paddingBottom: "8px", flexGrow: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                              <strong style={{ fontSize: "14px", color: stp.completed || stp.current ? "#0f172a" : "#94a3b8" }}>
                                {stp.title}
                              </strong>
                              <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>{stp.date}</span>
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                              {stp.desc}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: "20px", textAlign: "right" }}>
                      <Link
                        to={`/track-order?inv=${encodeURIComponent(trackResult.orderNumber || trackResult.trackingCode)}`}
                        style={{ color: "#ec2226", fontSize: "13px", fontWeight: "750", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <span>Open Full Screen Tracking Page</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==============================================================
                TAB 3: CUSTOMER NOTIFICATIONS
                ============================================================== */}
            {dashboardTab === "notifications" && (
              <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", padding: "28px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 14px" }}>
                  Order & Payment Updates
                </h3>
                {notifications.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "13px" }}>No notifications yet. Order confirmation, payment verification, and delivery updates appear here automatically.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {notifications.map((n) => (
                      <div key={n.id} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", background: n.isRead ? "#f8fafc" : "#fef2f2" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "800", color: "#0f172a" }}>
                          <span>{n.title || n.event}</span>
                          <span style={{ color: "#64748b", fontWeight: "600" }}>{new Date(n.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#475569", marginTop: "4px" }}>{n.body}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Order Details & Customer Cancel Modal */}
        {detailOrder && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div style={{ background: "#ffffff", borderRadius: "16px", maxWidth: "620px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "800" }}>Order Details</div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "#ec2226", fontFamily: "monospace" }}>{detailOrder.orderNumber || detailOrder.trackingCode}</div>
                </div>
                <button type="button" onClick={() => setDetailOrder(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer" }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", marginBottom: "16px", background: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                <div><span style={{ color: "#64748b" }}>Order Status:</span><br /><strong>{(detailOrder.orderStatus || detailOrder.status || "").replace(/_/g, " ")}</strong></div>
                <div><span style={{ color: "#64748b" }}>Payment Status:</span><br /><strong>{detailOrder.paymentStatus || "UNPAID"} ({detailOrder.paymentMethod})</strong></div>
                <div><span style={{ color: "#64748b" }}>Grand Total:</span><br /><strong>৳{Number(detailOrder.grandTotal || 0).toLocaleString()}</strong></div>
                <div><span style={{ color: "#64748b" }}>Advance / Remaining Due:</span><br /><strong>৳{Number(detailOrder.advanceAmount ?? detailOrder.advancePaid ?? 0).toLocaleString()} / ৳{Number(detailOrder.dueAmount ?? detailOrder.remainingDue ?? detailOrder.grandTotal ?? 0).toLocaleString()}</strong></div>
                {detailOrder.courierName && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ color: "#64748b" }}>Courier & Tracking:</span>{" "}
                    <strong>{detailOrder.courierName}</strong> {detailOrder.trackingNumber ? `(#${detailOrder.trackingNumber})` : ""}
                  </div>
                )}
              </div>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: "800", color: "#475569", marginBottom: "8px", textTransform: "uppercase" }}>Items</div>
                {(detailOrder.items || []).map((it, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                    <span>{it.name} × {it.quantity}</span>
                    <strong>৳{Number(it.total ?? it.totalPrice ?? (it.unitPrice || it.price || 0) * it.quantity).toLocaleString()}</strong>
                  </div>
                ))}
              </div>
              {["PENDING", "AWAITING_PAYMENT", "PAYMENT_VERIFICATION", "ON_HOLD"].includes(detailOrder.orderStatus || detailOrder.status) && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px", marginBottom: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "800", color: "#991b1b", marginBottom: "6px" }}>Need to Cancel Order?</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder="Optional cancellation reason..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", border: "1px solid #fca5a5", fontSize: "12.5px" }}
                    />
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => handleCustomerCancelOrder(detailOrder)}
                      style={{ padding: "7px 14px", borderRadius: "6px", border: "none", background: "#dc2626", color: "#ffffff", fontSize: "12.5px", fontWeight: "700", cursor: "pointer" }}
                    >
                      {isCancelling ? "Cancelling..." : "Cancel Order"}
                    </button>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <Link
                  to={`/track-order?inv=${encodeURIComponent(detailOrder.orderNumber || detailOrder.trackingCode)}`}
                  style={{ padding: "8px 16px", background: "#ec2226", color: "#ffffff", borderRadius: "8px", fontSize: "13px", fontWeight: "700", textDecoration: "none" }}
                >
                  Open Live Tracker →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Official Printable Cash Memo Modal */}
        <KingletPrintableInvoiceModal
          order={selectedInvoiceOrder}
          isOpen={Boolean(selectedInvoiceOrder)}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      </div>
    </div>
  );
}
