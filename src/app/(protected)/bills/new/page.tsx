import { PageHeader } from "@/components/common/page-header";
import { CreateBillFlow } from "@/features/bills/components/create-bill/create-bill-flow";
import { api } from "@/lib/api/server/api";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Tạo hóa đơn" };

export default async function NewBillPage() {
  const [groups, user] = await Promise.all([api.groups.getAll({ pageNumber: 1, pageSize: 100 }), getCurrentUser()]);
  return <div className="space-y-7"><PageHeader title="Tạo hóa đơn" description="Một luồng rõ ràng từ thông tin khoản chi đến chia tiền và công bố." /><CreateBillFlow groups={groups.items ?? []} ownerEmail={user?.email ?? ""} /></div>;
}
