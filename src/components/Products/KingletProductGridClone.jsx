import React from "react";
import { Heart, ArrowLeftRight, ShoppingBag, Star, MessageCircle } from "lucide-react";
import { BRAND_INFO } from "../../data/kingletData";

export default function KingletProductGridClone({
  title,
  subtitle,
  products,
  onAddToCart,
  onToggleWishlist,
  onToggleCompare,
  onQuickView,
  wishlistIds = [],
  compareIds = [],
}) {
  return (
    <section className="mt-50" style={{ maxWidth: "1290px", margin: "0 auto 40px" }}>
      <div className="container">
        <div className="section-title-wrap">
          <h3 className="section-title">{title}</h3>
          <p className="section-sub">{subtitle}</p>
        </div>

        <div className="fproduct-row">
          {products.map((product) => {
            const isWish = wishlistIds.includes(product.id);
            const isComp = compareIds.includes(product.id);

            return (
              <div key={product.id} className="f-item">
                {/* Product Image */}
                <div className="f-item-img">
                  {product.badge && <span className="f-badge">{product.badge}</span>}

                  {/* Button Group (Wishlist, Compare, Cart) */}
                  <div className="f-button-group">
                    <button
                      onClick={() => onToggleWishlist(product)}
                      title="Wishlist"
                      style={{ color: isWish ? "#ec2226" : "inherit" }}
                    >
                      <Heart size={15} fill={isWish ? "#ec2226" : "none"} />
                    </button>
                    <button
                      onClick={() => onToggleCompare(product)}
                      title="Compare"
                      style={{ color: isComp ? "#ec2226" : "inherit" }}
                    >
                      <ArrowLeftRight size={15} />
                    </button>
                    <button
                      onClick={() => onAddToCart(product)}
                      title="Add to Cart"
                    >
                      <ShoppingBag size={15} />
                    </button>
                  </div>

                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onQuickView(product);
                    }}
                  >
                    <img src={product.image} alt={product.name} width="500" height="500" loading="lazy" style={{ aspectRatio: "1 / 1" }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/catalog/bed-earth-form.png"; }} />
                  </a>
                </div>

                {/* Details */}
                <div className="f-item-details">
                  <div>
                    <h4 className="f-item-name">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onQuickView(product);
                        }}
                      >
                        {product.name}
                      </a>
                    </h4>

                    {/* 5 Stars Rating */}
                    <div className="f-item-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} fill="#ec2226" color="#ec2226" />
                      ))}
                    </div>

                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
                      {product.woodType}
                    </div>
                  </div>

                  <div>
                    {/* Price */}
                    <div className="f-item-price">
                      <span className="price-current">৳{product.priceBDT.toLocaleString()}</span>
                      {product.oldPriceBDT && (
                        <span className="price-old">৳{product.oldPriceBDT.toLocaleString()}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="f-item-actions">
                      <button
                        onClick={() => onAddToCart(product)}
                        className="btn-add-cart"
                      >
                        <ShoppingBag size={14} />
                        <span>Add to Cart</span>
                      </button>

                      <a
                        href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent("Hello Kinglet, I would like to order the " + product.name + " (৳" + product.priceBDT.toLocaleString() + ")")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp-order"
                        title="Order via WhatsApp"
                      >
                        <MessageCircle size={15} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
