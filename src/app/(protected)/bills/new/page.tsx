import { PageHeader } from "@/components/common/page-header";
import { CreateBillFlow } from "@/features/bills/components/create-bill/create-bill-flow";
import { api } from "@/lib/api/server/api";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Tạo hóa đơn" };

export default async function NewBillPage() {
  const [groups, user] = await Promise.all([
    api.groups.getAll({ pageNumber: 1, pageSize: 100 }),
    getCurrentUser(),
  ]);

  return (
    <div className="relative mx-auto flex w-full max-w-[1560px] flex-col lg:h-[calc(100dvh-6rem)] lg:min-h-0">
      <div
        aria-hidden="true"
        className="bg-primary/[0.035] pointer-events-none absolute -top-28 left-1/2 -z-10 h-72 w-[72%] -translate-x-1/2 rounded-full blur-3xl dark:bg-primary/[0.025]"
      />
      <div className="relative flex min-h-0 flex-1 flex-col gap-3">
        <PageHeader
          compact
          title="Tạo hóa đơn"
          description="Thiết lập khoản chi, chọn người tham gia và chia tiền trong vài bước."
          actions={
            <span className="border-border/70 bg-card/70 text-muted-foreground rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[0_1px_2px_rgb(15_23_42/0.035)] dark:bg-card/45">
              Quy trình 4 bước
            </span>
          }
        />
        <CreateBillFlow
          groups={groups.items ?? []}
          ownerEmail={user?.email ?? ""}
        />
      </div>
    </div>
  );
}
