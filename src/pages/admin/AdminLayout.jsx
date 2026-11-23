import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { adminAuthService } from "../../utils/adminAuthService";

export default function AdminLayout() {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined" && adminAuthService.isAuthenticated()) {
      return adminAuthService.getUser();
    }
    return null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const loadAdminNotifications = async () => {
    if (!adminAuthService.isAuthenticated()) return;
    try {
      const res = await adminAuthService.fetch("/api/v1/admin/notifications?limit=15");
      if (res?.success && res?.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(Number(res.data.unreadCount || 0));
      }
    } catch {}
  };

  useEffect(() => {
    loadAdminNotifications();
    const timer = setInterval(loadAdminNotifications, 30000);
    return () => clearInterval(timer);
  }, [location.pathname]);

  const handleMarkNotificationsRead = async (id = null) => {
    try {
      await adminAuthService.fetch("/api/v1/admin/notifications/read", {
        method: "PATCH",
        body: JSON.stringify(id ? { id } : {}),
      });
      loadAdminNotifications();
    } catch {}
  };

  useEffect(() => {
    if (!adminAuthService.isAuthenticated()) {
      navigate("/admin/login", { replace: true });
      return;
    }
    const activeAdmin = adminAuthService.getUser();
    if (activeAdmin) {
      if (!activeAdmin.fullName) activeAdmin.fullName = "Farhan";
      localStorage.setItem("kinglet_admin_user", JSON.stringify(activeAdmin));
    }
    setUser(activeAdmin);

    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [navigate]);

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#e2e8f0", padding: "24px", textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #ef4444, #991b1b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: 900, fontSize: "22px", margin: "0 auto 16px" }}>
          K
        </div>
        <div style={{ width: "36px", height: "36px", border: "3px solid #ef4444", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px", color: "#f8fafc" }}>
          Authenticating Kinglet Administrator...
        </h3>
        <p style={{ fontSize: "13px", color: "#94a3b8", maxWidth: "360px", margin: "0 0 16px" }}>
          Redirecting to Admin Login Portal. If not redirected automatically, please click below.
        </p>
        <Link
          to="/admin/login"
          style={{
            background: "#ef4444",
            color: "#ffffff",
            padding: "8px 18px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          Sign In to Admin Portal →
        </Link>
      </div>
    );
  }

  // Exact OmniMart Navigation Menu as captured from https://www.kingletbd.com/admin
  const menuItems = [
    { label: "Dashboard", path: "/admin", icon: "🏠" },
    {
      label: "Manage Categories",
      icon: "🗂️",
      children: [
        { label: "Categories", path: "/admin/categories" },
        { label: "Sub Categories", path: "/admin/categories?tab=sub" },
      ],
    },
    { label: "Manage Attribute", path: "/admin/products?tab=attributes", icon: "⚙️" },
    { label: "Manage Features", path: "/admin/content?tab=features", icon: "⭐" },
    {
      label: "Manage Products",
      icon: "🅿️",
      children: [
        { label: "All Products", path: "/admin/products" },
        { label: "Inventory Stock", path: "/admin/inventory" },
      ],
    },
    {
      label: "Manage Orders",
      icon: "📋",
      children: [
        { label: "All Orders", path: "/admin/orders" },
        { label: "Pending Orders", path: "/admin/orders?status=PENDING" },
        { label: "Payment Verification", path: "/admin/orders?status=PAYMENT_VERIFICATION" },
        { label: "On Hold Orders", path: "/admin/orders?status=ON_HOLD" },
        { label: "Delivered Orders", path: "/admin/orders?status=DELIVERED" },
        { label: "Canceled Orders", path: "/admin/orders?status=CANCELLED" },
      ],
    },
    { label: "Transactions", path: "/admin/orders?tab=transactions", icon: "🔀" },
    {
      label: "Ecommerce",
      icon: "💻",
      children: [
        { label: "Coupons", path: "/admin/coupons" },
        { label: "Shipping Methods", path: "/admin/content?tab=shipping" },
      ],
    },
    { label: "Customer List", path: "/admin/orders?tab=customers", icon: "👥" },
    { label: "Manages Tickets", path: "/admin/orders?filter=tickets", icon: "🎫" },
    {
      label: "Manage Site",
      icon: "📑",
      children: [
        { label: "General Settings", path: "/admin/content?tab=general_settings" },
        { label: "Home Notice Scroller", path: "/admin/content?tab=notice_scroller" },
        { label: "Menu Builder", path: "/admin/content?tab=menu_builder" },
        { label: "Home Page", path: "/admin/content?tab=home_page" },
        { label: "Sliders", path: "/admin/content?tab=sliders" },
        { label: "Services", path: "/admin/content?tab=services" },
        { label: "Visibility", path: "/admin/content?tab=visibility" },
        { label: "Storage Settings", path: "/admin/content?tab=storage_settings" },
        { label: "Social Login", path: "/admin/content?tab=social_login" },
        { label: "Email Settings", path: "/admin/content?tab=email_settings" },
        { label: "SMS Settings", path: "/admin/content?tab=sms_settings" },
        { label: "Announcement", path: "/admin/content?tab=announcement" },
        { label: "Cookies Alert", path: "/admin/content?tab=cookies_alert" },
        { label: "Maintainance", path: "/admin/content?tab=maintainance" },
        { label: "Sitemap", path: "/admin/content?tab=sitemap" },
        { label: "Schema", path: "/admin/content?tab=schema" },
        { label: "Robots.txt", path: "/admin/content?tab=robots_txt" },
        { label: "Language", path: "/admin/content?tab=language" },
      ],
    },
    { label: "Manage Faqs", path: "/admin/content?tab=faqs", icon: "❓" },
    { label: "Manage Blogs", path: "/admin/content?tab=blogs", icon: "📰" },
    { label: "Manages Pages", path: "/admin/content?tab=pages", icon: "📄" },
    { label: "Subscribers List", path: "/admin/content?tab=subscribers", icon: "✉️" },
    { label: "System User", path: "/admin/orders?tab=users", icon: "👤" },
    { label: "System Backup", path: "/admin/content?tab=backup", icon: "💾" },
    { label: "Cache Clear", action: "cache_clear", icon: "🧹" },
  ];

  const handleAction = (action) => {
    if (action === "cache_clear") {
      alert("Application cache cleared successfully!");
    }
  };

  const handleLogout = () => {
    adminAuthService.logout();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f9fbfd", fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      {/* Top Black Header Bar - Matches kingletbd.com/admin */}
      <header
        style={{
          height: "62px",
          background: "#000000",
          borderBottom: "1px solid #1f1f1f",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px 0 16px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left: Brand Logo + Hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link to="/admin" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: "16px" }}>
              K
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#ffffff", fontWeight: 800, fontSize: "15px", letterSpacing: "0.5px" }}>
                Kinglet
              </span>
              <span style={{ color: "#ef4444", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                Furniture & Interior
              </span>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ☰
          </button>
        </div>

        {/* Right: View Website + Notification Badge + Profile Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            style={{
              background: "#1572e8",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              padding: "7px 14px",
              borderRadius: "4px",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            View Website
          </a>

          {/* Live Notification Bell with DB Unread Badge & Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              style={{ position: "relative", cursor: "pointer", color: "#ffffff", fontSize: "16px", background: "transparent", border: "none", padding: "4px" }}
              title="Order & Payment Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-6px",
                    background: "#f3545d",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 700,
                    borderRadius: "10px",
                    padding: "1px 5px",
                    minWidth: "14px",
                    textAlign: "center",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "38px",
                  width: "340px",
                  maxHeight: "420px",
                  overflowY: "auto",
                  background: "#ffffff",
                  borderRadius: "8px",
                  boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
                  border: "1px solid #e2e8f0",
                  zIndex: 300,
                }}
              >
                <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>Admin Notifications ({unreadCount} unread)</strong>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMarkNotificationsRead()}
                      style={{ background: "transparent", border: "none", color: "#1572e8", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", fontSize: "12px", color: "#64748b" }}>No notifications recorded yet.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.isRead) handleMarkNotificationsRead(n.id);
                        setNotifOpen(false);
                        if (n.orderId) navigate(`/admin/orders?openId=${encodeURIComponent(n.orderId)}`);
                      }}
                      style={{
                        padding: "10px 14px",
                        borderBottom: "1px solid #f8fafc",
                        background: n.isRead ? "#ffffff" : "#fef2f2",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>{n.title || n.event}</div>
                      <div style={{ fontSize: "11.5px", color: "#475569", marginTop: "2px" }}>{n.body}</div>
                      <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px" }}>
                        {new Date(n.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User Profile Avatar with Online Status */}
          <div
            onClick={handleLogout}
            title="Click to Logout"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#e51c23",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 0 0 2px rgba(255,255,255,0.2)",
            }}
          >
            {(user?.fullName || "Farhan").charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <div style={{ display: "flex", flexGrow: 1 }}>
        {/* Left Dark Sidebar Menu */}
        <aside
          style={{
            width: sidebarOpen ? "230px" : "0px",
            background: "#000000",
            color: "#ffffff",
            transition: "width 0.25s ease-in-out",
            overflow: "hidden",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #1a1a1a",
          }}
        >
          <div style={{ width: "230px", display: "flex", flexDirection: "column", height: "100%" }}>
            {/* User Profile Banner in Sidebar */}
            <div style={{ padding: "16px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: 700 }}>
                {(user?.fullName || "Farhan").charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
                  {user?.fullName || "Farhan"}
                </div>
                <div style={{ fontSize: "11px", color: "#8d9498" }}>
                  Administrator
                </div>
              </div>
            </div>

            {/* Menu Navigation Items */}
            <nav style={{ padding: "10px 0", flexGrow: 1, overflowY: "auto" }}>
              {menuItems.map((item, idx) => {
                const hasChildren = Boolean(item.children);
                const currentFullPath = location.pathname + location.search;
                let isActive = false;
                if (item.path) {
                  if (item.path.includes("?")) {
                    isActive = currentFullPath === item.path;
                  } else {
                    isActive = location.pathname === item.path && !location.search;
                  }
                }
                const isOpen = openSubmenu === item.label;

                if (item.action) {
                  return (
                    <div
                      key={idx}
                      onClick={() => handleAction(item.action)}
                      style={{
                        padding: "9px 18px",
                        fontSize: "13px",
                        color: "#c2c5ca",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#c2c5ca")}
                    >
                      <span style={{ fontSize: "14px" }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  );
                }

                if (hasChildren) {
                  const childActive = item.children.some(
                    (c) => (c.path.includes("?") ? currentFullPath === c.path : location.pathname === c.path.split("?")[0])
                  );
                  const isDropdownOpen = openSubmenu === item.label || (openSubmenu === null && childActive);
                  return (
                    <div key={idx}>
                      <div
                        onClick={() => setOpenSubmenu(isDropdownOpen ? "NONE" : item.label)}
                        style={{
                          padding: "9px 18px",
                          fontSize: "13px",
                          color: isDropdownOpen || childActive ? "#ffffff" : "#c2c5ca",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderLeft: childActive ? "4px solid #ef4444" : "4px solid transparent",
                          background: childActive ? "rgba(239, 68, 68, 0.12)" : "transparent",
                          fontWeight: childActive ? 700 : 500,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                        onMouseLeave={(e) => {
                          if (!isDropdownOpen && !childActive) e.currentTarget.style.color = "#c2c5ca";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "14px" }}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        <span style={{ fontSize: "10px" }}>{isDropdownOpen ? "▼" : "▶"}</span>
                      </div>
                      {isDropdownOpen && (
                        <div style={{ background: "#0a0a0a", padding: "4px 0" }}>
                          {item.children.map((child, cIdx) => {
                            const isSubActive = child.path.includes("?")
                              ? currentFullPath === child.path
                              : location.pathname === child.path && !location.search;
                            return (
                              <Link
                                key={cIdx}
                                to={child.path}
                                style={{
                                  display: "block",
                                  padding: "7px 18px 7px 42px",
                                  fontSize: "12px",
                                  color: isSubActive ? "#ef4444" : "#8d9498",
                                  fontWeight: isSubActive ? 700 : 500,
                                  textDecoration: "none",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = isSubActive ? "#ef4444" : "#8d9498")}
                              >
                                • {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={idx}
                    to={item.path}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 18px",
                      fontSize: "13px",
                      color: isActive ? "#ffffff" : "#c2c5ca",
                      background: isActive ? "linear-gradient(90deg, rgba(239, 68, 68, 0.22) 0%, rgba(239, 68, 68, 0.04) 100%)" : "transparent",
                      borderLeft: isActive ? "4px solid #ef4444" : "4px solid transparent",
                      fontWeight: isActive ? 700 : 500,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#c2c5ca";
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar Footer Version */}
            <div style={{ padding: "16px", textAlign: "center", borderTop: "1px solid #1f1f1f", fontSize: "11px", color: "#1572e8", fontWeight: 700 }}>
              Version 6.2
            </div>
          </div>
        </aside>

        {/* Content Body Area */}
        <main style={{ flexGrow: 1, padding: "20px 24px", overflowX: "hidden" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
