import type { Locale } from "@/i18n/locale";
import { translations } from "@/i18n/translations";
import { formatPhoneDisplay, formatStructuredAddress, type StructuredAddress } from "@/lib/patient-values";
import type { PatientData, PatientStatus, TimelineItem } from "@/lib/session";

export const staffText = {
  th: {
    headerTitle: "จอภาพข้อมูลผู้ป่วย",
    headerDescription: "ติดตามข้อมูลผู้ป่วยและกิจกรรมการกรอกแบบฟอร์มแบบเรียลไทม์",
    language: "ภาษา",
    print: "พิมพ์ / บันทึกเป็น PDF",
    activeSessions: "รายการผู้ป่วยที่กำลังกรอก",
    currentSessions: "รายการปัจจุบัน",
    search: "ค้นหาผู้ป่วยหรือรหัสรายการ",
    noSessions: "ยังไม่มีรายการผู้ป่วย",
    noSessionsText: "รายการจะแสดงเมื่อผู้ป่วยเปิดแบบฟอร์มข้อมูล",
    noMatches: "ไม่พบรายการที่ตรงกัน",
    selectPatient: "เลือกผู้ป่วย",
    selectPatientText: "เลือกผู้ป่วยจากรายการเพื่อติดตามข้อมูล",
    unavailable: "ไม่พบรายการผู้ป่วย",
    unavailableText: "รายการนี้อาจหมดอายุหรือไม่พร้อมใช้งานแล้ว",
    returnList: "กลับไปรายการที่ใช้งานอยู่",
    loading: "กำลังโหลดข้อมูลผู้ป่วย",
    status: "สถานะแบบฟอร์ม",
    requiredFields: "ข้อมูลจำเป็น",
    lastUpdated: "อัปเดตล่าสุด",
    sessionId: "รหัสรายการ",
    session: "รายการ",
    generated: "สร้างเอกสาร",
    submittedAt: "เวลาส่งข้อมูล",
    back: "กลับไปรายชื่อผู้ป่วย",
    printTitle: "สรุปข้อมูลผู้ป่วย AGNOS",
    printSubtitle: "สรุปข้อมูลจากแบบฟอร์มผู้ป่วย",
    activity: "ไทม์ไลน์กิจกรรม",
    selectActivity: "เลือกผู้ป่วยเพื่อดูกิจกรรม",
    connected: "เชื่อมต่อแล้ว",
    disconnected: "ไม่ได้เชื่อมต่อ",
    notSelected: "ยังไม่ได้เลือกผู้ป่วย",
    notEnteredYet: "ยังไม่ได้กรอก",
    notProvided: "ไม่ได้ระบุ",
    missingInformation: "ข้อมูลไม่ครบ",
    dob: "วันเกิด",
    phoneShort: "เบอร์โทร",
    fullAddress: "ที่อยู่แบบเต็ม",
    addressLine: "บ้านเลขที่ / ถนน",
    province: "จังหวัด",
    district: "อำเภอ / เขต",
    subdistrict: "ตำบล / แขวง",
    postalCode: "รหัสไปรษณีย์",
    sections: {
      patient: "ข้อมูลผู้ป่วย",
      contact: "ข้อมูลติดต่อและที่อยู่",
      emergency: "ผู้ติดต่อฉุกเฉิน"
    },
    statuses: {
      waiting: "รอข้อมูล",
      "actively-filling": "กำลังกรอกข้อมูล",
      inactive: "ไม่มีความเคลื่อนไหว",
      submitted: "ส่งข้อมูลแล้ว"
    },
    timeline: {
      "Session created": "สร้างรายการแล้ว",
      "Patient resumed filling": "ผู้ป่วยกลับมากรอกข้อมูลต่อ",
      "Form submitted": "ส่งแบบฟอร์มแล้ว",
      "Form cleared": "ล้างแบบฟอร์มแล้ว",
      "Patient became inactive": "ผู้ป่วยไม่มีความเคลื่อนไหว",
      updated: "อัปเดตแล้ว"
    }
  },
  en: {
    headerTitle: "Patient Intake Monitor",
    headerDescription: "Monitor patient information and form activity in real time.",
    language: "Language",
    print: "Print / Save as PDF",
    activeSessions: "Active Patient Sessions",
    currentSessions: "current sessions",
    search: "Search patient or session",
    noSessions: "No active patient sessions",
    noSessionsText: "Patient sessions will appear when a patient opens the information form.",
    noMatches: "No matching patient sessions",
    selectPatient: "Select a patient session",
    selectPatientText: "Choose a patient from the list to monitor their information.",
    unavailable: "Patient session unavailable",
    unavailableText: "This session may have expired or is no longer active.",
    returnList: "Return to active sessions",
    loading: "Loading patient session",
    status: "Form Status",
    requiredFields: "Required Fields",
    lastUpdated: "Last Updated",
    sessionId: "Session ID",
    session: "Session",
    generated: "Generated",
    submittedAt: "Submission time",
    back: "Back to patient list",
    printTitle: "AGNOS Patient Intake",
    printSubtitle: "Patient Information Summary",
    activity: "Activity Timeline",
    selectActivity: "Select a patient session to view activity.",
    connected: "Connected",
    disconnected: "Disconnected",
    notSelected: "No patient selected",
    notEnteredYet: "Not entered yet",
    notProvided: "Not provided",
    missingInformation: "Missing information",
    dob: "DOB",
    phoneShort: "Phone",
    fullAddress: "Full Address Summary",
    addressLine: "Address Line",
    province: "Province",
    district: "District",
    subdistrict: "Subdistrict",
    postalCode: "Postal Code",
    sections: {
      patient: "Patient Information",
      contact: "Contact & Address",
      emergency: "Emergency Contact"
    },
    statuses: {
      waiting: "Waiting for information",
      "actively-filling": "Actively filling",
      inactive: "Inactive",
      submitted: "Submitted"
    },
    timeline: {
      "Session created": "Session created",
      "Patient resumed filling": "Patient resumed filling",
      "Form submitted": "Form submitted",
      "Form cleared": "Form cleared",
      "Patient became inactive": "Patient became inactive",
      updated: "updated"
    }
  }
} as const;

export const requiredStaffFields = new Set<keyof PatientData>([
  "firstName",
  "lastName",
  "dateOfBirth",
  "gender",
  "preferredLanguage",
  "phone",
  "email",
  "address",
  "structuredAddress",
  "nationality"
]);

export function getEmptyValueLabel({ status, required, locale }: { status: PatientStatus; required: boolean; locale: Locale }) {
  const text = staffText[locale];
  if (status !== "submitted") return text.notEnteredYet;
  return required ? text.missingInformation : text.notProvided;
}

export function codedValue(field: keyof PatientData, value: string | undefined, locale: Locale) {
  const options =
    field === "gender"
      ? translations[locale].options.genders
      : field === "preferredLanguage"
        ? translations[locale].options.languages
        : field === "religion"
          ? translations[locale].options.religions
          : field === "emergencyRelationship"
            ? translations[locale].options.relationships
            : [];
  return options.find((option) => option.value === value)?.label || value || "";
}

export function addressValue(address: StructuredAddress | undefined, part: "province" | "district" | "subdistrict", locale: Locale) {
  if (!address) return "";
  if (part === "province") return locale === "en" && address.provinceEn ? address.provinceEn : address.provinceTh;
  if (part === "district") return locale === "en" && address.districtEn ? address.districtEn : address.districtTh;
  return locale === "en" && address.subdistrictEn ? address.subdistrictEn : address.subdistrictTh;
}

export function fullAddress(address: StructuredAddress | undefined, locale: Locale) {
  return formatStructuredAddress(address, locale);
}

export function staffPhone(value: string | undefined) {
  return formatPhoneDisplay(value);
}

export function formatStaffDate(date: string | undefined, locale: Locale) {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00`));
}

export function formatStaffDateTime(date: string | undefined, locale: Locale) {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export function formatStaffTime(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", { timeStyle: "short" }).format(new Date(date));
}

export function timelineLabel(item: TimelineItem, locale: Locale) {
  const text = staffText[locale].timeline;
  if (item.text.endsWith(" updated")) {
    const field = item.field && item.field in translations[locale].fields ? translations[locale].fields[item.field as keyof typeof translations.en.fields] : item.text.replace(" updated", "");
    return `${field} ${text.updated}`;
  }
  return text[item.text as keyof typeof text] || item.text;
}

export function dedupeTimeline(items: TimelineItem[]) {
  return items.filter((item, index) => {
    const previous = items[index - 1];
    return !previous || previous.text !== item.text || previous.field !== item.field;
  });
}
