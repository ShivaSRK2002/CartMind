"use client";

import type { CardBrand } from "@/lib/payment/dummyCards";

const BRAND_LABELS: Record<CardBrand, string> = {
  visa: "VISA",
  mastercard: "MASTERCARD",
  amex: "AMEX",
  unknown: "CARD",
};

export function CardPreview({
  cardNumber,
  cardName,
  expiry,
  brand,
}: {
  cardNumber: string;
  cardName: string;
  expiry: string;
  brand: CardBrand;
}) {
  const displayNumber = cardNumber.padEnd(19, "•").slice(0, 19) || "•••• •••• •••• ••••";

  return (
    <div className="relative aspect-[1.586/1] w-full max-w-sm overflow-hidden rounded-xl bg-gradient-to-br from-brand-header via-brand-header-secondary to-brand-primary p-6 text-brand-header-text shadow-[var(--shadow-card)]">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/5" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="h-9 w-12 rounded bg-brand-accent/80" />
          <span className="text-xs font-medium tracking-[0.2em] text-brand-accent">
            {BRAND_LABELS[brand]}
          </span>
        </div>

        <p className="font-mono text-lg tracking-[0.2em] sm:text-xl">{displayNumber}</p>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.15em] text-brand-header-text/60">
              Card Holder
            </p>
            <p className="truncate text-sm font-medium uppercase">
              {cardName || "YOUR NAME"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-brand-header-text/60">
              Expires
            </p>
            <p className="font-mono text-sm">{expiry || "MM/YY"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
