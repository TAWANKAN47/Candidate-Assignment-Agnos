"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { selectTriggerClassName } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ComboboxOption = { value: string; label: string };

export function Combobox({
  id,
  labelId,
  errorId,
  value,
  options,
  placeholder,
  searchable = true,
  disabled,
  invalid,
  onChange
}: {
  id?: string;
  labelId?: string;
  errorId?: string;
  value: string;
  options: readonly ComboboxOption[];
  placeholder: string;
  searchable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = `${id || "combobox"}-listbox`;
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return text ? options.filter((option) => option.label.toLowerCase().includes(text)) : options;
  }, [options, query]);
  const activeOptionId = open && filtered[activeIndex] ? `${listboxId}-${filtered[activeIndex].value}` : undefined;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function choose(next: ComboboxOption) {
    onChange(next.value);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative w-full" ref={rootRef}>
      <button
        id={id}
        type="button"
        role="combobox"
        data-invalid={invalid}
        aria-controls={open ? listboxId : undefined}
        aria-describedby={errorId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelId}
        aria-label={labelId ? undefined : placeholder}
        aria-activedescendant={activeOptionId}
        aria-invalid={invalid}
        disabled={disabled}
        className={cn(selectTriggerClassName, "relative flex items-center")}
        onClick={() => !disabled && setOpen((next) => !next)}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            setOpen(true);
          }
          if (open && !searchable && event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
          }
          if (open && !searchable && event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          }
          if (open && !searchable && event.key === "Enter" && filtered[activeIndex]) {
            event.preventDefault();
            choose(filtered[activeIndex]);
          }
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <span className={cn("truncate", !selected && "text-slate-400")}>{selected?.label || placeholder}</span>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 shrink-0 text-slate-500"
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-slate-200 bg-white p-2 shadow-lg">
          {searchable && (
            <Input
              autoFocus
              id={id ? `${id}-search` : undefined}
              role="combobox"
              value={query}
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-describedby={errorId}
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-labelledby={labelId}
              aria-label={labelId ? undefined : placeholder}
              aria-activedescendant={activeOptionId}
              aria-invalid={invalid}
              disabled={disabled}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex((index) => Math.max(index - 1, 0));
                }
                if (event.key === "Enter" && filtered[activeIndex]) {
                  event.preventDefault();
                  choose(filtered[activeIndex]);
                }
                if (event.key === "Escape") setOpen(false);
              }}
              placeholder={placeholder}
            />
          )}
          <div id={listboxId} role="listbox" className={cn("max-h-56 overflow-auto", searchable && "mt-2")}>
            {filtered.map((option, index) => (
              <button
                id={`${listboxId}-${option.value}`}
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={cn(
                  "block w-full rounded px-3 py-2 text-left text-sm text-slate-800 hover:bg-blue-50",
                  option.value === value && "font-semibold text-blue-700",
                  index === activeIndex && "bg-blue-50"
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
