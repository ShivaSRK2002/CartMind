import type {
  AdminCustomerSummary,
  BehavioralEventName,
  DashboardKpis,
  EventMetric,
  RevenueTrendPoint,
} from "cartmind-shared-types";
import { pool } from "../db/pool";

interface CustomerSummaryRow {
  id: string;
  name: string;
  email: string;
  order_count: string;
  lifetime_value: string | null;
}

interface KpiRow {
  revenue: string | null;
  orders: string;
  customers: string;
}

interface EventCountRow {
  event_type: BehavioralEventName;
  count: string;
}

interface RevenueDayRow {
  day_label: string;
  revenue: string;
}

function toCustomerSummary(row: CustomerSummaryRow): AdminCustomerSummary {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    orderCount: Number(row.order_count),
    lifetimeValue: Number(row.lifetime_value ?? 0),
  };
}

export async function fetchCustomers(): Promise<AdminCustomerSummary[]> {
  const result = await pool.query<CustomerSummaryRow>(
    `SELECT
       u.id,
       u.name,
       u.email,
       count(o.id) FILTER (WHERE o.status = 'paid') AS order_count,
       COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0) AS lifetime_value
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     WHERE u.role = 'customer'
     GROUP BY u.id, u.name, u.email
     ORDER BY lifetime_value DESC`,
  );
  return result.rows.map(toCustomerSummary);
}

export async function fetchLiveKpis(): Promise<DashboardKpis> {
  const kpiResult = await pool.query<KpiRow>(
    `SELECT
       COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0) AS revenue,
       count(o.id) FILTER (WHERE o.status = 'paid') AS orders,
       (SELECT count(*) FROM users WHERE role = 'customer') AS customers
     FROM orders o`,
  );

  const row = kpiResult.rows[0];
  const revenue = Number(row.revenue ?? 0);
  const orders = Number(row.orders);
  const customers = Number(row.customers);

  const eventResult = await pool.query<{ count: string }>(
    `SELECT count(*) AS count FROM events WHERE occurred_at >= now() - interval '24 hours'`,
  );
  const eventVolume24h = Number(eventResult.rows[0]?.count ?? 0);

  const viewsResult = await pool.query<{ count: string }>(
    `SELECT count(*) AS count FROM events
     WHERE event_type = 'product_viewed' AND occurred_at >= now() - interval '7 days'`,
  );
  const views = Number(viewsResult.rows[0]?.count ?? 0);
  const conversionRate = views > 0 ? Number(((orders / views) * 100).toFixed(2)) : 0;

  return {
    revenue,
    orders,
    customers,
    conversionRate,
    avgOrderValue: orders > 0 ? Number((revenue / orders).toFixed(2)) : 0,
    eventVolume24h,
  };
}

export async function fetchLiveEvents(): Promise<EventMetric[]> {
  const result = await pool.query<EventCountRow>(
    `SELECT event_type, count(*) AS count
     FROM events
     WHERE occurred_at >= now() - interval '7 days'
     GROUP BY event_type`,
  );

  const counts = new Map(result.rows.map((r) => [r.event_type, Number(r.count)]));
  const eventTypes: BehavioralEventName[] = [
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

  const prevResult = await pool.query<EventCountRow>(
    `SELECT event_type, count(*) AS count
     FROM events
     WHERE occurred_at >= now() - interval '14 days'
       AND occurred_at < now() - interval '7 days'
     GROUP BY event_type`,
  );
  const prevCounts = new Map(prevResult.rows.map((r) => [r.event_type, Number(r.count)]));

  return eventTypes.map((eventType) => {
    const count = counts.get(eventType) ?? 0;
    const prev = prevCounts.get(eventType) ?? 0;
    const trendPct = prev > 0 ? Math.round(((count - prev) / prev) * 100) : count > 0 ? 100 : 0;
    return { eventType, count, trendPct };
  });
}

export async function fetchRevenueTrend(): Promise<RevenueTrendPoint[]> {
  const result = await pool.query<RevenueDayRow>(
    `SELECT
       to_char(date_trunc('day', created_at), 'Dy') AS day_label,
       COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) AS revenue
     FROM orders
     WHERE created_at >= now() - interval '7 days'
     GROUP BY date_trunc('day', created_at)
     ORDER BY date_trunc('day', created_at)`,
  );

  if (result.rows.length === 0) {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({ label, value: 0 }));
  }

  return result.rows.map((r) => ({
    label: r.day_label.trim(),
    value: Number(r.revenue),
  }));
}
