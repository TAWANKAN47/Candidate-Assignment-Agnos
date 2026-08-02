import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const selectTriggerClassName =
  "h-11 w-full rounded-md border border-slate-300 bg-white px-3 pr-10 text-left text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-100 aria-invalid:border-red-500 aria-invalid:focus:border-red-500 aria-invalid:focus:ring-red-100 data-[invalid=true]:border-red-500 data-[invalid=true]:focus:border-red-500 data-[invalid=true]:focus:ring-red-100";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block w-full">
      <select className={cn(selectTriggerClassName, "appearance-none", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 shrink-0 text-slate-500"
        aria-hidden="true"
      />
    </span>
  );
}
