"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import en from "./locales/en";
import zh from "./locales/zh";
import type { TranslationKeys } from "./locales/en";

export type SupportedLocale = "en" | "zh";

const LOCALE_STORAGE_KEY = "ai-study-locale";

const translations: Record<SupportedLocale, TranslationKeys> = { en, zh };

function detectBrowserLanguage(): SupportedLocale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.toLowerCase() || "";
  if (lang.startsWith("zh")) return "zh";
  return "en";
}

function loadSavedLocale(): SupportedLocale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === "en" || saved === "zh") return saved;
  } catch {}
  return detectBrowserLanguage();
}

function resolveNestedKey(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}

interface I18nContextValue {
  locale: SupportedLocale;
  t: (path: string, vars?: Record<string, string | number>) => string;
  setLocale: (locale: SupportedLocale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  t: () => "",
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(loadSavedLocale());
    setReady(true);
  }, []);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {}
    document.documentElement.lang = newLocale === "zh" ? "zh-CN" : "en";
  }, []);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>): string => {
      const dict = translations[locale];
      const value = resolveNestedKey(dict as unknown as Record<string, unknown>, path);
      if (typeof value === "string") return interpolate(value, vars);
      if (typeof value === "object" && value !== null) {
        console.warn(`[i18n] Path "${path}" resolves to an object, not a string in locale "${locale}". Use t() for nested access.`);
      }
      const fallbackDict = translations.en;
      const fallbackValue = resolveNestedKey(fallbackDict as unknown as Record<string, unknown>, path);
      if (typeof fallbackValue === "string") return interpolate(fallbackValue, vars);
      return path;
    },
    [locale]
  );

  if (!ready) {
    return <div className="h-full bg-background">{children as React.ReactElement}</div>;
  }

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: "English",
  zh: "中文",
};

export { loadSavedLocale, LOCALE_STORAGE_KEY };