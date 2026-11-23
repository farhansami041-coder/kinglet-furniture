import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  MessageSquarePlus,
  Play,
  Pause,
  Award,
  X,
  Send,
} from "lucide-react";

export const SHOWROOM_REVIEWS_DATA = [
  {
    id: 1,
    name: "Dr. Farhana Yasmin",
    initials: "FY",
    avatarBg: "linear-gradient(135deg, #ec2226 0%, #b91c1c 100%)",
    role: "Senior Consultant, Apollo/Evercare",
    location: "Gulshan-2, Dhaka",
    category: "Bedroom",
    product: "Grain Craft King Bed & Almirah",
    productSlug: "grain-craft-bed",
    rating: 5,
    date: "Verified 2 days ago",
    verifiedType: "Mirpur Showroom Verified",
    helpfulCount: 42,
    comment:
      "The seasoned mahogany and oak veneer grain and Italian lacquer finish look even better than imported Italian furniture. The installation team assembled everything within 45 minutes without a single scratch. Highly recommended for genuine mahogany lovers!",
    highlight: "Genuine Mahogany & 45-Min White-Glove Assembly",
  },
  {
    id: 2,
    name: "Barrister Rafiqul Islam",
    initials: "RI",
    avatarBg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    role: "Supreme Court Advocate",
    location: "Baridhara DOHS, Dhaka",
    category: "Living",
    product: "Urban Nest Sofa (3+2+1) & Center Table",
    productSlug: "urban-nest-sofa",
    rating: 5,
    date: "Verified 1 week ago",
    verifiedType: "White Glove Delivery Verified",
    helpfulCount: 38,
    comment:
      "We compared HATIL, Brothers and Kinglet before purchasing. Kinglet provided genuine seasoned mahogany with exceptional foam density at 25% better pricing. Customer service is genuinely 24/7 and transparent.",
    highlight: "25% Better Pricing than Legacy Brands",
  },
  {
    id: 3,
    name: "Architect Shahriar Kabir",
    initials: "SK",
    avatarBg: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
    role: "Principal Architect, Studio Bauhaus BD",
    location: "Banani, Dhaka",
    category: "Interior",
    product: "Turnkey Penthouse Interior & Dining Suite",
    productSlug: "turnkey-interior",
    rating: 5,
    date: "Verified 2 weeks ago",
    verifiedType: "Architectural Project Verified",
    helpfulCount: 56,
    comment:
      "As an architect, I am very strict about timber moisture content and hardware tolerances. Kinglet's kiln seasoning (below 10% moisture) and soft-close German fittings exceeded all my expectations for high-end residential spaces.",
    highlight: "German Fittings & <10% Moisture Seasoning",
  },
  {
    id: 4,
    name: "Tanzila Akhter Chowdhury",
    initials: "TC",
    avatarBg: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
    role: "Homeowner & Interior Enthusiast",
    location: "Dhanmondi 27, Dhaka",
    category: "Dining",
    product: "Royal Heritage 6-Seater Dining Suite",
    productSlug: "dining-table",
    rating: 5,
    date: "Verified 3 weeks ago",
    verifiedType: "Mirpur Showroom Verified",
    helpfulCount: 29,
    comment:
      "The heat-resistant tempered glass marble top dining table is stunning. We hosted 12 guests during Eid and everyone couldn't stop praising the seasoned mahogany wood carving. Outstanding showroom hospitality in Mirpur!",
    highlight: "Heat-Resistant Marble Top & Eid Hosting",
  },
  {
    id: 5,
    name: "Engr. Mahbubur Rahman",
    initials: "MR",
    avatarBg: "linear-gradient(135deg, #059669 0%, #047857 100%)",
    role: "Chief Engineer, Meghna Group",
    location: "Uttara Sector 4, Dhaka",
    category: "Bedroom",
    product: "Sunflora 4-Door Almirah & Vanity Dresser",
    productSlug: "sunflora-almirah",
    rating: 5,
    date: "Verified 1 month ago",
    verifiedType: "Factory Direct Delivery",
    helpfulCount: 34,
    comment:
      "Kinglet's timber seasoning is truly unmatched. Even with rainy season monsoon humidity, the almirah doors slide like silk with zero warping. Honest timber volume and factory direct pricing without middleman markups.",
    highlight: "Zero Monsoon Warping & Honest Timber Volume",
  },
  {
    id: 6,
    name: "Nusrat Jahan & Fahim Ahmed",
    initials: "NF",
    avatarBg: "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
    role: "Newlywed Homeowners",
    location: "Bashundhara R/A, Block C",
    category: "Living",
    product: "Regal Sectional L-Shaped Velvet Lounge",
    productSlug: "living-sofa",
    rating: 5,
    date: "Verified 1 month ago",
    verifiedType: "Bridal Package Verified",
    helpfulCount: 47,
    comment:
      "The high-resilience foam and stain-resistant Turkish velvet fabric are pure luxury. Delivered exactly on schedule on our wedding anniversary. Worth every taka! Their Mirpur showroom team was incredibly patient with custom fabric choices.",
    highlight: "Stain-Resistant Turkish Velvet & Anniversary Delivery",
  },
  {
    id: 7,
    name: "Brigadier Gen. (Retd.) K. M. Hossain",
    initials: "KH",
    avatarBg: "linear-gradient(135deg, #475569 0%, #334155 100%)",
    role: "Retired Armed Forces Officer",
    location: "Mirpur DOHS, Dhaka",
    category: "Interior",
    product: "Executive Mahogany Boss Desk & Bookcase",
    productSlug: "office-desk",
    rating: 5,
    date: "Verified 2 months ago",
    verifiedType: "Mirpur Showroom Verified",
    helpfulCount: 31,
    comment:
      "Solid seasoned timber with authentic brass detailing. Visited their flagship showroom at 752/2 West Shewrapara and was thoroughly impressed by their transparent factory explanation and prompt white-glove installation.",
    highlight: "Authentic Brass Detailing & Transparent Factory Direct",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Reviews" },
  { id: "Bedroom", label: "Bedroom" },
  { id: "Living", label: "Living Room" },
  { id: "Dining", label: "Dining" },
  { id: "Interior", label: "Interior & Office" },
];

export default function KingletVerifiedReviews() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [helpfulMap, setHelpfulMap] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [visibleCards, setVisibleCards] = useState(3);
  const [isDragging, setIsDragging] = useState(false);

  // Review Form state
  const [newReview, setNewReview] = useState({
    name: "",
    location: "",
    product: "",
    rating: 5,
    comment: "",
  });

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Responsive card count calculation
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 680) {
        setVisibleCards(1);
      } else if (window.innerWidth < 1080) {
        setVisibleCards(2);
      } else {
        setVisibleCards(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredReviews =
    activeCategory === "all"
      ? SHOWROOM_REVIEWS_DATA
      : SHOWROOM_REVIEWS_DATA.filter((r) => r.category === activeCategory);

  const totalReviews = filteredReviews.length;
  const maxIndex = Math.max(0, totalReviews - visibleCards);

  // Reset index when category or visibleCards change
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory, visibleCards]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Dynamic Autoplay
  useEffect(() => {
    if (!isPlaying || maxIndex <= 0) return;
    const timer = setInterval(() => {
      handleNext();
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying, maxIndex, handleNext]);

  // Touch gesture support
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleToggleHelpful = (id) => {
    setHelpfulMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newReview.name.trim() || !newReview.comment.trim()) return;

    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setIsModalOpen(false);
      setNewReview({ name: "", location: "", product: "", rating: 5, comment: "" });
    }, 2000);
  };

  // Calculation for exact translateX shift
  // Card width = calc((100% - (V-1)*20px) / V). Step = Card width + 20px
  const transformStyle =
    totalReviews > 0
      ? `translateX(calc(-${currentIndex} * ((100% - ${(visibleCards - 1) * 20}px) / ${visibleCards} + 20px)))`
      : "translateX(0)";

  return (
    <section className="scroll-reveal kinglet-reviews-section">
      <div className="container" style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 clamp(16px, 3vw, 32px)" }}>
        {/* Simple & Dynamic Header */}
        <div className="kinglet-reviews-head">
          <div className="reviews-trust-pill">
            <Sparkles size={13} color="#ec2226" />
            <span>4.97 / 5.0 RATING · 1,480+ HOMES FURNISHED</span>
          </div>

          <h2 className="reviews-main-heading">
            Verified Client Showroom Reviews
          </h2>
          <p className="reviews-sub-heading">
            Authentic experiences from homeowners, architects, and corporate executives across Dhaka & Bangladesh.
          </p>

          {/* Streamlined Trust Stats Micro-Bar */}
          <div className="reviews-trust-micro-bar">
            <div className="micro-stat">
              <Star size={14} fill="#f59e0b" color="#f59e0b" />
              <span><strong>4.97 / 5.0</strong> Client Score</span>
            </div>
            <span className="micro-stat-dot">•</span>
            <div className="micro-stat">
              <Award size={14} color="#ec2226" />
              <span><strong>1,480+</strong> Homes Finished</span>
            </div>
            <span className="micro-stat-dot">•</span>
            <div className="micro-stat">
              <ShieldCheck size={14} color="#059669" />
              <span><strong>100%</strong> Kiln Seasoned Mahogany</span>
            </div>
            <span className="micro-stat-dot">•</span>
            <div className="micro-stat">
              <MapPin size={14} color="#ec2226" />
              <span><strong>Mirpur</strong> Flagship Showroom</span>
            </div>
          </div>
        </div>

        {/* Clean Controls & Category Filters */}
        <div className="kinglet-reviews-nav-bar">
          {/* Minimalist Category Tabs */}
          <div className="reviews-clean-tabs">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`reviews-tab-item ${isActive ? "is-active" : ""}`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Navigation Controls: Play/Pause, Slide Info, Arrows, Write */}
          <div className="reviews-dynamic-controls">
            {maxIndex > 0 && (
              <>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="reviews-icon-btn"
                  title={isPlaying ? "Pause auto-slide" : "Start auto-slide"}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
                </button>

                <div className="reviews-slide-counter">
                  <span>{currentIndex + 1}</span>
                  <span className="counter-sep">/</span>
                  <span>{maxIndex + 1}</span>
                </div>

                <button
                  onClick={handlePrev}
                  className="reviews-icon-btn"
                  aria-label="Previous review"
                  title="Previous"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  onClick={handleNext}
                  className="reviews-icon-btn"
                  aria-label="Next review"
                  title="Next"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="reviews-share-experience-btn"
            >
              <MessageSquarePlus size={14} />
              <span>Share Experience</span>
            </button>
          </div>
        </div>

        {/* Dynamic Progress Indicator Line */}
        {maxIndex > 0 && (
          <div className="reviews-slider-progress-track">
            <div
              className={`reviews-slider-progress-fill ${isPlaying ? "is-animating" : ""}`}
              style={{
                width: `${((currentIndex + 1) / (maxIndex + 1)) * 100}%`,
              }}
            />
          </div>
        )}

        {/* Dynamic Carousel Sliding Viewport */}
        <div
          className="reviews-slider-viewport"
          onMouseEnter={() => setIsPlaying(false)}
          onMouseLeave={() => setIsPlaying(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="reviews-sliding-track"
            style={{
              transform: transformStyle,
              transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
            }}
          >
            {filteredReviews.map((rev) => {
              const isLiked = !!helpfulMap[rev.id];
              const likes = rev.helpfulCount + (isLiked ? 1 : 0);

              return (
                <div
                  key={rev.id}
                  className="kinglet-clean-review-card"
                  style={{
                    flex: `0 0 calc((100% - ${(visibleCards - 1) * 20}px) / ${visibleCards})`,
                  }}
                >
                  {/* Card Header: 5 Stars + Verified Tag */}
                  <div className="card-clean-header">
                    <div className="card-stars-group">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                      ))}
                      <span className="card-rating-num">{rev.rating}.0</span>
                    </div>

                    <div className="card-verified-badge">
                      <CheckCircle2 size={12} color="#16a34a" />
                      <span>{rev.verifiedType.replace(" Verified", "")}</span>
                    </div>
                  </div>

                  {/* Highlight Heading */}
                  {rev.highlight && (
                    <h4 className="card-highlight-headline">
                      "{rev.highlight}"
                    </h4>
                  )}

                  {/* Review Text */}
                  <p className="card-comment-text">
                    "{rev.comment}"
                  </p>

                  {/* Card Footer: Client Avatar & Information */}
                  <div className="card-clean-footer">
                    <div className="card-author-row">
                      <div className="card-avatar" style={{ background: rev.avatarBg }}>
                        {rev.initials}
                      </div>

                      <div className="card-author-info">
                        <div className="card-author-name">
                          <strong>{rev.name}</strong>
                          <ShieldCheck size={13} color="#ec2226" />
                        </div>
                        <div className="card-author-desc">
                          {rev.role} · {rev.location}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Product Tag & Helpful Like */}
                    <div className="card-action-row">
                      <Link
                        to="/category/all"
                        className="card-product-pill"
                        title={`View ${rev.product}`}
                      >
                        <span className="product-label">Item:</span>
                        <span className="product-title">{rev.product}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleHelpful(rev.id)}
                        className={`card-helpful-btn ${isLiked ? "is-liked" : ""}`}
                        title="Was this review helpful?"
                        aria-label="Helpful"
                      >
                        <ThumbsUp size={12} fill={isLiked ? "#ec2226" : "none"} />
                        <span>{likes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Pagination Indicator Dots */}
        {maxIndex > 0 && (
          <div className="reviews-dots-row">
            {[...Array(maxIndex + 1)].map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => setCurrentIndex(dotIdx)}
                className={`reviews-dot-pill ${currentIndex === dotIdx ? "is-active" : ""}`}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Write a Review Modal */}
      {isModalOpen && (
        <div className="review-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="review-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="modal-close-btn"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {submitSuccess ? (
              <div className="review-modal-success">
                <div className="success-icon-wrap">
                  <CheckCircle2 size={42} color="#059669" />
                </div>
                <h3>Thank You for Your Feedback!</h3>
                <p>
                  Your review has been submitted to the Kinglet Furniture quality assurance team and will appear after quick verification.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="review-form">
                <div className="modal-header">
                  <div className="modal-badge">
                    <Sparkles size={13} color="#ec2226" />
                    <span>MIRPUR SHOWROOM FEEDBACK</span>
                  </div>
                  <h3>Share Your Showroom Experience</h3>
                  <p>
                    Help other discerning homeowners discover genuine Chittagong mahogany craftsmanship.
                  </p>
                </div>

                <div className="form-group">
                  <label>Overall Showroom Rating</label>
                  <div className="rating-select-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="star-pick-btn"
                      >
                        <Star
                          size={24}
                          fill={star <= newReview.rating ? "#f59e0b" : "none"}
                          color={star <= newReview.rating ? "#f59e0b" : "#cbd5e1"}
                        />
                      </button>
                    ))}
                    <span className="rating-label">{newReview.rating} out of 5 Stars</span>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="verified-review-name">Your Full Name *</label>
                    <input
                      id="verified-review-name"
                      name="name"
                      type="text"
                      required
                      placeholder="e.g. Dr. Salman Khan"
                      value={newReview.name}
                      onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="verified-review-location">Location (Area & City)</label>
                    <input
                      id="verified-review-location"
                      name="location"
                      type="text"
                      placeholder="e.g. Gulshan-2, Dhaka"
                      value={newReview.location}
                      onChange={(e) => setNewReview({ ...newReview, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="verified-review-product">Furniture / Suite Purchased</label>
                  <input
                    id="verified-review-product"
                    name="product"
                    type="text"
                    placeholder="e.g. Grain Craft Mahogany Bed or Luxury Velvet Sofa"
                    value={newReview.product}
                    onChange={(e) => setNewReview({ ...newReview, product: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="verified-review-comment">Your Review & Experience *</label>
                  <textarea
                    id="verified-review-comment"
                    name="comment"
                    required
                    rows={4}
                    placeholder="Share your thoughts on wood quality, finish, showroom guidance, delivery, or installation..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  />
                </div>

                <button type="submit" className="submit-review-btn">
                  <Send size={15} />
                  <span>Submit Verified Review</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
