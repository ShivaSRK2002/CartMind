import type {
  AdminCustomerSummary,
  BehavioralEventName,
  DashboardKpis,
  EngagementInsights,
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

/**
 * On-site engagement analytics derived from the raw behavioral event stream:
 *  - a catalogue heatmap (per-product view / cart / purchase density), and
 *  - an engagement-depth funnel — the share of sessions that progress from a
 *    product view through to a purchase (a proxy for scroll / attention depth).
 */
export async function fetchEngagement(): Promise<EngagementInsights> {
  const heatResult = await pool.query<{
    product_id: string;
    name: string;
    category: string;
    views: string;
    add_to_carts: string;
    purchases: string;
  }>(
    `WITH ev AS (
       SELECT payload->>'productId' AS product_id, event_type
       FROM events
       WHERE occurred_at >= now() - interval '30 days'
         AND payload ? 'productId'
     )
     SELECT p.id AS product_id, p.name, p.category,
            count(*) FILTER (WHERE ev.event_type = 'product_viewed') AS views,
            count(*) FILTER (WHERE ev.event_type = 'add_to_cart')    AS add_to_carts,
            COALESCE(pur.qty, 0) AS purchases
     FROM products p
     LEFT JOIN ev ON ev.product_id = p.id::text
     LEFT JOIN (
       SELECT oi.product_id, SUM(oi.quantity) AS qty
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id AND o.status = 'paid'
       GROUP BY oi.product_id
     ) pur ON pur.product_id = p.id
     GROUP BY p.id, p.name, p.category, pur.qty
     ORDER BY views DESC, purchases DESC
     LIMIT 24`,
  );

  const maxViews = Math.max(1, ...heatResult.rows.map((r) => Number(r.views)));
  const heatmap = heatResult.rows.map((r) => ({
    productId: r.product_id,
    name: r.name,
    category: r.category,
    views: Number(r.views),
    addToCarts: Number(r.add_to_carts),
    purchases: Number(r.purchases),
    intensity: Number((Number(r.views) / maxViews).toFixed(3)),
  }));

  const funnelResult = await pool.query<{
    viewed: string;
    carted: string;
    checkout: string;
    purchased: string;
  }>(
    `SELECT
       count(DISTINCT session_id) FILTER (WHERE event_type = 'product_viewed')   AS viewed,
       count(DISTINCT session_id) FILTER (WHERE event_type = 'add_to_cart')      AS carted,
       count(DISTINCT session_id) FILTER (WHERE event_type = 'checkout_started') AS checkout,
       count(DISTINCT session_id) FILTER (WHERE event_type = 'payment_success')  AS purchased
     FROM events
     WHERE occurred_at >= now() - interval '30 days'`,
  );
  const f = funnelResult.rows[0] ?? { viewed: "0", carted: "0", checkout: "0", purchased: "0" };
  const entry = Math.max(1, Number(f.viewed));
  const depthFunnel = [
    { stage: "Viewed a product", sessions: Number(f.viewed) },
    { stage: "Added to cart", sessions: Number(f.carted) },
    { stage: "Started checkout", sessions: Number(f.checkout) },
    { stage: "Completed purchase", sessions: Number(f.purchased) },
  ].map((s) => ({ ...s, pctOfEntry: Number(((s.sessions / entry) * 100).toFixed(1)) }));

  const depthResult = await pool.query<{ avg: string | null; median: string | null }>(
    `WITH per_session AS (
       SELECT session_id, count(*) AS depth
       FROM events
       WHERE occurred_at >= now() - interval '30 days'
       GROUP BY session_id
     )
     SELECT AVG(depth) AS avg,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY depth) AS median
     FROM per_session`,
  );
  const d = depthResult.rows[0] ?? { avg: "0", median: "0" };

  return {
    heatmap,
    depthFunnel,
    avgEventsPerSession: Number(Number(d.avg ?? 0).toFixed(1)),
    medianSessionDepth: Number(Number(d.median ?? 0).toFixed(1)),
  };
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
