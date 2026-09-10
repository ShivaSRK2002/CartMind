-- CartMind AI — Databricks AI/BI dashboard datasets
--
-- Paste each block as a separate dataset in the dashboard's Data tab
-- (Dashboards ▸ Create dashboard ▸ Data ▸ Create from SQL). The dataset
-- name in each comment is what the canvas widgets below reference.
-- All read the Gold tables produced by 02_medallion_pipeline.py.


-- ===========================================================================
-- dataset: kpis        (widgets: 3 counters — revenue, orders, AOV)
-- ===========================================================================
SELECT
  SUM(revenue)                                    AS total_revenue,
  SUM(orders)                                     AS total_orders,
  ROUND(SUM(revenue) / NULLIF(SUM(orders), 0), 2) AS avg_order_value
FROM workspace.default.gold_revenue_daily;


-- ===========================================================================
-- dataset: rates       (widgets: 2 counters — conversion %, cart abandonment %)
-- ===========================================================================
WITH e AS (
  SELECT event_type, SUM(event_count) AS n
  FROM workspace.default.gold_event_funnel
  GROUP BY event_type
)
SELECT
  ROUND(100.0 * MAX(CASE WHEN event_type = 'payment_success'  THEN n END)
             / NULLIF(MAX(CASE WHEN event_type = 'product_viewed' THEN n END), 0), 1)
    AS conversion_rate_pct,
  ROUND(100.0 * MAX(CASE WHEN event_type = 'checkout_abandoned' THEN n END)
             / NULLIF(MAX(CASE WHEN event_type = 'checkout_started'  THEN n END)
                    + MAX(CASE WHEN event_type = 'checkout_abandoned' THEN n END), 0), 1)
    AS cart_abandonment_rate_pct
FROM e;


-- ===========================================================================
-- dataset: revenue_trend       (widget: line/area — revenue & orders over time)
-- ===========================================================================
SELECT day, revenue, orders, avg_order_value
FROM workspace.default.gold_revenue_daily
ORDER BY day;


-- ===========================================================================
-- dataset: conversion_funnel   (widget: horizontal bar — the classic funnel)
-- ===========================================================================
SELECT
  CASE event_type
    WHEN 'product_viewed'   THEN '1 · Viewed'
    WHEN 'add_to_cart'      THEN '2 · Added to cart'
    WHEN 'checkout_started' THEN '3 · Checkout started'
    WHEN 'payment_success'  THEN '4 · Purchased'
  END               AS stage,
  SUM(event_count)  AS events
FROM workspace.default.gold_event_funnel
WHERE event_type IN ('product_viewed', 'add_to_cart', 'checkout_started', 'payment_success')
GROUP BY stage
ORDER BY stage;


-- ===========================================================================
-- dataset: events_over_time    (widget: stacked area — event mix by day)
-- ===========================================================================
SELECT day, event_type, event_count
FROM workspace.default.gold_event_funnel
ORDER BY day;


-- ===========================================================================
-- dataset: segments    (widgets: pie/bar of customers + bar of avg LTV)
--   SQL-rule segmentation over the Gold behavioral features. (The trained
--   k-means cohorts live in Postgres ml_user_scores / Orbit.)
-- ===========================================================================
SELECT
  CASE
    WHEN order_count >= 20 AND lifetime_value >= 5000            THEN 'High-Value'
    WHEN checkouts_started > 0 AND checkout_to_cart_ratio < 0.5  THEN 'At-Risk'
    WHEN cart_to_view_ratio >= 0.5                               THEN 'Impulse'
    ELSE 'Browser'
  END                          AS segment,
  COUNT(*)                     AS customers,
  ROUND(AVG(lifetime_value))   AS avg_ltv
FROM workspace.default.gold_user_features
GROUP BY segment
ORDER BY customers DESC;


-- ===========================================================================
-- dataset: customers   (widget: table — per-customer detail)
-- ===========================================================================
SELECT
  name,
  order_count,
  ROUND(lifetime_value, 2)          AS lifetime_value,
  events_30d,
  checkout_abandoned,
  ROUND(cart_to_view_ratio, 2)      AS cart_to_view,
  ROUND(checkout_to_cart_ratio, 2)  AS checkout_completion
FROM workspace.default.gold_user_features
ORDER BY lifetime_value DESC;


-- ===========================================================================
-- dataset: top_products    (widget: bar — most-engaged products)
--   product_id only; product names aren't carried into the Gold layer.
-- ===========================================================================
SELECT
  product_id,
  SUM(weight)              AS engagement_score,
  COUNT(DISTINCT user_id)  AS distinct_users
FROM workspace.default.gold_product_interactions
GROUP BY product_id
ORDER BY engagement_score DESC
LIMIT 15;
