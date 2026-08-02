import { create } from "zustand";
import type { SessionSnapshot, SessionSummary } from "@/lib/session";

type StaffState = {
  sessions: SessionSummary[];
  selectedSessionId: string;
  snapshot: SessionSnapshot | null;
  setSessions: (sessions: SessionSummary[]) => void;
  upsertSummary: (summary: SessionSummary) => void;
  removeSession: (sessionId: string) => void;
  selectSession: (sessionId: string) => void;
  setSnapshot: (snapshot: SessionSnapshot | null) => void;
};

export const useStaffStore = create<StaffState>((set) => ({
  sessions: [],
  selectedSessionId: "",
  snapshot: null,
  setSessions: (sessions) =>
    set((state) => {
      const selected = state.snapshot && sessions.find((item) => item.sessionId === state.snapshot?.summary.sessionId);
      return { sessions, snapshot: selected && state.snapshot ? { ...state.snapshot, summary: selected } : state.snapshot };
    }),
  upsertSummary: (summary) =>
    set((state) => ({
      sessions: state.sessions.some((item) => item.sessionId === summary.sessionId)
        ? state.sessions.map((item) => (item.sessionId === summary.sessionId ? summary : item))
        : [summary, ...state.sessions],
      snapshot: state.snapshot?.summary.sessionId === summary.sessionId ? { ...state.snapshot, summary } : state.snapshot
    })),
  removeSession: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.filter((item) => item.sessionId !== sessionId),
      selectedSessionId: state.selectedSessionId === sessionId ? "" : state.selectedSessionId,
      snapshot: state.snapshot?.summary.sessionId === sessionId ? null : state.snapshot
    })),
  selectSession: (selectedSessionId) => set({ selectedSessionId, snapshot: null }),
  setSnapshot: (snapshot) =>
    set((state) => ({
      snapshot,
      sessions: snapshot
        ? state.sessions.some((item) => item.sessionId === snapshot.summary.sessionId)
          ? state.sessions.map((item) => (item.sessionId === snapshot.summary.sessionId ? snapshot.summary : item))
          : [snapshot.summary, ...state.sessions]
        : state.sessions
    }))
}));
