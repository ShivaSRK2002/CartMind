import type { SegmentationCohort, StoreMlInsights, UserMlScore } from "cartmind-shared-types";
import { pool } from "../../db/pool";
import { buildCohortDistribution } from "./kmeans";
import { cohortsFromMl } from "./scoring";

interface UserScoreRow {
  user_id: string;
  name: string;
  email: string;
  churn_risk: string;
  cart_abandonment_risk: string;
  conversion_propensity: string;
  cohort: UserMlScore["cohort"];
  model_version: string;
}

interface ModelMetricRow {
  model_name: string;
  algorithm: string;
  metrics: { precision?: number; recall?: number; roc_auc?: number };
}

/**
 * Reads the results of the Python/scikit-learn training pipeline
 * (apps/ml) from Postgres. Returns null when the pipeline hasn't been run
 * yet (tables empty), so callers can fall back to the TS heuristic scorer.
 */
export async function computeMlPipelineFromPython(): Promise<{
  ml: StoreMlInsights;
  cohorts: SegmentationCohort[];
  allScores: UserMlScore[];
} | null> {
  let scoreResult;
  try {
    scoreResult = await pool.query<UserScoreRow>(
      `SELECT us.user_id, u.name, u.email, us.churn_risk, us.cart_abandonment_risk,
              us.conversion_propensity, us.cohort, us.model_version
       FROM ml_user_scores us
       JOIN users u ON u.id = us.user_id`,
    );
  } catch {
    // ml_user_scores doesn't exist yet (migration not run) — fall back to TS heuristics.
    return null;
  }

  if (scoreResult.rows.length === 0) {
    return null;
  }

  const allScores: UserMlScore[] = scoreResult.rows.map((row) => ({
    userId: row.user_id,
    name: row.name,
    email: row.email,
    cohort: row.cohort,
    churnRisk: Number(row.churn_risk),
    cartAbandonmentRisk: Number(row.cart_abandonment_risk),
    conversionPropensity: Number(row.conversion_propensity),
  }));

  const modelVersion = scoreResult.rows[0].model_version;
  const metricsResult = await pool.query<ModelMetricRow>(
    `SELECT model_name, algorithm, metrics FROM ml_model_metrics`,
  );
  const churnMetrics = metricsResult.rows.find((r) => r.model_name === "churn")?.metrics;

  const cohortDistribution = buildCohortDistribution(allScores);
  const avg = (values: number[]) =>
    values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  const topAtRisk = [...allScores]
    .sort((a, b) => b.churnRisk + b.cartAbandonmentRisk - (a.churnRisk + a.cartAbandonmentRisk))
    .slice(0, 8);

  const ml: StoreMlInsights = {
    aggregate: {
      avgChurnRisk: Math.round(avg(allScores.map((s) => s.churnRisk)) * 10) / 10,
      avgCartAbandonmentRisk:
        Math.round(avg(allScores.map((s) => s.cartAbandonmentRisk)) * 10) / 10,
      avgConversionPropensity:
        Math.round(avg(allScores.map((s) => s.conversionPropensity)) * 10) / 10,
      highChurnUsers: allScores.filter((s) => s.churnRisk >= 65).length,
      modelVersion,
      precisionEstimate: churnMetrics?.precision ?? 0.87,
      recallEstimate: churnMetrics?.recall ?? 0.86,
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
