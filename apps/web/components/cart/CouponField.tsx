"use client";

import { useState, type FormEvent } from "react";
import { trackCouponApplied } from "@/lib/analytics/track";
import { useCoupon } from "@/lib/coupon/CouponContext";
import { formatPrice } from "@/lib/productMeta";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const HINT_CODES = ["VELORA10", "FUNKY50", "WELCOME15"];

export function CouponField({ subtotal }: { subtotal: number }) {
  const { applied, applyCoupon, clearCoupon } = useCoupon();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleApply(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const result = applyCoupon(code, subtotal);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    trackCouponApplied(result.couponCode, result.discountAmount);
    setCode("");
  }

  return (
    <div className="mt-6 border-t border-border-subtle pt-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Promo Code</p>

      {applied ? (
        <div className="mt-3 flex items-center justify-between rounded-md border border-brand-success/30 bg-brand-success/5 px-4 py-3 text-sm">
          <div>
            <span className="font-medium text-brand-success">{applied.coupon.code}</span>
            <span className="ml-2 text-text-muted">−{formatPrice(applied.discountAmount)}</span>
          </div>
          <button
            type="button"
            onClick={clearCoupon}
            className="text-xs uppercase tracking-[0.12em] text-text-muted hover:text-brand-primary"
          >
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="mt-3 flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {!applied && (
        <p className="mt-2 text-xs text-text-subtle">
          Try: {HINT_CODES.join(" · ")}
        </p>
      )}
    </div>
  );
}
