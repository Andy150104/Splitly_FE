import * as React from "react";

import { cn } from "@/lib/utils";

function toMoneyNumber(value: React.ComponentProps<"input">["value"]) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;

  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;

  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(value);
}

function getSmartMoneySuggestions(value: number | null, count = 4) {
  if (value === null || value <= 0 || !Number.isFinite(value)) return [];
  const baseValue: number = value;

  // Bank-style behavior for VND-like amounts:
  // 12  -> 12.000 / 120.000 / 1.200.000 / 12.000.000
  // 490 -> 490.000 / 4.900.000 / 49.000.000 / 490.000.000
  // Once the user already entered a real amount (>= 1.000), suggest the
  // next orders of magnitude instead of repeating the current amount.
  const multipliers =
    baseValue < 1_000
      ? [1_000, 10_000, 100_000, 1_000_000, 10_000_000]
      : [10, 100, 1_000, 10_000, 100_000];

  const suggestions: number[] = [];

  for (const multiplier of multipliers) {
    const amount = baseValue * multiplier;

    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount === baseValue ||
      suggestions.includes(amount)
    ) {
      continue;
    }

    suggestions.push(amount);
    if (suggestions.length >= Math.max(1, count)) break;
  }

  return suggestions;
}

export interface MoneyInputOptions {
  currency?: string;
  /**
   * Omit to use smart suggestions based on the number currently entered.
   * Pass an array to fully control suggestions, or false to hide them.
   */
  suggestions?: readonly number[] | false;
  suggestionCount?: number;
  onValueChange?: (value: number | "") => void;
}

export interface InputProps extends React.ComponentProps<"input"> {
  /**
   * Business-only money mode. Plain Input behavior is unchanged when omitted.
   */
  money?: MoneyInputOptions;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      money,
      value,
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [showMoneySuggestions, setShowMoneySuggestions] = React.useState(false);

    const baseClassName = cn(
      "border-input/90 bg-card/70 text-foreground placeholder:text-muted-foreground/60 caret-primary flex h-11 w-full rounded-[11px] border px-3.5 py-2 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.035),inset_0_1px_0_rgb(255_255_255/0.30)] outline-none transition-[border-color,box-shadow,background-color] duration-150 ease-out hover:border-foreground/15 hover:bg-card focus-visible:border-primary/70 focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted/45 disabled:text-muted-foreground disabled:opacity-70 dark:bg-background/45 dark:shadow-[0_1px_2px_rgb(0_0_0/0.18),inset_0_1px_0_rgb(255_255_255/0.025)] dark:hover:border-foreground/20 dark:hover:bg-background/60 dark:focus-visible:bg-background/65 aria-invalid:border-destructive aria-invalid:bg-destructive/[0.045] aria-invalid:ring-2 aria-invalid:ring-destructive/20 aria-invalid:shadow-[0_0_0_1px_color-mix(in_oklab,var(--destructive)_18%,transparent)] aria-invalid:hover:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-4 aria-invalid:focus-visible:ring-destructive/25 dark:aria-invalid:bg-destructive/[0.075] dark:aria-invalid:ring-destructive/25",
      className,
    );

    if (!money) {
      return (
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          className={baseClassName}
          {...props}
        />
      );
    }

    const numericValue = toMoneyNumber(value);
    const formattedValue = numericValue === null ? "" : formatMoney(numericValue);
    const currency = (money.currency || "VND").trim().toUpperCase();
    const suggestions =
      money.suggestions === false
        ? []
        : Array.isArray(money.suggestions)
          ? [...new Set(money.suggestions)].filter(
              (amount) =>
                Number.isSafeInteger(amount) &&
                amount > 0 &&
                amount !== numericValue,
            )
          : getSmartMoneySuggestions(numericValue, money.suggestionCount ?? 4);

    return (
      <div className="space-y-2.5">
        <div className="relative">
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            value={formattedValue}
            onFocus={(event) => {
              setShowMoneySuggestions(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setShowMoneySuggestions(false);
              onBlur?.(event);
            }}
            onChange={(event) => {
              const digits = event.currentTarget.value.replace(/[^\d]/g, "");
              const nextValue = digits ? Number(digits) : "";

              setShowMoneySuggestions(true);
              money.onValueChange?.(
                typeof nextValue === "number" && Number.isFinite(nextValue)
                  ? nextValue
                  : "",
              );
            }}
            className={cn(
              baseClassName,
              "pr-20 text-[15px] font-semibold tracking-[0.01em] tabular-nums",
            )}
            {...props}
          />
          <span
            aria-hidden="true"
            className="border-border/70 bg-muted/65 text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg border px-2 py-1 text-[11px] font-bold tracking-[0.08em] shadow-[0_1px_2px_rgb(15_23_42/0.035)] dark:bg-muted/30"
          >
            {currency}
          </span>
        </div>

        {showMoneySuggestions && suggestions.length ? (
          <div
            className="animate-expand flex flex-wrap items-center gap-1.5"
            aria-label="Gợi ý số tiền theo số đang nhập"
          >
            <span className="text-muted-foreground mr-0.5 text-[11px] font-medium">
              Có phải bạn muốn nhập?
            </span>
            {suggestions.map((amount) => (
              <button
                key={amount}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  money.onValueChange?.(amount);
                  setShowMoneySuggestions(false);
                }}
                className="border-border/70 bg-background/70 text-muted-foreground hover:border-primary/30 hover:bg-primary/[0.055] hover:text-primary focus-visible:ring-primary/20 min-h-8 rounded-lg border px-2.5 py-1 text-xs font-semibold tabular-nums shadow-[0_1px_2px_rgb(15_23_42/0.025)] outline-none transition-[color,background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-px focus-visible:ring-4 active:translate-y-0 dark:bg-background/35 dark:hover:bg-primary/[0.11]"
              >
                {formatMoney(amount)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
