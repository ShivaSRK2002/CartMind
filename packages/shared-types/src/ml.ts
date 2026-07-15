export interface UserBehaviorFeatures {
  userId: string;
  name: string;
  email: string;
  orderCount: number;
  lifetimeValue: number;
  lastOrderAt: string | null;
  events30d: number;
  productViews: number;
  addToCart: number;
  checkoutsStarted: number;
  payments: number;
  checkoutAbandoned: number;
  wishlistAdds: number;
  daysSinceSignup: number;
}

export interface UserMlScore {
  userId: string;
  name: string;
  email: string;
  cohort: "high-value" | "at-risk" | "impulse" | "browser";
  churnRisk: number;
  cartAbandonmentRisk: number;
  conversionPropensity: number;
}

export interface MlAggregateScores {
  avgChurnRisk: number;
  avgCartAbandonmentRisk: number;
  avgConversionPropensity: number;
  highChurnUsers: number;
  modelVersion: string;
  precisionEstimate: number;
  recallEstimate: number;
}

export interface StoreMlInsights {
  aggregate: MlAggregateScores;
  topAtRisk: UserMlScore[];
  cohortDistribution: Record<UserMlScore["cohort"], number>;
}

export interface InsightChatRequest {
  storeId: string;
  message: string;
}

export interface InsightChatResponse {
  reply: string;
  model: string;
  usedFallback: boolean;
}
