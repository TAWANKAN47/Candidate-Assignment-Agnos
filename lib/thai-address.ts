import type { Locale } from "@/i18n/locale";
import thaiAddresses from "@/data/thai-addresses.json";

export interface ThaiAddressRecord {
  provinceCode: string;
  provinceTh: string;
  provinceEn: string;
  districtCode: string;
  districtTh: string;
  districtEn: string;
  subdistrictCode: string;
  subdistrictTh: string;
  subdistrictEn: string;
  postalCode: string;
}

export type ThaiAddressOption = { value: string; label: string };

const records = thaiAddresses as ThaiAddressRecord[];

function uniqueOptions(
  rows: ThaiAddressRecord[],
  valueKey: keyof ThaiAddressRecord,
  thKey: keyof ThaiAddressRecord,
  enKey: keyof ThaiAddressRecord,
  locale: Locale
) {
  const seen = new Map<string, string>();
  for (const row of rows) {
    seen.set(row[valueKey], locale === "th" ? row[thKey] : row[enKey]);
  }
  return [...seen.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, locale === "th" ? "th" : "en"));
}

export function getProvinceOptions(locale: Locale) {
  return uniqueOptions(records, "provinceCode", "provinceTh", "provinceEn", locale);
}

export function getDistrictOptions(provinceCode: string, locale: Locale) {
  return uniqueOptions(
    records.filter((row) => row.provinceCode === provinceCode),
    "districtCode",
    "districtTh",
    "districtEn",
    locale
  );
}

export function getSubdistrictOptions(districtCode: string, locale: Locale) {
  return uniqueOptions(
    records.filter((row) => row.districtCode === districtCode),
    "subdistrictCode",
    "subdistrictTh",
    "subdistrictEn",
    locale
  );
}

export function getAddressRecord(subdistrictCode: string) {
  return records.find((row) => row.subdistrictCode === subdistrictCode);
}

