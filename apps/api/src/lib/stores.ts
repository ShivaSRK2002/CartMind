import type {
  BehavioralEventName,
  DashboardKpis,
  EcommerceStore,
  EventMetric,
  RevenueTrendPoint,
  SegmentationCohort,
} from "cartmind-shared-types";

export const ECOMMERCE_STORES: EcommerceStore[] = [
  {
    id: "velora",
    name: "Velora",
    slug: "velora",
    tagline: "Shop Bold. Live Curated.",
    storefrontUrl: "http://localhost:3000",
    status: "live",
    accentColor: "#7A4E35",
  },
  {
    id: "bloommart",
    name: "BloomMart",
    slug: "bloommart",
    tagline: "Fresh picks, blooming deals.",
    storefrontUrl: "https://bloommart.demo",
    status: "demo",
    accentColor: "#2D6A4F",
  },
  {
    id: "novanest",
    name: "NovaNest",
    slug: "novanest",
    tagline: "Home & lifestyle, elevated.",
    storefrontUrl: "https://novanest.demo",
    status: "demo",
    accentColor: "#5B4FCF",
  },
  {
    id: "pulsemart",
    name: "PulseMart",
    slug: "pulsemart",
    tagline: "Electronics that move you.",
    storefrontUrl: "https://pulsemart.demo",
    status: "demo",
    accentColor: "#E85D04",
  },
];

const ALL_EVENTS: BehavioralEventName[] = [
  "product_viewed",
  "add_to_cart",
  "remove_from_cart",
  "checkout_started",
  "payment_success",
  "wishlist_add",
  "coupon_applied",
  "search_query",
  "checkout_abandoned",
];

const COHORT_TEMPLATES: Omit<SegmentationCohort, "userCount" | "revenueShare">[] = [
  {
    id: "high-value",
    label: "High-Value",
    description: "Frequent buyers with high AOV",
    color: "#B8956B",
  },
  {
    id: "at-risk",
    label: "At-Risk",
    description: "Declining engagement, churn likely",
    color: "#C45C4A",
  },
  {
    id: "impulse",
    label: "Impulse Buyer",
    description: "Quick decisions, deal-driven",
    color: "#7A4E35",
  },
  {
    id: "browser",
    label: "Browser",
    description: "High views, low conversion",
    color: "#6B7280",
  },
];

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getStoreById(storeId: string): EcommerceStore | undefined {
  return ECOMMERCE_STORES.find((s) => s.id === storeId);
}

export function buildDemoDashboard(store: EcommerceStore): {
  kpis: DashboardKpis;
  events: EventMetric[];
  cohorts: SegmentationCohort[];
  revenueTrend: RevenueTrendPoint[];
} {
  const seed = hashSeed(store.id);
  const base = 12000 + (seed % 80000);

  const kpis: DashboardKpis = {
    revenue: base + (seed % 5000),
    orders: 80 + (seed % 400),
    customers: 200 + (seed % 1500),
    conversionRate: 1.8 + (seed % 40) / 10,
    avgOrderValue: 45 + (seed % 120),
    eventVolume24h: 500 + (seed % 8000),
  };

  const events: EventMetric[] = ALL_EVENTS.map((eventType, i) => ({
    eventType,
    count: 50 + ((seed + i * 97) % 2000),
    trendPct: ((seed + i * 13) % 30) - 10,
  }));

  const cohortShares = [38, 22, 24, 16];
  const cohorts: SegmentationCohort[] = COHORT_TEMPLATES.map((c, i) => ({
    ...c,
    userCount: Math.round(kpis.customers * (cohortShares[i] / 100)),
    revenueShare: cohortShares[i],
  }));

  const revenueTrend: RevenueTrendPoint[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
    (label, i) => ({
      label,
      value: Math.round(base / 14 + ((seed + i * 41) % (base / 8))),
    }),
  );

  return { kpis, events, cohorts, revenueTrend };
}
