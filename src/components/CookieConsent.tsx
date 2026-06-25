"use client";

import { useState, useEffect } from "react";

const COOKIE_CONSENT_KEY = "ai-study-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-divider shadow-2xl">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm text-muted flex-1">
          We use essential cookies for authentication and session management. By continuing to use AI Study, you agree to our{" "}
          <a href="/privacy" className="text-foreground underline underline-offset-2">Privacy Policy</a>.
        </p>
        <button
          onClick={accept}
          className="shrink-0 px-6 py-2 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all"
        >
          Accept
        </button>
      </div>
    </div>
  );
}