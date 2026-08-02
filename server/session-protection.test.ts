import { describe, expect, it } from "vitest";
import { canModifyPatientSession } from "./session-protection";

describe("submitted session protection", () => {
  it("allows edits before submission", () => {
    expect(canModifyPatientSession("waiting")).toBe(true);
    expect(canModifyPatientSession("actively-filling")).toBe(true);
    expect(canModifyPatientSession("inactive")).toBe(true);
  });

  it("blocks update, clear, and duplicate submit after submission", () => {
    expect(canModifyPatientSession("submitted")).toBe(false);
  });
});
