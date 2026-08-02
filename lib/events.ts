import type { PatientData, PatientStatus, SessionSnapshot, SessionSummary } from "./session";

export type ServerToClientEvents = {
  "session:created": (payload: { sessionId: string }) => void;
  "session:list": (payload: SessionSummary[]) => void;
  "session:summary-updated": (payload: SessionSummary) => void;
  "session:snapshot": (payload: SessionSnapshot) => void;
  "session:unavailable": (payload: { sessionId: string }) => void;
  "patient:update": (payload: SessionSnapshot) => void;
  "patient:status": (payload: { sessionId: string; status: PatientStatus }) => void;
  "patient:submit": (payload: SessionSnapshot) => void;
  "patient:clear": (payload: SessionSnapshot) => void;
};

export type ClientToServerEvents = {
  "patient:join": (payload: { sessionId?: string }) => void;
  "staff:join": () => void;
  "session:selected": (payload: { sessionId: string }) => void;
  "patient:update": (payload: { sessionId: string; data: PatientData }) => void;
  "patient:submit": (payload: { sessionId: string }) => void;
  "patient:clear": (payload: { sessionId: string }) => void;
};
