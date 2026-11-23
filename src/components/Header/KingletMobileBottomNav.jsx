import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Grid, Heart, ShoppingBag, User } from "lucide-react";

export default function KingletMobileBottomNav({ cartCount = 0, wishlistCount = 0, onOpenCart, onOpenWishlist }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => {
    if (path === "/" && (currentPath === "/" || currentPath === "")) return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <nav
      className="kinglet-mobile-bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "calc(60px + env(safe-area-inset-bottom, 0px))",
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 9990,
        boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* 1. Home */}
      <Link
        to="/"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          flex: 1,
          height: "100%",
          color: isActive("/") ? "#ec2226" : "#64748b",
          transition: "color 0.2s ease",
        }}
      >
        <Home size={20} strokeWidth={isActive("/") ? 2.5 : 2} />
        <span style={{ fontSize: "10px", fontWeight: isActive("/") ? "800" : "600", marginTop: "3px" }}>
          Home
        </span>
      </Link>

      {/* 2. Categories */}
      <Link
        to="/category/bed-room"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          flex: 1,
          height: "100%",
          color: isActive("/category") ? "#ec2226" : "#64748b",
          transition: "color 0.2s ease",
        }}
      >
        <Grid size={20} strokeWidth={isActive("/category") ? 2.5 : 2} />
        <span style={{ fontSize: "10px", fontWeight: isActive("/category") ? "800" : "600", marginTop: "3px" }}>
          Categories
        </span>
      </Link>

      {/* 3. Wishlist */}
      <button
        onClick={onOpenWishlist}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          flex: 1,
          height: "100%",
          color: wishlistCount > 0 ? "#ec2226" : "#64748b",
          position: "relative",
          cursor: "pointer",
        }}
      >
        <div style={{ position: "relative" }}>
          <Heart size={20} />
          {wishlistCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-8px",
                background: "#ec2226",
                color: "#ffffff",
                fontSize: "9px",
                fontWeight: "800",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {wishlistCount}
            </span>
          )}
        </div>
        <span style={{ fontSize: "10px", fontWeight: "600", marginTop: "3px" }}>Wishlist</span>
      </button>

      {/* 4. Cart */}
      <button
        onClick={onOpenCart}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          flex: 1,
          height: "100%",
          color: cartCount > 0 ? "#ec2226" : "#64748b",
          position: "relative",
          cursor: "pointer",
        }}
      >
        <div style={{ position: "relative" }}>
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-8px",
                background: "#ec2226",
                color: "#ffffff",
                fontSize: "9px",
                fontWeight: "800",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {cartCount}
            </span>
          )}
        </div>
        <span style={{ fontSize: "10px", fontWeight: "600", marginTop: "3px" }}>Cart</span>
      </button>

      {/* 5. Account & Order Tracking */}
      <Link
        to="/account"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          flex: 1,
          height: "100%",
          color: isActive("/account") || isActive("/track-order") ? "#ec2226" : "#64748b",
          transition: "color 0.2s ease",
        }}
      >
        <User size={20} strokeWidth={isActive("/account") ? 2.5 : 2} />
        <span style={{ fontSize: "10px", fontWeight: isActive("/account") ? "800" : "600", marginTop: "3px" }}>
          Account
        </span>
      </Link>
    </nav>
  );
}
