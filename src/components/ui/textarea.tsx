import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "border-input bg-background placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:bg-card focus-visible:ring-ring/35 flex min-h-24 w-full rounded-xl border px-3 py-2 text-sm transition-[border-color,box-shadow,background-color] duration-150 outline-none focus-visible:ring-2 disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
