import { describe, expect, it } from "vitest";
import { completion, displayName, maskPhone } from "./session";

describe("session helpers", () => {
  it("does not depend on full names being unique", () => {
    expect(displayName({ firstName: "Somchai", lastName: "Jaidee" })).toBe("Somchai Jaidee");
    expect(displayName({})).toBe("Unnamed patient");
  });

  it("keeps sensitive phone data masked in summaries", () => {
    expect(maskPhone("0891235678")).toBe("\u2022\u2022\u2022\u2022 5678");
  });

  it("counts assignment required fields", () => {
    expect(completion({ firstName: "Tawan", gender: "Male" })).toBe(2);
  });
});
