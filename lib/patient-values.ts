import { z } from "zod";
import { getAddressRecord } from "./thai-address";

export const genderValues = ["male", "female", "other", "prefer-not-to-say"] as const;
export const preferredLanguageValues = ["th", "en", "zh", "ja", "other"] as const;

export type GenderValue = (typeof genderValues)[number];
export type PreferredLanguageValue = (typeof preferredLanguageValues)[number];

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

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!/^\+?[\d\s-]+$/.test(trimmed)) return "";
  const normalized = trimmed.replace(/[\s-]/g, "");
  if (/^0\d{9}$/.test(normalized)) return normalized;
  if (/^\+66\d{9}$/.test(normalized)) return normalized;
  return "";
}

export function formatStructuredAddress(address?: StructuredAddress) {
  return address
    ? `${address.addressLine}, ${address.subdistrictTh}, ${address.districtTh}, ${address.provinceTh} ${address.postalCode}`
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
  phone: phoneSchema,
  email: z.string().trim().email(),
  address: z.string().trim().min(1),
  structuredAddress: structuredAddressSchema,
  preferredLanguage: z.enum(preferredLanguageValues),
  nationality: z.string().trim().min(1),
  religion: optionalText,
  emergencyName: optionalText,
  emergencyPhone: optionalPhoneSchema,
  emergencyRelationship: optionalText
};

export const serverPatientDataSchema = z.object(serverPatientDataFields).strict()
  .superRefine((data, ctx) => {
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
    phone: editablePhoneSchema.optional(),
    email: editableEmailSchema.optional(),
    address: editableTextSchema.optional(),
    structuredAddress: editableStructuredAddressSchema.optional(),
    preferredLanguage: z.enum(preferredLanguageValues).or(z.literal("")).optional(),
    nationality: editableTextSchema.optional(),
    religion: editableTextSchema.optional(),
    emergencyName: editableTextSchema.optional(),
    emergencyPhone: editablePhoneSchema.optional(),
    emergencyRelationship: editableTextSchema.optional()
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.address && data.structuredAddress && data.address !== formatStructuredAddress(data.structuredAddress)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["address"], message: "Address does not match structured address" });
    }
  });
