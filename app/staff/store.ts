import { create } from "zustand";
import type { SessionSnapshot, SessionSummary } from "@/lib/session";

type StaffState = {
  sessions: SessionSummary[];
  selectedSessionId: string;
  snapshot: SessionSnapshot | null;
  setSessions: (sessions: SessionSummary[]) => void;
  upsertSummary: (summary: SessionSummary) => void;
  selectSession: (sessionId: string) => void;
  setSnapshot: (snapshot: SessionSnapshot | null) => void;
};

export const useStaffStore = create<StaffState>((set) => ({
  sessions: [],
  selectedSessionId: "",
  snapshot: null,
  setSessions: (sessions) => set({ sessions }),
  upsertSummary: (summary) =>
    set((state) => ({
      sessions: state.sessions.some((item) => item.sessionId === summary.sessionId)
        ? state.sessions.map((item) => (item.sessionId === summary.sessionId ? summary : item))
        : [summary, ...state.sessions]
    })),
  selectSession: (selectedSessionId) => set({ selectedSessionId, snapshot: null }),
  setSnapshot: (snapshot) => set({ snapshot })
}));
