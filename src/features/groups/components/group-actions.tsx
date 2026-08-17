"use client";

import { AlertTriangle, Trash2, UserPlus2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bffFetch } from "@/lib/http/browser-http-client";

export function AddGroupMembers({
  groupId,
  allowed,
}: {
  groupId: string;
  allowed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const emails = useMemo(
    () =>
      value
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    [value],
  );

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        disabled={!allowed}
        title={!allowed ? "Bạn chưa có quyền Groups.ManageMembers" : undefined}
      >
        <UserPlus2 className="size-4" />
        Thêm thành viên
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!emails.length) return;

              setPending(true);
              try {
                const result = await bffFetch<{
                  addedCount?: number;
                  pendingAccountCount?: number;
                }>(`/api/groups/${groupId}/members`, {
                  method: "POST",
                  body: JSON.stringify({ emails }),
                });
                toast.success(
                  `Đã thêm ${result.addedCount ?? emails.length} thành viên`,
                );
                setValue("");
                setOpen(false);
                router.refresh();
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Không thể thêm thành viên.",
                );
              } finally {
                setPending(false);
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Thêm thành viên</DialogTitle>
              <DialogDescription>
                Nhập một hoặc nhiều email. Email chưa có tài khoản sẽ được tạo ở
                trạng thái Pending.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-2">
              <Label htmlFor="group-member-emails">Email thành viên</Label>
              <Textarea
                id="group-member-emails"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={"anna@example.com\nminh@example.com"}
                className="min-h-28"
                autoFocus
              />
              <div className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
                <span>Phân tách bằng dấu phẩy, chấm phẩy hoặc xuống dòng.</span>
                <span className="shrink-0 font-medium">
                  {emails.length} email
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                isLoading={pending}
                loadingText="Đang thêm…"
                disabled={!emails.length}
              >
                <UserPlus2 className="size-4" />
                Thêm thành viên
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RemoveGroupMember({
  groupId,
  memberId,
  memberName,
  allowed,
}: {
  groupId: string;
  memberId: string;
  memberName?: string;
  allowed: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Xóa thành viên"
        isLoading={pending}
        disabled={!allowed}
        title={!allowed ? "Bạn chưa có quyền Groups.ManageMembers" : undefined}
        onClick={() => setOpen(true)}
        className="hover:bg-destructive/8 hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa thành viên?</DialogTitle>
            <DialogDescription>
              {memberName ? (
                <>
                  <strong className="text-foreground">{memberName}</strong> sẽ
                  bị xóa khỏi nhóm. Lịch sử hóa đơn đã phát sinh vẫn được giữ
                  lại.
                </>
              ) : (
                "Thành viên sẽ bị xóa khỏi nhóm. Lịch sử hóa đơn đã phát sinh vẫn được giữ lại."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="border-destructive/15 bg-destructive/[0.055] mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm">
            <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
            <p className="text-muted-foreground leading-6">
              Thao tác này ảnh hưởng đến danh sách thành viên hiện tại của nhóm.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              isLoading={pending}
              loadingText="Đang xóa…"
              onClick={async () => {
                setPending(true);
                try {
                  await bffFetch(`/api/groups/${groupId}/members/${memberId}`, {
                    method: "DELETE",
                  });
                  toast.success("Đã xóa thành viên khỏi nhóm");
                  setOpen(false);
                  router.refresh();
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Không thể xóa thành viên.",
                  );
                } finally {
                  setPending(false);
                }
              }}
            >
              Xóa thành viên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CloseGroupButton({
  groupId,
  allowed,
}: {
  groupId: string;
  allowed: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button
        variant="outline"
        isLoading={pending}
        loadingText="Đang đóng…"
        disabled={!allowed}
        title={!allowed ? "Bạn chưa có quyền Groups.Delete" : undefined}
        onClick={() => setOpen(true)}
      >
        Đóng nhóm
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đóng nhóm?</DialogTitle>
            <DialogDescription>
              Sau khi đóng, nhóm không thể nhận thêm thành viên hoặc hóa đơn
              mới. Dữ liệu hiện tại vẫn được giữ nguyên.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/65 border-border/80 mt-5 rounded-xl border px-4 py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <div className="space-y-1.5 text-sm leading-6">
                <p className="font-medium">
                  Nhóm sẽ chuyển sang trạng thái đóng.
                </p>
                <p className="text-muted-foreground">
                  Thành viên và hóa đơn cũ vẫn có thể được xem lại.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              isLoading={pending}
              loadingText="Đang đóng nhóm…"
              onClick={async () => {
                setPending(true);
                try {
                  await bffFetch(`/api/groups/${groupId}/close`, {
                    method: "POST",
                  });
                  toast.success("Đã đóng nhóm");
                  setOpen(false);
                  router.refresh();
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Không thể đóng nhóm.",
                  );
                } finally {
                  setPending(false);
                }
              }}
            >
              Đóng nhóm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
