"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { HelpCircle, LifeBuoy } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const supportSchema = z.object({
  contactEmail: z.string().trim().email("Email không hợp lệ."),
  type: z.string().trim().min(1, "Chọn loại yêu cầu."),
  billId: z.string().trim().optional(),
  description: z
    .string()
    .trim()
    .min(10, "Mô tả sự cố ít nhất 10 ký tự.")
    .max(1000, "Mô tả tối đa 1000 ký tự."),
});

type SupportValues = z.infer<typeof supportSchema>;

export function CreateSupportModal({
  defaultBillId,
  defaultEmail,
  trigger,
}: {
  defaultBillId?: string;
  defaultEmail?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<SupportValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      contactEmail: defaultEmail ?? "",
      type: "PaymentIssue",
      billId: defaultBillId ?? "",
      description: "",
    },
  });

  const onSubmit = async (values: SupportValues) => {
    try {
      const res = await fetch("/api/support-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as { message?: string };
        throw new Error(errorData.message || "Không thể gửi yêu cầu hỗ trợ.");
      }

      toast.success("Đã gửi yêu cầu hỗ trợ thành công. Admin sẽ kiểm tra và phản hồi.");
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gửi yêu cầu hỗ trợ thất bại.",
      );
    }
  };

  const selectedType =
    useWatch({ control: form.control, name: "type" }) ?? "PaymentIssue";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <HelpCircle className="size-4" />
            Báo lỗi thanh toán / Hỗ trợ
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
            <LifeBuoy className="size-5" />
          </div>
          <DialogTitle className="mt-2">Gửi Yêu cầu Hỗ trợ & Báo lỗi</DialogTitle>
          <DialogDescription>
            Báo sự cố thanh toán (đã chuyển khoản nhưng chưa gạch nợ) hoặc thắc mắc khác để Admin hỗ trợ xử lý.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email liên hệ nhận phản hồi</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="user@example.com"
              aria-invalid={Boolean(form.formState.errors.contactEmail)}
              {...form.register("contactEmail")}
            />
            {form.formState.errors.contactEmail?.message ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.contactEmail.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Loại sự cố / Yêu cầu</Label>
            <Select
              value={selectedType}
              onChange={(val) => form.setValue("type", val)}
              options={[
                { value: "PaymentIssue", label: "Sự cố thanh toán / Chưa gạch nợ" },
                { value: "PayoutIssue", label: "Sự cố giải ngân Payout" },
                { value: "AccountIssue", label: "Vấn đề tài khoản & Phân quyền" },
                { value: "Other", label: "Thắc mắc khác" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-id">Mã hóa đơn liên quan (Không bắt buộc)</Label>
            <Input
              id="bill-id"
              placeholder="Ví dụ: b07341ea-175c-4ec7-a5a3-def2cae89bfa"
              {...form.register("billId")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả chi tiết sự cố</Label>
            <Textarea
              id="description"
              placeholder="Mô tả cụ thể thời gian chuyển khoản, mã đơn SL04270460 hoặc vấn đề gặp phải..."
              rows={4}
              aria-invalid={Boolean(form.formState.errors.description)}
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
            <Button type="submit" isLoading={form.formState.isSubmitting}>
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
