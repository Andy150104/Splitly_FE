import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:scale-100 disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_rgb(0_0_0/0.08),0_6px_16px_color-mix(in_oklab,var(--primary)_18%,transparent)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_2px_4px_rgb(0_0_0/0.08),0_10px_22px_color-mix(in_oklab,var(--primary)_22%,transparent)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/75",
        outline:
          "border border-border bg-background shadow-sm hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted",
        ghost: "hover:bg-muted hover:text-foreground",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3",
        lg: "h-12 px-6",
        icon: "size-10",
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
}

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
