"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bffFetch } from "@/lib/http/browser-http-client";

const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên nhóm.")
    .max(150, "Tên nhóm không quá 150 ký tự."),
  description: z
    .string()
    .trim()
    .max(500, "Mô tả không quá 500 ký tự.")
    .optional(),
});

type CreateGroupValues = z.infer<typeof createGroupSchema>;

interface CreateGroupModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  allowed?: boolean;
}

export function CreateGroupModal({
  trigger,
  onSuccess,
  allowed = true,
}: CreateGroupModalProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<CreateGroupValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: CreateGroupValues) => {
    try {
      await bffFetch("/api/groups", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Đã tạo nhóm thành công");
      form.reset();
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo nhóm mới.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => allowed && setOpen(next)}>
      <DialogTrigger asChild>
        {trigger ? (
          <span
            title={!allowed ? "Bạn chưa có quyền Groups.Create" : undefined}
          >
            {trigger}
          </span>
        ) : (
          <Button
            className="gap-2"
            disabled={!allowed}
            title={!allowed ? "Bạn chưa có quyền Groups.Create" : undefined}
          >
            <Plus className="size-4" />
            Tạo nhóm mới
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
            <UsersRound className="size-5" />
          </div>
          <DialogTitle className="mt-2">Tạo nhóm mới</DialogTitle>
          <DialogDescription>
            Tạo nhóm để nhanh chóng lưu danh sách thành viên và chia chi phí cho
            các hóa đơn sau.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Tên nhóm</Label>
            <Input
              id="group-name"
              placeholder="Ví dụ: Chuyến đi Đà Lạt, Bạn cùng phòng, Công ty..."
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
            {form.formState.errors.name?.message ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">Mô tả (Không bắt buộc)</Label>
            <Textarea
              id="group-description"
              placeholder="Nhập ghi chú hoặc mục đích của nhóm..."
              rows={3}
              {...form.register("description")}
            />
            {form.formState.errors.description?.message ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={form.formState.isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              isLoading={form.formState.isSubmitting}
              disabled={!allowed}
            >
              Tạo nhóm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Export CreateGroupForm alias for backward compatibility
export const CreateGroupForm = CreateGroupModal;
