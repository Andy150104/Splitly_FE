"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark, Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

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
import { BankSelectGrid } from "@/features/payout-accounts/components/bank-select-grid";
import { useCreatePayoutAccount } from "@/features/payout-accounts/hooks/use-payout-accounts";
import {
  createPayoutAccountSchema,
  type CreatePayoutAccountValues,
} from "@/features/payout-accounts/schemas/payout-account.schema";
import type { VietQrBank } from "@/features/payout-accounts/types";

interface CreatePayoutAccountModalProps {
  onSuccess?: (newAccountId?: string) => void;
  trigger?: React.ReactNode;
  allowed?: boolean;
  canReadBanks?: boolean;
}

export function CreatePayoutAccountModal({
  onSuccess,
  trigger,
  allowed = true,
  canReadBanks = true,
}: CreatePayoutAccountModalProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreatePayoutAccount();

  const form = useForm<CreatePayoutAccountValues>({
    resolver: zodResolver(createPayoutAccountSchema),
    defaultValues: {
      bankBin: "",
      bankCode: "",
      bankName: "",
      accountNumber: "",
      accountHolderName: "",
      isDefault: true,
    },
  });

  const selectedBankCode = useWatch({
    control: form.control,
    name: "bankCode",
  });

  const handleSelectBank = (bank: VietQrBank) => {
    form.setValue("bankName", bank.shortName || bank.name || "", {
      shouldValidate: true,
    });
    form.setValue("bankCode", bank.code || "", { shouldValidate: true });
    form.setValue("bankBin", bank.bin || "", { shouldValidate: true });
  };

  const onSubmit = async (values: CreatePayoutAccountValues) => {
    try {
      const res = await createMutation.mutateAsync({
        ...values,
        accountHolderName: values.accountHolderName.toUpperCase(),
      });
      setOpen(false);
      form.reset();
      onSuccess?.(res?.id);
    } catch {
      // Handled by mutation toast error
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => allowed && setOpen(next)}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={!allowed || !canReadBanks}
            title={
              !allowed
                ? "Bạn chưa có quyền PayoutAccounts.Create"
                : !canReadBanks
                  ? "Bạn chưa có quyền Banks.Read"
                  : undefined
            }
          >
            <Plus className="size-4" />
            Thêm tài khoản ngân hàng
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl">
        <DialogHeader>
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
            <Landmark className="size-5" />
          </div>
          <DialogTitle className="mt-2">
            Thêm tài khoản ngân hàng Payout
          </DialogTitle>
          <DialogDescription>
            Chọn ngân hàng và nhập thông tin tài khoản để nhận tiền tự động từ
            Splitly PayOS.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.stopPropagation();
            void form.handleSubmit(onSubmit)(e);
          }}
          className="mt-4 space-y-4"
        >
          <div className="space-y-2">
            <Label>Chọn Ngân hàng</Label>
            <Controller
              control={form.control}
              name="bankName"
              render={() => (
                <BankSelectGrid
                  selectedBankCode={selectedBankCode}
                  onSelectBank={handleSelectBank}
                  invalid={Boolean(form.formState.errors.bankName)}
                  enabled={canReadBanks}
                />
              )}
            />
            {form.formState.errors.bankName?.message ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.bankName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-number">Số tài khoản</Label>
            <Input
              id="account-number"
              placeholder="Ví dụ: 0123456789"
              aria-invalid={Boolean(form.formState.errors.accountNumber)}
              {...form.register("accountNumber")}
            />
            {form.formState.errors.accountNumber?.message ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.accountNumber.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-holder">
              Tên chủ tài khoản (viết hoa không dấu)
            </Label>
            <Input
              id="account-holder"
              placeholder="NGUYEN VAN A"
              className="uppercase"
              aria-invalid={Boolean(form.formState.errors.accountHolderName)}
              {...form.register("accountHolderName")}
            />
            {form.formState.errors.accountHolderName?.message ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.accountHolderName.message}
              </p>
            ) : null}
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg pt-1">
            <input
              type="checkbox"
              className="accent-primary size-4 rounded"
              {...form.register("isDefault")}
            />
            <span className="text-sm font-medium">
              Đặt làm tài khoản mặc định
            </span>
          </label>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              disabled={!allowed || !canReadBanks}
            >
              Lưu tài khoản
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
