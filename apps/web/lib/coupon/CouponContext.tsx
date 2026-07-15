"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CouponDefinition } from "cartmind-shared-types";
import { resolveCoupon } from "cartmind-shared-types";

export interface AppliedCoupon {
  coupon: CouponDefinition;
  discountAmount: number;
}

interface CouponContextValue {
  applied: AppliedCoupon | null;
  applyCoupon: (code: string, subtotal: number) => { error: string } | { discountAmount: number; couponCode: string };
  clearCoupon: () => void;
}

const CouponContext = createContext<CouponContextValue | null>(null);
const STORAGE_KEY = "velora_coupon";

export function CouponProvider({ children }: { children: ReactNode }) {
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setApplied(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (applied) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(applied));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [applied, isHydrated]);

  function applyCoupon(code: string, subtotal: number) {
    const result = resolveCoupon(code, subtotal);
    if (!result.ok) return { error: result.error };
    setApplied({ coupon: result.coupon, discountAmount: result.discountAmount });
    return { discountAmount: result.discountAmount, couponCode: result.coupon.code };
  }

  function clearCoupon() {
    setApplied(null);
  }

  return (
    <CouponContext.Provider value={{ applied, applyCoupon, clearCoupon }}>
      {children}
    </CouponContext.Provider>
  );
}

export function useCoupon(): CouponContextValue {
  const ctx = useContext(CouponContext);
  if (!ctx) throw new Error("useCoupon must be used within CouponProvider");
  return ctx;
}
