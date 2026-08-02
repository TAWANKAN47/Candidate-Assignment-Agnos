import { describe, expect, it } from "vitest";
import { formatPhoneDisplay, normalizeInternationalPhone, normalizePhone } from "./patient-values";

describe("international phone helpers", () => {
  it("defaults Thailand numbers to +66", () => {
    expect(normalizePhone("0812345678")).toBe("+66812345678");
    expect(normalizePhone("812345678")).toBe("+66812345678");
  });

  it("normalizes supported international country codes", () => {
    expect(normalizeInternationalPhone("+1", "415 555 2671")).toBe("+14155552671");
    expect(normalizeInternationalPhone("+81", "9012345678")).toBe("+819012345678");
  });

  it("rejects invalid Thailand phone values", () => {
    expect(normalizeInternationalPhone("+66", "+66812345678")).toBe("");
    expect(normalizeInternationalPhone("+66", "66812345678")).toBe("");
    expect(normalizeInternationalPhone("+66", "+660812345678")).toBe("");
    expect(normalizeInternationalPhone("+66", "abc812345678")).toBe("");
    expect(normalizeInternationalPhone("+66", "8123*45678")).toBe("");
  });

  it("formats phones for staff and print", () => {
    expect(formatPhoneDisplay("+66812345678")).toBe("+66 81 234 5678");
    expect(formatPhoneDisplay("+14155552671")).toBe("+1 415 555 2671");
  });
});
