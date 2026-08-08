"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

export function Progress({
  value = 0,
  className,
}: {
  value?: number;
  className?: string;
}) {
  return (
    <ProgressPrimitive.Root
      className={cn(
        "bg-muted relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      value={value}
    >
      <ProgressPrimitive.Indicator
        className="from-primary/80 to-primary h-full bg-gradient-to-r transition-transform duration-500 ease-out"
        style={{
          transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)`,
        }}
      />
    </ProgressPrimitive.Root>
  );
}
