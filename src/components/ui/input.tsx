import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "border-input bg-background placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:bg-card focus-visible:ring-ring/35 flex h-11 w-full rounded-xl border px-3 py-2 text-sm transition-[border-color,box-shadow,background-color] duration-150 outline-none focus-visible:ring-2 disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
