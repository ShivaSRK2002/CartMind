import { describe, expect, it } from "vitest";
import { resolveCoupon } from "cartmind-shared-types";

describe("resolveCoupon", () => {
  it("applies VELORA10 percent discount", () => {
    const result = resolveCoupon("VELORA10", 200);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.discountAmount).toBe(20);
    }
  });

  it("rejects FUNKY50 when subtotal is below minimum", () => {
    const result = resolveCoupon("FUNKY50", 100);
    expect(result.ok).toBe(false);
  });
});
