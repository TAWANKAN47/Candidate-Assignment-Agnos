"use client";

import type { Locale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  locale,
  label = "Language",
  onChange
}: {
  locale: Locale;
  label?: string;
  onChange: (locale: Locale) => void;
}) {
  return (
    <div className="inline-flex rounded-full border bg-white p-1" aria-label={label}>
      {(["th", "en"] as const).map((item) => (
        <button
          key={item}
          type="button"
          className={cn(
            "h-8 min-w-11 rounded-full px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600",
            locale === item ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          )}
          aria-pressed={locale === item}
          onClick={() => onChange(item)}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
