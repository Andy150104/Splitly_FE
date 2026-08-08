"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "border-input bg-background hover:bg-muted/50 focus:border-primary/50 focus:ring-ring/35 flex h-11 w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-[border-color,box-shadow,background-color,transform] duration-150 outline-none focus:ring-2 disabled:opacity-50",
          isOpen && "border-primary/50 ring-ring/35 ring-2",
          "active:scale-[0.985] transform"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="bg-card text-foreground border-border shadow-2xl animate-expand absolute z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border p-1.5 backdrop-blur-md">
          <div className="flex flex-col gap-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange?.(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "hover:bg-primary/10 hover:text-primary flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all duration-150 active:scale-[0.98] outline-none focus-visible:bg-primary/10 focus-visible:text-primary",
                    isSelected && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <span className="truncate mr-2">{option.label}</span>
                  {isSelected && <Check className="text-primary size-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
