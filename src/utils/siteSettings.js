import { useState, useEffect } from "react";
import { BRAND_INFO } from "../data/kingletData";

/**
 * Get contact settings synchronously from cached localStorage or default BRAND_INFO
 */
export function getContactSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("kinglet_site_settings") || "{}");
    const phone = (saved.primary_phone || saved.footer_phone || BRAND_INFO.hotlinePrimary || "+880 1898-878815").trim();
    const whatsapp = (saved.whatsapp_number || BRAND_INFO.whatsapp || "+880 1898-878815").trim();
    const cleanWhatsapp = whatsapp.replace(/\D/g, "");

    return {
      phone,
      whatsapp,
      cleanWhatsapp,
      phoneCallUrl: `tel:${phone.replace(/\s+/g, "")}`,
      whatsappUrl: `https://wa.me/${cleanWhatsapp}`,
    };
  } catch {
    const defaultPhone = BRAND_INFO.hotlinePrimary || "+880 1898-878815";
    const defaultWhatsapp = BRAND_INFO.whatsapp || "+880 1898-878815";
    const cleanWhatsapp = defaultWhatsapp.replace(/\D/g, "");
    return {
      phone: defaultPhone,
      whatsapp: defaultWhatsapp,
      cleanWhatsapp,
      phoneCallUrl: `tel:${defaultPhone.replace(/\s+/g, "")}`,
      whatsappUrl: `https://wa.me/${cleanWhatsapp}`,
    };
  }
}

/**
 * React hook for live contact settings (WhatsApp + Call Phone) with real-time sync across admin updates
 */
export function useContactSettings() {
  const [settings, setSettings] = useState(getContactSettings);

  useEffect(() => {
    let isMounted = true;

    const applyData = (data) => {
      if (!data) return;
      const phone = (data.primary_phone || data.footer_phone || BRAND_INFO.hotlinePrimary || "+880 1898-878815").trim();
      const whatsapp = (data.whatsapp_number || BRAND_INFO.whatsapp || "+880 1898-878815").trim();
      const cleanWhatsapp = whatsapp.replace(/\D/g, "");

      if (isMounted) {
        setSettings({
          phone,
          whatsapp,
          cleanWhatsapp,
          phoneCallUrl: `tel:${phone.replace(/\s+/g, "")}`,
          whatsappUrl: `https://wa.me/${cleanWhatsapp}`,
        });
      }
    };

    // 1. Listen for real-time updates from Admin saves or other tabs
    const handleSettingsUpdate = (e) => {
      if (e?.detail) applyData(e.detail);
    };

    const handleStorageChange = (e) => {
      if (e.key === "kinglet_site_settings" && e.newValue) {
        try {
          applyData(JSON.parse(e.newValue));
        } catch {
          // ignore parse errors
        }
      }
    };

    window.addEventListener("kinglet_settings_updated", handleSettingsUpdate);
    window.addEventListener("storage", handleStorageChange);

    // 2. Fetch fresh contact settings from backend API
    fetch("/api/v1/cms/contact")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && json.data) {
          applyData(json.data);
          try {
            const existing = JSON.parse(localStorage.getItem("kinglet_site_settings") || "{}");
            localStorage.setItem(
              "kinglet_site_settings",
              JSON.stringify({ ...existing, ...json.data })
            );
          } catch {
            // ignore
          }
        }
      })
      .catch(() => null);

    return () => {
      isMounted = false;
      window.removeEventListener("kinglet_settings_updated", handleSettingsUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return settings;
}

/**
 * Broadcast updated settings to all components and across browser windows
 */
export function broadcastSettingsUpdate(updatedSettings) {
  try {
    const existing = JSON.parse(localStorage.getItem("kinglet_site_settings") || "{}");
    const merged = { ...existing, ...updatedSettings };
    localStorage.setItem("kinglet_site_settings", JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent("kinglet_settings_updated", { detail: merged }));
  } catch (err) {
    console.error("Failed to broadcast settings update:", err);
  }
}
