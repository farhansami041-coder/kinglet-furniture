import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Home, BedDouble, Sofa, UtensilsCrossed, Compass } from "lucide-react";
import KingletSEO from "../components/Common/KingletSEO";

export default function NotFoundPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Automatic 301 Redirect Resolver: Check backend for permanently moved URLs before rendering 404
  useEffect(() => {
    let isMounted = true;
    async function checkRedirect() {
      try {
        const res = await fetch(`/api/v1/seo/redirects/resolve?path=${encodeURIComponent(location.pathname)}`);
        const json = await res.json();
        if (json.success && json.data?.hasRedirect && json.data.targetPath) {
          navigate(json.data.targetPath, { replace: true });
          return;
        }
      } catch {
        // Fall through to 404 display
      } finally {
        if (isMounted) setIsCheckingRedirect(false);
      }
    }
    checkRedirect();
    return () => { isMounted = false; };
  }, [location.pathname, navigate]);

  if (isCheckingRedirect) {
    return <div style={{ minHeight: "60vh", background: "#f8fafc" }} />;
  }

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category/bed-room?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const popularCategories = [
    { name: "Luxury Bed Sets", path: "/category/bed-room?sub=bed-room-set", icon: BedDouble },
    { name: "Living Sofas", path: "/category/living-room?sub=sofa", icon: Sofa },
    { name: "Mahogany Dining Sets", path: "/category/dining?sub=dining-table", icon: UtensilsCrossed },
    { name: "Flash Sale 15% OFF", path: "/flash-sale", icon: Compass },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
      }}
    >
      <KingletSEO
        title="Page Not Found (404) | Kinglet Bangladesh Ltd"
        description="The requested page could not be found. Explore Kinglet's handcrafted Seasoned Mahogany bedroom, dining, living room suites, or return to the homepage."
        noindex={true}
      />
      <div style={{ maxWidth: "650px", width: "100%" }}>
        {/* Badge */}
        <div
          style={{
            display: "inline-block",
            background: "#fee2e2",
            color: "#dc2626",
            padding: "4px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "800",
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          404 • Page Not Found
        </div>

        {/* 404 Heading */}
        <h1
          style={{
            fontSize: "72px",
            fontWeight: "900",
            color: "#0f172a",
            margin: "0 0 10px",
            letterSpacing: "-2px",
            fontFamily: "Outfit, sans-serif",
            lineHeight: 1,
          }}
        >
          4<span style={{ color: "#ec2226" }}>0</span>4
        </h1>

        <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#1e293b", margin: "0 0 10px" }}>
          দুঃখিত! কাঙ্ক্ষিত পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
        </h2>

        <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 30px", lineHeight: "1.6" }}>
          The page you are looking for might have been moved, renamed, or is temporarily unavailable.
          You can search our handcrafted seasoned mahogany & oak veneer furniture catalog below or return to the homepage.
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          style={{
            display: "flex",
            alignItems: "center",
            background: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            padding: "6px 8px 6px 16px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
            marginBottom: "32px",
          }}
        >
          <Search size={18} color="#94a3b8" />
          <input
            id="not-found-search"
            name="q"
            type="text"
            placeholder="Search beds, sofas, dining tables, almiras..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              padding: "10px 12px",
              fontSize: "14px",
              color: "#0f172a",
            }}
          />
          <button
            type="submit"
            style={{
              background: "#ec2226",
              color: "#ffffff",
              border: "none",
              padding: "10px 22px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        {/* Popular Categories */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "12px" }}>
            Or explore our popular collections:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
            {popularCategories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={i}
                  to={cat.path}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#334155",
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  }}
                >
                  <Icon size={16} color="#ec2226" />
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Back to Home CTA */}
        <div>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#0f172a",
              color: "#ffffff",
              padding: "12px 26px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "700",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
            }}
          >
            <Home size={16} /> Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
