import type { PatientStatus } from "../lib/session";

export function canModifyPatientSession(status: PatientStatus) {
  return status !== "submitted";
}
