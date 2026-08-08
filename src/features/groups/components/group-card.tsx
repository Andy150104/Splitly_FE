import { ArrowRight, FileText, UsersRound } from "lucide-react";
import Link from "next/link";

import type { BillSplitServiceApplicationFeaturesGroupsListGroupsListGroupsHandlerItem as GroupItem } from "@/generated/api/models";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function GroupCard({ group }: { group: GroupItem }) {
  return (
    <Card className="group hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgb(15_23_42/0.08)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="bg-primary/10 text-primary grid size-11 place-items-center rounded-2xl transition-transform duration-200 group-hover:scale-105">
            <UsersRound className="size-5" />
          </div>
          <Badge variant={group.status === "Active" ? "success" : "secondary"}>
            {group.status === "Active" ? "Đang hoạt động" : group.status}
          </Badge>
        </div>
        <h3 className="mt-5 truncate text-lg font-semibold">
          {group.name || "Nhóm chưa đặt tên"}
        </h3>
        <p className="text-muted-foreground mt-1 text-xs">
          Vai trò: {group.role === "Owner" ? "Chủ nhóm" : "Thành viên"}
        </p>
        <div className="text-muted-foreground mt-5 flex gap-5 text-sm">
          <span className="flex items-center gap-1.5">
            <UsersRound className="size-4" />
            {group.memberCount ?? 0} người
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="size-4" />
            {group.billCount ?? 0} hóa đơn
          </span>
        </div>
        {group.groupId ? (
          <Link
            href={`/groups/${group.groupId}`}
            className="border-border text-primary mt-5 flex min-h-10 items-center justify-between border-t pt-4 text-sm font-semibold"
          >
            Xem nhóm{" "}
            <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-1" />
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
