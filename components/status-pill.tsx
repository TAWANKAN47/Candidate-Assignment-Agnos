import { AlertCircle, CheckCircle2, CircleDashed, PencilLine } from "lucide-react";
import type { Locale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import type { PatientStatus } from "@/lib/session";

const meta = {
  waiting: { text: "Waiting for information", icon: CircleDashed, className: "text-slate-700", dot: "bg-slate-400" },
  "actively-filling": { text: "Actively filling", icon: PencilLine, className: "text-emerald-700", dot: "bg-emerald-600" },
  inactive: { text: "Inactive", icon: AlertCircle, className: "text-amber-700", dot: "bg-amber-600" },
  submitted: { text: "Submitted", icon: CheckCircle2, className: "text-blue-700", dot: "bg-blue-600" }
} satisfies Record<PatientStatus, { text: string; icon: typeof CircleDashed; className: string; dot: string }>;

const labels = {
  th: {
    waiting: "รอข้อมูล",
    "actively-filling": "กำลังกรอกข้อมูล",
    inactive: "ไม่มีความเคลื่อนไหว",
    submitted: "ส่งข้อมูลแล้ว"
  },
  en: {
    waiting: "Waiting for information",
    "actively-filling": "Actively filling",
    inactive: "Inactive",
    submitted: "Submitted"
  }
} satisfies Record<Locale, Record<PatientStatus, string>>;

export function StatusPill({ status, locale = "en" }: { status: PatientStatus; locale?: Locale }) {
  const item = meta[status];
  const Icon = item.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", item.className)}>
      <span className={cn("size-2 rounded-full", item.dot)} aria-hidden="true" />
      <Icon className="size-3.5" aria-hidden="true" />
      <span>{labels[locale][status]}</span>
    </span>
  );
}

export function statusLabel(status: PatientStatus, locale: Locale = "en") {
  return labels[locale][status];
}
