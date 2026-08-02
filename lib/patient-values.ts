import { z } from "zod";
import type { Locale } from "../i18n/locale";
import { getAddressRecord } from "./thai-address";

export const genderValues = ["male", "female", "other", "prefer-not-to-say"] as const;
export const preferredLanguageValues = ["th", "en", "zh", "ja", "other"] as const;
export const phoneCountryCodes = ["+66", "+1", "+86", "+81", "+82", "+65", "+60"] as const;

export type GenderValue = (typeof genderValues)[number];
export type PreferredLanguageValue = (typeof preferredLanguageValues)[number];
export type PhoneCountryCode = (typeof phoneCountryCodes)[number];

export function normalizeGender(value?: string) {
  const legacy: Record<string, GenderValue> = {
    Male: "male",
    Female: "female",
    Other: "other",
    "Prefer not to say": "prefer-not-to-say"
  };
  return value && (genderValues as readonly string[]).includes(value) ? (value as GenderValue) : legacy[value || ""] || "";
}

export function normalizePreferredLanguage(value?: string) {
  const legacy: Record<string, PreferredLanguageValue> = {
    Thai: "th",
    English: "en",
    Chinese: "zh",
    Japanese: "ja",
    Other: "other"
  };
  return value && (preferredLanguageValues as readonly string[]).includes(value) ? (value as PreferredLanguageValue) : legacy[value || ""] || "";
}

export type StructuredAddress = {
  addressLine: string;
  provinceCode: string;
  provinceTh: string;
  provinceEn?: string;
  districtCode: string;
  districtTh: string;
  districtEn?: string;
  subdistrictCode: string;
  subdistrictTh: string;
  subdistrictEn?: string;
  postalCode: string;
};

export const phoneCountryOptions = [
  { value: "+66", label: "Thailand (+66)" },
  { value: "+1", label: "USA / Canada (+1)" },
  { value: "+86", label: "China (+86)" },
  { value: "+81", label: "Japan (+81)" },
  { value: "+82", label: "Korea (+82)" },
  { value: "+65", label: "Singapore (+65)" },
  { value: "+60", label: "Malaysia (+60)" }
] as const;

const nationalPhonePatterns: Record<PhoneCountryCode, RegExp> = {
  "+66": /^\d{9}$/,
  "+1": /^\d{10}$/,
  "+86": /^\d{11}$/,
  "+81": /^\d{10}$/,
  "+82": /^\d{9,10}$/,
  "+65": /^\d{8}$/,
  "+60": /^\d{9,10}$/
};

export function normalizeInternationalPhone(countryCode: string, nationalNumber: string) {
  if (!(phoneCountryCodes as readonly string[]).includes(countryCode)) return "";
  const code = countryCode as PhoneCountryCode;
  const raw = nationalNumber.trim();
  if (!raw || raw.includes("+") || !/^[\d\s-]+$/.test(raw)) return "";
  let national = raw.replace(/[\s-]/g, "");
  if (national.startsWith(code.slice(1))) return "";
  if (code === "+66" && national.startsWith("0")) national = national.slice(1);
  return nationalPhonePatterns[code].test(national) ? `${code}${national}` : "";
}

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) {
    const normalized = trimmed.replace(/[\s-]/g, "");
    const countryCode = phoneCountryCodes.find((code) => normalized.startsWith(code));
    return countryCode ? normalizeInternationalPhone(countryCode, normalized.slice(countryCode.length)) : "";
  }
  return normalizeInternationalPhone("+66", trimmed);
}

export function splitPhone(value?: string) {
  const phone = normalizePhone(value || "");
  const countryCode: PhoneCountryCode = phoneCountryCodes.find((code) => phone.startsWith(code)) || "+66";
  return { countryCode, nationalNumber: phone ? phone.slice(countryCode.length) : "" };
}

export function formatPhoneDisplay(value?: string) {
  const phone = normalizePhone(value || "");
  if (!phone) return "";
  const countryCode = phoneCountryCodes.find((code) => phone.startsWith(code));
  if (!countryCode) return phone;
  const national = phone.slice(countryCode.length);
  if (countryCode === "+66" && national.length === 9) return `${countryCode} ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
  if (countryCode === "+1" && national.length === 10) return `${countryCode} ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
  return `${countryCode} ${national.replace(/(\d{3})(?=\d)/g, "$1 ").trim()}`;
}

export function formatStructuredAddress(address?: StructuredAddress, locale: Locale = "th") {
  const subdistrict = locale === "en" && address?.subdistrictEn ? address.subdistrictEn : address?.subdistrictTh;
  const district = locale === "en" && address?.districtEn ? address.districtEn : address?.districtTh;
  const province = locale === "en" && address?.provinceEn ? address.provinceEn : address?.provinceTh;
  return address
    ? `${address.addressLine}, ${subdistrict}, ${district}, ${province} ${address.postalCode}`
    : "";
}

export function makeStructuredAddress(addressLine: string, subdistrictCode: string, postalCode?: string): StructuredAddress | null {
  const record = getAddressRecord(subdistrictCode);
  if (!record) return null;
  const nextPostalCode = (postalCode || record.postalCode).trim();
  if (nextPostalCode !== record.postalCode) return null;
  return {
    addressLine: addressLine.trim(),
    provinceCode: record.provinceCode,
    provinceTh: record.provinceTh,
    provinceEn: record.provinceEn,
    districtCode: record.districtCode,
    districtTh: record.districtTh,
    districtEn: record.districtEn,
    subdistrictCode: record.subdistrictCode,
    subdistrictTh: record.subdistrictTh,
    subdistrictEn: record.subdistrictEn,
    postalCode: record.postalCode
  };
}

export function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

const optionalText = z.string().trim().optional();
const phoneSchema = z.string().trim().transform(normalizePhone).pipe(z.string().min(1));
const optionalPhoneSchema = z.string().trim().superRefine((value, ctx) => {
  if (value && !normalizePhone(value)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid phone" });
}).transform((value) => (value ? normalizePhone(value) : ""));

export const structuredAddressSchema = z
  .object({
    addressLine: z.string().trim().min(1),
    provinceCode: z.string().trim().min(1),
    provinceTh: z.string().trim().min(1),
    provinceEn: optionalText,
    districtCode: z.string().trim().min(1),
    districtTh: z.string().trim().min(1),
    districtEn: optionalText,
    subdistrictCode: z.string().trim().min(1),
    subdistrictTh: z.string().trim().min(1),
    subdistrictEn: optionalText,
    postalCode: z.string().trim().regex(/^\d{5}$/)
  })
  .superRefine((address, ctx) => {
    const record = getAddressRecord(address.subdistrictCode);
    if (
      !record ||
      record.provinceCode !== address.provinceCode ||
      record.districtCode !== address.districtCode ||
      record.postalCode !== address.postalCode
    ) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["subdistrictCode"], message: "Invalid address" });
    }
  });

const dateOfBirthSchema = z.string().trim().superRefine((value, ctx) => {
  const date = parseDateOnly(value);
  if (!date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date" });
    return;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date cannot be in the future" });
});

const serverPatientDataFields = {
  firstName: z.string().trim(),
  middleName: optionalText,
  lastName: z.string().trim(),
  dateOfBirth: dateOfBirthSchema,
  gender: z.enum(genderValues),
  phoneCountryCode: z.enum(phoneCountryCodes),
  phoneNationalNumber: z.string().trim(),
  phone: phoneSchema,
  email: z.string().trim().email(),
  address: z.string().trim().min(1),
  structuredAddress: structuredAddressSchema,
  preferredLanguage: z.enum(preferredLanguageValues),
  nationality: z.string().trim().min(1),
  religion: optionalText,
  emergencyName: optionalText,
  emergencyPhoneCountryCode: z.enum(phoneCountryCodes).optional(),
  emergencyPhoneNationalNumber: optionalText,
  emergencyPhone: optionalPhoneSchema,
  emergencyRelationship: optionalText
};

export const serverPatientDataSchema = z.object(serverPatientDataFields).strict()
  .superRefine((data, ctx) => {
    if (data.phone !== normalizeInternationalPhone(data.phoneCountryCode, data.phoneNationalNumber)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Phone does not match country code" });
    }
    if (data.emergencyPhone && data.emergencyPhone !== normalizeInternationalPhone(data.emergencyPhoneCountryCode || "+66", data.emergencyPhoneNationalNumber || "")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["emergencyPhone"], message: "Emergency phone does not match country code" });
    }
    if (data.address !== formatStructuredAddress(data.structuredAddress)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["address"], message: "Address does not match structured address" });
    }
  });

export const partialPatientDataSchema = z.object(serverPatientDataFields).partial().strict();

const editableTextSchema = z.string().trim();
const editablePhoneSchema = z.string().trim().superRefine((value, ctx) => {
  if (value && !normalizePhone(value)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid phone" });
}).transform((value) => (value ? normalizePhone(value) : ""));
const editableEmailSchema = z.string().trim().superRefine((value, ctx) => {
  if (value && !z.string().email().safeParse(value).success) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid email" });
});
const editableDateOfBirthSchema = z.string().trim().superRefine((value, ctx) => {
  if (!value) return;
  const date = parseDateOnly(value);
  if (!date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date" });
    return;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date cannot be in the future" });
});
const editableStructuredAddressSchema = structuredAddressSchema.or(
  z.object({
    addressLine: z.literal(""),
    provinceCode: z.literal(""),
    provinceTh: z.literal(""),
    provinceEn: z.literal("").optional(),
    districtCode: z.literal(""),
    districtTh: z.literal(""),
    districtEn: z.literal("").optional(),
    subdistrictCode: z.literal(""),
    subdistrictTh: z.literal(""),
    subdistrictEn: z.literal("").optional(),
    postalCode: z.literal("")
  })
);

export const patientUpdateSchema = z
  .object({
    firstName: editableTextSchema.optional(),
    middleName: editableTextSchema.optional(),
    lastName: editableTextSchema.optional(),
    dateOfBirth: editableDateOfBirthSchema.optional(),
    gender: z.enum(genderValues).or(z.literal("")).optional(),
    phoneCountryCode: z.enum(phoneCountryCodes).optional(),
    phoneNationalNumber: editableTextSchema.optional(),
    phone: editablePhoneSchema.optional(),
    email: editableEmailSchema.optional(),
    address: editableTextSchema.optional(),
    structuredAddress: editableStructuredAddressSchema.optional(),
    preferredLanguage: z.enum(preferredLanguageValues).or(z.literal("")).optional(),
    nationality: editableTextSchema.optional(),
    religion: editableTextSchema.optional(),
    emergencyName: editableTextSchema.optional(),
    emergencyPhoneCountryCode: z.enum(phoneCountryCodes).optional(),
    emergencyPhoneNationalNumber: editableTextSchema.optional(),
    emergencyPhone: editablePhoneSchema.optional(),
    emergencyRelationship: editableTextSchema.optional()
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.phone && data.phoneCountryCode && data.phoneNationalNumber && data.phone !== normalizeInternationalPhone(data.phoneCountryCode, data.phoneNationalNumber)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Phone does not match country code" });
    }
    if (
      data.emergencyPhone &&
      data.emergencyPhoneCountryCode &&
      data.emergencyPhoneNationalNumber &&
      data.emergencyPhone !== normalizeInternationalPhone(data.emergencyPhoneCountryCode, data.emergencyPhoneNationalNumber)
    ) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["emergencyPhone"], message: "Emergency phone does not match country code" });
    }
    if (data.address && data.structuredAddress && data.address !== formatStructuredAddress(data.structuredAddress)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["address"], message: "Address does not match structured address" });
    }
  });
