import { z } from "zod";
import type { Locale } from "@/i18n/locale";
import { translations } from "@/i18n/translations";
import {
  formatStructuredAddress,
  genderValues,
  normalizeInternationalPhone,
  normalizePhone,
  parseDateOnly,
  phoneCountryCodes,
  preferredLanguageValues,
  structuredAddressSchema
} from "./patient-values";

function message(locale: Locale, key: keyof typeof translations.en.validation, field?: string) {
  return translations[locale].validation[key].replace("{field}", field || "");
}

export function createPatientSchema(locale: Locale) {
  const required = (field: keyof typeof translations.en.fields) => {
    const text = message(locale, "required", translations[locale].fields[field]);
    return z.string({ required_error: text }).trim().min(1, text);
  };
  const phoneCountryCode = z.enum(phoneCountryCodes);
  const phoneNationalNumber = required("phone");
  const dateOfBirth = required("dateOfBirth").superRefine((value, ctx) => {
    const date = parseDateOnly(value);
    if (!date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: message(locale, "dateOfBirth") });
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) ctx.addIssue({ code: z.ZodIssueCode.custom, message: message(locale, "dateOfBirth") });
  });
  const addressMessage = message(locale, "address");
  const localizedAddressSchema = structuredAddressSchema.refine((address) => !!address.addressLine.trim(), {
    path: ["addressLine"],
    message: addressMessage
  });

  return z.object({
    firstName: required("firstName"),
    middleName: z.string().trim().optional(),
    lastName: required("lastName"),
    dateOfBirth,
    gender: z
      .enum(genderValues)
      .or(z.literal(""))
      .refine((value) => value !== "", message(locale, "required", translations[locale].fields.gender)),
    phoneCountryCode,
    phoneNationalNumber,
    phone: z.string().trim(),
    email: required("email").email(message(locale, "email")),
    address: required("address"),
    structuredAddress: localizedAddressSchema,
    preferredLanguage: z
      .enum(preferredLanguageValues)
      .or(z.literal(""))
      .refine((value) => value !== "", message(locale, "required", translations[locale].fields.preferredLanguage)),
    nationality: required("nationality"),
    religion: z.string().trim().optional(),
    emergencyName: z.string().trim().optional(),
    emergencyPhoneCountryCode: phoneCountryCode.optional(),
    emergencyPhoneNationalNumber: z.string().trim().optional(),
    emergencyPhone: z.string().trim().optional(),
    emergencyRelationship: z.string().trim().optional()
  }).superRefine((data, ctx) => {
    const phone = normalizeInternationalPhone(data.phoneCountryCode, data.phoneNationalNumber);
    if (!phone || (data.phone && normalizePhone(data.phone) !== phone)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phoneNationalNumber"], message: message(locale, "phone") });
    if (data.emergencyPhoneNationalNumber) {
      const emergencyPhone = normalizeInternationalPhone(data.emergencyPhoneCountryCode || "+66", data.emergencyPhoneNationalNumber);
      if (!emergencyPhone || (data.emergencyPhone && normalizePhone(data.emergencyPhone) !== emergencyPhone)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["emergencyPhoneNationalNumber"], message: message(locale, "phone") });
      }
    }
    if (data.address !== formatStructuredAddress(data.structuredAddress)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["address"], message: addressMessage });
    }
  }).transform((data) => ({
    ...data,
    phone: normalizeInternationalPhone(data.phoneCountryCode, data.phoneNationalNumber),
    emergencyPhone: data.emergencyPhoneNationalNumber ? normalizeInternationalPhone(data.emergencyPhoneCountryCode || "+66", data.emergencyPhoneNationalNumber) : ""
  }));
}

export const patientSchema = createPatientSchema("en");
export type PatientFormValues = z.input<ReturnType<typeof createPatientSchema>>;
