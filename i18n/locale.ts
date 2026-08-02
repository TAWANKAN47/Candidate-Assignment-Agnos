export type Locale = "th" | "en";

export const defaultLocale: Locale = "th";
export const localeStorageKey = "agnos-locale";

export function isLocale(value: string | null): value is Locale {
  return value === "th" || value === "en";
}
