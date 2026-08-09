import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  compact = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" : "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"}>
      <div className="min-w-0">
        <h1
          className={
            compact
              ? "text-2xl font-bold tracking-[-0.03em] sm:text-[1.7rem]"
              : "text-[1.75rem] font-bold tracking-[-0.025em] sm:text-3xl"
          }
        >
          {title}
        </h1>
        {description ? (
          <p
            className={
              compact
                ? "text-muted-foreground mt-1 max-w-3xl text-sm leading-5"
                : "text-muted-foreground mt-1.5 max-w-3xl text-sm leading-6"
            }
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
