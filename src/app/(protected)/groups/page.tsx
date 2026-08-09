import { Plus } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { CreateGroupModal } from "@/features/groups/components/create-group-form";
import { GroupCard } from "@/features/groups/components/group-card";
import { api } from "@/lib/api/server/api";
import { toResult } from "@/lib/async-result";

export const metadata = { title: "Nhóm" };

export default async function GroupsPage() {
  const loaded = await toResult(
    api.groups.getAll({ pageNumber: 1, pageSize: 100 }),
  );

  if ("error" in loaded) {
    return (
      <div className="space-y-6">
        <PageHeader title="Nhóm" />
        <ErrorState
          message={
            loaded.error instanceof Error ? loaded.error.message : undefined
          }
        />
      </div>
    );
  }

  const groups = loaded.data.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhóm"
        description="Lưu các nhóm người thường xuyên chia chi phí cùng nhau."
        actions={<CreateGroupModal />}
      />

      {groups.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.groupId} group={group} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có nhóm nào"
          description="Tạo nhóm để nhanh chóng lưu danh sách thành viên và chia chi phí cho các hóa đơn sau."
          action={
            <CreateGroupModal
              trigger={
                <Button className="gap-2">
                  <Plus className="size-4" />
                  Tạo nhóm đầu tiên
                </Button>
              }
            />
          }
        />
      )}
    </div>
  );
}
