type CohortId = "high-value" | "at-risk" | "impulse" | "browser";

interface Point {
  orderCount: number;
  lifetimeValue: number;
  events30d: number;
  engagement: number;
}

const COHORT_IDS: CohortId[] = ["high-value", "at-risk", "impulse", "browser"];

const SEED_CENTROIDS: Point[] = [
  { orderCount: 8, lifetimeValue: 400, events30d: 40, engagement: 0.8 },
  { orderCount: 0, lifetimeValue: 0, events30d: 3, engagement: 0.1 },
  { orderCount: 3, lifetimeValue: 80, events30d: 25, engagement: 0.5 },
  { orderCount: 0, lifetimeValue: 20, events30d: 30, engagement: 0.2 },
];

function euclidean(a: Point, b: Point, scales: Point): number {
  return (
    Math.pow((a.orderCount - b.orderCount) / scales.orderCount, 2) +
    Math.pow((a.lifetimeValue - b.lifetimeValue) / scales.lifetimeValue, 2) +
    Math.pow((a.events30d - b.events30d) / scales.events30d, 2) +
    Math.pow((a.engagement - b.engagement) / scales.engagement, 2)
  );
}

function toPoint(features: {
  orderCount: number;
  lifetimeValue: number;
  events30d: number;
  productViews: number;
  payments: number;
}): Point {
  const engagement =
    features.productViews > 0 ? features.payments / features.productViews : 0;
  return {
    orderCount: features.orderCount,
    lifetimeValue: features.lifetimeValue,
    events30d: features.events30d,
    engagement: Math.min(1, engagement * 10),
  };
}

export function assignKMeansCohort(features: {
  orderCount: number;
  lifetimeValue: number;
  events30d: number;
  productViews: number;
  payments: number;
  churnRisk: number;
}): CohortId {
  const point = toPoint(features);
  const scales: Point = {
    orderCount: 10,
    lifetimeValue: 500,
    events30d: 50,
    engagement: 1,
  };

  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < SEED_CENTROIDS.length; i++) {
    const dist = euclidean(point, SEED_CENTROIDS[i], scales);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  if (features.churnRisk >= 70 && features.orderCount > 0) {
    return "at-risk";
  }

  return COHORT_IDS[bestIdx];
}

export function buildCohortDistribution(
  scores: { cohort: CohortId }[],
): Record<CohortId, number> {
  const dist: Record<CohortId, number> = {
    "high-value": 0,
    "at-risk": 0,
    impulse: 0,
    browser: 0,
  };
  for (const score of scores) {
    dist[score.cohort]++;
  }
  return dist;
}
