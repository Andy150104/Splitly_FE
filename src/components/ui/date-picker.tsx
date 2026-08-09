"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function parseIsoDate(value?: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value?: string) {
  const date = parseIsoDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getCalendarDays(viewDate: Date) {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export interface DatePickerProps {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  clearable?: boolean;
  invalid?: boolean;
}

export function DatePicker({
  id,
  name,
  value,
  onChange,
  placeholder = "Chọn ngày",
  disabled = false,
  className,
  clearable = true,
  invalid = false,
}: DatePickerProps) {
  const selectedDate = parseIsoDate(value);
  const [open, setOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(
    () => selectedDate ?? new Date(),
  );

  const days = React.useMemo(() => getCalendarDays(viewDate), [viewDate]);
  const today = new Date();

  function changeMonth(offset: number) {
    setViewDate(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  function selectDate(date: Date) {
    onChange?.(toIsoDate(date));
    setOpen(false);
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen && selectedDate) {
          setViewDate(selectedDate);
        }
        setOpen(nextOpen);
      }}
    >
      <div className={cn("relative", className)}>
        {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
        <PopoverPrimitive.Trigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            data-invalid={invalid || undefined}
            className={cn(
              "border-input/90 bg-card/70 text-foreground flex h-11 w-full items-center gap-3 rounded-[11px] border px-3.5 text-left text-sm shadow-[0_1px_2px_rgb(15_23_42/0.035),inset_0_1px_0_rgb(255_255_255/0.30)] outline-none transition-[border-color,box-shadow,background-color] duration-150 ease-out hover:border-foreground/15 hover:bg-card focus-visible:border-primary/70 focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted/45 disabled:text-muted-foreground disabled:opacity-70 dark:bg-background/45 dark:shadow-[0_1px_2px_rgb(0_0_0/0.18),inset_0_1px_0_rgb(255_255_255/0.025)] dark:hover:border-foreground/20 dark:hover:bg-background/60 dark:focus-visible:bg-background/65",
              value && clearable && !disabled && "pr-11",
              open && !invalid && "border-primary/70 bg-card ring-4 ring-primary/15 dark:bg-background/65",
              invalid &&
                "border-destructive bg-destructive/[0.045] ring-2 ring-destructive/20 shadow-[0_0_0_1px_color-mix(in_oklab,var(--destructive)_18%,transparent)] hover:border-destructive focus-visible:border-destructive focus-visible:ring-4 focus-visible:ring-destructive/25 dark:bg-destructive/[0.075] dark:ring-destructive/25",
            )}
          >
            <CalendarDays className="text-muted-foreground size-4 shrink-0" />
            <span
              className={cn(
                "min-w-0 flex-1 truncate tabular-nums",
                !value && "text-muted-foreground/70",
              )}
            >
              {value ? formatDate(value) : placeholder}
            </span>
          </button>
        </PopoverPrimitive.Trigger>
        {value && clearable && !disabled ? (
          <button
            type="button"
            aria-label="Xóa ngày đã chọn"
            className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary/20 absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-lg outline-none transition-[color,background-color,transform] duration-150 hover:scale-105 focus-visible:ring-4 active:scale-95"
            onClick={() => onChange?.("")}
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="border-border/80 bg-card/98 text-card-foreground z-50 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border p-3 shadow-[0_22px_60px_rgb(15_23_42/0.16),0_4px_14px_rgb(15_23_42/0.08)] outline-none backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out dark:border-border dark:bg-card dark:shadow-[0_24px_70px_rgb(0_0_0/0.52),0_6px_18px_rgb(0_0_0/0.24)]"
        >
          <div className="flex items-center justify-between px-1 pb-3">
            <button
              type="button"
              aria-label="Tháng trước"
              onClick={() => changeMonth(-1)}
              className="border-border/60 bg-background/55 text-muted-foreground hover:border-primary/20 hover:bg-primary/[0.06] hover:text-primary focus-visible:ring-primary/20 grid size-9 place-items-center rounded-xl border outline-none transition-[color,background-color,border-color,transform] duration-150 hover:-translate-y-px focus-visible:ring-4 active:translate-y-0"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold capitalize">
                {new Intl.DateTimeFormat("vi-VN", {
                  month: "long",
                  year: "numeric",
                }).format(viewDate)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                Chọn ngày cho hóa đơn
              </p>
            </div>
            <button
              type="button"
              aria-label="Tháng sau"
              onClick={() => changeMonth(1)}
              className="border-border/60 bg-background/55 text-muted-foreground hover:border-primary/20 hover:bg-primary/[0.06] hover:text-primary focus-visible:ring-primary/20 grid size-9 place-items-center rounded-xl border outline-none transition-[color,background-color,border-color,transform] duration-150 hover:-translate-y-px focus-visible:ring-4 active:translate-y-0"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 px-1" aria-hidden="true">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className="text-muted-foreground grid h-8 place-items-center text-[11px] font-semibold"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 px-1" role="grid">
            {days.map((date) => {
              const inCurrentMonth = date.getMonth() === viewDate.getMonth();
              const selected = selectedDate ? isSameDay(date, selectedDate) : false;
              const isToday = isSameDay(date, today);

              return (
                <button
                  key={toIsoDate(date)}
                  type="button"
                  role="gridcell"
                  aria-selected={selected}
                  aria-label={new Intl.DateTimeFormat("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(date)}
                  onClick={() => selectDate(date)}
                  className={cn(
                    "focus-visible:ring-primary/25 relative grid size-9 place-items-center rounded-[10px] text-sm tabular-nums outline-none transition-[color,background-color,box-shadow,transform] duration-150 hover:bg-primary/[0.08] hover:text-primary focus-visible:ring-4 active:scale-95 dark:hover:bg-primary/[0.14]",
                    !inCurrentMonth && "text-muted-foreground/45",
                    isToday && !selected && "text-primary font-semibold",
                    isToday && !selected &&
                      "after:border-primary/55 after:absolute after:bottom-1 after:size-1 after:rounded-full after:border",
                    selected &&
                      "bg-primary text-primary-foreground font-semibold shadow-[0_5px_16px_color-mix(in_oklab,var(--primary)_30%,transparent)] hover:bg-primary hover:text-primary-foreground dark:shadow-[0_6px_18px_color-mix(in_oklab,var(--primary)_20%,transparent)]",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="border-border/70 mt-3 flex items-center justify-between border-t px-1 pt-3">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setViewDate(now);
                selectDate(now);
              }}
              className="text-primary hover:bg-primary/8 focus-visible:ring-primary/20 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-4"
            >
              Hôm nay
            </button>
            {clearable && value ? (
              <button
                type="button"
                onClick={() => {
                  onChange?.("");
                  setOpen(false);
                }}
                className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary/20 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-4"
              >
                Xóa ngày
              </button>
            ) : null}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
