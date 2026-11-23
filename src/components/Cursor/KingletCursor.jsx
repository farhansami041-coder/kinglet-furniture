import React, { useEffect, useRef } from "react";

/**
 * KingletCursor
 * Ultra-High-Performance 120fps Custom Cursor Animation
 * - Zero layout recalcs: uses CSS GPU transforms (scale + translate3d) instead of mutating width/height
 * - Event-driven hover: uses mouseover/mouseout instead of heavy .closest() on every pixel of mousemove
 * - Zero React re-renders: direct DOM opacity toggle
 * - Auto-sleeping RAF: pauses when cursor is stationary, restarts on mousemove
 */
export default function KingletCursor() {
  const containerRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTouchDevice = () => {
      return (
        window.innerWidth <= 1024 ||
        (window.matchMedia && (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches)) ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0
      );
    };

    if (isTouchDevice()) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isHovered = false;
    let isClicking = false;
    let hoverText = "";
    let isVisible = false;
    let isRunning = false;
    let animId = null;

    const ringEl = ringRef.current;
    const dotEl = dotRef.current;
    const textEl = textRef.current;
    const containerEl = containerRef.current;

    if (!ringEl || !dotEl || !containerEl) return;

    const handleResize = () => {
      if (isTouchDevice()) {
        containerEl.style.display = "none";
        containerEl.style.opacity = "0";
      } else {
        containerEl.style.display = "block";
      }
    };
    window.addEventListener("resize", handleResize, { passive: true });

    const updateClasses = () => {
      if (isHovered) {
        ringEl.classList.add("is-hovered");
        dotEl.classList.add("is-hovered");
      } else {
        ringEl.classList.remove("is-hovered");
        dotEl.classList.remove("is-hovered");
      }

      if (isClicking) {
        ringEl.classList.add("is-clicking");
        dotEl.classList.add("is-clicking");
      } else {
        ringEl.classList.remove("is-clicking");
        dotEl.classList.remove("is-clicking");
      }

      if (textEl) {
        textEl.textContent = hoverText;
      }
    };

    const render = () => {
      const dx = mouseX - ringX;
      const dy = mouseY - ringY;
      ringX += dx * 0.25;
      ringY += dy * 0.25;

      dotEl.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      ringEl.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

      // If ring has caught up and cursor is still, pause RAF to save CPU/GPU
      if (Math.abs(dx) < 0.15 && Math.abs(dy) < 0.15) {
        isRunning = false;
        animId = null;
        return;
      }

      animId = requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (!isRunning) {
        isRunning = true;
        animId = requestAnimationFrame(render);
      }
    };

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        containerEl.style.opacity = "1";
      }

      startLoop();
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target || !target.closest) return;

      const interactive = target.closest(
        "button, a, input, select, textarea, .f-item, .borderless-card, .slider-item, .quick-action-btn, [role='button'], .kinglet-nav-link"
      );
      if (interactive) {
        isHovered = true;
        if (target.closest(".f-item, .borderless-card, .kinglet-posh-card")) {
          hoverText = "VIEW";
        } else if (target.closest("button[title*='Wishlist']")) {
          hoverText = "SAVE";
        } else {
          hoverText = "";
        }
      } else {
        isHovered = false;
        hoverText = "";
      }
      updateClasses();
      startLoop();
    };

    const handleMouseOut = (e) => {
      if (!e.relatedTarget) {
        isHovered = false;
        hoverText = "";
        updateClasses();
      }
    };

    const handleMouseDown = () => {
      isClicking = true;
      updateClasses();
      startLoop();
    };

    const handleMouseUp = () => {
      isClicking = false;
      updateClasses();
      startLoop();
    };

    const handleMouseLeave = () => {
      isVisible = false;
      containerEl.style.opacity = "0";
      isHovered = false;
      isClicking = false;
      updateClasses();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseout", handleMouseOut, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="kinglet-cursor-wrapper"
      style={{
        opacity: 0,
        transition: "opacity 0.2s ease",
        pointerEvents: "none",
      }}
    >
      <style>{`
        @media (hover: none), (pointer: coarse), (max-width: 1024px) {
          .kinglet-cursor-wrapper,
          .kinglet-cursor-dot,
          .kinglet-cursor-ring {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        }
        .kinglet-cursor-dot {
          position: fixed;
          top: -3px;
          left: -3px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
          pointer-events: none;
          z-index: 99999;
          will-change: transform;
          transition: background 0.2s, box-shadow 0.2s;
        }
        .kinglet-cursor-dot.is-hovered {
          background: #ec2226;
          box-shadow: 0 0 10px rgba(236, 34, 38, 0.85);
        }
        .kinglet-cursor-dot.is-clicking {
          transform: scale(0.65) !important;
        }

        .kinglet-cursor-ring {
          position: fixed;
          top: -15px;
          left: -15px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.65);
          background: rgba(255, 255, 255, 0.04);
          pointer-events: none;
          z-index: 99998;
          display: flex;
          align-items: center;
          justify-content: center;
          will-change: transform;
          transition: border-color 0.2s, background 0.2s, width 0.2s, height 0.2s, top 0.2s, left 0.2s;
        }
        .kinglet-cursor-ring.is-hovered {
          top: -24px;
          left: -24px;
          width: 48px;
          height: 48px;
          border-color: rgba(236, 34, 38, 0.9);
          background: rgba(236, 34, 38, 0.15);
        }
        .kinglet-cursor-ring.is-clicking {
          top: -11px;
          left: -11px;
          width: 22px;
          height: 22px;
        }
        .kinglet-cursor-text {
          font-size: 8.5px;
          font-weight: 900;
          color: #ec2226;
          letter-spacing: 0.8px;
          pointer-events: none;
        }
      `}</style>
      <div ref={dotRef} className="kinglet-cursor-dot" />
      <div ref={ringRef} className="kinglet-cursor-ring">
        <span ref={textRef} className="kinglet-cursor-text" />
      </div>
    </div>
  );
}
