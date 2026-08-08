import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-border bg-card/55 hover:border-primary/25 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center transition-colors duration-200">
      <div className="bg-primary/10 mb-4 grid size-11 place-items-center rounded-2xl">
        <Inbox className="text-primary size-5" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-md text-sm">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
