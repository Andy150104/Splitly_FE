import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group relative inline-flex cursor-pointer select-none items-center justify-center gap-2 overflow-hidden rounded-xl border border-transparent text-sm font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px active:scale-[0.985] disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-55 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-150 active:[&_svg]:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_rgb(0_0_0/0.10),0_7px_18px_color-mix(in_oklab,var(--primary)_20%,transparent)] hover:-translate-y-px hover:bg-primary/92 hover:shadow-[0_2px_4px_rgb(0_0_0/0.10),0_10px_24px_color-mix(in_oklab,var(--primary)_24%,transparent)] active:bg-primary/95 active:shadow-[0_1px_2px_rgb(0_0_0/0.10),0_3px_8px_color-mix(in_oklab,var(--primary)_16%,transparent)]",
        secondary:
          "border-border/70 bg-secondary text-secondary-foreground shadow-[0_1px_2px_rgb(0_0_0/0.05)] hover:-translate-y-px hover:bg-secondary/75 hover:shadow-sm active:bg-secondary/90",
        outline:
          "border-border bg-background text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.05)] hover:-translate-y-px hover:border-primary/30 hover:bg-primary/[0.045] hover:text-primary hover:shadow-sm active:bg-primary/[0.075]",
        ghost:
          "text-foreground hover:bg-muted hover:text-foreground active:bg-muted/80",
        destructive:
          "bg-destructive text-white shadow-[0_1px_2px_rgb(0_0_0/0.10),0_7px_18px_color-mix(in_oklab,var(--destructive)_18%,transparent)] hover:-translate-y-px hover:bg-destructive/90 hover:shadow-[0_2px_4px_rgb(0_0_0/0.10),0_10px_22px_color-mix(in_oklab,var(--destructive)_22%,transparent)] active:bg-destructive/95 active:shadow-sm",
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-10 rounded-lg px-3.5",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: React.ReactNode;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      data-loading={isLoading ? "true" : undefined}
      {...props}
    >
      {isLoading ? (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          {loadingText ? <span>{loadingText}</span> : null}
          {!loadingText ? <span className="sr-only">Đang xử lý…</span> : null}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export { buttonVariants };
