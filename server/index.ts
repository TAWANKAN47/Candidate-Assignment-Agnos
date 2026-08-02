import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { z } from "zod";
import type { ClientToServerEvents, ServerToClientEvents } from "../lib/events";
import { serverPatientDataSchema } from "../lib/patient-values";
import {
  completion,
  displayName,
  maskPhone,
  requiredFields,
  type PatientData,
  type PatientStatus,
  type SessionSnapshot,
  type SessionSummary,
  type TimelineItem
} from "../lib/session";
import { applyPatientUpdate, patientUpdatePayloadSchema } from "./patient-update";
import { canModifyPatientSession } from "./session-protection";
import { addOrUpdateTimeline, timelineLimit } from "./timeline";

type InterServerEvents = Record<string, never>;
type SocketData = { sessionId?: string };
type PatientSession = {
  sessionId: string;
  data: PatientData;
  status: PatientStatus;
  createdAt: string;
  lastUpdatedAt: string;
  submittedAt?: string;
  timeline: TimelineItem[];
};

const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: { origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000" }
});
const sessions = new Map<string, PatientSession>();
const inactiveMs = 30_000;
const sessionPayloadSchema = z.object({ sessionId: z.string().regex(/^AGN-[A-Z0-9]{6}$/) }).strict();
const optionalSessionPayloadSchema = z.object({ sessionId: z.string().regex(/^AGN-[A-Z0-9]{6}$/).optional() }).strict();
const fieldLabels: Record<keyof PatientData, string> = {
  firstName: "First Name",
  middleName: "Middle Name",
  lastName: "Last Name",
  dateOfBirth: "Date of Birth",
  gender: "Gender",
  phoneCountryCode: "Phone Number",
  phoneNationalNumber: "Phone Number",
  phone: "Phone Number",
  email: "Email",
  address: "Address",
  structuredAddress: "Address",
  preferredLanguage: "Preferred Language",
  nationality: "Nationality",
  religion: "Religion",
  emergencyName: "Emergency Contact Name",
  emergencyPhoneCountryCode: "Emergency Contact Phone",
  emergencyPhoneNationalNumber: "Emergency Contact Phone",
  emergencyPhone: "Emergency Contact Phone",
  emergencyRelationship: "Emergency Contact Relationship"
};

app.get("/health", (_req, res) => res.json({ ok: true }));

function makeSessionId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let id = "";
  do {
    id = `AGN-${Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("")}`;
  } while (sessions.has(id));
  return id;
}

function getSession(sessionId?: string) {
  const id = sessionId && /^AGN-[A-Z0-9]{6}$/.test(sessionId) ? sessionId : makeSessionId();
  if (!sessions.has(id)) {
    const now = new Date().toISOString();
    sessions.set(id, {
      sessionId: id,
      data: {},
      status: "waiting",
      createdAt: now,
      lastUpdatedAt: now,
      timeline: [{ at: now, text: "Session created", field: "status" }]
    });
  }
  return sessions.get(id)!;
}

function getStatus(session: PatientSession): PatientStatus {
  if (session.status === "submitted") return "submitted";
  if (!completion(session.data)) return "waiting";
  return Date.now() - Date.parse(session.lastUpdatedAt) > inactiveMs ? "inactive" : "actively-filling";
}

function summary(session: PatientSession): SessionSummary {
  session.status = getStatus(session);
  return {
    sessionId: session.sessionId,
    displayName: displayName(session.data),
    maskedPhone: maskPhone(session.data.phone),
    dateOfBirth: session.data.dateOfBirth || "",
    status: session.status,
    completedRequiredFields: completion(session.data),
    totalRequiredFields: requiredFields.length,
    lastUpdatedAt: session.lastUpdatedAt,
    submittedAt: session.submittedAt
  };
}

function snapshot(session: PatientSession): SessionSnapshot {
  return { summary: summary(session), data: session.data, timeline: session.timeline.slice(0, timelineLimit) };
}

function list() {
  const rank: Record<PatientStatus, number> = { "actively-filling": 0, inactive: 1, waiting: 2, submitted: 3 };
  return [...sessions.values()]
    .map(summary)
    .sort((a, b) => rank[a.status] - rank[b.status] || Date.parse(b.lastUpdatedAt) - Date.parse(a.lastUpdatedAt));
}

function addTimeline(session: PatientSession, text: string, field?: TimelineItem["field"]) {
  const at = new Date().toISOString();
  session.timeline = addOrUpdateTimeline(session.timeline, { at, text, field }, Date.parse(at));
}

function touch(session: PatientSession) {
  session.lastUpdatedAt = new Date().toISOString();
  if (session.status !== "submitted") session.status = "actively-filling";
}

function emitList() {
  io.to("staff:lobby").emit("session:list", list());
}

function changedFields(before: PatientData, after: PatientData) {
  return (Object.keys(fieldLabels) as (keyof PatientData)[]).filter((field) => (before[field] || "") !== (after[field] || ""));
}

io.on("connection", (socket) => {
  socket.on("patient:join", (input) => {
    const payload = optionalSessionPayloadSchema.safeParse(input);
    if (!payload.success) return;
    const session = getSession(payload.data.sessionId);
    [...socket.rooms].filter((room) => room.startsWith("patient:")).forEach((room) => socket.leave(room));
    socket.data.sessionId = session.sessionId;
    socket.join(`patient:${session.sessionId}`);
    socket.emit("session:created", { sessionId: session.sessionId });
    socket.emit("session:snapshot", snapshot(session));
    emitList();
  });

  socket.on("staff:join", () => {
    socket.join("staff:lobby");
    socket.emit("session:list", list());
  });

  socket.on("session:selected", (input) => {
    const payload = sessionPayloadSchema.safeParse(input);
    if (!payload.success) return socket.emit("session:unavailable", { sessionId: "" });
    const session = sessions.get(payload.data.sessionId);
    [...socket.rooms].filter((room) => room.startsWith("patient:")).forEach((room) => socket.leave(room));
    if (!session) return socket.emit("session:unavailable", { sessionId: payload.data.sessionId });
    socket.join(`patient:${payload.data.sessionId}`);
    socket.emit("session:snapshot", snapshot(session));
  });

  socket.on("patient:update", (input) => {
    const payload = patientUpdatePayloadSchema.safeParse(input);
    if (!payload.success) return;
    const session = getSession(payload.data.sessionId);
    if (!canModifyPatientSession(getStatus(session))) return;
    const beforeStatus = getStatus(session);
    const nextData = { ...session.data };
    applyPatientUpdate(nextData, payload.data.data);
    const changed = changedFields(session.data, nextData).filter((field) => field !== "structuredAddress");
    applyPatientUpdate(session.data, payload.data.data);
    touch(session);
    if (beforeStatus === "inactive") addTimeline(session, "Patient resumed filling", "status");
    changed.forEach((field) => addTimeline(session, `${fieldLabels[field]} updated`, field));
    io.to(`patient:${session.sessionId}`).emit("patient:update", snapshot(session));
    io.to("staff:lobby").emit("session:summary-updated", summary(session));
    emitList();
  });

  socket.on("patient:submit", (input) => {
    const payload = sessionPayloadSchema.safeParse(input);
    if (!payload.success) return;
    const session = getSession(payload.data.sessionId);
    if (!canModifyPatientSession(getStatus(session))) return;
    if (!serverPatientDataSchema.safeParse(session.data).success) return;
    session.submittedAt = new Date().toISOString();
    session.status = "submitted";
    touch(session);
    addTimeline(session, "Form submitted", "submit");
    io.to(`patient:${session.sessionId}`).emit("patient:submit", snapshot(session));
    emitList();
  });

  socket.on("patient:clear", (input) => {
    const payload = sessionPayloadSchema.safeParse(input);
    if (!payload.success) return;
    const session = getSession(payload.data.sessionId);
    if (!canModifyPatientSession(getStatus(session))) return;
    session.data = {};
    session.status = "waiting";
    session.lastUpdatedAt = new Date().toISOString();
    addTimeline(session, "Form cleared", "clear");
    io.to(`patient:${session.sessionId}`).emit("patient:clear", snapshot(session));
    emitList();
  });
});

setInterval(() => {
  let changed = false;
  for (const session of sessions.values()) {
    const before = session.status;
    const after = getStatus(session);
    if (before !== after) {
      session.status = after;
      if (after === "inactive") addTimeline(session, "Patient became inactive", "status");
      changed = true;
    }
  }
  if (changed) emitList();
}, 5_000).unref();

server.listen(Number(process.env.PORT || 4000), () => {
  console.log(`Realtime server listening on ${process.env.PORT || 4000}`);
});
