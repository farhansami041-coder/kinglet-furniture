import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Gift, ArrowRight, Check } from "lucide-react";
import { ROOM_PACKAGES, PRODUCTS } from "../data/kingletData";
import { productService } from "../utils/productService";
import KingletProductCardImage from "../components/Products/KingletProductCardImage";
import KingletSEO from "../components/Common/KingletSEO";

export default function OffersPage({ onAddToCart }) {
  const [saleProducts, setSaleProducts] = useState(() => PRODUCTS.filter((p) => Boolean(p.isOffer)));

  useEffect(() => {
    let isMounted = true;
    const fetchLiveProducts = () => {
      productService.getProducts({ limit: 250 }).then((res) => {
        if (isMounted && res.products && res.products.length > 0) {
          const markedOffers = res.products.filter((p) => Boolean(p.isOffer));
          setSaleProducts(markedOffers);
        }
      });
    };

    fetchLiveProducts();

    const handleUpdate = () => fetchLiveProducts();
    window.addEventListener("kinglet:products-updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("kinglet:products-updated", handleUpdate);
    };
  }, []);

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", paddingBottom: "70px" }}>
      <KingletSEO
        title="Furniture Packages & Special Deals in Bangladesh | Kinglet"
        description="Save up to ৳25,000 on handcrafted seasoned Mahogany & Oak Veneer bedroom and living packages, zero-interest 12-month EMI, and safe doorstep delivery across Dhaka."
        keywords="furniture offers Bangladesh, bridal furniture package BD, wooden bedroom set discount, mahogany deals, Kinglet packages"
        canonicalUrl="https://www.kingletbd.com/offers"
      />
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #ec2226 0%, #b91c1c 100%)", color: "#ffffff", padding: "50px 0 45px", textAlign: "center" }}>
        <div className="container">
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.2)", padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", marginBottom: "12px" }}>
            <Gift size={14} /> Seasonal Festival & Bridal Campaign 2026
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: "900", margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            Kinglet Exclusive Furniture Packages & Deals
          </h1>
          <p style={{ color: "rgba(255,255,255,0.9)", maxWidth: "600px", margin: "0 auto", fontSize: "15px" }}>
            Save up to ৳25,000 on handcrafted seasoned Mahogany & Oak suites, zero-interest 12-month EMI, and safe doorstep delivery across Dhaka.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "40px" }}>
        {/* Curated Bridal Suites (ISHO/HATIL style) */}
        <div style={{ marginBottom: "50px" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <span style={{ color: "#ec2226", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}>Room Packages</span>
            <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#111827", margin: "6px 0" }}>Complete Home Bridal & Living Packages</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Harmonious designer suites curated for modern apartments at bundled package discounts.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "25px" }}>
            {ROOM_PACKAGES.map((pkg) => (
              <div key={pkg.id} style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
                  <img src={pkg.image} alt={pkg.title} width="400" height="220" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/furniture-placeholder.svg"; }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span style={{ position: "absolute", top: "12px", left: "12px", background: "#ec2226", color: "#ffffff", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "800" }}>
                    {pkg.tag}
                  </span>
                </div>

                <div style={{ padding: "20px", display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>{pkg.category}</span>
                    <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#111827", margin: "4px 0 10px" }}>{pkg.title}</h3>
                    <p style={{ fontSize: "13px", color: "#4b5563", margin: "0 0 14px", lineHeight: "1.5" }}>{pkg.description}</p>

                    <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>Pieces Included in this Suite:</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {pkg.itemsIncluded.map((item, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#334155" }}>
                            <Check size={13} color="#16a34a" /> {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "14px" }}>
                      <span style={{ fontSize: "24px", fontWeight: "900", color: "#ec2226" }}>৳{pkg.priceBDT.toLocaleString()}</span>
                      <span style={{ fontSize: "15px", color: "#9ca3af", textDecoration: "line-through" }}>৳{pkg.oldPriceBDT.toLocaleString()}</span>
                    </div>

                    <Link
                      to="/checkout"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        width: "100%",
                        height: "44px",
                        background: "#ec2226",
                        color: "#ffffff",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "700",
                        textDecoration: "none",
                      }}
                    >
                      Order Package Suite <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Discount Items */}
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#111827", marginBottom: "20px" }}>
            Current Flash Sale Products (Limited Time)
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
            {saleProducts.map((p) => (
              <div key={p.id} style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e5e7eb", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Strict 1:1 Aspect Ratio Image Container with Smooth 2nd Image Hover Pop-up */}
                <KingletProductCardImage
                  product={p}
                />
                <div style={{ padding: "14px", display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>{p.woodType}</div>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", margin: "4px 0 8px" }}>
                      <Link to={`/product/${p.slug}`} style={{ color: "#111827", textDecoration: "none" }}>{p.name}</Link>
                    </h4>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "#ec2226" }}>৳{Number(p.priceBDT).toLocaleString()}</span>
                      {p.oldPriceBDT && Number(p.oldPriceBDT) > Number(p.priceBDT) && (
                        <span style={{ fontSize: "12px", color: "#9ca3af", textDecoration: "line-through" }}>৳{Number(p.oldPriceBDT).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onAddToCart(p)}
                    style={{ marginTop: "12px", width: "100%", background: "#ec2226", color: "#ffffff", border: "none", padding: "8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
