import { CircleAlert } from "lucide-react";

export function ErrorState({ message = "Không thể tải dữ liệu. Vui lòng thử lại." }: { message?: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 text-center">
      <CircleAlert className="mb-3 size-6 text-destructive" />
      <p className="font-medium">Đã có sự cố</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
