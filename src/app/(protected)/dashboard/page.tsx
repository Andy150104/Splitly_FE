import {
  ArrowRight,
  FileClock,
  HandCoins,
  Plus,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BillList } from "@/features/bills/components/bill-list";
import { api } from "@/lib/api/server/api";
import { formatCurrency } from "@/lib/formatters/currency";
import { toResult } from "@/lib/async-result";

export const metadata = { title: "Tổng quan" };

export default async function DashboardPage() {
  const loaded = await toResult(
    Promise.all([
      api.bills.getAll({ owed: false, pageNumber: 1, pageSize: 6 }),
      api.bills.getAll({ owed: true, pageNumber: 1, pageSize: 100 }),
      api.groups.getAll({ pageNumber: 1, pageSize: 100 }),
    ]),
  );
  if ("error" in loaded) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Tổng quan"
          description="Không thể lấy dữ liệu mới nhất từ backend."
        />
        <ErrorState
          message={
            loaded.error instanceof Error ? loaded.error.message : undefined
          }
        />
      </div>
    );
  }
  const [owned, owed, groups] = loaded.data;
  const ownedItems = owned.items ?? [];
  const owedItems = owed.items ?? [];
  const remainingToCollect = ownedItems.reduce(
    (sum, item) => sum + (item.remainingAmount ?? 0),
    0,
  );
  const amountYouOwe = owedItems.reduce(
    (sum, item) => sum + (item.remainingAmount ?? 0),
    0,
  );
  const pending = ownedItems.filter(
    (item) => !["Paid", "Cancelled"].includes(item.status ?? ""),
  ).length;
  const metrics = [
    {
      label: "Còn chờ thu",
      value: formatCurrency(remainingToCollect),
      icon: HandCoins,
      tone: "text-blue-600 bg-blue-500/10",
    },
    {
      label: "Bạn cần trả",
      value: formatCurrency(amountYouOwe),
      icon: FileClock,
      tone: "text-amber-600 bg-amber-500/10",
    },
    {
      label: "Hóa đơn đang mở",
      value: String(pending),
      icon: FileClock,
      tone: "text-violet-600 bg-violet-500/10",
    },
    {
      label: "Nhóm đang tham gia",
      value: String(groups.totalCount ?? groups.items?.length ?? 0),
      icon: UsersRound,
      tone: "text-emerald-600 bg-emerald-500/10",
    },
  ];
  return (
    <div className="space-y-8">
      <PageHeader
        title="Tổng quan"
        description="Nhìn nhanh các khoản đang chờ và tiếp tục công việc quan trọng nhất."
        actions={
          <Button asChild>
            <Link href="/bills/new">
              <Plus className="size-4" />
              Tạo hóa đơn
            </Link>
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className="group hover:border-primary/25 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgb(15_23_42/0.07)]"
          >
            <CardContent className="p-5">
              <div
                className={`mb-4 grid size-10 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${metric.tone}`}
              >
                <metric.icon className="size-5" />
              </div>
              <p className="text-muted-foreground text-sm">{metric.label}</p>
              <p className="money mt-1 text-2xl font-bold tracking-tight">
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">Hóa đơn gần đây</h2>
            <p className="text-muted-foreground text-sm">
              Các hóa đơn bạn tạo và đang theo dõi.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/bills">
              Xem tất cả <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <BillList bills={ownedItems} />
      </section>
    </div>
  );
}
