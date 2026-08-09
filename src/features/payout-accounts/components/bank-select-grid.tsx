"use client";

import { Check, ChevronDown, ChevronUp, LoaderCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVietQrBanks } from "@/features/payout-accounts/hooks/use-payout-accounts";
import type { VietQrBank } from "@/features/payout-accounts/types";
import { cn } from "@/lib/utils";

const POPULAR_BANK_CODES = [
  "VCB",
  "MB",
  "TCB",
  "BIDV",
  "CTG",
  "ACB",
  "VPB",
  "TPB",
  "STB",
  "VIB",
  "HDB",
  "MSB",
  "OCB",
  "EIB",
  "LPB",
  "SHB",
];

interface BankSelectGridProps {
  selectedBankCode?: string | null;
  onSelectBank: (bank: VietQrBank) => void;
  invalid?: boolean;
}

export function BankSelectGrid({
  selectedBankCode,
  onSelectBank,
  invalid = false,
}: BankSelectGridProps) {
  const { data: banks = [], isLoading } = useVietQrBanks();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});

  const sortedBanks = useMemo(() => {
    if (!banks.length) return [];
    return [...banks].sort((a, b) => {
      const codeA = (a.code || a.shortName || "").toUpperCase();
      const codeB = (b.code || b.shortName || "").toUpperCase();

      const idxA = POPULAR_BANK_CODES.indexOf(codeA);
      const idxB = POPULAR_BANK_CODES.indexOf(codeB);

      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;

      return codeA.localeCompare(codeB);
    });
  }, [banks]);

  const filteredBanks = useMemo(() => {
    if (!search.trim()) return sortedBanks;
    const query = search.trim().toLowerCase();
    return sortedBanks.filter((b) => {
      const name = (b.name ?? "").toLowerCase();
      const shortName = (b.shortName ?? "").toLowerCase();
      const code = (b.code ?? "").toLowerCase();
      const bin = (b.bin ?? "").toLowerCase();
      return (
        name.includes(query) ||
        shortName.includes(query) ||
        code.includes(query) ||
        bin.includes(query)
      );
    });
  }, [sortedBanks, search]);

  const popularCount = 12;
  const isSearching = Boolean(search.trim());
  const displayedBanks =
    expanded || isSearching
      ? filteredBanks
      : filteredBanks.slice(0, popularCount);

  if (isLoading) {
    return (
      <div className="flex h-44 items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-6 text-xs text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin text-primary" />
        <span className="font-medium">Đang tải danh sách ngân hàng…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên ngân hàng (Ví dụ: Vietcombank, MB, Techcombank, BIDV...)"
          className={cn("h-11 pl-10 text-sm", invalid && "border-destructive")}
        />
      </div>

      {/* Bank Logos Grid */}
      {displayedBanks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {displayedBanks.map((bank) => {
            const code = bank.code || bank.shortName || "";
            const isSelected =
              selectedBankCode &&
              (code.toLowerCase() === selectedBankCode.toLowerCase() ||
                (bank.shortName && bank.shortName.toLowerCase() === selectedBankCode.toLowerCase()));
            const hasFailedLogo = failedLogos[code];
            const logoUrl =
              bank.logo || `https://img.vietqr.io/image/${code}-logo.png`;

            return (
              <button
                key={bank.bin || code || bank.id}
                type="button"
                onClick={() => onSelectBank(bank)}
                className={cn(
                  "group relative flex h-20 sm:h-24 flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all duration-150 active:scale-[0.98]",
                  isSelected
                    ? "border-primary bg-primary/[0.06] ring-2 ring-primary/30 shadow-xs dark:bg-primary/15"
                    : "border-border/80 bg-card hover:border-primary/50 hover:bg-card/80 hover:shadow-xs",
                )}
              >
                {/* Active Checkmark Badge */}
                {isSelected ? (
                  <div className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                ) : null}

                {/* Logo Image or Fallback */}
                {logoUrl && !hasFailedLogo ? (
                  <div className="flex h-9 sm:h-11 w-full items-center justify-center px-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt={bank.shortName || code || "Logo"}
                      onError={() =>
                        setFailedLogos((prev) => ({
                          ...prev,
                          [code]: true,
                        }))
                      }
                      className="h-full max-h-9 sm:max-h-11 w-auto max-w-[110px] sm:max-w-[130px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-9 sm:h-11 w-full items-center justify-center rounded bg-primary/10 font-bold text-xs text-primary">
                    {code}
                  </div>
                )}

                {/* Bank Short Name */}
                <span className="mt-1 sm:mt-1.5 text-xs sm:text-xs font-bold leading-tight truncate max-w-full text-foreground">
                  {bank.shortName || code}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
          Không tìm thấy ngân hàng nào khớp với &quot;{search}&quot;.
        </div>
      )}

      {/* Expand / Collapse Toggle Button */}
      {!isSearching && filteredBanks.length > popularCount ? (
        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs font-semibold text-primary hover:text-primary/80 gap-1.5 h-8 px-3"
          >
            {expanded ? (
              <>
                Thu gọn <ChevronUp className="size-4" />
              </>
            ) : (
              <>
                Xem tất cả ({filteredBanks.length} ngân hàng) <ChevronDown className="size-4" />
              </>
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
