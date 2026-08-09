import { notFound } from "next/navigation";

import { BillDetailView } from "@/features/bills/components/bill-detail-view";
import { api } from "@/lib/api/server/api";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = await params;
  const bill = await api.bills.getById(billId);
  if (!bill.billId) notFound();

  return <BillDetailView billId={billId} initialData={bill} />;
}
