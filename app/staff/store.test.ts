import { describe, expect, it } from "vitest";
import { useStaffStore } from "./store";

const summary = {
  sessionId: "AGN-A12345",
  displayName: "Ada Lovelace",
  maskedPhone: "•••• 7890",
  dateOfBirth: "1990-01-01",
  status: "actively-filling" as const,
  completedRequiredFields: 9,
  totalRequiredFields: 9,
  lastUpdatedAt: "2026-08-02T10:00:00.000Z"
};

describe("staff store status synchronization", () => {
  it("syncs selected snapshot status from session:list updates", () => {
    useStaffStore.setState({ sessions: [summary], selectedSessionId: summary.sessionId, snapshot: { summary, data: {}, timeline: [] } });

    useStaffStore.getState().setSessions([{ ...summary, status: "inactive" }]);

    expect(useStaffStore.getState().sessions[0].status).toBe("inactive");
    expect(useStaffStore.getState().snapshot?.summary.status).toBe("inactive");
  });

  it("syncs selected snapshot status from summary updates", () => {
    useStaffStore.setState({ sessions: [summary], selectedSessionId: summary.sessionId, snapshot: { summary, data: {}, timeline: [] } });

    useStaffStore.getState().upsertSummary({ ...summary, status: "submitted" });

    expect(useStaffStore.getState().sessions[0].status).toBe("submitted");
    expect(useStaffStore.getState().snapshot?.summary.status).toBe("submitted");
  });
});
