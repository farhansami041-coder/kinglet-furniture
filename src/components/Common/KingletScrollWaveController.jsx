import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * KingletScrollWaveController
 * Ultra-Smooth 60fps Bidirectional Scroll Wave Float System
 * - Scroll Down: Elements slowly and smoothly float UP like a calm cascading wave.
 * - Scroll Up: Elements exiting below the viewport gracefully reverse and recede.
 * - Zero Lag / Stutter: Pure GPU translate3d + opacity (100% compositor thread).
 */
export default function KingletScrollWaveController() {
  const location = useLocation();

  useEffect(() => {
    // Elements to animate in the scroll wave
    const SELECTORS = [
      ".scroll-reveal",
      ".wave-reveal",
      ".kinglet-posh-card",
      ".borderless-card",
      ".f-item",
      ".kinglet-accordion-item",
      ".kinglet-section-header",
      ".kinglet-posh-4x4-grid > *",
      ".category-products-grid > *",
      ".kinglet-showcase-grid-full > *",
      ".kinglet-features-strip-grid > *",
      "main section > .container > div[style*='grid'] > *",
    ].join(", ");

    const isExcluded = (el) => {
      if (!el) return true;
      if (el.closest(".kinglet-apple-header")) return true;
      if (el.closest(".kinglet-hero-slider")) return true;
      if (el.closest(".header-glass-backdrop")) return true;
      if (el.closest(".custom-cursor-dot") || el.closest(".custom-cursor-ring")) return true;
      if (el.closest(".modal-backdrop") || el.closest("[role='dialog']")) return true;
      return false;
    };

    const observedElements = new Set();

    // 1. Assign rhythmic cascading wave delays to cards in grids
    const setupWaveDelays = () => {
      const grids = document.querySelectorAll(
        ".kinglet-posh-4x4-grid, .category-products-grid, .kinglet-showcase-grid-full, .kinglet-features-strip-grid, main .container > div[style*='grid']"
      );

      grids.forEach((grid) => {
        const children = Array.from(grid.children);
        children.forEach((child, idx) => {
          if (!isExcluded(child)) {
            // Calm, luxurious ripple: 0.05s to 0.26s cascading delays
            const delay = ((idx % 4) * 0.07 + 0.03).toFixed(2);
            child.style.setProperty("--wave-delay", `${delay}s`);
            child.classList.add("wave-reveal");
          }
        });
      });
    };

    // 2. Bidirectional Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;

        entries.forEach((entry) => {
          const el = entry.target;
          if (isExcluded(el)) return;

          const rect = entry.boundingClientRect;

          if (entry.isIntersecting) {
            // Floating smoothly into place like a wave
            el.classList.add("is-wave-visible");
            el.classList.add("is-visible");
            el.classList.remove("is-wave-below");
          } else {
            // Only reverse elements that exit out through the BOTTOM (when user scrolls UP)
            if (rect.top >= windowHeight - 15) {
              el.classList.remove("is-wave-visible");
              el.classList.remove("is-visible");
              el.classList.add("is-wave-below");
            }
          }
        });
      },
      {
        threshold: 0,
        rootMargin: "30px 0px -20px 0px",
      }
    );

    // 3. Scan and observe all matching elements
    const scanAndObserve = () => {
      setupWaveDelays();

      const elements = document.querySelectorAll(SELECTORS);
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      elements.forEach((el) => {
        if (isExcluded(el) || observedElements.has(el)) return;

        observedElements.add(el);
        el.classList.add("wave-reveal");

        const rect = el.getBoundingClientRect();
        // Immediately reveal elements already inside or above viewport
        if (rect.top < windowHeight - 30) {
          el.classList.add("is-wave-visible");
          el.classList.add("is-visible");
          el.classList.remove("is-wave-below");
        } else {
          el.classList.add("is-wave-below");
        }

        observer.observe(el);
      });
    };

    // Run initial scan
    scanAndObserve();

    // Re-scan when new DOM nodes are added (e.g., category tabs clicked)
    let debounceTimer = null;
    const mutationObserver = new MutationObserver((mutations) => {
      const hasAddedNodes = mutations.some((m) => m.addedNodes.length > 0);
      if (!hasAddedNodes) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        scanAndObserve();
      }, 80);
    });

    const mainElement = document.querySelector("main") || document.body;
    mutationObserver.observe(mainElement, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(debounceTimer);
      observer.disconnect();
      mutationObserver.disconnect();
      observedElements.clear();
    };
  }, [location.pathname, location.search]);

  return null;
}

