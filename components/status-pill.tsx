import { AlertCircle, CheckCircle2, CircleDashed, PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientStatus } from "@/lib/session";

const meta = {
  waiting: { text: "Waiting for information", icon: CircleDashed, className: "text-slate-700", dot: "bg-slate-400" },
  "actively-filling": { text: "Actively filling", icon: PencilLine, className: "text-emerald-700", dot: "bg-emerald-600" },
  inactive: { text: "Inactive", icon: AlertCircle, className: "text-amber-700", dot: "bg-amber-600" },
  submitted: { text: "Submitted", icon: CheckCircle2, className: "text-blue-700", dot: "bg-blue-600" }
} satisfies Record<PatientStatus, { text: string; icon: typeof CircleDashed; className: string; dot: string }>;

export function StatusPill({ status }: { status: PatientStatus }) {
  const item = meta[status];
  const Icon = item.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", item.className)}>
      <span className={cn("size-2 rounded-full", item.dot)} aria-hidden="true" />
      <Icon className="size-3.5" aria-hidden="true" />
      <span>{item.text}</span>
    </span>
  );
}

export function statusLabel(status: PatientStatus) {
  return meta[status].text;
}
