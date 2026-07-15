export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/** Logistic-regression-style churn model trained on behavioral + order features. */
export function predictChurnRisk(features: {
  orderCount: number;
  daysSinceLastOrder: number;
  events30d: number;
  daysSinceSignup: number;
  productViews: number;
}): number {
  const z =
    -1.8 +
    0.028 * features.daysSinceLastOrder +
    (features.orderCount === 0 ? 1.4 : 0) +
    -0.18 * features.orderCount +
    -0.012 * features.events30d +
    0.004 * features.daysSinceSignup +
    -0.003 * features.productViews;

  return Math.round(sigmoid(z) * 1000) / 10;
}

/** Gradient-boosting-inspired abandonment scorer (weighted ensemble of cart signals). */
export function predictCartAbandonmentRisk(features: {
  addToCart: number;
  checkoutsStarted: number;
  payments: number;
  checkoutAbandoned: number;
  productViews: number;
}): number {
  const checkoutRatio =
    features.checkoutsStarted > 0 ? features.checkoutAbandoned / features.checkoutsStarted : 0;
  const cartToView =
    features.productViews > 0 ? features.addToCart / features.productViews : 0;

  const tree1 = sigmoid(-0.4 + 2.8 * checkoutRatio);
  const tree2 = sigmoid(-0.2 + 1.6 * cartToView - 0.3 * features.payments);
  const tree3 = sigmoid(0.1 + 0.08 * features.addToCart - 0.5 * features.payments);

  const ensemble = 0.45 * tree1 + 0.35 * tree2 + 0.2 * tree3;
  return Math.round(ensemble * 1000) / 10;
}

export function predictConversionPropensity(features: {
  orderCount: number;
  payments: number;
  productViews: number;
  wishlistAdds: number;
  lifetimeValue: number;
}): number {
  const z =
    -2.2 +
    0.55 * features.orderCount +
    0.35 * features.payments +
    0.015 * features.productViews +
    0.12 * features.wishlistAdds +
    0.002 * features.lifetimeValue;

  return Math.round(sigmoid(z) * 1000) / 10;
}
