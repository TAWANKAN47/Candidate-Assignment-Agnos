"use client";

import { useEffect, useState } from "react";
import { defaultLocale, isLocale, localeStorageKey, type Locale } from "@/i18n/locale";

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const saved = localStorage.getItem(localeStorageKey);
    if (isLocale(saved)) setLocaleState(saved);
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    localStorage.setItem(localeStorageKey, next);
  }

  return { locale, setLocale };
}
