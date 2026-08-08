import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const variants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-primary/10 text-primary",
      success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      warning: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
      destructive: "bg-destructive/10 text-destructive",
      secondary: "bg-muted text-muted-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof variants>) {
  return <span className={cn(variants({ variant }), className)} {...props} />;
}
