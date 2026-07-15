import { describe, expect, it } from "vitest";
import { predictCartAbandonmentRisk, predictChurnRisk, sigmoid } from "./predict";

describe("ML predictors", () => {
  it("sigmoid returns values between 0 and 1", () => {
    expect(sigmoid(0)).toBe(0.5);
    expect(sigmoid(10)).toBeGreaterThan(0.99);
    expect(sigmoid(-10)).toBeLessThan(0.01);
  });

  it("predicts higher churn for inactive users", () => {
    const active = predictChurnRisk({
      orderCount: 5,
      daysSinceLastOrder: 7,
      events30d: 40,
      daysSinceSignup: 100,
      productViews: 50,
    });
    const inactive = predictChurnRisk({
      orderCount: 0,
      daysSinceLastOrder: 200,
      events30d: 2,
      daysSinceSignup: 300,
      productViews: 5,
    });
    expect(inactive).toBeGreaterThan(active);
  });

  it("predicts higher abandonment when checkouts are abandoned", () => {
    const low = predictCartAbandonmentRisk({
      addToCart: 2,
      checkoutsStarted: 1,
      payments: 1,
      checkoutAbandoned: 0,
      productViews: 20,
    });
    const high = predictCartAbandonmentRisk({
      addToCart: 8,
      checkoutsStarted: 4,
      payments: 0,
      checkoutAbandoned: 4,
      productViews: 30,
    });
    expect(high).toBeGreaterThan(low);
  });
});
