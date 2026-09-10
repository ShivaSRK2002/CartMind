import type { StoreDashboard } from "cartmind-shared-types";
import { buildDemoMlInsights, computeMlPipeline } from "../lib/ml/scoring";
import { computeMlPipelineFromPython } from "../lib/ml/pythonScores";
import {
  buildDemoDashboard,
  getStoreById,
} from "../lib/stores";
import {
  fetchCustomers,
  fetchEngagement,
  fetchLiveEvents,
  fetchLiveKpis,
  fetchRevenueTrend,
} from "./admin.dashboard";

/**
 * Prefers scores from the Python/scikit-learn pipeline (apps/ml) when it has
 * been trained and run; falls back to the TS heuristic scorer otherwise so
 * the dashboard works out of the box without a Python setup.
 */
async function resolveMlPipeline() {
  const pythonPipeline = await computeMlPipelineFromPython();
  return pythonPipeline ?? computeMlPipeline();
}

export async function buildStoreDashboard(storeId: string): Promise<StoreDashboard | null> {
  const store = getStoreById(storeId);
  if (!store) return null;

  if (store.status !== "live") {
    const demo = buildDemoDashboard(store);
    return {
      store,
      ...demo,
      customers: [],
      ml: buildDemoMlInsights(),
    };
  }

  const [customers, kpis, events, revenueTrend, engagement, mlPipeline] = await Promise.all([
    fetchCustomers(),
    fetchLiveKpis(),
    fetchLiveEvents(),
    fetchRevenueTrend(),
    fetchEngagement(),
    resolveMlPipeline(),
  ]);

  return {
    store,
    kpis,
    events,
    cohorts: mlPipeline.cohorts,
    revenueTrend,
    customers,
    ml: mlPipeline.ml,
    engagement,
  };
}
