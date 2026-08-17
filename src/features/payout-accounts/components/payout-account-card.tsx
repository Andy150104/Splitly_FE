"use client";

import { Check, CreditCard, Star } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useSetDefaultPayoutAccount,
  useVietQrBanks,
} from "@/features/payout-accounts/hooks/use-payout-accounts";
import type { PayoutAccount } from "@/features/payout-accounts/types";
import { cn } from "@/lib/utils";

interface PayoutAccountCardProps {
  account: PayoutAccount;
  onSelect?: () => void;
  selected?: boolean;
  canUpdate?: boolean;
  canReadBanks?: boolean;
}

export function PayoutAccountCard({
  account,
  onSelect,
  selected = false,
  canUpdate = true,
  canReadBanks = true,
}: PayoutAccountCardProps) {
  const setDefaultMutation = useSetDefaultPayoutAccount();
  const { data: banks = [] } = useVietQrBanks(canReadBanks);
  const [logoFailed, setLogoFailed] = useState(false);

  const bankInfo = banks.find(
    (b) =>
      (account.bankCode &&
        b.code?.toLowerCase() === account.bankCode.toLowerCase()) ||
      (account.bankName &&
        b.shortName?.toLowerCase() === account.bankName.toLowerCase()),
  );

  const logoUrl =
    bankInfo?.logo ||
    (account.bankCode
      ? `https://img.vietqr.io/image/${account.bankCode}-logo.png`
      : null);

  const handleSetDefault = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (account.id && !account.isDefault) {
      setDefaultMutation.mutate(account.id);
    }
  };

  return (
    <Card
      onClick={onSelect}
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:shadow-md",
        onSelect && "cursor-pointer",
        selected
          ? "border-primary bg-primary/[0.035] ring-primary/25 shadow-sm ring-2"
          : "border-border/80 hover:border-primary/40",
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="border-border/60 flex size-12 shrink-0 items-center justify-center rounded-xl border bg-white p-1.5 shadow-xs dark:bg-slate-900">
              {logoUrl && !logoFailed ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoUrl}
                  alt={account.bankCode || "Logo"}
                  onError={() => setLogoFailed(true)}
                  className="size-full object-contain"
                />
              ) : (
                <div className="bg-primary/10 text-primary flex size-full items-center justify-center rounded text-xs font-bold">
                  {account.bankCode || <CreditCard className="size-5" />}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="truncate text-base font-semibold">
                {bankInfo?.shortName ||
                  account.bankName ||
                  account.bankCode ||
                  "Ngân hàng"}
              </h4>
              <p className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase">
                {account.accountHolderName}
              </p>
            </div>
          </div>

          {account.isDefault ? (
            <Badge
              variant="default"
              className="shrink-0 bg-emerald-600 text-white dark:bg-emerald-500"
            >
              <Check className="mr-1 size-3" /> Mặc định
            </Badge>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary h-8 shrink-0 px-2 text-xs opacity-80 group-hover:opacity-100"
              onClick={handleSetDefault}
              isLoading={setDefaultMutation.isPending}
              disabled={!canUpdate}
              title={
                !canUpdate
                  ? "Bạn chưa có quyền PayoutAccounts.Update"
                  : undefined
              }
            >
              <Star className="mr-1 size-3.5" /> Đặt mặc định
            </Button>
          )}
        </div>

        <div className="border-border/60 mt-4 flex items-center justify-between border-t pt-3">
          <span className="text-muted-foreground text-xs font-medium">
            Số tài khoản
          </span>
          <span className="text-primary font-mono text-sm font-semibold tracking-wider">
            {account.accountNumberMasked || "******"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
