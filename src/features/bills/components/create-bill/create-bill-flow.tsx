"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import type {
  BillSplitServiceApplicationFeaturesGroupsGetGroupGetGroupHandlerResponse as GroupDetail,
  BillSplitServiceApplicationFeaturesGroupsListGroupsListGroupsHandlerItem as GroupItem,
} from "@/generated/api/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createBillSchema,
  type CreateBillValues,
} from "@/features/bills/schemas/create-bill.schema";
import { formatCurrency } from "@/lib/formatters/currency";
import { bffFetch } from "@/lib/http/browser-http-client";
import { cn } from "@/lib/utils";

const steps = ["Thông tin", "Người tham gia", "Chia tiền", "Xác nhận"];
const emailsFrom = (value?: string) =>
  Array.from(
    new Set(
      (value ?? "")
        .split(/[\n,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

export function CreateBillFlow({
  groups,
  ownerEmail,
}: {
  groups: GroupItem[];
  ownerEmail: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const form = useForm<CreateBillValues>({
    resolver: zodResolver(createBillSchema),
    defaultValues: {
      title: "",
      totalAmount: "" as unknown as number,
      currency: "VND",
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      description: "",
      groupId: "",
      emailsText: "",
      groupMemberIds: [],
      includeOwner: true,
      splitMethod: "Equal",
      allocations: {},
      publish: true,
    },
  });
  const values = useWatch({ control: form.control }) as CreateBillValues;
  const groupQuery = useQuery({
    queryKey: ["groups", "detail", values.groupId],
    queryFn: () => bffFetch<GroupDetail>(`/api/groups/${values.groupId}`),
    enabled: Boolean(values.groupId),
  });
  const group = groupQuery.data ?? null;
  const loadingGroup = Boolean(values.groupId) && groupQuery.isPending;

  const directEmails = useMemo(
    () => emailsFrom(values.emailsText),
    [values.emailsText],
  );
  const selectedGroupMembers = (group?.members ?? []).filter(
    (member) =>
      member.memberId && values.groupMemberIds?.includes(member.memberId),
  );
  const participants = Array.from(
    new Set([
      ...(values.includeOwner ? [ownerEmail] : []),
      ...directEmails,
      ...selectedGroupMembers
        .map((member) => member.email ?? "")
        .filter(Boolean),
    ]),
  );
  const allocationTotal = participants.reduce(
    (sum, email) => sum + Number(values.allocations?.[email] ?? 0),
    0,
  );

  async function next() {
    if (
      step === 0 &&
      !(await form.trigger(["title", "totalAmount", "currency"]))
    )
      return;
    if (step === 1 && participants.length === 0) {
      toast.error("Hóa đơn cần ít nhất một người tham gia.");
      return;
    }
    if (
      step === 2 &&
      values.splitMethod === "CustomAmount" &&
      Math.abs(allocationTotal - Number(values.totalAmount)) > 0.001
    ) {
      toast.error("Tổng số tiền tùy chỉnh phải bằng tổng hóa đơn.");
      return;
    }
    setStep((current) => Math.min(3, current + 1));
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(
        async (input) => {
          try {
            const parsed = createBillSchema.parse(input);
            const result = await bffFetch<{ billId: string }>(
              "/api/bills/workflow",
              {
                method: "POST",
                body: JSON.stringify({
                  ...parsed,
                  groupId: parsed.groupId || null,
                  billDate: parsed.billDate || null,
                  dueDate: parsed.dueDate || null,
                  description: parsed.description || null,
                  emails: directEmails,
                  allocations: parsed.allocations,
                }),
              },
            );
            toast.success(
              parsed.publish
                ? "Đã tạo và công bố hóa đơn"
                : "Đã lưu hóa đơn nháp",
            );
            router.push(`/bills/${result.billId}`);
            router.refresh();
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Không thể tạo hóa đơn.",
            );
          }
        },
        (errors) => {
          const firstError = Object.values(errors).find(
            (error) => error?.message,
          )?.message;
          toast.error(
            typeof firstError === "string"
              ? firstError
              : "Vui lòng kiểm tra lại thông tin hóa đơn.",
          );
        },
      )}
      className="mx-auto max-w-3xl"
    >
      <ol
        className="mb-8 grid grid-cols-4 gap-2"
        aria-label="Tiến độ tạo hóa đơn"
      >
        {steps.map((label, index) => (
          <li key={label} className="min-w-0">
            <div
              className={cn(
                "bg-muted mb-2 h-1.5 origin-left rounded-full transition-[background-color,transform] duration-300",
                index <= step && "bg-primary scale-x-100",
                index > step && "scale-x-[0.96]",
              )}
            />
            <p
              className={cn(
                "text-muted-foreground truncate text-xs transition-colors duration-200",
                index === step && "text-foreground font-semibold",
              )}
            >
              {index + 1}. {label}
            </p>
          </li>
        ))}
      </ol>
      <Card className="shadow-[0_12px_40px_rgb(15_23_42/0.045)]">
        <CardContent className="p-5 sm:p-7">
          <div key={step} className="animate-step-in">
            {step === 0 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold">Thông tin hóa đơn</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Cho mọi người biết khoản chi này là gì và khi nào cần thanh
                    toán.
                  </p>
                </div>
                <Field
                  label="Tên hóa đơn"
                  error={form.formState.errors.title?.message}
                >
                  <Input
                    autoFocus
                    placeholder="Ví dụ: YouTube Premium tháng 8"
                    {...form.register("title")}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
                  <Field
                    label="Tổng tiền"
                    error={form.formState.errors.totalAmount?.message}
                  >
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      placeholder="149000"
                      {...form.register("totalAmount")}
                    />
                  </Field>
                  <Field label="Tiền tệ">
                    <Input
                      maxLength={3}
                      className="uppercase"
                      {...form.register("currency")}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ngày hóa đơn">
                    <Input type="date" {...form.register("billDate")} />
                  </Field>
                  <Field label="Hạn thanh toán">
                    <Input type="date" {...form.register("dueDate")} />
                  </Field>
                </div>
                <Field label="Ghi chú (không bắt buộc)">
                  <Textarea
                    placeholder="Mô tả ngắn về khoản chi…"
                    {...form.register("description")}
                  />
                </Field>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold">Chọn người tham gia</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Thêm trực tiếp bằng email, hoặc chọn thành viên từ một nhóm
                    có sẵn.
                  </p>
                </div>
                <label className="border-border hover:border-primary/30 hover:bg-primary/[0.025] flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-[border-color,background-color,transform] duration-150 active:scale-[0.995]">
                  <input
                    type="checkbox"
                    className="accent-primary mt-1 size-4"
                    {...form.register("includeOwner")}
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Tôi cũng tham gia chia
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {ownerEmail}
                    </span>
                  </span>
                </label>
                <Field label="Thêm bằng email">
                  <Textarea
                    placeholder={"anna@example.com\nminh@example.com"}
                    {...form.register("emailsText")}
                  />
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    Mỗi dòng một email. Email chưa có tài khoản sẽ được backend
                    tạo ở trạng thái Pending.
                  </p>
                </Field>
                {groups.length ? (
                  <Field label="Chọn từ nhóm">
                    <select
                      className="border-input bg-background focus:border-primary/50 focus:ring-ring/35 h-11 w-full rounded-xl border px-3 text-sm transition-[border-color,box-shadow] duration-150 outline-none focus:ring-2"
                      {...form.register("groupId")}
                    >
                      <option value="">Không dùng nhóm</option>
                      {groups.map((item) => (
                        <option key={item.groupId} value={item.groupId}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}
                {loadingGroup ? (
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <LoaderCircle className="size-4 animate-spin" />
                    Đang tải thành viên…
                  </p>
                ) : null}
                {group ? (
                  <div>
                    <Label>Thành viên nhóm</Label>
                    <div className="divide-border border-border mt-2 divide-y rounded-xl border">
                      {(group.members ?? []).map((member) => (
                        <label
                          key={member.memberId}
                          className="hover:bg-muted/60 flex cursor-pointer items-center gap-3 p-3 text-sm transition-colors"
                        >
                          <input
                            type="checkbox"
                            value={member.memberId}
                            className="accent-primary size-4"
                            {...form.register("groupMemberIds")}
                          />
                          <span className="min-w-0">
                            <span className="block font-medium">
                              {member.name || member.email}
                            </span>
                            <span className="text-muted-foreground block truncate text-xs">
                              {member.email}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="bg-muted rounded-xl p-4 text-sm transition-colors">
                  <span className="font-semibold">{participants.length}</span>{" "}
                  người sẽ tham gia hóa đơn này.
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold">Chọn cách chia</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Chia đều hoặc nhập chính xác số tiền mỗi người cần trả.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      value: "Equal",
                      title: "Chia đều",
                      description: `${formatCurrency(Number(values.totalAmount) / Math.max(1, participants.length), values.currency)} mỗi người`,
                    },
                    {
                      value: "CustomAmount",
                      title: "Số tiền tùy chỉnh",
                      description: "Phân bổ chính xác cho từng người",
                    },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={cn(
                        "hover:border-primary/35 cursor-pointer rounded-xl border p-4 transition-[border-color,background-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 active:scale-[0.99]",
                        values.splitMethod === method.value
                          ? "border-primary bg-primary/5 shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_8%,transparent)]"
                          : "border-border",
                      )}
                    >
                      <input
                        type="radio"
                        value={method.value}
                        className="sr-only"
                        {...form.register("splitMethod")}
                      />
                      <span className="block font-semibold">
                        {method.title}
                      </span>
                      <span className="text-muted-foreground mt-1 block text-xs">
                        {method.description}
                      </span>
                    </label>
                  ))}
                </div>
                {values.splitMethod === "CustomAmount" ? (
                  <div className="animate-expand space-y-3">
                    {participants.map((email) => (
                      <div
                        key={email}
                        className="grid grid-cols-[1fr_150px] items-center gap-3"
                      >
                        <span className="truncate text-sm">{email}</span>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          aria-label={`Số tiền của ${email}`}
                          {...form.register(`allocations.${email}`)}
                        />
                      </div>
                    ))}
                    <div
                      className={cn(
                        "money flex justify-between rounded-xl p-3 text-sm transition-colors duration-200",
                        Math.abs(allocationTotal - Number(values.totalAmount)) <
                          0.001
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-amber-500/10 text-amber-700",
                      )}
                    >
                      <span>Đã phân bổ</span>
                      <strong>
                        {formatCurrency(allocationTotal, values.currency)} /{" "}
                        {formatCurrency(
                          Number(values.totalAmount),
                          values.currency,
                        )}
                      </strong>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold">
                    Kiểm tra trước khi tạo
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Bạn có thể quay lại để chỉnh sửa mà không mất dữ liệu.
                  </p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-[#16366b] to-[#0b234b] p-6 text-white shadow-[0_18px_40px_rgb(15_42_86/0.2)]">
                  <p className="text-sm text-blue-100/70">{values.title}</p>
                  <p className="money mt-2 text-3xl font-bold">
                    {formatCurrency(
                      Number(values.totalAmount),
                      values.currency,
                    )}
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/15 pt-5 text-sm">
                    <div>
                      <p className="text-blue-100/60">Người tham gia</p>
                      <p className="mt-1 font-semibold">
                        {participants.length} người
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-100/60">Cách chia</p>
                      <p className="mt-1 font-semibold">
                        {values.splitMethod === "Equal"
                          ? "Chia đều"
                          : "Tùy chỉnh"}
                      </p>
                    </div>
                  </div>
                </div>
                <label className="border-border hover:border-primary/30 hover:bg-primary/[0.025] flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-[border-color,background-color,transform] duration-150 active:scale-[0.995]">
                  <input
                    type="checkbox"
                    className="accent-primary mt-1 size-4"
                    {...form.register("publish")}
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Công bố ngay sau khi tạo
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Backend sẽ bắt đầu theo dõi và xếp hàng email thông báo.
                      Bỏ chọn để lưu nháp.
                    </span>
                  </span>
                </label>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <div className="border-border/70 bg-background/90 sticky bottom-3 z-10 mt-5 flex justify-between rounded-2xl border p-2 shadow-lg backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 0 || form.formState.isSubmitting}
          onClick={() => setStep((current) => current - 1)}
        >
          <ArrowLeft className="size-4" />
          Quay lại
        </Button>
        {step < 3 ? (
          <Button type="button" onClick={next}>
            Tiếp tục <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {form.formState.isSubmitting
              ? "Đang tạo…"
              : values.publish
                ? "Tạo & công bố"
                : "Lưu bản nháp"}
          </Button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
