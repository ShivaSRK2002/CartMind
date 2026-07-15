import type { StoreDashboard } from "cartmind-shared-types";
import { buildDemoMlInsights, computeMlPipeline } from "../lib/ml/scoring";
import {
  buildDemoDashboard,
  getStoreById,
} from "../lib/stores";
import {
  fetchCustomers,
  fetchLiveEvents,
  fetchLiveKpis,
  fetchRevenueTrend,
} from "./admin.dashboard";

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

  const [customers, kpis, events, revenueTrend, mlPipeline] = await Promise.all([
    fetchCustomers(),
    fetchLiveKpis(),
    fetchLiveEvents(),
    fetchRevenueTrend(),
    computeMlPipeline(),
  ]);

  return {
    store,
    kpis,
    events,
    cohorts: mlPipeline.cohorts,
    revenueTrend,
    customers,
    ml: mlPipeline.ml,
  };
}
