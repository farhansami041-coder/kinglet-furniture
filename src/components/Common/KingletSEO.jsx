import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Universal Technical SEO & Metadata Manager for Kinglet Bangladesh Ltd
 * Dynamically synchronizes document title, canonical link, OpenGraph, Twitter Cards,
 * Robots directives, and rich structured data (JSON-LD) with visible page state.
 */
export default function KingletSEO({
  title = "Leading Furniture Brand in Bangladesh | Kinglet Bangladesh Ltd",
  description = "Kinglet Bangladesh Ltd is the premier luxury furniture manufacturer in Bangladesh. Handcrafted beds, sofas, dining tables, almirahs & 3D turnkey interiors made from seasoned Mahogany, Black Plum Wood, Engineering Processed Wood, Canadian Oak Veneer, and German Oak Veneer with 10-year timber warranty.",
  keywords = "Kinglet, Kinglet Bangladesh, Kinglet Furniture, Mahogany Furniture BD, Black Plum Wood Furniture, Canadian Oak Veneer, German Oak Veneer, Processed Wood Furniture, Luxury Sofa Set, Dining Table, Furniture Showroom Dhaka, Best Furniture Store Bangladesh",
  canonicalUrl,
  ogImage = "/images/kinglet-winter-banner-4k.jpg",
  ogTitle = null,
  ogDescription = null,
  ogType = "website",
  schemaJson = null,
  noindex = false,
  nofollow = false,
}) {
  const location = useLocation();

  // Normalize canonical URL: strip any trailing hash or query string params for canonical indexing
  const currentPath = location.pathname.startsWith("/") ? location.pathname : `/${location.pathname}`;
  const cleanPath = currentPath === "/" ? "" : currentPath.replace(/\/+$/, "");
  const currentCanonical = canonicalUrl || `https://www.kingletbd.com${cleanPath}`;

  useEffect(() => {
    // 1. Dynamic Page Title
    const formattedTitle = title.includes("Kinglet")
      ? title
      : `${title} | Kinglet Bangladesh Ltd`;
    document.title = formattedTitle;

    // Helper to safely update or insert meta tags
    const setMetaTag = (selector, attribute, value) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        if (selector.includes("property=")) {
          const propVal = selector.match(/property=["'](.*?)["']/)?.[1] || "";
          element.setAttribute("property", propVal);
        } else if (selector.includes("name=")) {
          const nameVal = selector.match(/name=["'](.*?)["']/)?.[1] || "";
          element.setAttribute("name", nameVal);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    // 2. Robots Directives
    let robotsContent = "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";
    if (noindex) {
      robotsContent = nofollow ? "noindex, nofollow" : "noindex, follow";
    }
    setMetaTag('meta[name="robots"]', "content", robotsContent);

    // 3. Standard SEO Metadata
    setMetaTag('meta[name="description"]', "content", description);
    setMetaTag('meta[name="keywords"]', "content", keywords);
    setMetaTag('meta[name="author"]', "content", "Kinglet Bangladesh Ltd");

    // 4. OpenGraph Tags (Facebook / WhatsApp / LinkedIn / Slack)
    const activeOgTitle = ogTitle || formattedTitle;
    const activeOgDesc = ogDescription || description;
    setMetaTag('meta[property="og:title"]', "content", activeOgTitle);
    setMetaTag('meta[property="og:description"]', "content", activeOgDesc);
    setMetaTag('meta[property="og:image"]', "content", ogImage);
    setMetaTag('meta[property="og:url"]', "content", currentCanonical);
    setMetaTag('meta[property="og:type"]', "content", ogType);
    setMetaTag('meta[property="og:site_name"]', "content", "Kinglet Bangladesh Ltd");
    setMetaTag('meta[property="og:locale"]', "content", "en_US");

    // 5. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', "content", "summary_large_image");
    setMetaTag('meta[name="twitter:title"]', "content", activeOgTitle);
    setMetaTag('meta[name="twitter:description"]', "content", activeOgDesc);
    setMetaTag('meta[name="twitter:image"]', "content", ogImage);

    // 6. Canonical Link Tag
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute("href", currentCanonical);

    // 7. Dynamic JSON-LD Schema injection
    let scriptTag = document.getElementById("kinglet-dynamic-schema");
    if (schemaJson) {
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.id = "kinglet-dynamic-schema";
        scriptTag.type = "application/ld+json";
        document.head.appendChild(scriptTag);
      }
      scriptTag.text = JSON.stringify(schemaJson);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [title, description, keywords, currentCanonical, ogImage, ogTitle, ogDescription, ogType, schemaJson, noindex, nofollow]);

  return null;
}
