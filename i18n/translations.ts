import type { Locale } from "./locale";

type Option = { value: string; label: string };

export type PatientTranslations = {
  headerKicker: string;
  headerTitle: string;
  languageLabel: string;
  pageTitle: string;
  pageDescription: string;
  requiredSuffix: string;
  optionalLabel: string;
  selectPrefix: string;
  submitButton: string;
  clearButton: string;
  confirmSubmit: string;
  submitSuccess: string;
  submitSuccessTitle: string;
  submitSuccessDescription: string;
  submissionTime: string;
  currentSessionId: string;
  newPatientButton: string;
  reconnecting: string;
  unableToSync: string;
  sections: {
    personal: { title: string; description: string };
    contact: { title: string; description: string };
    emergency: { title: string; description: string };
  };
  addressFields: {
    houseStreet: string;
    province: string;
    district: string;
    subdistrict: string;
    postalCode: string;
  };
  fields: Record<
    | "firstName"
    | "middleName"
    | "lastName"
    | "dateOfBirth"
    | "gender"
    | "phone"
    | "email"
    | "address"
    | "preferredLanguage"
    | "nationality"
    | "religion"
    | "emergencyName"
    | "emergencyPhone"
    | "emergencyRelationship",
    string
  >;
  validation: {
    required: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    postalCode: string;
    address: string;
  };
  options: {
    genders: Option[];
    languages: Option[];
    nationalities: Option[];
    religions: Option[];
    relationships: Option[];
  };
};

export const translations = {
  th: {
    headerKicker: "แบบฟอร์มผู้ป่วย AGNOS",
    headerTitle: "กรอกข้อมูลผู้ป่วย",
    languageLabel: "ภาษา",
    pageTitle: "แบบฟอร์มข้อมูลผู้ป่วย",
    pageDescription: "กรุณากรอกข้อมูลด้านล่าง ช่องที่มีเครื่องหมายดอกจันเป็นข้อมูลที่จำเป็น",
    requiredSuffix: "*",
    optionalLabel: "ไม่บังคับ",
    selectPrefix: "เลือก",
    submitButton: "ส่งข้อมูลผู้ป่วย",
    clearButton: "ล้างแบบฟอร์ม",
    confirmSubmit: "ยืนยันส่งข้อมูลผู้ป่วยหรือไม่?",
    submitSuccess: "ส่งข้อมูลเรียบร้อยแล้ว",
    submitSuccessTitle: "ส่งข้อมูลเรียบร้อยแล้ว",
    submitSuccessDescription: "ข้อมูลของคุณถูกส่งให้เจ้าหน้าที่แล้ว",
    submissionTime: "เวลาส่งข้อมูล",
    currentSessionId: "รหัสรายการปัจจุบัน",
    newPatientButton: "กรอกข้อมูลผู้ป่วยรายใหม่",
    reconnecting: "กำลังเชื่อมต่อใหม่...",
    unableToSync: "ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อ",
    sections: {
      personal: { title: "ข้อมูลผู้ป่วย", description: "ข้อมูลระบุตัวตนและข้อมูลประชากรสำหรับการเข้ารับบริการครั้งนี้" },
      contact: { title: "ข้อมูลติดต่อ", description: "ข้อมูลติดต่อและที่อยู่สำหรับการเข้ารับบริการครั้งนี้" },
      emergency: { title: "ผู้ติดต่อฉุกเฉิน", description: "ข้อมูลผู้ติดต่อสำรอง ไม่บังคับกรอก" }
    },
    addressFields: {
      houseStreet: "บ้านเลขที่ / ถนน",
      province: "จังหวัด",
      district: "อำเภอ / เขต",
      subdistrict: "ตำบล / แขวง",
      postalCode: "รหัสไปรษณีย์"
    },
    fields: {
      firstName: "ชื่อ",
      middleName: "ชื่อกลาง",
      lastName: "นามสกุล",
      dateOfBirth: "วันเกิด",
      gender: "เพศ",
      phone: "เบอร์โทรศัพท์",
      email: "อีเมล",
      address: "ที่อยู่",
      preferredLanguage: "ภาษาที่ต้องการ",
      nationality: "สัญชาติ",
      religion: "ศาสนา",
      emergencyName: "ชื่อผู้ติดต่อฉุกเฉิน",
      emergencyPhone: "เบอร์โทรผู้ติดต่อฉุกเฉิน",
      emergencyRelationship: "ความสัมพันธ์กับผู้ติดต่อฉุกเฉิน"
    },
    validation: {
      required: "กรุณากรอก {field}",
      email: "กรุณากรอกอีเมลให้ถูกต้อง",
      phone: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง",
      dateOfBirth: "กรุณากรอกวันเกิดให้ถูกต้อง และต้องไม่เป็นวันที่ในอนาคต",
      postalCode: "กรุณากรอกรหัสไปรษณีย์ 5 หลัก",
      address: "กรุณากรอกที่อยู่ให้ครบถ้วน"
    },
    options: {
      genders: [
        { value: "male", label: "ชาย" },
        { value: "female", label: "หญิง" },
        { value: "other", label: "อื่น ๆ" },
        { value: "prefer-not-to-say", label: "ไม่ประสงค์ระบุ" }
      ],
      languages: [
        { value: "th", label: "ไทย" },
        { value: "en", label: "อังกฤษ" },
        { value: "zh", label: "จีน" },
        { value: "ja", label: "ญี่ปุ่น" },
        { value: "other", label: "อื่น ๆ" }
      ],
      nationalities: [
        { value: "Thai", label: "ไทย" },
        { value: "American", label: "อเมริกัน" },
        { value: "Chinese", label: "จีน" },
        { value: "Japanese", label: "ญี่ปุ่น" },
        { value: "Other", label: "อื่น ๆ" }
      ],
      religions: [
        { value: "Buddhist", label: "พุทธ" },
        { value: "Christian", label: "คริสต์" },
        { value: "Muslim", label: "อิสลาม" },
        { value: "Hindu", label: "ฮินดู" },
        { value: "None", label: "ไม่มีศาสนา" },
        { value: "Other", label: "อื่น ๆ" }
      ],
      relationships: [
        { value: "Parent", label: "บิดา/มารดา" },
        { value: "Spouse", label: "คู่สมรส" },
        { value: "Sibling", label: "พี่น้อง" },
        { value: "Relative", label: "ญาติ" },
        { value: "Friend", label: "เพื่อน" },
        { value: "Guardian", label: "ผู้ปกครอง" },
        { value: "Other", label: "อื่น ๆ" }
      ]
    }
  },
  en: {
    headerKicker: "AGNOS Patient Intake",
    headerTitle: "Patient Information Form",
    languageLabel: "Language",
    pageTitle: "Patient Information Form",
    pageDescription: "Please provide your information below. Fields marked with an asterisk are required.",
    requiredSuffix: "*",
    optionalLabel: "optional",
    selectPrefix: "Select",
    submitButton: "Submit Patient Information",
    clearButton: "Clear Form",
    confirmSubmit: "Submit patient information?",
    submitSuccess: "Patient information submitted",
    submitSuccessTitle: "Information submitted successfully",
    submitSuccessDescription: "Your information has been sent to the staff.",
    submissionTime: "Submission time",
    currentSessionId: "Current Session ID",
    newPatientButton: "Register another patient",
    reconnecting: "Reconnecting...",
    unableToSync: "Unable to sync. Please check your connection.",
    sections: {
      personal: { title: "Patient Information", description: "Identity and demographic information for this visit." },
      contact: { title: "Contact Information", description: "Communication and address information for this visit." },
      emergency: { title: "Emergency Contact", description: "Optional support contact details." }
    },
    addressFields: {
      houseStreet: "House Number / Street",
      province: "Province",
      district: "District",
      subdistrict: "Subdistrict",
      postalCode: "Postal Code"
    },
    fields: {
      firstName: "First Name",
      middleName: "Middle Name",
      lastName: "Last Name",
      dateOfBirth: "Date of Birth",
      gender: "Gender",
      phone: "Phone Number",
      email: "Email",
      address: "Address",
      preferredLanguage: "Preferred Language",
      nationality: "Nationality",
      religion: "Religion",
      emergencyName: "Emergency Contact Name",
      emergencyPhone: "Emergency Contact Phone",
      emergencyRelationship: "Emergency Contact Relationship"
    },
    validation: {
      required: "{field} is required",
      email: "Enter a valid email",
      phone: "Enter a valid Thai phone number",
      dateOfBirth: "Enter a valid date of birth that is not in the future",
      postalCode: "Enter a five-digit postal code",
      address: "Complete the full address"
    },
    options: {
      genders: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" },
        { value: "prefer-not-to-say", label: "Prefer not to say" }
      ],
      languages: [
        { value: "th", label: "Thai" },
        { value: "en", label: "English" },
        { value: "zh", label: "Chinese" },
        { value: "ja", label: "Japanese" },
        { value: "other", label: "Other" }
      ],
      nationalities: [
        { value: "Thai", label: "Thai" },
        { value: "American", label: "American" },
        { value: "Chinese", label: "Chinese" },
        { value: "Japanese", label: "Japanese" },
        { value: "Other", label: "Other" }
      ],
      religions: [
        { value: "Buddhist", label: "Buddhist" },
        { value: "Christian", label: "Christian" },
        { value: "Muslim", label: "Muslim" },
        { value: "Hindu", label: "Hindu" },
        { value: "None", label: "None" },
        { value: "Other", label: "Other" }
      ],
      relationships: [
        { value: "Parent", label: "Parent" },
        { value: "Spouse", label: "Spouse" },
        { value: "Sibling", label: "Sibling" },
        { value: "Relative", label: "Relative" },
        { value: "Friend", label: "Friend" },
        { value: "Guardian", label: "Guardian" },
        { value: "Other", label: "Other" }
      ]
    }
  }
} as const satisfies Record<Locale, PatientTranslations>;
