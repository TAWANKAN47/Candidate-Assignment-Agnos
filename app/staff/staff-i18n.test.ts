import { describe, expect, it } from "vitest";
import { makeStructuredAddress } from "@/lib/patient-values";
import { addressValue, codedValue, dedupeTimeline, fullAddress, getEmptyValueLabel, staffPhone, timelineLabel } from "./staff-i18n";

describe("staff display helpers", () => {
  it("uses context-aware empty labels", () => {
    expect(getEmptyValueLabel({ status: "actively-filling", required: true, locale: "en" })).toBe("Not entered yet");
    expect(getEmptyValueLabel({ status: "submitted", required: false, locale: "en" })).toBe("Not provided");
    expect(getEmptyValueLabel({ status: "submitted", required: true, locale: "th" })).toBe("ข้อมูลไม่ครบ");
  });

  it("translates coded values without touching patient-entered values", () => {
    expect(codedValue("gender", "male", "en")).toBe("Male");
    expect(codedValue("preferredLanguage", "th", "en")).toBe("Thai");
    expect(codedValue("nationality", "Canadian", "th")).toBe("Canadian");
  });

  it("formats phone numbers for staff rendering", () => {
    expect(staffPhone("+66812345678")).toBe("+66 81 234 5678");
  });

  it("localizes structured address display through the shared formatter", () => {
    const address = makeStructuredAddress("1 Main Street", "100101");

    expect(addressValue(address || undefined, "province", "th")).toBe("กรุงเทพมหานคร");
    expect(addressValue(address || undefined, "province", "en")).toBe("Bangkok");
    expect(fullAddress(address || undefined, "en")).toContain("Bangkok");
  });

  it("dedupes adjacent timeline rows and localizes known labels", () => {
    const timeline = [
      { at: "2026-08-02T00:00:00.000Z", text: "First Name updated", field: "firstName" as const },
      { at: "2026-08-02T00:00:01.000Z", text: "First Name updated", field: "firstName" as const },
      { at: "2026-08-02T00:00:02.000Z", text: "Form submitted", field: "submit" as const }
    ];

    expect(dedupeTimeline(timeline)).toHaveLength(2);
    expect(timelineLabel(timeline[2], "th")).toBe("ส่งแบบฟอร์มแล้ว");
  });
});
