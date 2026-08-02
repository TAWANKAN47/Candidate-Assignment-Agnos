import { describe, expect, it } from "vitest";
import { addOrUpdateTimeline } from "./timeline";

describe("addOrUpdateTimeline", () => {
  it("updates the latest same-field event inside the debounce window", () => {
    const timeline = [{ at: "2026-08-02T10:00:00.000Z", text: "First Name updated", field: "firstName" as const }];
    const next = addOrUpdateTimeline(
      timeline,
      { at: "2026-08-02T10:00:02.000Z", text: "First Name updated", field: "firstName" },
      Date.parse("2026-08-02T10:00:02.000Z")
    );

    expect(next).toHaveLength(1);
    expect(next[0].at).toBe("2026-08-02T10:00:02.000Z");
  });

  it("keeps separate events outside the debounce window", () => {
    const timeline = [{ at: "2026-08-02T10:00:00.000Z", text: "First Name updated", field: "firstName" as const }];
    const next = addOrUpdateTimeline(
      timeline,
      { at: "2026-08-02T10:00:04.000Z", text: "First Name updated", field: "firstName" },
      Date.parse("2026-08-02T10:00:04.000Z")
    );

    expect(next).toHaveLength(2);
  });

  it.each(["status", "submit", "clear"] as const)("never dedupes %s events", (field) => {
    const timeline = [{ at: "2026-08-02T10:00:00.000Z", text: "Event", field }];
    const next = addOrUpdateTimeline(timeline, { at: "2026-08-02T10:00:01.000Z", text: "Event", field }, Date.parse("2026-08-02T10:00:01.000Z"));

    expect(next).toHaveLength(2);
  });
});
