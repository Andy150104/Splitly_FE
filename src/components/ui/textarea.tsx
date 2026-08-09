import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "border-input/90 bg-card/70 text-foreground placeholder:text-muted-foreground/60 caret-primary flex min-h-28 w-full resize-y rounded-[11px] border px-3.5 py-3 text-sm leading-6 shadow-[0_1px_2px_rgb(15_23_42/0.035),inset_0_1px_0_rgb(255_255_255/0.30)] outline-none transition-[border-color,box-shadow,background-color] duration-150 ease-out hover:border-foreground/15 hover:bg-card focus-visible:border-primary/70 focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:resize-none disabled:bg-muted/45 disabled:text-muted-foreground disabled:opacity-70 dark:bg-background/45 dark:shadow-[0_1px_2px_rgb(0_0_0/0.18),inset_0_1px_0_rgb(255_255_255/0.025)] dark:hover:border-foreground/20 dark:hover:bg-background/60 dark:focus-visible:bg-background/65 aria-invalid:border-destructive aria-invalid:bg-destructive/[0.045] aria-invalid:ring-2 aria-invalid:ring-destructive/20 aria-invalid:shadow-[0_0_0_1px_color-mix(in_oklab,var(--destructive)_18%,transparent)] aria-invalid:hover:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-4 aria-invalid:focus-visible:ring-destructive/25 dark:aria-invalid:bg-destructive/[0.075] dark:aria-invalid:ring-destructive/25",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
