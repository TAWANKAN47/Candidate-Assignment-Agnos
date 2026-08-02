import { z } from "zod";
import { patientUpdateSchema } from "../lib/patient-values";
import type { PatientData } from "../lib/session";

export const patientUpdatePayloadSchema = z
  .object({
    sessionId: z.string().regex(/^AGN-[A-Z0-9]{6}$/),
    data: patientUpdateSchema
  })
  .strict();

export function changedPatientFields(before: PatientData, after: PatientData) {
  return (Object.keys(after) as (keyof PatientData)[]).filter((field) => before[field] !== after[field]);
}

export function applyPatientUpdate(target: PatientData, data: PatientData) {
  if (Object.hasOwn(data, "firstName")) target.firstName = data.firstName;
  if (Object.hasOwn(data, "middleName")) target.middleName = data.middleName;
  if (Object.hasOwn(data, "lastName")) target.lastName = data.lastName;
  if (Object.hasOwn(data, "dateOfBirth")) target.dateOfBirth = data.dateOfBirth;
  if (Object.hasOwn(data, "gender")) target.gender = data.gender;
  if (Object.hasOwn(data, "phoneCountryCode")) target.phoneCountryCode = data.phoneCountryCode;
  if (Object.hasOwn(data, "phoneNationalNumber")) target.phoneNationalNumber = data.phoneNationalNumber;
  if (Object.hasOwn(data, "phone")) target.phone = data.phone;
  if (Object.hasOwn(data, "email")) target.email = data.email;
  if (Object.hasOwn(data, "address")) target.address = data.address;
  if (Object.hasOwn(data, "structuredAddress")) target.structuredAddress = data.structuredAddress;
  if (Object.hasOwn(data, "preferredLanguage")) target.preferredLanguage = data.preferredLanguage;
  if (Object.hasOwn(data, "nationality")) target.nationality = data.nationality;
  if (Object.hasOwn(data, "religion")) target.religion = data.religion;
  if (Object.hasOwn(data, "emergencyName")) target.emergencyName = data.emergencyName;
  if (Object.hasOwn(data, "emergencyPhoneCountryCode")) target.emergencyPhoneCountryCode = data.emergencyPhoneCountryCode;
  if (Object.hasOwn(data, "emergencyPhoneNationalNumber")) target.emergencyPhoneNationalNumber = data.emergencyPhoneNationalNumber;
  if (Object.hasOwn(data, "emergencyPhone")) target.emergencyPhone = data.emergencyPhone;
  if (Object.hasOwn(data, "emergencyRelationship")) target.emergencyRelationship = data.emergencyRelationship;
}
