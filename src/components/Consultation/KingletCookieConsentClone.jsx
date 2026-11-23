import React, { useState, useEffect } from "react";

export default function KingletCookieConsentClone() {
  const [accepted, setAccepted] = useState(() => {
    try {
      return localStorage.getItem("kinglet_cookie_consent") === "true";
    } catch {
      return false;
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kinglet_site_settings") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e?.detail) setSettings(e.detail);
    };
    window.addEventListener("kinglet_settings_updated", handleUpdate);
    return () => window.removeEventListener("kinglet_settings_updated", handleUpdate);
  }, []);

  if (accepted || settings.cookies_alert_enabled === "false") return null;

  const handleAccept = () => {
    try {
      localStorage.setItem("kinglet_cookie_consent", "true");
    } catch {}
    setAccepted(true);
  };

  return (
    <div className="cookie-consent-bar" style={{ zIndex: 9998 }}>
      <div>
        🍪 {settings.cookies_alert_message || "Your experience on this site will be improved by allowing cookies. We respect customer privacy and never sell browsing data."}
      </div>
      <button className="cookie-consent-btn" onClick={handleAccept}>
        {settings.cookies_alert_button_text || "Allow Cookies"}
      </button>
    </div>
  );
}
