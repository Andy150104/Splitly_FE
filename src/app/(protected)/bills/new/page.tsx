import { PageHeader } from "@/components/common/page-header";
import { CreateBillFlow } from "@/features/bills/components/create-bill/create-bill-flow";
import { api } from "@/lib/api/server/api";
import { getCurrentUser } from "@/lib/auth/session";
import { SYSTEM_PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/server-permissions";

export const metadata = { title: "Tạo hóa đơn" };

export default async function NewBillPage() {
  const permissionState = await requirePermission(
    SYSTEM_PERMISSIONS.BILLS_CREATE,
  );
  const canReadGroups = hasPermission(
    permissionState,
    SYSTEM_PERMISSIONS.GROUPS_READ,
  );
  const [groups, user] = await Promise.all([
    canReadGroups
      ? api.groups.getAll({ pageNumber: 1, pageSize: 100 })
      : Promise.resolve({ items: [] }),
    getCurrentUser(),
  ]);

  return (
    <div className="relative mx-auto flex w-full max-w-[1560px] flex-col lg:h-[calc(100dvh-6rem)] lg:min-h-0">
      <div
        aria-hidden="true"
        className="bg-primary/[0.035] dark:bg-primary/[0.025] pointer-events-none absolute -top-28 left-1/2 -z-10 h-72 w-[72%] -translate-x-1/2 rounded-full blur-3xl"
      />
      <div className="relative flex min-h-0 flex-1 flex-col gap-3">
        <PageHeader
          compact
          title="Tạo hóa đơn"
          description="Thiết lập khoản chi, chọn người tham gia và chia tiền trong vài bước."
          actions={
            <span className="border-border/70 bg-card/70 text-muted-foreground dark:bg-card/45 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[0_1px_2px_rgb(15_23_42/0.035)]">
              Quy trình 4 bước
            </span>
          }
        />
        <CreateBillFlow
          groups={groups.items ?? []}
          ownerEmail={user?.email ?? ""}
          capabilities={{
            canUpdate: hasPermission(
              permissionState,
              SYSTEM_PERMISSIONS.BILLS_UPDATE,
            ),
            canManageMembers: hasPermission(
              permissionState,
              SYSTEM_PERMISSIONS.BILLS_MANAGE_MEMBERS,
            ),
            canCalculate: hasPermission(
              permissionState,
              SYSTEM_PERMISSIONS.BILLS_CALCULATE,
            ),
            canPublish: hasPermission(
              permissionState,
              SYSTEM_PERMISSIONS.BILLS_PUBLISH,
            ),
            canReadPayoutAccounts: hasPermission(
              permissionState,
              SYSTEM_PERMISSIONS.PAYOUT_ACCOUNTS_READ,
            ),
            canCreatePayoutAccounts: hasPermission(
              permissionState,
              SYSTEM_PERMISSIONS.PAYOUT_ACCOUNTS_CREATE,
            ),
            canReadBanks: hasPermission(
              permissionState,
              SYSTEM_PERMISSIONS.BANKS_READ,
            ),
          }}
        />
      </div>
    </div>
  );
}
