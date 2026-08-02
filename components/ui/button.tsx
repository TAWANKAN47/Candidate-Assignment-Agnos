import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "default" | "outline" | "ghost";
};

export function Button({ asChild, className, variant = "default", ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-blue-700 text-white hover:bg-blue-800",
        variant === "outline" && "border border-slate-300 bg-white hover:bg-slate-50",
        variant === "ghost" && "hover:bg-slate-100",
        className
      )}
      {...props}
    />
  );
}
