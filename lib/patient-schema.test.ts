import { describe, expect, it } from "vitest";
import { createPatientSchema, patientSchema } from "./patient-schema";
import { formatStructuredAddress, makeStructuredAddress } from "./patient-values";
import { requiredFields } from "./session";
import { defaultLocale, localeStorageKey } from "@/i18n/locale";

describe("patientSchema", () => {
  it("accepts exactly the assignment fields", () => {
    const keys = Object.keys(patientSchema.innerType().shape).sort();
    expect(keys).toEqual(
      [
        "address",
        "dateOfBirth",
        "email",
        "emergencyName",
        "emergencyPhone",
        "emergencyRelationship",
        "firstName",
        "gender",
        "lastName",
        "middleName",
        "nationality",
        "phone",
        "preferredLanguage",
        "religion",
        "structuredAddress"
      ].sort()
    );
    expect(requiredFields).toHaveLength(9);
  });

  it("uses Thai by default and can localize validation", () => {
    const result = createPatientSchema("th").safeParse({});
    expect(defaultLocale).toBe("th");
    expect(localeStorageKey).toBe("agnos-locale");
    expect(result.success && result.data).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.firstName?.[0]).toBe("กรุณากรอก ชื่อ");
  });

  it("validates normalized phones, enums, dates, and structured address integrity", () => {
    const structuredAddress = makeStructuredAddress("1 Main Street", "100101");
    expect(structuredAddress).toBeTruthy();
    const valid = createPatientSchema("en").safeParse({
      firstName: "A",
      lastName: "B",
      dateOfBirth: "2000-01-01",
      gender: "male",
      phone: "08-1234-5678",
      email: "a@example.com",
      address: formatStructuredAddress(structuredAddress!),
      structuredAddress,
      preferredLanguage: "th",
      nationality: "Thai",
      emergencyPhone: "+66812345678"
    });
    expect(valid.success && valid.data.phone).toBe("0812345678");

    const invalid = createPatientSchema("en").safeParse({
      firstName: "A",
      lastName: "B",
      dateOfBirth: "2999-01-01",
      gender: "Male",
      phone: "abc0812345678",
      email: "a@example.com",
      address: "wrong",
      structuredAddress,
      preferredLanguage: "Thai",
      nationality: "Thai"
    });
    expect(invalid.success).toBe(false);
  });
});
