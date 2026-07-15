import type { EventMetric, SegmentationCohort, StoreDashboard } from "cartmind-shared-types";

export function buildInsightContext(dashboard: StoreDashboard): string {
  const lines: string[] = [
    `Store: ${dashboard.store.name} (${dashboard.store.status})`,
    `Revenue: $${dashboard.kpis.revenue.toFixed(2)}`,
    `Orders: ${dashboard.kpis.orders}`,
    `Customers: ${dashboard.kpis.customers}`,
    `Conversion rate: ${dashboard.kpis.conversionRate}%`,
    `Avg order value: $${dashboard.kpis.avgOrderValue.toFixed(2)}`,
    `Events (24h): ${dashboard.kpis.eventVolume24h}`,
    "",
    "Behavioral events (7 days):",
  ];

  for (const event of dashboard.events.filter((e) => e.count > 0)) {
    lines.push(`- ${event.eventType}: ${event.count} (${event.trendPct >= 0 ? "+" : ""}${event.trendPct}%)`);
  }

  lines.push("", "K-Means cohorts:");
  for (const cohort of dashboard.cohorts) {
    lines.push(`- ${cohort.label}: ${cohort.userCount} users, ${cohort.revenueShare}% revenue share`);
  }

  if (dashboard.ml) {
    lines.push(
      "",
      "ML model scores:",
      `- Model: ${dashboard.ml.aggregate.modelVersion}`,
      `- Avg churn risk: ${dashboard.ml.aggregate.avgChurnRisk}%`,
      `- Avg cart abandonment risk: ${dashboard.ml.aggregate.avgCartAbandonmentRisk}%`,
      `- Avg conversion propensity: ${dashboard.ml.aggregate.avgConversionPropensity}%`,
      `- High churn users (≥65%): ${dashboard.ml.aggregate.highChurnUsers}`,
      `- Precision estimate: ${(dashboard.ml.aggregate.precisionEstimate * 100).toFixed(0)}%`,
      `- Recall estimate: ${(dashboard.ml.aggregate.recallEstimate * 100).toFixed(0)}%`,
      "",
      "Top at-risk customers:",
    );
    for (const user of dashboard.ml.topAtRisk.slice(0, 5)) {
      lines.push(
        `- ${user.name}: churn ${user.churnRisk}%, abandon ${user.cartAbandonmentRisk}%, cohort ${user.cohort}`,
      );
    }
  }

  return lines.join("\n");
}

export function summarizeEvents(events: EventMetric[]): string {
  const total = events.reduce((sum, e) => sum + e.count, 0);
  const top = [...events].sort((a, b) => b.count - a.count).slice(0, 3);
  return `Total events: ${total}. Top: ${top.map((e) => e.eventType).join(", ")}.`;
}

export function summarizeCohorts(cohorts: SegmentationCohort[]): string {
  return cohorts.map((c) => `${c.label} (${c.userCount})`).join(", ");
}
