export interface CouponDefinition {
  code: string;
  label: string;
  type: "percent" | "flat";
  value: number;
  minSubtotal: number;
}

export const DEMO_COUPONS: CouponDefinition[] = [
  { code: "VELORA10", label: "10% off everything", type: "percent", value: 10, minSubtotal: 0 },
  { code: "FUNKY50", label: "₹50 off orders above ₹200", type: "flat", value: 50, minSubtotal: 200 },
  { code: "WELCOME15", label: "15% off above ₹100", type: "percent", value: 15, minSubtotal: 100 },
];

export function resolveCoupon(
  code: string,
  subtotal: number,
): { ok: true; coupon: CouponDefinition; discountAmount: number } | { ok: false; error: string } {
  const normalized = code.trim().toUpperCase();
  const coupon = DEMO_COUPONS.find((c) => c.code === normalized);

  if (!coupon) {
    return { ok: false, error: "Invalid coupon code." };
  }

  if (subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      error: `Minimum order ₹${coupon.minSubtotal} required for ${coupon.code}.`,
    };
  }

  const discountAmount =
    coupon.type === "percent"
      ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
      : Math.min(coupon.value, subtotal);

  return { ok: true, coupon, discountAmount };
}
