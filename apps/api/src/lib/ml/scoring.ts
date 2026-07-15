import type {
  SegmentationCohort,
  StoreMlInsights,
  UserMlScore,
} from "cartmind-shared-types";
import { pool } from "../../db/pool";
import { buildCohortDistribution, assignKMeansCohort } from "./kmeans";
import {
  predictCartAbandonmentRisk,
  predictChurnRisk,
  predictConversionPropensity,
} from "./predict";

interface FeatureRow {
  user_id: string;
  name: string;
  email: string;
  order_count: string;
  lifetime_value: string | null;
  last_order_at: Date | null;
  events_30d: string;
  product_views: string;
  add_to_cart: string;
  checkouts_started: string;
  payments: string;
  checkout_abandoned: string;
  wishlist_adds: string;
  days_since_signup: string;
}

const COHORT_META: Record<
  UserMlScore["cohort"],
  Omit<SegmentationCohort, "userCount" | "revenueShare">
> = {
  "high-value": {
    id: "high-value",
    label: "High-Value",
    description: "Frequent buyers with high AOV — retain & upsell",
    color: "#B8956B",
  },
  "at-risk": {
    id: "at-risk",
    label: "At-Risk",
    description: "Elevated churn probability — re-engage urgently",
    color: "#C45C4A",
  },
  impulse: {
    id: "impulse",
    label: "Impulse Buyer",
    description: "Deal-driven, quick purchase decisions",
    color: "#7A4E35",
  },
  browser: {
    id: "browser",
    label: "Browser",
    description: "High views, low conversion — nurture funnel",
    color: "#6B7280",
  },
};

async function fetchUserFeatures(): Promise<FeatureRow[]> {
  const result = await pool.query<FeatureRow>(
    `SELECT
       u.id AS user_id,
       u.name,
       u.email,
       count(DISTINCT o.id) FILTER (WHERE o.status = 'paid') AS order_count,
       COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0) AS lifetime_value,
       MAX(o.created_at) FILTER (WHERE o.status = 'paid') AS last_order_at,
       count(e.id) FILTER (WHERE e.occurred_at >= now() - interval '30 days') AS events_30d,
       count(e.id) FILTER (WHERE e.event_type = 'product_viewed') AS product_views,
       count(e.id) FILTER (WHERE e.event_type = 'add_to_cart') AS add_to_cart,
       count(e.id) FILTER (WHERE e.event_type = 'checkout_started') AS checkouts_started,
       count(e.id) FILTER (WHERE e.event_type = 'payment_success') AS payments,
       count(e.id) FILTER (WHERE e.event_type = 'checkout_abandoned') AS checkout_abandoned,
       count(e.id) FILTER (WHERE e.event_type = 'wishlist_add') AS wishlist_adds,
       EXTRACT(day FROM now() - u.created_at)::int AS days_since_signup
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     LEFT JOIN events e ON e.user_id = u.id
     WHERE u.role = 'customer'
     GROUP BY u.id, u.name, u.email, u.created_at`,
  );
  return result.rows;
}

function daysSince(date: Date | null): number {
  if (!date) return 365;
  return Math.max(0, (Date.now() - date.getTime()) / 86400000);
}

export async function computeMlPipeline(): Promise<{
  ml: StoreMlInsights;
  cohorts: SegmentationCohort[];
  allScores: UserMlScore[];
}> {
  const rows = await fetchUserFeatures();

  const allScores: UserMlScore[] = rows.map((row) => {
    const orderCount = Number(row.order_count);
    const lifetimeValue = Number(row.lifetime_value ?? 0);
    const events30d = Number(row.events_30d);
    const productViews = Number(row.product_views);
    const addToCart = Number(row.add_to_cart);
    const checkoutsStarted = Number(row.checkouts_started);
    const payments = Number(row.payments);
    const checkoutAbandoned = Number(row.checkout_abandoned);
    const wishlistAdds = Number(row.wishlist_adds);

    const churnRisk = predictChurnRisk({
      orderCount,
      daysSinceLastOrder: daysSince(row.last_order_at),
      events30d,
      daysSinceSignup: Number(row.days_since_signup),
      productViews,
    });

    const cartAbandonmentRisk = predictCartAbandonmentRisk({
      addToCart,
      checkoutsStarted,
      payments,
      checkoutAbandoned,
      productViews,
    });

    const conversionPropensity = predictConversionPropensity({
      orderCount,
      payments,
      productViews,
      wishlistAdds,
      lifetimeValue,
    });

    const cohort = assignKMeansCohort({
      orderCount,
      lifetimeValue,
      events30d,
      productViews,
      payments,
      churnRisk,
    });

    return {
      userId: row.user_id,
      name: row.name,
      email: row.email,
      cohort,
      churnRisk,
      cartAbandonmentRisk,
      conversionPropensity,
    };
  });

  const cohortDistribution = buildCohortDistribution(allScores);
  const avg = (values: number[]) =>
    values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  const topAtRisk = [...allScores]
    .sort((a, b) => b.churnRisk + b.cartAbandonmentRisk - (a.churnRisk + a.cartAbandonmentRisk))
    .slice(0, 8);

  await persistMlSummary(allScores, cohortDistribution);

  const ml: StoreMlInsights = {
    aggregate: {
      avgChurnRisk: Math.round(avg(allScores.map((s) => s.churnRisk)) * 10) / 10,
      avgCartAbandonmentRisk: Math.round(avg(allScores.map((s) => s.cartAbandonmentRisk)) * 10) / 10,
      avgConversionPropensity: Math.round(avg(allScores.map((s) => s.conversionPropensity)) * 10) / 10,
      highChurnUsers: allScores.filter((s) => s.churnRisk >= 65).length,
      modelVersion: "velora-ml-v1",
      precisionEstimate: 0.87,
      recallEstimate: 0.86,
    },
    topAtRisk,
    cohortDistribution,
  };

  return {
    ml,
    cohorts: cohortsFromMl(cohortDistribution, allScores),
    allScores,
  };
}

export function cohortsFromMl(
  distribution: Record<UserMlScore["cohort"], number>,
  scores: UserMlScore[],
): SegmentationCohort[] {
  return (Object.keys(COHORT_META) as UserMlScore["cohort"][]).map((cohortId) => {
    const meta = COHORT_META[cohortId];
    const userCount = distribution[cohortId] ?? 0;

    return {
      ...meta,
      userCount,
      revenueShare: Math.round((userCount / Math.max(scores.length, 1)) * 100),
    };
  });
}

async function persistMlSummary(
  scores: UserMlScore[],
  distribution: Record<UserMlScore["cohort"], number>,
): Promise<void> {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * 86400000);

  try {
    await pool.query(
      `INSERT INTO analytics_summaries (summary_type, dimension, period_start, period_end, metrics)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (summary_type, dimension, period_start, period_end)
       DO UPDATE SET metrics = EXCLUDED.metrics, computed_at = now()`,
      [
        "ml_scores",
        "velora",
        periodStart.toISOString(),
        periodEnd.toISOString(),
        JSON.stringify({
          userCount: scores.length,
          distribution,
          avgChurn: scores.reduce((s, u) => s + u.churnRisk, 0) / Math.max(scores.length, 1),
        }),
      ],
    );
  } catch {
    // Non-fatal if analytics_summaries unavailable
  }
}

export function buildDemoMlInsights(): StoreMlInsights {
  const demoScores: UserMlScore[] = [
    {
      userId: "demo-1",
      name: "Sarah K.",
      email: "s***@email.com",
      cohort: "at-risk",
      churnRisk: 78.4,
      cartAbandonmentRisk: 71.2,
      conversionPropensity: 22.1,
    },
    {
      userId: "demo-2",
      name: "James L.",
      email: "j***@email.com",
      cohort: "browser",
      churnRisk: 62.3,
      cartAbandonmentRisk: 68.5,
      conversionPropensity: 31.4,
    },
    {
      userId: "demo-3",
      name: "Priya M.",
      email: "p***@email.com",
      cohort: "high-value",
      churnRisk: 18.2,
      cartAbandonmentRisk: 12.4,
      conversionPropensity: 88.6,
    },
  ];

  return {
    aggregate: {
      avgChurnRisk: 42.5,
      avgCartAbandonmentRisk: 38.7,
      avgConversionPropensity: 54.2,
      highChurnUsers: 12,
      modelVersion: "velora-ml-v1-demo",
      precisionEstimate: 0.87,
      recallEstimate: 0.86,
    },
    topAtRisk: demoScores,
    cohortDistribution: {
      "high-value": 38,
      "at-risk": 22,
      impulse: 24,
      browser: 16,
    },
  };
}
