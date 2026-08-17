"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CircleAlert,
  LoaderCircle,
  ReceiptText,
  Scale,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import type {
  BillSplitServiceApplicationFeaturesGroupsGetGroupGetGroupHandlerResponse as GroupDetail,
  BillSplitServiceApplicationFeaturesGroupsListGroupsListGroupsHandlerItem as GroupItem,
} from "@/generated/api/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createBillSchema,
  type CreateBillValues,
} from "@/features/bills/schemas/create-bill.schema";
import { CreatePayoutAccountModal } from "@/features/payout-accounts/components/create-payout-account-modal";
import { PayoutAccountCard } from "@/features/payout-accounts/components/payout-account-card";
import { usePayoutAccounts } from "@/features/payout-accounts/hooks/use-payout-accounts";
import { formatCurrency } from "@/lib/formatters/currency";
import { bffFetch } from "@/lib/http/browser-http-client";
import { cn } from "@/lib/utils";

const steps = [
  {
    label: "Thông tin",
    description: "Nhập thông tin khoản chi",
    icon: ReceiptText,
  },
  {
    label: "Người tham gia",
    description: "Chọn người cùng chia",
    icon: UsersRound,
  },
  {
    label: "Chia tiền",
    description: "Chọn cách phân bổ",
    icon: Scale,
  },
  {
    label: "Xác nhận",
    description: "Kiểm tra và hoàn tất",
    icon: BadgeCheck,
  },
] as const;
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
  capabilities,
}: {
  groups: GroupItem[];
  ownerEmail: string;
  capabilities: {
    canUpdate: boolean;
    canManageMembers: boolean;
    canCalculate: boolean;
    canPublish: boolean;
    canReadPayoutAccounts: boolean;
    canCreatePayoutAccounts: boolean;
    canReadBanks: boolean;
  };
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [billId, setBillId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "details" | "members" | "calculate" | "publish" | null
  >(null);
  const requestLockRef = useRef(false);
  const currentStepInfo = steps[step] ?? steps[0];
  const isBusy = pendingAction !== null;
  const form = useForm<CreateBillValues>({
    resolver: zodResolver(createBillSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "firstError",
    defaultValues: {
      title: "",
      totalAmount: "",
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
      publish: capabilities.canPublish,
    },
  });
  const values = useWatch({ control: form.control }) as CreateBillValues;
  const { data: payoutAccounts = [] } = usePayoutAccounts(
    capabilities.canReadPayoutAccounts,
  );
  const groupQuery = useQuery({
    queryKey: ["groups", "detail", values.groupId],
    queryFn: () => bffFetch<GroupDetail>(`/api/groups/${values.groupId}`),
    enabled: Boolean(values.groupId),
  });
  const group = groupQuery.data ?? null;
  const loadingGroup = Boolean(values.groupId) && groupQuery.isPending;

  useEffect(() => {
    if (!values.payoutAccountId && payoutAccounts.length > 0) {
      const defaultAccount =
        payoutAccounts.find((a) => a.isDefault) ?? payoutAccounts[0];
      if (defaultAccount?.id) {
        form.setValue("payoutAccountId", defaultAccount.id);
      }
    }
  }, [payoutAccounts, values.payoutAccountId, form]);

  const directEmails = useMemo(
    () => emailsFrom(values.emailsText),
    [values.emailsText],
  );
  const selectedGroupMembers = (group?.members ?? []).filter(
    (member) =>
      member.memberId && values.groupMemberIds?.includes(member.memberId),
  );
  const participants = Array.from(
    new Set(
      [
        ...(values.includeOwner ? [ownerEmail] : []),
        ...directEmails,
        ...selectedGroupMembers
          .map((member) => member.email ?? "")
          .filter(Boolean),
      ].map((email) => email.trim().toLowerCase()),
    ),
  );
  const allocationTotal = participants.reduce(
    (sum, email) => sum + Number(values.allocations?.[email] ?? 0),
    0,
  );
  const allocationDifference = Number(values.totalAmount) - allocationTotal;

  function getAllocationAmount(email: string): number | "" {
    const amount = Number(values.allocations?.[email] ?? 0);
    return Number.isFinite(amount) && amount > 0 ? amount : "";
  }

  function setAllocationAmount(email: string, amount: number | "") {
    const nextAllocations: Record<string, number> = {};

    for (const [key, value] of Object.entries(values.allocations ?? {})) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed >= 0) nextAllocations[key] = parsed;
    }

    if (amount === "") {
      delete nextAllocations[email];
    } else {
      nextAllocations[email] = amount;
    }

    form.setValue("allocations", nextAllocations, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  async function runExclusive(
    action: Exclude<typeof pendingAction, null>,
    operation: () => Promise<void>,
  ) {
    if (requestLockRef.current) return;

    requestLockRef.current = true;
    setPendingAction(action);
    try {
      await operation();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể hoàn tất yêu cầu.",
      );
    } finally {
      requestLockRef.current = false;
      setPendingAction(null);
    }
  }

  function getBillDetailsPayload(
    parsed: ReturnType<typeof createBillSchema.parse>,
  ) {
    return {
      title: parsed.title,
      totalAmount: parsed.totalAmount,
      currency: parsed.currency.toUpperCase(),
      groupId: parsed.groupId || null,
      billDate: parsed.billDate || null,
      dueDate: parsed.dueDate || null,
      description: parsed.description || null,
    };
  }

  async function next() {
    const requiredPermission =
      step === 0 && billId && !capabilities.canUpdate
        ? "Bills.Update"
        : step === 1 && !capabilities.canManageMembers
          ? "Bills.ManageMembers"
          : step === 2 && !capabilities.canCalculate
            ? "Bills.Calculate"
            : null;
    if (requiredPermission) {
      toast.error(`Bạn chưa có quyền ${requiredPermission}.`);
      return;
    }
    if (requestLockRef.current) return;

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

    const parsedResult = createBillSchema.safeParse(form.getValues());
    if (!parsedResult.success) {
      toast.error(
        parsedResult.error.issues[0]?.message ??
          "Vui lòng kiểm tra lại thông tin hóa đơn.",
      );
      return;
    }
    const parsed = parsedResult.data;

    if (step === 0) {
      await runExclusive("details", async () => {
        const payload = getBillDetailsPayload(parsed);

        if (billId) {
          await bffFetch(`/api/bills/${billId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
        } else {
          const draft = await bffFetch<{ billId?: string }>("/api/bills", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          if (!draft.billId) {
            throw new Error(
              "Backend không trả về billId sau khi tạo hóa đơn nháp.",
            );
          }
          setBillId(draft.billId);
        }

        setStep(1);
      });
      return;
    }

    if (!billId) {
      toast.error("Không tìm thấy hóa đơn nháp. Vui lòng quay lại Bước 1.");
      return;
    }

    if (step === 1) {
      await runExclusive("members", async () => {
        await bffFetch(`/api/bills/${billId}/members`, {
          method: "POST",
          body: JSON.stringify({
            emails: directEmails,
            groupMembers: selectedGroupMembers.flatMap((member) =>
              member.memberId && member.email
                ? [{ memberId: member.memberId, email: member.email }]
                : [],
            ),
            includeOwner: parsed.includeOwner,
            groupId: parsed.groupId || null,
            participantEmails: participants,
          }),
        });
        setStep(2);
      });
      return;
    }

    if (step === 2) {
      await runExclusive("calculate", async () => {
        const body =
          parsed.splitMethod === "Equal"
            ? { method: "Equal" as const }
            : {
                method: "CustomAmount" as const,
                allocations: Object.fromEntries(
                  participants.map((email) => [
                    email,
                    Number(parsed.allocations[email] ?? 0),
                  ]),
                ),
              };

        // Step 3 must finish calculating before the wizard enters Step 4.
        // Publish is intentionally NOT called here.
        await bffFetch(`/api/bills/${billId}/calculate`, {
          method: "POST",
          body: JSON.stringify(body),
        });
        setStep(3);
      });
    }
  }

  return (
    <form
      noValidate
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const target = e.target as HTMLElement;
          if (target.tagName === "INPUT" || target.tagName === "SELECT") {
            e.preventDefault();
            if (step < 3) {
              void next();
            }
          }
        }
      }}
      onSubmit={(e) => {
        e.preventDefault();
        if (e.target !== e.currentTarget) {
          return;
        }
        if (step < 3) {
          void next();
          return;
        }
        void form.handleSubmit(
          async (input) => {
            if (!billId) {
              toast.error(
                "Không tìm thấy hóa đơn nháp. Vui lòng quay lại Bước 1.",
              );
              return;
            }

            const parsed = createBillSchema.parse(input);
            if (parsed.publish && !capabilities.canPublish) {
              toast.error("Bạn chưa có quyền Bills.Publish.");
              return;
            }
            await runExclusive("publish", async () => {
              if (parsed.publish) {
                // Step 4 performs exactly one mutation: publish.
                // Step 3 has already completed /calculate before this screen is shown.
                await bffFetch(`/api/bills/${billId}/publish`, {
                  method: "POST",
                  body: JSON.stringify({
                    payoutAccountId: parsed.payoutAccountId || null,
                  }),
                });
              }

              toast.success(
                parsed.publish ? "Đã công bố hóa đơn" : "Đã lưu hóa đơn nháp",
              );
              router.push(`/bills/${billId}`);
              router.refresh();
            });
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
        )(e);
      }}
      className="w-full lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"
    >
      <Card className="border-border/80 bg-card/95 dark:bg-card/90 overflow-hidden shadow-[0_18px_52px_rgb(15_23_42/0.065)] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col dark:shadow-[0_22px_60px_rgb(0_0_0/0.26)]">
        <div className="lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[190px_minmax(0,1fr)_260px] 2xl:grid-cols-[200px_minmax(0,1fr)_270px]">
          <aside className="border-border/70 bg-muted/20 dark:bg-muted/[0.08] hidden min-h-0 border-r lg:block lg:[scrollbar-gutter:stable] lg:overflow-y-auto lg:overscroll-contain">
            <div className="p-4 xl:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-[11px] font-bold tracking-[0.16em] uppercase">
                  Tiến độ
                </p>
                <span className="text-primary text-xs font-bold tabular-nums">
                  {Math.round(((step + 1) / steps.length) * 100)}%
                </span>
              </div>
              <div className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                />
              </div>
              <ol className="mt-5" aria-label="Tiến độ tạo hóa đơn">
                {steps.map((item, index) => {
                  const completed = index < step;
                  const active = index === step;

                  return (
                    <li
                      key={item.label}
                      className="relative flex gap-3 pb-5 last:pb-0"
                    >
                      {index < steps.length - 1 ? (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "bg-border absolute top-8 bottom-0 left-[15px] w-px transition-colors duration-200",
                            completed && "bg-primary/45",
                          )}
                        />
                      ) : null}
                      <span
                        className={cn(
                          "bg-background text-muted-foreground border-border dark:bg-background/70 relative z-10 grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold shadow-[0_1px_2px_rgb(15_23_42/0.05)] transition-[border-color,background-color,color,box-shadow] duration-200",
                          completed &&
                            "border-primary/25 bg-primary/10 text-primary",
                          active &&
                            "border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_11%,transparent)]",
                        )}
                      >
                        {completed ? (
                          <Check className="size-4" aria-hidden="true" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p
                          className={cn(
                            "text-muted-foreground text-sm font-medium transition-colors",
                            (completed || active) && "text-foreground",
                            active && "font-semibold",
                          )}
                        >
                          {item.label}
                        </p>
                        <p
                          className={cn(
                            "text-muted-foreground/70 mt-0.5 text-xs leading-4",
                            active && "text-muted-foreground",
                          )}
                        >
                          {item.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>

          <section className="min-w-0 lg:flex lg:min-h-0 lg:flex-col">
            <div className="border-border/70 bg-muted/15 dark:bg-muted/[0.06] border-b px-4 py-3 lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                    Bước {step + 1} / {steps.length}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold">
                    {currentStepInfo.label}
                  </p>
                </div>
                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">
                  {Math.round(((step + 1) / steps.length) * 100)}%
                </span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden="true">
                {steps.map((item, index) => (
                  <span
                    key={item.label}
                    className={cn(
                      "bg-muted h-1.5 rounded-full transition-colors duration-200",
                      index <= step && "bg-primary",
                    )}
                  />
                ))}
              </div>
            </div>

            <CardContent className="p-4 sm:p-5 lg:min-h-0 lg:flex-1 lg:[scrollbar-gutter:stable] lg:overflow-y-auto lg:overscroll-contain lg:p-5">
              <div key={step} className="animate-step-in">
                {step === 0 ? (
                  <div className="space-y-4">
                    <StepSectionHeader
                      icon={steps[0].icon}
                      title="Thông tin hóa đơn"
                      description="Cho mọi người biết khoản chi này là gì và khi nào cần thanh toán."
                    />
                    <Field
                      label="Tên hóa đơn"
                      htmlFor="bill-title"
                      error={form.formState.errors.title?.message}
                    >
                      <Input
                        id="bill-title"
                        aria-invalid={Boolean(form.formState.errors.title)}
                        autoFocus
                        placeholder="Ví dụ: YouTube Premium tháng 8"
                        {...form.register("title")}
                      />
                    </Field>
                    <Field
                      label="Tổng tiền"
                      htmlFor="bill-total-amount"
                      error={form.formState.errors.totalAmount?.message}
                    >
                      <Controller
                        control={form.control}
                        name="totalAmount"
                        render={({ field }) => (
                          <Input
                            id="bill-total-amount"
                            aria-invalid={Boolean(
                              form.formState.errors.totalAmount,
                            )}
                            name={field.name}
                            ref={field.ref}
                            value={
                              field.value !== undefined && field.value !== null
                                ? String(field.value)
                                : ""
                            }
                            onBlur={field.onBlur}
                            placeholder="Nhập số tiền"
                            money={{
                              currency: values.currency || "VND",
                              onValueChange: (amount) => field.onChange(amount),
                            }}
                          />
                        )}
                      />
                      <input type="hidden" {...form.register("currency")} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Ngày hóa đơn"
                        htmlFor="bill-date"
                        error={form.formState.errors.billDate?.message}
                      >
                        <DatePicker
                          id="bill-date"
                          invalid={Boolean(form.formState.errors.billDate)}
                          name="billDate"
                          value={values.billDate}
                          clearable={false}
                          placeholder="Chọn ngày hóa đơn"
                          onChange={(value) =>
                            form.setValue("billDate", value, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            })
                          }
                        />
                      </Field>
                      <Field
                        label="Hạn thanh toán"
                        htmlFor="bill-due-date"
                        error={form.formState.errors.dueDate?.message}
                      >
                        <DatePicker
                          id="bill-due-date"
                          invalid={Boolean(form.formState.errors.dueDate)}
                          name="dueDate"
                          value={values.dueDate}
                          placeholder="Chọn hạn thanh toán"
                          onChange={(value) =>
                            form.setValue("dueDate", value, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            })
                          }
                        />
                      </Field>
                    </div>
                    <Field
                      label="Ghi chú (không bắt buộc)"
                      htmlFor="bill-description"
                      error={form.formState.errors.description?.message}
                    >
                      <Textarea
                        id="bill-description"
                        aria-invalid={Boolean(
                          form.formState.errors.description,
                        )}
                        className="min-h-20"
                        placeholder="Mô tả ngắn về khoản chi…"
                        {...form.register("description")}
                      />
                    </Field>
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="space-y-4">
                    <StepSectionHeader
                      icon={steps[1].icon}
                      title="Chọn người tham gia"
                      description="Thêm trực tiếp bằng email, hoặc chọn thành viên từ một nhóm có sẵn."
                    />
                    <label
                      className={cn(
                        "border-border hover:border-primary/30 hover:bg-primary/[0.025] focus-within:border-primary/40 focus-within:ring-primary/10 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-[border-color,background-color,box-shadow,transform] duration-150 focus-within:ring-4 active:scale-[0.995]",
                        values.includeOwner &&
                          "border-primary/35 bg-primary/[0.035]",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="accent-primary mt-0.5 size-5 cursor-pointer"
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
                    <div
                      className={cn(
                        "grid gap-4",
                        groups.length &&
                          "xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start",
                      )}
                    >
                      <Field label="Thêm bằng email">
                        <Textarea
                          className="min-h-20"
                          autoComplete="off"
                          spellCheck={false}
                          placeholder={"anna@example.com\nminh@example.com"}
                          {...form.register("emailsText")}
                        />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-muted-foreground text-xs">
                            Mỗi dòng một email. Email chưa có tài khoản sẽ được
                            hệ thống tạo ở trạng thái chờ xác nhận.
                          </p>
                          {directEmails.length ? (
                            <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">
                              {directEmails.length} email
                            </span>
                          ) : null}
                        </div>
                      </Field>

                      {groups.length ? (
                        <div className="space-y-3">
                          <Field label="Chọn từ nhóm">
                            <Select
                              value={values.groupId || ""}
                              onChange={(value) => {
                                form.setValue("groupId", value, {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                  shouldValidate: true,
                                });
                                form.setValue("groupMemberIds", [], {
                                  shouldDirty: true,
                                });
                              }}
                              options={[
                                { value: "", label: "Không dùng nhóm" },
                                ...groups.flatMap((item) =>
                                  item.groupId
                                    ? [
                                        {
                                          value: item.groupId,
                                          label:
                                            item.name || "Nhóm chưa đặt tên",
                                        },
                                      ]
                                    : [],
                                ),
                              ]}
                              placeholder="Chọn nhóm"
                            />
                          </Field>
                          {loadingGroup ? (
                            <p className="text-muted-foreground flex items-center gap-2 text-sm">
                              <LoaderCircle className="size-4 animate-spin" />
                              Đang tải thành viên…
                            </p>
                          ) : null}
                          {group ? (
                            <div>
                              <Label>Thành viên nhóm</Label>
                              <div className="divide-border border-border mt-2 divide-y overflow-hidden rounded-xl border shadow-[0_1px_2px_rgb(15_23_42/0.03)]">
                                {(group.members ?? []).map((member) => (
                                  <label
                                    key={member.memberId}
                                    className={cn(
                                      "hover:bg-muted/60 focus-within:bg-primary/[0.035] flex cursor-pointer items-center gap-3 p-2.5 text-sm transition-colors",
                                      member.memberId &&
                                        values.groupMemberIds?.includes(
                                          member.memberId,
                                        ) &&
                                        "bg-primary/[0.035]",
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      value={member.memberId}
                                      className="accent-primary size-5 cursor-pointer"
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
                        </div>
                      ) : null}
                    </div>
                    <div className="border-primary/10 bg-primary/[0.035] rounded-xl border p-3 text-sm transition-colors">
                      <span className="text-primary font-semibold">
                        {participants.length}
                      </span>{" "}
                      người sẽ tham gia hóa đơn này.
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-4">
                    <StepSectionHeader
                      icon={steps[2].icon}
                      title="Chọn cách chia"
                      description="Chia đều hoặc nhập chính xác số tiền mỗi người cần trả."
                    />
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
                            "hover:border-primary/35 cursor-pointer rounded-xl border p-3.5 transition-[border-color,background-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 active:scale-[0.99]",
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
                        <div className="border-border/70 divide-border/70 divide-y overflow-hidden rounded-xl border">
                          {participants.map((email) => (
                            <div
                              key={email}
                              className="grid gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] sm:items-start"
                            >
                              <div className="min-w-0 pt-1">
                                <p className="truncate text-sm font-medium">
                                  {email}
                                </p>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                  Số tiền phải trả
                                </p>
                              </div>
                              <Input
                                aria-label={`Số tiền của ${email}`}
                                value={getAllocationAmount(email)}
                                placeholder="Nhập số tiền"
                                money={{
                                  currency: values.currency || "VND",
                                  suggestionCount: 3,
                                  onValueChange: (amount) =>
                                    setAllocationAmount(email, amount),
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <div
                          className={cn(
                            "money rounded-xl border p-3 text-sm transition-colors duration-200",
                            Math.abs(allocationDifference) < 0.001
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                          )}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span>Đã phân bổ</span>
                            <strong className="tabular-nums">
                              {formatCurrency(allocationTotal, values.currency)}{" "}
                              /{" "}
                              {formatCurrency(
                                Number(values.totalAmount),
                                values.currency,
                              )}
                            </strong>
                          </div>
                          <p className="mt-1 text-xs font-medium">
                            {Math.abs(allocationDifference) < 0.001
                              ? "Đã phân bổ đủ tổng tiền hóa đơn."
                              : allocationDifference > 0
                                ? `Còn thiếu ${formatCurrency(allocationDifference, values.currency)}.`
                                : `Đang vượt ${formatCurrency(Math.abs(allocationDifference), values.currency)}.`}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="space-y-5">
                    <StepSectionHeader
                      icon={steps[3].icon}
                      title="Xác nhận & STK Payout"
                      description="Chọn tài khoản ngân hàng nhận tiền tự động khi các thành viên thanh toán qua PayOS."
                    />
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

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <Label className="text-sm font-semibold">
                            Tài khoản ngân hàng nhận Payout
                          </Label>
                          <p className="text-muted-foreground text-xs">
                            Chọn tài khoản cá nhân để Splitly giải ngân tiền thu
                            được từ PayOS.
                          </p>
                        </div>
                        <CreatePayoutAccountModal
                          allowed={capabilities.canCreatePayoutAccounts}
                          canReadBanks={capabilities.canReadBanks}
                          onSuccess={(newId) => {
                            if (newId) form.setValue("payoutAccountId", newId);
                          }}
                          trigger={
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 shrink-0 gap-1.5 text-xs"
                              disabled={
                                !capabilities.canCreatePayoutAccounts ||
                                !capabilities.canReadBanks
                              }
                            >
                              + Thêm tài khoản mới
                            </Button>
                          }
                        />
                      </div>

                      {payoutAccounts.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {payoutAccounts.map((acc) => (
                            <PayoutAccountCard
                              key={acc.id}
                              account={acc}
                              selected={values.payoutAccountId === acc.id}
                              onSelect={() =>
                                acc.id &&
                                form.setValue("payoutAccountId", acc.id)
                              }
                              canUpdate={false}
                              canReadBanks={capabilities.canReadBanks}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-400">
                          <span>
                            Bạn chưa có tài khoản ngân hàng Payout. Vui lòng
                            thêm mới để nhận tiền tự động.
                          </span>
                          <CreatePayoutAccountModal
                            allowed={capabilities.canCreatePayoutAccounts}
                            canReadBanks={capabilities.canReadBanks}
                            onSuccess={(newId) => {
                              if (newId)
                                form.setValue("payoutAccountId", newId);
                            }}
                            trigger={
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 shrink-0 text-xs font-semibold"
                                disabled={
                                  !capabilities.canCreatePayoutAccounts ||
                                  !capabilities.canReadBanks
                                }
                              >
                                + Thêm ngay
                              </Button>
                            }
                          />
                        </div>
                      )}
                    </div>

                    <label className="border-border hover:border-primary/30 hover:bg-primary/[0.025] flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-[border-color,background-color,transform] duration-150 active:scale-[0.995]">
                      <input
                        type="checkbox"
                        className="accent-primary mt-1 size-4"
                        {...form.register("publish")}
                        disabled={!capabilities.canPublish}
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          Công bố ngay sau khi tạo
                        </span>
                        <span className="text-muted-foreground text-xs">
                          Tự động tạo đơn thanh toán PayOS và gửi email kèm mã
                          QR cho từng người tham gia.
                        </span>
                      </span>
                    </label>
                  </div>
                ) : null}
              </div>
            </CardContent>

            <div className="border-border/70 bg-card/95 lg:bg-card/80 dark:bg-card/95 sticky bottom-0 z-10 flex shrink-0 items-center justify-between gap-3 border-t px-4 py-2.5 backdrop-blur-xl sm:px-5 lg:static lg:px-6">
              <Button
                type="button"
                variant="ghost"
                disabled={step === 0 || isBusy || form.formState.isSubmitting}
                onClick={() => setStep((current) => current - 1)}
              >
                <ArrowLeft className="size-4" />
                Quay lại
              </Button>
              <div className="text-muted-foreground hidden text-xs sm:block lg:hidden">
                {currentStepInfo.label}
              </div>
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => void next()}
                  disabled={
                    isBusy ||
                    (step === 0 &&
                      Boolean(billId) &&
                      !capabilities.canUpdate) ||
                    (step === 1 && !capabilities.canManageMembers) ||
                    (step === 2 && !capabilities.canCalculate)
                  }
                  title={
                    step === 0 && billId && !capabilities.canUpdate
                      ? "Bạn chưa có quyền Bills.Update"
                      : step === 1 && !capabilities.canManageMembers
                        ? "Bạn chưa có quyền Bills.ManageMembers"
                        : step === 2 && !capabilities.canCalculate
                          ? "Bạn chưa có quyền Bills.Calculate"
                          : undefined
                  }
                  isLoading={isBusy}
                  loadingText={
                    pendingAction === "calculate"
                      ? "Đang chia tiền…"
                      : "Đang lưu…"
                  }
                >
                  Tiếp tục <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={
                    isBusy ||
                    (Boolean(values.publish) && !capabilities.canPublish)
                  }
                  title={
                    values.publish && !capabilities.canPublish
                      ? "Bạn chưa có quyền Bills.Publish"
                      : undefined
                  }
                  isLoading={form.formState.isSubmitting || isBusy}
                  loadingText={values.publish ? "Đang công bố…" : "Đang lưu…"}
                >
                  <Check className="size-4" />
                  {values.publish ? "Công bố hóa đơn" : "Lưu bản nháp"}
                </Button>
              )}
            </div>
          </section>

          <LiveBillSummary
            values={values}
            participants={participants}
            step={step}
          />
        </div>
      </Card>
    </form>
  );
}

function StepSectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="border-border/70 flex items-start gap-3 border-b pb-3.5">
      <span className="bg-primary/10 text-primary border-primary/10 grid size-9 shrink-0 place-items-center rounded-xl border">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-0.5 text-sm leading-5">
          {description}
        </p>
      </div>
    </div>
  );
}

function formatSummaryDate(value?: string) {
  if (!value) return "Chưa chọn";

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Chưa chọn";

  return new Intl.DateTimeFormat("vi-VN").format(parsed);
}

function LiveBillSummary({
  values,
  participants,
  step,
}: {
  values: CreateBillValues;
  participants: string[];
  step: number;
}) {
  const amount = Number(values.totalAmount);
  const hasAmount = Number.isFinite(amount) && amount > 0;
  const currency = values.currency || "VND";
  const equalShare =
    hasAmount && participants.length > 0 ? amount / participants.length : 0;
  const splitLabel =
    step < 2
      ? "Thiết lập ở bước 3"
      : values.splitMethod === "Equal"
        ? "Chia đều"
        : "Tùy chỉnh";

  return (
    <aside className="border-border/70 bg-muted/[0.14] dark:bg-muted/[0.055] hidden min-h-0 border-l xl:block xl:[scrollbar-gutter:stable] xl:overflow-y-auto xl:overscroll-contain">
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary/10 text-primary border-primary/10 grid size-9 place-items-center rounded-xl border">
              <ReceiptText className="size-[18px]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Tóm tắt hóa đơn</p>
              <p className="text-muted-foreground text-[11px]">
                Cập nhật theo dữ liệu bạn nhập
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
            Live
          </span>
        </div>

        <div className="border-border/70 mt-4 border-b pb-4">
          <p className="text-muted-foreground text-xs font-medium">Hóa đơn</p>
          <p className="mt-1.5 line-clamp-2 text-base font-semibold tracking-tight">
            {values.title?.trim() || "Hóa đơn chưa đặt tên"}
          </p>
          <p
            className={cn(
              "money mt-3 text-2xl font-bold tracking-[-0.03em] tabular-nums",
              !hasAmount && "text-muted-foreground",
            )}
          >
            {hasAmount ? formatCurrency(amount, currency) : "—"}
          </p>
        </div>

        <dl className="divide-border/60 mt-1 divide-y text-sm">
          <SummaryRow
            label="Người tham gia"
            value={`${participants.length} người`}
          />
          <SummaryRow label="Cách chia" value={splitLabel} />
          <SummaryRow
            label="Hạn thanh toán"
            value={formatSummaryDate(values.dueDate)}
          />
          <SummaryRow label="Bước hiện tại" value={steps[step]?.label ?? ""} />
        </dl>

        {values.splitMethod === "Equal" && equalShare > 0 ? (
          <div className="border-primary/10 bg-primary/[0.045] mt-4 rounded-xl border p-3">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Ước tính mỗi người
            </p>
            <p className="money text-primary mt-1.5 text-lg font-bold tabular-nums">
              {formatCurrency(equalShare, currency)}
            </p>
            <p className="text-muted-foreground mt-1 text-[11px] leading-4">
              Dựa trên {participants.length} người đang được chọn.
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="max-w-[145px] text-right text-xs font-semibold">
        {value}
      </dd>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group/field space-y-1.5">
      <Label
        htmlFor={htmlFor}
        className={cn(
          "text-foreground/90 text-[13px] font-semibold transition-colors duration-150",
          error && "text-destructive",
        )}
      >
        {label}
      </Label>
      {children}
      {error ? (
        <div
          role="alert"
          aria-live="polite"
          className="text-destructive flex min-h-5 items-start gap-1.5 text-xs font-semibold"
        >
          <CircleAlert
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span className="leading-4">{error}</span>
        </div>
      ) : null}
    </div>
  );
}
