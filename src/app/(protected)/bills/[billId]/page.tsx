import { notFound } from "next/navigation";

import { BillDetailView } from "@/features/bills/components/bill-detail-view";
import { api } from "@/lib/api/server/api";
import { SYSTEM_PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/server-permissions";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const permissionState = await requirePermission(
    SYSTEM_PERMISSIONS.BILLS_READ,
  );
  const { billId } = await params;
  const bill = await api.bills.getById(billId);
  if (!bill.billId) notFound();

  return (
    <BillDetailView
      billId={billId}
      initialData={bill}
      canPublish={hasPermission(
        permissionState,
        SYSTEM_PERMISSIONS.BILLS_PUBLISH,
      )}
      canSendReminders={hasPermission(
        permissionState,
        SYSTEM_PERMISSIONS.BILLS_SEND_REMINDERS,
      )}
      canDelete={hasPermission(
        permissionState,
        SYSTEM_PERMISSIONS.BILLS_DELETE,
      )}
      canRecordPayment={hasPermission(
        permissionState,
        SYSTEM_PERMISSIONS.PAYMENTS_RECORD_MANUAL,
      )}
      canReadPayments={hasPermission(
        permissionState,
        SYSTEM_PERMISSIONS.PAYMENTS_READ,
      )}
      canCreatePayment={hasPermission(
        permissionState,
        SYSTEM_PERMISSIONS.PAYMENTS_CREATE,
      )}
    />
  );
}
