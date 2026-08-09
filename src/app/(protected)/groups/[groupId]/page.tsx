import { FileText, UsersRound, WalletCards } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BillStatusBadge } from "@/features/bills/components/bill-status-badge";
import {
  AddGroupMembers,
  CloseGroupButton,
  RemoveGroupMember,
} from "@/features/groups/components/group-actions";
import { api } from "@/lib/api/server/api";
import { formatCurrency } from "@/lib/formatters/currency";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const group = await api.groups.getById(groupId);
  if (!group.groupId) notFound();

  const members = group.members ?? [];
  const bills = group.bills ?? [];
  const activeMembers = members.filter((member) => member.status === "Active").length;
  const publishedBills = bills.filter((bill) => bill.status !== "Draft").length;
  const totalValue = bills.reduce((sum, bill) => sum + (bill.totalAmount ?? 0), 0);
  const currency = bills[0]?.currency ?? "VND";
  const formattedTotalValue = formatCurrency(totalValue, currency);

  return (
    <div className="animate-page-enter space-y-5 lg:space-y-6">
      <PageHeader
        title={group.name || "Chi tiết nhóm"}
        description={
          group.description ||
          "Quản lý thành viên và các hóa đơn thuộc nhóm này."
        }
        actions={
          group.isOwner && group.status === "Active" ? (
            <CloseGroupButton groupId={groupId} />
          ) : undefined
        }
      />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b border-border/75 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={group.status === "Active" ? "success" : "secondary"}>
                {group.status}
              </Badge>
              {group.isOwner ? <Badge variant="default">Chủ nhóm</Badge> : null}
            </div>
            <p className="text-muted-foreground text-sm">
              {group.status === "Active"
                ? "Nhóm đang hoạt động và có thể nhận thành viên, hóa đơn mới."
                : "Nhóm hiện không nhận thêm thành viên hoặc hóa đơn mới."}
            </p>
          </div>

          <div className="grid divide-y divide-border/75 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <OverviewMetric
              icon={UsersRound}
              label="Thành viên"
              value={`${members.length}`}
              helper={`${activeMembers} đang hoạt động`}
            />
            <OverviewMetric
              icon={FileText}
              label="Hóa đơn"
              value={`${bills.length}`}
              helper={`${publishedBills} đã công bố`}
            />
            <OverviewMetric
              icon={WalletCards}
              label="Tổng giá trị"
              value={formattedTotalValue}
              helper="Tất cả hóa đơn trong nhóm"
              title={formattedTotalValue}
            />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/75 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Thành viên</CardTitle>
                <CardDescription className="mt-1.5">
                  {members.length} thành viên trong nhóm.
                </CardDescription>
              </div>
              {group.isOwner && group.status === "Active" ? (
                <AddGroupMembers groupId={groupId} />
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {members.length ? (
              <div className="divide-y divide-border/70">
                {members.map((member) => (
                  <div
                    key={member.memberId}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/25 sm:flex-row sm:items-center sm:px-6"
                  >
                    <div className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold">
                      {(member.name || member.email || "U")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {member.name || member.email}
                      </p>
                      <p className="text-muted-foreground truncate text-xs sm:text-sm">
                        {member.email}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Badge
                        variant={
                          member.role === "Owner"
                            ? "default"
                            : member.status === "Active"
                              ? "success"
                              : "warning"
                        }
                      >
                        {member.role === "Owner" ? "Chủ nhóm" : member.status}
                      </Badge>

                      {group.isOwner && member.role !== "Owner" && member.memberId ? (
                        <RemoveGroupMember
                          groupId={groupId}
                          memberId={member.memberId}
                          memberName={member.name || member.email || undefined}
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptySection
                title="Chưa có thành viên"
                description="Thêm thành viên để bắt đầu chia hóa đơn trong nhóm."
              />
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/75 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Hóa đơn</CardTitle>
                <CardDescription className="mt-1.5">
                  Các hóa đơn thuộc nhóm này.
                </CardDescription>
              </div>
              <Badge variant="secondary">{bills.length}</Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {bills.length ? (
              <div className="divide-y divide-border/70">
                {bills.map((bill) => {
                  const amount = formatCurrency(
                    bill.totalAmount,
                    bill.currency ?? "VND",
                  );

                  return (
                    <Link
                      key={bill.billId}
                      href={`/bills/${bill.billId}`}
                      className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/25 sm:px-6"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {bill.title || "Hóa đơn chưa đặt tên"}
                        </p>
                        <div className="mt-2">
                          <BillStatusBadge status={bill.status} />
                        </div>
                      </div>
                      <div className="min-w-0 max-w-[45%] text-right">
                        <p className="money truncate text-sm font-semibold" title={amount}>
                          {amount}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs group-hover:text-foreground">
                          Xem chi tiết
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptySection
                title="Chưa có hóa đơn"
                description="Hóa đơn mới của nhóm sẽ xuất hiện tại đây."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function OverviewMetric({
  icon: Icon,
  label,
  value,
  helper,
  title,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
  helper: string;
  title?: string;
}) {
  return (
    <div className="min-w-0 px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center gap-2">
        <Icon className="text-primary size-4" />
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p
        className="money mt-2 truncate text-xl font-semibold tracking-tight sm:text-2xl"
        title={title}
      >
        {value}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">{helper}</p>
    </div>
  );
}

function EmptySection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );
}
