"""Pulls real feature vectors for the live Postgres data.

The user-level query mirrors `fetchUserFeatures()` in
apps/api/src/lib/ml/scoring.ts exactly, so a model trained on
`synthetic.generate_user_dataset()` (same column names) can score real rows
without any train/serve skew.
"""

from __future__ import annotations

from datetime import datetime, timezone

import pandas as pd

from .db import fetch_dicts

USER_FEATURES_QUERY = """
SELECT
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
 GROUP BY u.id, u.name, u.email, u.created_at
"""


def _days_since(value) -> float:
    if value is None:
        return 365.0
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    delta = datetime.now(timezone.utc) - value
    return max(0.0, delta.total_seconds() / 86400)


def fetch_live_user_features(conn) -> pd.DataFrame:
    rows = fetch_dicts(conn, USER_FEATURES_QUERY)
    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    numeric_cols = [
        "order_count",
        "lifetime_value",
        "events_30d",
        "product_views",
        "add_to_cart",
        "checkouts_started",
        "payments",
        "checkout_abandoned",
        "wishlist_adds",
        "days_since_signup",
    ]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col])

    df["days_since_last_order"] = df["last_order_at"].apply(_days_since)
    df["cart_to_view_ratio"] = df["add_to_cart"] / df["product_views"].clip(lower=1)
    df["checkout_to_cart_ratio"] = df["checkouts_started"] / df["add_to_cart"].clip(lower=1)
    return df


PRODUCT_INTERACTIONS_QUERY = """
SELECT user_id, product_id, weight FROM (
  SELECT
    o.user_id AS user_id,
    oi.product_id AS product_id,
    5 AS weight
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status = 'paid' AND o.user_id IS NOT NULL

  UNION ALL

  SELECT
    e.user_id AS user_id,
    (e.payload->>'productId')::uuid AS product_id,
    3 AS weight
  FROM events e
  WHERE e.event_type = 'add_to_cart' AND e.user_id IS NOT NULL AND e.payload ? 'productId'

  UNION ALL

  SELECT
    e.user_id AS user_id,
    (e.payload->>'productId')::uuid AS product_id,
    1 AS weight
  FROM events e
  WHERE e.event_type = 'product_viewed' AND e.user_id IS NOT NULL AND e.payload ? 'productId'
) interactions
WHERE product_id IS NOT NULL
"""


def fetch_product_interactions(conn) -> pd.DataFrame:
    rows = fetch_dicts(conn, PRODUCT_INTERACTIONS_QUERY)
    if not rows:
        return pd.DataFrame(columns=["user_id", "product_id", "weight"])
    df = pd.DataFrame(rows)
    df["weight"] = pd.to_numeric(df["weight"])
    return df
