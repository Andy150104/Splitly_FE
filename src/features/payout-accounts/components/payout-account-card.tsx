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
}

export function PayoutAccountCard({
  account,
  onSelect,
  selected = false,
}: PayoutAccountCardProps) {
  const setDefaultMutation = useSetDefaultPayoutAccount();
  const { data: banks = [] } = useVietQrBanks();
  const [logoFailed, setLogoFailed] = useState(false);

  const bankInfo = banks.find(
    (b) =>
      (account.bankCode && b.code?.toLowerCase() === account.bankCode.toLowerCase()) ||
      (account.bankName && b.shortName?.toLowerCase() === account.bankName.toLowerCase()),
  );

  const logoUrl =
    bankInfo?.logo ||
    (account.bankCode ? `https://img.vietqr.io/image/${account.bankCode}-logo.png` : null);

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
          ? "border-primary bg-primary/[0.035] ring-2 ring-primary/25 shadow-sm"
          : "border-border/80 hover:border-primary/40",
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-white p-1.5 shadow-xs dark:bg-slate-900">
              {logoUrl && !logoFailed ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoUrl}
                  alt={account.bankCode || "Logo"}
                  onError={() => setLogoFailed(true)}
                  className="size-full object-contain"
                />
              ) : (
                <div className="flex size-full items-center justify-center rounded bg-primary/10 font-bold text-xs text-primary">
                  {account.bankCode || (
                    <CreditCard className="size-5" />
                  )}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="truncate text-base font-semibold">
                {bankInfo?.shortName || account.bankName || account.bankCode || "Ngân hàng"}
              </h4>
              <p className="text-muted-foreground truncate text-xs font-medium uppercase tracking-wide">
                {account.accountHolderName}
              </p>
            </div>
          </div>

          {account.isDefault ? (
            <Badge variant="default" className="bg-emerald-600 text-white dark:bg-emerald-500 shrink-0">
              <Check className="mr-1 size-3" /> Mặc định
            </Badge>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary h-8 px-2 text-xs opacity-80 group-hover:opacity-100 shrink-0"
              onClick={handleSetDefault}
              isLoading={setDefaultMutation.isPending}
            >
              <Star className="mr-1 size-3.5" /> Đặt mặc định
            </Button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <span className="text-muted-foreground text-xs font-medium">Số tài khoản</span>
          <span className="font-mono text-sm font-semibold tracking-wider text-primary">
            {account.accountNumberMasked || "******"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
