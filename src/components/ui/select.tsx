"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const EMPTY_VALUE = "__splitly_empty_value__";

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
  invalid?: boolean;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  className,
  invalid = false,
  disabled = false,
}: SelectProps) {
  const radixValue = value === "" ? EMPTY_VALUE : value;

  return (
    <SelectPrimitive.Root
      value={radixValue}
      onValueChange={(nextValue) =>
        onChange?.(nextValue === EMPTY_VALUE ? "" : nextValue)
      }
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        aria-invalid={invalid || undefined}
        className={cn(
          "group/select border-input/90 bg-card/70 text-foreground data-[placeholder]:text-muted-foreground/65 flex h-11 w-full select-none items-center justify-between gap-3 rounded-[11px] border px-3.5 py-2 text-sm shadow-[0_1px_2px_rgb(15_23_42/0.035),inset_0_1px_0_rgb(255_255_255/0.30)] outline-none transition-[border-color,box-shadow,background-color,transform] duration-150 ease-out hover:border-foreground/15 hover:bg-card focus-visible:border-primary/70 focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-primary/15 data-[state=open]:border-primary/70 data-[state=open]:bg-card data-[state=open]:ring-4 data-[state=open]:ring-primary/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/45 disabled:text-muted-foreground disabled:opacity-70 dark:bg-background/45 dark:shadow-[0_1px_2px_rgb(0_0_0/0.18),inset_0_1px_0_rgb(255_255_255/0.025)] dark:hover:border-foreground/20 dark:hover:bg-background/60 dark:focus-visible:bg-background/65 dark:data-[state=open]:bg-background/65",
          invalid &&
            "border-destructive bg-destructive/[0.045] ring-2 ring-destructive/20 shadow-[0_0_0_1px_color-mix(in_oklab,var(--destructive)_18%,transparent)] hover:border-destructive focus-visible:border-destructive focus-visible:ring-4 focus-visible:ring-destructive/25 data-[state=open]:border-destructive data-[state=open]:ring-destructive/25 dark:bg-destructive/[0.075] dark:ring-destructive/25",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <span
            className={cn(
              "bg-muted/70 text-muted-foreground grid size-7 shrink-0 place-items-center rounded-lg transition-[background-color,color,transform] duration-150",
              "group-data-[state=open]/select:bg-primary/10 group-data-[state=open]/select:text-primary",
              invalid && "bg-destructive/10 text-destructive",
            )}
          >
            <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]/select:rotate-180" />
          </span>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          avoidCollisions
          className={cn(
            "border-border/80 bg-card text-card-foreground animate-expand z-[100] min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border shadow-[0_18px_50px_rgb(15_23_42/0.16),0_4px_12px_rgb(15_23_42/0.07)]",
            "data-[side=top]:origin-bottom data-[side=bottom]:origin-top",
            "dark:border-border dark:bg-card dark:shadow-[0_22px_60px_rgb(0_0_0/0.55)]",
          )}
        >
          <SelectPrimitive.ScrollUpButton className="text-muted-foreground flex h-7 cursor-default items-center justify-center bg-card">
            <ChevronUp className="size-4" />
          </SelectPrimitive.ScrollUpButton>

          <SelectPrimitive.Viewport
            className="p-1.5"
            style={{
              width: "var(--radix-select-trigger-width)",
              maxHeight:
                "min(18rem, var(--radix-select-content-available-height))",
            }}
          >
            {options.map((option) => {
              const itemValue = option.value === "" ? EMPTY_VALUE : option.value;

              return (
                <SelectPrimitive.Item
                  key={option.value || EMPTY_VALUE}
                  value={itemValue}
                  className={cn(
                    "text-foreground data-[highlighted]:bg-primary/[0.07] data-[highlighted]:text-primary relative flex min-h-10 w-full cursor-default select-none items-center rounded-lg py-2 pr-10 pl-3 text-sm outline-none transition-colors duration-100",
                    "data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary data-[state=checked]:font-semibold dark:data-[state=checked]:bg-primary/15",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
                  )}
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2.5 grid size-5 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
                    <Check className="size-3" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              );
            })}
          </SelectPrimitive.Viewport>

          <SelectPrimitive.ScrollDownButton className="text-muted-foreground flex h-7 cursor-default items-center justify-center bg-card">
            <ChevronDown className="size-4" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
