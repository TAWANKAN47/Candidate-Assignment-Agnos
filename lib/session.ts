import { format, formatDistanceToNow } from "date-fns";
import type { StructuredAddress } from "./patient-values";

export const requiredFields = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "gender",
  "phone",
  "email",
  "address",
  "preferredLanguage",
  "nationality"
] as const;

export type PatientStatus = "waiting" | "actively-filling" | "inactive" | "submitted";

export type PatientData = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  structuredAddress?: StructuredAddress;
  preferredLanguage?: string;
  nationality?: string;
  religion?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelationship?: string;
};

export type SessionSummary = {
  sessionId: string;
  displayName: string;
  maskedPhone: string;
  dateOfBirth: string;
  status: PatientStatus;
  completedRequiredFields: number;
  totalRequiredFields: number;
  lastUpdatedAt: string;
  submittedAt?: string;
};

export type TimelineItem = { at: string; text: string; field?: keyof PatientData | "status" | "submit" | "clear" };
export type SessionSnapshot = { summary: SessionSummary; data: PatientData; timeline: TimelineItem[] };

export function displayName(data: PatientData) {
  return [data.firstName?.trim(), data.lastName?.trim()].filter(Boolean).join(" ") || "Unnamed patient";
}

export function maskPhone(phone = "") {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `\u2022\u2022\u2022\u2022 ${digits.slice(-4)}` : "";
}

export function completion(data: PatientData) {
  return requiredFields.filter((field) => String(data[field] || "").trim()).length;
}

export function makeSessionId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `AGN-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

export function updatedLabel(date: string) {
  return Date.now() - Date.parse(date) < 45_000
    ? "Updated just now"
    : `Updated ${formatDistanceToNow(date, { addSuffix: true })}`;
}

export function dobLabel(date?: string) {
  return date ? format(new Date(`${date}T00:00:00`), "d MMM yyyy") : "";
}
